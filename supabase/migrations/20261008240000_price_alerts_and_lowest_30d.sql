-- Price alerts + "Lowest in 30 days" (2026-10-08).
--
--  * price_alerts: a member sets a target price on a reviewed product. When a verified South African retail listing
--    (view sa_retail_prices, i.e. matched/approved and recently checked) is at or below it, ONE notification goes through
--    the existing engine (inbox, plus push if the member has it enabled) and the alert is marked triggered. Re-arming is
--    a new set_price_alert() call. Nothing is ever shown or sent from an unverified price.
--  * Writes only through SECURITY DEFINER RPCs (no client INSERT/UPDATE/DELETE grants); members read their own rows.
--    Setting an alert is an explicit request, so it also switches the member's `price_alert` notification category on.
--  * sa_price_stats_30d(): aggregate-only price history (low/high/observation count) for the CURRENT public listings of
--    one product, so the page can badge a listing that is at its lowest in 30 days. History tables stay private.
--  * Removal is a status change (not a row delete): the Supabase SQL tool used to apply migrations hangs on literal deletes.

CREATE TABLE IF NOT EXISTS public.price_alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_slug        text NOT NULL CHECK (char_length(product_slug) BETWEEN 1 AND 160),
  product_name        text NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 160),
  target_price_zar    numeric NOT NULL CHECK (target_price_zar >= 1 AND target_price_zar <= 50000),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'off')),
  triggered_at        timestamptz,
  triggered_price_zar numeric,
  triggered_retailer  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
CREATE INDEX IF NOT EXISTS price_alerts_active_idx ON public.price_alerts (product_slug) WHERE status = 'active';

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.price_alerts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
CREATE POLICY "Members read their own price alerts"
  ON public.price_alerts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ---------- set / remove ----------
CREATE OR REPLACE FUNCTION public.set_price_alert(p_product_slug text, p_product_name text, p_target_price_zar numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_name text := left(btrim(coalesce(p_product_name, '')), 160);
  v_current numeric; v_active int; v_existing_active boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  IF p_target_price_zar IS NULL OR p_target_price_zar < 1 OR p_target_price_zar > 50000 THEN
    RAISE EXCEPTION 'invalid_target' USING ERRCODE = '22023';
  END IF;
  IF v_name = '' THEN RAISE EXCEPTION 'invalid_product' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.review_price_targets WHERE review_id = p_product_slug) THEN
    RAISE EXCEPTION 'unknown_product' USING ERRCODE = '22023';
  END IF;

  SELECT status = 'active' INTO v_existing_active FROM public.price_alerts WHERE user_id = v_uid AND product_slug = p_product_slug;
  SELECT count(*) INTO v_active FROM public.price_alerts WHERE user_id = v_uid AND status = 'active';
  IF v_active >= 25 AND NOT coalesce(v_existing_active, false) THEN RAISE EXCEPTION 'too_many_alerts' USING ERRCODE = '22023'; END IF;

  INSERT INTO public.price_alerts (user_id, product_slug, product_name, target_price_zar)
  VALUES (v_uid, p_product_slug, v_name, round(p_target_price_zar, 2))
  ON CONFLICT (user_id, product_slug) DO UPDATE
    SET product_name = EXCLUDED.product_name, target_price_zar = EXCLUDED.target_price_zar, status = 'active',
        triggered_at = NULL, triggered_price_zar = NULL, triggered_retailer = NULL, updated_at = now();

  -- An explicit request for alerts: make sure the category that carries them is on (other categories keep their defaults).
  INSERT INTO public.notification_preferences (user_id, price_alert) VALUES (v_uid, true)
  ON CONFLICT (user_id) DO UPDATE SET price_alert = true;

  SELECT min(s.price_zar) INTO v_current FROM public.sa_retail_prices s
   WHERE s.product_slug = p_product_slug AND s.in_stock IS DISTINCT FROM false;
  RETURN jsonb_build_object('target_price_zar', round(p_target_price_zar, 2), 'current_lowest_zar', v_current,
                            'already_met', v_current IS NOT NULL AND v_current <= p_target_price_zar);
END $$;

