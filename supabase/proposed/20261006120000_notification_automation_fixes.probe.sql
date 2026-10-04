-- Run AFTER 20261006120000_notification_automation_fixes.sql is applied (it fails before). Rolled back: the DO block always raises.
-- Same assertions as the pg_temp dry run recorded in docs/notification-automations-review-2026-10-04.md, against the real functions.
DO $probe$
DECLARE u uuid; n int; r text; step uuid;
  fails text := '';
BEGIN
  SELECT ur.user_id INTO u FROM public.user_roles ur JOIN auth.users au ON au.id = ur.user_id WHERE ur.role = 'admin' AND au.email IS NOT NULL LIMIT 1;
  PERFORM set_config('app.privileged_write', 'on', true);

  -- journal_reminder honours reminder_enabled
  INSERT INTO public.notification_preferences (user_id, journal_reminder) VALUES (u, true) ON CONFLICT (user_id) DO UPDATE SET journal_reminder = true;
  INSERT INTO public.skin_photo_journal_settings (user_id, frequency, reminder_enabled, created_at) VALUES (u, 'monthly', false, '2026-01-01')
    ON CONFLICT (user_id) DO UPDATE SET frequency = 'monthly', reminder_enabled = false;
  n := public.run_notification_automation('journal_reminder', '2036-01-20 18:00:00+02'::timestamptz);
  IF n <> 0 THEN fails := fails || ' journal: reminder_enabled=false still enqueued;'; END IF;
  UPDATE public.skin_photo_journal_settings SET reminder_enabled = true WHERE user_id = u;
  n := public.run_notification_automation('journal_reminder', '2036-01-20 18:00:00+02'::timestamptz);
  IF n <> 1 THEN fails := fails || ' journal: enabled + overdue not enqueued;'; END IF;

  -- free_analysis_refreshed includes Glow Lite, excludes Insider, uses the 7-day window
  UPDATE public.profiles SET subscription_status = 'glow_lite', last_free_analysis_at = '2036-02-10 09:00:00+02'::timestamptz - interval '7 days' + interval '3 hours' WHERE user_id = u;
  n := public.run_notification_automation('free_analysis_refreshed', '2036-02-10 09:00:00+02'::timestamptz);
  IF n <> 1 THEN fails := fails || ' free_analysis: glow_lite 7 days after not enqueued;'; END IF;
  IF NOT public.notification_guard_ok(u, '{"type":"limited_tier"}'::jsonb) THEN fails := fails || ' guard: limited_tier false for glow_lite;'; END IF;
  UPDATE public.profiles SET subscription_status = 'insider' WHERE user_id = u;
  IF public.notification_guard_ok(u, '{"type":"limited_tier"}'::jsonb) THEN fails := fails || ' guard: limited_tier true for insider;'; END IF;
  UPDATE public.profiles SET subscription_status = 'active' WHERE user_id = u;
  IF public.notification_guard_ok(u, '{"type":"not_paid"}'::jsonb) THEN fails := fails || ' guard: not_paid true for legacy active;'; END IF;

  -- trial_lifecycle carries card-state guards and the guards evaluate
  UPDATE public.profiles SET subscription_status = 'trial', trial_plan = 'insider', trial_ends_at = '2036-03-31T22:00:00Z', trial_started_at = '2036-03-20T08:00:00Z', trial_used_at = '2036-03-20T08:00:00Z' WHERE user_id = u;
  n := public.run_notification_automation('trial_lifecycle', '2036-03-29 08:00:00+02'::timestamptz);
  SELECT guard::text INTO r FROM public.notification_dispatches WHERE user_id = u AND automation_key = 'trial_lifecycle' AND template_key = 'trial_last_chance';
  IF r IS NULL OR r NOT LIKE '%"has_card": false%' THEN fails := fails || ' trial: last_chance guard lacks has_card=false (' || coalesce(r, 'no dispatch') || ');'; END IF;
  IF NOT public.notification_guard_ok(u, jsonb_build_object('type', 'trial_active', 'trial_ends_at', '2036-03-31T22:00:00Z'::timestamptz, 'has_card', false)) THEN fails := fails || ' guard: no-card trial rejected;'; END IF;
  IF public.notification_guard_ok(u, jsonb_build_object('type', 'trial_active', 'trial_ends_at', '2036-03-31T22:00:00Z'::timestamptz, 'has_card', true)) THEN fails := fails || ' guard: has_card=true passed with no live subscription;'; END IF;

  -- weekly_recap singular
  SELECT id INTO step FROM public.routine_steps WHERE user_id = u LIMIT 1;
  IF step IS NOT NULL THEN
    UPDATE public.notification_preferences SET routine_reminder = true WHERE user_id = u;
    INSERT INTO public.routine_checkins (user_id, step_id, time_slot, checkin_date) VALUES (u, step, 'am', '2036-04-04') ON CONFLICT DO NOTHING;
    n := public.run_notification_automation('weekly_recap', '2036-04-05 18:30:00+02'::timestamptz);
    SELECT body INTO r FROM public.notification_dispatches WHERE user_id = u AND automation_key = 'weekly_recap';
    IF r IS NULL OR r NOT LIKE '1 routine check-in this week%' THEN fails := fails || ' recap: body is ' || coalesce(r, 'missing') || ';'; END IF;
  END IF;

  RAISE EXCEPTION 'PROBE %', CASE WHEN fails = '' THEN 'OK (all assertions passed)' ELSE 'FAILED:' || fails END;
END $probe$;
