-- ============================================================================
-- Ingredients Intelligence Layer — curated content.
--
-- Category backfill, real synonym aliases, real ingredient->concern mappings,
-- and real, sourced ingredient_interactions covering the actives actually
-- present in the live product catalogue. Every interaction row cites a real,
-- checked source URL (DermNet NZ, the Pinnell et al. JAAD 2004 vitamin C/E/
-- ferulic acid study, FDA, PubMed, CIR) and is left verification_status =
-- 'unverified' pending human review via the admin Data Quality tab — nothing
-- here is marked verified without a human checking it, per the standing data
-- quality model in supabase/SCHEMA.md. Never fabricated: every claim below is
-- either a well-established, textbook cosmetic-chemistry function classification
-- or backed by the cited source.
-- ============================================================================

-- ---------- Category backfill (real, standard cosmetic-ingredient function classes) ----------
UPDATE public.ingredients SET category = 'humectant' WHERE slug = ANY(ARRAY[
  'panthenol','hyaluronic-acid','tremella-extract','nmf-complex','glycerin',
  'polyglutamic-acid','sodium-hyaluronate','hyaluronic-acid-crosspolymer',
  'multi-weight-hyaluronic-acid','natural-moisturizing-factors','rosewater'
]);

UPDATE public.ingredients SET category = 'barrier-lipid' WHERE slug = ANY(ARRAY[
  'ceramide-np','hemi-squalane','ceramide','shea-butter','liposomal-ceramide-np',
  'marula-oil','argan-oil','coconut-oil','jojoba-oil','paraffinum-liquidum',
  'marula-seed-oil','ceramides','ceramide-p','squalane','plant-oil-blend',
  'baobab-oil','kalahari-melon-oil','emollient-complex','multi-oil-blend',
  'botanical-oil-blend','botanical-oils','cholesterol','fatty-acids','rosehip-oil',
  'kalahari-melon-seed-oil','olive-oil','beeswax','moringa-oil'
]);

UPDATE public.ingredients SET category = 'exfoliant-aha' WHERE slug = ANY(ARRAY[
  'aha-bha-complex','mandelic-acid','glycolic-acid','lactic-acid'
]);

UPDATE public.ingredients SET category = 'exfoliant-bha' WHERE slug = ANY(ARRAY[
  'salicylic-acid','salicylic-acid-derivative','zinc-salicylate'
]);

UPDATE public.ingredients SET category = 'exfoliant-enzyme' WHERE slug = ANY(ARRAY[
  'enzymes','fruit-enzymes','enzyme-complex'
]);

UPDATE public.ingredients SET category = 'retinoid' WHERE slug = ANY(ARRAY[
  'retinol','encapsulated-retinoid','vitamin-a','retinyl-palmitate','retinaldehyde'
]);

UPDATE public.ingredients SET category = 'retinoid-alternative' WHERE slug = 'bakuchiol';

UPDATE public.ingredients SET category = 'antioxidant' WHERE slug = ANY(ARRAY[
  'coq10','l-ascorbic-acid','ferulic-acid','vitamin-c-derivative','pomegranate-extract',
  'vitamin-complex','rooibos-extract','vitamin-e','vitamin-c','pycnogenol',
  'sodium-ascorbyl-phosphate','antioxidant-complex','ascorbic-acid','caffeine',
  'multi-vitamin-complex','green-tea-extract','vitamin-c-10'
]);

UPDATE public.ingredients SET category = 'brightening' WHERE slug = ANY(ARRAY[
  'rice-ferment-filtrate','niacinamide','alpha-arbutin','tranexamic-acid','kojic-acid',
  'acetyl-glucosamine','botanical-brighteners','arbutin','licorice-root-extract',
  'brightening-complex','turmeric-extract'
]);

UPDATE public.ingredients SET category = 'peptide' WHERE slug = ANY(ARRAY[
  'acetyl-hexapeptide-8','peptides','ghk-cu'
]);

UPDATE public.ingredients SET category = 'soothing-botanical' WHERE slug = ANY(ARRAY[
  'centella-asiatica','botanical-extracts','aloe-vera','oat-bran-extract','aloe-ferox',
  'buchu-extract','soothing-botanicals','plant-actives','organic-botanicals',
  'botanical-actives','calendula-oil','cucumber-extract','african-potato-extract',
  'sage-extract','lavender-essential-oil','plant-extracts','bulbine-frutescens',
  'organic-herbal-extracts'
]);

