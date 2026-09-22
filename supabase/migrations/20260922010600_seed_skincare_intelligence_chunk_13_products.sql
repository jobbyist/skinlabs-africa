DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'bioderma-sebium-h2o', b.id, c.id, 'Sébium H2O Micellar Water', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'bioderma' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'bioderma-sebium-h2o';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'micellar complex'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'zinc gluconate'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'oily'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'acne-prone'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'bioderma-sebium-h2o', 'The micellar formula tailored to oily and combination skin — a KZN-heat favourite for makeup and SPF removal.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.dermastore.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'dermastore'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'dermastore';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 295, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 305, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'bioderma-sebium-keratoplus', b.id, c.id, 'Sébium Kerato+ Anti-Blemish Cream', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'bioderma' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'bioderma-sebium-keratoplus';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'salicylic acid derivative'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'zinc salicylate'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'acne-prone'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'oily'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'bioderma-sebium-keratoplus', 'A keratolytic acne treatment cream that''s a dependable step-up once cleansing alone isn''t enough.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.dermastore.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'dermastore'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'dermastore';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 490, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'justine-tissue-oil', b.id, c.id, 'Justine Tissue Oil', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'justine' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'justine-tissue-oil';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'multi-oil blend'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 5.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'justine-tissue-oil', 'A fragranced multi-oil budget staple for dry skin and scars — an accessible direct-sales classic, heavy for humid KZN.', 'published', now())
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
  VALUES (v_retailer_product_id, 129, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'justine-vitamin-e-body-lotion', b.id, c.id, 'Justine Vitamin E Moisturising Body Lotion', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'justine' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'justine-vitamin-e-body-lotion';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'vitamin e'
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
    (v_product_id, 'efficacy', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'justine-vitamin-e-body-lotion', 'A straightforward vitamin E body lotion that does the daily-hydration job without fuss — lighter than the Tissue Oil, so it layers more easily under clothes on humid coastal days.', 'published', now())
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
  VALUES (v_retailer_product_id, 109, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'avon-anew-vitc-serum', b.id, c.id, 'Avon Anew Vitamin C Radiance Maximising Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'avon' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'avon-anew-vitc-serum';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'vitamin c ~10%'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'oily'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'dullness'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'avon-anew-vitc-serum', 'A ~10% vitamin C brightening serum from a direct-sales staple — the alcohol-forward vehicle may not suit dry or sensitive skin, and can feel drying in Cape wind.', 'published', now())
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
  VALUES (v_retailer_product_id, 279, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'avon-anew-hydra-fusion-cream', b.id, c.id, 'Anew Hydra Fusion Deep Moisture Cream', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'avon' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'avon-anew-hydra-fusion-cream';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'hyaluronic acid'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dehydrated'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'avon-anew-hydra-fusion-cream', 'A dependable, hyaluronic-acid-led daily moisturiser that pairs sensibly with the Anew vitamin C serum in an AM/PM routine — nothing showy, just a solid hydration layer at a direct-sales price.', 'published', now())
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
  VALUES (v_retailer_product_id, 259, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'af-rooibos-marula-butter', b.id, c.id, 'Rooibos & Marula Body Butter', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'africology' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'af-rooibos-marula-butter';
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
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'shea butter'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'af-rooibos-marula-butter', 'A rich, spa-grade body butter with a genuinely pleasant rooibos-and-marula scent story — effective on dry winter skin, though it runs heavy for humid KZN days.', 'published', now())
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
  VALUES (v_retailer_product_id, 385, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'af-aloe-ferox-serum', b.id, c.id, 'Aloe Ferox Hydrating Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'africology' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'af-aloe-ferox-serum';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'aloe ferox'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'af-aloe-ferox-serum', 'A soothing, well-evidenced aloe ferox serum for hydration and mild inflammation — a comfort pick rather than a high-strength actives serum.', 'published', now())
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
  VALUES (v_retailer_product_id, 420, 'internal_editorial', 'unverified');
END $product$;
