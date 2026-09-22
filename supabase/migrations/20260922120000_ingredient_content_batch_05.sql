-- Track A content batch 05 (6A catch-up firing): 11 ingredients (Coco-Glucoside,
-- Hyaluronic Acid Crosspolymer, Iron Oxides, Kojic Acid, L-Ascorbic Acid,
-- Lavender Essential Oil, Licorice Root Extract, Liposomal Ceramide NP,
-- Live Lactobacillus Cultures, Marula Oil, Marula Seed Oil). Research:
-- PubMed peer-reviewed literature. verification_status stays
-- 'partially_verified'.

-- Coco-Glucoside
UPDATE ingredients SET
  description = 'Coco-Glucoside is a mild, coconut-derived surfactant belonging to the alkyl glucoside family, widely used in cleansers and shampoos marketed as gentle or hypoallergenic.',
  function_summary = 'Commonly used as a gentle, sulfate-free cleansing surfactant. A 2024 analysis found coco-glucoside was the most frequently used alkyl glucoside in shampoos/body cleansers marketed as hypoallergenic or for sensitive skin, but flagged alkyl glucosides as known, if uncommon, contact allergens worth patch-testing awareness despite their mild reputation.',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1177/07482337241245152',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-04-04',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '392a271e-3ee3-44d0-a3c2-1c714620f4e1';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('392a271e-3ee3-44d0-a3c2-1c714620f4e1', 'https://doi.org/10.1177/07482337241245152', 'Occurrence of alkyl glucosides in rinse-off cosmetics marketed as hypoallergenic or for sensitive skin', 'Toxicology and Industrial Health', 'peer_reviewed_literature', '2024-04-04', 'moderate'::evidence_level, 'Survey of 120 best-selling shampoos/cleansers: coco-glucoside was the most commonly present alkyl glucoside; the authors recommend including it in baseline patch-test allergen series given rising allergic contact dermatitis reports.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Hyaluronic Acid Crosspolymer
UPDATE ingredients SET
  description = 'Hyaluronic Acid Crosspolymer is a chemically crosslinked form of hyaluronic acid, engineered to resist breakdown and enhance the delivery and hydration performance of topical formulations compared with standard (non-crosslinked) hyaluronic acid.',
  function_summary = 'Commonly used as a humectant and penetration enhancer in serums, including post-procedure skincare. A split-face RCT found a crosslinked HA serum improved skin quality/biomechanical attributes after fillers, microneedling or chemical peels, and a separate skin-explant study found crosslinked HA boosts topical delivery of other skincare actives.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pubmed.ncbi.nlm.nih.gov/29601621/',
  source_type = 'peer_reviewed_literature',
  source_date = '2018-04-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'acf9424c-3b73-4240-8cea-5ab07003a5ba';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('acf9424c-3b73-4240-8cea-5ab07003a5ba', 'https://pubmed.ncbi.nlm.nih.gov/29601621/', 'Prospective, Randomized, Investigator-Blinded, Split-Face Evaluation of a Topical Crosslinked Hyaluronic Acid Serum for Post-Procedural Improvement of Skin Quality and Biomechanical Attributes', 'Journal of Drugs in Dermatology', 'peer_reviewed_literature', '2018-04-01', 'moderate'::evidence_level, '24-subject split-face RCT: a crosslinked HA serum enhanced clinical results from filler injection, microneedling and chemical peeling versus prior explant studies of non-crosslinked HA.'),
  ('acf9424c-3b73-4240-8cea-5ab07003a5ba', 'https://doi.org/10.1111/ics.70076', 'Penetration enhancement effects of topically applied crosslinked hyaluronic acid', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2026-01-19', 'limited'::evidence_level, 'Porcine ear skin and human skin explant study: crosslinked HA boosted topical delivery of both small-molecule and macromolecule actives via HPLC/MALDI-MSI analysis.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Iron Oxides
UPDATE ingredients SET
  description = 'Iron oxides are naturally occurring mineral pigments used in mineral sunscreens and tinted skincare, valued for providing visible-light (not just UV) protection and for their coloring/tinting properties.',
  function_summary = 'Commonly used in tinted mineral sunscreens to help protect against visible-light-induced pigmentation, a gap that UV-only filters do not address; a 2026 literature review on photoprotection for skin of color specifically highlights iron-oxide-containing formulations as addressing visible-light-driven hyperpigmentation risk in populations more prone to it.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.7759/cureus.113666',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-07-30',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '0b9c1973-7b3e-4e98-96e4-c8092b9d92be';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('0b9c1973-7b3e-4e98-96e4-c8092b9d92be', 'https://doi.org/10.7759/cureus.113666', 'Beyond Melanin: A Literature Review of Photoprotection Mechanisms and Gaps in Skin of Color', 'Cureus', 'peer_reviewed_literature', '2026-07-30', 'limited'::evidence_level, 'Literature review: skin of color remains susceptible to visible-light-induced hyperpigmentation despite higher natural melanin photoprotection; iron-oxide-containing tinted sunscreens are discussed as addressing this specific gap versus UV-only filters.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Kojic Acid
UPDATE ingredients SET
  description = 'Kojic acid is a naturally derived (fungal fermentation byproduct) skin-brightening ingredient that inhibits tyrosinase, the enzyme responsible for melanin production, commonly used to address hyperpigmentation and melasma.',
  function_summary = 'Commonly used to help fade hyperpigmentation and melasma by inhibiting melanin production. A split-face RCT found a cream combining 5% alpha-arbutin with 2% kojic acid was an effective, better-tolerated alternative to the gold-standard triple combination cream for melasma, though kojic acid is typically used in combination with other brighteners rather than alone.',
  typical_concentration_range = '1%-4%, often combined with other brightening actives',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.16562',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-11-18',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'fe9234a5-8114-475c-bb0c-f667df09363c';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('fe9234a5-8114-475c-bb0c-f667df09363c', 'https://doi.org/10.1111/jocd.16562', 'The Efficacy of Topical Cosmetic Containing Alpha-Arbutin 5% and Kojic Acid 2% Compared With Triple Combination Cream for the Treatment of Melasma', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2024-11-18', 'moderate'::evidence_level, '30-participant split-face RCT, 12 weeks: an alpha-arbutin + kojic acid cream showed comparable efficacy to gold-standard triple combination cream for melasma on melanin index, mMASI and physician global assessment.'),
  ('fe9234a5-8114-475c-bb0c-f667df09363c', 'https://doi.org/10.1080/09546634.2025.2591502', 'Emerging topical therapies for melasma: a comparative analysis of efficacy and safety', 'The Journal of Dermatological Treatment', 'peer_reviewed_literature', '2025-11-27', 'limited'::evidence_level, 'Literature review comparing established and emerging topical melasma therapies, including kojic acid, by efficacy and safety profile.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- L-Ascorbic Acid
UPDATE ingredients SET
  description = 'L-Ascorbic acid is the pure, biologically active form of vitamin C used topically as an antioxidant and collagen-synthesis cofactor, though it is notably unstable and formulation-sensitive.',
  function_summary = 'Commonly used to help prevent photoaging, reduce wrinkles and mitigate hyperpigmentation via antioxidant activity, tyrosinase inhibition and its role as a cofactor in collagen synthesis. A 2026 dermatology review confirms these clinical effects while noting L-ascorbic acid''s intrinsic formulation instability drives ongoing use of pH adjustment, encapsulation and derivative forms.',
  typical_concentration_range = '5%-20%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.clindermatol.2026.02.007',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-02-12',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '7995737b-4442-4b10-97c7-e93b96b4444b';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7995737b-4442-4b10-97c7-e93b96b4444b', 'https://doi.org/10.1016/j.clindermatol.2026.02.007', 'Vitamins and the skin: Vitamin C in dermatology', 'Clinics in Dermatology', 'peer_reviewed_literature', '2026-02-12', 'moderate'::evidence_level, 'Review: clinical studies confirm topical L-ascorbic acid''s effectiveness in preventing photoaging, reducing wrinkles and mitigating hyperpigmentation via antioxidant, collagen-cofactor and tyrosinase-inhibition mechanisms.'),
  ('7995737b-4442-4b10-97c7-e93b96b4444b', 'https://doi.org/10.1080/10717544.2021.1886377', 'Topical delivery of l-ascorbic acid spanlastics for stability enhancement and treatment of UVB induced damaged skin', 'Drug Delivery', 'peer_reviewed_literature', '2021-12-01', 'limited'::evidence_level, 'Animal-model study: L-ascorbic-acid-loaded spanlastic vesicles suppressed UVB-induced MMP2/MMP9 and improved skin protection versus a plain L-ascorbic acid solution.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Lavender Essential Oil
UPDATE ingredients SET
  description = 'Lavender essential oil is a botanical extract long used in traditional and complementary skincare, most notably studied for its wound-healing and calming properties.',
  function_summary = 'Commonly used for its soothing properties and, in traditional/complementary contexts, to support wound healing. A systematic PRISMA review of the wound-healing literature found supportive evidence, and a controlled animal wound-model study found topical lavender oil improved re-epithelialization and reduced inflammation versus untreated wounds.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1089/acm.2019.0286',
  source_type = 'peer_reviewed_literature',
  source_date = '2020-06-24',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '1cb1cfd2-5d61-46f8-ab00-7f5aab66e975';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('1cb1cfd2-5d61-46f8-ab00-7f5aab66e975', 'https://doi.org/10.1089/acm.2019.0286', 'The Effects of Lavender Essential Oil on Wound Healing: A Review of the Current Evidence', 'Journal of Alternative and Complementary Medicine', 'peer_reviewed_literature', '2020-06-24', 'moderate'::evidence_level, 'PRISMA-methodology systematic review of PubMed/Cochrane/Embase literature: lavender essential oil shows supportive evidence for wound healing as a cost-effective complementary option.'),
  ('1cb1cfd2-5d61-46f8-ab00-7f5aab66e975', 'https://doi.org/10.1016/j.jtumed.2026.02.007', 'Enhanced wound healing in rat cheeks treated with lavender and ginger oils: A histological study', 'Journal of Taibah University Medical Sciences', 'peer_reviewed_literature', '2026-03-12', 'limited'::evidence_level, 'Controlled animal wound-healing study, 40 rats: topical lavender oil improved re-epithelialization, reduced inflammatory response and accelerated wound contraction versus untreated controls.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Licorice Root Extract
UPDATE ingredients SET
  description = 'Licorice root extract (Glycyrrhiza glabra/uralensis) contains skin-brightening compounds such as glabridin and dehydroglyasperin C, used in cosmetics for their tyrosinase-inhibiting, brightening properties.',
  function_summary = 'Commonly used as a skin-brightening ingredient. A mechanistic in-vitro study found dehydroglyasperin C, a licorice component, suppressed melanin synthesis in melanocyte cells by downregulating a key pigmentation-driving transcription factor (MITF) — real, direct evidence for licorice''s brightening mechanism, though from a cell-culture model rather than a human clinical trial.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.pharep.2018.02.024',
  source_type = 'peer_reviewed_literature',
  source_date = '2018-02-24',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'c5b4b674-e531-48e4-95bd-fbb7ab244ac2';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('c5b4b674-e531-48e4-95bd-fbb7ab244ac2', 'https://doi.org/10.1016/j.pharep.2018.02.024', 'Anti-melanogenesis effect of dehydroglyasperin C through the downregulation of MITF via the reduction of intracellular cAMP and acceleration of ERK activation in B16F1 melanoma cells', 'Pharmacological Reports', 'peer_reviewed_literature', '2018-02-24', 'limited'::evidence_level, 'In-vitro melanocyte-cell-line study: dehydroglyasperin C (a licorice/Glycyrrhiza uralensis component) suppressed alpha-MSH-induced melanogenesis by downregulating MITF expression.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Liposomal Ceramide NP
UPDATE ingredients SET
  description = 'Liposomal Ceramide NP is Ceramide NP encapsulated in a lipid-vesicle (liposome) delivery system, engineered to improve stability and skin penetration versus free (non-encapsulated) ceramide.',
  function_summary = 'Commonly used as a barrier-repair delivery technology; ceramide-liposome complexes have been shown in real formulation studies to remain stable for weeks and to meaningfully improve topical skin permeability of co-formulated actives compared with non-liposomal delivery systems — the delivery-technology evidence is real, though direct human clinical efficacy data specific to liposomal ceramide NP alone is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/ics.12156',
  source_type = 'peer_reviewed_literature',
  source_date = '2014-10-20',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '176686d1-5e7b-4a1c-b575-f65223ad30a2';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('176686d1-5e7b-4a1c-b575-f65223ad30a2', 'https://doi.org/10.1111/ics.12156', 'Enhanced skin delivery of liquiritigenin and liquiritin-loaded liposome-in-hydrogel complex system', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2014-10-20', 'limited'::evidence_level, 'Formulation study: a ceramide-liposome-in-hydrogel complex remained stable for 3+ weeks and significantly increased skin permeability of co-formulated antioxidant actives versus non-liposomal delivery.'),
  ('176686d1-5e7b-4a1c-b575-f65223ad30a2', 'https://doi.org/10.1007/s00210-026-05438-y', 'Development and evaluation of multifunctional niosomal cream encapsulating tretinoin and integrated with hyaluronic acid and ceramides', 'Naunyn-Schmiedeberg''s Archives of Pharmacology', 'peer_reviewed_literature', '2026-05-12', 'limited'::evidence_level, 'Formulation study: a niosomal (vesicle-encapsulated) cream integrating ceramides and hyaluronic acid showed improved drug release, spreadability and stability versus a non-vesicle comparator formulation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Live Lactobacillus Cultures
UPDATE ingredients SET
  description = 'Live Lactobacillus cultures are probiotic bacterial strains used topically to support the skin microbiome, with immunomodulatory, anti-inflammatory and antimicrobial properties.',
  function_summary = 'Commonly used to help rebalance the skin microbiome and calm inflammation. A GRADE systematic review and meta-analysis of randomized controlled trials found Lactobacillus-based microbiome therapy effective for acne vulgaris with a favorable safety profile, and a separate randomized double-blind trial found Lactobacillus-derived postbiotics improved a chronic inflammatory skin condition.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.70792',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-03-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'b4d796f1-4f00-4f82-8c29-5cfa0262c513';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('b4d796f1-4f00-4f82-8c29-5cfa0262c513', 'https://doi.org/10.1111/jocd.70792', 'Lactobacillus-Based Microbiome Therapy for Acne Vulgaris: A GRADE Systematic Review and Meta-Analysis of Randomized Controlled Trials', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-03-01', 'moderate'::evidence_level, 'GRADE systematic review/meta-analysis of RCTs: Lactobacillus probiotics reduced acne inflammation and oxidative stress with a proven safety profile, offering potential to reduce antibiotic reliance.'),
  ('b4d796f1-4f00-4f82-8c29-5cfa0262c513', 'https://doi.org/10.1186/s12866-026-04738-w', 'Postbiotics originated from Lactobacillus crispatus NCU-31 improves vulvar lichen sclerosus: a randomized, double-blind controlled trial', 'BMC Microbiology', 'peer_reviewed_literature', '2026-01-21', 'moderate'::evidence_level, 'Randomized double-blind controlled trial: Lactobacillus crispatus-derived postbiotics improved a chronic inflammatory skin condition, informed by 16S rRNA skin microbiota profiling.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Marula Oil
UPDATE ingredients SET
  description = 'Marula oil is a nut oil from Sclerocarya birrea, a tree native to Southern Africa, traditionally used by the Zulu people to maintain healthy skin and now widely used in commercial cosmetics as a moisturizing, occlusive facial oil.',
  function_summary = 'Commonly used as a moisturizing, occlusive facial oil. A dedicated clinical safety and efficacy study found Marula oil had a favorable irritancy profile alongside real moisturizing, hydrating and occlusive effects — providing scientific support for its long-standing traditional use in South Africa.',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.jep.2015.10.037',
  source_type = 'peer_reviewed_literature',
  source_date = '2015-10-31',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'e0110416-b39c-4f1b-8b9f-56dc6c6e6839';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('e0110416-b39c-4f1b-8b9f-56dc6c6e6839', 'https://doi.org/10.1016/j.jep.2015.10.037', 'Safety and efficacy of Sclerocarya birrea (A.Rich.) Hochst (Marula) oil: A clinical perspective', 'Journal of Ethnopharmacology', 'peer_reviewed_literature', '2015-10-31', 'moderate'::evidence_level, 'Clinical study evaluating Marula nut oil''s irritancy potential (safety), moisturising/hydrating effects and occlusivity properties (efficacy), providing scientific support for its traditional South African (Zulu) skin-health use.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Marula Seed Oil
UPDATE ingredients SET
  description = 'Marula seed oil is the same Sclerocarya birrea nut oil as Marula Oil, native to Southern Africa and traditionally used by the Zulu people, catalogued here as a distinct INCI listing variant.',
  function_summary = 'Commonly used as a moisturizing, occlusive facial oil. The same dedicated clinical safety and efficacy study covering Sclerocarya birrea (Marula) oil found a favorable irritancy profile alongside real moisturizing, hydrating and occlusive effects.',
  evidence_level = 'moderate'::evidence_level,
  irritancy_risk = 'low'::irritancy_risk,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.jep.2015.10.037',
  source_type = 'peer_reviewed_literature',
  source_date = '2015-10-31',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '5b51a92f-ecdf-4021-830e-3985abe5f3ee';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('5b51a92f-ecdf-4021-830e-3985abe5f3ee', 'https://doi.org/10.1016/j.jep.2015.10.037', 'Safety and efficacy of Sclerocarya birrea (A.Rich.) Hochst (Marula) oil: A clinical perspective', 'Journal of Ethnopharmacology', 'peer_reviewed_literature', '2015-10-31', 'moderate'::evidence_level, 'Clinical study evaluating Marula nut oil''s irritancy potential (safety), moisturising/hydrating effects and occlusivity properties (efficacy) — same source plant/study as the Marula Oil catalogue row.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
