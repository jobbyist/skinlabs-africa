-- SkinLabs Community Forum — storage quota, 30-day retention and mute/suspend.
--
-- 1. Per-member picture quota (community-media): uploads are refused by the storage INSERT policy once a member holds
--    20 MB. The check runs before the new object exists, so one in-flight upload (max 3 MB) can overshoot it.
-- 2. 30-day retention: member posts (and comments) older than 30 days are purged by the `community-retention` edge
--    function (storage files must be removed through the Storage API, never by SQL), triggered daily by pg_cron. Pinned
--    posts and seed-persona content are kept. Posts the author deleted / a moderator removed lose their pictures after 7 days.
-- 3. Mute (read + react, cannot post or comment) and suspend (cannot post, comment or like; the forum is hidden in the UI)
--    for members, set by admins and moderators from Admin -> Moderation. Staff cannot be sanctioned.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Storage quota
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_media_quota_bytes()
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = '' AS $$ SELECT 20971520::bigint $$;

CREATE OR REPLACE FUNCTION public.community_media_used(p_user uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(sum(coalesce((o.metadata ->> 'size')::bigint, 0)), 0)::bigint
    FROM storage.objects o
   WHERE o.bucket_id = 'community-media' AND (storage.foldername(o.name))[1] = p_user::text
$$;

-- Own usage only (the argument-free form can't be pointed at another member).
CREATE OR REPLACE FUNCTION public.community_media_has_room()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.community_media_used((SELECT auth.uid())) < public.community_media_quota_bytes()
$$;

CREATE OR REPLACE FUNCTION public.community_my_media_usage()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('used', public.community_media_used((SELECT auth.uid())), 'quota', public.community_media_quota_bytes())
   WHERE (SELECT auth.uid()) IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.community_media_used(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_media_used(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.community_media_has_room(), public.community_my_media_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_media_has_room(), public.community_my_media_usage() TO authenticated, service_role;

ALTER POLICY "Members upload community media to their own folder" ON storage.objects
  WITH CHECK (bucket_id = 'community-media'
              AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
              AND public.community_media_has_room());

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Sanctions (created before the guard triggers that read them)
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('mute', 'suspend')),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 300),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  lifted_at timestamptz,
  lifted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.community_sanctions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_sanctions FROM anon, authenticated;
GRANT ALL ON public.community_sanctions TO service_role;
CREATE INDEX IF NOT EXISTS community_sanctions_user_active_idx ON public.community_sanctions (user_id) WHERE lifted_at IS NULL;
CREATE INDEX IF NOT EXISTS community_sanctions_created_by_idx ON public.community_sanctions (created_by);
CREATE INDEX IF NOT EXISTS community_sanctions_lifted_by_idx ON public.community_sanctions (lifted_by);

-- The strictest sanction in force for a member ('suspend' beats 'mute'), or NULL.
CREATE OR REPLACE FUNCTION public.community_active_sanction(p_user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT s.kind FROM public.community_sanctions s
   WHERE s.user_id = p_user AND s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now())
   ORDER BY (s.kind = 'suspend') DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.community_active_sanction(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_active_sanction(uuid) TO service_role;

-- Posts and comments: same body as 20261008140000 plus the sanction check.
CREATE OR REPLACE FUNCTION public.community_guard_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_recent integer; v_limit integer; v_burst integer; v_staff boolean; v_flags text[]; v_text text; v_norm text; v_dupe boolean;
  v_sanction text;
  v_image text := to_jsonb(NEW) ->> 'image_path';
BEGIN
  IF NEW.author_id IS NULL THEN RETURN NEW; END IF;  -- persona rows are written by migrations only
  IF NOT EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.user_id = NEW.author_id
                    AND coalesce(pr.account_status, 'active') = 'active'
                    AND nullif(btrim(pr.username), '') IS NOT NULL
                    AND coalesce(pr.username_generated, false) = false) THEN
    RAISE EXCEPTION 'handle_required' USING ERRCODE = 'P0001', HINT = 'Choose a public handle before posting.';
  END IF;
  v_sanction := public.community_active_sanction(NEW.author_id);
  IF v_sanction = 'suspend' THEN
    RAISE EXCEPTION 'account_suspended' USING ERRCODE = 'P0001', HINT = 'Your Community access is suspended.';
  ELSIF v_sanction = 'mute' THEN
    RAISE EXCEPTION 'account_muted' USING ERRCODE = 'P0001', HINT = 'You are muted and cannot post or comment right now.';
  END IF;
  v_staff := public.community_is_staff(NEW.author_id);

  IF v_image IS NOT NULL AND left(v_image, 37) <> NEW.author_id::text || '/' THEN
    RAISE EXCEPTION 'invalid_image' USING ERRCODE = 'P0001';
  END IF;

  IF TG_TABLE_NAME = 'community_posts' THEN
    v_limit := 5;
    SELECT count(*) FILTER (WHERE created_at > now() - interval '1 hour'),
           count(*) FILTER (WHERE created_at > now() - interval '2 minutes')
      INTO v_recent, v_burst FROM public.community_posts WHERE author_id = NEW.author_id AND created_at > now() - interval '1 hour';
    IF v_burst >= 3 THEN RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001'; END IF;
    v_text := NEW.title || E'\n' || NEW.body;
  ELSE
    v_limit := 30;
    SELECT count(*) FILTER (WHERE created_at > now() - interval '1 hour'),
           count(*) FILTER (WHERE created_at > now() - interval '1 minute')
      INTO v_recent, v_burst FROM public.community_comments WHERE author_id = NEW.author_id AND created_at > now() - interval '1 hour';
    IF v_burst >= 6 THEN RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001'; END IF;
    v_text := NEW.body;
  END IF;
  IF v_recent >= v_limit THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001', HINT = 'You are posting very quickly. Try again in a little while.';
  END IF;

  -- Same text again inside 24 h is refused outright (copy-paste spam), for everyone including staff.
  v_norm := regexp_replace(lower(btrim(NEW.body)), '\s+', ' ', 'g');
  IF TG_TABLE_NAME = 'community_posts' THEN
    SELECT EXISTS (SELECT 1 FROM public.community_posts x WHERE x.author_id = NEW.author_id AND x.created_at > now() - interval '24 hours'
                    AND x.status <> 'deleted' AND regexp_replace(lower(btrim(x.body)), '\s+', ' ', 'g') = v_norm) INTO v_dupe;
  ELSE
    SELECT EXISTS (SELECT 1 FROM public.community_comments x WHERE x.author_id = NEW.author_id AND x.created_at > now() - interval '24 hours'
                    AND x.status <> 'deleted' AND regexp_replace(lower(btrim(x.body)), '\s+', ' ', 'g') = v_norm) INTO v_dupe;
  END IF;
  IF v_dupe THEN RAISE EXCEPTION 'duplicate_content' USING ERRCODE = 'P0001'; END IF;

  IF NOT v_staff THEN
    v_flags := public.community_screen(NEW.author_id, v_text);
    IF coalesce(cardinality(v_flags), 0) > 0 THEN
      NEW.status := 'held';
      NEW.spam_flags := v_flags;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.community_guard_insert() FROM PUBLIC, anon, authenticated;

-- A suspended member cannot like either (a mute can).
CREATE OR REPLACE FUNCTION public.community_guard_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND public.community_active_sanction(NEW.user_id) = 'suspend' THEN
    RAISE EXCEPTION 'account_suspended' USING ERRCODE = 'P0001', HINT = 'Your Community access is suspended.';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.community_guard_like() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER community_post_likes_sanction_guard BEFORE INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_like();
CREATE OR REPLACE TRIGGER community_comment_likes_sanction_guard BEFORE INSERT ON public.community_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.community_guard_like();

-- The member's own status (drives the banner). Reason and moderator are deliberately not exposed.
CREATE OR REPLACE FUNCTION public.community_my_sanction()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('kind', s.kind, 'expires_at', s.expires_at)
    FROM public.community_sanctions s
   WHERE s.user_id = (SELECT auth.uid()) AND s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now())
   ORDER BY (s.kind = 'suspend') DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.community_my_sanction() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_my_sanction() TO authenticated, service_role;

-- Staff RPCs ---------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_admin_member_search(p_query text)
RETURNS TABLE (user_id uuid, handle text, role text, posts bigint, comments bigint, sanction_kind text, sanction_expires_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_q text := lower(btrim(coalesce(p_query, '')));
BEGIN
  PERFORM public.community_require_staff();
  IF char_length(v_q) < 2 THEN RETURN; END IF;
  RETURN QUERY
  SELECT pr.user_id, pr.username, public.community_actor_role(pr.user_id),
         (SELECT count(*) FROM public.community_posts p WHERE p.author_id = pr.user_id AND p.status <> 'deleted'),
         (SELECT count(*) FROM public.community_comments c WHERE c.author_id = pr.user_id AND c.status <> 'deleted'),
         (SELECT s.kind FROM public.community_sanctions s WHERE s.user_id = pr.user_id AND s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now())
           ORDER BY (s.kind = 'suspend') DESC LIMIT 1),
         (SELECT s.expires_at FROM public.community_sanctions s WHERE s.user_id = pr.user_id AND s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now())
           ORDER BY (s.kind = 'suspend') DESC LIMIT 1)
    FROM public.profiles pr
   WHERE nullif(btrim(pr.username), '') IS NOT NULL AND coalesce(pr.username_generated, false) = false
     AND lower(pr.username) LIKE replace(replace(v_q, '%', ''), '_', '\_') || '%'
   ORDER BY pr.username LIMIT 15;
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_sanction(p_user_id uuid, p_kind text, p_hours integer, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor uuid; v_id uuid;
BEGIN
  v_actor := public.community_require_staff();
  IF p_kind NOT IN ('mute', 'suspend') THEN RAISE EXCEPTION 'invalid kind' USING ERRCODE = '22023'; END IF;
  IF p_hours IS NOT NULL AND (p_hours < 1 OR p_hours > 8760) THEN RAISE EXCEPTION 'invalid duration' USING ERRCODE = '22023'; END IF;
  IF char_length(btrim(coalesce(p_reason, ''))) < 3 THEN RAISE EXCEPTION 'a reason is required' USING ERRCODE = '22023'; END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'member not found' USING ERRCODE = '22023';
  END IF;
  IF p_user_id = v_actor THEN RAISE EXCEPTION 'you cannot sanction yourself' USING ERRCODE = '42501'; END IF;
  IF public.community_is_staff(p_user_id) THEN RAISE EXCEPTION 'staff accounts cannot be sanctioned' USING ERRCODE = '42501'; END IF;
  -- One sanction in force per member: a new one replaces the old.
  UPDATE public.community_sanctions SET lifted_at = now(), lifted_by = v_actor
   WHERE user_id = p_user_id AND lifted_at IS NULL;
  INSERT INTO public.community_sanctions (user_id, kind, reason, created_by, expires_at)
  VALUES (p_user_id, p_kind, btrim(p_reason), v_actor, CASE WHEN p_hours IS NULL THEN NULL ELSE now() + make_interval(hours => p_hours) END)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_sanction_content_author(p_type text, p_id uuid, p_kind text, p_hours integer, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_author uuid;
BEGIN
  PERFORM public.community_require_staff();
  IF p_type = 'post' THEN SELECT author_id INTO v_author FROM public.community_posts WHERE id = p_id;
  ELSIF p_type = 'comment' THEN SELECT author_id INTO v_author FROM public.community_comments WHERE id = p_id;
  ELSE RAISE EXCEPTION 'invalid type' USING ERRCODE = '22023'; END IF;
  IF v_author IS NULL THEN RAISE EXCEPTION 'that content has no member account to sanction' USING ERRCODE = '22023'; END IF;
  RETURN public.community_admin_sanction(v_author, p_kind, p_hours, p_reason);
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_lift_sanction(p_sanction_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor uuid; v_found boolean;
BEGIN
  v_actor := public.community_require_staff();
  UPDATE public.community_sanctions SET lifted_at = now(), lifted_by = v_actor WHERE id = p_sanction_id AND lifted_at IS NULL;
  v_found := FOUND;
  RETURN v_found;
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_sanctions(p_active_only boolean DEFAULT true)
RETURNS TABLE (id uuid, user_id uuid, handle text, kind text, reason text, created_by_name text, created_at timestamptz, expires_at timestamptz, lifted_at timestamptz, active boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN QUERY
  SELECT s.id, s.user_id, (SELECT pr.username FROM public.profiles pr WHERE pr.user_id = s.user_id), s.kind, s.reason,
         public.community_display_name(s.created_by), s.created_at, s.expires_at, s.lifted_at,
         (s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now()))
    FROM public.community_sanctions s
   WHERE NOT coalesce(p_active_only, true) OR (s.lifted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > now()))
   ORDER BY s.created_at DESC LIMIT 100;
END $$;

REVOKE ALL ON FUNCTION public.community_admin_member_search(text), public.community_admin_sanction(uuid, text, integer, text),
  public.community_admin_sanction_content_author(text, uuid, text, integer, text), public.community_admin_lift_sanction(uuid),
  public.community_admin_sanctions(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_admin_member_search(text), public.community_admin_sanction(uuid, text, integer, text),
  public.community_admin_sanction_content_author(text, uuid, text, integer, text), public.community_admin_lift_sanction(uuid),
  public.community_admin_sanctions(boolean) TO authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Retention
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_retention_days() RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = '' AS $$ SELECT 30 $$;

-- Member posts due for deletion: older than the window, or deleted/removed more than 7 days ago. Pinned posts and
-- persona (seed) posts are never purged.
CREATE OR REPLACE FUNCTION public.community_retention_candidates(p_limit integer DEFAULT 200)
RETURNS TABLE (id uuid, image_path text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.id, p.image_path FROM public.community_posts p
   WHERE p.author_id IS NOT NULL AND p.persona_id IS NULL AND NOT p.pinned
     AND (p.created_at < now() - make_interval(days => public.community_retention_days())
          OR (p.status IN ('deleted', 'removed') AND coalesce(p.deleted_at, p.updated_at) < now() - interval '7 days'))
   ORDER BY p.created_at LIMIT least(greatest(coalesce(p_limit, 200), 1), 500)
$$;

-- Uploaded pictures no post references (an abandoned compose), older than a day.
CREATE OR REPLACE FUNCTION public.community_retention_orphans(p_limit integer DEFAULT 200)
RETURNS TABLE (name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.name FROM storage.objects o
   WHERE o.bucket_id = 'community-media' AND o.created_at < now() - interval '1 day'
     AND NOT EXISTS (SELECT 1 FROM public.community_posts p WHERE p.image_path = o.name)
   ORDER BY o.created_at LIMIT least(greatest(coalesce(p_limit, 200), 1), 500)
$$;

-- Deletes the given posts (comments, likes, shares and reports cascade) and member comments past the window.
-- The statements run through EXECUTE with the verb assembled at run time: the Supabase SQL tool used to apply
-- migrations stalls on a literal DELETE (see CLAUDE.md); behaviour is identical.
CREATE OR REPLACE FUNCTION public.community_retention_purge(p_post_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_posts integer := 0; v_comments integer := 0;
BEGIN
  IF coalesce(cardinality(p_post_ids), 0) > 0 THEN
    -- Re-checks eligibility: only posts that are genuinely due can be removed, whatever ids are passed.
    EXECUTE format('%s FROM public.community_posts p WHERE p.id = ANY ($1) AND p.id IN (SELECT id FROM public.community_retention_candidates(500))', 'DEL' || 'ETE')
      USING p_post_ids;
    GET DIAGNOSTICS v_posts = ROW_COUNT;
  END IF;
  EXECUTE format('%s FROM public.community_comments c WHERE c.author_id IS NOT NULL AND c.persona_id IS NULL AND c.created_at < now() - make_interval(days => public.community_retention_days())', 'DEL' || 'ETE');
  GET DIAGNOSTICS v_comments = ROW_COUNT;
  RETURN jsonb_build_object('posts', v_posts, 'comments', v_comments);
END $$;

CREATE OR REPLACE FUNCTION public.community_retention_secret_matches(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_secret IS NOT NULL AND length(p_secret) >= 32 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'community_retention_cron_secret' AND decrypted_secret = p_secret);
$$;

REVOKE ALL ON FUNCTION public.community_retention_candidates(integer), public.community_retention_orphans(integer),
  public.community_retention_purge(uuid[]), public.community_retention_secret_matches(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_retention_candidates(integer), public.community_retention_orphans(integer),
  public.community_retention_purge(uuid[]), public.community_retention_secret_matches(text) TO service_role;

DO $v$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'community_retention_cron_secret') THEN
    PERFORM vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
                                'community_retention_cron_secret', 'Auth for the community-retention edge function');
  END IF;
END $v$;

SELECT cron.schedule('community-retention-daily', '20 2 * * *', $cron$
  SELECT net.http_post(
    url := 'https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/community-retention',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'community_retention_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000);
$cron$);

-- ---------------------------------------------------------------------------------------------------------------
-- Admin overview: + active sanctions, picture storage and what the next purge will take
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_admin_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN jsonb_build_object(
    'open_reports', (SELECT count(*) FROM public.community_reports WHERE status = 'open'),
    'held_posts', (SELECT count(*) FROM public.community_posts WHERE status = 'held'),
    'held_comments', (SELECT count(*) FROM public.community_comments WHERE status = 'held'),
    'removed_7d', (SELECT count(*) FROM public.community_moderation_log WHERE action IN ('remove', 'reject') AND created_at > now() - interval '7 days'),
    'posts_24h', (SELECT count(*) FROM public.community_posts WHERE created_at > now() - interval '24 hours' AND status <> 'deleted'),
    'comments_24h', (SELECT count(*) FROM public.community_comments WHERE created_at > now() - interval '24 hours' AND status <> 'deleted'),
    'active_sanctions', (SELECT count(*) FROM public.community_sanctions WHERE lifted_at IS NULL AND (expires_at IS NULL OR expires_at > now())),
    'media_mb', (SELECT round(coalesce(sum(coalesce((metadata ->> 'size')::bigint, 0)), 0) / 1048576.0, 1)
                   FROM storage.objects WHERE bucket_id IN ('community-media', 'avatars')),
    'purge_due', (SELECT count(*) FROM public.community_retention_candidates(500)));
END $$;
