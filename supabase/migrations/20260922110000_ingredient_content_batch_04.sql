-- Track A content batch 04: 12 ingredients (Aloe Ferox, Cholesterol, Coconut
-- Oil, CoQ10, Fatty Acids, Ferulic Acid, GHK-Cu, Green Tea Extract, Jojoba
-- Oil, Ceramide, Ceramide NP, Ceramide-P). Research: PubMed peer-reviewed
-- literature. verification_status stays 'partially_verified'.

-- Aloe Ferox
UPDATE ingredients SET
  description = 'Aloe ferox (also known as Cape Aloe or bitter aloe) is a Southern African succulent whose leaf gel is used topically in a similar way to the related Aloe vera, valued for its moisturizing and soothing properties.',
  function_summary = 'Commonly used as a soothing, moisturizing gel ingredient. Animal-model studies comparing Aloe ferox with Aloe vera found both species inhibited inflammatory skin responses and supported wound healing, though direct human clinical efficacy data for Aloe ferox specifically remains limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s10787-015-0251-2',
  source_type = 'peer_reviewed_literature',
  source_date = '2015-10-28',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '581e0fbe-cd59-41ce-8123-6079f6ead8b4';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('581e0fbe-cd59-41ce-8123-6079f6ead8b4', 'https://doi.org/10.1007/s10787-015-0251-2', 'A comparison of the leaf gel extracts of Aloe ferox and Aloe vera in the topical treatment of atopic dermatitis in Balb/c mice', 'Inflammopharmacology', 'peer_reviewed_literature', '2015-10-28', 'limited'::evidence_level, 'Mouse AD model: topical Aloe ferox and Aloe vera gels both inhibited cutaneous inflammatory response and affected serum IgE levels versus placebo gel.'),
  ('581e0fbe-cd59-41ce-8123-6079f6ead8b4', 'https://doi.org/10.1016/j.jep.2008.08.008', 'Preliminary evaluation: the effects of Aloe ferox Miller and Aloe arborescens Miller on wound healing', 'Journal of Ethnopharmacology', 'peer_reviewed_literature', '2008-08-15', 'limited'::evidence_level, 'Rat and rabbit incision wound models: topical whole-leaf Aloe ferox juice showed positive effects on wound closure rate and healing scores.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Cholesterol
UPDATE ingredients SET
  description = 'Cholesterol is one of three key lipids (alongside ceramides and fatty acids) that make up the skin''s natural stratum corneum barrier, used in skincare formulations to help replenish and rebalance this lipid matrix.',
  function_summary = 'Commonly used alongside ceramides and fatty acids in barrier-repair moisturizers. Reviewed evidence describes cholesterol as an essential component of the physiological lipid ratio needed for effective skin barrier restoration, particularly in atopic-dermatitis-prone skin.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/pde.70010',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-09-04',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '68b103d5-b7fc-49c8-94be-4aa442b3e96c';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('68b103d5-b7fc-49c8-94be-4aa442b3e96c', 'https://doi.org/10.1111/pde.70010', 'Prevention of Atopic Dermatitis in High-Risk Infants: A Review of the Role of Lipid-Based Barrier Repair Therapy', 'Pediatric Dermatology', 'peer_reviewed_literature', '2025-09-04', 'moderate'::evidence_level, 'Systematic review: stratum corneum lipid-based therapies (ceramides, cholesterol, free fatty acids) replenish deficient skin lipids, reduce SCORAD scores and enhance hydration/epidermal cohesion.'),
  ('68b103d5-b7fc-49c8-94be-4aa442b3e96c', 'https://doi.org/10.4168/aair.2026.18.4.485', 'Skin Lipid Dysregulation in Atopic Dermatitis and Related Inflammatory Skin Diseases', 'Allergy, Asthma & Immunology Research', 'peer_reviewed_literature', '2026-07-01', 'moderate'::evidence_level, 'Review of 2020-2025 literature on skin lipid metabolism in allergic/inflammatory disease, covering cholesterol''s role alongside ceramides in barrier lipid dysregulation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Coconut Oil
UPDATE ingredients SET
  description = 'Coconut oil (Cocos Nucifera) is a plant-derived emollient oil rich in medium-chain fatty acids, traditionally used to moisturize skin and support the skin''s antimicrobial defenses.',
  function_summary = 'Commonly used as an emollient to moisturize dry skin. A double-blind controlled trial in adults with atopic dermatitis found virgin coconut oil reduced Staphylococcus aureus skin colonization more effectively than virgin olive oil, alongside comparable moisturizing benefit.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pubmed.ncbi.nlm.nih.gov/19134433/',
  source_type = 'peer_reviewed_literature',
  source_date = '2008-01-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '7f56b736-91f2-4adc-a74f-1d8b9d3cf7cf';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7f56b736-91f2-4adc-a74f-1d8b9d3cf7cf', 'https://pubmed.ncbi.nlm.nih.gov/19134433/', 'Novel antibacterial and emollient effects of coconut and virgin olive oils in adult atopic dermatitis', 'Dermatitis', 'peer_reviewed_literature', '2008-01-01', 'moderate'::evidence_level, 'Double-blind controlled trial, 52 adult AD patients: virgin coconut oil reduced S. aureus colonization to 5% (vs 50% for virgin olive oil) with comparable moisturizing effect after 4 weeks.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- CoQ10
UPDATE ingredients SET
  description = 'Coenzyme Q10 (ubiquinone) is a naturally occurring, lipid-soluble antioxidant molecule that declines in the skin with age; it is used topically to help replenish this decline.',
  function_summary = 'Commonly used as an antioxidant to help defend skin against oxidative stress associated with aging. Reviewed evidence describes CoQ10''s role in supporting skin''s natural antioxidant defenses, though dedicated large-scale human efficacy trials for topical CoQ10 used alone remain limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11324190/',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-08-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'fb8272bd-64b8-45e4-854a-2749feeef2aa';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('fb8272bd-64b8-45e4-854a-2749feeef2aa', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11324190/', 'The Role of Coenzyme Q10 in Skin Aging and Opportunities for Topical Intervention: A Review', 'The Journal of Clinical and Aesthetic Dermatology', 'peer_reviewed_literature', '2024-08-01', 'limited'::evidence_level, 'Review of CoQ10''s role in mitochondrial energy production and antioxidant defense in skin, and its decline with age and external stress.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Fatty Acids
UPDATE ingredients SET
  description = 'Fatty acids (including linoleic and oleic acid) are lipid components of the skin''s natural barrier and are used in skincare to help support and restore that barrier.',
  function_summary = 'Commonly used in barrier-repair moisturizers. A randomized controlled trial found a linoleic-acid-ceramide moisturizer improved outcomes when combined with standard treatment for mild-to-moderate psoriasis, and a separate study found linoleate/oleate esters upregulated genes associated with epidermal barrier repair.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/dth.14263',
  source_type = 'peer_reviewed_literature',
  source_date = '2020-09-14',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '95fc1b31-3a81-4df0-b2af-cd5eb108a63d';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('95fc1b31-3a81-4df0-b2af-cd5eb108a63d', 'https://doi.org/10.1111/dth.14263', 'Efficacy and safety of a topical moisturizer containing linoleic acid and ceramide for mild-to-moderate psoriasis vulgaris: A multicenter randomized controlled trial', 'Dermatologic Therapy', 'peer_reviewed_literature', '2020-09-14', 'moderate'::evidence_level, '178-patient multicenter RCT: a linoleic-acid-ceramide moisturizer combined with mometasone furoate outperformed mometasone alone on PASI 50 response with lower relapse rates at week 8.'),
  ('95fc1b31-3a81-4df0-b2af-cd5eb108a63d', 'https://doi.org/10.1016/j.jid.2020.09.029', 'Isosorbide Di-(Linoleate/Oleate) Stimulates Prodifferentiation Gene Expression to Restore the Epidermal Barrier and Improve Skin Hydration', 'Journal of Investigative Dermatology', 'peer_reviewed_literature', '2020-11-09', 'limited'::evidence_level, 'Mechanistic study: a linoleate/oleate ester upregulated keratinocyte differentiation genes (KRT1, GRHL2, SPRR4) and increased epidermal barrier proteins (filaggrin, involucrin).')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ferulic Acid
UPDATE ingredients SET
  description = 'Ferulic acid is a plant-derived antioxidant commonly combined with vitamins C and E in serums to help stabilize the formulation and boost overall antioxidant protection.',
  function_summary = 'Commonly used to enhance the stability and antioxidant efficacy of vitamin C/E serums. Clinical trials of ferulic-acid-containing antioxidant combinations have shown improved outcomes in facial rejuvenation alongside microneedling and protection against pollution-induced skin damage — always tested as part of a combination formulation rather than in isolation.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.2147/CCID.S565035',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-02-12',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'd25c7d6e-63d2-4765-ab14-c804633639e3';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('d25c7d6e-63d2-4765-ab14-c804633639e3', 'https://doi.org/10.2147/CCID.S565035', 'A Double-Blinded, Split-Face Clinical Trial Evaluating the Effects of a Vitamin C, E, and Ferulic Acid Serum Combined with Microneedling on Facial Photoaging', 'Clinical, Cosmetic and Investigational Dermatology', 'peer_reviewed_literature', '2026-02-12', 'moderate'::evidence_level, '31-adult, 12-week split-face RCT: a vitamin C/E/ferulic acid antioxidant serum combined with microneedling improved photoaging scores versus placebo serum plus microneedling.'),
  ('d25c7d6e-63d2-4765-ab14-c804633639e3', 'https://doi.org/10.1111/jocd.70306', 'Application of Antioxidant Mixture Prevents Cutaneous "Oxinflammaging" in Subjects Exposed to Particulate Matter', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-07-01', 'moderate'::evidence_level, 'Randomized clinical study: a serum containing 15% ascorbic acid, 0.5% ferulic acid and 1% tocopherol protected skin against particulate-matter-induced oxidative/inflammatory damage.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- GHK-Cu
UPDATE ingredients SET
  description = 'GHK-Cu (copper tripeptide-1) is a naturally occurring copper-binding peptide that declines in the body with age, used in skincare for its proposed role in supporting collagen production and wound healing.',
  function_summary = 'Commonly used in anti-aging formulations. Reviewed evidence describes GHK-Cu''s role in stimulating collagen and glycosaminoglycan synthesis, accelerating wound healing, and improving skin elasticity and density in cosmetic use, though much of the supporting evidence is preclinical/mechanistic rather than large-scale human clinical trials.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1155/2015/648108',
  source_type = 'peer_reviewed_literature',
  source_date = '2015-07-07',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'cefc629b-8341-49ca-ae50-db5dc1a11af8';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('cefc629b-8341-49ca-ae50-db5dc1a11af8', 'https://doi.org/10.1155/2015/648108', 'GHK Peptide as a Natural Modulator of Multiple Cellular Pathways in Skin Regeneration', 'BioMed Research International', 'peer_reviewed_literature', '2015-07-07', 'limited'::evidence_level, 'Review: GHK-Cu stimulates collagen/glycosaminoglycan synthesis and dermal proteoglycan production, accelerates wound healing across several tissue types, and has been reported to tighten skin and improve elasticity in cosmetic use.'),
  ('cefc629b-8341-49ca-ae50-db5dc1a11af8', 'https://doi.org/10.3390/brainsci7020020', 'The Effect of the Human Peptide GHK on Gene Expression Relevant to Nervous System Function and Cognitive Decline', 'Brain Sciences', 'peer_reviewed_literature', '2017-02-15', 'limited'::evidence_level, 'Review primarily focused on neuroscience, but corroborates GHK''s established role in improving wound healing, tissue regeneration and collagen synthesis across tissues including skin.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Green Tea Extract
UPDATE ingredients SET
  description = 'Green tea extract is rich in catechins (including EGCG), polyphenol antioxidants used topically for their anti-inflammatory and photoprotective properties.',
  function_summary = 'Commonly used as an antioxidant to help protect skin from UV-induced damage and support sebum control. A randomized controlled trial found green tea catechins protected the dermal extracellular matrix from UV-induced degradation, and a separate RCT found an EGCG-containing moisturizer improved sebum control in seborrheic skin.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/ced.15179',
  source_type = 'peer_reviewed_literature',
  source_date = '2022-05-18',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'eb64fee2-d988-418e-beb1-bf4dfc34353e';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('eb64fee2-d988-418e-beb1-bf4dfc34353e', 'https://doi.org/10.1111/ced.15179', 'Ultraviolet radiation-induced degradation of dermal extracellular matrix and protection by green tea catechins: a randomized controlled trial', 'Clinical and Experimental Dermatology', 'peer_reviewed_literature', '2022-05-18', 'moderate'::evidence_level, '50-subject double-blind RCT: oral green tea catechins (540mg) plus vitamin C protected the dermal collagen and elastic fibre network from solar-simulated UV-induced degradation versus placebo.'),
  ('eb64fee2-d988-418e-beb1-bf4dfc34353e', 'https://doi.org/10.1111/jocd.15816', 'Efficacy of anti-sebum moisturizing cream containing 2% l-carnitine and 5% epigallocatechin gallate in seborrhea: A randomized clinical trial', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2023-05-17', 'moderate'::evidence_level, '90-subject RCT: a 5% EGCG (green tea catechin) moisturizing cream reduced facial sebum over 4 weeks, alone and synergistically combined with l-carnitine.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Jojoba Oil
UPDATE ingredients SET
  description = 'Jojoba oil (technically a liquid wax ester) is a plant-derived oil whose molecular structure closely resembles human sebum, commonly used as an emollient and carrier oil in skincare formulations.',
  function_summary = 'Commonly used as an emollient and carrier oil. A laboratory study found jojoba wax has real antiviral activity against herpes simplex virus 1, and it has been used as a delivery vehicle in dermatological microemulsion formulations. Direct clinical efficacy data for jojoba oil''s own moisturizing/sebum-balancing claims, beyond its function as a carrier oil, is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/molecules26196059',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-10-07',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'fbba4081-f92c-46f8-b3b4-e99f2c90f0b4';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('fbba4081-f92c-46f8-b3b4-e99f2c90f0b4', 'https://doi.org/10.3390/molecules26196059', 'Anti-Herpes Simplex 1 Activity of Jojoba Wax', 'Molecules', 'peer_reviewed_literature', '2021-10-07', 'limited'::evidence_level, 'Laboratory study: jojoba wax significantly attenuated HSV-1 plaque formation across four commercial jojoba varieties, with high potency (EC50 0.96 +/- 0.4 ug/mL).'),
  ('fbba4081-f92c-46f8-b3b4-e99f2c90f0b4', 'https://doi.org/10.1080/21691401.2018.1440236', 'Novel methotrexate soft nanocarrier/fractional erbium YAG laser combination for clinical treatment of plaque psoriasis', 'Artificial Cells, Nanomedicine, and Biotechnology', 'peer_reviewed_literature', '2018-02-15', 'limited'::evidence_level, 'Clinical study using jojoba-oil-based microemulsion as a delivery vehicle for methotrexate in psoriasis treatment; jojoba oil functions as carrier, not the tested active.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ceramide (general species)
UPDATE ingredients SET
  description = 'Ceramide refers to any of several closely related lipid species (the skincare industry commonly distinguishes types like Ceramide NP, Ceramide AP and Ceramide EOP) that make up the skin''s natural barrier lipid matrix, alongside cholesterol and fatty acids.',
  function_summary = 'Commonly used, often as part of a multi-ceramide-species blend, in barrier-repair moisturizers. A controlled clinical study found a multivesicular emulsion containing physiological lipids (ceramides, cholesterol, fatty acids) rebalanced the stratum corneum ceramide profile and strengthened barrier function in adults predisposed to atopic dermatitis.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1093/bjd/ljaf200',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-09-18',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'f604e948-c632-4e86-8065-d250e96384f4';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('f604e948-c632-4e86-8065-d250e96384f4', 'https://doi.org/10.1093/bjd/ljaf200', 'Topical supplementation with physiological lipids rebalances the stratum corneum ceramide profile and strengthens skin barrier function in adults predisposed to atopic dermatitis', 'British Journal of Dermatology', 'peer_reviewed_literature', '2025-09-18', 'moderate'::evidence_level, 'Double-blind intraparticipant-controlled study: a multivesicular emulsion with physiological lipids plus glycerine outperformed a glycerine-only emulsion on stratum corneum lipid lamellae and barrier function over 28 days.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ceramide NP
UPDATE ingredients SET
  description = 'Ceramide NP (non-hydroxy fatty acid, phytosphingosine) is one of the specific ceramide species most commonly used in skincare formulations, valued for closely matching the ceramide subtype naturally dominant in human skin.',
  function_summary = 'Commonly used, typically blended with other ceramide species, cholesterol and fatty acids, in barrier-repair moisturizers. A split-face randomized trial testing a ceramide/cholesterol/fatty-acid lipid complex (of which Ceramide NP is a representative component species) found reduced transepidermal water loss and erythema after microneedling.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.70109',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-03-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '63661288-5bbb-4fe5-94c0-cfbe9c07fc0f';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('63661288-5bbb-4fe5-94c0-cfbe9c07fc0f', 'https://doi.org/10.1111/jocd.70109', 'A Split-Face Micro-Needling Study to Evaluate the Efficacy and Consumer Perception of a Novel Moisturization Agent', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-03-01', 'moderate'::evidence_level, '30-subject randomized double-blind split-face trial of a ceramide/cholesterol/fatty-acid lipid-complex cream: reduced TEWL (14-16%) and erythema after microneedling.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ceramide-P
UPDATE ingredients SET
  description = 'Ceramide-P is a phosphate-ester ceramide species sometimes used in skincare formulations alongside other ceramide types as part of a barrier-supporting lipid blend.',
  function_summary = 'Commonly used as one component of a multi-ceramide barrier-repair blend. General ceramide-class evidence (see Ceramides and Ceramide NP) supports the role of these lipid species in restoring stratum corneum barrier function, though dedicated standalone clinical data specific to Ceramide-P was not found.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.70711',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-02-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '7d89062d-d6fc-48ce-9d5a-23030f1986ff';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7d89062d-d6fc-48ce-9d5a-23030f1986ff', 'https://doi.org/10.1111/jocd.70711', 'Comprehensive Evaluation of Body Lotion in Alleviating Xerosis: A Multi-Omics Approach to Lipid Metabolism and Microbial Community Modulation', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-02-01', 'limited'::evidence_level, 'Multicenter RCT of a ceramide-blend body lotion improving hydration and reducing TEWL/scaling in xerosis, cited here as general ceramide-class evidence applicable to specific species like Ceramide-P.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
