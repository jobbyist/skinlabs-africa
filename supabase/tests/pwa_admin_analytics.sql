-- Rolled-back probe: admin_pwa_overview + the 'App & PWA' category (20261005110000_admin_pwa_analytics.sql).
-- anon / non-admin are refused; an admin sees counts by device, platform and browser, funnel stages and
-- the new category; non-PWA events are excluded from the PWA overview. Always raises, so nothing is kept.
DO $$
DECLARE
  v_admin uuid := gen_random_uuid(); v_user uuid := gen_random_uuid();
  v_res jsonb; v_cat jsonb; n int := 0; v_raised boolean;
  pl jsonb := '{"platform":"ios","browser":"safari","device_type":"phone","display_mode":"standalone"}';
  an jsonb := '{"platform":"android","browser":"chrome","device_type":"phone","display_mode":"browser","kind":"native"}';
  dk jsonb := '{"platform":"windows","browser":"edge","device_type":"desktop","display_mode":"browser"}';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pa-a-' || v_admin || '@example.invalid', '', now(), now(), '{}', '{}'),
         (v_user,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pa-u-' || v_user  || '@example.invalid', '', now(), now(), '{}', '{}');
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin');

  -- snapshot of what is already there, so the probe is valid on a live database too
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_res := public.admin_pwa_overview(30);
  EXECUTE 'RESET ROLE';
  CREATE TEMP TABLE _before ON COMMIT DROP AS SELECT v_res AS r;

  INSERT INTO public.analytics_events (event_name, payload, path) VALUES
    ('pwa_install_prompt_viewed', an, '/'), ('pwa_install_prompt_viewed', an, '/'), ('pwa_install_prompt_viewed', dk, '/'),
    ('pwa_install_started', an, '/'), ('pwa_install_accepted', an, '/'),
    ('pwa_installed', an || '{"source":"appinstalled"}', '/'), ('pwa_installed', pl || '{"source":"first_launch"}', '/start'), ('pwa_installed', dk, '/'),
    ('pwa_launch', pl, '/start'), ('pwa_launch', pl, '/start'), ('pwa_launch', an, '/start'),
    ('push_subscribed', pl, '/dashboard'), ('podcast_download_completed', an, '/podcast'), ('podcast_offline_play', an, '/podcast/x'),
    ('pricing_view', '{}', '/pricing');   -- not a PWA event: must be excluded

  -- anon / non-admin refused
  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM public.admin_pwa_overview(30); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: anon not refused'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.admin_pwa_overview(30); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: non-admin not refused'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.admin_events_overview(30); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: non-admin could call admin_events_overview'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- admin: deltas versus the snapshot
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_res := public.admin_pwa_overview(30);
  v_cat := public.admin_events_overview(30);
  EXECUTE 'RESET ROLE';

  IF (v_res #>> '{totals,installs}')::int - (SELECT (r #>> '{totals,installs}')::int FROM _before) <> 3 THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: installs delta'; END IF; n := n + 1;
  IF (v_res #>> '{totals,launches}')::int - (SELECT (r #>> '{totals,launches}')::int FROM _before) <> 3 THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: launches delta'; END IF; n := n + 1;
  IF (v_res #>> '{totals,prompts_viewed}')::int - (SELECT (r #>> '{totals,prompts_viewed}')::int FROM _before) <> 3 THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: prompts delta'; END IF; n := n + 1;
  IF (v_res #>> '{totals,events}')::int - (SELECT (r #>> '{totals,events}')::int FROM _before) <> 14 THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: non-PWA event leaked into the PWA overview'; END IF; n := n + 1;

  -- breakdowns carry the device tokens
  IF coalesce((SELECT (x ->> 'count')::int FROM jsonb_array_elements(v_res -> 'installs_by_platform') x WHERE x ->> 'label' = 'ios'), 0)
     - coalesce((SELECT (x ->> 'count')::int FROM _before, jsonb_array_elements(r -> 'installs_by_platform') x WHERE x ->> 'label' = 'ios'), 0) <> 1 THEN
    RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: ios installs'; END IF; n := n + 1;
  IF coalesce((SELECT (x ->> 'count')::int FROM jsonb_array_elements(v_res -> 'installs_by_device') x WHERE x ->> 'label' = 'desktop'), 0)
     - coalesce((SELECT (x ->> 'count')::int FROM _before, jsonb_array_elements(r -> 'installs_by_device') x WHERE x ->> 'label' = 'desktop'), 0) <> 1 THEN
    RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: desktop installs'; END IF; n := n + 1;
  IF coalesce((SELECT (x ->> 'count')::int FROM jsonb_array_elements(v_res -> 'launches_by_platform') x WHERE x ->> 'label' = 'ios'), 0)
     - coalesce((SELECT (x ->> 'count')::int FROM _before, jsonb_array_elements(r -> 'launches_by_platform') x WHERE x ->> 'label' = 'ios'), 0) <> 2 THEN
    RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: ios launches'; END IF; n := n + 1;
  IF jsonb_array_length(v_res -> 'install_funnel') <> 4 THEN RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: funnel stages'; END IF; n := n + 1;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_res -> 'by_event') x WHERE x ->> 'event_name' = 'pricing_view') THEN n := n + 1;
  ELSE RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: pricing_view listed as a PWA event'; END IF;

  -- the generic events overview files these under their own category
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_cat -> 'by_category') x WHERE x ->> 'category' = 'App & PWA') THEN
    RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: App & PWA category missing'; END IF; n := n + 1;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_cat -> 'by_event') x WHERE x ->> 'event_name' = 'pwa_installed' AND x ->> 'category' <> 'App & PWA') THEN
    RAISE EXCEPTION 'PWA_ADMIN_TEST_FAILED: pwa_installed miscategorised'; END IF; n := n + 1;

  RAISE EXCEPTION 'PWA_ADMIN_ANALYTICS_PASSED (% assertions; rolled back)', n;
END $$;
