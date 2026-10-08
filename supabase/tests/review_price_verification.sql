-- Probe for review price verification. Runs in one DO block that always rolls back (safe on production).
DO $$
DECLARE
  v_id uuid; v_n int; r jsonb; v_price numeric; v_status text;
BEGIN
  INSERT INTO public.review_price_targets (review_id, review_kind, product_name, brand) VALUES ('probe-review', 'static', 'Probe Serum 30ml', 'ProbeBrand');

  -- 1. a found price lands as pending and is NOT visible in the public view
  r := public.save_review_price_check('probe-review', 'parallel_search',
    '[{"retailer":"clicks","url":"https://clicks.co.za/probe/p/1","title":"Probe Serum 30ml","price_zar":100,"needs_attention":false}]'::jsonb);
  IF (r->>'inserted')::int <> 1 THEN RAISE EXCEPTION 'insert failed %', r; END IF;
  SELECT id, status INTO v_id, v_status FROM public.review_price_listings WHERE review_id = 'probe-review';
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'expected pending, got %', v_status; END IF;
  SELECT count(*) INTO v_n FROM public.sa_retail_prices WHERE product_slug = 'probe-review';
  IF v_n <> 0 THEN RAISE EXCEPTION 'pending price leaked into the public view'; END IF;

  -- 2. target is rescheduled ~25 days out
  IF (SELECT next_check_at FROM public.review_price_targets WHERE review_id = 'probe-review') < now() + interval '24 days' THEN RAISE EXCEPTION 'recheck not scheduled at 25 days'; END IF;

  -- 3. approving (as the table owner; the RPC itself is admin-gated) makes it public
  UPDATE public.review_price_listings SET status = 'approved' WHERE id = v_id;
  SELECT count(*) INTO v_n FROM public.sa_retail_prices WHERE product_slug = 'probe-review' AND retailer_slug = 'clicks';
  IF v_n <> 1 THEN RAISE EXCEPTION 'approved price not in public view (%)', v_n; END IF;

  -- 4. modest move on re-check keeps approval; price follows
  r := public.save_review_price_check('probe-review', 'nimble', '[{"retailer":"clicks","url":"https://clicks.co.za/probe/p/1","price_zar":120}]'::jsonb);
  SELECT price_zar, status INTO v_price, v_status FROM public.review_price_listings WHERE id = v_id;
  IF v_status <> 'approved' OR v_price <> 120 OR (r->>'refreshed')::int <> 1 THEN RAISE EXCEPTION 'modest refresh wrong: % % %', v_status, v_price, r; END IF;

  -- 5. a >50% jump goes back to review and disappears from the public view
  r := public.save_review_price_check('probe-review', 'parallel_search', '[{"retailer":"clicks","url":"https://clicks.co.za/probe/p/1","price_zar":400}]'::jsonb);
  SELECT status INTO v_status FROM public.review_price_listings WHERE id = v_id;
  IF v_status <> 'pending' OR (r->>'sent_back_to_review')::int <> 1 THEN RAISE EXCEPTION 'big swing should return to pending: % %', v_status, r; END IF;
  IF EXISTS (SELECT 1 FROM public.sa_retail_prices WHERE product_slug = 'probe-review') THEN RAISE EXCEPTION 'swing still public'; END IF;

  -- 6. a rejected listing is never re-proposed
  UPDATE public.review_price_listings SET status = 'rejected' WHERE id = v_id;
  PERFORM public.save_review_price_check('probe-review', 'parallel_search', '[{"retailer":"clicks","url":"https://clicks.co.za/probe/p/1","price_zar":130}]'::jsonb);
  IF (SELECT status FROM public.review_price_listings WHERE id = v_id) <> 'rejected' OR (SELECT price_zar FROM public.review_price_listings WHERE id = v_id) <> 400 THEN RAISE EXCEPTION 'rejected listing was touched'; END IF;

  -- 7. a stale approved price (older than 30 days) is hidden
  UPDATE public.review_price_listings SET status = 'approved', checked_at = now() - interval '31 days' WHERE id = v_id;
  IF EXISTS (SELECT 1 FROM public.sa_retail_prices WHERE product_slug = 'probe-review') THEN RAISE EXCEPTION 'stale price still public'; END IF;

  -- 8. nothing found -> retry in 7 days; absurd prices ignored
  r := public.save_review_price_check('probe-review', 'parallel_search', '[{"retailer":"clicks","url":"https://clicks.co.za/probe/p/2","price_zar":999999}]'::jsonb);
  IF (r->>'found')::int <> 0 OR (SELECT next_check_at FROM public.review_price_targets WHERE review_id = 'probe-review') > now() + interval '8 days' THEN RAISE EXCEPTION 'empty check scheduling wrong %', r; END IF;

  -- 9. admin RPC refuses a non-admin caller
  BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
    PERFORM public.admin_decide_review_prices(ARRAY[v_id], 'approved');
    RAISE EXCEPTION 'non-admin was allowed to approve';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  RAISE EXCEPTION 'PROBE_OK (rolled back)';
END $$;
