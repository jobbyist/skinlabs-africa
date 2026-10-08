-- Review price verification: real SA retail prices for EVERY published product review
-- (static catalogue, AI-generated, Sponsored/OpenHaus) from Takealot, Dis-Chem, Clicks, Dermastore,
-- SkinMiles and Faithful to Nature.
--
--   review_price_targets   one row per published review (the work queue; next_check_at drives the schedule)
--   review_price_listings  a retailer product page + price found for a review. status:
--                            pending  -> found by Parallel Search / Nimble, NOT public
--                            approved -> a person verified it in Admin > SA Prices; public while checked in the last 30 days
--                            rejected -> never shown, never re-proposed
--   review_price_history   append-only price observations
--   review_price_runs      one row per pipeline run (source used, counts, why it stopped)
--
-- Public read = approved + checked within 30 days only. An approved listing whose page is re-read and
-- moves by <= 50% refreshes itself (the person verified the LISTING, the price follows it); a bigger move
-- drops back to pending. New generated reviews get a target automatically (trigger), so every future
-- review-generation run is priced by the scheduled job without touching those pipelines.
-- No DROP statements (the Supabase SQL tool hangs on them).

-- ---------- tables ----------
CREATE TABLE IF NOT EXISTS public.review_price_targets (
  review_id        text PRIMARY KEY,
  review_kind      text NOT NULL CHECK (review_kind IN ('generated', 'static')),
  product_name     text NOT NULL,
  brand            text NOT NULL,
  size_ml          numeric,
  is_sponsored     boolean NOT NULL DEFAULT false,
  source_type      text,
  last_checked_at  timestamptz,
  next_check_at    timestamptz NOT NULL DEFAULT now(),
  last_source      text,
  last_found       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_price_targets_due_idx ON public.review_price_targets (next_check_at);

CREATE TABLE IF NOT EXISTS public.review_price_listings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id          text NOT NULL REFERENCES public.review_price_targets (review_id) ON DELETE CASCADE,
  retailer_slug      text NOT NULL CHECK (retailer_slug IN ('takealot', 'dis-chem', 'clicks', 'dermastore', 'skinmiles', 'faithful-to-nature')),
  listing_url        text NOT NULL,
  listing_title      text,
  listing_size_ml    numeric,
  price_zar          numeric NOT NULL CHECK (price_zar >= 1 AND price_zar <= 50000),
  special_price_zar  numeric,
  previous_price_zar numeric,
  in_stock           boolean,
  confidence         numeric,
  needs_attention    boolean NOT NULL DEFAULT true,
  match_reasons      jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence           text,
  source_tool        text NOT NULL CHECK (source_tool IN ('parallel_search', 'nimble', 'manual')),
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  checked_at         timestamptz NOT NULL DEFAULT now(),
  verified_by        uuid,
  verified_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, retailer_slug, listing_url)
);
CREATE INDEX IF NOT EXISTS review_price_listings_status_idx ON public.review_price_listings (status, checked_at);
CREATE INDEX IF NOT EXISTS review_price_listings_review_idx ON public.review_price_listings (review_id);

CREATE TABLE IF NOT EXISTS public.review_price_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.review_price_listings (id) ON DELETE CASCADE,
  price_zar    numeric NOT NULL,
  in_stock     boolean,
  source_tool  text NOT NULL,
  observed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_price_history_listing_idx ON public.review_price_history (listing_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS public.review_price_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'running',
  source       text,
  summary      jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ---------- RLS ----------
ALTER TABLE public.review_price_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_price_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_price_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_price_runs     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved fresh review prices" ON public.review_price_listings
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND checked_at >= now() - interval '30 days');
CREATE POLICY "Admins read review price listings" ON public.review_price_listings
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins read review price targets" ON public.review_price_targets
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins read review price history" ON public.review_price_history
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE POLICY "Admins read review price runs" ON public.review_price_runs
  FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));

