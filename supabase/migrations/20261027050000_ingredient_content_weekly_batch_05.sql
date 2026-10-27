-- Weekly Ingredients Intelligence pipeline, firing 5 (2026-10-27).
--
-- Demand queue this firing was heavier than recent firings (19 pending rows,
-- requested 2026-10-20 through 2026-10-26): 4 real, specific ingredients
-- researched and published (Ectoine, Rice Bran Extract, Palmitoyl
-- Tripeptide-8, Camellia Sinensis Seed Extract/"Green Tea Seed"), 5 resolved
-- as duplicates of already-published ingredients (Witch Hazel Leaf Extract ->
-- witch-hazel, Botanical Trehalose -> trehalose, Bulbine -> bulbine-
-- frutescens, Saccharomyces/Rice Ferment Filtrate -> rice-ferment-filtrate,
-- Sodium Hyaluronate Crosspolymer -> hyaluronic-acid-crosspolymer), and 10
-- rejected -- 4 generic/non-ingredient phrases (UVA & UVB Filters, Sunscreen
-- filters, Grain-derived probiotics, Plant-Based Oils) and 6 real,
-- specifically-named ingredients for which no usable citation was found
-- despite multiple broadened searches (Mannitol, Biosaccharide Gum-4,
-- SH-Polypeptide-121, Oligopeptide-68, Dipeptide Diaminobutyroyl Benzylamide
-- Diacetate, Sodium Acetylated Hyaluronate).
--
-- Track B: 7 more new ingredients researched and added from
-- INGREDIENT_EXPANSION_CANDIDATES.md (Baicalin, Hexylresorcinol, Bearberry
-- Extract, Mulberry Extract, Bemotrizinol, Ensulizole, Hydroxypinacolone
-- Retinoate). Hexylresorcinol and Hydroxypinacolone Retinoate in particular
-- carry real human clinical-trial evidence (a double-blind RCT vs
-- hydroquinone, and two real clinical studies respectively). Several more
-- candidates were searched and returned no usable citation this round
-- (Camellia Oil, sh-Oligopeptide-1, Schisandra Extract -- too vague a match
-- to confirm, Sodium Lauroyl Sarcosinate, Bisoctrizole, Ethylhexylglycerin,
-- Polysorbate 20 -- searches only surfaced data on the different compound
-- Polysorbate 80) and were left unprocessed rather than forced.
--
-- 11 new ingredients total this firing (below the 25+ target again, same
-- recurring pattern as firings 2-4) -- a heavier-than-usual demand queue
-- (19 rows, requiring several duplicate/rejection judgment calls) plus a
-- genuinely low hit-rate among untried candidates consumed the full
-- research budget. No refresh-rotation budget was spent (same situation as
-- every prior firing) -- still fully untouched and should be prioritized
-- whenever a future firing has a lighter demand-queue/candidate-research
-- load.

-- ============================================================
-- Part 1: 11 new ingredient identity + content rows
-- ============================================================

