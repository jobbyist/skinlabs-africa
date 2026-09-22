-- Track A content batch 07 (manual 6A continuation): 10 ingredients
-- (Probiotic Ferment, Pycnogenol, Retinaldehyde, Retinyl Palmitate, Rice
-- Ferment Filtrate, Rooibos Extract, Rosehip Oil, Rosewater, Sage Extract,
-- Sodium Ascorbyl Phosphate). Research: PubMed peer-reviewed literature.
-- verification_status stays 'partially_verified'.

-- Probiotic Ferment
UPDATE ingredients SET
  description = 'Probiotic Ferment refers to lysates or filtrates produced by fermenting beneficial bacterial strains (commonly Lactobacillus species), used in skincare to support the skin barrier and microbiome balance.',
  function_summary = 'Commonly used to help enhance the skin barrier and calm sensitive skin. A randomized self-controlled clinical study found a lotion containing a multi-strain probiotic ferment lysate (Lacticaseibacillus/Lactiplantibacillus species) reduced transepidermal water loss and redness while improving skin moisturization after 30 days of use, alongside real in vitro antioxidant and cell-protective activity.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1038/s41598-023-43336-y',
  source_type = 'peer_reviewed_literature',
  source_date = '2023-10-06',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'e08727c0-e0d1-4e31-a28b-e6c7152a3762';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('e08727c0-e0d1-4e31-a28b-e6c7152a3762', 'https://doi.org/10.1038/s41598-023-43336-y', 'Effects of a lotion containing probiotic ferment lysate as the main functional ingredient on enhancing skin barrier: a randomized, self-control study', 'Scientific Reports', 'peer_reviewed_literature', '2023-10-06', 'moderate'::evidence_level, 'Randomized self-control clinical study, 30-day use: a probiotic ferment lysate lotion (VHProbi Mix R) reduced TEWL and redness and improved skin moisturization, with supporting in vitro antioxidant/cell-protective data.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Pycnogenol
UPDATE ingredients SET
  description = 'Pycnogenol is a standardized extract from French maritime pine bark, rich in procyanidins and phenolic acids, used as an antioxidant ingredient primarily via oral supplementation in skin-health contexts.',
  function_summary = 'Commonly used as an oral antioxidant supplement to support skin health, rather than as a topical ingredient. Randomized, placebo-controlled, double-blind crossover trials found oral Pycnogenol intake improved skin physiological parameters in outdoor workers exposed to environmental stress, and improved skin elasticity/hydration in postmenopausal women alongside increased collagen type I and hyaluronic acid synthase gene expression.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1159/000514323',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-03-31',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '1464ea7a-55c8-4333-a3ea-eb41cfb418cc';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('1464ea7a-55c8-4333-a3ea-eb41cfb418cc', 'https://doi.org/10.1159/000514323', 'Oral Pycnogenol Intake Benefits the Skin in Urban Chinese Outdoor Workers: A Randomized, Placebo-Controlled, Double-Blind, and Crossover Intervention Study', 'Skin Pharmacology and Physiology', 'peer_reviewed_literature', '2021-03-31', 'moderate'::evidence_level, 'Randomized double-blind placebo-controlled crossover study, 12 weeks: oral Pycnogenol (100mg/day) improved skin physiological parameters in Chinese outdoor workers exposed to urban environmental stress.'),
  ('1464ea7a-55c8-4333-a3ea-eb41cfb418cc', 'https://doi.org/10.1159/000335261', 'Pycnogenol effects on skin elasticity and hydration coincide with increased gene expressions of collagen type I and hyaluronic acid synthase in women', 'Skin Pharmacology and Physiology', 'peer_reviewed_literature', '2012-01-21', 'moderate'::evidence_level, '20 postmenopausal women, 12-week supplementation study: Pycnogenol improved skin elasticity and hydration alongside increased collagen type I and hyaluronic acid synthase gene expression.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Retinaldehyde
UPDATE ingredients SET
  description = 'Retinaldehyde is a vitamin A derivative one conversion step closer to active retinoic acid than retinol, used in skincare for anti-aging benefits with a generally better tolerability profile than stronger retinoids.',
  function_summary = 'Commonly used to help improve the appearance of photoaged skin, fine lines and texture with fewer adverse effects than more aggressive treatments. A randomized controlled study found a retinaldehyde-based cream performed comparably to glycolic acid peel sessions on wrinkle and texture measures, with 12x fewer adverse events, and a separate RCT found a retinaldehyde-containing antioxidant blend improved in situ antioxidant activity in photoaged skin.',
  typical_concentration_range = '0.05%-0.1%',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.12511',
  source_type = 'peer_reviewed_literature',
  source_date = '2018-07-19',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'ab44b19d-3c97-4dd7-a4a6-42b47c7d622f';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('ab44b19d-3c97-4dd7-a4a6-42b47c7d622f', 'https://doi.org/10.1111/jocd.12511', 'Antiaging efficacy of a retinaldehyde-based cream compared with glycolic acid peel sessions: A randomized controlled study', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2018-07-19', 'moderate'::evidence_level, '55-woman RCT: a 0.1% retinaldehyde cream was similarly effective as sequential 20%/50%/70% glycolic acid peels for wrinkles and superior for skin texture, with 12x fewer adverse events.'),
  ('ab44b19d-3c97-4dd7-a4a6-42b47c7d622f', 'https://doi.org/10.1111/exd.14005', 'In situ antioxidant activity of a dermo-cosmetic product: A randomized controlled clinical study', 'Experimental Dermatology', 'peer_reviewed_literature', '2019-09-30', 'moderate'::evidence_level, '20-subject randomized vehicle- and active-controlled intra-individual study: a topical antioxidant blend containing retinaldehyde reduced UV-induced reactive oxygen species in photoaged skin over 30 days.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Retinyl Palmitate
UPDATE ingredients SET
  description = 'Retinyl Palmitate is a vitamin A ester (an esterified, more stable form of retinol), used in skincare as a gentler, slower-converting retinoid alternative.',
  function_summary = 'Commonly used as a milder retinoid option, often combined with in-office procedures like microneedling for enhanced results. A preliminary split-face placebo-controlled study found 5% retinyl palmitate oleogel combined with microneedling improved acne scar appearance and patient quality of life versus microneedling with placebo alone.',
  typical_concentration_range = '0.1%-1%',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/jcm15062185',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-03-13',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'd9d8f3b4-b2b4-4ad3-9766-7740b66cc381';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('d9d8f3b4-b2b4-4ad3-9766-7740b66cc381', 'https://doi.org/10.3390/jcm15062185', 'Microneedling and Topical Retinyl Palmitate for Acne Scars: A Preliminary Split-Face Study with Placebo Control', 'Journal of Clinical Medicine', 'peer_reviewed_literature', '2026-03-13', 'moderate'::evidence_level, 'Preliminary split-face placebo-controlled study, 3 patients/106 atrophic acne scars: 5% retinyl palmitate oleogel combined with microneedling improved outcomes and quality of life versus microneedling with placebo.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Rice Ferment Filtrate
UPDATE ingredients SET
  description = 'Rice Ferment Filtrate (often Saccharomyces/Rice Ferment Filtrate) is derived from fermenting rice with yeast, used in skincare for its reported brightening and skin-conditioning properties.',
  function_summary = 'Commonly used for its reported skin-brightening and conditioning properties. An ex vivo skin tissue study found Saccharomyces/Rice Ferment Filtrate, delivered via a hyaluronic acid nanogel with iontophoresis, reduced advanced glycation end products associated with skin aging — real but preclinical (ex vivo tissue model) evidence, not yet a human clinical trial.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.2147/IJN.S523731',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-09-18',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '328366f9-627e-453d-9c22-d0b87551843a';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('328366f9-627e-453d-9c22-d0b87551843a', 'https://doi.org/10.2147/IJN.S523731', 'Iontophoretic Delivery of Hyaluronic Acid Nanogel-Loaded Fermented Rice Extract Mitigates Skin Glycation', 'International Journal of Nanomedicine', 'peer_reviewed_literature', '2025-09-18', 'limited'::evidence_level, 'Ex vivo skin tissue study: Saccharomyces/Rice Ferment Filtrate delivered via HA nanogel and iontophoresis reduced advanced glycation end products (AGEs) associated with skin aging.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Rooibos Extract
UPDATE ingredients SET
  description = 'Rooibos extract comes from Aspalathus linearis, a plant native to South Africa''s Western Cape, valued in skincare for its high antioxidant flavonoid content, particularly aspalathin.',
  function_summary = 'Commonly used as an antioxidant botanical extract. Research into rooibos flavonoids (aspalathin, rutin, isoorientin, orientin) confirms real, notable antioxidant activity, though poor natural stability of these flavonoids has driven formulation-chemistry research (such as enzymatic glycosylation) to improve their usability in cosmetic products — direct human clinical efficacy trials specific to topical rooibos extract are limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.biortech.2026.135581',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-08-07',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '65d3aab4-5f94-4290-976a-4662f6bb1210';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('65d3aab4-5f94-4290-976a-4662f6bb1210', 'https://doi.org/10.1016/j.biortech.2026.135581', 'Enzymatic glycosylation of rooibos plant extract to improve stability of active compounds', 'Bioresource Technology', 'peer_reviewed_literature', '2026-08-07', 'limited'::evidence_level, 'Formulation chemistry study confirming rooibos (Aspalathus linearis) flavonoids (aspalathin, rutin, isoorientin, orientin) have real notable antioxidant activity, with poor natural stability addressed via enzymatic glycosylation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Rosehip Oil
UPDATE ingredients SET
  description = 'Rosehip oil is a plant oil pressed from the fruit of Rosa canina (dog rose), used in skincare for scar treatment, skin regeneration and moisturizing benefits.',
  function_summary = 'Commonly used to help improve the appearance of scars and support skin regeneration. A randomized controlled trial found rosehip seed oil effective and safe for preventing and treating skin lesions from repeated finger-prick blood glucose monitoring, and a review of the wound-healing literature found supportive evidence for rosehip oil in postsurgical scar treatment.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.endinu.2019.04.008',
  source_type = 'peer_reviewed_literature',
  source_date = '2019-06-21',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '19ae9438-1c2e-4916-b3f7-da25f862bff1';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('19ae9438-1c2e-4916-b3f7-da25f862bff1', 'https://doi.org/10.1016/j.endinu.2019.04.008', 'Efficacy and safety of a rosehip seed oil extract in the prevention and treatment of skin lesions in the hands of patients with type 1 diabetes mellitus caused by finger prick blood glucose monitoring', 'Endocrinologia, Diabetes y Nutricion', 'peer_reviewed_literature', '2019-06-21', 'moderate'::evidence_level, 'Randomized open-label controlled trial in T1DM patients aged 6-17: rosehip seed oil reduced erythema, skin thickening and loss of skin integrity from repeated finger-prick monitoring.'),
  ('19ae9438-1c2e-4916-b3f7-da25f862bff1', 'https://doi.org/10.1111/jocd.15971', 'Rosehip extract and wound healing: A review', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2023-08-21', 'moderate'::evidence_level, 'Literature review of clinical trials and reviews evaluating rosehip oil for treatment of postsurgical scars.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Rosewater
UPDATE ingredients SET
  description = 'Rosewater is a hydrosol distilled from Rosa damascena (or related rose species) petals, traditionally used in skincare to hydrate and soothe skin.',
  function_summary = 'Commonly used as a soothing, hydrating toner ingredient. An animal-model study found rose oil (from the same source plant genus as rosewater) protected against UVB-induced oxidative damage and photoaging by modulating inflammatory signaling pathways, though direct human clinical efficacy data for rosewater itself is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1021/acsomega.3c04756',
  source_type = 'peer_reviewed_literature',
  source_date = '2023-09-07',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'd555f012-e5c8-4502-8020-67c44eb1140c';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('d555f012-e5c8-4502-8020-67c44eb1140c', 'https://doi.org/10.1021/acsomega.3c04756', 'Taif Rose Oil Ameliorates UVB-Induced Oxidative Damage and Skin Photoaging in Rats via Modulation of MAPK and MMP Signaling Pathways', 'ACS Omega', 'peer_reviewed_literature', '2023-09-07', 'limited'::evidence_level, 'Rat model study: a rose oil nanoemulsion (from Rosa damascena, the same source plant as rosewater) protected against UVB-induced oxidative damage and photoaging via MAPK/MMP pathway modulation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Sage Extract
UPDATE ingredients SET
  description = 'Sage extract comes from Salvia species (most commonly Salvia officinalis), used in skincare for its antioxidant and anti-inflammatory properties.',
  function_summary = 'Commonly used as an antioxidant botanical extract to help support skin against oxidative stress and inflammation. A comprehensive review of eight Salvia species found real anti-aging potential across oxidative stress, inflammation and tissue-remodeling mechanisms, and an animal wound-healing study found topical Salvia miltiorrhiza reduced oxidative stress markers and improved wound healing.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.mad.2026.112204',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-05-28',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'ac90d9fa-dfd5-4903-b75c-131922245594';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('ac90d9fa-dfd5-4903-b75c-131922245594', 'https://doi.org/10.1016/j.mad.2026.112204', 'Sage (Salvia spp.) as a multi-target resource for healthy aging: Current evidence and perspectives', 'Mechanisms of Ageing and Development', 'peer_reviewed_literature', '2026-05-28', 'moderate'::evidence_level, 'Comprehensive review of 8 Salvia species evaluating anti-aging potential across oxidative stress, inflammation, cellular senescence and tissue-remodeling mechanisms.'),
  ('ac90d9fa-dfd5-4903-b75c-131922245594', 'https://doi.org/10.1016/j.tice.2026.103560', 'Salvia miltiorrhiza promotes cutaneous wound healing by modulating inflammation, oxidative stress, and angiogenesis in mice', 'Tissue & Cell', 'peer_reviewed_literature', '2026-05-03', 'limited'::evidence_level, 'Mouse wound-healing study: topical Salvia miltiorrhiza reduced oxidative stress markers and inflammation while improving wound healing versus control.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Sodium Ascorbyl Phosphate
UPDATE ingredients SET
  description = 'Sodium Ascorbyl Phosphate is a stable, water-soluble vitamin C ester derivative, used in skincare as a gentler alternative to L-ascorbic acid with better formulation stability.',
  function_summary = 'Commonly used as a stabilized vitamin C derivative for antioxidant and brightening benefits with fewer stability/irritation concerns than pure L-ascorbic acid. A systematic review of vitamin C in dermatology confirms stabilized derivative systems consistently improve photoaging and pigmentary disorders, and a related vitamin C ester derivative (magnesium ascorbyl phosphate) has been shown to provide real antioxidant photoprotection when combined with mineral UV filters.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13588479/',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-07-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '8cb36e3c-1a61-4796-b7f1-1c271234b158';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('8cb36e3c-1a61-4796-b7f1-1c271234b158', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13588479/', 'Clinical Applications of Vitamin C in Dermatology: A Systematic Review', 'The Journal of Clinical and Aesthetic Dermatology', 'peer_reviewed_literature', '2026-07-01', 'moderate'::evidence_level, 'Systematic review of 44 studies (2020+): stabilized vitamin C derivative systems consistently improved photoaging, structural aging and pigmentary disorders across delivery platforms.'),
  ('8cb36e3c-1a61-4796-b7f1-1c271234b158', 'https://doi.org/10.1007/s11095-024-03733-y', 'Duo photoprotective effect via silica-coated zinc oxide nanoparticles and Vitamin C nanovesicles composites', 'Pharmaceutical Research', 'peer_reviewed_literature', '2024-07-12', 'limited'::evidence_level, 'Formulation study: magnesium ascorbyl phosphate (a related vitamin C ester derivative) nanovesicles combined with silica-coated ZnO provided synergistic photoprotection against UV-induced skin damage.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
