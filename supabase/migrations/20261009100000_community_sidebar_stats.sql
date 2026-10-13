-- Community Forum desktop sidebar: two read-only RPCs.
--  * community_overview(): aggregate counts only (members, discussions and replies since SAST midnight). No identities.
--  * community_staff_list(): the verified staff who moderate the Community, by the same display name the feed shows
--    ("First L."), their role and profile picture. Never an email, full name or user id.
-- Signed-in members only (same rule as the feed). Both are STABLE SECURITY DEFINER with an empty search_path.

CREATE OR REPLACE FUNCTION public.community_overview()
RETURNS TABLE (member_count integer, discussions_today integer, replies_today integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_since timestamptz := date_trunc('day', now() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT (SELECT count(*)::integer FROM public.profiles pr WHERE coalesce(pr.account_status, 'active') = 'active'),
         (SELECT count(*)::integer FROM public.community_posts p WHERE p.status = 'published' AND p.created_at >= v_since),
         (SELECT count(*)::integer FROM public.community_comments c WHERE c.status = 'published' AND c.created_at >= v_since);
END $$;

CREATE OR REPLACE FUNCTION public.community_staff_list()
RETURNS TABLE (display_name text, role text, avatar_path text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT public.community_display_name(s.user_id), public.community_actor_role(s.user_id), pr.avatar_path
    FROM (SELECT DISTINCT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin'::public.app_role, 'moderator'::public.app_role)) s
    LEFT JOIN public.profiles pr ON pr.user_id = s.user_id
   WHERE coalesce(pr.account_status, 'active') = 'active'
   ORDER BY (public.community_actor_role(s.user_id) = 'admin') DESC, 1
   LIMIT 12;
END $$;

REVOKE ALL ON FUNCTION public.community_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_staff_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_overview() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.community_staff_list() TO authenticated, service_role;
