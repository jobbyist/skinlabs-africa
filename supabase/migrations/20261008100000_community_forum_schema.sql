-- SkinLabs Community Forum — schema, RLS, read/moderation RPCs, counters, realtime.  (1 of 5: schema)
-- Companions: 110000 notifications + push, 130000 media + avatars, 140000 spam protection + moderation RPCs, 150000 seed content.
-- Idempotent: safe to run twice.
--
-- Design notes
--  * Identity is never read from `profiles` by clients (its RLS is owner-only). Readers get display name + role from the
--    SECURITY DEFINER read RPCs below. Staff show "First L."; members show their public handle (profiles.username).
--  * Roles come from `user_roles` via has_role() (admin | moderator), never from the client.
--  * Counters (like_count, comment_count, share_count) are maintained by triggers; clients have no UPDATE grant on them.
--    Because counters live on the post/comment row, ONE realtime subscription per table delivers every like/comment
--    change without exposing who liked what.
--  * `persona_id` lets the editorial seed content exist without creating fake login accounts (see seed migration).
--    Exactly one of author_id / persona_id is set. Real members always use author_id.
--  * `parent_id` (replies), `category`, reports and the moderation log are in place so mentions / replies /
--    bookmarks can be added later without a rewrite.

-- Member avatar (a storage path inside the member's own folder of the `avatars` bucket; see migration 20261008130000).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;
DO $av$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_path_own_folder
    CHECK (avatar_path IS NULL OR avatar_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(webp|png|jpg|jpeg)$'));
EXCEPTION WHEN duplicate_object THEN NULL; END $av$;

-- ---------------------------------------------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_categories (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  sort_order smallint NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;

INSERT INTO public.community_categories (slug, name, sort_order) VALUES
  ('routines', 'Routines', 10),
  ('sun-care', 'Sun care', 20),
  ('acne', 'Acne & marks', 30),
  ('deeper-skin-tones', 'Deeper skin tones', 40),
  ('ingredients', 'Ingredients', 50),
  ('budget-sa', 'Affordable SA picks', 60),
  ('sensitive-skin', 'Sensitive skin', 70),
  ('seasonal', 'Seasonal skin', 80),
  ('myths', 'Myths & misinformation', 90),
  ('ask-the-community', 'Ask the community', 100)
ON CONFLICT (slug) DO NOTHING;

-- Editorial personas: display-only authors for seeded content. No auth account, no login, never notified.
CREATE TABLE IF NOT EXISTS public.community_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL UNIQUE CHECK (char_length(display_name) BETWEEN 2 AND 40),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  is_seed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_personas ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.community_personas(id) ON DELETE CASCADE,
  category text REFERENCES public.community_categories(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 4 AND 140),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 10 AND 4000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'held', 'removed', 'deleted')),
  pinned boolean NOT NULL DEFAULT false,
  like_count integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  share_count integer NOT NULL DEFAULT 0 CHECK (share_count >= 0),
  image_path text CHECK (image_path IS NULL OR image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|png|jpg|jpeg|gif)$'),
  image_w integer CHECK (image_w IS NULL OR image_w BETWEEN 1 AND 8192),
  image_h integer CHECK (image_h IS NULL OR image_h BETWEEN 1 AND 8192),
  spam_flags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT community_posts_one_author CHECK (num_nonnulls(author_id, persona_id) = 1),
  CONSTRAINT community_posts_image_dims CHECK ((image_path IS NULL) = (image_w IS NULL AND image_h IS NULL))
);
CREATE INDEX IF NOT EXISTS community_posts_feed_idx
  ON public.community_posts (created_at DESC, id DESC) WHERE status = 'published' AND NOT pinned;
