DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'an-rooibos-antiageing-serum', b.id, c.id, 'Rooibos Anti-Ageing Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'annique' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'an-rooibos-antiageing-serum';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'rooibos extract'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'normal'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'mature'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'an-rooibos-antiageing-serum', 'A pleasant, dependable rooibos-antioxidant serum from the brand most responsible for putting Cederberg rooibos on the SA skincare map — don''t expect retinoid-grade results.', 'published', now())
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
  VALUES (v_retailer_product_id, 425, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'an-rooibos-hydrating-day-cream', b.id, c.id, 'Rooibos Hydrating Day Cream', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'annique' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'an-rooibos-hydrating-day-cream';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'rooibos extract'
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
    (v_product_id, 'efficacy', 6, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'an-rooibos-hydrating-day-cream', 'An honest, on-brand execution of Annique''s rooibos positioning — a comfortable, if unremarkable, daily moisturiser.', 'published', now())
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
  VALUES (v_retailer_product_id, 360, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'sw-bakuchiol-serum', b.id, c.id, 'Bakuchiol Retinol Alternative Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'swiitch-beauty' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'sw-bakuchiol-serum';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'bakuchiol'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 6.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'sw-bakuchiol-serum', 'A sensible retinol alternative for pregnancy-safe or retinoid-sensitive routines — bakuchiol''s evidence base is thinner than retinol''s, but it''s a genuinely useful gentler option.', 'published', now())
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
  VALUES (v_retailer_product_id, 245, 'internal_editorial', 'unverified');

  INSERT INTO public.retailer_products (product_variant_id, retailer_id, retailer_url, is_available, source_type, verification_status)
  SELECT v_variant_id, ret.id, 'https://www.superbalist.com/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'superbalist'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'superbalist';
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
  SELECT 'sw-rosewater-toner', b.id, c.id, 'Rosewater Hydrating Toner', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'swiitch-beauty' AND c.slug = 'mist'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'sw-rosewater-toner';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'rosewater'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'glycerin'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'dehydrated'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 5.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'sw-rosewater-toner', 'A simple, inoffensive rosewater toning mist — a pleasant hydrating step rather than a treatment product, developed from genuine customer feedback.', 'published', now())
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
  SELECT v_variant_id, ret.id, 'https://www.superbalist.com/', true, 'internal_editorial', 'unverified'
  FROM public.retailers ret WHERE ret.slug = 'superbalist'
  ON CONFLICT (product_variant_id, retailer_id) DO NOTHING
  RETURNING id INTO v_retailer_product_id;

  IF v_retailer_product_id IS NULL THEN
    SELECT rp.id INTO v_retailer_product_id FROM public.retailer_products rp
    JOIN public.retailers ret2 ON ret2.id = rp.retailer_id
    WHERE rp.product_variant_id = v_variant_id AND ret2.slug = 'superbalist';
  END IF;

  INSERT INTO public.product_prices (retailer_product_id, price_zar, source_type, verification_status)
  VALUES (v_retailer_product_id, 175, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'cfs-everyday-spf50', b.id, c.id, 'Everyday SPF50 Sunscreen', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'cf-suncare' AND c.slug = 'sunscreen'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'cfs-everyday-spf50';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'broad-spectrum uv filters'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;

  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 9, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'cfs-everyday-spf50', 'A genuinely wearable, non-greasy broad-spectrum SPF50 from a brand that''s chosen to specialise in sun protection rather than chase a full range — daily reapplication still matters more than brand choice.', 'published', now())
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
  VALUES (v_retailer_product_id, 220, 'internal_editorial', 'unverified');

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
  VALUES (v_retailer_product_id, 235, 'internal_editorial', 'unverified');
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'cfs-tinted-mineral-spf30', b.id, c.id, 'Tinted Mineral SPF30', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'cf-suncare' AND c.slug = 'sunscreen'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'cfs-tinted-mineral-spf30';
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
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'sensitive'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'cfs-tinted-mineral-spf30', 'A tinted mineral SPF30 that wears comfortably day to day — the ceiling is SPF30 rather than 50, so pair with shade and reapplication in peak UV.', 'published', now())
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
  VALUES (v_retailer_product_id, 245, 'internal_editorial', 'unverified');

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
  SELECT 'cor-niacinamide-clarifying-serum', b.id, c.id, 'Niacinamide Clarifying Serum', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'cor-skincare' AND c.slug = 'serum'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'cor-niacinamide-clarifying-serum';
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
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'oily'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_skin_type_fit (product_id, skin_type_id, fit_rating)
  SELECT v_product_id, st.id, 'good' FROM public.skin_types st WHERE st.slug = 'combination'
  ON CONFLICT (product_id, skin_type_id) DO NOTHING;
  INSERT INTO public.product_scores (product_id, score_type, score, methodology_version, verification_status)
  VALUES
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'cor-niacinamide-clarifying-serum', 'A tight, no-frills niacinamide serum that handles oil control and tone competently — a sensible entry point for a simplified routine.', 'published', now())
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
END $product$;

DO $product$
DECLARE
  v_product_id uuid;
  v_version_id uuid;
  v_variant_id uuid;
  v_retailer_product_id uuid;
BEGIN
  INSERT INTO public.products (slug, brand_id, category_id, name, source_type, verification_status)
  SELECT 'cor-ceramide-barrier-moisturiser', b.id, c.id, 'Ceramide Barrier Moisturiser', 'internal_editorial', 'unverified'
  FROM public.brands b, public.categories c
  WHERE b.slug = 'cor-skincare' AND c.slug = 'moisturiser'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_product_id;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM public.products WHERE slug = 'cor-ceramide-barrier-moisturiser';
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
  FROM public.ingredients i WHERE lower(i.inci_name) = 'ceramides'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'cholesterol'
  ON CONFLICT (product_version_id, ingredient_id) DO NOTHING;
  INSERT INTO public.product_ingredients (product_version_id, ingredient_id, concentration_percent, is_key_ingredient, source_type, verification_status)
  SELECT v_version_id, i.id, NULL, true, 'internal_editorial', 'unverified'
  FROM public.ingredients i WHERE lower(i.inci_name) = 'fatty acids'
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
    (v_product_id, 'efficacy', 7, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'value', 7.5, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'texture', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified'),
    (v_product_id, 'climate_fit', 8, 'SkinLabs Editorial Scoring Reference — August 2026', 'unverified')
  ON CONFLICT (product_id, score_type, methodology_version) DO NOTHING;

  INSERT INTO public.reviews (product_id, slug, verdict_summary, status, published_at)
  VALUES (v_product_id, 'cor-ceramide-barrier-moisturiser', 'A solid, unfussy barrier-support cream that layers cleanly under the niacinamide serum — does one job well rather than chasing a long ingredient list, which suits COR''s whole modest-claims approach.', 'published', now())
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
  VALUES (v_retailer_product_id, 225, 'internal_editorial', 'unverified');
END $product$;
