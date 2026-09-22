-- Track A content batch 06 (6A catch-up firing): 11 ingredients (Moringa
-- Oil, Multi-Weight Hyaluronic Acid, Natural Moisturizing Factors, Oat Bran
-- Extract, Olive Oil, Paraffinum Liquidum, Peptides, Photolyase Enzymes,
-- Polyglutamic Acid, Pomegranate Extract, Prebiotics). Research: PubMed
-- peer-reviewed literature. verification_status stays 'partially_verified'.

-- Moringa Oil
UPDATE ingredients SET
  description = 'Moringa oil is a plant-derived oil from Moringa oleifera seeds, used in cosmetic formulations for its reported antioxidant and skin-beneficial properties.',
  function_summary = 'Commonly used as an antioxidant-rich emollient oil, typically formulated alongside other herbal actives. A formulation study developing a polyherbal antioxidant peel-off mask included Moringa oleifera extract alongside Tulsi and Fenugreek for its reported antioxidant and skin-beneficial properties, though standalone clinical efficacy data specific to Moringa oil is limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pubmed.ncbi.nlm.nih.gov/42520812/',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-01-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '5ff8e52a-c399-4ae1-a7b2-7a0a89fb03dd';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('5ff8e52a-c399-4ae1-a7b2-7a0a89fb03dd', 'https://pubmed.ncbi.nlm.nih.gov/42520812/', 'Development and Optimization of Antioxidant Poly Herbal Peel-off Mask using Doe Based Approach', 'International Journal of Pharmaceutical Compounding', 'peer_reviewed_literature', '2026-01-01', 'limited'::evidence_level, 'Formulation and optimization study of a polyherbal peel-off mask combining Moringa oleifera, Ocimum sanctum (Tulsi) and Trigonella foenum-graecum (Fenugreek) extracts for antioxidant and skin-beneficial properties.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Multi-Weight Hyaluronic Acid
UPDATE ingredients SET
  description = 'Multi-Weight Hyaluronic Acid is a formulation approach combining hyaluronic acid molecules of different molecular weights, intended to deliver hydration benefits at multiple skin depths simultaneously.',
  function_summary = 'Commonly used to provide layered hydration, since low and high molecular weight HA behave differently in skin: a controlled RCT found low molecular weight HA outperformed high molecular weight HA on skin capacitance, while combination high+low MW HA formulations (e.g. stabilised hybrid complexes) are used clinically in facial rejuvenation protocols.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s00403-024-03003-2',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-06-03',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '5e7179fe-c686-4ac1-af5c-ebf81431370f';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('5e7179fe-c686-4ac1-af5c-ebf81431370f', 'https://doi.org/10.1007/s00403-024-03003-2', 'Effectiveness of topical hyaluronic acid of different molecular weights in xerosis cutis treatment in elderly', 'Archives of Dermatological Research', 'peer_reviewed_literature', '2024-06-03', 'moderate'::evidence_level, '36-subject double-blind RCT: low molecular weight HA significantly outperformed high molecular weight HA on skin capacitance after 4 weeks, demonstrating the two weights behave differently in skin.'),
  ('5e7179fe-c686-4ac1-af5c-ebf81431370f', 'https://doi.org/10.7759/cureus.89664', 'First Reported Use of aiva Re-Verse, a Novel Combination Injection Protocol for Facial Rejuvenation: A Report of Three Cases', 'Cureus', 'peer_reviewed_literature', '2025-08-09', 'limited'::evidence_level, 'Case series (3 cases) using a stabilised hybrid complex of high- and low-molecular-weight hyaluronic acid combined with other actives for facial rejuvenation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Natural Moisturizing Factors
UPDATE ingredients SET
  description = 'Natural Moisturizing Factors (NMF) are a group of water-binding compounds (amino acids, lactic acid, urea, PCA and others) naturally present in the stratum corneum, used as a formulation concept in skincare to help replenish and mimic the skin''s own hydration system.',
  function_summary = 'Commonly used as a humectant concept to replenish the skin''s own moisture-binding compounds, particularly important in barrier-impaired conditions like atopic dermatitis. A prospective cohort study using confocal Raman spectroscopy found moisturizers and emollients affect stratum corneum molecular composition differently over time in patients with reduced natural moisturizing factors versus those without.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1002/hsr2.72671',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-06-19',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'f2e68396-35e6-437d-a09a-6b60420487ca';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('f2e68396-35e6-437d-a09a-6b60420487ca', 'https://doi.org/10.1002/hsr2.72671', 'Effects of a Moisturizer and Emollient on the Stratum Corneum Assessed by Confocal Raman Spectroscopy in Patients With and Without Atopic Dermatitis', 'Health Science Reports', 'peer_reviewed_literature', '2026-06-19', 'moderate'::evidence_level, 'Assessor-blinded prospective cohort study: confocal Raman spectroscopy tracked time-dependent stratum corneum molecular composition changes from moisturizer/emollient use in AD (reduced natural moisturizing factors) versus non-AD skin.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Oat Bran Extract
UPDATE ingredients SET
  description = 'Oat Bran Extract is derived from the bran of Avena sativa (oat), part of the same oat-derived ingredient family as colloidal oatmeal, used in skincare for its soothing and barrier-supporting properties.',
  function_summary = 'Commonly used to help soothe and support the skin barrier, particularly in atopic-prone skin. A clinical study of a colloidal-oat-containing baby wash found it gentle and effective for atopic-prone infant skin, and a literature review of colloidal oat emollients found supportive evidence for pediatric atopic dermatitis prevention and treatment — this evidence concerns closely related oat-derived formulations (colloidal oatmeal) rather than oat bran extract specifically.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/ics.70010',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-07-25',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '66100e2b-8edb-4e98-8208-cfc0a136c80a';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('66100e2b-8edb-4e98-8208-cfc0a136c80a', 'https://doi.org/10.1111/ics.70010', 'A colloidal oat-containing baby wash is gentle and effective for atopic-prone skin', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2025-07-25', 'limited'::evidence_level, '4-week single-centre nonrandomized study: a colloidal-oat-containing baby wash was well tolerated and effective for babies prone to atopic dermatitis, per clinical and parental assessment.'),
  ('66100e2b-8edb-4e98-8208-cfc0a136c80a', 'https://doi.org/10.1080/09546634.2025.2487945', 'Is colloidal oat an effective emollient ingredient for the prevention and treatment of atopic dermatitis in infants?', 'The Journal of Dermatological Treatment', 'peer_reviewed_literature', '2025-04-21', 'limited'::evidence_level, 'Literature review of clinical and preclinical studies on colloidal oat emollients in pediatric atopic dermatitis, covering skin barrier function and immune modulation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Olive Oil
UPDATE ingredients SET
  description = 'Olive oil is a plant-derived oil traditionally used as an emollient in skincare, valued for its fatty-acid and polyphenol content.',
  function_summary = 'Commonly used as a moisturizing emollient. A within-person randomized clinical trial comparing extra virgin olive oil to petrolatum found olive oil has real, measurable effects on stratum corneum hydration and skin barrier function, though petrolatum remains the more occlusive comparator.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/jcm14134675',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-07-02',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '48f1d031-5a32-4a85-a366-23850e7151d1';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('48f1d031-5a32-4a85-a366-23850e7151d1', 'https://doi.org/10.3390/jcm14134675', 'Effects of Extra Virgin Olive Oil and Petrolatum on Skin Barrier Function and Microtopography', 'Journal of Clinical Medicine', 'peer_reviewed_literature', '2025-07-02', 'moderate'::evidence_level, 'Within-person randomized clinical trial in healthy adults: topically applied extra virgin olive oil measurably affected stratum corneum hydration and skin barrier function versus petrolatum.'),
  ('48f1d031-5a32-4a85-a366-23850e7151d1', 'https://doi.org/10.1016/j.pedn.2026.01.014', 'Evaluation of the efficacy of local application of bee products in the care of diaper dermatitis in infants: A randomized controlled trial', 'Journal of Pediatric Nursing', 'peer_reviewed_literature', '2026-01-23', 'limited'::evidence_level, 'RCT comparing a propolis/beeswax barrier cream, zinc oxide cream and olive oil for infant diaper dermatitis healing across three treatment arms.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Paraffinum Liquidum
UPDATE ingredients SET
  description = 'Paraffinum Liquidum (liquid paraffin/mineral oil) is a highly refined petroleum-derived emollient used in skincare for its occlusive, moisture-sealing properties; it is closely related to petrolatum (a semisolid mineral-oil derivative) which is more often directly studied in the literature.',
  function_summary = 'Commonly used as an occlusive emollient to reduce transepidermal water loss. Clinical studies of petrolatum (the closely related semisolid mineral-oil derivative) show real, measurable skin barrier and hydration effects, and it remains a benchmark comparator in dermatology research for occlusive moisturizers — evidence specific to the liquid form (paraffinum liquidum) itself is more limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/jcm14134675',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-07-02',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '43096751-228c-4856-bcf4-d87f04a8d411';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('43096751-228c-4856-bcf4-d87f04a8d411', 'https://doi.org/10.3390/jcm14134675', 'Effects of Extra Virgin Olive Oil and Petrolatum on Skin Barrier Function and Microtopography', 'Journal of Clinical Medicine', 'peer_reviewed_literature', '2025-07-02', 'moderate'::evidence_level, 'Within-person RCT using petrolatum (a related mineral-oil-derived occlusive) as the benchmark comparator for skin barrier function and stratum corneum hydration.'),
  ('43096751-228c-4856-bcf4-d87f04a8d411', 'https://doi.org/10.1002/hsr2.72671', 'Effects of a Moisturizer and Emollient on the Stratum Corneum Assessed by Confocal Raman Spectroscopy in Patients With and Without Atopic Dermatitis', 'Health Science Reports', 'peer_reviewed_literature', '2026-06-19', 'moderate'::evidence_level, 'Prospective cohort study using petroleum jelly (petrolatum) as one of two tested moisturizer/emollient formulations, tracked via confocal Raman spectroscopy over time.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Peptides
UPDATE ingredients SET
  description = 'Peptides are short chains of amino acids used in skincare to signal collagen production, deliver bioactive fragments, or otherwise support skin structure and anti-aging goals.',
  function_summary = 'Commonly used to help support collagen production and improve signs of skin aging. A randomized double-blind controlled trial found a novel cyclized hexapeptide outperformed retinol on skin aging measures with better stability and permeability, and a separate split-face trial found a collagen-III multi-peptide serum improved outcomes when combined with collagen injection therapy for photoaging.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.70290',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-07-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '079cde56-ddba-422f-8d68-58134571a50a';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('079cde56-ddba-422f-8d68-58134571a50a', 'https://doi.org/10.1111/jocd.70290', 'Novel Cyclized Hexapeptide-9 Outperforms Retinol Against Skin Aging: A Randomized, Double-Blinded, Active- and Vehicle-Controlled Clinical Trial', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-07-01', 'moderate'::evidence_level, 'Randomized double-blind active- and vehicle-controlled trial: a cyclized hexapeptide-9 with improved stability and skin permeability outperformed retinol on skin-aging measures.'),
  ('079cde56-ddba-422f-8d68-58134571a50a', 'https://doi.org/10.1111/jocd.70857', 'Effectiveness and Safety of Recombinant Type III Humanized Collagen Solution Injection Combined With Collagen-III Multi-Peptide Serum in Improving Signs of Photoaging', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-05-01', 'moderate'::evidence_level, 'Prospective split-face controlled trial: a collagen-III multi-peptide serum combined with recombinant collagen injection improved photoaging signs versus injection alone.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Photolyase Enzymes
UPDATE ingredients SET
  description = 'Photolyase enzymes are light-activated DNA-repair enzymes, sourced from microorganisms and incorporated into some sunscreens/after-sun products to actively help repair UV-induced DNA damage rather than only preventing it.',
  function_summary = 'Commonly used in sunscreens/after-sun formulations as a non-filtering photoprotective ingredient that targets active DNA repair rather than UV blocking alone. A review of non-filtering photoprotective ingredients classifies DNA-repair enzymes like photolyase among evidence-backed mechanisms beyond UV filtering, and a biotechnology study successfully produced a stable, highly efficient recombinant photolyase for this purpose — though direct human clinical efficacy trials specific to topical photolyase are limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/phpp.70062',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-11-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '7b113d5a-9ecd-45da-8b0e-346ee96ac14d';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7b113d5a-9ecd-45da-8b0e-346ee96ac14d', 'https://doi.org/10.1111/phpp.70062', 'PINGing Sunshine: A Review of the Evidence for Adding Non-Filtering Photoprotective Ingredients to Sunscreens', 'Photodermatology, Photoimmunology & Photomedicine', 'peer_reviewed_literature', '2025-11-01', 'limited'::evidence_level, 'Literature review classifying DNA-repair enzymes (including photolyase) among non-filtering photoprotective ingredients that act through mechanisms beyond UV filtering.'),
  ('7b113d5a-9ecd-45da-8b0e-346ee96ac14d', 'https://doi.org/10.1002/biot.202300325', 'Recombinant production of a highly efficient photolyase from Thermus thermophilus', 'Biotechnology Journal', 'peer_reviewed_literature', '2024-01-01', 'limited'::evidence_level, 'Biotechnology study: successful recombinant production of a stable, kinetically efficient bacterial photolyase intended for topical DNA-repair application after UV exposure.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Polyglutamic Acid
UPDATE ingredients SET
  description = 'Polyglutamic acid (poly-gamma-glutamic acid, gamma-PGA) is a naturally derived, water-soluble biopolymer produced by fermentation, used in skincare as a humectant valued for its high water-binding capacity.',
  function_summary = 'Commonly used as a humectant to strengthen the skin barrier and improve moisture retention. A study using keratinocyte cultures and a reconstructed skin model found gamma-PGA dose-dependently increased expression of skin barrier markers (filaggrin, involucrin, loricrin), though this evidence is preclinical (cell/tissue-model) rather than from a human clinical trial.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/ijms26030983',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-01-24',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '7013ea8f-fcb6-4064-9cc3-48b23343617e';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7013ea8f-fcb6-4064-9cc3-48b23343617e', 'https://doi.org/10.3390/ijms26030983', 'Poly-gamma-Glutamic Acid from a Novel Strain: Strengthening the Skin Barrier and Improving Moisture Retention in Keratinocytes and a Reconstructed Skin Model', 'International Journal of Molecular Sciences', 'peer_reviewed_literature', '2025-01-24', 'limited'::evidence_level, 'Preclinical study: gamma-PGA dose-dependently increased mRNA expression of skin barrier markers (filaggrin, involucrin, loricrin) in keratinocytes and a reconstructed skin model.'),
  ('7013ea8f-fcb6-4064-9cc3-48b23343617e', 'https://doi.org/10.3390/polym16142091', 'Brown Algae as a Valuable Substrate for the Cost-Effective Production of Poly-gamma-Glutamic Acid for Applications in Cream Formulations', 'Polymers', 'peer_reviewed_literature', '2024-07-22', 'limited'::evidence_level, 'Production/formulation study on sustainably sourcing gamma-PGA (a hydrating, non-immunogenic polymer) for use in cream formulations.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Pomegranate Extract
UPDATE ingredients SET
  description = 'Pomegranate extract is a fruit-derived antioxidant ingredient rich in polyphenols, including ellagic acid, used in skincare for its antioxidant, anti-photoaging and skin-brightening properties.',
  function_summary = 'Commonly used as an antioxidant to help protect skin from environmental and UV-induced oxidative stress. A review of ellagic acid (a key pomegranate polyphenol) found evidence for skin depigmentation, antioxidant, anti-photoaging and anti-inflammatory effects, and an in vitro/in vivo study on a related polyphenol-rich fruit extract found real photoprotective and antioxidant effects.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1002/cbdv.202503206',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-06-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '17274eb0-72f8-434f-aeab-49edb953b3f6';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('17274eb0-72f8-434f-aeab-49edb953b3f6', 'https://doi.org/10.1002/cbdv.202503206', 'Ellagic Acid as a Sustainable Multifunctional Agent: Primary Effects, Mechanisms, and Skin Health Applications', 'Chemistry & Biodiversity', 'peer_reviewed_literature', '2026-06-01', 'moderate'::evidence_level, 'Review: ellagic acid, a polyphenol found in pomegranates, has multifaceted skin bioactivities including depigmentation, antioxidant, anti-photoaging, anti-inflammatory and antibacterial effects via ROS modulation.'),
  ('17274eb0-72f8-434f-aeab-49edb953b3f6', 'https://doi.org/10.1002/fsn3.70631', 'Photoprotective, Antioxidant and Anti-Inflammatory Effects of Aged Fruit Extract: In Vitro and In Vivo Insights', 'Food Science & Nutrition', 'peer_reviewed_literature', '2025-08-03', 'limited'::evidence_level, 'In vitro and in vivo study: a polyphenol-rich aged fruit extract showed real photoprotective, antioxidant and anti-inflammatory effects against UV-induced skin damage.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Prebiotics
UPDATE ingredients SET
  description = 'Prebiotics are non-living compounds (often specific sugars/fibers) that selectively feed beneficial skin or gut microorganisms, used in skincare to help support a healthy skin microbiome balance.',
  function_summary = 'Commonly used to help support a balanced skin microbiome. A review of microbiome-modulatory treatments for acne found some evidence supporting probiotics/prebiotics/synbiotics, while honestly noting most existing studies are small, in vitro, or animal-model based rather than robust human clinical trials; a separate 12-week clinical trial found oral probiotic and prebiotic supplementation improved psoriasis disease activity measures alongside standard topical therapy.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1093/ced/llaf328',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-11-25',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'f5f0e4cd-4cac-4dd1-990b-c12f818d479b';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('f5f0e4cd-4cac-4dd1-990b-c12f818d479b', 'https://doi.org/10.1093/ced/llaf328', 'Modulation of the microbiome: a paradigm shift in the treatment of acne', 'Clinical and Experimental Dermatology', 'peer_reviewed_literature', '2025-11-25', 'limited'::evidence_level, 'Review: evidence for topical/oral probiotics, prebiotics and synbiotics in acne treatment exists but is largely from in vitro/animal models or small trials, with limited robust clinical trial data currently available.'),
  ('f5f0e4cd-4cac-4dd1-990b-c12f818d479b', 'https://doi.org/10.3390/ijms241311225', 'Transforming Psoriasis Care: Probiotics and Prebiotics as Novel Therapeutic Approaches', 'International Journal of Molecular Sciences', 'peer_reviewed_literature', '2023-07-07', 'moderate'::evidence_level, '12-week clinical trial, 63 psoriasis patients: oral probiotic and precision prebiotic supplementation alongside topical therapy improved PASI, DLQI, inflammatory markers and skin thickness versus topical therapy alone.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
