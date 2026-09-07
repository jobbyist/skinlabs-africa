-- ============================================================================
-- SkinLabs Skincare Intelligence Database — Part 3: retailer listings, price
-- history, reviews, review versions and review evidence.
--
-- product_prices is append-only: every price check inserts a new row rather
-- than overwriting one, so price history is a first-class feature, not
-- something bolted on later. "Current price" = the latest row per
-- retailer_product (see the current_product_prices view in the indexes/
-- functions migration).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.retailer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  retailer_id uuid NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  retailer_url text,
  retailer_sku text,
  is_available boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  -- provenance
  source_type public.data_source_type NOT NULL DEFAULT 'retailer_listing',
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_variant_id, retailer_id)
);

CREATE TABLE IF NOT EXISTS public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_product_id uuid NOT NULL REFERENCES public.retailer_products(id) ON DELETE CASCADE,
  price_zar numeric NOT NULL CHECK (price_zar >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source_url text,
  source_type public.data_source_type NOT NULL DEFAULT 'retailer_listing',
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  verdict_summary text NOT NULL,
  verdict_full text,
  reviewer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  methodology_version text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  verdict_summary text NOT NULL,
  verdict_full text,
  changed_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (review_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.review_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK (evidence_type IN
    ('ingredient_analysis', 'clinical_study', 'brand_data', 'lab_test', 'price_check', 'user_testing', 'other')),
  source_url text,
  source_type public.data_source_type,
  source_date date,
  summary text NOT NULL,
  confidence public.confidence_level,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------- RLS ----------
ALTER TABLE public.retailer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.retailer_products FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_prices FOR SELECT USING (true);
-- Only published reviews are public; admins see everything (drafts included).
CREATE POLICY "Public reads published reviews" ON public.reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all reviews" ON public.reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Evidence and version history back editorial substantiation, not a consumer feature.
CREATE POLICY "Admins read review_versions" ON public.review_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read review_evidence" ON public.review_evidence FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage retailer_products" ON public.retailer_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_prices" ON public.product_prices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage review_versions" ON public.review_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage review_evidence" ON public.review_evidence FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.retailer_products, public.product_prices TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.review_versions, public.review_evidence TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.retailer_products, public.product_prices, public.reviews,
  public.review_versions, public.review_evidence TO authenticated;
GRANT ALL ON public.retailer_products, public.product_prices, public.reviews,
  public.review_versions, public.review_evidence TO service_role;
