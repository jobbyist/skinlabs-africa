-- ============================================================================
-- SkinLabs Skincare Intelligence Database — Part 2: products, variants,
-- reformulation versions, product-ingredient lists, skin-type fit, claims,
-- scores and climate-fit.
--
-- Two distinct kinds of "product change over time" are modelled separately:
--   - product_variants: different SKUs of the same product (size, shade) —
--     these can have different prices/retailer availability.
--   - product_versions: reformulations of the same product over time — these
--     can have different ingredient lists. product_ingredients hangs off a
--     version, not the bare product, so "what was in this product in 2023 vs
--     2025" is answerable rather than overwritten.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  is_discontinued boolean NOT NULL DEFAULT false,
  discontinued_at date,
  launch_date date,
  -- provenance
  source_url text,
  source_type public.data_source_type,
  source_date date,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confidence public.confidence_level,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  source_url text,
  source_type public.data_source_type NOT NULL DEFAULT 'other',
  source_date date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_label text NOT NULL,
  size_ml numeric,
  sku text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant_label)
);

CREATE TABLE IF NOT EXISTS public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version_label text NOT NULL,
  effective_from date,
  effective_to date,
  reformulation_notes text,
  is_current boolean NOT NULL DEFAULT true,
  source_url text,
  source_type public.data_source_type,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version_label)
);
CREATE INDEX IF NOT EXISTS idx_product_versions_product_current ON public.product_versions (product_id) WHERE is_current;

CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  position int,
  concentration_percent numeric,
  is_key_ingredient boolean NOT NULL DEFAULT false,
  -- provenance
  source_url text,
  source_type public.data_source_type,
  source_date date,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confidence public.confidence_level,
  last_verified_at timestamptz,
  UNIQUE (product_version_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.product_skin_type_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  skin_type_id uuid NOT NULL REFERENCES public.skin_types(id) ON DELETE CASCADE,
  fit_rating public.skin_fit_rating NOT NULL,
  notes text,
  confidence public.confidence_level,
  UNIQUE (product_id, skin_type_id)
);

CREATE TABLE IF NOT EXISTS public.product_concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  concern_id uuid NOT NULL REFERENCES public.skin_concerns(id) ON DELETE CASCADE,
  notes text,
  confidence public.confidence_level,
  UNIQUE (product_id, concern_id)
);

CREATE TABLE IF NOT EXISTS public.product_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  claim_text text NOT NULL,
  claim_type public.claim_type NOT NULL DEFAULT 'marketing',
  is_substantiated boolean NOT NULL DEFAULT false,
  substantiation_source_url text,
  substantiation_notes text,
  -- provenance
  source_url text,
  source_type public.data_source_type,
  source_date date,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confidence public.confidence_level,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scores are kept generic (score_type as text, not a closed enum) so a new
-- scoring dimension can be added without a migration — methodology_version
-- is what actually anchors comparability, not the column list.
CREATE TABLE IF NOT EXISTS public.product_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score_type text NOT NULL, -- e.g. 'efficacy' | 'value' | 'texture' | 'climate_fit'
  score numeric(4,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  methodology_version text NOT NULL,
  scored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scored_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  -- provenance
  source_url text,
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  confidence public.confidence_level,
  last_verified_at timestamptz,
  UNIQUE (product_id, score_type, methodology_version)
);

CREATE TABLE IF NOT EXISTS public.product_climate_fit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  climate_profile_id uuid NOT NULL REFERENCES public.climate_profiles(id) ON DELETE CASCADE,
  fit_score numeric(4,1) CHECK (fit_score >= 0 AND fit_score <= 10),
  rationale text,
  methodology_version text,
  -- provenance
  verification_status public.data_quality_status NOT NULL DEFAULT 'unverified',
  confidence public.confidence_level,
  last_verified_at timestamptz,
  UNIQUE (product_id, climate_profile_id)
);

-- ---------- RLS ----------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skin_type_fit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_climate_fit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_versions FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_ingredients FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_skin_type_fit FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_concerns FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_claims FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_scores FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.product_climate_fit FOR SELECT USING (true);
CREATE POLICY "Admins can read product sources" ON public.product_sources FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_sources" ON public.product_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_variants" ON public.product_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_versions" ON public.product_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_ingredients" ON public.product_ingredients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_skin_type_fit" ON public.product_skin_type_fit FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_concerns" ON public.product_concerns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_claims" ON public.product_claims FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_scores" ON public.product_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage product_climate_fit" ON public.product_climate_fit FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.products, public.product_variants, public.product_versions, public.product_ingredients,
  public.product_skin_type_fit, public.product_concerns, public.product_claims, public.product_scores, public.product_climate_fit
  TO anon, authenticated;
GRANT SELECT ON public.product_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products, public.product_sources, public.product_variants, public.product_versions,
  public.product_ingredients, public.product_skin_type_fit, public.product_concerns, public.product_claims, public.product_scores,
  public.product_climate_fit TO authenticated;
GRANT ALL ON public.products, public.product_sources, public.product_variants, public.product_versions,
  public.product_ingredients, public.product_skin_type_fit, public.product_concerns, public.product_claims, public.product_scores,
  public.product_climate_fit TO service_role;
