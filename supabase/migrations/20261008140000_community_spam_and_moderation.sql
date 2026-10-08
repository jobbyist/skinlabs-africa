-- SkinLabs Community Forum — spam protection + moderation RPCs for the admin dashboard.  (4 of 5)
--
-- Spam protection (all enforced in the database; the client only adds a honeypot + a minimum-time check on top):
--  * REJECT (member sees an error): duplicate content (same text by the same author in 24 h), bursts (>= 3 posts in 2 min,
--    >= 6 comments in 1 min). The hourly caps from the schema migration still apply.
--  * HOLD (content is saved with status 'held' and spam_flags, visible only to its author and staff until a moderator
--    approves or rejects it): 3+ links, any link from an account younger than 3 days, link shorteners / messaging links,
--    e-mail addresses and phone numbers, an admin-managed blocked-terms list, SHOUTING, character/word repetition.
--  * AUTO-HOLD: content reported by 3 different members is held for review.
--  Staff content is never held. Held items never notify anybody and never count in comment totals.

CREATE TABLE IF NOT EXISTS public.community_spam_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL UNIQUE CHECK (char_length(pattern) BETWEEN 3 AND 80),
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_spam_terms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_spam_terms FROM anon, authenticated;
GRANT ALL ON public.community_spam_terms TO service_role;

INSERT INTO public.community_spam_terms (pattern) VALUES
  ('whatsapp me'), ('dm me for'), ('click my bio'), ('link in bio'), ('guaranteed results'), ('buy followers'),
  ('crypto'), ('forex'), ('bitcoin'), ('casino'), ('payday loan'), ('loan offer'), ('earn money from home'),
  ('viagra'), ('escort'), ('telegram')
ON CONFLICT (pattern) DO NOTHING;

CREATE OR REPLACE FUNCTION public.community_screen(p_author uuid, p_text text)
RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_flags text[] := '{}';
  t text := lower(coalesce(p_text, ''));
  v_links integer; v_letters integer; v_upper integer; v_age interval;
BEGIN
  SELECT count(*) INTO v_links FROM regexp_matches(t, '(https?://|www\.)', 'g');
  IF v_links >= 3 THEN v_flags := array_append(v_flags, 'many_links'); END IF;
  IF v_links >= 1 THEN
    SELECT now() - u.created_at INTO v_age FROM auth.users u WHERE u.id = p_author;
    IF v_age IS NULL OR v_age < interval '3 days' THEN v_flags := array_append(v_flags, 'new_account_link'); END IF;
  END IF;
  IF t ~ '(bit\.ly|tinyurl\.com|t\.co/|goo\.gl|t\.me/|wa\.me/|cutt\.ly|is\.gd|linktr\.ee)' THEN v_flags := array_append(v_flags, 'shortener'); END IF;
  IF EXISTS (SELECT 1 FROM public.community_spam_terms s WHERE s.enabled AND position(lower(s.pattern) IN t) > 0) THEN
    v_flags := array_append(v_flags, 'blocked_term');
  END IF;
  v_letters := length(regexp_replace(coalesce(p_text, ''), '[^A-Za-z]', '', 'g'));
  v_upper := length(regexp_replace(coalesce(p_text, ''), '[^A-Z]', '', 'g'));
  IF v_letters >= 20 AND v_upper::numeric / v_letters > 0.7 THEN v_flags := array_append(v_flags, 'shouting'); END IF;
  IF t ~ '(.)\1{9,}' OR t ~ '\m(\w+)(\s+\1){5,}\M' THEN v_flags := array_append(v_flags, 'repetition'); END IF;
  IF t ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' OR t ~ '(\+?\d[\s-]?){10,}' THEN v_flags := array_append(v_flags, 'contact_details'); END IF;
  RETURN v_flags;