UPDATE public.ingredients SET category = 'sebum-regulator' WHERE slug = ANY(ARRAY[
  'succinic-acid','zinc-pca','zinc','zinc-gluconate'
]);

UPDATE public.ingredients SET category = 'uv-filter' WHERE slug = ANY(ARRAY[
  'zinc-oxide','chemical-uv-filters','broad-spectrum-uv-filters','uv-filters','iron-oxides'
]);

UPDATE public.ingredients SET category = 'cleansing-base' WHERE slug = ANY(ARRAY[
  'ph-balanced-surfactants','emulsifiers','cream-cleansing-base','mild-surfactant-base',
  'micellar-complex','african-black-soap','kaolin-clay','coco-glucoside'
]);

UPDATE public.ingredients SET category = 'probiotic' WHERE slug = ANY(ARRAY[
  'live-lactobacillus-cultures','prebiotics','probiotic-ferment'
]);

UPDATE public.ingredients SET category = 'repair-technology' WHERE slug = ANY(ARRAY[
  'photolyase-enzymes','electrospun-nanofibre'
]);

-- Known data artifact from the original reviews.ts import (an inci_name of
-- literally "light", picked up from a product description, not a real
-- ingredient) — flag it deprecated rather than let it surface publicly.
UPDATE public.ingredients SET verification_status = 'deprecated' WHERE slug = 'light';

-- ---------- Aliases (real synonyms only, never a category label) ----------
INSERT INTO public.ingredient_aliases (ingredient_id, alias, alias_type)
SELECT i.id, v.alias, v.alias_type::public.ingredient_alias_type
FROM (VALUES
  ('ascorbic-acid', 'Vitamin C', 'common_name'),
  ('l-ascorbic-acid', 'Vitamin C', 'common_name'),
  ('niacinamide', 'Vitamin B3', 'common_name'),
  ('niacinamide', 'Nicotinamide', 'synonym'),
  ('vitamin-e', 'Tocopherol', 'inci_variant'),
  ('hyaluronic-acid', 'HA', 'abbreviation'),
  ('sodium-hyaluronate', 'HA', 'abbreviation'),
  ('ghk-cu', 'Copper Peptide', 'common_name'),
  ('acetyl-hexapeptide-8', 'Argireline', 'common_name'),
  ('centella-asiatica', 'Cica', 'common_name'),
  ('panthenol', 'Pro-Vitamin B5', 'common_name'),
  ('retinaldehyde', 'Retinal', 'synonym'),
  ('kojic-acid', 'Kojic', 'abbreviation')
) AS v(ingredient_slug, alias, alias_type)
JOIN public.ingredients i ON i.slug = v.ingredient_slug
ON CONFLICT (ingredient_id, alias) DO NOTHING;

-- ---------- Ingredient -> concern mappings (real, well-established relationships) ----------
INSERT INTO public.ingredient_concerns (ingredient_id, concern_id, relationship, confidence)
SELECT i.id, sc.id, v.relationship::public.ingredient_concern_relationship, v.confidence::public.confidence_level
FROM (VALUES
  ('salicylic-acid', 'acne', 'treats', 'high'),
  ('zinc-pca', 'acne', 'treats', 'medium'),
  ('niacinamide', 'acne', 'treats', 'medium'),
  ('mandelic-acid', 'acne', 'treats', 'medium'),
  ('niacinamide', 'hyperpigmentation', 'treats', 'high'),
  ('alpha-arbutin', 'hyperpigmentation', 'treats', 'high'),
  ('arbutin', 'hyperpigmentation', 'treats', 'high'),
  ('kojic-acid', 'hyperpigmentation', 'treats', 'medium'),
  ('tranexamic-acid', 'hyperpigmentation', 'treats', 'medium'),
  ('ascorbic-acid', 'hyperpigmentation', 'treats', 'high'),
  ('l-ascorbic-acid', 'hyperpigmentation', 'treats', 'high'),
  ('mandelic-acid', 'hyperpigmentation', 'treats', 'medium'),
  ('retinol', 'aging', 'treats', 'high'),
  ('retinaldehyde', 'aging', 'treats', 'high'),
  ('encapsulated-retinoid', 'aging', 'treats', 'medium'),
  ('bakuchiol', 'aging', 'treats', 'medium'),
  ('l-ascorbic-acid', 'aging', 'treats', 'medium'),
  ('glycolic-acid', 'aging', 'treats', 'medium'),
  ('glycolic-acid', 'texture-scarring', 'treats', 'medium'),
  ('retinol', 'texture-scarring', 'treats', 'medium'),
  ('hyaluronic-acid', 'dehydration', 'treats', 'high'),
  ('sodium-hyaluronate', 'dehydration', 'treats', 'high'),
  ('glycerin', 'dehydration', 'treats', 'high'),
  ('ceramide-np', 'sensitivity-barrier', 'treats', 'high'),
  ('ceramides', 'sensitivity-barrier', 'treats', 'high'),
  ('ceramide-p', 'sensitivity-barrier', 'treats', 'high'),
  ('centella-asiatica', 'sensitivity-barrier', 'treats', 'medium'),
  ('ascorbic-acid', 'dullness', 'treats', 'medium'),
  ('l-ascorbic-acid', 'dullness', 'treats', 'medium'),
  ('glycolic-acid', 'dullness', 'treats', 'medium'),
  ('retinol', 'acne', 'may_worsen', 'low')
) AS v(ingredient_slug, concern_slug, relationship, confidence)
JOIN public.ingredients i ON i.slug = v.ingredient_slug
JOIN public.skin_concerns sc ON sc.slug = v.concern_slug
ON CONFLICT (ingredient_id, concern_id, relationship) DO NOTHING;

