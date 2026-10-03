-- One admin-only aggregate over analytics_events for the /admin "Events" charts.
-- Aggregates only (no payloads, no per-user rows), window capped at 90 days.
-- Days/hours are SAST. Categories are a presentation grouping of event names.
CREATE OR REPLACE FUNCTION public.admin_events_overview(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_days int := least(greatest(coalesce(p_days, 30), 1), 90);
  v_from timestamptz;
  v_result jsonb;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_from := now() - make_interval(days => v_days);

  WITH e AS (
    SELECT created_at, event_name, path, user_id,
           (created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day,
           extract(hour FROM created_at AT TIME ZONE 'Africa/Johannesburg')::int AS hour,
           CASE
             WHEN event_name LIKE 'advanced_assessment%' THEN 'Advanced analysis'
             WHEN event_name LIKE 'skynn%' OR event_name LIKE 'starter%' OR event_name LIKE 'analysis_viewed'
               OR event_name LIKE 'formulator%' OR event_name IN ('results_saved', 'reanalysis_blocked', 'analysis_generated', 'analysis_started', 'consent_completed', 'profile_completed') THEN 'SKYNN AI'
             WHEN event_name LIKE 'pricing%' OR event_name LIKE 'plan_%' OR event_name LIKE 'upgrade%' OR event_name LIKE 'credit_pack%'
               OR event_name LIKE 'founding_member%' OR event_name LIKE 'analysis_pass%' OR event_name LIKE 'checkout%' OR event_name LIKE 'trial%' THEN 'Pricing & upgrades'
             WHEN event_name LIKE 'auth%' OR event_name LIKE 'signup%' OR event_name LIKE 'admin_login%' THEN 'Sign-up & sign-in'
             WHEN event_name LIKE 'smart_routine%' OR event_name LIKE 'routine%' THEN 'Routines'
             ELSE 'Content & community'
           END AS category
      FROM public.analytics_events
     WHERE created_at >= v_from
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'totals', (SELECT jsonb_build_object(
        'events', count(*), 'signed_in_users', count(DISTINCT user_id),
        'event_types', count(DISTINCT event_name),
        'signed_in_events', count(*) FILTER (WHERE user_id IS NOT NULL),
        'first_event_at', min(created_at)) FROM e),
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'events', n, 'users', u) ORDER BY day)
        FROM (SELECT day, count(*) n, count(DISTINCT user_id) u FROM e GROUP BY day) d), '[]'::jsonb),
    'daily_by_category', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'category', category, 'count', n) ORDER BY day)
        FROM (SELECT day, category, count(*) n FROM e GROUP BY day, category) d), '[]'::jsonb),
    'by_category', coalesce((SELECT jsonb_agg(jsonb_build_object('category', category, 'count', n) ORDER BY n DESC)
        FROM (SELECT category, count(*) n FROM e GROUP BY category) d), '[]'::jsonb),
    'by_event', coalesce((SELECT jsonb_agg(jsonb_build_object('event_name', event_name, 'category', category, 'count', n, 'users', u, 'last_seen', last_seen) ORDER BY n DESC)
        FROM (SELECT event_name, category, count(*) n, count(DISTINCT user_id) u, max(created_at) last_seen FROM e GROUP BY event_name, category) d), '[]'::jsonb),
    'by_path', coalesce((SELECT jsonb_agg(jsonb_build_object('path', path, 'count', n) ORDER BY n DESC)
        FROM (SELECT path, count(*) n FROM e WHERE path IS NOT NULL GROUP BY path ORDER BY n DESC LIMIT 10) d), '[]'::jsonb),
    'by_hour', coalesce((SELECT jsonb_agg(jsonb_build_object('hour', h, 'count', coalesce(n, 0)) ORDER BY h)
        FROM generate_series(0, 23) h LEFT JOIN (SELECT hour, count(*) n FROM e GROUP BY hour) x ON x.hour = h), '[]'::jsonb),
    'funnel', (SELECT jsonb_agg(jsonb_build_object('stage', s.stage, 'count', (SELECT count(*) FROM e WHERE e.event_name = s.ev)) ORDER BY s.ord)
        FROM (VALUES (1, 'SKYNN AI opened', 'skynn_viewed'), (2, 'Basic analysis finished', 'skynn_results_completed'),
                     (3, 'Results saved', 'results_saved'), (4, 'Sign-up started', 'auth_started'),
                     (5, 'Pricing viewed', 'pricing_view'), (6, 'Plan selected', 'plan_selected')) AS s(ord, stage, ev))
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_events_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_events_overview(integer) TO authenticated;