END $$;
REVOKE ALL ON FUNCTION public.community_screen(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_screen(uuid, text) TO service_role;

-- Replaces the schema migration's guard with the same checks plus spam screening and image-path ownership.
CREATE OR REPLACE FUNCTION public.community_guard_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_recent integer; v_limit integer; v_burst integer; v_staff boolean; v_flags text[]; v_text text; v_norm text; v_dupe boolean;
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

-- Three different members reporting the same thing holds it for review (not for pinned or staff content).
CREATE OR REPLACE FUNCTION public.community_report_autohold()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer; v_id uuid; v_type text; v_changed boolean := false;
BEGIN
  SELECT count(DISTINCT reporter_id) INTO v_n FROM public.community_reports r
   WHERE r.status = 'open' AND r.post_id IS NOT DISTINCT FROM NEW.post_id AND r.comment_id IS NOT DISTINCT FROM NEW.comment_id;
  IF v_n < 3 THEN RETURN NULL; END IF;
  IF NEW.post_id IS NOT NULL THEN
    v_type := 'post'; v_id := NEW.post_id;
    UPDATE public.community_posts SET status = 'held', spam_flags = array_append(spam_flags, 'reported')
     WHERE id = NEW.post_id AND status = 'published' AND NOT pinned AND NOT public.community_is_staff(author_id);
    v_changed := FOUND;
  ELSE
    v_type := 'comment'; v_id := NEW.comment_id;
    UPDATE public.community_comments SET status = 'held', spam_flags = array_append(spam_flags, 'reported')
     WHERE id = NEW.comment_id AND status = 'published' AND NOT public.community_is_staff(author_id);
    v_changed := FOUND;
  END IF;
  IF v_changed THEN
    INSERT INTO public.community_moderation_log (actor_id, target_type, target_id, action, note) VALUES (NULL, v_type, v_id, 'hold', 'auto: 3 reports');
  END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER community_reports_autohold AFTER INSERT ON public.community_reports
  FOR EACH ROW EXECUTE FUNCTION public.community_report_autohold();
REVOKE ALL ON FUNCTION public.community_report_autohold() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Admin dashboard RPCs (Moderation tab). Staff only; every function re-checks the caller server-side.
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_require_staff()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.community_is_staff(v_uid) THEN
    RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END $$;
REVOKE ALL ON FUNCTION public.community_require_staff() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.community_require_staff() TO service_role;

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
    'comments_24h', (SELECT count(*) FROM public.community_comments WHERE created_at > now() - interval '24 hours' AND status <> 'deleted'));
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_reports(p_status text DEFAULT 'open', p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE (
  report_id uuid, created_at timestamptz, reason text, details text, status text, target_type text, target_id uuid, post_id uuid,
  title text, body text, content_status text, author_name text, reporter_name text, report_count bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN QUERY
  SELECT r.id, r.created_at, r.reason, r.details, r.status,
         CASE WHEN r.post_id IS NOT NULL THEN 'post' ELSE 'comment' END,
         coalesce(r.post_id, r.comment_id),
         coalesce(r.post_id, c.post_id),
         coalesce(p.title, cp.title),
         coalesce(p.body, c.body),
         coalesce(p.status, c.status),
         coalesce((SELECT pe.display_name FROM public.community_personas pe WHERE pe.id = coalesce(p.persona_id, c.persona_id)),
                  public.community_display_name(coalesce(p.author_id, c.author_id))),
         public.community_display_name(r.reporter_id),
         (SELECT count(*) FROM public.community_reports r2
           WHERE r2.status = r.status AND r2.post_id IS NOT DISTINCT FROM r.post_id AND r2.comment_id IS NOT DISTINCT FROM r.comment_id)
    FROM public.community_reports r
    LEFT JOIN public.community_posts p ON p.id = r.post_id
    LEFT JOIN public.community_comments c ON c.id = r.comment_id
    LEFT JOIN public.community_posts cp ON cp.id = c.post_id
   WHERE (p_status IS NULL OR r.status = p_status)
   ORDER BY r.created_at DESC
   LIMIT least(greatest(coalesce(p_limit, 50), 1), 100) OFFSET greatest(coalesce(p_offset, 0), 0);
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_held(p_limit integer DEFAULT 50)
RETURNS TABLE (
  target_type text, target_id uuid, post_id uuid, title text, body text, author_name text, flags text[], created_at timestamptz, image_path text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN QUERY
  SELECT * FROM (
    SELECT 'post'::text, p.id, p.id, p.title, p.body,
           coalesce((SELECT pe.display_name FROM public.community_personas pe WHERE pe.id = p.persona_id), public.community_display_name(p.author_id)),
           p.spam_flags, p.created_at, p.image_path
      FROM public.community_posts p WHERE p.status = 'held'
    UNION ALL
    SELECT 'comment'::text, c.id, c.post_id, (SELECT x.title FROM public.community_posts x WHERE x.id = c.post_id), c.body,
           coalesce((SELECT pe.display_name FROM public.community_personas pe WHERE pe.id = c.persona_id), public.community_display_name(c.author_id)),
           c.spam_flags, c.created_at, NULL::text
      FROM public.community_comments c WHERE c.status = 'held'
  ) h ORDER BY h.created_at DESC LIMIT least(greatest(coalesce(p_limit, 50), 1), 100);
END $$;

CREATE OR REPLACE FUNCTION public.community_review_held(p_type text, p_id uuid, p_approve boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.community_require_staff(); v_found boolean;
BEGIN
  IF p_type NOT IN ('post', 'comment') THEN RAISE EXCEPTION 'invalid type' USING ERRCODE = '22023'; END IF;
  IF p_type = 'post' THEN
    UPDATE public.community_posts SET status = CASE WHEN p_approve THEN 'published' ELSE 'removed' END,
           created_at = CASE WHEN p_approve THEN now() ELSE created_at END WHERE id = p_id AND status = 'held';
  ELSE
    UPDATE public.community_comments SET status = CASE WHEN p_approve THEN 'published' ELSE 'removed' END WHERE id = p_id AND status = 'held';
  END IF;
  v_found := FOUND;
  IF v_found THEN
    INSERT INTO public.community_moderation_log (actor_id, target_type, target_id, action)
    VALUES (v_uid, p_type, p_id, CASE WHEN p_approve THEN 'approve' ELSE 'reject' END);
    -- Reports against reviewed content are closed with it.
    UPDATE public.community_reports SET status = CASE WHEN p_approve THEN 'dismissed' ELSE 'actioned' END, resolved_by = v_uid, resolved_at = now()
     WHERE status = 'open' AND ((p_type = 'post' AND post_id = p_id) OR (p_type = 'comment' AND comment_id = p_id));
  END IF;
  RETURN v_found;
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_log(p_limit integer DEFAULT 50)
RETURNS TABLE (created_at timestamptz, actor_name text, target_type text, target_id uuid, action text, note text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN QUERY
  SELECT l.created_at, CASE WHEN l.actor_id IS NULL THEN 'System' ELSE public.community_display_name(l.actor_id) END,
         l.target_type, l.target_id, l.action, l.note
    FROM public.community_moderation_log l ORDER BY l.created_at DESC LIMIT least(greatest(coalesce(p_limit, 50), 1), 100);
END $$;

-- Blocked terms: any staff may read; only admins change them.
CREATE OR REPLACE FUNCTION public.community_admin_terms()
RETURNS TABLE (id uuid, pattern text, enabled boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.community_require_staff();
  RETURN QUERY SELECT t.id, t.pattern, t.enabled, t.created_at FROM public.community_spam_terms t ORDER BY t.pattern;
END $$;

CREATE OR REPLACE FUNCTION public.community_admin_set_term(p_pattern text, p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.community_require_staff();
BEGIN
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF char_length(btrim(coalesce(p_pattern, ''))) < 3 THEN RAISE EXCEPTION 'pattern too short' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.community_spam_terms (pattern, enabled, created_by) VALUES (lower(btrim(p_pattern)), p_enabled, v_uid)
  ON CONFLICT (pattern) DO UPDATE SET enabled = EXCLUDED.enabled;
END $$;

REVOKE ALL ON FUNCTION public.community_admin_overview(), public.community_admin_reports(text, integer, integer), public.community_admin_held(integer),
  public.community_review_held(text, uuid, boolean), public.community_admin_log(integer), public.community_admin_terms(),
  public.community_admin_set_term(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_admin_overview(), public.community_admin_reports(text, integer, integer), public.community_admin_held(integer),
  public.community_review_held(text, uuid, boolean), public.community_admin_log(integer), public.community_admin_terms(),
  public.community_admin_set_term(text, boolean) TO authenticated, service_role;
