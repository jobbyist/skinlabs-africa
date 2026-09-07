-- ============================================================================
-- SkinLabs Skincare Intelligence Database — Part 4: indexes for the query
-- patterns this schema exists to serve, plus two reusable helpers:
--   - current_product_prices: latest price per retailer listing, so nobody
--     has to hand-write "get the most recent row" logic ad hoc.
--   - search_products: "products containing ingredient X, suitable for skin
--     type Y, under price Z" — the exact query pattern this database was
--     built to answer (see supabase/SCHEMA.md for more examples).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (id) WHERE NOT is_discontinued;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON public.brands USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredients_inci_trgm ON public.ingredients USING gin (inci_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredients_common_trgm ON public.ingredients USING gin (common_name gin_trgm_ops) WHERE common_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_versions_product ON public.product_versions (product_id);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON public.product_ingredients (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_version ON public.product_ingredients (product_version_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_key ON public.product_ingredients (ingredient_id) WHERE is_key_ingredient;

CREATE INDEX IF NOT EXISTS idx_skin_type_fit_lookup ON public.product_skin_type_fit (skin_type_id, fit_rating);
CREATE INDEX IF NOT EXISTS idx_skin_type_fit_product ON public.product_skin_type_fit (product_id);
CREATE INDEX IF NOT EXISTS idx_product_concerns_concern ON public.product_concerns (concern_id);
CREATE INDEX IF NOT EXISTS idx_product_concerns_product ON public.product_concerns (product_id);

CREATE INDEX IF NOT EXISTS idx_product_claims_product ON public.product_claims (product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_product_type ON public.product_scores (product_id, score_type);
CREATE INDEX IF NOT EXISTS idx_product_climate_fit_profile ON public.product_climate_fit (climate_profile_id);

CREATE INDEX IF NOT EXISTS idx_retailer_products_variant ON public.retailer_products (product_variant_id);
CREATE INDEX IF NOT EXISTS idx_retailer_products_retailer ON public.retailer_products (retailer_id);
CREATE INDEX IF NOT EXISTS idx_retailer_products_available ON public.retailer_products (retailer_id) WHERE is_available;

-- The core price-history access pattern: "latest price for this listing" —
-- an index ordered by recorded_at desc makes that a fast top-1 lookup.
CREATE INDEX IF NOT EXISTS idx_product_prices_latest ON public.product_prices (retailer_product_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews (status);
CREATE INDEX IF NOT EXISTS idx_review_versions_review ON public.review_versions (review_id);
CREATE INDEX IF NOT EXISTS idx_review_evidence_review ON public.review_evidence (review_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_concerns_ingredient ON public.ingredient_concerns (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_concerns_concern ON public.ingredient_concerns (concern_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_interactions_a ON public.ingredient_interactions (ingredient_a_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_interactions_b ON public.ingredient_interactions (ingredient_b_id);

-- ---------- current_product_prices ----------
-- DISTINCT ON + the (retailer_product_id, recorded_at DESC) index above keeps
-- this to a single index scan per retailer listing rather than a full sort.
CREATE OR REPLACE VIEW public.current_product_prices AS
SELECT DISTINCT ON (rp.id)
  rp.id AS retailer_product_id,
  rp.product_variant_id,
  rp.retailer_id,
  pp.id AS price_id,
  pp.price_zar,
  pp.currency,
  pp.recorded_at,
  rp.is_available
FROM public.retailer_products rp
JOIN public.product_prices pp ON pp.retailer_product_id = rp.id
ORDER BY rp.id, pp.recorded_at DESC;

GRANT SELECT ON public.current_product_prices TO anon, authenticated;

-- ---------- search_products ----------
-- Answers exactly the brief's example query: "products available in SA
-- containing <ingredient>, suitable for <skin type>, under R<price>".
-- Any parameter can be omitted (NULL) to widen the search. Only considers
-- non-discontinued products with at least one in-stock retailer listing.
CREATE OR REPLACE FUNCTION public.search_products(
  p_ingredient_slug text DEFAULT NULL,
  p_skin_type_slug text DEFAULT NULL,
  p_max_price_zar numeric DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  product_id uuid,
  product_slug text,
  product_name text,
  brand_name text,
  category_name text,
  lowest_price_zar numeric,
  verification_status public.data_quality_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.slug,
    p.name,
    b.name,
    c.name,
    MIN(cpp.price_zar),
    p.verification_status
  FROM public.products p
  JOIN public.brands b ON b.id = p.brand_id
  LEFT JOIN public.categories c ON c.id = p.category_id
  JOIN public.product_variants pv ON pv.product_id = p.id
  JOIN public.current_product_prices cpp ON cpp.product_variant_id = pv.id AND cpp.is_available
  WHERE NOT p.is_discontinued
    AND (p_category_slug IS NULL OR c.slug = p_category_slug)
    AND (p_max_price_zar IS NULL OR cpp.price_zar <= p_max_price_zar)
    AND (
      p_ingredient_slug IS NULL OR EXISTS (
        SELECT 1 FROM public.product_ingredients pi
        JOIN public.product_versions pver ON pver.id = pi.product_version_id AND pver.is_current
        JOIN public.ingredients i ON i.id = pi.ingredient_id
        WHERE pver.product_id = p.id AND i.slug = p_ingredient_slug
      )
    )
    AND (
      p_skin_type_slug IS NULL OR EXISTS (
        SELECT 1 FROM public.product_skin_type_fit pstf
        JOIN public.skin_types st ON st.id = pstf.skin_type_id
        WHERE pstf.product_id = p.id AND st.slug = p_skin_type_slug
          AND pstf.fit_rating IN ('excellent', 'good')
      )
    )
  GROUP BY p.id, b.name, c.name
  ORDER BY p.name
  LIMIT p_limit;
$$;
REVOKE ALL ON FUNCTION public.search_products(text, text, numeric, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products(text, text, numeric, text, int) TO anon, authenticated, service_role;