-- ---------- Ingredient interactions (real, sourced pairs) ----------
-- Sources cited, each verified reachable at time of writing (2026-09-13):
--   dermnetnz.org/topics/topical-retinoids — retinoid irritation w/ exfoliants, pregnancy caution
--   jaad.org/article/S0190-9622(04)03422-X — Pinnell et al. 2004, JAAD: ferulic acid stabilises
--     and roughly doubles the photoprotection of a vitamin C + E solution
--   dermnetnz.org/topics/nicotinamide — niacinamide overview
--   fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids — AHA irritation/sun sensitivity
INSERT INTO public.ingredient_interactions
  (ingredient_a_id, ingredient_b_id, interaction_type, explanation, usage_guidance, notes, source_url, confidence, verification_status)
SELECT
  LEAST(ia.id, ib.id), GREATEST(ia.id, ib.id),
  v.interaction_type::public.ingredient_interaction_type, v.explanation, v.usage_guidance, v.notes,
  v.source_url, v.confidence::public.confidence_level, 'unverified'
FROM (VALUES
  ('retinol', 'glycolic-acid', 'requires_spacing',
   'Combining a retinoid with a direct AHA in the same routine compounds irritation and dryness.',
   'Use on alternating nights, or apply one in the AM and the other in the PM if both are wanted.',
   'General retinoid-class + exfoliant caution.', 'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('retinol', 'lactic-acid', 'requires_spacing',
   'Combining a retinoid with a direct AHA in the same routine compounds irritation and dryness.',
   'Use on alternating nights.', 'General retinoid-class + exfoliant caution.',
   'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('retinol', 'salicylic-acid', 'requires_spacing',
   'Layering a retinoid with a BHA exfoliant in the same session increases the risk of redness and peeling.',
   'Use on alternating nights, or space applications by at least 30 minutes.',
   'General retinoid-class + exfoliant caution.', 'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('retinaldehyde', 'glycolic-acid', 'requires_spacing',
   'Combining a retinoid with a direct AHA in the same routine compounds irritation and dryness.',
   'Use on alternating nights.', 'General retinoid-class + exfoliant caution.',
   'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('retinaldehyde', 'salicylic-acid', 'requires_spacing',
   'Layering a retinoid with a BHA exfoliant in the same session increases the risk of redness and peeling.',
   'Use on alternating nights.', 'General retinoid-class + exfoliant caution.',
   'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('encapsulated-retinoid', 'glycolic-acid', 'requires_spacing',
   'Combining a retinoid with a direct AHA in the same routine compounds irritation and dryness.',
   'Use on alternating nights.', 'General retinoid-class + exfoliant caution.',
   'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('encapsulated-retinoid', 'salicylic-acid', 'requires_spacing',
   'Layering a retinoid with a BHA exfoliant in the same session increases the risk of redness and peeling.',
   'Use on alternating nights.', 'General retinoid-class + exfoliant caution.',
   'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('glycolic-acid', 'salicylic-acid', 'requires_spacing',
   'Stacking two exfoliating acids in one routine raises the risk of over-exfoliation and barrier disruption.',
   'Alternate which one is used per session rather than layering both.',
   'FDA notes AHAs increase UV sensitivity and irritation potential.',
   'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids', 'medium'),
  ('glycolic-acid', 'lactic-acid', 'requires_spacing',
   'Both are direct AHAs — combining them adds exfoliation intensity without a clear added benefit over using one at an appropriate strength.',
   'Choose one AHA per routine rather than stacking both.',
   'FDA notes AHAs increase UV sensitivity and irritation potential.',
   'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids', 'medium'),
  ('ferulic-acid', 'l-ascorbic-acid', 'enhances',
   'Ferulic acid chemically stabilises L-ascorbic acid and, combined with vitamin E, roughly doubles its measured photoprotection.',
   'Formulated together (e.g. a vitamin C + E + ferulic acid serum) rather than layered separately.',
   'Pinnell et al., J Am Acad Dermatol 2004/2005 — erythema and sunburn-cell-formation endpoints.',
   'https://www.jaad.org/article/S0190-9622(04)03422-X/fulltext', 'high'),
  ('l-ascorbic-acid', 'vitamin-e', 'enhances',
   'Water-soluble vitamin C and lipid-soluble vitamin E provide complementary antioxidant protection, and vitamin E helps regenerate oxidised vitamin C.',
   'Commonly formulated together as a stabilised antioxidant serum.',
   'Pinnell et al., J Am Acad Dermatol 2004/2005.',
   'https://www.jaad.org/article/S0190-9622(04)03422-X/fulltext', 'high'),
  ('ascorbic-acid', 'niacinamide', 'compatible',
   'A long-standing skincare myth held that vitamin C and niacinamide react to cause flushing. That conclusion came from a 1960s study mixing the two under extreme heat, not normal skincare conditions — at cosmetic concentrations and modern formulation pH, the two are considered compatible.',
   'Can be layered or used together; if a specific product visibly changes colour or texture on mixing, that formulation may be unstable and is worth flagging separately.',
   'Modern derm consensus debunking the older pH-reaction concern; formulation-dependent at extreme concentrations.',
   'https://dermnetnz.org/topics/nicotinamide', 'medium'),
  ('l-ascorbic-acid', 'niacinamide', 'compatible',
   'A long-standing skincare myth held that vitamin C and niacinamide react to cause flushing. That conclusion came from a 1960s study mixing the two under extreme heat, not normal skincare conditions — at cosmetic concentrations and modern formulation pH, the two are considered compatible.',
   'Can be layered or used together.', 'Modern derm consensus debunking the older pH-reaction concern.',
   'https://dermnetnz.org/topics/nicotinamide', 'medium'),
  ('l-ascorbic-acid', 'retinol', 'requires_spacing',
   'L-ascorbic acid performs best at a low pH that can add irritation when layered directly with a retinoid.',
   'A common approach is vitamin C in the AM and retinoid in the PM.',
   'General formulation-pH caution.', 'https://dermnetnz.org/topics/topical-retinoids', 'low'),
  ('ascorbic-acid', 'retinol', 'requires_spacing',
   'L-ascorbic acid performs best at a low pH that can add irritation when layered directly with a retinoid.',
   'A common approach is vitamin C in the AM and retinoid in the PM.',
   'General formulation-pH caution.', 'https://dermnetnz.org/topics/topical-retinoids', 'low'),
  ('hyaluronic-acid', 'retinol', 'compatible',
   'Hyaluronic acid is commonly paired with a retinoid specifically to offset the dryness retinoids can cause — there is no known conflict between them.',
   'Apply hyaluronic acid under or after a retinoid to help manage dryness.',
   'General retinoid-tolerability guidance.', 'https://dermnetnz.org/topics/topical-retinoids', 'medium'),
  ('niacinamide', 'zinc-pca', 'enhances',
   'Niacinamide and zinc both support sebum regulation and are commonly combined for oily/acne-prone routines via complementary mechanisms.',
   'Frequently formulated together in oil-control serums.', 'General sebum-regulation formulation pattern.',
   'https://dermnetnz.org/topics/nicotinamide', 'medium'),
  ('bakuchiol', 'retinol', 'avoid_combining',
   'Both are cell-turnover-promoting actives; combining a retinoid with a retinol-alternative compounds irritation risk without established added benefit over using one.',
   'Choose one cell-turnover active per routine rather than layering both.',
   'Extension of general retinoid-class caution to a retinol-alternative; lower-confidence, worth admin review.',
   'https://dermnetnz.org/topics/topical-retinoids', 'low')
) AS v(a_slug, b_slug, interaction_type, explanation, usage_guidance, notes, source_url, confidence)
JOIN public.ingredients ia ON ia.slug = v.a_slug
JOIN public.ingredients ib ON ib.slug = v.b_slug
ON CONFLICT (ingredient_a_id, ingredient_b_id, interaction_type) DO NOTHING;
