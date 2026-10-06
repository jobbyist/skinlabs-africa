-- Rolled-back probe: giveaway entries (20261006100000_giveaway_entries.sql). Always raises, so nothing is kept.
DO $$
DECLARE
  v_admin uuid := gen_random_uuid(); v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid();
  v_res jsonb; n int := 0; v_raised boolean; v_cnt int; v_c text := 'skinlabs_october_2026_giveaway';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gw-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(ARRAY[v_admin, v_a, v_b]) x;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin');
  -- member A has a delivered saved analysis, member B has none
  INSERT INTO public.skincare_recommendations (user_id, skin_type, concerns, status, recommendation, result_payload)
  VALUES (v_a, 'oily', ARRAY['acne'], 'delivered', 'probe', '{"probe":true}');

  -- anon cannot call
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM public.enter_giveaway(v_c, 'abc', true, 'v1'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: anon not refused'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- member B (no analysis) refused
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.enter_giveaway(v_c, 'abc', true, 'v1'); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'assessment_required'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: entry without analysis allowed'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- member A: bad inputs refused
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.enter_giveaway(v_c, 'abc', false, 'v1'); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'confirmation_required'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: unconfirmed entry allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.enter_giveaway(v_c, 'a b!', true, 'v1'); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'invalid_handle'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: bad handle allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.enter_giveaway('other_campaign', 'abc', true, 'v1'); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'unknown_campaign'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: unknown campaign allowed'; END IF; n := n + 1;

  -- valid entry (leading @ stripped), then a repeat is idempotent and can correct the handle
  v_res := public.enter_giveaway(v_c, '@Glow.Fan', true, 'v1');
  IF (v_res ->> 'already_entered')::boolean OR v_res ->> 'status' <> 'submitted' THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: first entry %', v_res; END IF; n := n + 1;
  v_res := public.enter_giveaway(v_c, 'glow_fan2', true, 'v1');
  IF NOT (v_res ->> 'already_entered')::boolean THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: repeat created a 2nd entry'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  SELECT count(*) INTO v_cnt FROM public.giveaway_entries WHERE user_id = v_a;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: % entries for one member', v_cnt; END IF; n := n + 1;
  IF (SELECT tiktok_handle FROM public.giveaway_entries WHERE user_id = v_a) <> 'glow_fan2' THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: handle not corrected'; END IF; n := n + 1;
  EXECUTE 'SET LOCAL ROLE authenticated';

  v_raised := false;
  BEGIN INSERT INTO public.giveaway_entries (campaign, user_id, tiktok_handle, terms_version) VALUES (v_c, v_a, 'zz', 'v1'); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: direct insert allowed'; END IF; n := n + 1;
  UPDATE public.giveaway_entries SET status = 'winner' WHERE campaign = v_c;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: member updated own status'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.admin_giveaway_entries(v_c); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: non-admin saw the review list'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- admin sees the entry with the email
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_cnt FROM public.admin_giveaway_entries(v_c) WHERE email LIKE 'gw-%' AND tiktok_handle = 'glow_fan2';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'GIVEAWAY_TEST_FAILED: admin list %', v_cnt; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'GIVEAWAY_TEST_PASSED: % assertions (rolled back)', n;
END $$;
