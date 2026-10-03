-- SA retailer price pipeline (growth engine: the "where to buy in SA" wedge).
--
-- Reuses the existing intelligence schema (retailers / retailer_products /
-- product_prices) instead of adding parallel tables. What was there: 241
-- listings whose prices are EDITORIAL SEED values (source_type =
-- internal_editorial, never checked) and whose "URL" is just the retailer's
-- homepage. They were publicly readable but never displayed. This migration:
--   * adds match tracking to retailer_products and an in_stock flag to prices;
--   * narrows public read access to LIVE-OBSERVED data only, so the seed values
--     are no longer exposed (admins still see everything);
--   * adds service-role RPCs the sync function uses (append-only price history,
--     two-reading confirmation of big swings, failure tracking);
--   * adds the public view `sa_retail_prices` (latest matched, fresh price per listing).
-- No statement here uses DROP (the Supabase SQL tool cannot run those).

-- ---------- 1. Listing match tracking ----------
ALTER TABLE public.retailer_products
  ADD COLUMN IF NOT EXISTS match_status text NOT NULL DEFAULT 'unmatched',
  ADD COLUMN IF NOT EXISTS match_confidence numeric,
  ADD COLUMN IF NOT EXISTS match_reasons jsonb,
  ADD COLUMN IF NOT EXISTS listing_title text,
  ADD COLUMN IF NOT EXISTS listing_size_ml numeric,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS pending_price_zar numeric,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS discovery_checked_at timestamptz;