CREATE INDEX IF NOT EXISTS community_posts_category_idx
  ON public.community_posts (category, created_at DESC, id DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS community_posts_pinned_idx ON public.community_posts (created_at DESC) WHERE pinned AND status = 'published';
CREATE INDEX IF NOT EXISTS community_posts_author_idx ON public.community_posts (author_id, created_at DESC) WHERE author_id IS NOT NULL;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.community_personas(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1500),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'held', 'removed', 'deleted')),
  spam_flags text[] NOT NULL DEFAULT '{}',
  like_count integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT community_comments_one_author CHECK (num_nonnulls(author_id, persona_id) = 1)
);
CREATE INDEX IF NOT EXISTS community_comments_thread_idx
  ON public.community_comments (post_id, created_at, id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS community_comments_author_idx ON public.community_comments (author_id) WHERE author_id IS NOT NULL;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.community_personas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_likes_one_actor CHECK (num_nonnulls(user_id, persona_id) = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_post_likes_user_uq ON public.community_post_likes (post_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_post_likes_persona_uq ON public.community_post_likes (post_id, persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_post_likes_user_idx ON public.community_post_likes (user_id, created_at DESC) WHERE user_id IS NOT NULL;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.community_personas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_comment_likes_one_actor CHECK (num_nonnulls(user_id, persona_id) = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_comment_likes_user_uq ON public.community_comment_likes (comment_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_comment_likes_persona_uq ON public.community_comment_likes (comment_id, persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_comment_likes_user_idx ON public.community_comment_likes (user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- One row per member per post: share_count counts people, not taps.
CREATE TABLE IF NOT EXISTS public.community_post_shares (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.community_post_shares ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'medical_misinformation', 'unsafe_advice', 'self_promotion', 'other')),
  details text CHECK (details IS NULL OR char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  CONSTRAINT community_reports_one_target CHECK (num_nonnulls(post_id, comment_id) = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS community_reports_once_post ON public.community_reports (reporter_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_reports_once_comment ON public.community_reports (reporter_id, comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_reports_open_idx ON public.community_reports (created_at DESC) WHERE status = 'open';
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.community_moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('remove', 'restore', 'pin', 'unpin', 'delete_own', 'approve', 'reject', 'hold')),
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_moderation_log_target_idx ON public.community_moderation_log (target_type, target_id, created_at DESC);
ALTER TABLE public.community_moderation_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------------------------------------------
-- Role / identity helpers (SECURITY DEFINER; clients cannot call the writers, only the read helpers below)
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_is_staff(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_user_id IS NOT NULL
     AND (public.has_role(p_user_id, 'admin'::public.app_role) OR public.has_role(p_user_id, 'moderator'::public.app_role));
$$;

CREATE OR REPLACE FUNCTION public.community_actor_role(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN p_user_id IS NULL THEN 'member'
              WHEN public.has_role(p_user_id, 'admin'::public.app_role) THEN 'admin'
              WHEN public.has_role(p_user_id, 'moderator'::public.app_role) THEN 'moderator'
              ELSE 'member' END;
$$;

-- Staff: "Michael C." (first name + last initial). Members: their public handle. Never an email or a full name.
CREATE OR REPLACE FUNCTION public.community_display_name(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(
    (SELECT CASE
              WHEN public.community_is_staff(p_user_id) AND nullif(btrim(pr.full_name), '') IS NOT NULL
                THEN split_part(btrim(pr.full_name), ' ', 1)
                     || CASE WHEN position(' ' IN btrim(pr.full_name)) > 0
                             THEN ' ' || upper(left(regexp_replace(btrim(pr.full_name), '^.*\s', ''), 1)) || '.' ELSE '' END
              ELSE nullif(btrim(pr.username), '')
            END
       FROM public.profiles pr WHERE pr.user_id = p_user_id),
    'SkinLabs member');
$$;

REVOKE ALL ON FUNCTION public.community_is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_actor_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_display_name(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.community_actor_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.community_display_name(uuid) TO service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- Write guards: real handle required, account active, simple rate limits, updated_at / edited_at bookkeeping
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_guard_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_recent integer; v_limit integer;
BEGIN
  IF NEW.author_id IS NULL THEN RETURN NEW; END IF;  -- persona rows are written by migrations only
  IF NOT EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.user_id = NEW.author_id
                    AND coalesce(pr.account_status, 'active') = 'active'
                    AND nullif(btrim(pr.username), '') IS NOT NULL
                    AND coalesce(pr.username_generated, false) = false) THEN
    RAISE EXCEPTION 'handle_required' USING ERRCODE = 'P0001', HINT = 'Choose a public handle before posting.';
  END IF;
  IF TG_TABLE_NAME = 'community_posts' THEN
    v_limit := 5;
    SELECT count(*) INTO v_recent FROM public.community_posts WHERE author_id = NEW.author_id AND created_at > now() - interval '1 hour';
  ELSE
    v_limit := 30;
    SELECT count(*) INTO v_recent FROM public.community_comments WHERE author_id = NEW.author_id AND created_at > now() - interval '1 hour';
  END IF;
  IF v_recent >= v_limit THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001', HINT = 'You are posting very quickly. Try again in a little while.';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.community_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body OR (to_jsonb(NEW) ->> 'title') IS DISTINCT FROM (to_jsonb(OLD) ->> 'title') THEN
    NEW.edited_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE TRIGGER community_posts_guard_insert BEFORE INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_insert();
CREATE OR REPLACE TRIGGER community_comments_guard_insert BEFORE INSERT ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_insert();
CREATE OR REPLACE TRIGGER community_posts_touch BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_touch();
CREATE OR REPLACE TRIGGER community_comments_touch BEFORE UPDATE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_touch();

-- ---------------------------------------------------------------------------------------------------------------
-- Counters
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_sync_post_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_post uuid := coalesce(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE public.community_posts SET like_count = (SELECT count(*) FROM public.community_post_likes WHERE post_id = v_post)
   WHERE id = v_post;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.community_sync_comment_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_comment uuid := coalesce(NEW.comment_id, OLD.comment_id);
BEGIN
  UPDATE public.community_comments SET like_count = (SELECT count(*) FROM public.community_comment_likes WHERE comment_id = v_comment)
   WHERE id = v_comment;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.community_sync_post_comments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_post uuid := coalesce(NEW.post_id, OLD.post_id);
BEGIN
  UPDATE public.community_posts
     SET comment_count = (SELECT count(*) FROM public.community_comments WHERE post_id = v_post AND status = 'published'),
         last_activity_at = CASE WHEN TG_OP = 'INSERT' THEN now() ELSE last_activity_at END
   WHERE id = v_post;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.community_sync_post_shares()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.community_posts SET share_count = (SELECT count(*) FROM public.community_post_shares WHERE post_id = NEW.post_id)
   WHERE id = NEW.post_id;
  RETURN NULL;
END $$;

CREATE OR REPLACE TRIGGER community_post_likes_sync AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_post_likes();
CREATE OR REPLACE TRIGGER community_comment_likes_sync AFTER INSERT OR DELETE ON public.community_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_comment_likes();
CREATE OR REPLACE TRIGGER community_comments_count_sync AFTER INSERT OR DELETE OR UPDATE OF status ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_post_comments();
CREATE OR REPLACE TRIGGER community_shares_sync AFTER INSERT ON public.community_post_shares
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_post_shares();

REVOKE ALL ON FUNCTION public.community_guard_insert(), public.community_touch(), public.community_sync_post_likes(),
  public.community_sync_comment_likes(), public.community_sync_post_comments(), public.community_sync_post_shares()
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- RLS + grants. Column grants decide what a member can write: counters, status, pinned and authorship are never theirs.
-- ---------------------------------------------------------------------------------------------------------------
REVOKE ALL ON public.community_categories, public.community_personas, public.community_posts, public.community_comments,
  public.community_post_likes, public.community_comment_likes, public.community_post_shares, public.community_reports,
  public.community_moderation_log FROM anon, authenticated;

GRANT SELECT ON public.community_categories TO authenticated;
GRANT SELECT ON public.community_personas TO authenticated;
GRANT SELECT ON public.community_posts TO authenticated;
GRANT INSERT (title, body, category, author_id, image_path, image_w, image_h) ON public.community_posts TO authenticated;
GRANT UPDATE (title, body, category) ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_comments TO authenticated;
GRANT INSERT (post_id, parent_id, body, author_id) ON public.community_comments TO authenticated;
GRANT UPDATE (body) ON public.community_comments TO authenticated;
GRANT SELECT, DELETE ON public.community_post_likes TO authenticated;
GRANT INSERT (post_id, user_id) ON public.community_post_likes TO authenticated;
GRANT SELECT, DELETE ON public.community_comment_likes TO authenticated;
GRANT INSERT (comment_id, user_id) ON public.community_comment_likes TO authenticated;
GRANT SELECT ON public.community_reports TO authenticated;
GRANT INSERT (reporter_id, post_id, comment_id, reason, details) ON public.community_reports TO authenticated;
GRANT SELECT ON public.community_moderation_log TO authenticated;
GRANT ALL ON public.community_categories, public.community_personas, public.community_posts, public.community_comments,
  public.community_post_likes, public.community_comment_likes, public.community_post_shares, public.community_reports,
  public.community_moderation_log TO service_role;

DO $pol$ BEGIN
CREATE POLICY community_categories_read ON public.community_categories FOR SELECT TO authenticated USING (active);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_personas_read ON public.community_personas FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_posts_read ON public.community_posts FOR SELECT TO authenticated
  USING (status = 'published' OR author_id = (SELECT auth.uid()) OR public.community_is_staff((SELECT auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_posts_insert ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND persona_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_posts_update_own ON public.community_posts FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND status = 'published')
  WITH CHECK (author_id = (SELECT auth.uid()) AND status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_comments_read ON public.community_comments FOR SELECT TO authenticated
  USING (status = 'published' OR author_id = (SELECT auth.uid()) OR public.community_is_staff((SELECT auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_comments_insert ON public.community_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid())
              AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.status = 'published'));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_comments_update_own ON public.community_comments FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND status = 'published')
  WITH CHECK (author_id = (SELECT auth.uid()) AND status = 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

-- Likes: members see ONLY their own like rows (so "liked by me" works and nobody can enumerate who liked what).
DO $pol$ BEGIN
CREATE POLICY community_post_likes_own_read ON public.community_post_likes FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
CREATE POLICY community_post_likes_insert ON public.community_post_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())
              AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.status = 'published'));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
CREATE POLICY community_post_likes_delete ON public.community_post_likes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_comment_likes_own_read ON public.community_comment_likes FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
CREATE POLICY community_comment_likes_insert ON public.community_comment_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())
              AND EXISTS (SELECT 1 FROM public.community_comments c WHERE c.id = comment_id AND c.status = 'published'));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
CREATE POLICY community_comment_likes_delete ON public.community_comment_likes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_reports_insert ON public.community_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
CREATE POLICY community_reports_read ON public.community_reports FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()) OR public.community_is_staff((SELECT auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

DO $pol$ BEGIN
CREATE POLICY community_moderation_log_staff_read ON public.community_moderation_log FOR SELECT TO authenticated
  USING (public.community_is_staff((SELECT auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
-- community_post_shares has RLS on and no policy for clients: written only by community_record_share().

-- ---------------------------------------------------------------------------------------------------------------
-- Read RPCs (keyset pagination, author names/roles resolved server-side, no N+1)
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_feed(
  p_limit integer DEFAULT 15,
  p_cursor_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_post_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid, author_name text, author_role text, is_mine boolean, title text, body text, category text, category_name text,
  status text, pinned boolean, like_count integer, comment_count integer, share_count integer,
  created_at timestamptz, edited_at timestamptz, liked_by_me boolean,
  author_avatar text, image_path text, image_w integer, image_h integer
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_staff boolean; v_limit integer := least(greatest(coalesce(p_limit, 15), 1), 30);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  v_staff := public.community_is_staff(v_uid);
  RETURN QUERY
  WITH base AS (
    -- A single post (deep link): visible when published, or when it is yours / you moderate.
    SELECT p.* FROM public.community_posts p
     WHERE p_post_id IS NOT NULL AND p.id = p_post_id AND p.status <> 'deleted'
       AND (p.status = 'published' OR p.author_id = v_uid OR v_staff)
    UNION ALL
    -- Your own posts awaiting moderator review stay visible to you (first page only).
    (SELECT p.* FROM public.community_posts p
      WHERE p_post_id IS NULL AND p_cursor_at IS NULL AND p.status = 'held' AND p.author_id = v_uid
        AND (p_category IS NULL OR p.category = p_category)
      ORDER BY p.created_at DESC LIMIT 5)
    UNION ALL
    -- Pinned posts lead the first page only.
    (SELECT p.* FROM public.community_posts p
      WHERE p_post_id IS NULL AND p_cursor_at IS NULL AND p.pinned AND p.status = 'published'
        AND (p_category IS NULL OR p.category = p_category)
      ORDER BY p.created_at DESC LIMIT 5)
    UNION ALL
    (SELECT p.* FROM public.community_posts p
      WHERE p_post_id IS NULL AND p.status = 'published' AND NOT p.pinned
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_cursor_at IS NULL OR (p.created_at, p.id) < (p_cursor_at, coalesce(p_cursor_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
      ORDER BY p.created_at DESC, p.id DESC LIMIT v_limit)
  )
  SELECT b.id,
         coalesce(pe.display_name, public.community_display_name(b.author_id)),
         coalesce(pe.role, public.community_actor_role(b.author_id)),
         (b.author_id IS NOT NULL AND b.author_id = v_uid),
         b.title, b.body, b.category, cat.name, b.status, b.pinned, b.like_count, b.comment_count, b.share_count,
         b.created_at, b.edited_at,
         EXISTS (SELECT 1 FROM public.community_post_likes l WHERE l.post_id = b.id AND l.user_id = v_uid),
         pr.avatar_path, b.image_path, b.image_w, b.image_h
    FROM base b
    LEFT JOIN public.profiles pr ON pr.user_id = b.author_id
    LEFT JOIN public.community_personas pe ON pe.id = b.persona_id
    LEFT JOIN public.community_categories cat ON cat.slug = b.category
   ORDER BY (b.status = 'held') DESC, b.pinned DESC, b.created_at DESC, b.id DESC;
END $$;

CREATE OR REPLACE FUNCTION public.community_comments_page(
  p_post_id uuid,
  p_limit integer DEFAULT 30,
  p_cursor_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid, post_id uuid, parent_id uuid, author_name text, author_role text, is_mine boolean, body text,
  like_count integer, created_at timestamptz, edited_at timestamptz, liked_by_me boolean, author_avatar text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 60);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_posts p
                  WHERE p.id = p_post_id AND p.status = 'published') THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT c.id, c.post_id, c.parent_id,
         coalesce(pe.display_name, public.community_display_name(c.author_id)),
         coalesce(pe.role, public.community_actor_role(c.author_id)),
         (c.author_id IS NOT NULL AND c.author_id = v_uid),
         c.body, c.like_count, c.created_at, c.edited_at,
         EXISTS (SELECT 1 FROM public.community_comment_likes l WHERE l.comment_id = c.id AND l.user_id = v_uid),
         pr.avatar_path
    FROM public.community_comments c
    LEFT JOIN public.profiles pr ON pr.user_id = c.author_id
    LEFT JOIN public.community_personas pe ON pe.id = c.persona_id
   WHERE c.post_id = p_post_id AND c.status = 'published'
     AND (p_cursor_at IS NULL OR (c.created_at, c.id) > (p_cursor_at, coalesce(p_cursor_id, '00000000-0000-0000-0000-000000000000'::uuid)))
   ORDER BY c.created_at, c.id
   LIMIT v_limit;
END $$;

-- A single comment (used to hydrate a realtime INSERT with the author's name and role).
CREATE OR REPLACE FUNCTION public.community_comment_by_id(p_comment_id uuid)
RETURNS TABLE (
  id uuid, post_id uuid, parent_id uuid, author_name text, author_role text, is_mine boolean, body text,
  like_count integer, created_at timestamptz, edited_at timestamptz, liked_by_me boolean, author_avatar text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT c.id, c.post_id, c.parent_id,
         coalesce(pe.display_name, public.community_display_name(c.author_id)),
         coalesce(pe.role, public.community_actor_role(c.author_id)),
         (c.author_id IS NOT NULL AND c.author_id = v_uid),
         c.body, c.like_count, c.created_at, c.edited_at,
         EXISTS (SELECT 1 FROM public.community_comment_likes l WHERE l.comment_id = c.id AND l.user_id = v_uid),
         pr.avatar_path
    FROM public.community_comments c
    LEFT JOIN public.profiles pr ON pr.user_id = c.author_id
    JOIN public.community_posts p ON p.id = c.post_id AND p.status = 'published'
    LEFT JOIN public.community_personas pe ON pe.id = c.persona_id
   WHERE c.id = p_comment_id AND c.status = 'published';
END $$;

-- ---------------------------------------------------------------------------------------------------------------
-- Member + moderator actions
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_record_share(p_post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_posts WHERE id = p_post_id AND status = 'published') THEN RETURN; END IF;
  INSERT INTO public.community_post_shares (post_id, user_id) VALUES (p_post_id, v_uid) ON CONFLICT DO NOTHING;
END $$;

-- Authors soft-delete their own content. Staff use community_moderate().
CREATE OR REPLACE FUNCTION public.community_delete_own(p_type text, p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_found boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  IF p_type = 'post' THEN
    UPDATE public.community_posts SET status = 'deleted', deleted_at = now(), pinned = false
     WHERE id = p_id AND author_id = v_uid AND status <> 'deleted';
  ELSIF p_type = 'comment' THEN
    UPDATE public.community_comments SET status = 'deleted', deleted_at = now()
     WHERE id = p_id AND author_id = v_uid AND status <> 'deleted';
  ELSE
    RAISE EXCEPTION 'invalid type' USING ERRCODE = '22023';
  END IF;
  v_found := FOUND;
  IF v_found THEN
    INSERT INTO public.community_moderation_log (actor_id, target_type, target_id, action) VALUES (v_uid, p_type, p_id, 'delete_own');
  END IF;
  RETURN v_found;
END $$;

CREATE OR REPLACE FUNCTION public.community_moderate(p_type text, p_id uuid, p_action text, p_note text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_found boolean;
BEGIN
  IF v_uid IS NULL OR NOT public.community_is_staff(v_uid) THEN
    RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501';
  END IF;
  IF p_type NOT IN ('post', 'comment') OR p_action NOT IN ('remove', 'restore', 'pin', 'unpin')
     OR (p_type = 'comment' AND p_action IN ('pin', 'unpin')) THEN
    RAISE EXCEPTION 'invalid moderation request' USING ERRCODE = '22023';
  END IF;
  IF p_type = 'post' THEN
    UPDATE public.community_posts SET
        status = CASE p_action WHEN 'remove' THEN 'removed' WHEN 'restore' THEN 'published' ELSE status END,
        pinned = CASE p_action WHEN 'pin' THEN true WHEN 'unpin' THEN false WHEN 'remove' THEN false ELSE pinned END
     WHERE id = p_id AND status <> 'deleted';
  ELSE
    UPDATE public.community_comments SET
        status = CASE p_action WHEN 'remove' THEN 'removed' WHEN 'restore' THEN 'published' ELSE status END
     WHERE id = p_id AND status <> 'deleted';
  END IF;
  v_found := FOUND;
  IF v_found THEN
    INSERT INTO public.community_moderation_log (actor_id, target_type, target_id, action, note)
    VALUES (v_uid, p_type, p_id, p_action, left(p_note, 300));
    -- Acting on a report's target closes the reports against it.
    IF p_action = 'remove' THEN
      UPDATE public.community_reports SET status = 'actioned', resolved_by = v_uid, resolved_at = now()
       WHERE status = 'open' AND ((p_type = 'post' AND post_id = p_id) OR (p_type = 'comment' AND comment_id = p_id));
    END IF;
  END IF;
  RETURN v_found;
END $$;

CREATE OR REPLACE FUNCTION public.community_resolve_report(p_report_id uuid, p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.community_is_staff(v_uid) THEN
    RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('dismissed', 'actioned') THEN RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023'; END IF;
  UPDATE public.community_reports SET status = p_status, resolved_by = v_uid, resolved_at = now() WHERE id = p_report_id AND status = 'open';
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.community_feed(integer, timestamptz, uuid, text, uuid),
  public.community_comments_page(uuid, integer, timestamptz, uuid), public.community_comment_by_id(uuid),
  public.community_record_share(uuid), public.community_delete_own(text, uuid),
  public.community_moderate(text, uuid, text, text), public.community_resolve_report(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_feed(integer, timestamptz, uuid, text, uuid),
  public.community_comments_page(uuid, integer, timestamptz, uuid), public.community_comment_by_id(uuid),
  public.community_record_share(uuid), public.community_delete_own(text, uuid),
  public.community_moderate(text, uuid, text, text), public.community_resolve_report(uuid, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- Realtime: posts + comments only (like/comment counters ride on these rows). RLS still applies to what each client receives.
-- ---------------------------------------------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
  END IF;
END $$;
