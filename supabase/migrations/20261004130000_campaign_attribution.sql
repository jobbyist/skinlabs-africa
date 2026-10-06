-- Campaign attribution report for Admin → Ads.
-- Reads the first-party `analytics_events` rows that carry utm_* labels (merged in by trackConversionEvent from
-- src/lib/attribution.ts). Aggregates only; no user ids, no personal data. Counts are DISTINCT browser sessions
-- (payload.attr_sid) so one visitor firing an event twice counts once. Unlike the TikTok Pixel this isn't consent-gated,
-- so it is the complete count; TikTok Events Manager only sees visitors who accepted advertising cookies.
CREATE INDEX IF NOT EXISTS analytics_events_utm_campaign_idx
  ON public.analytics_events ((payload ->> 'utm_campaign'), created_at DESC)
  WHERE payload ? 'utm_campaign';

CREATE OR REPLACE FUNCTION public.admin_campaign_attribution(p_days integer DEFAULT 30)
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
    SELECT payload ->> 'utm_source'   AS utm_source,
           payload ->> 'utm_medium'   AS utm_medium,
           payload ->> 'utm_campaign' AS utm_campaign,
           coalesce(payload ->> 'utm_content', '') AS utm_content,
           coalesce(payload ->> 'attr_sid', id::text) AS sid,
           event_name,
           (created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day
      FROM public.analytics_events
     WHERE created_at >= v_from
       AND payload ? 'utm_campaign'
  ),
  stages AS (
    SELECT utm_source, utm_medium, utm_campaign, utm_content,
           count(DISTINCT sid) FILTER (WHERE event_name = 'campaign_landing') AS landings,
           count(DISTINCT sid) FILTER (WHERE event_name IN ('analysis_started', 'skynn_started', 'formulator_started')) AS analysis_started,
           count(DISTINCT sid) FILTER (WHERE event_name IN ('analysis_generated', 'formulator_completed_anonymous', 'skynn_results_viewed')) AS analysis_completed,
           count(DISTINCT sid) FILTER (WHERE event_name = 'signup_completed') AS signups,
           count(DISTINCT sid) FILTER (WHERE event_name = 'trial_started') AS trials
      FROM e
     GROUP BY utm_source, utm_medium, utm_campaign, utm_content
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'totals', (SELECT jsonb_build_object(
        'landings', coalesce(sum(landings), 0),
        'analysis_started', coalesce(sum(analysis_started), 0),
        'analysis_completed', coalesce(sum(analysis_completed), 0),
        'signups', coalesce(sum(signups), 0),
        'trials', coalesce(sum(trials), 0)) FROM stages),
    'by_campaign', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'utm_source', utm_source, 'utm_medium', utm_medium, 'utm_campaign', utm_campaign, 'utm_content', nullif(utm_content, ''),
        'landings', landings, 'analysis_started', analysis_started, 'analysis_completed', analysis_completed,
        'signups', signups, 'trials', trials)
        ORDER BY landings DESC, signups DESC) FROM stages), '[]'::jsonb),
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'landings', l, 'signups', s) ORDER BY day)
        FROM (SELECT day,
                     count(DISTINCT sid) FILTER (WHERE event_name = 'campaign_landing') AS l,
                     count(DISTINCT sid) FILTER (WHERE event_name = 'signup_completed') AS s
                FROM e GROUP BY day) d), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_campaign_attribution(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_campaign_attribution(integer) TO authenticated;
