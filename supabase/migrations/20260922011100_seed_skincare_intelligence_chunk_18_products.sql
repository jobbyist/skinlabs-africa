DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'soil-rosehip-renewal-oil', b.id, c.id, 'Rosehip Renewal Facial Oil', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'soil-organic-aromatherapy' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'soil-rosehip-renewal-oil';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'rosehip oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'texture-scarring'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'soil-rosehip-renewal-oil', 'Rosehip oil is a genuinely well-regarded natural active for scarring and dryness — a solid pick from one of SA''s longest-running certified organic aromatherapy houses.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 295, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.wellnesswarehouse.com/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'wellness-warehouse'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'wellness-warehouse';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 309, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'soil-lavender-calming-cleanser', b.id, c.id, 'Lavender Calming Cleanser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'soil-organic-aromatherapy' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'soil-lavender-calming-cleanser';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'lavender essential oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'soil-lavender-calming-cleanser', 'An essential-oil-forward cleanser worth flagging for fragrance-sensitive skin — a pleasant evening ritual step for everyone else.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 210, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.wellnesswarehouse.com/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'wellness-warehouse'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'wellness-warehouse';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 225, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'td-marula-rooibos-oil', b.id, c.id, 'Marula & Rooibos Nourishing Oil', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'terres-d-afrique' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'td-marula-rooibos-oil';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'marula oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'rooibos extract'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'td-marula-rooibos-oil', 'Performs solidly for dry-to-normal skin, without the disclosed-percentage actives that dominate the top of this file — the fair-trade sourcing story is a genuine point of difference.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 355, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'td-kalahari-melon-moisturiser', b.id, c.id, 'Kalahari Melon Seed Moisturiser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'terres-d-afrique' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'td-kalahari-melon-moisturiser';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'kalahari melon seed oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'td-kalahari-melon-moisturiser', 'Showcases a rarer African botanical most other brands in this set don''t use, backed by a genuine fair-trade harvesting story.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 330, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'ol-olive-beeswax-balm', b.id, c.id, 'Olive & Beeswax Repair Balm', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'oh-lief' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'ol-olive-beeswax-balm';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'olive oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'beeswax'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'ol-olive-beeswax-balm', 'Olive oil and beeswax are about as low-risk a base as skincare gets — sensible for babies, pregnancy-safe routines or very reactive skin, though not an actives-grade treatment.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://clicks.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'clicks'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'clicks';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 145, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.faithful-to-nature.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'faithful-to-nature'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'faithful-to-nature';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 155, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'ol-gentle-family-cleanser', b.id, c.id, 'Gentle Family Cleanser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'oh-lief' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'ol-gentle-family-cleanser';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'olive oil'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'aloe vera'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'ol-gentle-family-cleanser', 'Formulated conservatively enough for baby skin, which by extension makes it a gentle, low-irritation option for adult sensitive-skin routines too.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://clicks.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'clicks'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'clicks';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 130, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.faithful-to-nature.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'faithful-to-nature'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'faithful-to-nature';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 139, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'bao-melanin-brightening-serum', b.id, c.id, 'Melanin-Rich Skin Brightening Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'black-african-organics' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'bao-melanin-brightening-serum';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'alpha arbutin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'niacinamide'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'hyperpigmentation'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'bao-melanin-brightening-serum', 'A sound tyrosinase-inhibiting approach to the post-inflammatory hyperpigmentation that generic ''brightening'' marketing often glosses over on deeper skin tones.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 265, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'bao-shea-deep-moisture-cream', b.id, c.id, 'Shea Deep Moisture Cream', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'black-african-organics' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'bao-shea-deep-moisture-cream';
  END IF;

  INSERT INTO public.product_versions (product_id, version_label, is_current, source_type, verification_status)
  VALUES (v_product_id, 'Initial import', true, 'internal_editorial', 'unverified')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM public.product_versions WHERE product_id = v_product_id AND is_current LIMIT 1;
  END IF;

  INSERT INTO public.product_variants (product_id, variant_label, is_default)
  VALUES (v_product_id, 'Standard', true)
  ON CONFLICT (product_id, variant_label) DO NOTHING
  RETURNING id INTO v_variant_id;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id FROM public.product_variants WHERE product_id = v_product_id AND variant_label = 'Standard';
  END IF;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'shea butter'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'bao-shea-deep-moisture-cream', 'A rich, effective daily moisturiser for drier melanin-rich skin — traditional botanicals blended with modern humectants.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'brand-direct'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'brand-direct';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 210, 'internal_editorial', 'unverified');
END $product$;
