DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'lm-marula-oil-elixir', b.id, c.id, 'Marula Oil Elixir', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'lulu-marula' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'lm-marula-oil-elixir';
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
  VALUES (v_product_id, 'lm-marula-oil-elixir', 'A clean, well-absorbed single-oil product — mineral-oil-free and palm-oil-free, a genuine differentiator from the tissue-oil brands elsewhere in this file.', 'published', now())
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
  VALUES (v_retailer_product_id, 320, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'lm-botanical-hydrating-cream', b.id, c.id, 'Botanical Hydrating Cream', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'lulu-marula' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'lm-botanical-hydrating-cream';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'plant extracts'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
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
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'lm-botanical-hydrating-cream', 'Layers easily without a greasy finish — a clearly stated mineral-oil-free, palm-oil-free formulation policy carried through consistently.', 'published', now())
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
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'afa-bulbine-healing-gel', b.id, c.id, 'Bulbine Frutescens Healing Gel', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'afari' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'afa-bulbine-healing-gel';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'bulbine frutescens'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'sensitivity-barrier'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'afa-bulbine-healing-gel', 'A genuinely distinctive single-ingredient formula built around a well-known indigenous SA succulent used traditionally for minor burns, cuts and irritation — performs credibly for soothing.', 'published', now())
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
  VALUES (v_retailer_product_id, 165, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 179, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'afa-anti-inflammatory-body-oil', b.id, c.id, 'Anti-Inflammatory Body Oil', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'afari' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'afa-anti-inflammatory-body-oil';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'bulbine frutescens'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'botanical oil blend'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'sensitivity-barrier'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'afa-anti-inflammatory-body-oil', 'Extends the same calming, Bulbine-led positioning into a daily moisturising oil — the women-harvester sourcing model behind it is a genuine, verifiable point of difference rather than a marketing line.', 'published', now())
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
  VALUES (v_retailer_product_id, 195, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 209, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'pb-chemical-free-family-moisturiser', b.id, c.id, 'Gentle Family Moisturiser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'pure-beginnings' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'pb-chemical-free-family-moisturiser';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'organic herbal extracts'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
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
  VALUES (v_product_id, 'pb-chemical-free-family-moisturiser', 'Formulated conservatively enough for baby skin, which makes it a gentle, low-irritation option for adult sensitive-skin routines too — a comfort-and-protection product, not a treatment one.', 'published', now())
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
  VALUES (v_retailer_product_id, 140, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 149, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'pb-gentle-baby-safe-cleanser', b.id, c.id, 'Gentle Baby-Safe Cleanser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'pure-beginnings' AND c.slug = 'cleanser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'pb-gentle-baby-safe-cleanser';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'organic herbal extracts'
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
  VALUES (v_product_id, 'pb-gentle-baby-safe-cleanser', 'A genuinely family-first, baby-safe cleanser combining traditional herbal botanicals with South African plant ingredients.', 'published', now())
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
  VALUES (v_retailer_product_id, 125, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 135, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'dp-tinted-spf-deeper-tones', b.id, c.id, 'Tinted Sunscreen for Deeper Skin Tones', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'dermopal' AND c.slug = 'sunscreen'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'dp-tinted-spf-deeper-tones';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'zinc oxide'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'iron oxides'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;

  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'dp-tinted-spf-deeper-tones', 'Fills a real, well-documented gap — sunscreen shade-matched for darker skin tones with no white cast, matters as much for daily wearability as for protection.', 'published', now())
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
  VALUES (v_retailer_product_id, 275, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.dischem.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'dis-chem'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'dis-chem';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 289, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'dp-scar-stretch-mark-oil', b.id, c.id, 'Scar & Stretch Mark Oil', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'dermopal' AND c.slug = 'body'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'dp-scar-stretch-mark-oil';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'botanical oil blend'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_concerns (product_id, concern_id)
  SELECT v_product_id, sc.id FROM public.skin_concerns sc WHERE sc.slug = 'texture-scarring'
  ON CONFLICT (product_id, concern_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dry'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'dp-scar-stretch-mark-oil', 'A competent, if familiar, oil blend in a category Bio-Oil and Portia M already crowd — Dermopal''s real differentiator is the SPF, not this body oil.', 'published', now())
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
  VALUES (v_retailer_product_id, 165, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.dischem.co.za/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'dis-chem'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'dis-chem';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 175, 'internal_editorial', 'unverified');
END $product$;
