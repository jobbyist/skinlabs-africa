-- Rolled-back probe: Community sidebar RPCs (20261009100000). Always raises, so nothing is kept.
-- "COMMUNITY_SIDEBAR_PASSED n" means every assertion held.
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_mod uuid := gen_random_uuid(); n int := 0; v_raised boolean; v_rows int; v_names text;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cs-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(ARRAY[v_a, v_mod]) x;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_mod, 'moderator');
  UPDATE public.profiles SET username = 'probe_member', username_generated = false, full_name = 'Pat Member' WHERE user_id = v_a;
  UPDATE public.profiles SET username = 'probe_mod', username_generated = false, full_name = 'Mona Moderator' WHERE user_id = v_mod;

  -- anon can call neither
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM * FROM public.community_overview(); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_SIDEBAR_FAILED: anon can read the overview'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM * FROM public.community_staff_list(); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'COMMUNITY_SIDEBAR_FAILED: anon can read staff'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- a member sees counts and the moderator as "Mona M." (never the full name or email)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_rows FROM public.community_overview() WHERE member_count >= 2 AND discussions_today >= 0 AND replies_today >= 0;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'COMMUNITY_SIDEBAR_FAILED: overview shape'; END IF; n := n + 1;
  SELECT string_agg(display_name || ':' || role, ',') INTO v_names FROM public.community_staff_list();
  IF v_names NOT LIKE '%Mona M.:moderator%' THEN RAISE EXCEPTION 'COMMUNITY_SIDEBAR_FAILED: staff list was %', v_names; END IF; n := n + 1;
  IF v_names LIKE '%Moderator%' OR v_names LIKE '%example.invalid%' THEN RAISE EXCEPTION 'COMMUNITY_SIDEBAR_FAILED: staff list leaks identity: %', v_names; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'COMMUNITY_SIDEBAR_PASSED %', n;
END $$;
