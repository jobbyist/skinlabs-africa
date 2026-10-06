-- Live prices for reviews WITHOUT Firecrawl.
--
-- 59 of the 65 generated reviews are of OpenHaus products. OpenHaus prices come straight from the supplier's own
-- product pages by openhaus-price-sync (a plain HTTP read of the page's JSON-LD, daily, no Firecrawl) and are
-- stored in marketplace_products. A review's `local_price_zar` was a one-off snapshot taken when it was written.
--   * review_live_prices  : the current OpenHaus price for such a review, only while it was checked in the last 14 days
--   * sync_openhaus_review_prices() : keeps ai_generated_product_reviews.local_price_zar equal to that live price
--                                      (so cards, sorting and structured data stay right), run daily after the price sync

CREATE OR REPLACE VIEW public.review_live_prices AS
SELECT r.id AS review_id,
       m.marked_up_price_zar AS price_zar,
       m.in_stock,
       m.price_checked_at AS checked_at,
       'OpenHaus'::text AS source_name,
       '/marketplace/product/' || m.slug AS source_path
  FROM public.ai_generated_product_reviews r
  JOIN public.marketplace_products m
    ON m.slug = substring(r.source_url FROM '/marketplace/product/([^/?#]+)')
 WHERE r.source_type = 'openhaus_marketplace'
   AND m.marked_up_price_zar > 0
   AND m.price_checked_at IS NOT NULL
   AND m.price_checked_at > now() - interval '14 days';
GRANT SELECT ON public.review_live_prices TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_openhaus_review_prices()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  UPDATE public.ai_generated_product_reviews r
     SET local_price_zar = l.price_zar,
         date_modified = now()
    FROM public.review_live_prices l
   WHERE l.review_id = r.id
     AND r.local_price_zar IS DISTINCT FROM l.price_zar;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.sync_openhaus_review_prices() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_openhaus_review_prices() TO service_role;

-- Applied live 2026-10-03 together with:
--   SELECT cron.schedule('sync-openhaus-review-prices', '30 6 * * *', $$SELECT public.sync_openhaus_review_prices()$$);
-- (06:30 UTC, after openhaus-price-sync's 00:00-05:59 UTC hourly window). First run corrected 1 review (R477.99 -> R381.99).
