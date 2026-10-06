-- Rolled-back probe: notification automation fixes (20261004031707), podcast announce dedupe (20261004031715) and the daily-cap priority
-- classes (20261004031727). One DO block that ALWAYS raises, so nothing is kept. Uses throwaway users only.
DO $$
DECLARE
  n int := 0; c int; r text; g boolean;
  v_admin uuid := gen_random_uuid();
  j1 uuid := gen_random_uuid(); j2 uuid := gen_random_uuid(); j3 uuid := gen_random_uuid(); j4 uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid(); m2 uuid := gen_random_uuid(); m3 uuid := gen_random_uuid(); m4 uuid := gen_random_uuid();
  f_ex uuid := gen_random_uuid(); f_lite uuid := gen_random_uuid(); f_ins uuid := gen_random_uuid(); f_old uuid := gen_random_uuid();
  t1 uuid := gen_random_uuid(); w1 uuid := gen_random_uuid(); e1 uuid := gen_random_uuid();
  v_today date := (now() AT TIME ZONE 'Africa/Johannesburg')::date;
  v_step uuid; v_raised boolean; k int := 0;
  all_users uuid[];
BEGIN
  all_users := ARRAY[v_admin, j1, j2, j3, j4, m1, m2, m3, m4, f_ex, f_lite, f_ins, f_old, t1, w1, e1];
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'na-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(all_users) x;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin');
  PERFORM set_config('app.privileged_write', 'on', true);

  -- ---------- journal_reminder ----------
  -- j1: reminder_enabled = false -> nothing; j2: two reminders since the last photo -> a third is sent;
  -- j3: three unanswered -> stops; j4: three before the last photo -> a new photo resets the count.
  INSERT INTO public.notification_preferences (user_id, journal_reminder) SELECT x, true FROM unnest(ARRAY[j1, j2, j3, j4]) x;
  INSERT INTO public.skin_photo_journal_settings (user_id, frequency, reminder_enabled, created_at)
  VALUES (j1, 'weekly', false, now() - interval '100 days'), (j2, 'weekly', true, now() - interval '100 days'),
         (j3, 'weekly', true, now() - interval '100 days'), (j4, 'weekly', true, now() - interval '100 days');
  INSERT INTO public.skin_photo_journal_entries (user_id, storage_path, captured_at) VALUES (j4, 'probe/' || j4, now() - interval '8 days');
  INSERT INTO public.notification_dispatches (user_id, source, automation_key, category, title, body, url, push_wanted, idempotency_key, status, created_at)
  SELECT u, 'automation', 'journal_reminder', 'journal_reminder', 't', 'b', '/dashboard', true, 'probe-j:' || u || ':' || i, 'sent', now() - make_interval(days => d)
    FROM (VALUES (j2, 1, 40), (j2, 2, 20), (j3, 1, 40), (j3, 2, 30), (j3, 3, 20), (j4, 1, 60), (j4, 2, 50), (j4, 3, 40)) AS v(u, i, d);
  PERFORM public.run_notification_automation('journal_reminder', now());
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = j1 AND automation_key = 'journal_reminder';
  IF c <> 0 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: reminder_enabled=false was reminded'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = j2 AND automation_key = 'journal_reminder' AND idempotency_key NOT LIKE 'probe-j:%';
  IF c <> 1 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: third reminder not sent (%)', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = j3 AND automation_key = 'journal_reminder' AND idempotency_key NOT LIKE 'probe-j:%';
  IF c <> 0 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: a 4th unanswered reminder was sent'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = j4 AND automation_key = 'journal_reminder' AND idempotency_key NOT LIKE 'probe-j:%';
  IF c <> 1 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: a new photo did not reset the unanswered count (%)', c; END IF; n := n + 1;

  -- ---------- monthly_skin_review ----------
  -- m1 eligible; m2 analysed 5 days ago; m3 has nothing to look back on; m4 got a journal reminder 3 days ago.
  INSERT INTO public.notification_preferences (user_id, journal_reminder) SELECT x, true FROM unnest(ARRAY[m1, m2, m3, m4]) x;
  INSERT INTO public.skincare_recommendations (user_id, skin_type, concerns, status, recommendation, result_payload, created_at)
  VALUES (m1, 'oily', ARRAY['acne'], 'delivered', 'probe', '{"probe":true}', now() - interval '30 days'),
         (m2, 'oily', ARRAY['acne'], 'delivered', 'probe', '{"probe":true}', now() - interval '5 days'),
         (m4, 'oily', ARRAY['acne'], 'delivered', 'probe', '{"probe":true}', now() - interval '40 days');
  INSERT INTO public.notification_dispatches (user_id, source, automation_key, category, title, body, url, push_wanted, idempotency_key, status, created_at)
  VALUES (m4, 'automation', 'journal_reminder', 'journal_reminder', 't', 'b', '/dashboard', true, 'probe-m4', 'sent', now() - interval '3 days');
  PERFORM public.run_notification_automation('monthly_skin_review', now());
  PERFORM public.run_notification_automation('monthly_skin_review', now());
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id = m1 AND template_key = 'monthly_skin_review';
  IF c <> 1 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: monthly review for an eligible member sent % times (want 1, even after two runs)', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE user_id IN (m2, m3, m4) AND template_key = 'monthly_skin_review';
  IF c <> 0 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: monthly review sent to an ineligible member'; END IF; n := n + 1;
  SELECT lock_screen_safe INTO g FROM public.notification_templates WHERE key = 'monthly_skin_review';
  IF NOT coalesce(g, false) THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: monthly template missing or not lock-screen safe'; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_automations WHERE key = 'monthly_skin_review' AND frequency = 'monthly' AND month_day = 1 AND send_time = '10:00' AND enabled AND system;
  IF c <> 1 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: monthly automation row wrong'; END IF; n := n + 1;

  -- ---------- free_analysis_refreshed (limited tiers, 7-day window) ----------
  UPDATE public.profiles SET subscription_status = 'free', last_free_analysis_at = now() - interval '7 days' WHERE user_id = f_ex;
  UPDATE public.profiles SET subscription_status = 'glow_lite', last_free_analysis_at = now() - interval '7 days' WHERE user_id = f_lite;
  UPDATE public.profiles SET subscription_status = 'insider', last_free_analysis_at = now() - interval '7 days' WHERE user_id = f_ins;
  UPDATE public.profiles SET subscription_status = 'free', last_free_analysis_at = now() - interval '30 days' WHERE user_id = f_old;
  PERFORM public.run_notification_automation('free_analysis_refreshed', now());
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE automation_key = 'free_analysis_refreshed' AND user_id IN (f_ex, f_lite);
  IF c <> 2 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: explorer and glow_lite should both be notified (%)', c; END IF; n := n + 1;
  SELECT count(*) INTO c FROM public.notification_dispatches WHERE automation_key = 'free_analysis_refreshed' AND user_id IN (f_ins, f_old);
  IF c <> 0 THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: unlimited tier or 30-day-old analysis was notified'; END IF; n := n + 1;
  IF NOT public.notification_guard_ok(f_lite, '{"type":"limited_tier"}'::jsonb) OR public.notification_guard_ok(f_ins, '{"type":"limited_tier"}'::jsonb) THEN
    RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: limited_tier guard'; END IF; n := n + 1;
  UPDATE public.profiles SET subscription_status = 'active' WHERE user_id = f_old;
  IF public.notification_guard_ok(f_old, '{"type":"not_paid"}'::jsonb) THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: not_paid true for legacy active'; END IF; n := n + 1;

  -- ---------- trial_lifecycle guards (T-3, no card) ----------
  UPDATE public.profiles SET subscription_status = 'trial', trial_plan = 'insider', trial_started_at = now() - interval '10 days',
         trial_used_at = now() - interval '10 days',
         trial_ends_at = ((v_today + 3)::timestamp AT TIME ZONE 'Africa/Johannesburg') WHERE user_id = t1;
  PERFORM public.run_notification_automation('trial_lifecycle', now());
  SELECT guard::text INTO r FROM public.notification_dispatches WHERE user_id = t1 AND template_key = 'trial_last_chance';
  IF r IS NULL THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: no trial_last_chance push at T-3'; END IF; n := n + 1;
  SELECT bypass_caps INTO g FROM public.notification_dispatches WHERE user_id = t1 AND template_key = 'trial_last_chance';
  IF NOT g THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: trial_last_chance must ignore the cap'; END IF; n := n + 1;
  SELECT guard::text INTO r FROM public.notification_dispatches WHERE user_id = t1 AND template_key = 'trial_last_chance';
  IF r NOT LIKE '%"has_card": false%' THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: last_chance guard %', r; END IF; n := n + 1;
  IF NOT public.notification_guard_ok(t1, (SELECT guard FROM public.notification_dispatches WHERE user_id = t1 AND template_key = 'trial_last_chance')) THEN
    RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: guard rejects an active no-card trial'; END IF; n := n + 1;
  IF public.notification_guard_ok(t1, jsonb_build_object('type', 'trial_active', 'trial_ends_at', (SELECT trial_ends_at FROM public.profiles WHERE user_id = t1), 'has_card', true)) THEN
    RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: has_card=true passed without a live subscription'; END IF; n := n + 1;
  UPDATE public.profiles SET subscription_status = 'insider' WHERE user_id = t1;   -- converted before the push went out
  IF public.notification_guard_ok(t1, (SELECT guard FROM public.notification_dispatches WHERE user_id = t1 AND template_key = 'trial_last_chance')) THEN
    RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: converted member would still get the trial push'; END IF; n := n + 1;

  -- ---------- weekly_recap wording ----------
  INSERT INTO public.notification_preferences (user_id, routine_reminder) VALUES (w1, true);
  INSERT INTO public.routine_steps (user_id, step_name) VALUES (w1, 'Cleanser') RETURNING id INTO v_step;
  INSERT INTO public.routine_checkins (user_id, step_id, time_slot, checkin_date) VALUES (w1, v_step, 'am', v_today);
  PERFORM public.run_notification_automation('weekly_recap', now());
  SELECT body INTO r FROM public.notification_dispatches WHERE user_id = w1 AND automation_key = 'weekly_recap';
  IF r IS NULL OR r NOT LIKE '1 routine check-in this week%' THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: recap body %', coalesce(r, '<none>'); END IF; n := n + 1;

  -- ---------- daily cap priority classes (claim_notification_dispatches) ----------
  INSERT INTO public.notification_preferences (user_id, routine_reminder, briefing, skin_weather, account_update, service, daily_cap, quiet_hours_enabled)
  VALUES (e1, true, true, true, true, true, 2, false);
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (e1, 'https://push.invalid/' || e1, 'k-0123456789-0123456789-abcdef', 'a-0123456789-abcdef');
  INSERT INTO public.notification_dispatches (user_id, source, category, title, body, url, push_wanted, idempotency_key, priority, bypass_caps, scheduled_at)
  VALUES (e1, 'probe', 'routine_reminder', 'A', 'b', '/', true, 'cap-a:' || e1, 30, false, now() - interval '5 minutes'),
         (e1, 'probe', 'skin_weather',     'B', 'b', '/', true, 'cap-b:' || e1, 30, false, now() - interval '4 minutes'),
         (e1, 'probe', 'routine_reminder', 'D', 'b', '/', true, 'cap-d:' || e1, 40, false, now() - interval '3 minutes'),
         (e1, 'probe', 'briefing',         'C', 'b', '/', true, 'cap-c:' || e1, 50, false, now() - interval '2 minutes'),
         (e1, 'probe', 'account_update',   'X', 'b', '/', true, 'cap-x:' || e1, 10, true,  now() - interval '1 minute');
  PERFORM public.claim_notification_dispatches(100);
  SELECT string_agg(title || '=' || status || coalesce('/' || skip_reason, ''), ' ' ORDER BY title) INTO r FROM public.notification_dispatches WHERE user_id = e1;
  IF r <> 'A=processing B=processing C=skipped/daily_cap D=processing X=processing' THEN
    RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: cap 2 outcome %', r; END IF; n := n + 1;
  -- cap 0 holds back everything that is not bypass_caps, including the priority classes
  UPDATE public.notification_preferences SET daily_cap = 0 WHERE user_id = e1;
  INSERT INTO public.notification_dispatches (user_id, source, category, title, body, url, push_wanted, idempotency_key, priority, bypass_caps, scheduled_at)
  VALUES (e1, 'probe', 'routine_reminder', 'R0', 'b', '/', true, 'cap-r0:' || e1, 30, false, now() - interval '5 minutes'),
         (e1, 'probe', 'service',          'S0', 'b', '/', true, 'cap-s0:' || e1, 30, false, now() - interval '5 minutes'),
         (e1, 'probe', 'account_update',   'X0', 'b', '/', true, 'cap-x0:' || e1, 10, true,  now() - interval '5 minutes');
  PERFORM public.claim_notification_dispatches(100);
  SELECT string_agg(title || '=' || status || coalesce('/' || skip_reason, ''), ' ' ORDER BY title) INTO r FROM public.notification_dispatches WHERE user_id = e1 AND title IN ('R0', 'S0', 'X0');
  IF r <> 'R0=skipped/daily_cap S0=skipped/daily_cap X0=processing' THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: cap 0 outcome %', r; END IF; n := n + 1;
  -- a priority row after the cap is spent on optional ones still goes out
  UPDATE public.notification_preferences SET daily_cap = 1 WHERE user_id = e1;
  INSERT INTO public.notification_dispatches (user_id, source, category, title, body, url, push_wanted, idempotency_key, priority, bypass_caps, scheduled_at)
  VALUES (e1, 'probe', 'routine_reminder', 'LATE', 'b', '/', true, 'cap-late:' || e1, 40, false, now() - interval '1 minute'),
         (e1, 'probe', 'skin_weather',     'LATEW', 'b', '/', true, 'cap-latew:' || e1, 30, false, now() - interval '2 minutes');
  PERFORM public.claim_notification_dispatches(100);
  SELECT string_agg(title || '=' || status || coalesce('/' || skip_reason, ''), ' ' ORDER BY title) INTO r FROM public.notification_dispatches WHERE user_id = e1 AND title IN ('LATE', 'LATEW');
  IF r <> 'LATE=processing LATEW=skipped/daily_cap' THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: priority-after-cap outcome %', r; END IF; n := n + 1;

  -- ---------- podcast announce is once per episode ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM public.admin_announce_podcast_episode('probe-episode', 'Probe', jsonb_build_object('user_ids', jsonb_build_array(v_admin::text)));
  v_raised := false;
  BEGIN PERFORM public.admin_announce_podcast_episode('probe-episode', 'Probe', jsonb_build_object('user_ids', jsonb_build_array(v_admin::text)));
  EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'This episode has already been announced'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_FAILED: the same episode was announced twice'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'NOTIFICATION_AUTOMATIONS_TEST_PASSED: % assertions (rolled back)', n;
END $$;
