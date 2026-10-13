-- Admin -> Analytics: one cross-feature view of the platform, built only from tables that already exist.
-- Aggregates only (counts, daily series, member-journey coverage); no member rows or content leave the database.
-- Admin-gated like admin_events_overview(): a non-admin gets 42501.
CREATE OR REPLACE FUNCTION public.admin_platform_overview(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 180);
  v_since timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 30), 7), 180));
  v_members integer; v_series jsonb; v_journey jsonb; v_content jsonb;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  SELECT count(*) INTO v_members FROM public.profiles;

  -- Member journey: how many members reached each surface (distinct members; the ladder shows where people stop).
  v_journey := jsonb_build_object(
    'members', v_members,
    'with_analysis', (SELECT count(DISTINCT user_id) FROM public.skincare_recommendations WHERE user_id IS NOT NULL),
    'with_routine_checkin', (SELECT count(DISTINCT user_id) FROM public.routine_checkins),
    'read_content', (SELECT count(DISTINCT user_id) FROM public.member_content_reads),
    'community_authors', (SELECT count(DISTINCT author_id) FROM public.community_posts WHERE author_id IS NOT NULL AND status <> 'deleted'),
    'push_enabled', (SELECT count(DISTINCT user_id) FROM public.push_subscriptions),
    'advanced_submitted', (SELECT count(DISTINCT user_id) FROM public.advanced_assessment_sessions WHERE status IN ('submitted','processing','completed','requires_review')),
    'trial_started', (SELECT count(*) FROM public.profiles WHERE trial_used_at IS NOT NULL));

  -- What exists to engage with.
  v_content := jsonb_build_object(
    'briefings', (SELECT count(*) FROM public.news_articles WHERE status = 'published'),
    'generated_reviews', (SELECT count(*) FROM public.ai_generated_product_reviews),
    'generated_comparisons', (SELECT count(*) FROM public.ai_generated_comparisons),
    'ingredients', (SELECT count(*) FROM public.ingredients WHERE verification_status <> 'deprecated'),
    'forum_posts', (SELECT count(*) FROM public.community_posts WHERE status = 'published'),
    'forum_comments', (SELECT count(*) FROM public.community_comments WHERE status = 'published'));

  -- One row per day for the window, so a quiet day shows as zero rather than a gap.
  SELECT coalesce(jsonb_agg(row_to_json(d) ORDER BY d.day), '[]'::jsonb) INTO v_series FROM (
    SELECT g::date AS day,
      (SELECT count(*) FROM public.profiles p WHERE p.created_at::date = g::date) AS signups,
      (SELECT count(*) FROM public.skincare_recommendations s WHERE s.created_at::date = g::date) AS analyses,
      (SELECT count(*) FROM public.community_posts c WHERE c.created_at::date = g::date AND c.author_id IS NOT NULL) AS forum_posts,
      (SELECT count(*) FROM public.community_comments c WHERE c.created_at::date = g::date AND c.author_id IS NOT NULL) AS forum_comments,
      (SELECT count(*) FROM public.routine_checkins r WHERE r.created_at::date = g::date) AS checkins,
      (SELECT count(*) FROM public.notifications n WHERE n.created_at::date = g::date) AS notifications
    FROM generate_series(v_since::date, now()::date, interval '1 day') g) d;

  RETURN jsonb_build_object('days', v_days, 'journey', v_journey, 'content', v_content, 'series', v_series);
END $$;
REVOKE ALL ON FUNCTION public.admin_platform_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_overview(integer) TO authenticated, service_role;
