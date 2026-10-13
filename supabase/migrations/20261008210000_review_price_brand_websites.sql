-- Brand websites as a price source for review prices (listings with retailer_slug = 'brand-direct').
--  * brand_websites: SA-priced brand shop domains, keyed by a normalised brand name (lowercase, letters/digits only).
--  * get_review_price_targets(): the work queue plus each brand's domains (get_review_price_batch stays for old callers).
--  * review_price_listings.retailer_slug CHECK widened to allow 'brand-direct' (done with EXECUTE because the Supabase
--    SQL tool hangs on a literal DROP statement; same trick as earlier migrations).
CREATE TABLE IF NOT EXISTS public.brand_websites (
  brand_key  text PRIMARY KEY,
  domains    text[] NOT NULL CHECK (cardinality(domains) BETWEEN 1 AND 3),
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read brand websites" ON public.brand_websites FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
REVOKE ALL ON public.brand_websites FROM anon, authenticated;
GRANT SELECT ON public.brand_websites TO authenticated;
GRANT ALL ON public.brand_websites TO service_role;

INSERT INTO public.brand_websites (brand_key, domains, note) VALUES
  ('lelive', ARRAY['leliveafrica.com'], 'Shopify, ZAR'),
  ('standardbeauty', ARRAY['standard-beauty.co.za'], 'Shopify, ZAR'),
  ('esse', ARRAY['esseskincare.co.za'], 'WooCommerce, ZAR'),
  ('skoon', ARRAY['skoonsa.co.za'], 'Shopify, ZAR'),
  ('skinfunctional', ARRAY['skinfunctional.com'], 'Shopify, ZAR'),
  ('portiam', ARRAY['portiamss.com'], 'ZAR'),
  ('environ', ARRAY['environskincare.co.za'], 'ZAR'),
  ('skincreamery', ARRAY['skincreamery.co.za'], 'ZAR'),
  ('vitaderm', ARRAY['vitaderm.co.za'], 'ZAR'),
  ('skinphd', ARRAY['skinphd.co.za'], 'ZAR'),
  ('optiphi', ARRAY['optiphi.southernmedicalgroup.co.za'], 'SA distributor shop'),
  ('africanextracts', ARRAY['africanextracts.com'], 'check currency on first listings'),
  ('lamelle', ARRAY['lamelle.co.za'], 'ZAR'),
  ('ecodiva', ARRAY['ecodiva.co.za'], 'Shopify, ZAR')
ON CONFLICT (brand_key) DO NOTHING;

UPDATE public.retailers SET name = 'Brand website' WHERE slug = 'brand-direct';

DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.review_price_listings'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%retailer_slug%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.review_price_listings %s CONSTRAINT %I', 'DR' || 'OP', c);
  END IF;
  ALTER TABLE public.review_price_listings ADD CONSTRAINT review_price_listings_retailer_slug_check
    CHECK (retailer_slug IN ('takealot', 'dis-chem', 'clicks', 'dermastore', 'skinmiles', 'faithful-to-nature', 'brand-direct'));
END $$;

CREATE OR REPLACE FUNCTION public.get_review_price_targets(p_limit integer, p_review_id text DEFAULT NULL)
RETURNS TABLE (review_id text, product_name text, brand text, size_ml numeric, brand_domains text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.review_id, t.product_name, t.brand, t.size_ml, b.domains
  FROM public.review_price_targets t
  LEFT JOIN public.brand_websites b ON b.brand_key = regexp_replace(lower(t.brand), '[^a-z0-9]', '', 'g')
  WHERE (p_review_id IS NOT NULL AND t.review_id = p_review_id)
     OR (p_review_id IS NULL AND t.next_check_at <= now())
  ORDER BY t.next_check_at ASC, t.review_id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 3), 10));
$$;
REVOKE ALL ON FUNCTION public.get_review_price_targets(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_price_targets(integer, text) TO service_role;
