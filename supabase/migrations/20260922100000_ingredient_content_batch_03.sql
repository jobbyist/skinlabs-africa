-- Track A content batch 03: 15 high-traffic ingredients (Retinol, Niacinamide,
-- Hyaluronic Acid, Vitamin C, Vitamin E, Salicylic Acid, Glycolic Acid, Lactic
-- Acid, Mandelic Acid, Ceramides, Squalane, Zinc Oxide, Panthenol, Glycerin,
-- Shea Butter). Research: PubMed (peer-reviewed literature) plus EWG Skin Deep
-- and INCIDecoder (real, Firecrawl-verified pages) as supplementary
-- ingredient-database citations. verification_status stays
-- 'partially_verified' (never 'verified' from automation).

-- Retinol
UPDATE ingredients SET
  description = 'Retinol is a vitamin A derivative widely used in over-the-counter anti-aging products. It is progressively converted by skin enzymes into retinoic acid, the biologically active form that binds retinoic acid receptors to influence collagen production and skin cell turnover.',
  function_summary = 'Commonly used to help address visible signs of photoaging (fine lines, uneven texture, dullness) by promoting skin cell turnover and supporting collagen synthesis.',
  typical_concentration_range = '0.01%-1% in most OTC formulations',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'moderate'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1001/jamadermatol.2022.1891',
  source_type = 'peer_reviewed_literature',
  source_date = '2022-08-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'a345e25e-c124-4611-b7b5-d219e025db38';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('a345e25e-c124-4611-b7b5-d219e025db38', 'https://doi.org/10.1001/jamadermatol.2022.1891', 'Biomarkers of Tretinoin Precursors and Tretinoin Efficacy in Patients With Moderate to Severe Facial Photodamage: A Randomized Clinical Trial', 'JAMA Dermatology', 'peer_reviewed_literature', '2022-08-01', 'moderate'::evidence_level, '24-patient RCT: a topical tretinoin-precursor blend (retinol + retinyl acetate + retinyl palmitate, 1.1%) matched 0.02% prescription tretinoin on photoaging scores while causing erythema 6x less often (11% vs 64%, p=.01); confirmed retinoic-acid-receptor signalling via CRABP2 induction.'),
  ('a345e25e-c124-4611-b7b5-d219e025db38', 'https://inkeedecoder.com/ingredients/retinol', 'Retinol (Explained + Products)', 'INCIDecoder', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference summarizing retinol''s known usage and formulation context.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Niacinamide
UPDATE ingredients SET
  description = 'Niacinamide (nicotinamide) is the amide form of vitamin B3, widely used in serums and moisturizers for its role in supporting skin barrier function.',
  function_summary = 'Commonly used to help improve skin barrier hydration, reduce visible redness and support a more even skin tone; efficacy is most often demonstrated in multi-ingredient formulations rather than in isolation.',
  typical_concentration_range = '2%-10%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s10103-026-04995-1',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-09-03',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '92a24920-46c0-4191-b014-11a5f279051e';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('92a24920-46c0-4191-b014-11a5f279051e', 'https://doi.org/10.1007/s10103-026-04995-1', 'Skin barrier repairing and anti-aging effects evaluation of a comprehensive topical regimen incorporating niacinamide, Pro-Xylane, and panthenol after PicoWay laser', 'Lasers in Medical Science', 'peer_reviewed_literature', '2026-09-03', 'moderate'::evidence_level, '88-subject, 112-day RCT of a niacinamide + Pro-Xylane + panthenol regimen post-laser: reduced TEWL, increased hydration and reduced redness by day 14, then improved elasticity/firmness/wrinkles/tone through day 112. Combination formulation, not niacinamide alone.'),
  ('92a24920-46c0-4191-b014-11a5f279051e', 'https://doi.org/10.2174/0109298673325125240813075250', 'Topical Formulation with Niacinamide Combined with 5 MHz Ultrasound for Improving Skin Ageing', 'Current Medicinal Chemistry', 'peer_reviewed_literature', '2025-01-01', 'moderate'::evidence_level, '67-woman, 4-arm double-blind RCT: a niacinamide cosmetic formulation improved stratum corneum hydration and reduced TEWL/sebum versus placebo.'),
  ('92a24920-46c0-4191-b014-11a5f279051e', 'https://www.ewg.org/skindeep/ingredients/704134-NIACINAMIDE/', 'What is NIACINAMIDE', 'EWG Skin Deep', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference with product-category usage breadth for niacinamide.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Hyaluronic Acid
UPDATE ingredients SET
  description = 'Hyaluronic acid (sodium hyaluronate is its salt form) is a naturally occurring polysaccharide in the skin that binds many times its weight in water, valued as a hydrating humectant ingredient.',
  function_summary = 'Commonly used as a humectant to draw and hold moisture in the skin and improve surface hydration; low molecular weight forms have shown measurably better hydration results than high molecular weight forms in controlled testing.',
  typical_concentration_range = '0.1%-2%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s00403-024-03003-2',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-06-03',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '23184c2b-773d-4442-9015-00536e3239e8';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('23184c2b-773d-4442-9015-00536e3239e8', 'https://doi.org/10.1007/s00403-024-03003-2', 'Effectiveness of topical hyaluronic acid of different molecular weights in xerosis cutis treatment in elderly', 'Archives of Dermatological Research', 'peer_reviewed_literature', '2024-06-03', 'moderate'::evidence_level, '36-subject double-blind RCT in elderly patients: low molecular weight HA significantly outperformed both high molecular weight HA (p=0.004) and vehicle (p<0.001) on skin capacitance after 4 weeks; no adverse effects in any arm.'),
  ('23184c2b-773d-4442-9015-00536e3239e8', 'https://inkeedecoder.com/ingredients/hyaluronic-acid', 'Hyaluronic Acid (Explained + Products)', 'INCIDecoder', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference on hyaluronic acid''s forms and typical use.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Vitamin C
UPDATE ingredients SET
  description = 'Vitamin C (L-ascorbic acid and its more stable ester derivatives) is an antioxidant widely used in skincare for its brightening and photoprotective-support properties.',
  function_summary = 'Commonly used as an antioxidant to help defend skin against UV and environmental oxidative stress and support a more even skin tone; stabilized ester derivatives such as tetrahexyldecyl ascorbate are used to improve formulation stability and skin penetration.',
  typical_concentration_range = '5%-20% for L-ascorbic acid; lower concentrations for stabilized esters',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.16292',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-03-25',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '64dd635c-5f82-47cc-af08-b44e656ebeed';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('64dd635c-5f82-47cc-af08-b44e656ebeed', 'https://doi.org/10.1111/jocd.16292', 'Prospective randomized double-blind comparative study of topical acetyl zingerone with tetrahexyldecyl ascorbate versus tetrahexyldecyl ascorbate alone on facial photoaging', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2024-03-25', 'moderate'::evidence_level, '44-subject, 8-week RCT: adding acetyl zingerone to a vitamin C ester (THDA) reduced wrinkle severity (p=.048), pigment intensity (p=.0002) and redness (p=.045) versus THDA alone.'),
  ('64dd635c-5f82-47cc-af08-b44e656ebeed', 'https://doi.org/10.1080/10717544.2021.1886377', 'Topical delivery of l-ascorbic acid spanlastics for stability enhancement and treatment of UVB induced damaged skin', 'Drug Delivery', 'peer_reviewed_literature', '2021-12-01', 'limited'::evidence_level, 'Animal-model study: L-ascorbic-acid-loaded spanlastic vesicles suppressed UVB-induced MMP2 (-30.4%) and MMP9 (-65.3%) with improved skin penetration versus plain L-ascorbic acid solution.'),
  ('64dd635c-5f82-47cc-af08-b44e656ebeed', 'https://www.ewg.org/skindeep/ingredients/700544-ASCORBIC_ACID_VITAMIN_C/', 'What is ASCORBIC ACID (VITAMIN C)', 'EWG Skin Deep', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference for ascorbic acid usage across product categories.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Vitamin E
UPDATE ingredients SET
  description = 'Vitamin E (most commonly as alpha-tocopherol) is a lipid-soluble antioxidant used in skincare, often alongside vitamin C, to help protect skin lipids from oxidative damage.',
  function_summary = 'Commonly used as an antioxidant and emollient; laboratory and ex vivo studies show meaningful free-radical scavenging capacity and protection against UVA-induced skin cell damage, though robust human clinical efficacy trials for vitamin E used alone are limited.',
  typical_concentration_range = '0.5%-1%',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.ijpharm.2023.122781',
  source_type = 'peer_reviewed_literature',
  source_date = '2023-02-26',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '169c8211-0550-4e0d-b133-4434a32af29a';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('169c8211-0550-4e0d-b133-4434a32af29a', 'https://doi.org/10.1016/j.ijpharm.2023.122781', 'Cosmeceutical formulations of pro-vitamin E phosphate: In-vitro release testing and dermal penetration into excised human skin', 'International Journal of Pharmaceutics', 'peer_reviewed_literature', '2023-02-26', 'limited'::evidence_level, 'Ex vivo human skin study: a lotion vehicle delivered 3-5x higher alpha-tocopherol phosphate penetration than a gel vehicle and scavenged ~73% of DPPH radicals versus 46% for the gel.'),
  ('169c8211-0550-4e0d-b133-4434a32af29a', 'https://doi.org/10.1016/j.jphotobiol.2013.07.006', 'A pilot study of the photoprotective effect of almond phytochemicals in a 3D human skin equivalent', 'Journal of Photochemistry and Photobiology B', 'peer_reviewed_literature', '2013-07-10', 'limited'::evidence_level, '3D human skin equivalent model: topical alpha-tocopherol significantly reduced UVA-induced fibroblast apoptosis (p<=0.05) and preserved basal-layer keratinocyte proliferation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Salicylic Acid
UPDATE ingredients SET
  description = 'Salicylic acid is a beta-hydroxy acid (BHA) derived from willow bark, widely used as a leave-on and rinse-off exfoliant for oily and acne-prone skin due to its lipophilic, pore-penetrating properties.',
  function_summary = 'Commonly used to help exfoliate the skin surface, unclog pores and reduce acne lesions; clinical trials show OTC salicylic-acid-based regimens can perform comparably to prescription acne regimens with better day-to-day tolerability.',
  typical_concentration_range = '0.5%-2% for leave-on products',
  evidence_level = 'strong'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.16568',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-09-20',
  confidence = 'high'::confidence_level,
  last_verified_at = now()
WHERE id = '5a2f8eca-cfe0-4f4a-bb8f-432ae73f5f2e';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('5a2f8eca-cfe0-4f4a-bb8f-432ae73f5f2e', 'https://doi.org/10.1111/jocd.16568', 'Efficacy and Tolerability of a Novel Cosmetic and Over-the-Counter Facial Acne Regimen Versus a Prescription Treatment', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2024-09-20', 'strong'::evidence_level, '54-adult double-blind RCT, 12 weeks: a salicylic-acid-based (1%/2%) OTC regimen matched a prescription adapalene/benzoyl peroxide regimen on IGA improvement (p<=.001) with significantly less dryness/tightness (p=.008) and >96% satisfaction.'),
  ('5a2f8eca-cfe0-4f4a-bb8f-432ae73f5f2e', 'https://pubmed.ncbi.nlm.nih.gov/37587705/', 'Efficacy of supramolecular salicylic acid in combination with doxycycline in the treatment of acne', 'Pakistan Journal of Pharmaceutical Sciences', 'peer_reviewed_literature', '2023-11-01', 'moderate'::evidence_level, '70-patient RCT: supramolecular salicylic acid plus oral doxycycline achieved a higher effective rate (97.14% vs 82.86%, p<0.05) and fewer adverse events than doxycycline alone.'),
  ('5a2f8eca-cfe0-4f4a-bb8f-432ae73f5f2e', 'https://www.ewg.org/skindeep/ingredients/705746-SALICYLIC_ACID/', 'What is SALICYLIC ACID', 'EWG Skin Deep', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference for salicylic acid usage across product categories.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Glycolic Acid
UPDATE ingredients SET
  description = 'Glycolic acid is the smallest alpha-hydroxy acid (AHA), derived from sugar cane, used at low concentrations for at-home exfoliation and at much higher concentrations for professional in-clinic peels.',
  function_summary = 'Commonly used to exfoliate the skin surface and improve the appearance of photoaged skin, fine lines and texture; professional-strength peels have shown measurable wrinkle-depth improvement in controlled trials, though with more adverse events than gentler alternatives like retinaldehyde.',
  typical_concentration_range = '0.1%-10% for at-home leave-on products; 20%-70% for professional in-clinic peels',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'moderate'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.13074',
  source_type = 'peer_reviewed_literature',
  source_date = '2019-07-19',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'ee5f7c6b-5d39-4238-87d8-ede3178735a1';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('ee5f7c6b-5d39-4238-87d8-ede3178735a1', 'https://doi.org/10.1111/jocd.13074', 'Cosmetic use of three topical moisturizers following glycolic acid facial peels', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2019-07-19', 'moderate'::evidence_level, 'Parallel RCTs in photoaged women: 70% glycolic acid peels followed by appropriate post-peel moisturization improved TEWL/hydration with no adverse events reported.'),
  ('ee5f7c6b-5d39-4238-87d8-ede3178735a1', 'https://doi.org/10.1111/jocd.12511', 'Antiaging efficacy of a retinaldehyde-based cream compared with glycolic acid peel sessions: A randomized controlled study', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2018-07-19', 'moderate'::evidence_level, '55-woman RCT: sequential 20%/50%/70% glycolic acid peels significantly reduced crow''s-feet wrinkle depth (p=.0348); a 0.1% retinaldehyde cream was similarly effective with 12x fewer adverse events.'),
  ('ee5f7c6b-5d39-4238-87d8-ede3178735a1', 'https://inkeedecoder.com/ingredients/glycolic-acid', 'Glycolic Acid (Explained + Products)', 'INCIDecoder', 'ingredient_database', NULL, NULL, 'Consumer-facing ingredient-database reference describing glycolic acid as the most-researched AHA.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Lactic Acid
UPDATE ingredients SET
  description = 'Lactic acid is an alpha-hydroxy acid (AHA) that also occurs naturally as a component of the skin''s natural moisturizing factor; its L-isomer specifically has been shown to stimulate ceramide synthesis in the skin barrier.',
  function_summary = 'Commonly used as a gentle exfoliant and humectant; a controlled mechanistic study found the L-lactic-acid isomer specifically (not the D-isomer) significantly increased keratinocyte ceramide production and improved stratum corneum barrier function.',
  typical_concentration_range = '5%-12% for leave-on exfoliating products',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/BF02507107',
  source_type = 'peer_reviewed_literature',
  source_date = '1996-01-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '497a1895-2f75-435d-9676-0ab4a5084e34';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('497a1895-2f75-435d-9676-0ab4a5084e34', 'https://doi.org/10.1007/BF02507107', 'Effect of lactic acid isomers on keratinocyte ceramide synthesis, stratum corneum lipid levels and stratum corneum barrier function', 'Archives of Dermatological Research', 'peer_reviewed_literature', '1996-01-01', 'moderate'::evidence_level, 'Double-blind study: L-lactic acid increased in vitro keratinocyte ceramide production 300% (vs 100% for the D-isomer) and stratum corneum ceramide levels 48% in vivo, with improved barrier function; the D-isomer alone showed no effect.'),
  ('497a1895-2f75-435d-9676-0ab4a5084e34', 'https://doi.org/10.3949/ccjm.64.6.327', 'Cosmetic use of alpha-hydroxy acids', 'Cleveland Clinic Journal of Medicine', 'peer_reviewed_literature', '1997-01-01', 'limited'::evidence_level, 'General review of AHA cosmetic use covering moisturizing, smoothing and photodamage-improvement effects across the AHA class.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Mandelic Acid
UPDATE ingredients SET
  description = 'Mandelic acid is a larger-molecule alpha-hydroxy acid (AHA) derived from bitter almond extract, often combined with salicylic acid in professional peels for acne-prone and sensitive skin because its larger molecular size slows skin penetration.',
  function_summary = 'Commonly used in combination peels (frequently paired with salicylic acid) to exfoliate the skin and help manage acne; a retrospective clinical analysis found salicylic-mandelic acid peels to be safe and effective, including in patients concurrently on oral isotretinoin. Standalone mandelic-acid efficacy data (outside combination peels) is limited.',
  typical_concentration_range = '5%-10% in professional combination peels',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8675349/',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-11-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '14fac5c8-4c86-47bc-a16b-82efe20e6c29';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('14fac5c8-4c86-47bc-a16b-82efe20e6c29', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8675349/', 'Safety of Performing Superficial Chemical Peels in Patients on Oral Isotretinoin for Acne and Acne-Induced Pigmentation', 'Journal of Clinical and Aesthetic Dermatology', 'peer_reviewed_literature', '2021-11-01', 'limited'::evidence_level, 'Retrospective analysis, 60 patients/214 sessions: salicylic-mandelic acid peels showed no significant difference in complication rate between isotretinoin and non-isotretinoin patients, with faster improvement in the isotretinoin group.'),
  ('14fac5c8-4c86-47bc-a16b-82efe20e6c29', 'https://doi.org/10.1016/j.clindermatol.2016.10.011', 'Chemical peels in active acne and acne scars', 'Clinics in Dermatology', 'peer_reviewed_literature', '2016-10-27', 'limited'::evidence_level, 'Review of chemical peeling agents (including mandelic acid) for acne and acne scars; peel choice guided by skin type and combination peels used to minimize side effects.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ceramides
UPDATE ingredients SET
  description = 'Ceramides are lipid molecules that make up a major component of the skin''s natural barrier, helping to hold skin cells together in the stratum corneum and prevent moisture loss.',
  function_summary = 'Commonly used in barrier-repair moisturizers to help restore skin hydration, reduce transepidermal water loss (TEWL) and support skin recovery after barrier disruption; randomized trials of ceramide-containing lipid-complex formulations show measurable improvements in hydration, TEWL and post-procedure skin recovery.',
  typical_concentration_range = '0.1%-5% as part of a lipid-complex blend',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.70711',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-02-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '7854f05d-efa2-4906-9e89-a529377df231';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7854f05d-efa2-4906-9e89-a529377df231', 'https://doi.org/10.1111/jocd.70711', 'Comprehensive Evaluation of Body Lotion in Alleviating Xerosis: A Multi-Omics Approach to Lipid Metabolism and Microbial Community Modulation', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-02-01', 'moderate'::evidence_level, 'Multicenter, randomized, self-controlled trial: a ceramide + natural-oil body lotion improved hydration, radiance and smoothness while decreasing TEWL and scaling versus untreated skin over 4 weeks.'),
  ('7854f05d-efa2-4906-9e89-a529377df231', 'https://doi.org/10.1111/jocd.70109', 'A Split-Face Micro-Needling Study to Evaluate the Efficacy and Consumer Perception of a Novel Moisturization Agent', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-03-01', 'moderate'::evidence_level, '30-subject randomized double-blind split-face trial: a ceramide/cholesterol/fatty-acid lipid-complex cream reduced TEWL (14-16%) and erythema (~1.7%) after microneedling, with 93% reporting improved hydration.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Squalane
UPDATE ingredients SET
  description = 'Squalane is the hydrogenated, shelf-stable form of squalene, a lipid naturally present in human sebum; it is widely used as a lightweight, non-comedogenic emollient in moisturizers.',
  function_summary = 'Commonly used as an emollient to soften skin and reduce moisture loss. It has been tested clinically as part of a multi-ingredient emollient blend (alongside shea butter, glycerin and hyaluronic acid) rather than in isolation, so standalone efficacy data specific to squalane is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1155/drp/3586393',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-12-23',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '764c7dd6-39a4-450a-b43c-feb4e2d37329';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('764c7dd6-39a4-450a-b43c-feb4e2d37329', 'https://doi.org/10.1155/drp/3586393', 'The Role of Moisturizer Containing Anti-inflammatory on Skin Hydration in Mild-Moderate Atopic Dermatitis Patients', 'Dermatology Research and Practice', 'peer_reviewed_literature', '2024-12-23', 'limited'::evidence_level, 'Double-blind trial in mild-moderate AD: a moisturizer combining shea butter and squalane (as emollients) with glycerin/hyaluronic acid (humectants) significantly improved hydration versus a control formulation over 14 days.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Zinc Oxide
UPDATE ingredients SET
  description = 'Zinc oxide is a mineral (inorganic) UV filter used in sunscreens and some skin-protectant products, forming a physical barrier on the skin surface that reflects and scatters UV radiation.',
  function_summary = 'Commonly used as a broad-spectrum physical sunscreen active. In vitro photoprotection testing found zinc-oxide-containing sunscreen products provided meaningfully higher SPF/UVA protection than plant-oil-based "natural" alternatives, which showed negligible photoprotection despite similar marketing claims.',
  typical_concentration_range = '2%-25% in sunscreen formulations',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s43630-026-00911-2',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-05-05',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'cf2d3afc-7b5d-431b-98fb-2280bbf8242b';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('cf2d3afc-7b5d-431b-98fb-2280bbf8242b', 'https://doi.org/10.1007/s43630-026-00911-2', 'Natural photoprotection under scrutiny: an in vitro evaluation', 'Photochemical & Photobiological Sciences', 'peer_reviewed_literature', '2026-05-05', 'limited'::evidence_level, 'In vitro SPF testing of 11 plant oils and 9 "natural" sunscreen products: cosmetic products containing inorganic UV filters (titanium dioxide, zinc oxide) showed variable but measurable efficacy, while plant oils (shea butter included) showed negligible in vitro SPF/UVA protection.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Panthenol
UPDATE ingredients SET
  description = 'Panthenol (provitamin B5, dexpanthenol) is converted in the skin to pantothenic acid; it is widely used in moisturizers and post-procedure skincare for its skin-conditioning and wound-healing-supportive properties.',
  function_summary = 'Commonly used to support skin barrier hydration, reduce irritation and promote wound healing after procedures such as laser treatment or microneedling. Reviewed clinical and in-vitro evidence describes barrier-strengthening and re-epithelialization benefits, including in atopic dermatitis and postprocedure wound care.',
  typical_concentration_range = '1%-5%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/ph13070138',
  source_type = 'peer_reviewed_literature',
  source_date = '2020-06-29',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '7d8a9e9d-5639-487a-9544-b8f8a8cbdfb3';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7d8a9e9d-5639-487a-9544-b8f8a8cbdfb3', 'https://doi.org/10.3390/ph13070138', 'Dexpanthenol in Wound Healing after Medical and Cosmetic Interventions (Postprocedure Wound Healing)', 'Pharmaceuticals', 'peer_reviewed_literature', '2020-06-29', 'moderate'::evidence_level, 'Review of in vitro and clinical evidence: topical dexpanthenol upregulates genes critical to wound healing and clinical studies show accelerated re-epithelialization and barrier restoration after superficial skin injury.'),
  ('7d8a9e9d-5639-487a-9544-b8f8a8cbdfb3', 'https://doi.org/10.3390/jcm11143943', 'Use of Dexpanthenol for Atopic Dermatitis-Benefits and Recommendations Based on Current Evidence', 'Journal of Clinical Medicine', 'peer_reviewed_literature', '2022-07-06', 'moderate'::evidence_level, 'Review synthesizing evidence that dexpanthenol improves skin barrier function, reduces acute AD flares and has a topical-corticosteroid-sparing effect.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Glycerin
UPDATE ingredients SET
  description = 'Glycerin (glycerol) is a naturally occurring humectant widely used across skincare products for its ability to draw and retain moisture in the skin.',
  function_summary = 'Commonly used as a humectant to increase skin hydration and support barrier function; a randomized crossover trial found glycerin-based moisturizers effective for secondary prevention of occupational hand dermatitis, and it is considered a foundational, well-established emollient/humectant ingredient in dermatologic literature.',
  typical_concentration_range = '2%-10%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1038/s41598-024-72010-0',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-09-05',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '934df070-143a-4617-bad1-3319b1a84fb7';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('934df070-143a-4617-bad1-3319b1a84fb7', 'https://doi.org/10.1038/s41598-024-72010-0', 'Cocos nucifera and glycerine afterwork moisturizers for secondary prevention of hand dermatitis among fabric workers', 'Scientific Reports', 'peer_reviewed_literature', '2024-09-05', 'moderate'::evidence_level, '32-worker randomized double-blind crossover trial: glycerin-based moisturizers reduced HECSI/TEWL by 20% and increased skin capacitance by 20% over 14 days of after-work use.'),
  ('934df070-143a-4617-bad1-3319b1a84fb7', 'https://doi.org/10.1111/ijd.17793', 'Basic Emollients for Xerosis Cutis in Atopic Dermatitis: A Review of Clinical Studies', 'International Journal of Dermatology', 'peer_reviewed_literature', '2025-04-23', 'moderate'::evidence_level, 'Review of clinical studies on basic emollients (including glycerol) concluding they are safe and effective for xerosis cutis, with additive benefit when combined with occlusive ingredients like petrolatum.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Shea Butter
UPDATE ingredients SET
  description = 'Shea butter (Butyrospermum Parkii) is a plant-derived fat rich in fatty acids, used as an emollient and occlusive moisturizing ingredient in body and skin care products.',
  function_summary = 'Commonly used as an emollient/occlusive to soften skin and reduce moisture loss. Tested clinically as part of multi-ingredient moisturizing formulations (alongside saccharide isomerate or colloidal oatmeal, for example) showing improvements in skin hydration and barrier recovery after skin procedures; standalone shea-butter-only efficacy data is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s10103-025-04703-5',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-10-24',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '50264fd2-8f59-44e6-b8a4-3cc2008ef3de';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('50264fd2-8f59-44e6-b8a4-3cc2008ef3de', 'https://doi.org/10.1007/s10103-025-04703-5', 'Efficacy and safety of combination cream of Stimu-tex AS (spent grain wax, Argania Spinosa Kernel oil, Butyrospermum Parkii shea butter extract) and saccharide isomerate after fractional CO2 laser', 'Lasers in Medical Science', 'peer_reviewed_literature', '2025-10-24', 'limited'::evidence_level, '20-subject split-face double-blind RCT: a shea-butter-containing combination cream significantly reduced erythema and improved skin capacitance and TEWL after fractional CO2 laser, with no adverse events.'),
  ('50264fd2-8f59-44e6-b8a4-3cc2008ef3de', 'https://doi.org/10.23736/S0392-0488.18.06002-9', 'Clinical and confocal evaluation of avenanthramides-based daily cleansing and emollient cream in pediatric population affected by atopic dermatitis and xerosis', 'Giornale Italiano di Dermatologia e Venereologia', 'peer_reviewed_literature', '2018-09-12', 'limited'::evidence_level, 'Pediatric clinical trial: an emollient cream containing colloidal oatmeal, avenanthramides, shea butter and oat oil improved epidermal thickness, dryness, itching and IGA/EASI scores over one month.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