INSERT INTO public.ingredients (
  slug, inci_name, common_name, category, description, function_summary,
  evidence_level, irritancy_risk, source_url, source_type, source_date,
  verification_status, confidence, last_verified_at
) VALUES
(
  'ectoine', 'Ectoine', NULL, 'repair-technology',
  'An extremolyte compound produced by extremophile microorganisms, used in skin-repair and barrier-support formulations, including post-procedure recovery products.',
  'According to PubMed, a 2025 controlled clinical trial examined the influence of ectoine on skin parameters damaged by CO2 laser treatment, finding that increasing ectoine content and application frequency reduced redness, with the best-performing preparation raising moisture levels and reducing transepidermal water loss (TEWL fell from 6.2 to 5.3 g/(m2*h)) when applied twice daily (DOI: https://doi.org/10.3390/molecules30112470).',
  'moderate', 'low',
  'https://doi.org/10.3390/molecules30112470', 'peer_reviewed_literature', '2025-06-05',
  'partially_verified', 'medium', now()
),
(
  'rice-bran-extract', 'Oryza Sativa Bran Extract', 'Rice Bran Extract', 'brightening',
  'A rice-processing byproduct extract rich in anthocyanins and phenolic compounds, studied for skin brightening and antioxidant properties, distinct from the already-catalogued fermented rice-ferment-filtrate.',
  'According to PubMed, a 2023 in-vitro study of purple glutinous rice bran and husk extracts found the defatted rice bran extract was the most effective inhibitor of mushroom tyrosinase and intracellular melanin production among the extracts tested, showing a whitening effect comparable to the standard brightening agent arbutin, and also significantly inhibited collagen degradation against MMP-2 (DOI: https://doi.org/10.3390/plants12040970). A separate 2020 study optimizing anthocyanin extraction from red rice bran found real antioxidant (DPPH and superoxide-anion scavenging) and tyrosinase-inhibitory activity, though weaker than the vitamin C standard used for comparison (DOI: https://doi.org/10.1002/fsn3.1371).',
  'moderate', 'low',
  'https://doi.org/10.3390/plants12040970', 'peer_reviewed_literature', '2023-02-20',
  'partially_verified', 'medium', now()
),
(
  'palmitoyl-tripeptide-8', 'Palmitoyl Tripeptide-8', NULL, 'peptide',
  'A signal peptide used in anti-aging and skin-brightening formulations, distinct from the already-catalogued Palmitoyl Tripeptide-1.',
  'According to PubMed, a 2025 in-vitro study found that a dermofunctional base containing palmitoyl tripeptide-8 (alongside bisabolol, hyaluronic acid and functional oils) reduced pro-inflammatory mediators and matrix-degrading enzymes while increasing reparative cytokines in a human keratinocyte-fibroblast co-culture model relevant to acne and rosacea (DOI: https://doi.org/10.3390/cimb48010054). A separate 2025 study conjugated palmitoyl tripeptide-8 to liposomes to target the melanocortin 1 receptor (MC1R) on melanocytes, improving the skin-whitening delivery of the active glabridin; both studies tested palmitoyl tripeptide-8 as part of a combination formulation or delivery system rather than as a standalone active (DOI: https://doi.org/10.1016/j.colsurfb.2025.114979).',
  'limited', 'low',
  'https://doi.org/10.3390/cimb48010054', 'peer_reviewed_literature', '2025-12-31',
  'partially_verified', 'medium', now()
),
(
  'camellia-sinensis-seed-extract', 'Camellia Sinensis Seed Extract', 'Green Tea Seed / Tea Seed Saponin', 'sebum-regulator',
  'A saponin-rich extract from green tea (Camellia sinensis) seed meal, studied for regulating sebum overproduction, distinct from the already-catalogued leaf-derived Green Tea Extract and EGCG.',
  'According to PubMed, two 2025 studies found that saponins extracted from tea seed meal significantly reduced lipid accumulation in human sebaceous gland cells (SZ95 sebocytes) induced by cortisone or linoleic acid, acting through the 11beta-HSD1/SREBP-1 and AMPK/mTOR signalling pathways respectively, and also attenuated TNF-alpha-stimulated inflammatory cytokine production in keratinocytes (DOI: https://doi.org/10.3390/molecules30193844 and DOI: https://doi.org/10.1111/jocd.16793). Both studies are real in-vitro mechanistic work on human cell lines; no human clinical trial of the extract was found.',
  'moderate', 'low',
  'https://doi.org/10.3390/molecules30193844', 'peer_reviewed_literature', '2025-09-23',
  'partially_verified', 'medium', now()
),
(
  'baicalin', 'Baicalin', NULL, 'antioxidant',
  'A flavonoid extracted from the root of Scutellaria baicalensis, studied for anti-inflammatory effects on skin, including in inflammatory skin conditions.',
  'According to PubMed, a 2023 study found that topical application of baicalin reduced erythema, scaling and epidermal thickness in a mouse model of imiquimod-induced psoriasis-like skin inflammation, decreasing levels of the inflammatory cytokines IL-17A, IL-22, IL-23 and TNF via the IL-17/IL-23 axis (DOI: https://doi.org/10.1055/a-0622-8242). A separate 2023 study found topical baicalin combined with echinacoside ameliorated psoriatic skin lesions in the same mouse model by suppressing TNF and VEGF signalling pathways (DOI: https://doi.org/10.1021/acsomega.3c04281). Both are real preclinical (mouse model) studies; no human clinical trial was found.',
  'moderate', 'low',
  'https://doi.org/10.1055/a-0622-8242', 'peer_reviewed_literature', '2018-05-15',
  'partially_verified', 'medium', now()
),
(
  'hexylresorcinol', 'Hexylresorcinol', NULL, 'brightening',
  'A tyrosinase-inhibiting brightening agent with antioxidant properties, used as a gentler alternative to hydroquinone for treating dyspigmentation.',
  'According to PubMed, a prospective, randomized, double-blind split-body clinical trial in 32 participants found topical 1% hexylresorcinol was equally effective as 2% hydroquinone at reducing facial and hand pigmentation over 12 weeks, with no adverse effects noted for either treatment (DOI: https://doi.org/10.1007/s00403-022-02514-0). A separate double-blind clinical study found a multi-mechanism skin-brightening formulation containing hexylresorcinol (among other actives including niacinamide and retinol) produced statistically significant reductions in UV-induced hyperpigmentation, outperforming 4% hydroquinone cream on brightness measurements (https://pubmed.ncbi.nlm.nih.gov/23545928/ -- no DOI listed for this article in PubMed).',
  'strong', 'low',
  'https://doi.org/10.1007/s00403-022-02514-0', 'peer_reviewed_literature', '2022-12-11',
  'partially_verified', 'medium', now()
),
(
  'bearberry-extract', 'Arctostaphylos Uva-Ursi Leaf Extract', 'Bearberry Extract', 'brightening',
  'A botanical extract from the bearberry plant, the natural source of arbutin, studied for its tyrosinase-inhibiting and skin-brightening properties.',
  'According to PubMed, a 1996 study testing ethanol extracts from six Arctostaphylos (bearberry family) plant leaves found two species showed potent inhibition of tyrosinase and melanin biosynthesis, along with superoxide-dismutase-like antioxidant activity and moderate UV-B absorbance, suggesting these bearberry-relative leaves could serve as a skin-whitening agent (DOI: https://doi.org/10.1248/bpb.19.153). This is an older, in-vitro-only study; no human clinical trial of bearberry extract itself was found, though its active compound arbutin is separately well documented in the existing arbutin/alpha-arbutin catalogue entries.',
  'limited', 'low',
  'https://doi.org/10.1248/bpb.19.153', 'peer_reviewed_literature', '1996-01-01',
  'partially_verified', 'medium', now()
),
(
  'mulberry-extract', 'Morus Alba Root Extract', 'Mulberry Extract', 'brightening',
  'A botanical extract from mulberry root, traditionally used in Asian skincare and studied for tyrosinase-inhibiting, skin-brightening properties.',
  'According to PubMed, a 2021 in-vitro study isolated five mulberrosides (stilbene glycosides) from Morus alba L. and found several inhibited tyrosinase activity more potently than the reference compound kojic acid, with the most active mulberroside showing an IC50 roughly six times lower (more potent) than kojic acid (DOI: https://doi.org/10.1002/cbdv.202100740). This is a real in-vitro mechanistic study of isolated mulberry compounds; no human clinical trial of the whole-extract product was found.',
  'limited', 'low',
  'https://doi.org/10.1002/cbdv.202100740', 'peer_reviewed_literature', '2021-12-06',
  'partially_verified', 'medium', now()
),
(
  'bemotrizinol', 'Bemotrizinol', NULL, 'uv-filter',
  'A broad-spectrum chemical UV filter used in sunscreens, approved in the EU and other markets and under FDA review for the US OTC sunscreen monograph.',
  'According to PubMed, a 2023 clinical pharmacokinetic study conducted to support an FDA Generally Recognized as Safe and Effective (GRASE) determination found that maximal topical application of a 6% bemotrizinol sunscreen formulation rarely exceeded the FDA-defined systemic absorption threshold, showed no evidence of drug accumulation, and produced only one moderate and a few mild adverse events in an open-label trial, supporting the ingredient''s safety for sunscreen use at that concentration (DOI: https://doi.org/10.1016/j.yrtph.2023.105344).',
  'moderate', 'low',
  'https://doi.org/10.1016/j.yrtph.2023.105344', 'peer_reviewed_literature', '2023-02-03',
  'partially_verified', 'medium', now()
),
(
  'ensulizole', 'Ensulizole', 'Phenylbenzimidazole Sulfonic Acid', 'uv-filter',
  'A water-soluble chemical UVB filter used in sunscreens.',
  'According to PubMed, a 2025 case-control study measuring UV filters in follicular fluid found ensulizole was one of four UV filters present at significantly higher concentrations in women with diminished ovarian reserve compared to healthy controls, among a broader finding that cumulative UV-filter exposure correlated with reduced ovarian-reserve biomarkers -- a real systemic-exposure safety signal rather than a skin-specific efficacy or irritancy finding, and the study examined overall UV-filter body burden rather than isolating ensulizole''s individual contribution (DOI: https://doi.org/10.1016/j.envint.2025.109573).',
  'limited', 'low',
  'https://doi.org/10.1016/j.envint.2025.109573', 'peer_reviewed_literature', '2025-05-31',
  'partially_verified', 'medium', now()
),
(
  'hydroxypinacolone-retinoate', 'Hydroxypinacolone Retinoate', 'HPR', 'retinoid',
  'A retinoid ester that binds retinoic acid receptors without requiring metabolic conversion, marketed as a lower-irritation alternative to retinol, particularly for sensitive or Asian skin.',
  'According to PubMed, a 2026 clinical study found a serum combining retinol, hydroxypinacolone retinoate (HPR), peptides and silybin significantly improved wrinkles, elasticity, hydration, barrier function and pigmentation in an 8-week trial in middle-aged Chinese women with mild photoaging, with excellent tolerability (DOI: https://doi.org/10.1111/jocd.70627). A separate clinical study found a combination of HPR and retinyl propionate (ratio 5:9) improved skin wrinkles, smoothness, TEWL and elasticity over 8 weeks in 42 Chinese women with little to no adverse effect, compared to a markedly higher adverse-effect rate for retinol alone at the same concentration in a 33-subject patch test (DOI: https://doi.org/10.1111/jocd.15662).',
  'moderate', 'low',
  'https://doi.org/10.1111/jocd.70627', 'peer_reviewed_literature', '2026-01-01',
  'partially_verified', 'medium', now()
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Part 2: ingredient_sources rows (multi-citation support)
-- ============================================================

INSERT INTO public.ingredient_sources (
  ingredient_id, source_url, source_title, publisher, source_type,
  publication_date, evidence_level, evidence_summary
)
SELECT i.id, v.source_url, v.source_title, v.publisher, v.source_type::data_source_type,
       v.publication_date::date, v.evidence_level::evidence_level, v.evidence_summary
FROM (VALUES
  ('ectoine', 'https://doi.org/10.3390/molecules30112470', 'The Influence of Ectoine on the Skin Parameters Damaged by a CO2 Laser', 'Molecules', 'peer_reviewed_literature', '2025-06-05', 'moderate', 'Controlled clinical trial; ectoine reduced redness, increased moisturization, reduced TEWL after CO2 laser treatment.'),
  ('rice-bran-extract', 'https://doi.org/10.3390/plants12040970', 'Natural Melanogenesis Inhibitor, Antioxidant, and Collagen Biosynthesis Stimulator of Phytochemicals in Rice Bran and Husk Extracts from Purple Glutinous Rice', 'Plants (Basel)', 'peer_reviewed_literature', '2023-02-20', 'moderate', 'In-vitro study; defatted rice bran extract showed whitening effect comparable to arbutin, inhibited collagen degradation.'),
  ('rice-bran-extract', 'https://doi.org/10.1002/fsn3.1371', 'Optimization of ultrasound-assisted extraction by response surface methodology, antioxidant capacity, and tyrosinase inhibitory activity of anthocyanins from red rice bran', 'Food Science & Nutrition', 'peer_reviewed_literature', '2020-01-05', 'limited', 'Real antioxidant and tyrosinase-inhibitory activity measured, weaker than vitamin C standard.'),
  ('palmitoyl-tripeptide-8', 'https://doi.org/10.3390/cimb48010054', 'Dermofunctional Vehicle Downregulates LL-37 and MMPs and Upregulates IGFBP-3', 'Current Issues in Molecular Biology', 'peer_reviewed_literature', '2025-12-31', 'limited', 'In-vitro co-culture study; dermofunctional base containing palmitoyl tripeptide-8 showed anti-inflammatory, matrix-protective effects relevant to acne/rosacea.'),
  ('palmitoyl-tripeptide-8', 'https://doi.org/10.1016/j.colsurfb.2025.114979', 'Glabridin-encapsulated liposomes targeting melanocytes through the melanocortin 1 receptor', 'Colloids and Surfaces B: Biointerfaces', 'peer_reviewed_literature', '2025-07-24', 'limited', 'Palmitoyl tripeptide-8 used as MC1R-targeting ligand on liposomes to enhance glabridin skin-whitening delivery.'),
  ('camellia-sinensis-seed-extract', 'https://doi.org/10.3390/molecules30193844', 'Saponin from Tea Seed Meal Attenuates Cortisol-Induced Lipogenesis and Inflammation in Human Cells', 'Molecules', 'peer_reviewed_literature', '2025-09-23', 'moderate', 'In-vitro sebocyte/keratinocyte study; tea seed saponin reduced sebum overproduction and inflammatory cytokines via 11beta-HSD1 pathway.'),
  ('camellia-sinensis-seed-extract', 'https://doi.org/10.1111/jocd.16793', 'Tea (Camellia sinensis) Seed Saponins Act as Sebosuppression Agents via the AMPK/mTOR Pathway', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-01-01', 'moderate', 'In-vitro sebocyte study; tea seed saponins reduced lipid accumulation via AMPK/mTOR pathway activation.'),
  ('baicalin', 'https://doi.org/10.1055/a-0622-8242', 'Baicalin Ameliorates Imiquimod-Induced Psoriasis-Like Inflammation in Mice', 'Planta Medica', 'peer_reviewed_literature', '2018-05-15', 'moderate', 'Mouse model; topical baicalin reduced psoriasis-like inflammation via IL-17/IL-23 axis.'),
  ('baicalin', 'https://doi.org/10.1021/acsomega.3c04281', 'Topical Application of Baicalin Combined with Echinacoside Ameliorates Psoriatic Skin Lesions', 'ACS Omega', 'peer_reviewed_literature', '2023-10-16', 'moderate', 'Mouse model; baicalin+echinacoside ameliorated psoriatic skin lesions via TNF and VEGF signalling suppression.'),
  ('hexylresorcinol', 'https://doi.org/10.1007/s00403-022-02514-0', 'Prospective, randomized, double-blind clinical study of split-body comparison of topical hydroquinone and hexylresorcinol for skin pigment appearance', 'Archives of Dermatological Research', 'peer_reviewed_literature', '2022-12-11', 'strong', 'RCT; 1% hexylresorcinol equally effective as 2% hydroquinone for reducing pigmentation over 12 weeks.'),
  ('hexylresorcinol', 'https://pubmed.ncbi.nlm.nih.gov/23545928/', 'Evaluation of a hydroquinone-free skin brightening product using in vitro inhibition of melanogenesis and clinical reduction of ultraviolet-induced hyperpigmentation', 'Journal of Drugs in Dermatology', 'peer_reviewed_literature', '2013-03-01', 'moderate', 'Double-blind clinical study; multi-mechanism brightening formula containing hexylresorcinol outperformed 4% hydroquinone.'),
  ('bearberry-extract', 'https://doi.org/10.1248/bpb.19.153', 'Studies of cuticle drugs from natural sources. IV. Inhibitory effects of some Arctostaphylos plants on melanin biosynthesis', 'Biological & Pharmaceutical Bulletin', 'peer_reviewed_literature', '1996-01-01', 'limited', 'In-vitro study; two Arctostaphylos species potently inhibited tyrosinase/melanin biosynthesis.'),
  ('mulberry-extract', 'https://doi.org/10.1002/cbdv.202100740', 'Highly Potent Inhibition of Tyrosinase by Mulberrosides and the Inhibitory Mechanism in Vitro', 'Chemistry & Biodiversity', 'peer_reviewed_literature', '2021-12-06', 'limited', 'In-vitro study; mulberrosides from Morus alba inhibited tyrosinase more potently than kojic acid.'),
  ('bemotrizinol', 'https://doi.org/10.1016/j.yrtph.2023.105344', 'Preliminary clinical pharmacokinetic evaluation of bemotrizinol - A new sunscreen active ingredient being considered for inclusion under FDA''s OTC sunscreen monograph', 'Regulatory Toxicology and Pharmacology', 'peer_reviewed_literature', '2023-02-03', 'moderate', 'Clinical PK study supporting FDA GRASE determination for 6% bemotrizinol; minimal systemic absorption, good tolerability.'),
  ('ensulizole', 'https://doi.org/10.1016/j.envint.2025.109573', 'Elevated follicular fluid concentrations of ultraviolet filters associated with diminished ovarian reserve: A case-control study', 'Environment International', 'peer_reviewed_literature', '2025-05-31', 'limited', 'Case-control study; ensulizole among UV filters found at elevated levels in women with diminished ovarian reserve.'),
  ('hydroxypinacolone-retinoate', 'https://doi.org/10.1111/jocd.70627', 'An Innovative Serum With Retinol, Hydroxypinacolone Retinoate, Peptides, and Silybin Improves Mild Photoaged Facial Skin in Middle-Aged Chinese Women', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-01-01', 'moderate', 'Clinical study; combination serum with HPR improved wrinkles, elasticity, hydration, pigmentation with good tolerability.'),
  ('hydroxypinacolone-retinoate', 'https://doi.org/10.1111/jocd.15662', 'The synergistic effect of retinyl propionate and hydroxypinacolone retinoate on skin aging', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2023-02-10', 'moderate', 'Clinical study; HPR+retinyl propionate combination improved skin aging measures with far less irritation than retinol alone.')
) AS v(candidate_slug, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- ============================================================
-- Part 3: drain the demand-driven queue (19 pending rows)
-- ============================================================

-- New ingredients published this firing
UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'ectoine'), resolved_at = now()
WHERE id = 'f01a323d-dfaf-46cb-9e42-de02cabbfe1b'; -- Ectoin

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'rice-bran-extract'), resolved_at = now()
WHERE id = '90820cd3-8891-4aa9-9b02-fca01e8491c5'; -- Rice extract

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'palmitoyl-tripeptide-8'), resolved_at = now()
WHERE id = 'a1f7c6a7-17e0-40a2-90e9-f2dda329f7b8'; -- Palmitoyl Tripeptide-8

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'camellia-sinensis-seed-extract'), resolved_at = now()
WHERE id = '6315aafa-fbc4-49df-bbd7-a5b73c03ad05'; -- Green Tea Seed

-- Duplicates of already-published ingredients
UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '10fc8958-0d28-4034-8e02-71e30c472930', resolved_at = now()
WHERE id = 'efc0b7c2-6e22-4ed0-8675-37b5b980d78d'; -- Hamamelis virginiana (Witch Hazel) Leaf Extract -> witch-hazel

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '2c76c897-b398-41bc-99a8-57215475d346', resolved_at = now()
WHERE id = '25178553-3f58-4560-8dad-f0f7f1fc6ff0'; -- Botanical Trehalose -> trehalose

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = 'd54e282a-2d69-4364-bf12-0eceae125f3f', resolved_at = now()
WHERE id = 'cc326892-9d28-41a1-b416-b26cdc493408'; -- Bulbine -> bulbine-frutescens

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '328366f9-627e-453d-9c22-d0b87551843a', resolved_at = now()
WHERE id = 'a63d14d6-a669-4bb8-b0e4-c386c4312942'; -- Saccharomyces/Rice Ferment Filtrate -> rice-ferment-filtrate

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = 'acf9424c-3b73-4240-8cea-5ab07003a5ba', resolved_at = now()
WHERE id = '70a9c7fd-2a62-4a02-ab47-6ebafa141583'; -- Sodium Hyaluronate Crosspolymer -> hyaluronic-acid-crosspolymer

-- Rejected: generic / non-ingredient phrases
UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic category term ("UVA & UVB Filters"), not a single named INCI ingredient.', resolved_at = now()
WHERE id = 'c5ba44ab-c194-40f8-93fa-282f76fba85c';

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic category term ("Sunscreen filters"), not a single named INCI ingredient.', resolved_at = now()
WHERE id = 'fe72f817-a887-4832-ab9c-c26f4cf0761c';

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("Grain-derived probiotics") describing the same product''s fermented rice ingredient already resolved separately as a duplicate of rice-ferment-filtrate.', resolved_at = now()
WHERE id = 'f1b13d16-2050-4589-a482-f6f96ce6ebf6';

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic category term ("Plant-Based Oils"), not a single named INCI ingredient.', resolved_at = now()
WHERE id = '2892f752-535f-47f5-a7bc-38d2ea50b3f2';

-- Rejected: real, specifically-named ingredients with no usable citation found this round
UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Real ingredient, but PubMed searches (multiple query variants) returned only tangential mentions (mannitol used as a lab-reagent ROS scavenger, a cerebral-edema comparator, and a cryoprotectant in an unrelated formulation study) -- no usable citation on mannitol as a skincare active was found.', resolved_at = now()
WHERE id = '6c43d02c-05a9-4a83-8488-0b13cf20ff2f'; -- Mannitol

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Real trade-named ingredient (marketed as "Fucogel"), but repeated PubMed searches for biosaccharide gum / fucose-rich polysaccharide skincare literature returned zero results.', resolved_at = now()
WHERE id = 'fe582663-4809-422b-8642-0f1087629439'; -- Biosaccharide Gum-4

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Specific recombinant-peptide trade ingredient; PubMed searches for this exact name returned no genuine, on-target results.', resolved_at = now()
WHERE id = '94d2a6f5-cb30-4c59-856c-769ee8c0233e'; -- SH-Polypeptide-121

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'The only real hit for this peptide family named a different compound (KE/AED peptides), not Oligopeptide-68 specifically -- no usable citation found.', resolved_at = now()
WHERE id = '6e8f744e-2e4d-49b9-be99-77aed54b2764'; -- Oligopeptide-68

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Real snake-venom-mimetic peptide (marketed as "Syn-Ake"), but repeated PubMed searches under its full chemical name and common trade name returned zero results.', resolved_at = now()
WHERE id = '4e274bae-88ff-4bf5-80c8-a9594943f11a'; -- Dipeptide Diaminobutyroyl Benzylamide Diacetate

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Real HA derivative, but PubMed searches under several query variants returned only tangential results (N-acetyl-glucosamine, a different compound, and a general hyaluronan review with no acetylation-specific data) -- no usable citation found.', resolved_at = now()
WHERE id = '8063b113-d284-4404-8c5f-30e682ec9d71'; -- Sodium Acetylated Hyaluronate
