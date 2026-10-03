-- is_member / is_professional_account / is_profile_complete / admin_list_feature_waitlist probe.
-- One DO block that ALWAYS ends by raising, so everything rolls back (safe on production).
--   Success -> ERROR:  RESTRICTED_STATUS_FUNCTIONS_TESTS_PASSED (n assertions)
DO $$
DECLARE
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  r boolean;
  n int := 0;
  v_rows int;
BEGIN
  EXECUTE 'RESET ROLE';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rsf-probe-' || x || '@example.invalid', '', now(), now(), '{}'::jsonb, '{}'::jsonb
  FROM (VALUES (v_a), (v_b)) AS t(x);
  INSERT INTO public.profiles (user_id, email) VALUES (v_a, 'a@example.invalid'), (v_b, 'b@example.invalid') ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.profiles SET subscription_status = 'insider', is_professional = true, username = 'rsfprobe', full_name = 'Probe', date_of_birth = '1990-01-01', skin_color = 'x' WHERE user_id = v_b;

  -- service role / internal callers still see anyone
  IF NOT public.is_member(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: internal caller cannot read membership'; END IF;
  IF NOT public.is_profile_complete(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: internal caller cannot read completeness'; END IF;
  n := n + 2;

  -- a signed-in client sees itself, not others
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF public.is_member(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: authenticated read another member status'; END IF;
  IF public.is_professional_account(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: authenticated read another professional flag'; END IF;
  IF public.is_profile_complete(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: authenticated read another profile completeness'; END IF;
  n := n + 3;
  r := public.is_member(v_a);
  IF r IS NOT FALSE THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: own status wrong'; END IF;
  n := n + 1;

  -- a member still sees their own status
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT public.is_member(v_b) OR NOT public.is_professional_account(v_b) OR NOT public.is_profile_complete(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: member cannot read own status'; END IF;
  n := n + 1;

  -- anon gets nothing about anyone (is_member / is_professional_account aren't executable by anon at all)
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  EXECUTE 'SET LOCAL ROLE anon';
  IF public.is_profile_complete(v_b) THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: anon read completeness'; END IF;
  n := n + 1;

  -- non-admin cannot list the feature waitlist
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    PERFORM * FROM public.admin_list_feature_waitlist();
    RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: non-admin listed the waitlist';
  EXCEPTION WHEN insufficient_privilege THEN
    n := n + 1;
  END;

  -- admin can, and gets the member's email
  EXECUTE 'RESET ROLE';
  INSERT INTO public.user_roles (user_id, role) VALUES (v_a, 'admin');
  INSERT INTO public.feature_waitlist (user_id, feature_key) VALUES (v_b, 'dermatologist_messaging');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_rows FROM public.admin_list_feature_waitlist('dermatologist_messaging') w WHERE w.user_id = v_b AND w.email LIKE 'rsf-probe-%';
  IF v_rows <> 1 THEN RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TEST_FAILED: admin waitlist read returned % rows', v_rows; END IF;
  n := n + 1;

  EXECUTE 'RESET ROLE';
  RAISE EXCEPTION 'RESTRICTED_STATUS_FUNCTIONS_TESTS_PASSED (% assertions)', n;
END $$;
