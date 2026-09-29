-- Server-side tests for the Basic AI Skin Analysis rolling allowance (SKYNN AI v2.1:
-- 1 per rolling 7 days for Explorer / Glow Lite, unlimited for Insider / VIP, never
-- spends an Analysis Pass)
-- (save_starter_analysis / get_formulator_allowance / protect_profile_privileged_columns).
--
-- Safe to run against any environment, including production: everything runs
-- inside one DO block that ALWAYS ends by raising an exception, so the whole
-- transaction (throwaway auth user, profile, rows, credits) is rolled back.
--   Success  -> ERROR:  FORMULATOR_TESTS_PASSED (n assertions)
--   Failure  -> ERROR:  FORMULATOR_TEST_FAILED: <which assertion>
-- Run with: Supabase SQL editor, psql, or mcp__Supabase__execute_sql.
DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_claims text;
  r record;
  n int := 0;
  v_raised boolean;
  v_msg text;
  v_hint text;

BEGIN
  -- ---------- setup (as the migration owner) ----------
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  VALUES (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'formulator-test-' || v_uid || '@example.invalid', '', now(), now(), '{}'::jsonb, '{}'::jsonb);
  -- handle_new_user() normally creates the profile; make sure one exists either way.
  INSERT INTO public.profiles (user_id, email) VALUES (v_uid, 'formulator-test@example.invalid')
  ON CONFLICT (user_id) DO NOTHING;

  v_claims := json_build_object('sub', v_uid, 'role', 'authenticated')::text;
  PERFORM set_config('request.jwt.claims', v_claims, true);
  PERFORM set_config('request.jwt.claim.sub', v_uid::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- ---------- 1. Explorer, never analysed: 1 free ----------
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.tier <> 'explorer' OR r.unlimited OR r.free_remaining <> 1 OR r.next_unlock_at IS NOT NULL THEN
    RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: fresh explorer should have 1 free (%)', row_to_json(r);
  END IF; n := n + 1;

  SELECT * INTO r FROM public.save_starter_analysis('test-a', 'oily', ARRAY['acne'], 'rec', '{"x":1}'::jsonb);
  IF r.source <> 'free_allowance' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: first save should use free allowance, got %', r.source; END IF; n := n + 1;

  -- ---------- 2. Same analysis re-saved (refinement) is never charged ----------
  SELECT * INTO r FROM public.save_starter_analysis('test-a', 'oily', ARRAY['acne','pores'], 'rec v2', '{"x":2}'::jsonb);
  IF r.source <> 'existing' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: re-save should be idempotent, got %', r.source; END IF; n := n + 1;

  -- ---------- 3. Second analysis inside the window is rejected server-side ----------
  v_raised := false;
  BEGIN
    PERFORM public.save_starter_analysis('test-b', 'dry', ARRAY['dryness'], 'rec', '{"x":3}'::jsonb);
  EXCEPTION WHEN raise_exception THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT;
    v_raised := v_msg = 'formulator_limit_reached' AND v_hint = 'formulator_limit_reached';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: second analysis in window must be rejected'; END IF; n := n + 1;

  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.free_remaining <> 0 OR r.next_unlock_at IS NULL
     OR abs(extract(epoch FROM (r.next_unlock_at - (r.last_free_analysis_at + interval '7 days')))) > 1 THEN
    RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: locked status wrong (%)', row_to_json(r);
  END IF; n := n + 1;

  -- ---------- 4. Client cannot reset its own window ----------
  -- Column-level grants already deny this (42501); the protect trigger is the
  -- second line of defence if a future migration ever broadens the grant.
  BEGIN
    UPDATE public.profiles SET last_free_analysis_at = now() - interval '400 days' WHERE user_id = v_uid;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.free_remaining <> 0 THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: client managed to reset last_free_analysis_at'; END IF; n := n + 1;

  -- ---------- 5. 7-day boundary ----------
  -- Setup writes below run as the owner with app.privileged_write on; the JWT
  -- claims are still set, so without it the protect trigger would silently
  -- revert them and the assertions would pass vacuously.
  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET last_free_analysis_at = now() - interval '7 days' + interval '1 minute' WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.free_remaining <> 0 THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: 6d23h59m should still be locked'; END IF; n := n + 1;

  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET last_free_analysis_at = now() - interval '7 days' WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO r FROM public.save_starter_analysis('test-c', 'dry', ARRAY['dryness'], 'rec', '{"x":4}'::jsonb);
  IF r.source <> 'free_allowance' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: exactly 7 days should unlock, got %', r.source; END IF; n := n + 1;

  -- ---------- 6. A locked user holding an Analysis Pass is still refused, and keeps the Pass ----------
  -- (Basic AI Skin Analysis never spends an Analysis Pass — Passes are for the
  -- Advanced AI Dermatology Analysis only.)
  EXECUTE 'RESET ROLE';
  INSERT INTO public.ai_credit_transactions (user_id, delta, reason) VALUES (v_uid, 1, 'test:grant');
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN
    PERFORM public.save_starter_analysis('test-d', 'combination', ARRAY['pores'], 'rec', '{"x":5}'::jsonb);
  EXCEPTION WHEN raise_exception THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_raised := v_msg = 'formulator_limit_reached';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: locked Basic save must not fall back to a Pass'; END IF; n := n + 1;
  IF public.available_ai_credits(v_uid) <> 1 THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: Analysis Pass was spent on a Basic analysis'; END IF; n := n + 1;

  -- ---------- 6b. A failed save (invalid payload) does not use up the allowance ----------
  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET last_free_analysis_at = now() - interval '8 days' WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    PERFORM public.save_starter_analysis('test-bad', 'oily', ARRAY['acne'], 'rec', NULL);
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.free_remaining <> 1 THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: a failed save consumed the weekly allowance'; END IF; n := n + 1;
  SELECT * INTO r FROM public.save_starter_analysis('test-d2', 'combination', ARRAY['pores'], 'rec', '{"x":5}'::jsonb);
  IF r.source <> 'free_allowance' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: allowance should be available after a failed save'; END IF; n := n + 1;

  -- ---------- 7. Glow Lite trial stays on the free allowance ----------
  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET subscription_status = 'trial', trial_plan = 'glow_lite', trial_started_at = now(), trial_ends_at = now() + interval '5 days' WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.tier <> 'glow_lite' OR r.unlimited OR r.free_remaining <> 0 THEN
    RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: glow_lite trial should be limited (%)', row_to_json(r);
  END IF; n := n + 1;

  -- ---------- 8. Insider (and an Insider trial) is unlimited ----------
  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET subscription_status = 'insider', subscription_started_at = now(), trial_plan = NULL, trial_ends_at = NULL WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO r FROM public.save_starter_analysis('test-e', 'normal', ARRAY['dullness'], 'rec', '{"x":6}'::jsonb);
  IF r.source <> 'membership' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: insider should be unlimited, got %', r.source; END IF; n := n + 1;
  SELECT * INTO r FROM public.save_starter_analysis('test-f', 'normal', ARRAY['dullness'], 'rec', '{"x":7}'::jsonb);
  IF r.source <> 'membership' THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: insider 2nd save should be unlimited'; END IF; n := n + 1;

  EXECUTE 'RESET ROLE';
  PERFORM set_config('app.privileged_write', 'on', true);
  UPDATE public.profiles SET subscription_status = 'vip' WHERE user_id = v_uid;
  PERFORM set_config('app.privileged_write', 'off', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT * INTO r FROM public.get_formulator_allowance();
  IF r.tier <> 'vip' OR NOT r.unlimited THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: vip should be unlimited'; END IF; n := n + 1;

  -- ---------- 9. Input validation ----------
  v_raised := false;
  BEGIN
    PERFORM public.save_starter_analysis('test-g', 'oily', ARRAY['acne'], 'rec', '{}'::jsonb,
      p_photo_storage_path => gen_random_uuid()::text || '/someone-else.jpg');
  EXCEPTION WHEN raise_exception THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: foreign photo path accepted'; END IF; n := n + 1;

  -- ---------- 10. An account with no profiles row cannot save free analyses ----------
  EXECUTE 'RESET ROLE';
  DELETE FROM public.profiles WHERE user_id = v_uid;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN
    PERFORM public.save_starter_analysis('test-h', 'oily', ARRAY['acne'], 'rec', '{"x":8}'::jsonb);
  EXCEPTION WHEN raise_exception THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    v_raised := v_msg = 'profile_missing';
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: save without a profile row must be refused'; END IF; n := n + 1;

  -- ---------- 11. MST can only ever be user_reported ----------
  EXECUTE 'RESET ROLE';
  v_raised := false;
  BEGIN
    INSERT INTO public.skincare_recommendations (user_id, skin_type, concerns, recommendation, status, mst_tone, mst_source)
    VALUES (v_uid, 'oily', ARRAY['acne'], 'x', 'delivered', 5, 'model_estimated');
  EXCEPTION WHEN check_violation THEN v_raised := true;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'FORMULATOR_TEST_FAILED: mst_source model_estimated accepted'; END IF; n := n + 1;

  RAISE EXCEPTION 'FORMULATOR_TESTS_PASSED (% assertions)', n;
END;
$$;