-- No client writes at all: edge function (service role) and the admin RPC below are the only writers.
REVOKE ALL ON public.review_price_targets, public.review_price_listings, public.review_price_history, public.review_price_runs FROM anon, authenticated;
GRANT SELECT ON public.review_price_listings TO anon, authenticated;
GRANT SELECT ON public.review_price_targets, public.review_price_history, public.review_price_runs TO authenticated;
GRANT ALL ON public.review_price_targets, public.review_price_listings, public.review_price_history, public.review_price_runs TO service_role;

-- ---------- cron auth (Vault secret verified in the database; no Edge secret to set) ----------
CREATE OR REPLACE FUNCTION public.verify_review_price_secret(p_secret text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expected text;
BEGIN
  SELECT decrypted_secret INTO v_expected FROM vault.decrypted_secrets WHERE name = 'review_price_sync_cron_secret';
  IF v_expected IS NULL OR p_secret IS NULL OR length(p_secret) <> length(v_expected) THEN RETURN false; END IF;
  RETURN extensions.digest(p_secret, 'sha256') = extensions.digest(v_expected, 'sha256');
END;
$$;
REVOKE ALL ON FUNCTION public.verify_review_price_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_review_price_secret(text) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'review_price_sync_cron_secret') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'review_price_sync_cron_secret', 'x-cron-secret for the review-price-sync edge function');
  END IF;
END $$;

-- ---------- work queue + writers (service role only) ----------
CREATE OR REPLACE FUNCTION public.get_review_price_batch(p_limit integer, p_review_id text DEFAULT NULL)
RETURNS TABLE (review_id text, product_name text, brand text, size_ml numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.review_id, t.product_name, t.brand, t.size_ml
  FROM public.review_price_targets t
  WHERE (p_review_id IS NOT NULL AND t.review_id = p_review_id)
     OR (p_review_id IS NULL AND t.next_check_at <= now())
  ORDER BY t.next_check_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 3), 10));
