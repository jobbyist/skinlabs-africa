CREATE OR REPLACE FUNCTION public.notification_require_admin()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END $$;

CREATE OR REPLACE FUNCTION public.notification_admin_audit(p_action text, p_detail jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.admin_audit_log (admin_user_id, action, target_user_id, detail)
  VALUES (auth.uid(), p_action, NULL, coalesce(p_detail, '{}'::jsonb));
$$;

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
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', d, 'enqueued', e, 'sent', s, 'clicks', k) ORDER BY d)
                         FROM (SELECT (x.created_at AT TIME ZONE 'Africa/Johannesburg')::date d, count(*) e,
                                      count(*) FILTER (WHERE x.status IN ('sent','partial')) s,
                                      (SELECT count(*) FROM public.push_deliveries pd
                                        WHERE pd.clicked_at IS NOT NULL
                                          AND (pd.created_at AT TIME ZONE 'Africa/Johannesburg')::date = (x.created_at AT TIME ZONE 'Africa/Johannesburg')::date) k
                                 FROM public.notification_dispatches x WHERE x.created_at >= v_since GROUP BY 1) z), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_notification_templates()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.notification_require_admin();
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.system DESC, t.key) FROM public.notification_templates t), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_notification_automations(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
BEGIN
  PERFORM public.notification_require_admin();
  RETURN coalesce((
    SELECT jsonb_agg(to_jsonb(a) || jsonb_build_object(
             'stats', jsonb_build_object(
               'enqueued', (SELECT count(*) FROM public.notification_dispatches d WHERE d.automation_key = a.key AND d.created_at >= v_since),
               'sent', (SELECT count(*) FROM public.notification_dispatches d WHERE d.automation_key = a.key AND d.created_at >= v_since AND d.status IN ('sent','partial')),
               'skipped', (SELECT count(*) FROM public.notification_dispatches d WHERE d.automation_key = a.key AND d.created_at >= v_since AND d.status = 'skipped'),
               'clicks', (SELECT count(*) FROM public.push_deliveries pd JOIN public.notification_dispatches d ON d.id = pd.dispatch_id
                           WHERE d.automation_key = a.key AND pd.created_at >= v_since AND pd.clicked_at IS NOT NULL)),
             'template', (SELECT to_jsonb(t) FROM public.notification_templates t WHERE t.key = a.template_key))
           ORDER BY a.system DESC, a.trigger_kind, a.key)
      FROM public.notification_automations a), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_notification_campaigns(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.notification_require_admin();
  RETURN coalesce((
    SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object(
             'stats', jsonb_build_object(
               'enqueued', (SELECT count(*) FROM public.notification_dispatches d WHERE d.campaign_id = c.id),
               'push_sent', (SELECT count(*) FROM public.notification_dispatches d WHERE d.campaign_id = c.id AND d.status IN ('sent','partial')),
               'pending', (SELECT count(*) FROM public.notification_dispatches d WHERE d.campaign_id = c.id AND d.status IN ('pending','processing')),
               'clicks', (SELECT count(*) FROM public.push_deliveries pd JOIN public.notification_dispatches d ON d.id = pd.dispatch_id
                           WHERE d.campaign_id = c.id AND pd.clicked_at IS NOT NULL)),
             'created_by_email', (SELECT p.email FROM public.profiles p WHERE p.user_id = c.created_by))
           ORDER BY coalesce(c.scheduled_for, c.created_at) DESC)
      FROM (SELECT * FROM public.notification_campaigns ORDER BY coalesce(scheduled_for, created_at) DESC
             LIMIT greatest(1, least(p_limit, 200))) c), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_notification_dispatches(
  p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_status text DEFAULT NULL, p_source text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.notification_require_admin();
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
             'id', d.id, 'created_at', d.created_at, 'scheduled_at', d.scheduled_at, 'sent_at', d.sent_at,
             'status', d.status, 'skip_reason', d.skip_reason, 'category', d.category, 'source', d.source,
             'template_key', d.template_key, 'automation_key', d.automation_key, 'campaign_id', d.campaign_id,
             'title', d.title, 'body', d.body, 'url', d.url,
             'devices_targeted', d.devices_targeted, 'devices_sent', d.devices_sent, 'devices_failed', d.devices_failed,
             'last_error', d.last_error, 'user_id', d.user_id,
             'email', (SELECT p.email FROM public.profiles p WHERE p.user_id = d.user_id),
             'clicked', EXISTS (SELECT 1 FROM public.push_deliveries pd WHERE pd.dispatch_id = d.id AND pd.clicked_at IS NOT NULL))
           ORDER BY d.created_at DESC)
      FROM (SELECT * FROM public.notification_dispatches x
             WHERE (p_status IS NULL OR x.status = p_status) AND (p_source IS NULL OR x.source = p_source)
             ORDER BY x.created_at DESC
             LIMIT greatest(1, least(p_limit, 200)) OFFSET greatest(0, p_offset)) d), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_preview_notification_audience(
  p_audience jsonb, p_category text DEFAULT 'service', p_channels text[] DEFAULT ARRAY['inbox','push'])
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v jsonb;
BEGIN
  PERFORM public.notification_require_admin();
  IF NOT (p_category = ANY (public.notification_categories())) THEN
    RAISE EXCEPTION 'Unknown category %', p_category USING ERRCODE = '22023';
  END IF;
  WITH aud AS (SELECT u.user_id FROM public.notification_audience_user_ids(p_audience) u),
       r AS (SELECT aud.user_id,
                    public.notification_category_allowed(aud.user_id, p_category) AS allowed,
                    EXISTS (SELECT 1 FROM public.push_subscriptions s WHERE s.user_id = aud.user_id AND s.is_active) AS has_push
               FROM aud)
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM r),
    'inbox_reachable', CASE WHEN 'inbox' = ANY (p_channels)
                            THEN (SELECT count(*) FROM r WHERE allowed OR p_category IN ('account_update','service','report_ready'))
                            ELSE 0 END,
    'push_reachable', CASE WHEN 'push' = ANY (p_channels) THEN (SELECT count(*) FROM r WHERE allowed AND has_push) ELSE 0 END,
    'opted_out', (SELECT count(*) FROM r WHERE NOT allowed),
    'by_platform', coalesce((SELECT jsonb_agg(jsonb_build_object('label', platform, 'count', n) ORDER BY n DESC)
                               FROM (SELECT s.platform, count(DISTINCT s.user_id) n
                                       FROM public.push_subscriptions s JOIN r ON r.user_id = s.user_id
                                      WHERE s.is_active AND r.allowed GROUP BY s.platform) x), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.admin_save_notification_campaign(
  p_id uuid, p_name text, p_category text, p_title text, p_body text,
  p_url text DEFAULT '/dashboard?tab=inbox', p_channels text[] DEFAULT ARRAY['inbox','push'], p_audience jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); v_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.notification_campaigns (name, category, title, body, url, channels, audience, created_by)
    VALUES (btrim(p_name), p_category, btrim(p_title), btrim(p_body), public.sanitize_notification_url(p_url),
            p_channels, coalesce(p_audience, '{}'::jsonb), v_uid)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.notification_campaigns
       SET name = btrim(p_name), category = p_category, title = btrim(p_title), body = btrim(p_body),
           url = public.sanitize_notification_url(p_url), channels = p_channels,
           audience = coalesce(p_audience, '{}'::jsonb), updated_at = now()
     WHERE id = p_id AND status = 'draft'
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Only draft campaigns can be edited' USING ERRCODE = '22023'; END IF;
  END IF;
  PERFORM public.notification_admin_audit('notification_campaign_saved', jsonb_build_object('campaign_id', v_id, 'category', p_category));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.notification_campaign_confirm(p_id uuid, p_confirm_recipients integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.notification_audience_user_ids((SELECT audience FROM public.notification_campaigns WHERE id = p_id));
  IF v_count > 50 AND p_confirm_recipients IS DISTINCT FROM v_count THEN
    RAISE EXCEPTION 'confirmation_required:%', v_count USING ERRCODE = '22023',
      HINT = 'Pass p_confirm_recipients equal to the audience size to send to more than 50 members.';
  END IF;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.admin_schedule_notification_campaign(p_id uuid, p_scheduled_for timestamptz, p_confirm_recipients integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  PERFORM public.notification_require_admin();
  IF p_scheduled_for IS NULL OR p_scheduled_for < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'Schedule time must be in the future' USING ERRCODE = '22023';
  END IF;
  v_count := public.notification_campaign_confirm(p_id, p_confirm_recipients);
  UPDATE public.notification_campaigns SET status = 'scheduled', scheduled_for = p_scheduled_for, updated_at = now()
   WHERE id = p_id AND status IN ('draft','scheduled');
  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found or already sent' USING ERRCODE = '22023'; END IF;
  PERFORM public.notification_admin_audit('notification_campaign_scheduled',
    jsonb_build_object('campaign_id', p_id, 'scheduled_for', p_scheduled_for, 'audience_size', v_count));
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.admin_send_notification_campaign_now(p_id uuid, p_confirm_recipients integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer; v_n integer;
BEGIN
  PERFORM public.notification_require_admin();
  v_count := public.notification_campaign_confirm(p_id, p_confirm_recipients);
  UPDATE public.notification_campaigns SET scheduled_for = now(), updated_at = now()
   WHERE id = p_id AND status IN ('draft','scheduled');
  v_n := public.fan_out_notification_campaign(p_id);
  PERFORM public.notification_admin_audit('notification_campaign_sent',
    jsonb_build_object('campaign_id', p_id, 'audience_size', v_count, 'enqueued', v_n));
  RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION public.admin_cancel_notification_campaign(p_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer := 0;
BEGIN
  PERFORM public.notification_require_admin();
  UPDATE public.notification_campaigns SET status = 'cancelled', cancelled_at = now(), updated_at = now()
   WHERE id = p_id AND status IN ('draft','scheduled');
  IF NOT FOUND THEN
    UPDATE public.notification_dispatches SET status = 'cancelled', updated_at = now()
     WHERE campaign_id = p_id AND status = 'pending';
    GET DIAGNOSTICS v_n = ROW_COUNT;
  END IF;
  PERFORM public.notification_admin_audit('notification_campaign_cancelled', jsonb_build_object('campaign_id', p_id, 'pending_cancelled', v_n));
  RETURN v_n;
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_notification_automation(
  p_key text, p_enabled boolean DEFAULT NULL, p_send_time time DEFAULT NULL, p_weekday smallint DEFAULT NULL,
  p_month_day smallint DEFAULT NULL, p_template_key text DEFAULT NULL, p_audience jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); a public.notification_automations%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.notification_automations WHERE key = p_key FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown automation %', p_key USING ERRCODE = '22023'; END IF;
  UPDATE public.notification_automations SET
    enabled = coalesce(p_enabled, enabled),
    send_time = CASE WHEN frequency IN ('daily','weekly','monthly') THEN coalesce(p_send_time, send_time) ELSE send_time END,
    weekday = coalesce(p_weekday, weekday),
    month_day = coalesce(p_month_day, month_day),
    template_key = CASE WHEN system THEN template_key ELSE coalesce(p_template_key, template_key) END,
    audience = CASE WHEN system THEN audience ELSE coalesce(p_audience, audience) END,
    updated_at = now(), updated_by = v_uid
  WHERE key = p_key RETURNING * INTO a;
  PERFORM public.notification_admin_audit('notification_automation_updated',
    jsonb_build_object('key', p_key, 'enabled', a.enabled, 'send_time', a.send_time));
  RETURN to_jsonb(a);
END $$;

CREATE OR REPLACE FUNCTION public.admin_create_notification_automation(
  p_key text, p_name text, p_description text, p_frequency text, p_send_time time, p_template_key text,
  p_audience jsonb DEFAULT '{}'::jsonb, p_weekday smallint DEFAULT NULL, p_month_day smallint DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); v_id uuid;
BEGIN
  IF p_frequency NOT IN ('daily','weekly','monthly') THEN
    RAISE EXCEPTION 'Custom automations are daily, weekly or monthly' USING ERRCODE = '22023';
  END IF;
  IF p_frequency = 'weekly' AND p_weekday IS NULL THEN RAISE EXCEPTION 'weekday required' USING ERRCODE = '22023'; END IF;
  IF p_frequency = 'monthly' AND p_month_day IS NULL THEN RAISE EXCEPTION 'month_day required' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.notification_automations
    (key, name, description, trigger_kind, frequency, send_time, weekday, month_day, template_key, audience, system, enabled, updated_by)
  VALUES (p_key, p_name, p_description, 'schedule', p_frequency, p_send_time, p_weekday, p_month_day, p_template_key,
          coalesce(p_audience, '{}'::jsonb), false, false, v_uid)
  RETURNING id INTO v_id;
  PERFORM public.notification_admin_audit('notification_automation_created', jsonb_build_object('key', p_key));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_notification_template(
  p_key text, p_name text, p_category text, p_title text, p_body text,
  p_url text DEFAULT '/dashboard?tab=inbox', p_inbox_title text DEFAULT NULL, p_inbox_body text DEFAULT NULL,
  p_channels text[] DEFAULT ARRAY['inbox','push'], p_enabled boolean DEFAULT true, p_description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); t public.notification_templates%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.notification_templates WHERE key = p_key FOR UPDATE;
  IF FOUND THEN
    UPDATE public.notification_templates SET
      name = coalesce(p_name, name),
      description = coalesce(p_description, description),
      category = CASE WHEN system THEN category ELSE coalesce(p_category, category) END,
      channels = CASE WHEN system THEN channels ELSE coalesce(p_channels, channels) END,
      title = coalesce(btrim(p_title), title),
      body = coalesce(btrim(p_body), body),
      url = public.sanitize_notification_url(coalesce(p_url, url)),
      inbox_title = p_inbox_title,
      inbox_body = p_inbox_body,
      enabled = coalesce(p_enabled, enabled),
      updated_at = now(), updated_by = v_uid
    WHERE key = p_key RETURNING * INTO t;
  ELSE
    INSERT INTO public.notification_templates
      (key, name, description, category, inbox_category, title, body, inbox_title, inbox_body, url, channels, enabled, system, updated_by)
    VALUES (p_key, p_name, p_description, p_category, 'announcement', btrim(p_title), btrim(p_body), p_inbox_title, p_inbox_body,
            public.sanitize_notification_url(p_url), p_channels, coalesce(p_enabled, true), false, v_uid)
    RETURNING * INTO t;
  END IF;
  PERFORM public.notification_admin_audit('notification_template_saved', jsonb_build_object('key', p_key));
  RETURN to_jsonb(t);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_notification_settings(p_push_enabled boolean DEFAULT NULL, p_default_daily_cap smallint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); s public.notification_settings%ROWTYPE;
BEGIN
  UPDATE public.notification_settings SET
    push_enabled = coalesce(p_push_enabled, push_enabled),
    default_daily_cap = coalesce(p_default_daily_cap, default_daily_cap),
    updated_at = now(), updated_by = v_uid
  WHERE id RETURNING * INTO s;
  PERFORM public.notification_admin_audit('notification_settings_updated',
    jsonb_build_object('push_enabled', s.push_enabled, 'default_daily_cap', s.default_daily_cap));
  RETURN to_jsonb(s) - 'id';
END $$;

CREATE OR REPLACE FUNCTION public.admin_send_test_notification(p_title text DEFAULT NULL, p_body text DEFAULT NULL, p_url text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); v_id uuid;
BEGIN
  v_id := public.enqueue_notification(v_uid, 'test_push', '{}'::jsonb,
    'admin_test:' || v_uid || ':' || floor(extract(epoch FROM now()) / 10)::bigint, 'admin_test',
    jsonb_strip_nulls(jsonb_build_object('title', nullif(btrim(p_title), ''), 'body', nullif(btrim(p_body), ''),
                                         'url', nullif(btrim(p_url), ''), 'channels', '["push"]'::jsonb, 'bypass_caps', true)));
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Test not queued: wait 10 seconds, or check that your "service" notifications are on' USING ERRCODE = '22023';
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_announce_podcast_episode(p_slug text, p_title text, p_audience jsonb DEFAULT '{}'::jsonb, p_confirm_recipients integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := public.notification_require_admin(); v_id uuid;
BEGIN
  IF p_slug !~ '^[a-z0-9-]{1,120}$' THEN RAISE EXCEPTION 'Invalid episode slug' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.notification_campaigns (name, category, title, body, url, channels, audience, created_by)
  VALUES ('Episode: ' || left(p_title, 100), 'podcast_episode', left('New episode: ' || btrim(p_title), 80),
          'The Skin Deep Podcast. Listen now or save it for offline.', '/podcast/' || p_slug,
          ARRAY['inbox','push'], coalesce(p_audience, '{}'::jsonb), v_uid)
  RETURNING id INTO v_id;
  RETURN public.admin_send_notification_campaign_now(v_id, p_confirm_recipients);
END $$;

CREATE OR REPLACE FUNCTION public.admin_run_notification_automation_now(p_key text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer;
BEGIN
  PERFORM public.notification_require_admin();
  IF NOT public.notification_automation_enabled(p_key) THEN
    RAISE EXCEPTION 'Automation % is switched off', p_key USING ERRCODE = '22023';
  END IF;
  v_n := public.run_notification_automation(p_key, now());
  UPDATE public.notification_automations SET last_run_at = now(), last_run_count = v_n WHERE key = p_key;
  PERFORM public.notification_admin_audit('notification_automation_run_now', jsonb_build_object('key', p_key, 'enqueued', v_n));
  RETURN v_n;
END $$;

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.admin_notification_overview(integer)',
    'public.admin_list_notification_templates()',
    'public.admin_list_notification_automations(integer)',
    'public.admin_list_notification_campaigns(integer)',
    'public.admin_list_notification_dispatches(integer, integer, text, text)',
    'public.admin_preview_notification_audience(jsonb, text, text[])',
    'public.admin_save_notification_campaign(uuid, text, text, text, text, text, text[], jsonb)',
    'public.admin_schedule_notification_campaign(uuid, timestamptz, integer)',
    'public.admin_send_notification_campaign_now(uuid, integer)',
    'public.admin_cancel_notification_campaign(uuid)',
    'public.admin_update_notification_automation(text, boolean, time, smallint, smallint, text, jsonb)',
    'public.admin_create_notification_automation(text, text, text, text, time, text, jsonb, smallint, smallint)',
    'public.admin_upsert_notification_template(text, text, text, text, text, text, text, text, text[], boolean, text)',
    'public.admin_set_notification_settings(boolean, smallint)',
    'public.admin_send_test_notification(text, text, text)',
    'public.admin_announce_podcast_episode(text, text, jsonb, integer)',
    'public.admin_run_notification_automation_now(text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.notification_require_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_admin_audit(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_campaign_confirm(uuid, integer) FROM PUBLIC, anon, authenticated;