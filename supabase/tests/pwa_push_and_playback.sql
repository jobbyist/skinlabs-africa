-- Rolled-back probe: 20261005100000_pwa_push_and_playback.sql
-- Push subscriptions (RPC-only writes, no secret columns for clients, per-user RLS, shared-device re-pointing,
-- device cap), notification preferences (marketing opt-in only) and cross-device playback progress
-- (a stale offline write never overwrites newer progress). Always raises, so nothing is kept.
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid();
  v_id uuid; v_n int; v_ok boolean; v_raised boolean; n int := 0; v_pos numeric; v_ts timestamptz;
  v_ep1 text := 'https://push.example.invalid/send/aaaaaaaaaaaaaaaaaaaa';
  v_ep2 text := 'https://push.example.invalid/send/bbbbbbbbbbbbbbbbbbbb';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pwa-a-' || v_a || '@example.invalid', '', now(), now(), '{}', '{}'),
         (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pwa-b-' || v_b || '@example.invalid', '', now(), now(), '{}', '{}');

  -- ---- anon cannot register or write progress ------------------------------------------------
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM public.register_push_subscription(v_ep1, 'p256dh-key-0123456789ab', 'auth-key-0123'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: anon could call register_push_subscription'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.upsert_podcast_progress('ep-1', 10, 100, now()); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: anon could call upsert_podcast_progress'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- ---- member A registers a device -----------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_id := public.register_push_subscription(v_ep1, 'p256dh-key-0123456789ab', 'auth-key-0123', 'android', 'chrome');
  IF v_id IS NULL THEN RAISE EXCEPTION 'PWA_TEST_FAILED: register returned null'; END IF; n := n + 1;

  -- invalid / non-https endpoints rejected
  v_raised := false;
  BEGIN PERFORM public.register_push_subscription('http://insecure.example.invalid/x', 'p256dh-key-0123456789ab', 'auth-key-0123'); EXCEPTION WHEN invalid_parameter_value THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: http endpoint accepted'; END IF; n := n + 1;

  -- the member can read non-secret metadata of their own device…
  SELECT count(*) INTO v_n FROM public.push_subscriptions;
  IF v_n <> 1 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: A sees % own devices, expected 1', v_n; END IF; n := n + 1;
  -- …but never the endpoint or keys
  v_raised := false;
  BEGIN PERFORM endpoint FROM public.push_subscriptions; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: client could read push endpoint'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM p256dh FROM public.push_subscriptions; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: client could read p256dh'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM auth FROM public.push_subscriptions; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: client could read auth secret'; END IF; n := n + 1;
  -- direct writes denied (RPC is the only path)
  v_raised := false;
  BEGIN INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (v_a, v_ep2, 'p256dh-key-0123456789ab', 'auth-key-0123'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: direct INSERT allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN UPDATE public.push_subscriptions SET is_active = true; EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: direct UPDATE allowed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- registering created default preferences: essentials on, marketing OFF
  SELECT (promotional, account_update, service, podcast_episode) = (false, true, true, false) INTO v_ok FROM public.notification_preferences WHERE user_id = v_a;
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: default preferences wrong'; END IF; n := n + 1;

  -- ---- member B cannot see A's device; B registering the SAME endpoint (shared device) re-points it ----
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_n FROM public.push_subscriptions;
  IF v_n <> 0 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: B can see A devices (%)', v_n; END IF; n := n + 1;
  v_raised := false;
  PERFORM public.unregister_push_subscription(v_ep1);   -- not B's: no-op, returns false
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO v_n FROM public.push_subscriptions WHERE endpoint = v_ep1 AND user_id = v_a;
  IF v_n <> 1 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: B removed A device'; END IF; n := n + 1;

  EXECUTE 'SET LOCAL ROLE authenticated';
  v_id := public.register_push_subscription(v_ep1, 'p256dh-key-NEWNEWNEWNEW', 'auth-key-NEW1', 'ios', 'safari');
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO v_n FROM public.push_subscriptions WHERE endpoint = v_ep1;
  IF v_n <> 1 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: duplicate endpoint rows (%)', v_n; END IF; n := n + 1;
  SELECT count(*) INTO v_n FROM public.push_subscriptions WHERE endpoint = v_ep1 AND user_id = v_b AND is_active AND platform = 'ios';
  IF v_n <> 1 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: shared device not re-pointed to B'; END IF; n := n + 1;

  -- B unregisters its device
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_ok := public.unregister_push_subscription(v_ep1);
  EXECUTE 'RESET ROLE';
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: own unregister returned false'; END IF; n := n + 1;

  -- ---- a member keeps at most 10 active devices ------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  FOR i IN 1..12 LOOP
    PERFORM public.register_push_subscription('https://push.example.invalid/send/device-' || lpad(i::text, 12, '0'), 'p256dh-key-0123456789ab', 'auth-key-0123');
  END LOOP;
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO v_n FROM public.push_subscriptions WHERE user_id = v_a AND is_active;
  IF v_n <> 10 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: % active devices, cap is 10', v_n; END IF; n := n + 1;

  -- ---- notification preferences: own row only, marketing opt-in is recorded ---------------------
  EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE public.notification_preferences SET podcast_episode = true, promotional = true WHERE user_id = v_a;
  EXECUTE 'RESET ROLE';
  SELECT promotional_opt_in_at IS NOT NULL INTO v_ok FROM public.notification_preferences WHERE user_id = v_a;
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: promotional opt-in not timestamped'; END IF; n := n + 1;
  EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE public.notification_preferences SET promotional = false WHERE user_id = v_a;
  EXECUTE 'RESET ROLE';
  SELECT promotional_opt_in_at IS NULL INTO v_ok FROM public.notification_preferences WHERE user_id = v_a;
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: opt-in timestamp not cleared'; END IF; n := n + 1;

  EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE public.notification_preferences SET briefing = true WHERE user_id = v_b;   -- someone else's row: 0 rows
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 0 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: A updated B preferences'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.notification_preferences (user_id, promotional) VALUES (v_b, true); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: client could supply user_id on preferences insert'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- ---- playback progress: newest client timestamp wins, stale offline writes are ignored ------------
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_ok := public.upsert_podcast_progress('ep-1', 120, 600, now() - interval '10 minutes');
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: first progress write not applied'; END IF; n := n + 1;
  v_ok := public.upsert_podcast_progress('ep-1', 300, 600, now() - interval '1 minute');
  IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: newer progress not applied'; END IF; n := n + 1;
  v_ok := public.upsert_podcast_progress('ep-1', 50, 600, now() - interval '5 minutes');   -- stale, from an offline device
  IF v_ok IS NOT FALSE THEN RAISE EXCEPTION 'PWA_TEST_FAILED: stale progress overwrote newer'; END IF; n := n + 1;
  SELECT position_seconds INTO v_pos FROM public.podcast_playback_progress WHERE episode_slug = 'ep-1';
  IF v_pos <> 300 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: position % <> 300', v_pos; END IF; n := n + 1;

  -- a wildly future device clock is clamped so it cannot win forever
  PERFORM public.upsert_podcast_progress('ep-2', 10, 100, now() + interval '30 days');
  SELECT client_updated_at INTO v_ts FROM public.podcast_playback_progress WHERE episode_slug = 'ep-2';
  IF v_ts > now() + interval '6 minutes' THEN RAISE EXCEPTION 'PWA_TEST_FAILED: future timestamp not clamped (%)', v_ts; END IF; n := n + 1;

  v_raised := false;
  BEGIN PERFORM public.upsert_podcast_progress('Bad Slug!', 1, 1, now()); EXCEPTION WHEN invalid_parameter_value THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: invalid slug accepted'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.podcast_playback_progress (user_id, episode_slug, position_seconds, client_updated_at) VALUES (v_a, 'ep-9', 1, now()); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_TEST_FAILED: direct progress INSERT allowed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_n FROM public.podcast_playback_progress;
  IF v_n <> 0 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: B can read A progress (%)', v_n; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- ---- account deletion cascades -----------------------------------------------------------------
  DELETE FROM auth.users WHERE id = v_a;
  SELECT (SELECT count(*) FROM public.push_subscriptions WHERE user_id = v_a)
       + (SELECT count(*) FROM public.notification_preferences WHERE user_id = v_a)
       + (SELECT count(*) FROM public.podcast_playback_progress WHERE user_id = v_a) INTO v_n;
  IF v_n <> 0 THEN RAISE EXCEPTION 'PWA_TEST_FAILED: % rows left after account deletion', v_n; END IF; n := n + 1;

  RAISE EXCEPTION 'PWA_PUSH_PLAYBACK_PASSED (% assertions; rolled back)', n;
END $$;
