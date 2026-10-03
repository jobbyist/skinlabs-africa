-- Retailer price pipeline probe (growth engine). Safe on any environment, including
-- production: one DO block that ALWAYS ends by raising, so every row it creates
-- (a listing and its prices on an existing variant) is rolled back.
--   Success  -> ERROR:  RETAILER_PRICE_TESTS_PASSED (n assertions)
--   Failure  -> ERROR:  RETAILER_PRICE_TEST_FAILED: <which assertion>
DO $$
DECLARE
  n int := 0;
  v_variant uuid;
  v_slug text;
  v_rp uuid;
  v_count int;
  v_price numeric;
  v_row public.retailer_products%ROWTYPE;
  v_ok boolean;
  v_seed int;
BEGIN
  SELECT pv.id, p.slug INTO v_variant, v_slug
    FROM public.product_variants pv JOIN public.products p ON p.id = pv.product_id
   WHERE NOT p.is_discontinued
     AND NOT EXISTS (SELECT 1 FROM public.retailer_products rp JOIN public.retailers r ON r.id = rp.retailer_id
                      WHERE rp.product_variant_id = pv.id AND r.slug = 'clicks')
   LIMIT 1;
  IF v_variant IS NULL THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: no product variant without a clicks listing to test with'; END IF;

  -- 1. The variant is offered for discovery; a saved candidate gets its match fields.
  IF NOT EXISTS (SELECT 1 FROM public.get_price_discovery_batch('clicks', 25) WHERE variant_id = v_variant)
     AND (SELECT count(*) FROM public.get_price_discovery_batch('clicks', 25)) = 0 THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: discovery queue is empty although a variant has no clicks listing';
  END IF;
  v_rp := public.save_listing_candidate(v_variant, 'clicks', 'https://clicks.co.za/probe/p/1', 'Probe Title 30ml', 30, 'needs_review', 0.7, '["probe"]'::jsonb);
  IF v_rp IS NULL THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: candidate not saved'; END IF;
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  IF v_row.match_status <> 'needs_review' OR v_row.listing_size_ml <> 30 OR v_row.source_type::text <> 'retailer_listing' THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: candidate fields wrong';
  END IF;
  IF EXISTS (SELECT 1 FROM public.get_price_discovery_batch('clicks', 25) WHERE variant_id = v_variant) THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a needs_review listing was offered for re-discovery';
  END IF;
  n := n + 3;

  -- 2. Visitors see only matched listings; needs_review stays private.
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_count FROM public.retailer_products WHERE id = v_rp;
  EXECUTE 'RESET ROLE';
  IF v_count <> 0 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: anon could read a needs_review listing'; END IF;
  PERFORM public.save_listing_candidate(v_variant, 'clicks', 'https://clicks.co.za/probe/p/1', 'Probe Title 30ml', 30, 'matched', 0.95, '[]'::jsonb);
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_count FROM public.retailer_products WHERE id = v_rp;
  EXECUTE 'RESET ROLE';
  IF v_count <> 1 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: anon could not read a matched listing'; END IF;
  n := n + 2;

  -- 3. A matched listing with no observed price is not shown; recording a price adds one history row.
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_count FROM public.sa_retail_prices WHERE product_slug = v_slug AND retailer_slug = 'clicks';
  EXECUTE 'RESET ROLE';
  IF v_count <> 0 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a listing without a price showed up'; END IF;
  PERFORM public.record_price_observation(v_rp, 'record', 130, true, 'https://clicks.co.za/probe/p/1');
  SELECT count(*) INTO v_count FROM public.product_prices WHERE retailer_product_id = v_rp;
  IF v_count <> 1 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: expected 1 price row, got %', v_count; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_prices WHERE retailer_product_id = v_rp AND source_type::text = 'retailer_listing'
                    AND verification_status::text = 'partially_verified' AND in_stock IS TRUE AND currency = 'ZAR') THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: price row has wrong provenance';
  END IF;
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT price_zar INTO v_price FROM public.sa_retail_prices WHERE product_slug = v_slug AND retailer_slug = 'clicks';
  EXECUTE 'RESET ROLE';
  IF v_price IS DISTINCT FROM 130 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: public view price % <> 130', v_price; END IF;
  n := n + 4;

  -- 4. skip = no new history row but the check is stamped; hold = remembered, not shown, not stamped.
  PERFORM public.record_price_observation(v_rp, 'skip', 130, true, 'https://clicks.co.za/probe/p/1');
  SELECT count(*) INTO v_count FROM public.product_prices WHERE retailer_product_id = v_rp;
  IF v_count <> 1 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: skip wrote a price row'; END IF;
  UPDATE public.retailer_products SET last_checked_at = now() - interval '2 days' WHERE id = v_rp;
  PERFORM public.record_price_observation(v_rp, 'hold', 40, true, 'https://clicks.co.za/probe/p/1');
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  SELECT count(*) INTO v_count FROM public.product_prices WHERE retailer_product_id = v_rp;
  IF v_count <> 1 OR v_row.pending_price_zar <> 40 OR v_row.last_checked_at > now() - interval '1 day' THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: hold misbehaved (rows %, pending %, checked %)', v_count, v_row.pending_price_zar, v_row.last_checked_at;
  END IF;
  PERFORM public.record_price_observation(v_rp, 'record', 40, true, 'https://clicks.co.za/probe/p/1');
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  IF v_row.pending_price_zar IS NOT NULL OR (SELECT count(*) FROM public.product_prices WHERE retailer_product_id = v_rp) <> 2 THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: confirmed swing not recorded cleanly';
  END IF;
  n := n + 3;

  -- 5. The latest price wins in the public view; absurd prices and bad actions are refused.
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT price_zar INTO v_price FROM public.sa_retail_prices WHERE product_slug = v_slug AND retailer_slug = 'clicks';
  EXECUTE 'RESET ROLE';
  IF v_price IS DISTINCT FROM 40 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: view did not show the latest price (%)', v_price; END IF;
  FOREACH v_price IN ARRAY ARRAY[0, -5, 50001]::numeric[] LOOP
    v_ok := false;
    BEGIN PERFORM public.record_price_observation(v_rp, 'record', v_price, true, 'x'); EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true; END;
    IF NOT v_ok THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: price % accepted', v_price; END IF;
  END LOOP;
  v_ok := false;
  BEGIN PERFORM public.record_price_observation(v_rp, 'remove', 10, true, 'x'); EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: bad action accepted'; END IF;
  n := n + 3;

  -- 6. Refresh queue: due only when not attempted in 20h; failures hide the price, 5 hand it back to a person.
  UPDATE public.retailer_products SET last_attempt_at = now() WHERE id = v_rp;
  IF EXISTS (SELECT 1 FROM public.get_price_refresh_batch('clicks', 25) WHERE retailer_product_id = v_rp) THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a just-checked listing is due again';
  END IF;
  UPDATE public.retailer_products SET last_attempt_at = now() - interval '21 hours' WHERE id = v_rp;
  IF NOT EXISTS (SELECT 1 FROM public.get_price_refresh_batch('clicks', 25) WHERE retailer_product_id = v_rp AND last_price_zar = 40) THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a due listing is missing from the refresh queue';
  END IF;
  PERFORM public.record_price_failure(v_rp, 'HTTP 500');
  PERFORM public.record_price_failure(v_rp, 'HTTP 500');
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_count FROM public.sa_retail_prices WHERE product_slug = v_slug AND retailer_slug = 'clicks';
  EXECUTE 'RESET ROLE';
  IF v_count <> 0 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a listing failing twice is still shown'; END IF;
  PERFORM public.record_price_failure(v_rp, 'HTTP 500');
  PERFORM public.record_price_failure(v_rp, 'HTTP 500');
  PERFORM public.record_price_failure(v_rp, 'HTTP 500');
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  IF v_row.match_status <> 'needs_review' OR v_row.consecutive_failures <> 5 THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: 5 failures did not hand the listing back (% / %)', v_row.match_status, v_row.consecutive_failures;
  END IF;
  n := n + 4;

  -- 7. A person-verified match is never overwritten by a machine.
  UPDATE public.retailer_products SET match_status = 'matched', last_verified_at = now(), consecutive_failures = 0 WHERE id = v_rp;
  PERFORM public.save_listing_candidate(v_variant, 'clicks', 'https://clicks.co.za/other/p/2', 'Other', 60, 'rejected', 0.1, '[]'::jsonb);
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  IF v_row.retailer_url <> 'https://clicks.co.za/probe/p/1' OR v_row.match_status <> 'matched' THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a verified match was overwritten';
  END IF;
  n := n + 1;

  -- 8. Discovery misses are stamped (not retried for 30 days) and never clobber a match.
  PERFORM public.mark_price_discovery_miss(v_variant, 'clicks', 'no usable search result');
  SELECT * INTO v_row FROM public.retailer_products WHERE id = v_rp;
  IF v_row.match_status <> 'matched' THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a miss clobbered a match'; END IF;
  n := n + 1;

  -- 9. The old editorial seed rows are not readable by visitors, and the write functions are service-role only.
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO v_seed FROM public.product_prices WHERE source_type::text <> 'retailer_listing';
  EXECUTE 'RESET ROLE';
  IF v_seed <> 0 THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: anon can read % non-observed price rows', v_seed; END IF;
  EXECUTE 'SET LOCAL ROLE anon';
  v_ok := false;
  BEGIN PERFORM public.record_price_observation(v_rp, 'record', 10, true, 'x'); EXCEPTION WHEN insufficient_privilege THEN v_ok := true; END;
  EXECUTE 'RESET ROLE';
  IF NOT v_ok THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: anon could call record_price_observation'; END IF;
  EXECUTE 'SET LOCAL ROLE authenticated';
  v_ok := false;
  BEGIN PERFORM public.save_listing_candidate(v_variant, 'clicks', 'x', 'x', 1, 'matched', 1, '[]'::jsonb); EXCEPTION WHEN insufficient_privilege THEN v_ok := true; END;
  EXECUTE 'RESET ROLE';
  IF NOT v_ok THEN RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: a signed-in user could call save_listing_candidate'; END IF;
  n := n + 3;

  -- 10. The cron secret check rejects anything but the real secret.
  IF public.verify_price_sync_secret('wrong') OR public.verify_price_sync_secret(NULL) OR public.verify_price_sync_secret('') THEN
    RAISE EXCEPTION 'RETAILER_PRICE_TEST_FAILED: verify_price_sync_secret accepted a bad secret';
  END IF;
  n := n + 1;

  RAISE EXCEPTION 'RETAILER_PRICE_TESTS_PASSED (% assertions)', n;
END
$$;