DO $$
BEGIN
  ALTER TABLE public.retailer_products
    ADD CONSTRAINT retailer_products_match_status_check
    CHECK (match_status IN ('unmatched', 'matched', 'needs_review', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS retailer_products_refresh_idx
  ON public.retailer_products (retailer_id, last_attempt_at NULLS FIRST)
  WHERE match_status = 'matched';
CREATE INDEX IF NOT EXISTS retailer_products_review_idx
  ON public.retailer_products (match_status) WHERE match_status = 'needs_review';

ALTER TABLE public.product_prices ADD COLUMN IF NOT EXISTS in_stock boolean;

-- ---------- 2. Public read = live-observed data only ----------
-- Seed rows (internal_editorial, homepage URLs) stay in the tables for admins but
-- are no longer served to the public API.
ALTER POLICY "Public read" ON public.retailer_products USING (match_status = 'matched');
ALTER POLICY "Public read" ON public.product_prices USING (source_type = 'retailer_listing');

-- ---------- 3. Public view: latest fresh price per matched listing ----------
-- security_invoker so the table policies above still apply to the caller.
-- A listing disappears from the site when it hasn't been checked for 14 days or its
-- last two checks both failed, rather than showing a number nobody has seen lately.
CREATE OR REPLACE VIEW public.sa_retail_prices
WITH (security_invoker = true) AS
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
ORDER BY rp.id, pp.recorded_at DESC;
GRANT SELECT ON public.sa_retail_prices TO anon, authenticated, service_role;

-- ---------- 4. Cron auth: Vault secret verified in the database ----------
-- Same pattern as skynn-advanced-worker: no `supabase secrets set` step. The Vault
-- entry is created below with a server-generated value that never appears in git.
CREATE OR REPLACE FUNCTION public.verify_price_sync_secret(p_secret text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected text;
BEGIN
  SELECT decrypted_secret INTO v_expected FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret';
  IF v_expected IS NULL OR p_secret IS NULL OR length(p_secret) <> length(v_expected) THEN
    RETURN false;
  END IF;
  RETURN extensions.digest(p_secret, 'sha256') = extensions.digest(v_expected, 'sha256');
END;
$$;
REVOKE ALL ON FUNCTION public.verify_price_sync_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_price_sync_secret(text) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'retailer_price_sync_cron_secret') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'retailer_price_sync_cron_secret', 'x-cron-secret for the retailer-price-sync edge function');
  END IF;
END $$;

-- ---------- 5. Work queues for the sync function (service role only) ----------
-- Variants that still need a retailer page found: no listing for the retailer yet, or
-- an unmatched one not searched in the last 30 days. Matched / under-review / rejected
-- listings are never re-discovered over (a person may have decided them).
CREATE OR REPLACE FUNCTION public.get_price_discovery_batch(p_retailer text, p_limit integer)
RETURNS TABLE (variant_id uuid, product_slug text, brand text, product_name text, size_ml numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.id, p.slug, b.name, p.name, pv.size_ml
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    JOIN public.brands b ON b.id = p.brand_id
    JOIN public.retailers r ON r.slug = p_retailer AND r.is_active
    LEFT JOIN public.retailer_products rp ON rp.product_variant_id = pv.id AND rp.retailer_id = r.id
   WHERE NOT p.is_discontinued
     AND (rp.id IS NULL
          OR (rp.match_status = 'unmatched'
              AND (rp.discovery_checked_at IS NULL OR rp.discovery_checked_at < now() - interval '30 days')))
   ORDER BY rp.discovery_checked_at NULLS FIRST, p.created_at
   LIMIT least(greatest(p_limit, 1), 25);
$$;
REVOKE ALL ON FUNCTION public.get_price_discovery_batch(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_discovery_batch(text, integer) TO service_role;

-- Matched listings due a re-check (not attempted in the last 20 hours), oldest first.
CREATE OR REPLACE FUNCTION public.get_price_refresh_batch(p_retailer text, p_limit integer)
RETURNS TABLE (retailer_product_id uuid, listing_url text, last_price_zar numeric, last_price_at timestamptz, pending_price_zar numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rp.id, rp.retailer_url, lp.price_zar, lp.recorded_at, rp.pending_price_zar
    FROM public.retailer_products rp
    JOIN public.retailers r ON r.id = rp.retailer_id AND r.slug = p_retailer AND r.is_active
    LEFT JOIN LATERAL (
      SELECT pp.price_zar, pp.recorded_at FROM public.product_prices pp
       WHERE pp.retailer_product_id = rp.id AND pp.source_type = 'retailer_listing'
       ORDER BY pp.recorded_at DESC LIMIT 1
    ) lp ON true
   WHERE rp.match_status = 'matched'
     AND rp.retailer_url IS NOT NULL
     AND (rp.last_attempt_at IS NULL OR rp.last_attempt_at < now() - interval '20 hours')
   ORDER BY rp.last_attempt_at NULLS FIRST
   LIMIT least(greatest(p_limit, 1), 25);
$$;
REVOKE ALL ON FUNCTION public.get_price_refresh_batch(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_refresh_batch(text, integer) TO service_role;

-- ---------- 6. Writes ----------
-- Records what discovery decided about a listing. A listing a person already
-- confirmed (matched + last_verified_at set) is never overwritten by a machine.
CREATE OR REPLACE FUNCTION public.save_listing_candidate(
  p_variant_id uuid,
  p_retailer_slug text,
  p_url text,
  p_title text,
  p_size_ml numeric,
  p_status text,
  p_confidence numeric,
  p_reasons jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retailer uuid;
  v_id uuid;
BEGIN
  IF p_status NOT IN ('matched', 'needs_review', 'rejected', 'unmatched') THEN
    RAISE EXCEPTION 'bad_status' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_retailer FROM public.retailers WHERE slug = p_retailer_slug AND is_active;
  IF v_retailer IS NULL THEN RAISE EXCEPTION 'unknown_retailer' USING ERRCODE = '22023'; END IF;

  INSERT INTO public.retailer_products (
    product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status,
    match_status, match_confidence, match_reasons, listing_title, listing_size_ml, discovery_checked_at
  ) VALUES (
    p_variant_id, v_retailer, p_url, true, 'retailer_listing', 'unverified',
    p_status, p_confidence, p_reasons, p_title, p_size_ml, now()
  )
  ON CONFLICT (product_variant_id, retailer_id) DO UPDATE
    SET retailer_url = EXCLUDED.retailer_url,
        source_type = 'retailer_listing',
        match_status = EXCLUDED.match_status,
        match_confidence = EXCLUDED.match_confidence,
        match_reasons = EXCLUDED.match_reasons,
        listing_title = EXCLUDED.listing_title,
        listing_size_ml = EXCLUDED.listing_size_ml,
        discovery_checked_at = now(),
        consecutive_failures = 0,
        last_error = NULL
    WHERE NOT (public.retailer_products.match_status = 'matched' AND public.retailer_products.last_verified_at IS NOT NULL)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_listing_candidate(uuid, text, text, text, numeric, text, numeric, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_listing_candidate(uuid, text, text, text, numeric, text, numeric, jsonb) TO service_role;

-- Stamps a discovery search that found nothing usable, so it isn't retried every run.
CREATE OR REPLACE FUNCTION public.mark_price_discovery_miss(p_variant_id uuid, p_retailer_slug text, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retailer uuid;
BEGIN
  SELECT id INTO v_retailer FROM public.retailers WHERE slug = p_retailer_slug AND is_active;
  IF v_retailer IS NULL THEN RAISE EXCEPTION 'unknown_retailer' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.retailer_products (product_variant_id, retailer_id, is_available, source_type, verification_status, match_status, last_error, discovery_checked_at)
  VALUES (p_variant_id, v_retailer, false, 'retailer_listing', 'unverified', 'unmatched', left(p_note, 300), now())
  ON CONFLICT (product_variant_id, retailer_id) DO UPDATE
    SET discovery_checked_at = now(), last_error = left(p_note, 300)
    WHERE public.retailer_products.match_status = 'unmatched';
END;
$$;
REVOKE ALL ON FUNCTION public.mark_price_discovery_miss(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_price_discovery_miss(uuid, text, text) TO service_role;

-- Applies one refresh result. p_action comes from the function's evaluateObservation():
--   record -> append a price row (history is append-only); skip -> just stamp the check;
--   hold   -> remember the out-of-pattern price so a second identical reading confirms it.
-- The range check is repeated here so a bad caller can't write an absurd price.
CREATE OR REPLACE FUNCTION public.record_price_observation(
  p_retailer_product_id uuid,
  p_action text,
  p_price_zar numeric,
  p_in_stock boolean,
  p_source_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_action NOT IN ('record', 'skip', 'hold') THEN RAISE EXCEPTION 'bad_action' USING ERRCODE = '22023'; END IF;
  IF p_price_zar IS NULL OR p_price_zar < 1 OR p_price_zar > 50000 THEN RAISE EXCEPTION 'price_out_of_range' USING ERRCODE = '22023'; END IF;

  IF p_action = 'record' THEN
    -- clock_timestamp(), not now(): two readings recorded in one transaction must still order.
    INSERT INTO public.product_prices (retailer_product_id, price_zar, currency, source_url, source_type, verification_status, in_stock, recorded_at)
    VALUES (p_retailer_product_id, p_price_zar, 'ZAR', p_source_url, 'retailer_listing', 'partially_verified', p_in_stock, clock_timestamp());
  END IF;

  UPDATE public.retailer_products
     SET last_attempt_at = now(),
         last_checked_at = CASE WHEN p_action = 'hold' THEN last_checked_at ELSE now() END,
         consecutive_failures = 0,
         last_error = CASE WHEN p_action = 'hold' THEN 'price_swing_unconfirmed' ELSE NULL END,
         is_available = coalesce(p_in_stock, is_available),
         pending_price_zar = CASE WHEN p_action = 'hold' THEN p_price_zar ELSE NULL END
   WHERE id = p_retailer_product_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_price_observation(uuid, text, numeric, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_price_observation(uuid, text, numeric, boolean, text) TO service_role;

-- A fetch/parse failure. After 5 in a row the listing goes back to a person
-- (the page may have moved or changed layout) instead of being retried forever.
CREATE OR REPLACE FUNCTION public.record_price_failure(p_retailer_product_id uuid, p_error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.retailer_products
     SET last_attempt_at = now(),
         consecutive_failures = consecutive_failures + 1,
         last_error = left(p_error, 300),
         match_status = CASE WHEN consecutive_failures + 1 >= 5 THEN 'needs_review' ELSE match_status END
   WHERE id = p_retailer_product_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_price_failure(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_price_failure(uuid, text) TO service_role;

-- ---------- 7. Run log (ops visibility; admins read, only the service role writes) ----------
CREATE TABLE IF NOT EXISTS public.retailer_price_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  retailer text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('refresh', 'discover')),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'ok', 'skipped', 'blocked_firecrawl', 'budget_reached', 'error')),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS retailer_price_runs_started_idx ON public.retailer_price_runs (started_at DESC);
ALTER TABLE public.retailer_price_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.retailer_price_runs FROM anon, authenticated;
GRANT SELECT ON public.retailer_price_runs TO authenticated;
GRANT ALL ON public.retailer_price_runs TO service_role;
DO $$
BEGIN
  CREATE POLICY "Admins read retailer price runs" ON public.retailer_price_runs
    FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