CREATE OR REPLACE FUNCTION public.remove_price_alert(p_product_slug text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_found boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  UPDATE public.price_alerts SET status = 'off', updated_at = now()
   WHERE user_id = v_uid AND product_slug = p_product_slug AND status <> 'off';
  v_found := FOUND;
  RETURN v_found;
END $$;

-- ---------- evaluation (cron + on demand by service role) ----------
INSERT INTO public.notification_templates
  (key, name, description, category, inbox_category, title, body, inbox_title, inbox_body, url, channels, lock_screen_safe, bypass_caps, priority, system)
VALUES
  ('price_alert_hit', 'Price alert reached', 'A verified South African retail price is at or below the member''s target.', 'price_alert', 'system',
   'Price alert: a product you track hit your target', 'Tap to see where it is listed in South Africa.',
   '{{product_name}} hit your target price',
   '{{retailer}} lists it at {{price}} (your target: {{target}}). Prices change often, so check the retailer before you buy.',
   '/reviews/{{product_slug}}', ARRAY['inbox','push'], true, false, 55, true)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.evaluate_price_alerts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  a record; best record; n integer := 0;
  fmt text := 'FM999999990.00';
BEGIN
  FOR a IN SELECT * FROM public.price_alerts WHERE status = 'active' LOOP
    SELECT s.price_zar, s.retailer_name INTO best
      FROM public.sa_retail_prices s
     WHERE s.product_slug = a.product_slug AND s.in_stock IS DISTINCT FROM false
     ORDER BY s.price_zar, s.retailer_name LIMIT 1;
    CONTINUE WHEN best.price_zar IS NULL OR best.price_zar > a.target_price_zar;

    PERFORM public.enqueue_notification(
      a.user_id, 'price_alert_hit',
      jsonb_build_object(
        'product_name', a.product_name, 'product_slug', a.product_slug, 'retailer', best.retailer_name,
        'price', 'R' || regexp_replace(to_char(best.price_zar, fmt), '\.00$', ''),
        'target', 'R' || regexp_replace(to_char(a.target_price_zar, fmt), '\.00$', '')),
      'price_alert:' || a.id::text || ':' || best.price_zar::text, 'price_alert');

    UPDATE public.price_alerts
       SET status = 'triggered', triggered_at = now(), triggered_price_zar = best.price_zar,
           triggered_retailer = best.retailer_name, updated_at = now()
     WHERE id = a.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- ---------- "Lowest in 30 days": aggregates only, for the product's CURRENT public listings ----------
CREATE OR REPLACE FUNCTION public.sa_price_stats_30d(p_product_slug text)
RETURNS TABLE (retailer_slug text, listing_url text, low_30d numeric, high_30d numeric, observations integer, history_since timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH obs AS (
    SELECT l.retailer_slug AS rs, l.listing_url AS lu, h.price_zar AS price, h.observed_at AS at
      FROM public.review_price_listings l
      JOIN public.review_price_history h ON h.listing_id = l.id
     WHERE l.review_id = p_product_slug AND l.status = 'approved'
    UNION ALL
    SELECT r.slug, rp.retailer_url, pp.price_zar, pp.recorded_at
      FROM public.products p
      JOIN public.product_variants pv ON pv.product_id = p.id
      JOIN public.retailer_products rp ON rp.product_variant_id = pv.id
      JOIN public.retailers r ON r.id = rp.retailer_id
      JOIN public.product_prices pp ON pp.retailer_product_id = rp.id
     WHERE p.slug = p_product_slug AND rp.match_status = 'matched' AND pp.source_type = 'retailer_listing'
  ), ranked AS (
    -- the price in force when the window opened counts too (history can record changes only)
    SELECT *, max(at) FILTER (WHERE at < now() - interval '30 days') OVER (PARTITION BY rs, lu) AS carry_at
      FROM obs
  ), inwin AS (
    SELECT * FROM ranked WHERE at >= now() - interval '30 days' OR at = carry_at
  )
  SELECT rs, lu, min(price), max(price), count(*)::integer, (SELECT min(o.at) FROM obs o WHERE o.rs = w.rs AND o.lu = w.lu)
    FROM inwin w GROUP BY rs, lu;
$$;

REVOKE ALL ON FUNCTION public.set_price_alert(text, text, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_price_alert(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.evaluate_price_alerts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sa_price_stats_30d(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_price_alert(text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_price_alert(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_price_alerts() TO service_role;
GRANT EXECUTE ON FUNCTION public.sa_price_stats_30d(text) TO anon, authenticated, service_role;

-- Hourly check (retailer prices refresh daily at most, so this is prompt without being chatty).
SELECT cron.schedule('price-alerts-evaluate', '20 * * * *', $$SELECT public.evaluate_price_alerts()$$);
