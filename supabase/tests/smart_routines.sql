-- Rolled-back probe: Smart Routines (20260928170000_skynn_v21_smart_routines.sql).
-- Access only after a (non-rejected) Advanced AI Dermatology Analysis
-- submission; the RPC is the only write path; manual steps are kept; default
-- seeded steps don't count as activation; analytics user_id can't be spoofed.
-- Also (20260928180000): check-in history survives a rebuild, ticked starter
-- steps are adopted, a routine missing a key is rejected.
-- Always raises, so nothing is kept. Passed live 2026-09-28 (20 assertions).
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid();
  v_def uuid; v_sid uuid; v_id uuid; v_id2 uuid; v_cleanse uuid; v_ticked uuid; v_cnt int; n int := 0; v_raised boolean; v_msg text;
  v_routine jsonb := '{"source":"rule_based","engineVersion":"smart-routine-1.0.0","season":"spring",
    "am":[{"step":"Cleanse","productType":"Gentle cleanser","productSlug":null,"productName":null,"guidance":"g","why":"w","fromShelf":false},
          {"step":"Protect","productType":"SPF","productSlug":"x","productName":"Brand SPF","guidance":"g","why":"w","fromShelf":false}],
    "pm":[{"step":"Moisturise","productType":"Moisturiser","productSlug":null,"productName":null,"guidance":"g","why":"w","fromShelf":false}],
    "weekly":[],"notes":[]}';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sr-a-' || v_a || '@example.invalid', '', now(), now(), '{}', '{}'),
         (v_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sr-b-' || v_b || '@example.invalid', '', now(), now(), '{}', '{}');
  INSERT INTO public.routine_steps (user_id, step_name, product_name, time_of_day, sort_order, source) VALUES
    (v_a, 'My toner', 'Rose water', 'am', 0, 'manual'),
    (v_a, 'Cleanser', NULL, 'both', 1, 'default'),
    (v_a, 'Serum', NULL, 'both', 2, 'default');
  SELECT id INTO v_ticked FROM public.routine_steps WHERE user_id = v_a AND step_name = 'Serum';
  INSERT INTO public.routine_checkins (user_id, step_id, time_slot) VALUES (v_a, v_ticked, 'am');

  IF public.is_trial_activated(v_b) THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: activated with no steps'; END IF;
  INSERT INTO public.routine_steps (user_id, step_name, time_of_day, sort_order, source) VALUES (v_b, 'Cleanser', 'both', 0, 'default');
  IF public.is_trial_activated(v_b) THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: default step counted as activation'; END IF; n := n + 1;

  SELECT id INTO v_def FROM public.assessment_definitions WHERE version = '2026.2';
  INSERT INTO public.advanced_assessment_sessions (user_id, assessment_definition_id, assessment_version, question_library_version, scoring_rules_version, status)
  VALUES (v_a, v_def, '2026.2', '2026.2', 'probe', 'submitted') RETURNING id INTO v_sid;
  INSERT INTO public.advanced_assessment_reports (session_id, user_id, generation_status, processing_mode, intake_status, reference_number)
  VALUES (v_sid, v_a, 'pending', 'fallback', 'pending', 'SKYNN-ADV-20260928-PRB2SR');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF public.get_smart_routine_access() THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: B has access'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.save_smart_routine(v_routine, NULL, NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT; v_raised := v_msg = 'smart_routine_locked'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: B saved without a submission (%)', v_msg; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.smart_routines (user_id, source, engine_version, routine) VALUES (v_b, 'rule_based', 'x', '{}');
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: direct insert allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN INSERT INTO public.analytics_events (event_name, payload, user_id) VALUES ('probe', '{}', v_a);
  EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: spoofed analytics user_id accepted'; END IF; n := n + 1;
  INSERT INTO public.analytics_events (event_name, payload, user_id) VALUES ('probe', '{}', v_b); n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.get_smart_routine_access() THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: A has no access'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.save_smart_routine('{"source":"rule_based","am":"x","pm":[]}', NULL, NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT; v_raised := v_msg = 'invalid_routine'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: invalid routine accepted'; END IF; n := n + 1;
  v_id := public.save_smart_routine(v_routine, NULL, v_sid);
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND source = 'smart';
  IF v_cnt <> 3 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: expected 3 smart steps, got %', v_cnt; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND source = 'manual';
  IF v_cnt <> 2 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: manual steps wrong (%)', v_cnt; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND source = 'default';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: default steps not replaced'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND id = v_ticked AND source = 'manual';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: ticked starter step not adopted'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.save_smart_routine('{"source":"rule_based","am":[{"step":"x"}]}', NULL, NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT; v_raised := v_msg = 'invalid_routine'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: routine without pm accepted (%)', v_msg; END IF; n := n + 1;
  SELECT id INTO v_cleanse FROM public.routine_steps WHERE user_id = v_a AND source = 'smart' AND step_name = 'Cleanse';
  INSERT INTO public.routine_checkins (user_id, step_id, time_slot) VALUES (v_a, v_cleanse, 'am');
  -- Rebuild with Protect dropped and a new step added: Cleanse keeps its check-in.
  v_id2 := public.save_smart_routine(replace(v_routine::text, '"step": "Protect"', '"step": "Sunscreen"')::jsonb, NULL, v_sid);
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND source = 'smart';
  IF v_id2 <> v_id OR v_cnt <> 3 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: rebuild duplicated'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE id = v_cleanse AND source = 'smart';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: kept step was recreated'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_checkins WHERE step_id = v_cleanse;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: rebuild erased check-ins'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.routine_steps WHERE user_id = v_a AND source = 'smart' AND step_name = 'Protect';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: dropped step kept'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.smart_routines WHERE user_id = v_a AND advanced_session_id = v_sid;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: routine not readable by owner'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_cnt FROM public.smart_routines WHERE user_id = v_a;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: B read A''s routine'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  UPDATE public.advanced_assessment_reports SET intake_status = 'rejected' WHERE session_id = v_sid;
  IF public.has_smart_routine_access(v_a) THEN RAISE EXCEPTION 'SMART_ROUTINE_TEST_FAILED: rejected submission grants access'; END IF; n := n + 1;

  RAISE EXCEPTION 'SMART_ROUTINE_TESTS_PASSED (% assertions)', n;
END $$;
