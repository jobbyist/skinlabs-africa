-- PWA analytics for the /admin Analytics tab (docs/pwa.md).
--
-- 1. admin_pwa_overview(p_days): one admin-only aggregate over analytics_events for the install /
--    device / app-usage / offline / push / download events fired by src/lib/pwa/analytics.ts.
--    Aggregates only (no per-user rows, no raw payloads), window capped at 90 days, SAST days.
--    Device breakdowns read the coarse tokens every PWA event carries in its payload:
--    platform, browser, device_type, display_mode (never a user agent, email or health data).
-- 2. admin_events_overview() gains an 'App & PWA' category so these events stop being lumped into
--    'Content & community' in the existing chart (CREATE OR REPLACE; same shape as before).
-- No DROP statements (the Supabase SQL tool hangs on them).

CREATE OR REPLACE FUNCTION public.admin_pwa_overview(p_days integer DEFAULT 30)
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
    SELECT created_at, event_name, user_id,
           (created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day,
           coalesce(nullif(payload ->> 'platform', ''), 'unknown') AS platform,
           coalesce(nullif(payload ->> 'browser', ''), 'other') AS browser,
           coalesce(nullif(payload ->> 'device_type', ''), 'unknown') AS device_type,
           coalesce(nullif(payload ->> 'display_mode', ''), 'browser') AS display_mode,
           coalesce(nullif(payload ->> 'kind', ''), 'unknown') AS kind
      FROM public.analytics_events
     WHERE created_at >= v_from
       AND (event_name LIKE 'pwa\_%' OR event_name LIKE 'push\_%' OR event_name LIKE 'podcast\_download\_%' OR event_name = 'podcast_offline_play')
  )
  SELECT jsonb_build_object(
    'window_days', v_days,
    'totals', (SELECT jsonb_build_object(
        'installs', count(*) FILTER (WHERE event_name = 'pwa_installed'),
        'launches', count(*) FILTER (WHERE event_name = 'pwa_launch'),
        'launch_users', count(DISTINCT user_id) FILTER (WHERE event_name = 'pwa_launch'),
        'prompts_viewed', count(*) FILTER (WHERE event_name = 'pwa_install_prompt_viewed'),
        'offline_sessions', count(*) FILTER (WHERE event_name = 'pwa_offline'),
        'updates_available', count(*) FILTER (WHERE event_name = 'pwa_update_available'),
        'updates_applied', count(*) FILTER (WHERE event_name = 'pwa_updated'),
        'push_subscribed', count(*) FILTER (WHERE event_name = 'push_subscribed'),
        'downloads_completed', count(*) FILTER (WHERE event_name = 'podcast_download_completed'),
        'offline_plays', count(*) FILTER (WHERE event_name = 'podcast_offline_play'),
        'events', count(*)) FROM e),
    'install_funnel', (SELECT jsonb_agg(jsonb_build_object('stage', s.stage, 'count', (SELECT count(*) FROM e WHERE e.event_name = s.ev)) ORDER BY s.ord)
        FROM (VALUES (1, 'Install prompt shown', 'pwa_install_prompt_viewed'),
                     (2, 'Install started', 'pwa_install_started'),
                     (3, 'Accepted', 'pwa_install_accepted'),
                     (4, 'App installed', 'pwa_installed')) AS s(ord, stage, ev)),
    'prompt_outcomes', (SELECT jsonb_agg(jsonb_build_object('outcome', s.outcome, 'count', (SELECT count(*) FROM e WHERE e.event_name = s.ev)) ORDER BY s.ord)
        FROM (VALUES (1, 'Dismissed (Not now)', 'pwa_install_prompt_dismissed'),
                     (2, 'Declined in browser dialog', 'pwa_install_declined'),
                     (3, 'Accepted in browser dialog', 'pwa_install_accepted')) AS s(ord, outcome, ev)),
    'prompt_by_kind', coalesce((SELECT jsonb_agg(jsonb_build_object('kind', kind, 'viewed', viewed, 'dismissed', dismissed) ORDER BY viewed DESC)
        FROM (SELECT kind, count(*) FILTER (WHERE event_name = 'pwa_install_prompt_viewed') viewed,
                     count(*) FILTER (WHERE event_name = 'pwa_install_prompt_dismissed') dismissed
                FROM e WHERE event_name IN ('pwa_install_prompt_viewed', 'pwa_install_prompt_dismissed') GROUP BY kind) d), '[]'::jsonb),
    'installs_by_platform', coalesce((SELECT jsonb_agg(jsonb_build_object('label', platform, 'count', n) ORDER BY n DESC)
        FROM (SELECT platform, count(*) n FROM e WHERE event_name = 'pwa_installed' GROUP BY platform) d), '[]'::jsonb),
    'installs_by_device', coalesce((SELECT jsonb_agg(jsonb_build_object('label', device_type, 'count', n) ORDER BY n DESC)
        FROM (SELECT device_type, count(*) n FROM e WHERE event_name = 'pwa_installed' GROUP BY device_type) d), '[]'::jsonb),
    'installs_by_browser', coalesce((SELECT jsonb_agg(jsonb_build_object('label', browser, 'count', n) ORDER BY n DESC)
        FROM (SELECT browser, count(*) n FROM e WHERE event_name = 'pwa_installed' GROUP BY browser) d), '[]'::jsonb),
    'launches_by_platform', coalesce((SELECT jsonb_agg(jsonb_build_object('label', platform, 'count', n) ORDER BY n DESC)
        FROM (SELECT platform, count(*) n FROM e WHERE event_name = 'pwa_launch' GROUP BY platform) d), '[]'::jsonb),
    'launches_by_device', coalesce((SELECT jsonb_agg(jsonb_build_object('label', device_type, 'count', n) ORDER BY n DESC)
        FROM (SELECT device_type, count(*) n FROM e WHERE event_name = 'pwa_launch' GROUP BY device_type) d), '[]'::jsonb),
    'prompts_by_device', coalesce((SELECT jsonb_agg(jsonb_build_object('label', device_type, 'count', n) ORDER BY n DESC)
        FROM (SELECT device_type, count(*) n FROM e WHERE event_name = 'pwa_install_prompt_viewed' GROUP BY device_type) d), '[]'::jsonb),
    'push_funnel', (SELECT jsonb_agg(jsonb_build_object('stage', s.stage, 'count', (SELECT count(*) FROM e WHERE e.event_name = s.ev)) ORDER BY s.ord)
        FROM (VALUES (1, 'Prompt shown', 'push_prompt_viewed'),
                     (2, 'Permission granted', 'push_permission_granted'),
                     (3, 'Permission denied', 'push_permission_denied'),
                     (4, 'Device subscribed', 'push_subscribed'),
                     (5, 'Unsubscribed', 'push_unsubscribed')) AS s(ord, stage, ev)),
    'push_by_platform', coalesce((SELECT jsonb_agg(jsonb_build_object('label', platform, 'count', n) ORDER BY n DESC)
        FROM (SELECT platform, count(*) n FROM e WHERE event_name = 'push_subscribed' GROUP BY platform) d), '[]'::jsonb),
    'offline_podcasts', (SELECT jsonb_agg(jsonb_build_object('stage', s.stage, 'count', (SELECT count(*) FROM e WHERE e.event_name = s.ev)) ORDER BY s.ord)
        FROM (VALUES (1, 'Downloads started', 'podcast_download_started'),
                     (2, 'Downloads completed', 'podcast_download_completed'),
                     (3, 'Downloads removed', 'podcast_download_removed'),
                     (4, 'Played offline', 'podcast_offline_play')) AS s(ord, stage, ev)),
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object(
          'day', day, 'installs', installs, 'launches', launches, 'prompts', prompts, 'push', push, 'downloads', downloads) ORDER BY day)
        FROM (SELECT day,
                     count(*) FILTER (WHERE event_name = 'pwa_installed') installs,
                     count(*) FILTER (WHERE event_name = 'pwa_launch') launches,
                     count(*) FILTER (WHERE event_name = 'pwa_install_prompt_viewed') prompts,
                     count(*) FILTER (WHERE event_name = 'push_subscribed') push,
                     count(*) FILTER (WHERE event_name = 'podcast_download_completed') downloads
                FROM e GROUP BY day) d), '[]'::jsonb),
    'by_event', coalesce((SELECT jsonb_agg(jsonb_build_object('event_name', event_name, 'count', n, 'users', u, 'last_seen', last_seen) ORDER BY n DESC)
        FROM (SELECT event_name, count(*) n, count(DISTINCT user_id) u, max(created_at) last_seen FROM e GROUP BY event_name) d), '[]'::jsonb),
    'display_mode', coalesce((SELECT jsonb_agg(jsonb_build_object('label', display_mode, 'count', n) ORDER BY n DESC)
        FROM (SELECT display_mode, count(*) n FROM e GROUP BY display_mode) d), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_pwa_overview(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pwa_overview(integer) TO authenticated;

-- admin_events_overview(): same as 20261003140000 plus the 'App & PWA' category.
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
             WHEN event_name LIKE 'pwa%' OR event_name LIKE 'push\_%' OR event_name LIKE 'podcast\_download%' OR event_name = 'podcast_offline_play' THEN 'App & PWA'
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
