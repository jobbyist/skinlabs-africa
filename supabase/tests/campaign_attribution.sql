-- Rolled-back probe: admin_campaign_attribution (20261004130000_campaign_attribution.sql).
-- Non-admin and anon are refused; an admin sees DISTINCT-session counts per campaign + ad, organic rows are ignored.
-- Always raises, so nothing is kept.
DO $$
DECLARE
  v_admin uuid := gen_random_uuid(); v_user uuid := gen_random_uuid();
  v_res jsonb; v_row jsonb; n int := 0; v_raised boolean;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ca-a-' || v_admin || '@example.invalid', '', now(), now(), '{}', '{}'),
         (v_user,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ca-u-' || v_user  || '@example.invalid', '', now(), now(), '{}', '{}');
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin');

  -- campaign probe_c / ad v1: 2 sessions land, one fires landing twice; s1 starts+completes analysis and signs up; s1 also a trial
  INSERT INTO public.analytics_events (event_name, payload, path) VALUES
    ('campaign_landing',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001"}', '/'),
    ('campaign_landing',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001"}', '/'),
    ('campaign_landing',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0002"}', '/'),
    ('analysis_started',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001"}', '/skynn-ai'),
    ('analysis_generated', '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001"}', '/skynn-ai'),
    ('signup_completed',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001","method":"email"}', '/skynn-ai'),
    ('trial_started',      '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v1","attr_sid":"as_probe0001"}', '/welcome'),
    ('campaign_landing',   '{"utm_source":"tiktok","utm_medium":"paid_social","utm_campaign":"probe_c","utm_content":"v2","attr_sid":"as_probe0003"}', '/'),
    ('signup_completed',   '{"method":"email"}', '/');   -- organic: no utm_campaign, must be ignored

  -- anon refused
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM public.admin_campaign_attribution(30); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: anon not refused'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- non-admin refused
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.admin_campaign_attribution(30); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: non-admin not refused'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- admin sees correct, de-duplicated counts
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_res := public.admin_campaign_attribution(30);
  EXECUTE 'RESET ROLE';

  SELECT r INTO v_row FROM jsonb_array_elements(v_res -> 'by_campaign') r
   WHERE r ->> 'utm_campaign' = 'probe_c' AND r ->> 'utm_content' = 'v1';
  IF v_row IS NULL THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: probe_c/v1 row missing'; END IF; n := n + 1;
  IF (v_row ->> 'landings')::int <> 2 THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: landings % <> 2 (distinct sessions)', v_row ->> 'landings'; END IF; n := n + 1;
  IF (v_row ->> 'analysis_started')::int <> 1 OR (v_row ->> 'analysis_completed')::int <> 1 THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: analysis counts %', v_row; END IF; n := n + 1;
  IF (v_row ->> 'signups')::int <> 1 OR (v_row ->> 'trials')::int <> 1 THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: signup/trial counts %', v_row; END IF; n := n + 1;

  SELECT r INTO v_row FROM jsonb_array_elements(v_res -> 'by_campaign') r
   WHERE r ->> 'utm_campaign' = 'probe_c' AND r ->> 'utm_content' = 'v2';
  IF v_row IS NULL OR (v_row ->> 'landings')::int <> 1 OR (v_row ->> 'signups')::int <> 0 THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: probe_c/v2 %', v_row; END IF; n := n + 1;

  -- organic signup must not appear anywhere (no row without a campaign)
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_res -> 'by_campaign') r WHERE r ->> 'utm_campaign' IS NULL) THEN
    RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: organic row leaked in'; END IF; n := n + 1;

  -- window is clamped to 1..90
  IF (public.admin_campaign_attribution(9999) ->> 'window_days')::int <> 90 THEN RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_FAILED: clamp'; END IF; n := n + 1;

  RAISE EXCEPTION 'CAMPAIGN_ATTR_TEST_PASSED % assertions (rolled back)', n;
END $$;
