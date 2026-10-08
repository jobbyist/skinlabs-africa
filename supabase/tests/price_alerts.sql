-- Rolled-back probe: price alerts + sa_price_stats_30d (20261008240000). Always raises, so nothing is kept.
DO $$
DECLARE
  v_a uuid := gen_random_uuid(); v_b uuid := gen_random_uuid();
  v_slug text; v_price numeric; v_res jsonb; v_raised boolean; n int := 0; v_cnt int;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  SELECT x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pa-' || x || '@example.invalid', '', now(), now(), '{}', '{}'
    FROM unnest(ARRAY[v_a, v_b]) x;
  SELECT s.product_slug, s.price_zar INTO v_slug, v_price FROM public.sa_retail_prices s
    JOIN public.review_price_targets t ON t.review_id = s.product_slug LIMIT 1;
  IF v_slug IS NULL THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_SKIPPED: no verified public price to test with (probe rolled back)'; END IF;

  EXECUTE 'SET LOCAL ROLE anon';
  v_raised := false;
  BEGIN PERFORM public.set_price_alert(v_slug, 'Probe', 100); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: anon may set alerts'; END IF; n := n + 1;
  PERFORM 1 FROM public.sa_price_stats_30d(v_slug); n := n + 1;  -- anon may read aggregates
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_raised := false;
  BEGIN PERFORM public.set_price_alert(v_slug, 'Probe', 0); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'invalid_target'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: zero target allowed'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.set_price_alert('no-such-product-xyz', 'Probe', 100); EXCEPTION WHEN OTHERS THEN v_raised := SQLERRM = 'unknown_product'; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: unknown product allowed'; END IF; n := n + 1;
  v_res := public.set_price_alert(v_slug, 'Probe product', v_price + 50);
  IF (v_res->>'already_met')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: already_met not reported'; END IF; n := n + 1;
  -- direct writes refused, own rows readable, other member sees nothing
  v_raised := false;
  BEGIN INSERT INTO public.price_alerts (user_id, product_slug, product_name, target_price_zar) VALUES (v_a, v_slug, 'x', 10); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: direct insert allowed'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.price_alerts; IF v_cnt <> 1 THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: own alert not readable'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_cnt FROM public.price_alerts; IF v_cnt <> 0 THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: another member can read alerts'; END IF; n := n + 1;
  v_raised := false;
  BEGIN PERFORM public.evaluate_price_alerts(); EXCEPTION WHEN insufficient_privilege THEN v_raised := true; END;
  IF NOT v_raised THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: member may run the evaluator'; END IF; n := n + 1;
  EXECUTE 'RESET ROLE';

  -- evaluator fires once, marks triggered, enqueues one notification, and the preference was switched on
  IF NOT (SELECT price_alert FROM public.notification_preferences WHERE user_id = v_a) THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: category not enabled'; END IF; n := n + 1;
  PERFORM public.evaluate_price_alerts();
  IF (SELECT status FROM public.price_alerts WHERE user_id = v_a) <> 'triggered' THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: not triggered'; END IF; n := n + 1;
  SELECT count(*) INTO v_cnt FROM public.notification_dispatches WHERE user_id = v_a AND template_key = 'price_alert_hit';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: expected 1 dispatch, got %', v_cnt; END IF; n := n + 1;
  PERFORM public.evaluate_price_alerts();
  SELECT count(*) INTO v_cnt FROM public.notification_dispatches WHERE user_id = v_a AND template_key = 'price_alert_hit';
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'PRICE_ALERT_TEST_FAILED: duplicate dispatch'; END IF; n := n + 1;

  RAISE EXCEPTION 'PRICE_ALERT_TESTS_PASSED % assertions (rolled back)', n;
END $$;