$$;
REVOKE ALL ON FUNCTION public.get_review_price_batch(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_price_batch(integer, text) TO service_role;

-- p_listings: [{retailer, url, title, price_zar, special_price_zar, in_stock, size_ml, confidence, needs_attention, reasons[], evidence}]
CREATE OR REPLACE FUNCTION public.save_review_price_check(p_review_id text, p_source text, p_listings jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l jsonb; v_existing public.review_price_listings%ROWTYPE; v_id uuid;
  v_price numeric; v_inserted int := 0; v_refreshed int := 0; v_repended int := 0; v_found int := 0;
BEGIN
  IF p_source NOT IN ('parallel_search', 'nimble') THEN RAISE EXCEPTION 'bad source'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.review_price_targets WHERE review_id = p_review_id) THEN RAISE EXCEPTION 'unknown review %', p_review_id; END IF;

  FOR l IN SELECT * FROM jsonb_array_elements(COALESCE(p_listings, '[]'::jsonb)) LOOP
    v_price := (l->>'price_zar')::numeric;
    IF v_price IS NULL OR v_price < 1 OR v_price > 50000 THEN CONTINUE; END IF;
    v_found := v_found + 1;

    SELECT * INTO v_existing FROM public.review_price_listings
     WHERE review_id = p_review_id AND retailer_slug = l->>'retailer' AND listing_url = l->>'url';

    IF NOT FOUND THEN
      INSERT INTO public.review_price_listings (review_id, retailer_slug, listing_url, listing_title, listing_size_ml, price_zar, special_price_zar,
        in_stock, confidence, needs_attention, match_reasons, evidence, source_tool)
      VALUES (p_review_id, l->>'retailer', l->>'url', left(l->>'title', 300), NULLIF(l->>'size_ml', '')::numeric, v_price,
        NULLIF(l->>'special_price_zar', '')::numeric, NULLIF(l->>'in_stock', '')::boolean, NULLIF(l->>'confidence', '')::numeric,
        COALESCE((l->>'needs_attention')::boolean, true), COALESCE(l->'reasons', '[]'::jsonb), left(l->>'evidence', 400), p_source)
      RETURNING id INTO v_id;
      INSERT INTO public.review_price_history (listing_id, price_zar, in_stock, source_tool) VALUES (v_id, v_price, NULLIF(l->>'in_stock', '')::boolean, p_source);
      v_inserted := v_inserted + 1;
    ELSIF v_existing.status = 'rejected' THEN
      CONTINUE; -- a person said no; never re-proposed
    ELSE
      -- approved + modest move: the verified listing keeps its approval and the price follows it.
      -- approved + big swing: back to pending (hidden) until a person looks again.
      UPDATE public.review_price_listings SET
        previous_price_zar = CASE WHEN price_zar <> v_price THEN price_zar ELSE previous_price_zar END,
        price_zar = v_price,
        special_price_zar = NULLIF(l->>'special_price_zar', '')::numeric,
        in_stock = NULLIF(l->>'in_stock', '')::boolean,
        listing_title = COALESCE(left(l->>'title', 300), listing_title),
        confidence = NULLIF(l->>'confidence', '')::numeric,
        evidence = left(l->>'evidence', 400),
        source_tool = p_source,
        checked_at = now(),
        status = CASE WHEN status = 'approved' AND abs(v_price - v_existing.price_zar) / v_existing.price_zar > 0.5 THEN 'pending' ELSE status END
      WHERE id = v_existing.id;
      INSERT INTO public.review_price_history (listing_id, price_zar, in_stock, source_tool) VALUES (v_existing.id, v_price, NULLIF(l->>'in_stock', '')::boolean, p_source);
      IF v_existing.status = 'approved' AND abs(v_price - v_existing.price_zar) / v_existing.price_zar > 0.5 THEN v_repended := v_repended + 1;
      ELSIF v_existing.status = 'approved' THEN v_refreshed := v_refreshed + 1; END IF;
    END IF;
  END LOOP;

  -- Recheck at 25 days (before the 30-day display limit); a product with nothing found retries in 7.
  UPDATE public.review_price_targets
     SET last_checked_at = now(), last_source = p_source, last_found = v_found,
         next_check_at = now() + CASE WHEN v_found > 0 THEN interval '25 days' ELSE interval '7 days' END
   WHERE review_id = p_review_id;

  RETURN jsonb_build_object('found', v_found, 'inserted', v_inserted, 'refreshed', v_refreshed, 'sent_back_to_review', v_repended);
END;
$$;
REVOKE ALL ON FUNCTION public.save_review_price_check(text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_review_price_check(text, text, jsonb) TO service_role;

-- Retry soon without recording a result (provider unavailable, nothing was learned).
CREATE OR REPLACE FUNCTION public.defer_review_price_check(p_review_id text, p_hours integer DEFAULT 6)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.review_price_targets SET next_check_at = now() + make_interval(hours => GREATEST(1, LEAST(COALESCE(p_hours, 6), 72))) WHERE review_id = p_review_id;
$$;
REVOKE ALL ON FUNCTION public.defer_review_price_check(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.defer_review_price_check(text, integer) TO service_role;

-- ---------- admin verification (the only way a listing becomes public) ----------
CREATE OR REPLACE FUNCTION public.admin_decide_review_prices(p_ids uuid[], p_decision text, p_price_override numeric DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n integer;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF p_decision NOT IN ('approved', 'rejected', 'pending') THEN RAISE EXCEPTION 'bad decision'; END IF;
  IF p_price_override IS NOT NULL AND (p_price_override < 1 OR p_price_override > 50000 OR COALESCE(array_length(p_ids, 1), 0) <> 1) THEN
    RAISE EXCEPTION 'a price override applies to exactly one listing and must be R1-R50,000';
  END IF;
  UPDATE public.review_price_listings SET
    status = p_decision,
    price_zar = COALESCE(p_price_override, price_zar),
    source_tool = CASE WHEN p_price_override IS NOT NULL THEN 'manual' ELSE source_tool END,
    -- approving stamps the verification; the price was read at checked_at, so a stale proposal does not become public
    verified_by = (SELECT auth.uid()), verified_at = now(),
    checked_at = CASE WHEN p_price_override IS NOT NULL THEN now() ELSE checked_at END
  WHERE id = ANY (p_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_decide_review_prices(uuid[], text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_decide_review_prices(uuid[], text, numeric) TO authenticated, service_role;

-- ---------- every published review gets priced: targets are created automatically ----------
CREATE OR REPLACE FUNCTION public.sync_review_price_target_generated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.review_price_targets (review_id, review_kind, product_name, brand, is_sponsored, source_type)
  VALUES (NEW.id, 'generated', NEW.product_name, COALESCE(NULLIF(NEW.brand, ''), 'Unknown'), COALESCE(NEW.is_sponsored, false), NEW.source_type)
  ON CONFLICT (review_id) DO UPDATE SET is_sponsored = EXCLUDED.is_sponsored, source_type = EXCLUDED.source_type;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_review_price_target_generated() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_review_price_target_generated
  AFTER INSERT ON public.ai_generated_product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_review_price_target_generated();

INSERT INTO public.review_price_targets (review_id, review_kind, product_name, brand, is_sponsored, source_type)
SELECT id, 'generated', product_name, COALESCE(NULLIF(brand, ''), 'Unknown'), COALESCE(is_sponsored, false), source_type
FROM public.ai_generated_product_reviews
ON CONFLICT (review_id) DO NOTHING;

-- ---------- public view: approved review prices join the existing SA retail prices ----------
-- Same columns as before. A legacy retailer_products row for the same product+retailer wins (no duplicates).
CREATE OR REPLACE VIEW public.sa_retail_prices
WITH (security_invoker = true) AS
WITH legacy AS (
  SELECT DISTINCT ON (rp.id)
    p.slug              AS product_slug,
    r.slug              AS retailer_slug,
    r.name              AS retailer_name,
    rp.retailer_url     AS listing_url,
    rp.listing_title,
    rp.listing_size_ml,
    pp.price_zar,
    pp.in_stock,
    pp.recorded_at      AS price_since,
    rp.last_checked_at  AS checked_at
  FROM public.retailer_products rp
  JOIN public.retailers r ON r.id = rp.retailer_id
  JOIN public.product_variants pv ON pv.id = rp.product_variant_id
  JOIN public.products p ON p.id = pv.product_id
  JOIN public.product_prices pp ON pp.retailer_product_id = rp.id
  WHERE rp.match_status = 'matched'
    AND pp.source_type = 'retailer_listing'
    AND r.is_active
    AND NOT p.is_discontinued
    AND rp.last_checked_at >= now() - interval '14 days'
    AND rp.consecutive_failures < 2
  ORDER BY rp.id, pp.recorded_at DESC
)
SELECT * FROM legacy
UNION ALL
SELECT
  l.review_id                         AS product_slug,
  l.retailer_slug,
  r.name                              AS retailer_name,
  l.listing_url,
  l.listing_title,
  l.listing_size_ml,
  l.price_zar,
  l.in_stock,
  COALESCE(l.verified_at, l.checked_at) AS price_since,
  l.checked_at
FROM public.review_price_listings l
JOIN public.retailers r ON r.slug = l.retailer_slug AND r.is_active
WHERE l.status = 'approved'
  AND l.checked_at >= now() - interval '30 days'
  AND NOT EXISTS (SELECT 1 FROM legacy g WHERE g.product_slug = l.review_id AND g.retailer_slug = l.retailer_slug);
GRANT SELECT ON public.sa_retail_prices TO anon, authenticated, service_role;
