-- Skip-list resolution batch (batch 09): follow-up verification of the 42-item
-- Track A skip list, using broader web/Firecrawl research (not PubMed-only,
-- which is what originally skip-listed these). Of 42 skip-listed rows: 35 are
-- generic/category-placeholder names (e.g. "Botanical Extracts", "Enzyme
-- Complex") with no single real-world compound identity and cannot get a
-- legitimate single-ingredient profile without fabrication -- left untouched,
-- still correctly skip-listed. 5 real named ingredients below get genuine,
-- cited profiles found via Firecrawl-assisted research cross-referenced back
-- into PubMed. 1 row ("light") was a malformed data artifact, not a content
-- gap -- fixed separately below. 1 real ingredient (African Potato Extract /
-- Hypoxis hemerocallidea) was re-researched and confirmed to remain
-- unpopulatable: its only retrievable literature (a 2020 systematic review,
-- PMID 32527245) covers internal/oral immune-enhancement use only, and a
-- dedicated follow-up PubMed search for topical/dermatological Hypoxis
-- literature returned zero results -- writing a skin-relevant profile from
-- that source would fabricate a mechanism no retrieved source supports, so
-- it stays skip-listed rather than being stretched into an off-target claim.
-- verification_status stays 'partially_verified' throughout (human-only for
-- 'verified').

-- Cucumber Extract
UPDATE ingredients SET
  description = 'Cucumber Extract is a plant-derived extract from Cucumis sativus, widely used in skincare formulations as a soothing, hydrating botanical ingredient, often marketed for its refreshing and mild skin-conditioning properties.',
  function_summary = 'Commonly used as a soothing, hydrating botanical extract in cleansers, toners and moisturizers. According to PubMed, a study developed a lactic-acid-fermented cucumber extract as a delivery vehicle for topical magnesium, converting the extract''s natural sugars into organic acid salts of magnesium with improved skin absorption -- a real example of cucumber extract being used as a functional cosmetic-chemistry ingredient beyond its traditional soothing role, though the study evaluated the fermented-magnesium delivery system rather than cucumber extract''s own efficacy in a controlled clinical trial.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/ma12101701',
  source_type = 'peer_reviewed_literature',
  source_date = '2019-05-25',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'e312e5f6-51fc-4b71-a29f-c1b59e04f92b';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('e312e5f6-51fc-4b71-a29f-c1b59e04f92b', 'https://doi.org/10.3390/ma12101701', 'Fermentation of Cucumber Extract with Hydromagnesite as a Neutralizing Agent to Produce an Ingredient for Dermal Magnesium Products', 'Materials (Basel)', 'peer_reviewed_literature', '2019-05-25', 'limited'::evidence_level, 'Developed a lactic-acid-fermentation protocol converting cucumber extract''s reducing sugars into organic acid salts, producing a magnesium-carrying ingredient for topical dermal magnesium products with improved absorption/bioavailability. Formulation-chemistry study, not a clinical efficacy trial of cucumber extract itself.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Hemi-Squalane
UPDATE ingredients SET
  description = 'Hemi-Squalane is a lightweight, biotechnologically-derived hydrocarbon emollient (a shorter-chain relative of squalane), commonly produced via fermentation of sugarcane and used in skincare for its fast-absorbing, non-greasy skin-conditioning properties.',
  function_summary = 'Commonly used as a lightweight emollient and occlusive to help reduce transepidermal water loss (TEWL) and improve skin feel, functioning similarly to squalane but with a smaller molecule size for faster absorption. No peer-reviewed clinical trial evaluating hemi-squalane specifically on human skin was found; its use is well documented in cosmetic-ingredient reference databases and formulation literature rather than controlled clinical studies.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://incidecoder.com/ingredients/hemisqualane',
  source_type = 'ingredient_database',
  source_date = '2026-09-22',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'f3326b56-ea46-406c-9bf9-2a2fdb7e8e02';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('f3326b56-ea46-406c-9bf9-2a2fdb7e8e02', 'https://incidecoder.com/ingredients/hemisqualane', 'Hemisqualane ingredient profile', 'INCIDecoder', 'ingredient_database', NULL, 'limited'::evidence_level, 'Cosmetic-ingredient reference profile: describes hemi-squalane as a lightweight, plant/sugarcane-fermentation-derived emollient functionally related to squalane, valued for fast absorption and reduced greasy after-feel. No controlled clinical trial data found.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Kalahari Melon Oil
UPDATE ingredients SET
  description = 'Kalahari Melon Oil is a cold-pressed seed oil from Citrullus lanatus (a wild watermelon variety native to the Kalahari region of Southern Africa), used in skincare as a lightweight, fast-absorbing facial oil.',
  function_summary = 'Commonly used as a lightweight facial oil valued for its non-comedogenic feel. According to PubMed, a short-term clinical assessment of Citrullus lanatus seed oil applied topically found it to be non-irritating and to improve skin hydration and barrier function measures over the study period, supporting its traditional use in Southern African skincare.',
  typical_concentration_range = 'Often used as a standalone facial oil or at high concentration in oil blends',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.sajb.2017.06.028',
  source_type = 'peer_reviewed_literature',
  source_date = '2017-09-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'd6a88e55-cf7f-4e24-a8e4-2d70c3e8abeb';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('d6a88e55-cf7f-4e24-a8e4-2d70c3e8abeb', 'https://doi.org/10.1016/j.sajb.2017.06.028', 'The topical efficacy and safety of Citrullus lanatus seed oil: A short-term clinical assessment', 'South African Journal of Botany (Komane, Vermaak, Kamatou, Summers, Viljoen)', 'peer_reviewed_literature', '2017-09-01', 'moderate'::evidence_level, 'Short-term clinical assessment of topically-applied Citrullus lanatus (Kalahari/wild watermelon) seed oil found it non-irritant with measurable improvements in skin hydration and barrier parameters.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Kalahari Melon Seed Oil (same real compound as Kalahari Melon Oil above; a
-- distinct pre-existing catalogue row, not a fabricated duplicate)
UPDATE ingredients SET
  description = 'Kalahari Melon Seed Oil is a cold-pressed seed oil from Citrullus lanatus (a wild watermelon variety native to the Kalahari region of Southern Africa), used in skincare as a lightweight, fast-absorbing facial oil.',
  function_summary = 'Commonly used as a lightweight facial oil valued for its non-comedogenic feel. According to PubMed, a short-term clinical assessment of Citrullus lanatus seed oil applied topically found it to be non-irritating and to improve skin hydration and barrier function measures over the study period, supporting its traditional use in Southern African skincare.',
  typical_concentration_range = 'Often used as a standalone facial oil or at high concentration in oil blends',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.sajb.2017.06.028',
  source_type = 'peer_reviewed_literature',
  source_date = '2017-09-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'c3145d1f-a96a-4e7b-a5a7-3b1a22de0b22';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('c3145d1f-a96a-4e7b-a5a7-3b1a22de0b22', 'https://doi.org/10.1016/j.sajb.2017.06.028', 'The topical efficacy and safety of Citrullus lanatus seed oil: A short-term clinical assessment', 'South African Journal of Botany (Komane, Vermaak, Kamatou, Summers, Viljoen)', 'peer_reviewed_literature', '2017-09-01', 'moderate'::evidence_level, 'Short-term clinical assessment of topically-applied Citrullus lanatus (Kalahari/wild watermelon) seed oil found it non-irritant with measurable improvements in skin hydration and barrier parameters.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Kaolin Clay
UPDATE ingredients SET
  description = 'Kaolin Clay is a naturally occurring hydrated aluminum silicate mineral clay, widely used in skincare as a gentle absorbent ingredient in cleansers, masks and powders.',
  function_summary = 'Commonly used to absorb excess oil and gently cleanse without stripping the skin, milder than more absorbent clays like bentonite. According to PubMed, a 4-week clinical study of a multi-ingredient clay mask (containing kaolin and bentonite among its ingredients) in 75 adults with oily or combination skin found significant improvements in acne severity, sebum content and skin hydration with good tolerability -- evidence for the mask formulation as a whole rather than an isolated-kaolin trial.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/srt.13513',
  source_type = 'peer_reviewed_literature',
  source_date = '2023-11-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'de631410-eaef-4f73-91eb-6196efc46c9f';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('de631410-eaef-4f73-91eb-6196efc46c9f', 'https://doi.org/10.1111/srt.13513', 'Comprehensive assessment of the efficacy and safety of a clay mask in oily and acne skin', 'Skin Research and Technology (Zhang, Zhang, Tao, He, Hsu, Wang, Fang, Steel)', 'peer_reviewed_literature', '2023-11-01', 'limited'::evidence_level, '75-adult, 4-week study of a kaolin/bentonite-containing clay mask found significant improvements in acne lesions, sebum content, skin evenness and hydration, with reduced dryness/irritation and high tolerability. Multi-ingredient formulation study, not an isolated kaolin trial.'),
  ('de631410-eaef-4f73-91eb-6196efc46c9f', 'https://www.ewg.org/skindeep/ingredients/703305-KAOLIN/', 'Kaolin ingredient profile', 'EWG Skin Deep', 'ingredient_database', NULL, 'limited'::evidence_level, 'Cosmetic-ingredient hazard/safety reference profile for kaolin (hydrated aluminum silicate clay) as used in personal care products.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Data cleanup: "light" (id f50547a0-09bf-4d26-a5b2-7cb9bb5249e4) is a
-- malformed duplicate stub from the original bulk seed -- its inci_name is
-- the literal string "light" (a parsing artifact, not a real INCI name),
-- while its common_name ("Marula Oil") duplicates the two already-populated,
-- correctly-named rows marula-oil and marula-seed-oil. One real product
-- (portiam-marula-oily-day-cream) still linked to this row via
-- product_ingredients -- repoint that link to the real marula-oil row before
-- removing the artifact, so the product's ingredient list stays accurate.
UPDATE product_ingredients
SET ingredient_id = 'e0110416-b39c-4f1b-8b9f-56dc6c6e6839' -- marula-oil
WHERE ingredient_id = 'f50547a0-09bf-4d26-a5b2-7cb9bb5249e4'
  AND product_version_id = '172ad8db-6b05-4176-8acc-d96eb21677f1'
  AND NOT EXISTS (
    SELECT 1 FROM product_ingredients
    WHERE product_version_id = '172ad8db-6b05-4176-8acc-d96eb21677f1'
      AND ingredient_id = 'e0110416-b39c-4f1b-8b9f-56dc6c6e6839'
  );

DELETE FROM product_ingredients WHERE ingredient_id = 'f50547a0-09bf-4d26-a5b2-7cb9bb5249e4';
DELETE FROM ingredients WHERE id = 'f50547a0-09bf-4d26-a5b2-7cb9bb5249e4';
