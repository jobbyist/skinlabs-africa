-- OpenHaus marketplace: dedicated commerce schema, separate from the
-- editorial skincare_intelligence schema (supabase/SCHEMA.md), per the
-- product-owner decision to keep monetisation and editorial data apart.
-- Populated by scripts/seed-openhaus-marketplace.ts from a real 84-product
-- Faithful to Nature (FTN) catalog. Prices are original FTN price * 1.04,
-- charm-rounded up to end in .99 (see computeMarkedUpPrice in
-- supabase/functions/_shared/marketplace-pricing.ts and src/lib/marketplace/pricing.ts).

-- ---------- 1. Brands ----------
CREATE TABLE IF NOT EXISTS public.marketplace_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  origin text,
  description text,
  cover_image_path text,
  values text[] NOT NULL DEFAULT '{}',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketplace brands" ON public.marketplace_brands;
CREATE POLICY "Public can view marketplace brands"
  ON public.marketplace_brands FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage marketplace brands" ON public.marketplace_brands;
CREATE POLICY "Admins manage marketplace brands"
  ON public.marketplace_brands FOR ALL
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

GRANT SELECT ON public.marketplace_brands TO anon, authenticated;
GRANT ALL ON public.marketplace_brands TO service_role;

-- ---------- 2. Products ----------
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.marketplace_brands(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  original_price_zar numeric NOT NULL CHECK (original_price_zar > 0),
  marked_up_price_zar numeric NOT NULL CHECK (marked_up_price_zar > 0),
  source_url text NOT NULL,
  source_last_synced_at timestamptz,
  category text NOT NULL CHECK (category IN ('face', 'body', 'hair-scalp', 'sun-care', 'treatments', 'tools')),
  concern text[] NOT NULL DEFAULT '{}',
  values text[] NOT NULL DEFAULT '{}',
  skin_tone_claims text[] NOT NULL DEFAULT '{}',
  size text,
  how_to_use text,
  key_actives text[] NOT NULL DEFAULT '{}',
  in_stock boolean NOT NULL DEFAULT true,
  data_quality_status text NOT NULL DEFAULT 'unverified'
    CHECK (data_quality_status IN ('unverified', 'partially_verified', 'verified', 'deprecated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_brand_id ON public.marketplace_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_concern ON public.marketplace_products USING gin(concern);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_values ON public.marketplace_products USING gin(values);

CREATE TRIGGER update_marketplace_products_updated_at
BEFORE UPDATE ON public.marketplace_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketplace products" ON public.marketplace_products;
CREATE POLICY "Public can view marketplace products"
  ON public.marketplace_products FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage marketplace products" ON public.marketplace_products;
CREATE POLICY "Admins manage marketplace products"
  ON public.marketplace_products FOR ALL
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

GRANT SELECT ON public.marketplace_products TO anon, authenticated;
GRANT ALL ON public.marketplace_products TO service_role;

-- ---------- 3. Product images ----------
CREATE TABLE IF NOT EXISTS public.marketplace_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_images_product_id ON public.marketplace_product_images(product_id);

ALTER TABLE public.marketplace_product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketplace product images" ON public.marketplace_product_images;
CREATE POLICY "Public can view marketplace product images"
  ON public.marketplace_product_images FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage marketplace product images" ON public.marketplace_product_images;
CREATE POLICY "Admins manage marketplace product images"
  ON public.marketplace_product_images FOR ALL
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

GRANT SELECT ON public.marketplace_product_images TO anon, authenticated;
GRANT ALL ON public.marketplace_product_images TO service_role;

-- ---------- 4. External (Faithful to Nature) ratings ----------
-- Real ratings/review counts scraped from each product's live FTN page.
-- A product with no visible FTN rating simply has no row here — the UI
-- must never render a fabricated "0 reviews" placeholder for that case.
CREATE TABLE IF NOT EXISTS public.marketplace_product_ratings (
  product_id uuid PRIMARY KEY REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  review_count int CHECK (review_count >= 0),
  source_url text NOT NULL,
  scraped_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_product_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view external marketplace ratings" ON public.marketplace_product_ratings;
CREATE POLICY "Public can view external marketplace ratings"
  ON public.marketplace_product_ratings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage external marketplace ratings" ON public.marketplace_product_ratings;
CREATE POLICY "Admins manage external marketplace ratings"
  ON public.marketplace_product_ratings FOR ALL
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

GRANT SELECT ON public.marketplace_product_ratings TO anon, authenticated;
GRANT ALL ON public.marketplace_product_ratings TO service_role;

-- ---------- 5. Internal SkinLabs® user ratings ----------
-- Real, signed-in-user-submitted ratings unique to OpenHaus — a distinct
-- dimension from the FTN-sourced rating above, never blended with it.
CREATE TABLE IF NOT EXISTS public.marketplace_product_user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_user_ratings_product_id ON public.marketplace_product_user_ratings(product_id);

CREATE TRIGGER update_marketplace_product_user_ratings_updated_at
BEFORE UPDATE ON public.marketplace_product_user_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.marketplace_product_user_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view internal marketplace ratings" ON public.marketplace_product_user_ratings;
CREATE POLICY "Public can view internal marketplace ratings"
  ON public.marketplace_product_user_ratings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage their own marketplace rating" ON public.marketplace_product_user_ratings;
CREATE POLICY "Users manage their own marketplace rating"
  ON public.marketplace_product_user_ratings FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT ON public.marketplace_product_user_ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_product_user_ratings TO authenticated;
GRANT ALL ON public.marketplace_product_user_ratings TO service_role;

-- Aggregate view backing the "SkinLabs® Rating" display block.
CREATE OR REPLACE VIEW public.marketplace_product_internal_rating_summary AS
SELECT
  product_id,
  round(avg(rating)::numeric, 2) AS avg_rating,
  count(*) AS rating_count
FROM public.marketplace_product_user_ratings
GROUP BY product_id;

GRANT SELECT ON public.marketplace_product_internal_rating_summary TO anon, authenticated, service_role;

-- ---------- 6. Price sync run log ----------
CREATE TABLE IF NOT EXISTS public.marketplace_price_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  run_at timestamptz NOT NULL DEFAULT now(),
  old_price numeric,
  new_price numeric,
  status text NOT NULL CHECK (status IN ('ok', 'error')),
  error text
);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_sync_log_product_id ON public.marketplace_price_sync_log(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_sync_log_run_at ON public.marketplace_price_sync_log(run_at DESC);

ALTER TABLE public.marketplace_price_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view marketplace price sync log" ON public.marketplace_price_sync_log;
CREATE POLICY "Admins view marketplace price sync log"
  ON public.marketplace_price_sync_log FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- No client GRANT at all — write-only from service_role, admin-only read.
GRANT ALL ON public.marketplace_price_sync_log TO service_role;

-- ---------- 7. Cart items (guest cart lives in localStorage; this is the
--              signed-in sync target) ----------
CREATE TABLE IF NOT EXISTS public.marketplace_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_items_user_id ON public.marketplace_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_items_product_id ON public.marketplace_cart_items(product_id);

ALTER TABLE public.marketplace_cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own cart items" ON public.marketplace_cart_items;
CREATE POLICY "Users manage their own cart items"
  ON public.marketplace_cart_items FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_cart_items TO authenticated;
GRANT ALL ON public.marketplace_cart_items TO service_role;

-- ---------- 8. FX rates (live currency converter, display-only) ----------
CREATE TABLE IF NOT EXISTS public.marketplace_fx_rates (
  currency_code text PRIMARY KEY,
  rate_from_zar numeric NOT NULL CHECK (rate_from_zar > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_fx_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view marketplace fx rates" ON public.marketplace_fx_rates;
CREATE POLICY "Public can view marketplace fx rates"
  ON public.marketplace_fx_rates FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.marketplace_fx_rates TO anon, authenticated;
GRANT ALL ON public.marketplace_fx_rates TO service_role;

-- ---------- 9. SkinLabs® Picks (weekly-rotating curated set) ----------
CREATE TABLE IF NOT EXISTS public.marketplace_skinlabs_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  week_of date NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_of, product_id)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_skinlabs_picks_product_id ON public.marketplace_skinlabs_picks(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_skinlabs_picks_week_of ON public.marketplace_skinlabs_picks(week_of DESC);

ALTER TABLE public.marketplace_skinlabs_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view skinlabs picks" ON public.marketplace_skinlabs_picks;
CREATE POLICY "Public can view skinlabs picks"
  ON public.marketplace_skinlabs_picks FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.marketplace_skinlabs_picks TO anon, authenticated;
GRANT ALL ON public.marketplace_skinlabs_picks TO service_role;

-- ---------- 10. Storage: public product images bucket ----------
-- Unlike the private per-user 'skin-analysis-photos' bucket, this bucket is
-- public: product images must be readable by anyone, signed in or not.
INSERT INTO storage.buckets (id, name, public)
VALUES ('openhaus-product-images', 'openhaus-product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view openhaus product images" ON storage.objects;
CREATE POLICY "Public can view openhaus product images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'openhaus-product-images');

DROP POLICY IF EXISTS "Admins manage openhaus product images" ON storage.objects;
CREATE POLICY "Admins manage openhaus product images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'openhaus-product-images' AND public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (bucket_id = 'openhaus-product-images' AND public.has_role((select auth.uid()), 'admin'));
