CREATE OR REPLACE FUNCTION public.admin_notification_overview(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365))); v jsonb;
BEGIN
  PERFORM public.notification_require_admin();
  SELECT jsonb_build_object(
    'window_days', greatest(1, least(p_days, 365)),
    'settings', (SELECT to_jsonb(s) - 'id' FROM public.notification_settings s WHERE s.id),
    'totals', jsonb_build_object(
      'enqueued', (SELECT count(*) FROM public.notification_dispatches WHERE created_at >= v_since),
      'push_sent', (SELECT count(*) FROM public.notification_dispatches WHERE created_at >= v_since AND status IN ('sent','partial')),
      'push_skipped', (SELECT count(*) FROM public.notification_dispatches WHERE created_at >= v_since AND status = 'skipped'),
      'push_failed', (SELECT count(*) FROM public.notification_dispatches WHERE created_at >= v_since AND status = 'failed'),
      'pending', (SELECT count(*) FROM public.notification_dispatches WHERE status IN ('pending','processing') AND push_wanted),
      'devices_delivered', (SELECT count(*) FROM public.push_deliveries WHERE created_at >= v_since AND status = 'sent'),
      'clicks', (SELECT count(*) FROM public.push_deliveries WHERE created_at >= v_since AND clicked_at IS NOT NULL),
      'inbox_written', (SELECT count(*) FROM public.notification_dispatches WHERE created_at >= v_since AND inbox_notification_id IS NOT NULL)),
    'skip_reasons', coalesce((SELECT jsonb_agg(jsonb_build_object('reason', skip_reason, 'count', n) ORDER BY n DESC)
                                FROM (SELECT skip_reason, count(*) n FROM public.notification_dispatches
                                       WHERE created_at >= v_since AND status = 'skipped' GROUP BY skip_reason) x), '[]'::jsonb),
    'subscriptions', jsonb_build_object(
      'active_devices', (SELECT count(*) FROM public.push_subscriptions WHERE is_active),
      'members_with_push', (SELECT count(DISTINCT user_id) FROM public.push_subscriptions WHERE is_active),
      'installed_members', (SELECT count(*) FROM public.profiles WHERE app_installed_at IS NOT NULL),
      'by_platform', coalesce((SELECT jsonb_agg(jsonb_build_object('label', platform, 'count', n) ORDER BY n DESC)
                                 FROM (SELECT platform, count(*) n FROM public.push_subscriptions WHERE is_active GROUP BY platform) x), '[]'::jsonb),
      'by_browser', coalesce((SELECT jsonb_agg(jsonb_build_object('label', browser, 'count', n) ORDER BY n DESC)
                                FROM (SELECT browser, count(*) n FROM public.push_subscriptions WHERE is_active GROUP BY browser) x), '[]'::jsonb)),
    'opt_ins', (SELECT jsonb_build_object(
                  'members_with_preferences', count(*),
                  'routine_reminder', count(*) FILTER (WHERE routine_reminder),
                  'briefing', count(*) FILTER (WHERE briefing),
                  'podcast_episode', count(*) FILTER (WHERE podcast_episode),
                  'skin_weather', count(*) FILTER (WHERE skin_weather),
                  'journal_reminder', count(*) FILTER (WHERE journal_reminder),
                  'price_alert', count(*) FILTER (WHERE price_alert),
                  'promotional', count(*) FILTER (WHERE promotional),
                  'report_ready', count(*) FILTER (WHERE report_ready),
                  'account_update', count(*) FILTER (WHERE account_update),
                  'service', count(*) FILTER (WHERE service))
                FROM public.notification_preferences),
    'daily', coalesce((
      WITH d AS (SELECT (x.created_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS enqueued,
                        count(*) FILTER (WHERE x.status IN ('sent','partial')) AS sent
                   FROM public.notification_dispatches x WHERE x.created_at >= v_since GROUP BY 1),
           k AS (SELECT (pd.clicked_at AT TIME ZONE 'Africa/Johannesburg')::date AS day, count(*) AS clicks
                   FROM public.push_deliveries pd WHERE pd.clicked_at >= v_since GROUP BY 1)
      SELECT jsonb_agg(jsonb_build_object('day', d.day, 'enqueued', d.enqueued, 'sent', d.sent, 'clicks', coalesce(k.clicks, 0)) ORDER BY d.day)
        FROM d LEFT JOIN k ON k.day = d.day), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;