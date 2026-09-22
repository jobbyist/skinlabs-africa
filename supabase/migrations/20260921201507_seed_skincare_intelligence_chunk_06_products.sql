DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'lamelle-clarity-active-cleanse', b.id, c.id, 'Clarity Active Cleanse', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'lamelle' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'lamelle-clarity-active-cleanse';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'salicylic acid'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'mandelic acid'
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
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'lamelle-clarity-active-cleanse', 'A salicylic/mandelic acne cleanser that''s effective for oily, breakout-prone skin, especially in humid coastal heat.', 'published', now())
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
  VALUES (v_retailer_product_id, 380, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'lamelle-correctives-brighter-serum', b.id, c.id, 'Correctives Brite-Lite / Brighter Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'lamelle' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'lamelle-correctives-brighter-serum';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'tranexamic acid'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'niacinamide'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'arbutin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'hyperpigmentation'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'lamelle-correctives-brighter-serum', 'A multi-pathway pigment corrector with genuinely high efficacy, but the very premium price sinks its value score against local alternatives with similar actives.', 'published', now())
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
  VALUES (v_retailer_product_id, 1135, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.skinmiles.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'skinmiles'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'skinmiles';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 1199, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'lamelle-helase-50-spf', b.id, c.id, 'Helase 50 Broad Spectrum Sunscreen', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'lamelle' AND c.slug = 'sunscreen'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'lamelle-helase-50-spf';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'photolyase enzymes'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'pycnogenol'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'broad-spectrum uv filters'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;

  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 9, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'lamelle-helase-50-spf', 'Advanced, credible photoprotection with photolyase DNA-repair enzymes and Pycnogenol per the brand — can feel rich, and the ''DNA-repair'' framing exceeds what consumers can independently verify.', 'published', now())
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
  VALUES (v_retailer_product_id, 675, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'silki-vitc-alpha-arbutin', b.id, c.id, '10% Vitamin C + 1% Alpha Arbutin Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'silki' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'silki-vitc-alpha-arbutin';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'sodium ascorbyl phosphate'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'alpha arbutin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'hyaluronic acid'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'aloe ferox'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'hyperpigmentation'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'silki-vitc-alpha-arbutin', 'Sodium Ascorbyl Phosphate is a gentler, more stable vitamin C derivative than L-ascorbic acid — expect gentler, more gradual brightening.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.beautyontapp.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'beautyontapp'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'beautyontapp';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 280, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'silki-ha-polyglutamic', b.id, c.id, '2% Hyaluronic Acid + Polyglutamic Acid', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'silki' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'silki-ha-polyglutamic';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'polyglutamic acid'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dehydrated'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'silki-ha-polyglutamic', 'Polyglutamic acid holds even more water than HA — a genuinely good layered hydrator, best sealed with an occlusive inland.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.beautyontapp.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'beautyontapp'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'beautyontapp';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 260, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'silki-gentle-squalane-cleanser', b.id, c.id, 'Gentle Squalane Oil Cleanser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'silki' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'silki-gentle-squalane-cleanser';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'squalane'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'silki-gentle-squalane-cleanser', 'A squalane-based oil cleanser that''s gentle enough for daily use on dry or reactive skin.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.beautyontapp.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'beautyontapp'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'beautyontapp';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 220, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'skoon-wow-wow-hyaluron-c', b.id, c.id, 'Wow-Wow Wonder 3-Hyaluron + C Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'skoon' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'skoon-wow-wow-hyaluron-c';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'sodium ascorbyl phosphate'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'sodium hyaluronate'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'buchu extract'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'dullness'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dehydrated'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'skoon-wow-wow-hyaluron-c', 'Stable vitamin C, triple-weight HA and indigenous buchu make for a lovely formula, but the small 15ml size hurts the value score.', 'published', now())
  ON CONFLICT (slug) DO NOTHING;

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
  VALUES (v_retailer_product_id, 350, 'internal_editorial', 'unverified');

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
  SELECT 'skoon-b3-barrier-nanopillow', b.id, c.id, 'B3 Barrier Repair NanoPillow Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'skoon' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'skoon-b3-barrier-nanopillow';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'niacinamide'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'electrospun nanofibre'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'sensitivity-barrier'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'skoon-b3-barrier-nanopillow', 'A novel waterless electrospun-nanofibre niacinamide delivery format — genuinely innovative, though the premium format pricing is a hard sell.', 'published', now())
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
  VALUES (v_retailer_product_id, 700, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 729, 'internal_editorial', 'unverified');
END $product$;
