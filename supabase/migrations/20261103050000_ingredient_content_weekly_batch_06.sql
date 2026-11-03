-- Weekly Ingredients Intelligence pipeline, firing 6 (2026-11-03).
--
-- Demand queue this firing had 21 pending rows (requested 2026-10-27 through
-- 2026-11-02): 7 real, specific ingredients researched and published (PDRN,
-- Chicory Extract, UVMune 400/MCE, Sea Salt, Asiaticoside, Madecassic Acid,
-- Asiatic Acid), 5 resolved as duplicates of already-published ingredients
-- (Grass-Fed Beef Tallow -> tallow, Kaolin -> kaolin-clay, Olive Squalane ->
-- squalane, Jeju Green Tea -> green-tea-extract, Centella Asiatica Extract ->
-- centella-asiatica), and 9 rejected -- 6 generic/non-ingredient phrases
-- (African ingredients, Natural ingredients, UVA Filters, UVB Filters, Rich
-- Emollient Base, Body Butter Formulation) and 3 real, specifically-named
-- ingredients for which no usable citation was found despite multiple
-- broadened searches (Rose Geranium Oil, Poppy Seed, Birch Juice -- the only
-- literature found for birch concerned bark/betulin, a different plant part
-- and preparation from the sap/juice actually used in the referenced
-- product).
--
-- Asiaticoside, Madecassic Acid and Asiatic Acid are the three other major
-- Centella asiatica triterpenes (alongside the already-catalogued
-- Madecassoside) -- real, distinct compounds with their own substantial
-- literature, not duplicates of the existing centella-asiatica or
-- madecassoside rows.
--
-- Track B: 15 more new ingredients researched and added from
-- INGREDIENT_EXPANSION_CANDIDATES.md (Xylitylglucoside, Chlorella Vulgaris
-- Extract, Betaine Salicylate, Edelweiss Extract, Retinyl Retinoate,
-- Rambutan Extract, Houttuynia Cordata Extract, Palmitoyl Hexapeptide-12,
-- Pentapeptide-18, Sodium Cocoyl Isethionate, Lauryl Glucoside, Tetrasodium
-- EDTA, Sodium Dehydroacetate, Disodium Cocoamphodiacetate, Saccharomyces
-- Ferment). Retinyl Retinoate carries real double-blind RCT evidence.
-- Several candidates were searched and returned no usable citation this
-- round (Pumpkin Enzyme, Bidens Pilosa Extract, Ethyl Ascorbic Acid,
-- Willowherb Extract, Sodium Phytate, Glycereth-26, Lactococcus Ferment
-- Lysate) and were left unprocessed rather than forced.
--
-- 22 new ingredients total this firing -- the closest to the 25+ target of
-- any firing so far, though still slightly under it; a genuinely heavy
-- demand queue (21 rows) plus the Track B research pass consumed the full
-- budget. No refresh-rotation budget was spent (same situation as every
-- prior firing) -- still fully untouched and should be prioritized whenever
-- a future firing has a lighter demand-queue/candidate-research load.
--
-- Honest findings worth flagging per this project's "report negative
-- findings" discipline: UVMune 400/MCE has a real 2026 case report of
-- allergic contact sensitization alongside its strong efficacy data
-- (irritancy_risk raised to moderate); Sodium Dehydroacetate's real hazard
-- review found a margin of safety below the generally accepted threshold of
-- 100 under a worst-case full-dermal-absorption scenario; Lauryl Glucoside's
-- real patch-test literature found a real, if uncommon (~2%), contact-
-- allergy rate; Rambutan Extract was consistently the least potent of three
-- fruit-peel extracts tested side by side in its one real citation; the Dead
-- Sea salt literature used for Sea Salt concerns magnesium-rich balneotherapy
-- soaking specifically, not a brief scrub-and-rinse exposure to generic sea
-- salt granules, a distinction disclosed in its profile.

-- ============================================================
-- Part 1: 22 new ingredient identity + content rows
-- ============================================================

INSERT INTO public.ingredients (
  slug, inci_name, common_name, category, description, function_summary,
  evidence_level, irritancy_risk, source_url, source_type, source_date,
  verification_status, confidence, last_verified_at
) VALUES
(
  'pdrn', 'Polydeoxyribonucleotide', 'PDRN', 'repair-technology',
  'A biopolymer derived from salmon or trout DNA, used in regenerative skincare for its tissue-repair and anti-inflammatory signalling properties, most commonly delivered via microneedling or injectable "skin booster" procedures rather than passive topical application.',
  'According to PubMed, a 2021 review found PDRN promotes wound healing by activating adenosine A2A receptors, encouraging cell migration, growth and angiogenesis while reducing inflammation across in vitro, in vivo and clinical studies (DOI: https://doi.org/10.3390/ph14111103). A separate 2023 mechanistic study found PDRN increased collagen accumulation and reduced inflammatory cytokine expression in human skin fibroblasts and keratinocytes via differing effects on ERK signalling in each cell type (DOI: https://doi.org/10.3892/mmr.2023.13035). A 2022 animal-model study found a topical PDRN, vitamin C and niacinamide formulation delivered via microneedling reduced UV-induced pigmentation and increased skin elasticity (DOI: https://doi.org/10.3390/molecules27041276). Most PDRN skin literature involves microneedling or injectable delivery rather than a passive leave-on topical, which should temper expectations for PDRN in a standard moisturiser or serum.',
  'moderate', 'low',
  'https://doi.org/10.3390/ph14111103', 'peer_reviewed_literature', '2021-10-29',
  'partially_verified', 'medium', now()
),
(
  'chicory-extract', 'Cichorium Intybus Root Extract', 'Chicory Extract', 'soothing-botanical',
  'A root extract from chicory (Cichorium intybus), studied as a "vitamin D-like" active for supporting skin barrier function and reducing transepidermal water loss.',
  'According to PubMed, a 2016 randomized controlled trial in 50 women aged 45-60 found that a cosmetic formulation containing Cichorium intybus root extract, applied twice daily for 28 days, decreased transepidermal water loss (TEWL) and improved skin microrelief compared to vehicle and control areas, supporting its use as a skin barrier-function ingredient (DOI: https://doi.org/10.1080/09546634.2016.1178695).',
  'moderate', 'low',
  'https://doi.org/10.1080/09546634.2016.1178695', 'peer_reviewed_literature', '2016-05-10',
  'partially_verified', 'medium', now()
),
(
  'methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate', 'Methoxypropylamino Cyclohexenylidene Ethoxyethylcyanoacetate', 'MCE (UVMune 400 / Mexoryl 400)', 'uv-filter',
  'A UVA1 (370-400nm) sunscreen filter developed to close the photoprotection gap left by conventional UV filters, which absorb only up to about 370nm; approved by the EU Scientific Committee on Consumer Safety and marketed under trade names including Mexoryl 400 and UVMune 400.',
  'According to PubMed, a 2021 in vitro and randomized controlled trial (ClinicalTrials.gov NCT04865094) found sunscreens enriched with MCE extended UV absorption up to 400nm and reduced UVA1-induced dermal and epidermal alterations and pigmentation compared to reference sunscreens (DOI: https://doi.org/10.1016/j.xjidi.2021.100070). Two further outdoor randomized intra-individual comparative trials, in 113 Brazilian and Chinese women (2023) and 52 Brazilian women (2025), found sunscreens with added MCE significantly reduced sun-induced pigmentation, wrinkles and other facial ageing signs compared to the same sunscreen without MCE (DOI: https://doi.org/10.1111/jdv.19486 and DOI: https://doi.org/10.1111/phpp.13020). A 2026 case report also documented allergic contact sensitization to MCE (reported under the trade name Mexoryl 400) alongside other UV filters, a real safety signal worth disclosing alongside its efficacy data (DOI: https://doi.org/10.1111/cod.70244).',
  'strong', 'moderate',
  'https://doi.org/10.1016/j.xjidi.2021.100070', 'peer_reviewed_literature', '2021-11-25',
  'partially_verified', 'medium', now()
),
(
  'sea-salt', 'Maris Sal', 'Sea Salt', 'mineral',
  'A mineral-rich salt (primarily sodium chloride, with magnesium and other trace minerals depending on source) used as a physical exfoliant in soaps and scrubs, and separately studied in balneotherapy for its skin barrier and anti-inflammatory effects; most of the available clinical evidence concerns magnesium-rich Dead Sea salt specifically rather than generic table or sea salt, a distinction worth keeping in mind.',
  'According to PubMed, a 2005 controlled clinical trial found bathing in a 5% magnesium-rich Dead Sea salt solution significantly improved skin barrier function, enhanced stratum corneum hydration and reduced skin roughness and redness in subjects with atopic dry skin, compared to a tap-water control (DOI: https://doi.org/10.1111/j.1365-4632.2005.02079.x). A 2019 systematic review of bathing additives for atopic dermatitis found Dead Sea salt has anti-inflammatory, antimicrobial, antioxidative and skin-barrier-repair properties (DOI: https://doi.org/10.1097/DER.0000000000000459). These studies specifically concern Dead Sea salt bathing/soaking rather than a brief scrub-and-rinse exposure to generic sea salt granules, so the strength of the evidence for a quick-contact exfoliating use (as in a bar soap) is more limited than for the balneotherapy use it was actually studied for.',
  'moderate', 'moderate',
  'https://doi.org/10.1111/j.1365-4632.2005.02079.x', 'peer_reviewed_literature', '2005-02-01',
  'partially_verified', 'medium', now()
),
(
  'madecassic-acid', 'Madecassic Acid', NULL, 'soothing-botanical',
  'One of the four major pentacyclic triterpenes isolated from Centella asiatica (alongside asiaticoside, madecassoside and asiatic acid), studied for anti-inflammatory, antioxidant and wound-healing properties; distinct from the already-catalogued glycoside madecassoside, of which madecassic acid is the aglycone (non-sugar) form.',
  'According to PubMed, a 2014 review of Centella asiatica in dermatology identifies madecassic acid as one of its main active triterpenes in wound-healing research (DOI: https://doi.org/10.1002/ptr.5110). A 2023 review of asiaticoside and madecassoside notes their corresponding aglycones, asiatic acid and madecassic acid, as the plant''s major bioactive constituents, with reported anti-inflammatory, antioxidant and wound-healing activity (DOI: https://doi.org/10.1111/jcmm.17635). A 2024 comparative study specifically testing all four Centella triterpenes side by side found madecassic acid reduced UVB-induced reactive oxygen species and improved cell viability in human skin fibroblasts, though asiatic acid showed the strongest overall effect of the four (DOI: https://doi.org/10.3390/antiox13040483).',
  'moderate', 'low',
  'https://doi.org/10.1002/ptr.5110', 'peer_reviewed_literature', '2014-01-07',
  'partially_verified', 'medium', now()
),
(
  'asiaticoside', 'Asiaticoside', NULL, 'soothing-botanical',
  'The major glycoside triterpene of Centella asiatica, widely studied for wound-healing, scar-reduction and skin-cell-migration effects; distinct from its aglycone, asiatic acid.',
  'According to PubMed, a 2016 study found porous microspheres loaded with asiaticoside significantly improved its cellular uptake and accelerated wound healing, re-epithelization and collagen synthesis in a rat full-skin wound model (DOI: https://doi.org/10.1016/j.ejpb.2016.09.005). A 2012 in vitro study found asiaticoside increased the migration, adhesion and proliferation of normal human skin cells relevant to wound healing (DOI: https://doi.org/10.1016/j.phymed.2012.08.002). More recent 2024-2025 studies have incorporated asiaticoside nanoparticles into wound-dressing hydrogels, finding accelerated healing and reduced scar formation in rat models (DOI: https://doi.org/10.1016/j.ijbiomac.2024.134424 and DOI: https://doi.org/10.1021/acsami.5c13677). The available evidence is predominantly preclinical (animal and cell-culture models); no dedicated human clinical trial of topical asiaticoside alone was found in this search.',
  'moderate', 'low',
  'https://doi.org/10.1016/j.phymed.2012.08.002', 'peer_reviewed_literature', '2012-08-30',
  'partially_verified', 'medium', now()
),
(
  'asiatic-acid', 'Asiatic Acid', NULL, 'soothing-botanical',
  'The aglycone (non-sugar) form of asiaticoside and a major bioactive triterpene of Centella asiatica, studied for antioxidant, anti-photoaging and wound-healing/anti-scarring effects.',
  'According to PubMed, a 2023 review on Centella asiatica and its metabolite asiatic acid describes its role in promoting fibroblast proliferation, collagen synthesis and cutaneous wound repair (DOI: https://doi.org/10.3390/metabo13020276). A 2019 study found a bioavailable asiatic acid-glucosamine salt alleviated UVB-induced photoaging in human dermal fibroblasts and nude mouse skin, reducing reactive oxygen species and matrix metalloproteinase expression while restoring collagen content (DOI: https://doi.org/10.1111/php.13160). A 2024 comparative study of Centella''s four major triterpenes found asiatic acid was the most potent of the four at protecting human skin fibroblasts from UVB-induced oxidative stress and at inhibiting UVB-induced collagen-degrading matrix metalloproteinases (DOI: https://doi.org/10.3390/antiox13040483). A 2026 study delivered asiatic acid nanoparticles via dissolving microneedles, finding reduced scar thickness and normalized collagen architecture in a rabbit hypertrophic-scar model (DOI: https://doi.org/10.1186/s12951-025-03946-2).',
  'moderate', 'low',
  'https://doi.org/10.3390/metabo13020276', 'peer_reviewed_literature', '2023-02-14',
  'partially_verified', 'medium', now()
),
(
  'xylitylglucoside', 'Xylitylglucoside', NULL, 'humectant',
  'A plant-sugar-derived humectant, typically formulated together with anhydroxylitol and xylitol as part of a moisturizing complex (marketed as "Aquaxyl"), studied for improving skin microrelief and hydration.',
  'According to PubMed, a 2022 study using a novel portable 3D skin-imaging camera found that a cream containing the xylitylglucoside-anhydroxylitol-xylitol complex reduced skin roughness amplitude and the height and area of skin surface plateaus 8 hours after a single application in 18 subjects, outperforming creams containing urea or saccharide isomerate alone on some of these measures (DOI: https://doi.org/10.1111/srt.13190). This study tested the three-ingredient complex together rather than isolated xylitylglucoside alone.',
  'moderate', 'low',
  'https://doi.org/10.1111/srt.13190', 'peer_reviewed_literature', '2022-12-20',
  'partially_verified', 'medium', now()
),
(
  'chlorella-vulgaris-extract', 'Chlorella Vulgaris Extract', 'Chlorella Extract', 'soothing-botanical',
  'An extract from the single-cell green microalga Chlorella vulgaris, studied for skin-repair signalling and as a marine ingredient for sensitive-skin cosmetic formulations.',
  'According to PubMed, a 2026 in vitro study found Chlorella vulgaris extract enhanced migration and proliferation of human keratinocytes and upregulated skin-barrier markers (aquaporin-3, filaggrin) in a wound-remodeling cell model, with biocompatibility confirmed via hemolysis and chick chorioallantoic membrane assays, through a proposed TGF-beta1/mTOR signalling mechanism (DOI: https://doi.org/10.3390/cimb48101067). A 2021 review of marine ingredients in facial cosmetics for sensitive skin names Chlorella vulgaris extract among the few marine microalgae ingredients with real clinical evidence supporting anti-inflammatory and barrier-function benefits for sensitive skin (DOI: https://doi.org/10.3390/md19080464).',
  'moderate', 'low',
  'https://doi.org/10.3390/cimb48101067', 'peer_reviewed_literature', '2026-10-15',
  'partially_verified', 'medium', now()
),
(
  'betaine-salicylate', 'Betaine Salicylate', NULL, 'exfoliant-bha',
  'A cocrystal/salt combining betaine and salicylic acid, marketed as a gentler alternative to standalone salicylic acid for exfoliating and acne-related skincare.',
  'According to PubMed, a 2025 study characterizing a betaine-salicylic acid (BeSA) cocrystal found it had significantly lower irritancy and cytotoxicity than salicylic acid alone, while retaining strong anti-inflammatory, antioxidant, moisturizing and anti-acne efficacy in testing (DOI: https://doi.org/10.1039/d5md00001g). This is the only dedicated study of this specific cocrystal form found in this search; broader standalone-ingredient human efficacy data is limited.',
  'limited', 'low',
  'https://doi.org/10.1039/d5md00001g', 'peer_reviewed_literature', '2025-02-27',
  'partially_verified', 'medium', now()
),
(
  'edelweiss-extract', 'Leontopodium Alpinum Extract', 'Edelweiss Extract', 'antioxidant',
  'An extract from edelweiss (Leontopodium alpinum), an alpine wildflower, often produced via callus (tissue) culture due to the plant''s protected status in many countries; studied for antioxidant and anti-aging effects.',
  'According to PubMed, a 2020 study combining in vitro, ex vivo, in vivo and transcriptome analyses found edelweiss callus culture extract showed strong antioxidant activity against UVB-induced damage, suppressed inflammation and wrinkling, increased moisturizing activity, and a clinical test found constant application improved periorbital wrinkles, skin elasticity, dermal density and skin thickness compared with placebo (DOI: https://doi.org/10.3390/genes11020230). A 2021 phytochemical study confirmed strong free-radical-scavenging activity in edelweiss callus culture extracts via UPLC/IM-HRMS analysis (DOI: https://doi.org/10.3390/plants11010100).',
  'moderate', 'low',
  'https://doi.org/10.3390/genes11020230', 'peer_reviewed_literature', '2020-02-21',
  'partially_verified', 'medium', now()
),
(
  'retinyl-retinoate', 'Retinyl Retinoate', NULL, 'retinoid',
  'A hybrid, synthetic retinoid ester (combining retinyl ester and retinoic acid ester chemistry), designed to reduce the irritation of retinoic acid and improve the stability of retinol.',
  'According to PubMed, a 2011 double-blind, randomized controlled trial in 11 Korean women found 0.06% retinyl retinoate cream, applied for 12 weeks, significantly improved facial wrinkle depth and area, outperforming a 0.075% retinol cream by 22% on visual wrinkle improvement (DOI: https://doi.org/10.1111/j.1600-0846.2011.00512.x). A separate 2011 clinical study using a biodegradable-polymer microsphere formulation of retinyl retinoate found statistically significant facial wrinkle improvement after just 4 weeks in 20 volunteers, with the microsphere delivery outperforming plain retinyl retinoate cream (DOI: https://doi.org/10.1111/j.1600-0846.2011.00533.x).',
  'strong', 'low',
  'https://doi.org/10.1111/j.1600-0846.2011.00512.x', 'peer_reviewed_literature', '2011-03-22',
  'partially_verified', 'medium', now()
),
(
  'rambutan-extract', 'Nephelium Lappaceum Peel Extract', 'Rambutan Extract', 'antioxidant',
  'An extract from the peel of rambutan (Nephelium lappaceum), a Southeast Asian fruit, studied alongside litchi and tamarind peel/seed extracts for anti-aging skincare use as a way to valorise fruit-processing waste.',
  'According to PubMed, a 2017 in vitro study found rambutan peel extract had real superoxide radical-scavenging, elastase- and collagenase-inhibiting, and tyrosinase-inhibiting activity, was safe on human skin fibroblasts, and inhibited MMP-2; however, of the three fruit-residue extracts tested side by side, rambutan was consistently the least potent of the three on most measures, with litchi peel extract showing the strongest effects (DOI: https://doi.org/10.1590/0001-3765201720160849).',
  'limited', 'low',
  'https://doi.org/10.1590/0001-3765201720160849', 'peer_reviewed_literature', '2017-05-22',
  'partially_verified', 'medium', now()
),
(
  'houttuynia-cordata-extract', 'Houttuynia Cordata Extract', NULL, 'soothing-botanical',
  'An extract from Houttuynia cordata, a plant used in traditional Japanese and Chinese medicine as an herbal tea and poultice for skin and other conditions, studied for anti-inflammatory and antimicrobial effects relevant to calming/soothing skincare.',
  'According to PubMed, a 2025 study found Houttuynia cordata polysaccharides reduced epidermal thickness, skin lesions, mast cell infiltration and inflammatory cytokines while restoring skin barrier proteins and lipid balance in a mouse model of atopic dermatitis (DOI: https://doi.org/10.1016/j.ijbiomac.2025.144264). A 2016 study of a traditional Houttuynia cordata poultice extract found real antibacterial and anti-biofilm effects against oral pathogens and anti-inflammatory effects on human oral epithelial cells, without cytotoxicity, supporting the plant''s traditional use for treating purulent (infected) skin conditions via poultice application (DOI: https://doi.org/10.1155/2016/2581876).',
  'moderate', 'low',
  'https://doi.org/10.1016/j.ijbiomac.2025.144264', 'peer_reviewed_literature', '2025-05-18',
  'partially_verified', 'medium', now()
),
(
  'palmitoyl-hexapeptide-12', 'Palmitoyl Hexapeptide-12', NULL, 'peptide',
  'A signal peptide marketed for firmness and collagen-signalling anti-aging claims; palmitoylated to improve skin penetration.',
  'According to PubMed, a 2026 safety-evaluation framework study testing bioinformatic screening tools on cosmetic peptides found palmitoyl hexapeptide-12 showed sequence homology with extracellular matrix proteins in skin (collagen, elastin, fibronectin) without flagging any toxin or allergen safety concerns, unlike several other tested peptides (DOI: https://doi.org/10.1016/j.crtox.2026.100291). This is a safety-screening study, not a clinical efficacy trial; no dedicated human efficacy RCT for this specific peptide was found in this search.',
  'limited', 'low',
  'https://doi.org/10.1016/j.crtox.2026.100291', 'peer_reviewed_literature', '2026-03-20',
  'partially_verified', 'medium', now()
),
(
  'pentapeptide-18', 'Pentapeptide-18', 'Leuphasyl', 'peptide',
  'A neuromodulatory ("Botox-like") peptide marketed under the trade name Leuphasyl, studied for reducing expression-line wrinkles by inhibiting neurotransmitter release at the neuromuscular junction, distinct from Acetyl Octapeptide-3.',
  'According to PubMed, a 2026 computational and spectroscopic study used molecular docking and dynamics simulations to characterize Pentapeptide-18''s binding to several molecular pathways implicated in skin aging (TGF-beta, TNF-alpha, MAPK, PI3K/AKT, NF-kB), providing mechanistic support for its reported ability to reduce wrinkle formation and improve skin hydration, elasticity and texture (DOI: https://doi.org/10.1016/j.compbiolchem.2026.108952). This is a computational/structural characterization study rather than a human clinical trial; no dedicated RCT for this specific peptide was found in this search.',
  'limited', 'low',
  'https://doi.org/10.1016/j.compbiolchem.2026.108952', 'peer_reviewed_literature', '2026-02-18',
  'partially_verified', 'medium', now()
),
(
  'sodium-cocoyl-isethionate', 'Sodium Cocoyl Isethionate', NULL, 'cleansing-base',
  'A mild, coconut-derived anionic surfactant widely used in "syndet" (synthetic detergent) cleansing bars as a gentler alternative to soap and sodium lauryl sulfate.',
  'According to PubMed, a 1999 study comparing the skin-damaging effects of 8 surfactants found sodium cocoyl isethionate caused less irritation (erythema, transepidermal water loss) than sodium lauryl sulfate and several other tested surfactants (DOI: https://doi.org/10.1111/j.1600-0536.1999.tb05999.x). A second 1999 irritancy-ranking study using repeated exposure methods found sodium cocoyl isethionate was less irritating than sodium lauryl sulfate and soap, though more irritating than a sulfosuccinate-type anionic detergent, across repeated occlusive and open-test methods (DOI: https://doi.org/10.1111/j.1600-0536.1999.tb06082.x).',
  'moderate', 'low',
  'https://doi.org/10.1111/j.1600-0536.1999.tb05999.x', 'peer_reviewed_literature', '1999-02-01',
  'partially_verified', 'medium', now()
),
(
  'lauryl-glucoside', 'Lauryl Glucoside', NULL, 'cleansing-base',
  'A sugar-derived, non-ionic surfactant used as a mild cleansing or emulsifying agent in personal-care formulations.',
  'According to PubMed, a 2016 randomized controlled trial in 76 volunteers found creams stabilized with a natural alkyl polyglucoside emulsifier (including lauryl glucoside) caused no significant skin irritation after 24-hour occlusion and improved skin hydration without barrier impairment, supporting its use in moisturizers for normal, dry and sensitive skin (DOI: https://doi.org/10.2298/VSP150116122F). However, a 2022 retrospective patch-test study of nearly 25,000 patients by the North American Contact Dermatitis Group found 2.0% of those tested to lauryl and/or decyl glucoside had a positive, often clinically relevant, allergic reaction, most commonly linked to hair products and skin cleansers -- a real, if uncommon, allergy risk worth disclosing alongside its general mildness (DOI: https://doi.org/10.1016/j.jaad.2022.04.058).',
  'moderate', 'low',
  'https://doi.org/10.2298/VSP150116122F', 'peer_reviewed_literature', '2016-11-01',
  'partially_verified', 'medium', now()
),
(
  'tetrasodium-edta', 'Tetrasodium EDTA', NULL, 'chelator',
  'A higher-substitution sodium salt of EDTA (ethylenediaminetetraacetic acid), used as a chelating agent in cosmetic formulations to bind trace metal ions and improve product stability; the same chelating function as the already-catalogued Disodium EDTA.',
  'According to PubMed, a 2002 Cosmetic Ingredient Review (CIR) Expert Panel safety assessment of EDTA and its salts, including tetrasodium EDTA, found no absorption of an EDTA salt through intact skin in clinical tests, and concluded these ingredients are safe as used in cosmetic formulations at typical use concentrations, while noting EDTA''s chelating action can increase the skin penetration of other co-formulated ingredients (DOI: https://doi.org/10.1080/10915810290096522). A 2023 L''Oreal formulation study used EDTA (and tetrasodium EDTA''s close relative, disodium EDTA) as the benchmark metal-chelating stabilizer for retinol formulations, against which a newer, more biodegradable EDDS-based alternative was compared (DOI: https://doi.org/10.1111/ics.12853).',
  'moderate', 'low',
  'https://doi.org/10.1080/10915810290096522', 'peer_reviewed_literature', '2002-01-01',
  'partially_verified', 'medium', now()
),
(
  'sodium-dehydroacetate', 'Sodium Dehydroacetate', NULL, 'preservative',
  'The sodium salt of dehydroacetic acid, a broad-spectrum cosmetic preservative often paired with benzyl alcohol.',
  'According to PubMed, a 2021 hazard-assessment and risk-characterization study of 13 common cosmetic preservatives found sodium dehydroacetate (alongside dehydroacetic acid and ethylhexylglycerin) had a margin of safety below the generally accepted threshold of 100 under a worst-case full-dermal-absorption scenario, a real safety caveat worth disclosing rather than presenting the preservative as risk-free (DOI: https://doi.org/10.1002/jat.4156). Separately, a 2020 zebrafish toxicology study found sodium dehydroacetate exposure decreased locomotor activity and hypoxia tolerance and caused lethality at low concentrations in an aquatic model, an environmental/ecological finding rather than a human dermal safety signal (DOI: https://doi.org/10.1016/j.envres.2020.110276). No human efficacy study of its preservative performance specifically (as opposed to general safety/hazard review) was found in this search.',
  'limited', 'moderate',
  'https://doi.org/10.1002/jat.4156', 'peer_reviewed_literature', '2021-02-24',
  'partially_verified', 'medium', now()
),
(
  'disodium-cocoamphodiacetate', 'Disodium Cocoamphodiacetate', NULL, 'cleansing-base',
  'A mild, coconut-derived amphoteric surfactant commonly used in baby and sensitive-skin cleansers, often paired with harsher primary surfactants to soften their irritation potential.',
  'According to PubMed, a 2010 patch-test study of 105 patients comparing 8 common cleanser surfactants found disodium cocoamphodiacetate was among the best-tolerated, alongside two mild anionic surfactants (sodium cocoyl glutamate and sodium lauroyl oat amino acids), causing neither irritant nor allergic reactions in any of the 105 tested patients (https://pubmed.ncbi.nlm.nih.gov/20920412/ -- no DOI listed for this article in PubMed).',
  'moderate', 'low',
  'https://pubmed.ncbi.nlm.nih.gov/20920412/', 'peer_reviewed_literature', '2010-01-01',
  'partially_verified', 'medium', now()
),
(
  'saccharomyces-ferment', 'Saccharomyces Ferment', NULL, 'probiotic',
  'A yeast-fermentation-derived ingredient studied for skin-conditioning and microbiome-support claims, often combined with Lactobacillus ferment as a postbiotic complex.',
  'According to PubMed, a 2023 study found topical application of a postbiotic complex combining Himalaya-derived Lactobacillus and Saccharomyces ferments significantly shifted the scalp microbiome of women with sensitive scalp syndrome toward a healthier bacterial/fungal balance over 28 days, with 100% of participants self-reporting symptom alleviation (DOI: https://doi.org/10.2147/CCID.S415787). This study tested a combined Lactobacillus-and-Saccharomyces ferment complex rather than isolated Saccharomyces ferment alone, and covered the scalp rather than facial skin specifically.',
  'limited', 'low',
  'https://doi.org/10.2147/CCID.S415787', 'peer_reviewed_literature', '2023-09-21',
  'partially_verified', 'medium', now()
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Part 2: ingredient_sources rows (44 citations across 22 ingredients)
-- ============================================================

INSERT INTO public.ingredient_sources (
  ingredient_id, source_url, source_title, publisher, source_type,
  publication_date, evidence_level, evidence_summary
)
SELECT i.id, v.source_url, v.source_title, v.publisher, v.source_type::data_source_type,
       v.publication_date::date, v.evidence_level::evidence_level, v.evidence_summary
FROM (VALUES
  ('pdrn', 'https://doi.org/10.3390/ph14111103', 'Polydeoxyribonucleotide: A Promising Biological Platform to Accelerate Impaired Skin Wound Healing', 'Pharmaceuticals (Basel)', 'peer_reviewed_literature', '2021-10-29', 'moderate', 'Review; PDRN promotes wound healing via adenosine A2A receptor activation, cell migration/growth, angiogenesis and reduced inflammation across in vitro, in vivo and clinical studies.'),
  ('pdrn', 'https://doi.org/10.3892/mmr.2023.13035', 'Polydeoxyribonucleotide exerts opposing effects on ERK activity in human skin keratinocytes and fibroblasts', 'Molecular Medicine Reports', 'peer_reviewed_literature', '2023-06-23', 'moderate', 'In-vitro human cell study; PDRN increased collagen accumulation and reduced inflammatory cytokine expression via differing ERK signalling effects in fibroblasts vs keratinocytes.'),
  ('pdrn', 'https://doi.org/10.3390/molecules27041276', 'A Mixture of Topical Forms of Polydeoxyribonucleotide, Vitamin C, and Niacinamide Attenuated Skin Pigmentation and Increased Skin Elasticity', 'Molecules', 'peer_reviewed_literature', '2022-02-14', 'moderate', 'Animal model; PDRN+vitC+niacinamide delivered via microneedling reduced UV-induced pigmentation and increased skin elasticity.'),
  ('chicory-extract', 'https://doi.org/10.1080/09546634.2016.1178695', 'Cichorium intybus root extract: A "vitamin D-like" active ingredient to improve skin barrier function', 'Journal of Dermatological Treatment', 'peer_reviewed_literature', '2016-05-10', 'moderate', 'RCT, 50 women; chicory root extract decreased TEWL and improved skin microrelief vs vehicle/control over 28 days.'),
  ('methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate', 'https://doi.org/10.1016/j.xjidi.2021.100070', 'Sunscreens with the New MCE Filter Cover the Whole UV Spectrum', 'JID Innovations', 'peer_reviewed_literature', '2021-11-25', 'strong', 'In vitro skin model + RCT (NCT04865094); MCE extended UV absorption to 400nm, reduced UVA1-induced skin alterations and pigmentation.'),
  ('methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate', 'https://doi.org/10.1111/jdv.19486', 'The impact of MCE UVA1 filter on pigmentary and ageing signs', 'J Eur Acad Dermatol Venereol', 'peer_reviewed_literature', '2023-09-12', 'strong', 'RCT, 113 women; SPF50/MCE reduced sun-induced pigmentation and ageing signs vs SPF50 alone over 8 weeks outdoors.'),
  ('methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate', 'https://doi.org/10.1111/phpp.13020', 'Gain of Protection Afforded by the MCE UVA1 Filter on Pigmentary and Aging Signs', 'Photodermatol Photoimmunol Photomed', 'peer_reviewed_literature', '2025-01-01', 'strong', 'RCT, 52 Brazilian women; SPF50 with 1% MCE significantly reduced hyperpigmentation, redness and ageing signs vs SPF50 alone.'),
  ('methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate', 'https://doi.org/10.1111/cod.70244', 'Multiple Allergic Contact Sensitizations to UVA Sunscreen Filters Including MCE (Mexoryl 400)', 'Contact Dermatitis', 'peer_reviewed_literature', '2026-09-07', 'limited', 'Case report; documented allergic contact sensitization to MCE alongside other UV filters.'),
  ('sea-salt', 'https://doi.org/10.1111/j.1365-4632.2005.02079.x', 'Bathing in a magnesium-rich Dead Sea salt solution improves skin barrier function', 'International Journal of Dermatology', 'peer_reviewed_literature', '2005-02-01', 'moderate', 'Controlled clinical trial; Dead Sea salt bathing improved barrier function, hydration and reduced roughness/redness in atopic dry skin.'),
  ('sea-salt', 'https://doi.org/10.1097/DER.0000000000000459', 'Bathing Additives for Atopic Dermatitis - A Systematic Review', 'Dermatitis', 'peer_reviewed_literature', '2019-01-01', 'moderate', 'Systematic review; Dead Sea salt has anti-inflammatory, antimicrobial, antioxidative and barrier-repair properties as a bathing additive.'),
  ('madecassic-acid', 'https://doi.org/10.1002/ptr.5110', 'Centella asiatica in dermatology: an overview', 'Phytotherapy Research', 'peer_reviewed_literature', '2014-01-07', 'moderate', 'Review; identifies madecassic acid as one of the plant''s main active triterpenes in wound-healing research.'),
  ('madecassic-acid', 'https://doi.org/10.1111/jcmm.17635', 'Therapeutic properties and pharmacological activities of asiaticoside and madecassoside: A review', 'Journal of Cellular and Molecular Medicine', 'peer_reviewed_literature', '2023-02-08', 'moderate', 'Review; notes madecassic acid (aglycone of madecassoside) among the plant''s major bioactive constituents with anti-inflammatory/antioxidant/wound-healing activity.'),
  ('madecassic-acid', 'https://doi.org/10.3390/antiox13040483', 'Comparison of the Antioxidant Potency of Four Triterpenes of Centella asiatica against Oxidative Stress', 'Antioxidants', 'peer_reviewed_literature', '2024-04-18', 'moderate', 'Comparative in vitro study; madecassic acid reduced UVB-induced ROS and improved human fibroblast viability, though less potently than asiatic acid.'),
  ('asiaticoside', 'https://doi.org/10.1016/j.ejpb.2016.09.005', 'Porous microspheres as promising vehicles for the topical delivery of poorly soluble asiaticoside', 'European Journal of Pharmaceutics and Biopharmaceutics', 'peer_reviewed_literature', '2016-09-08', 'moderate', 'Rat wound model; asiaticoside-loaded microspheres accelerated wound healing, re-epithelization and collagen synthesis.'),
  ('asiaticoside', 'https://doi.org/10.1016/j.phymed.2012.08.002', 'Asiaticoside enhances normal human skin cell migration, attachment and growth in vitro wound healing model', 'Phytomedicine', 'peer_reviewed_literature', '2012-08-30', 'moderate', 'In vitro human skin cell study; asiaticoside increased cell migration, adhesion and proliferation relevant to wound healing.'),
  ('asiaticoside', 'https://doi.org/10.1016/j.ijbiomac.2024.134424', 'Accelerated, injectable, self-healing, scarless wound dressings using rGO reinforced hydrogels incorporated with PDA-loaded asiaticoside', 'International Journal of Biological Macromolecules', 'peer_reviewed_literature', '2024-08-05', 'moderate', 'Rat wound model; asiaticoside nanoparticle hydrogel accelerated healing and minimized scarring.'),
  ('asiaticoside', 'https://doi.org/10.1021/acsami.5c13677', 'Quaternary Ammonium Chitosan Hydrogel Platform with Zinc-Enhanced Bioactivity toward Scar-Free Wound Healing', 'ACS Applied Materials & Interfaces', 'peer_reviewed_literature', '2025-09-15', 'moderate', 'In vivo wound model; asiaticoside-loaded nanoparticle hydrogel reduced wound area and limited fibrosis/scarring.'),
  ('asiatic-acid', 'https://doi.org/10.3390/metabo13020276', 'Centella asiatica and Its Metabolite Asiatic Acid: Wound Healing Effects and Therapeutic Potential', 'Metabolites', 'peer_reviewed_literature', '2023-02-14', 'moderate', 'Review; asiatic acid promotes fibroblast proliferation, collagen synthesis and cutaneous wound repair.'),
  ('asiatic-acid', 'https://doi.org/10.1111/php.13160', 'Asiatic Acid Glucosamine Salt Alleviates Ultraviolet B-induced Photoaging of Human Dermal Fibroblasts and Nude Mouse Skin', 'Photochemistry and Photobiology', 'peer_reviewed_literature', '2019-10-17', 'moderate', 'In vitro + animal model; bioavailable asiatic acid salt reduced UVB-induced ROS/MMPs and restored collagen content.'),
  ('asiatic-acid', 'https://doi.org/10.3390/antiox13040483', 'Comparison of the Antioxidant Potency of Four Triterpenes of Centella asiatica against Oxidative Stress', 'Antioxidants', 'peer_reviewed_literature', '2024-04-18', 'moderate', 'Comparative in vitro study; asiatic acid was the most potent of the four Centella triterpenes against UVB-induced oxidative stress.'),
  ('asiatic-acid', 'https://doi.org/10.1186/s12951-025-03946-2', 'Microneedle-delivered ROS-adaptive asiatic acid nanoparticles promote scarless repair', 'Journal of Nanobiotechnology', 'peer_reviewed_literature', '2026-01-24', 'moderate', 'Rabbit hypertrophic-scar model; asiatic acid microneedle delivery reduced scar thickness and normalized collagen architecture.'),
  ('xylitylglucoside', 'https://doi.org/10.1111/srt.13190', 'Evaluation of a new connected portable camera for the analysis of skin microrelief and the assessment of the effect of skin moisturisers', 'Skin Research and Technology', 'peer_reviewed_literature', '2022-12-20', 'moderate', 'Human study, 18 subjects; xylitylglucoside-anhydroxylitol-xylitol complex reduced skin roughness/plateau height after a single application.'),
  ('chlorella-vulgaris-extract', 'https://doi.org/10.3390/cimb48101067', 'Repair Effects of Chlorella Vulgaris Extract in Non-Chronic Skin Wounds During the Remodeling Phase', 'Current Issues in Molecular Biology', 'peer_reviewed_literature', '2026-10-15', 'moderate', 'In vitro keratinocyte model; extract enhanced cell migration/proliferation and upregulated barrier markers via TGF-beta1/mTOR signalling.'),
  ('chlorella-vulgaris-extract', 'https://doi.org/10.3390/md19080464', 'Marine Ingredients for Sensitive Skin: Market Overview', 'Marine Drugs', 'peer_reviewed_literature', '2021-08-17', 'moderate', 'Review; Chlorella vulgaris extract named among marine ingredients with real clinical evidence for sensitive-skin benefit.'),
  ('betaine-salicylate', 'https://doi.org/10.1039/d5md00001g', 'Betaine-salicylic acid cocrystal for enhanced skincare and acne treatment', 'RSC Medicinal Chemistry', 'peer_reviewed_literature', '2025-02-27', 'limited', 'Cocrystal characterization study; lower irritancy/cytotoxicity than salicylic acid alone with retained anti-inflammatory/anti-acne efficacy.'),
  ('edelweiss-extract', 'https://doi.org/10.3390/genes11020230', 'Anti-Aging Effects of Edelweiss Callus Culture Extract Through Transcriptome Profiling', 'Genes', 'peer_reviewed_literature', '2020-02-21', 'moderate', 'In vitro/ex vivo/in vivo + clinical test; extract showed antioxidant activity and improved periorbital wrinkles, elasticity and dermal density vs placebo.'),
  ('edelweiss-extract', 'https://doi.org/10.3390/plants11010100', 'Profiling of Polyphenolic Compounds of Leontopodium alpinum Callus Cultures Using UPLC/IM-HRMS', 'Plants', 'peer_reviewed_literature', '2021-12-29', 'limited', 'Phytochemical characterization; confirmed strong free-radical-scavenging activity in edelweiss callus extracts.'),
  ('retinyl-retinoate', 'https://doi.org/10.1111/j.1600-0846.2011.00512.x', 'Retinyl retinoate, a novel hybrid vitamin derivative, improves photoaged skin: a double-blind, randomized-controlled trial', 'Skin Research and Technology', 'peer_reviewed_literature', '2011-03-22', 'strong', 'Double-blind RCT, 11 women; retinyl retinoate cream outperformed retinol cream on facial wrinkle improvement over 12 weeks.'),
  ('retinyl-retinoate', 'https://doi.org/10.1111/j.1600-0846.2011.00533.x', 'Novel anti-wrinkle effect of cosmeceutical product with new retinyl retinoate microsphere using biodegradable polymer', 'Skin Research and Technology', 'peer_reviewed_literature', '2011-03-29', 'strong', 'Clinical trials, 44 Korean women; PLA-retinyl retinoate microsphere formulation improved facial wrinkles significantly after 4 weeks.'),
  ('rambutan-extract', 'https://doi.org/10.1590/0001-3765201720160849', 'In vitro and cellular activities of the selected fruits residues for skin aging treatment', 'Anais da Academia Brasileira de Ciencias', 'peer_reviewed_literature', '2017-05-22', 'limited', 'In vitro study; rambutan peel extract showed antioxidant/anti-elastase/anti-collagenase/anti-tyrosinase activity, least potent of three fruit extracts tested.'),
  ('houttuynia-cordata-extract', 'https://doi.org/10.1016/j.ijbiomac.2025.144264', 'Houttuynia cordata polysaccharides ameliorate atopic dermatitis in mice through modulation of skin immune barrier and lipid metabolism', 'International Journal of Biological Macromolecules', 'peer_reviewed_literature', '2025-05-18', 'moderate', 'Mouse model; HC polysaccharides reduced AD-like inflammation and restored barrier proteins and lipid balance.'),
  ('houttuynia-cordata-extract', 'https://doi.org/10.1155/2016/2581876', 'Preventive Effects of Houttuynia cordata Extract for Oral Infectious Diseases', 'BioMed Research International', 'peer_reviewed_literature', '2016-06-20', 'limited', 'In vitro/human cell study; HC poultice extract had antibacterial/antibiofilm and anti-inflammatory effects without cytotoxicity.'),
  ('palmitoyl-hexapeptide-12', 'https://doi.org/10.1016/j.crtox.2026.100291', 'A framework for the safety evaluation of peptides in cosmetics', 'Current Research in Toxicology', 'peer_reviewed_literature', '2026-03-20', 'limited', 'Bioinformatic safety screening; palmitoyl hexapeptide-12 showed ECM-protein sequence homology with no flagged toxin/allergen concerns.'),
  ('pentapeptide-18', 'https://doi.org/10.1016/j.compbiolchem.2026.108952', 'Pentapeptide-18 as an anti-aging candidate: Spectroscopic characterization and molecular interaction analysis', 'Computational Biology and Chemistry', 'peer_reviewed_literature', '2026-02-18', 'limited', 'Computational/spectroscopic study; characterized Pentapeptide-18 binding to skin-aging-related molecular pathways.'),
  ('sodium-cocoyl-isethionate', 'https://doi.org/10.1111/j.1600-0536.1999.tb05999.x', 'Biophysical characterization of skin damage and recovery after exposure to different surfactants', 'Contact Dermatitis', 'peer_reviewed_literature', '1999-02-01', 'moderate', 'Human study, 12 volunteers; sodium cocoyl isethionate caused less irritation than SLS and several other surfactants.'),
  ('sodium-cocoyl-isethionate', 'https://doi.org/10.1111/j.1600-0536.1999.tb06082.x', 'Irritancy ranking of anionic detergents using one-time occlusive, repeated occlusive and repeated open tests', 'Contact Dermatitis', 'peer_reviewed_literature', '1999-06-01', 'moderate', 'Human study; sodium cocoyl isethionate ranked less irritating than SLS and soap across repeated exposure methods.'),
  ('lauryl-glucoside', 'https://doi.org/10.2298/VSP150116122F', 'Alp Rose stem cells, olive oil squalene and a natural alkyl polyglucoside emulsifier: in vivo efficacy on normal and SLS-irritated skin', 'Vojnosanitetski Pregled', 'peer_reviewed_literature', '2016-11-01', 'moderate', 'RCT, 76 volunteers; alkyl polyglucoside (lauryl glucoside) emulsifier-stabilized creams caused no significant irritation and improved hydration.'),
  ('lauryl-glucoside', 'https://doi.org/10.1016/j.jaad.2022.04.058', 'Patch testing with glucosides: The North American Contact Dermatitis Group experience, 2009-2018', 'Journal of the American Academy of Dermatology', 'peer_reviewed_literature', '2022-05-10', 'moderate', 'Retrospective patch-test study, ~25,000 patients; 2.0% positive allergic reaction rate to lauryl/decyl glucoside.'),
  ('tetrasodium-edta', 'https://doi.org/10.1080/10915810290096522', 'Final report on the safety assessment of EDTA, calcium disodium EDTA, diammonium EDTA, dipotassium EDTA, disodium EDTA, TEA-EDTA, tetrasodium EDTA, tripotassium EDTA, trisodium EDTA, HEDTA, and trisodium HEDTA', 'International Journal of Toxicology', 'peer_reviewed_literature', '2002-01-01', 'moderate', 'CIR Expert Panel safety review; EDTA salts including tetrasodium EDTA found safe as used in cosmetics, no skin absorption.'),
  ('tetrasodium-edta', 'https://doi.org/10.1111/ics.12853', 'An eco-friendly system for stabilization of retinol', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2023-08-06', 'limited', 'Formulation study; EDTA used as the benchmark metal-chelating stabilizer compared against a newer EDDS-based alternative.'),
  ('sodium-dehydroacetate', 'https://doi.org/10.1002/jat.4156', 'Integrated approaches to testing and assessment as a tool for the hazard assessment and risk characterization of cosmetic preservatives', 'Journal of Applied Toxicology', 'peer_reviewed_literature', '2021-02-24', 'limited', 'Hazard/risk assessment; sodium dehydroacetate had a margin of safety below 100 under worst-case dermal absorption.'),
  ('sodium-dehydroacetate', 'https://doi.org/10.1016/j.envres.2020.110276', 'Sodium dehydroacetate exposure decreases locomotor persistence and hypoxia tolerance in zebrafish', 'Environmental Research', 'peer_reviewed_literature', '2020-10-23', 'limited', 'Zebrafish toxicology; DHA-S decreased locomotor activity/hypoxia tolerance and caused lethality at low concentrations (environmental, not human dermal, finding).'),
  ('disodium-cocoamphodiacetate', 'https://pubmed.ncbi.nlm.nih.gov/20920412/', 'Irritant and sensitizing potential of eight surfactants commonly used in skin cleansers: an evaluation of 105 patients', 'Dermatitis', 'peer_reviewed_literature', '2010-01-01', 'moderate', 'Human patch-test study, 105 patients; disodium cocoamphodiacetate among best-tolerated of 8 surfactants tested, no irritant or allergic reactions.'),
  ('saccharomyces-ferment', 'https://doi.org/10.2147/CCID.S415787', 'Effects of a Postbiotic Lactobacillus and Saccharomyces Ferment Complex on the Scalp Microbiome of Chinese Women with Sensitive Scalp Syndrome', 'Clinical, Cosmetic and Investigational Dermatology', 'peer_reviewed_literature', '2023-09-21', 'limited', 'Human study; postbiotic Lactobacillus+Saccharomyces ferment complex shifted scalp microbiome and alleviated sensitive scalp symptoms over 28 days.')
) AS v(candidate_slug, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- ============================================================
-- Part 3: 21 ingredient_generation_requests row updates
-- ============================================================

-- New ingredients published (7)
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'pdrn'), resolved_at = now() WHERE id = '0426c242-8800-4c29-a634-cd68d07f59f7';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'chicory-extract'), resolved_at = now() WHERE id = '6e6e8d0b-db30-4ac9-aa1a-bbcb16e82bf8';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'methoxypropylamino-cyclohexenylidene-ethoxyethylcyanoacetate'), resolved_at = now() WHERE id = 'd887dc98-24b3-42fc-bf65-7c9263060cbb';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'sea-salt'), resolved_at = now() WHERE id = '7959fb7f-2135-47a6-8330-f15150613636';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'asiaticoside'), resolved_at = now() WHERE id = '5c905630-fc3e-4491-be41-445382ea155e';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'madecassic-acid'), resolved_at = now() WHERE id = '860553b6-0d72-4a97-aabf-b7c9da310bf6';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'asiatic-acid'), resolved_at = now() WHERE id = 'c2602cb8-98a8-46ae-9e34-0415b22c384b';

-- Duplicates of already-published ingredients (5)
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = 'f49f4c2c-cf0c-4095-ad98-8d0ab579dbd5', resolved_at = now() WHERE id = '72d91f44-659f-4031-bd3e-6858ba179668';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = 'de631410-eaef-4f73-91eb-6196efc46c9f', resolved_at = now() WHERE id = 'a84c16ff-58e8-483c-b0a2-5eadfcbec400';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = '764c7dd6-39a4-450a-b43c-feb4e2d37329', resolved_at = now() WHERE id = '24e08d72-24c8-4282-848d-4e18eb4f6c81';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = 'eb64fee2-d988-418e-beb1-bf4dfc34353e', resolved_at = now() WHERE id = '4930806f-9da3-4436-bf4b-2b11e8755826';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = '61edec7f-3262-43f8-897e-5cdd3bb839b9', resolved_at = now() WHERE id = '2dd652bf-28de-40d6-a9b2-e1858d4c898a';

-- Generic/non-ingredient phrases rejected (6)
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("African ingredients"), not a specific named ingredient; no single INCI identity to research.' WHERE id = '7610d072-25bf-4982-8d83-46b5fe21ff90';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("Natural ingredients"), not a specific named ingredient; no single INCI identity to research.' WHERE id = 'd428e9ee-fa7b-44d8-a718-7e7b41e505ed';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("UVA Filters"), not a specific named ingredient; no single INCI identity to research.' WHERE id = '3c529d11-68b3-4739-b1d0-fd789c4fda28';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("UVB Filters"), not a specific named ingredient; no single INCI identity to research.' WHERE id = 'f7c74f30-d265-4c9a-8d9e-48eaed740b47';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("Rich Emollient Base"), not a specific named ingredient; no single INCI identity to research.' WHERE id = '7ea38c39-8779-498b-85a8-f9bf9988b7eb';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic phrase ("Body Butter Formulation"), not a specific named ingredient; no single INCI identity to research.' WHERE id = '5b5671a3-9c05-478e-93b9-bac11aaf8718';

-- Real-but-currently-uncitable ingredients rejected (3)
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Rose Geranium Oil (Pelargonium graveolens): PubMed searches only surfaced an EFSA animal-feed safety opinion and a generic 10-essential-oil-blend study with no rose-geranium-specific skin data -- no usable skin-specific citation found.' WHERE id = '514b35e7-5597-4774-a7b2-a512e368368b';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Poppy Seed (Papaver somniferum): the one PubMed result found concerns IgE allergy/anaphylaxis testing during anesthesia, not a skincare use; broader Papaver rhoeas (poppy flower, a different species/plant part) results are natural-dye studies, a mismatch.' WHERE id = '1e20065b-f3de-4521-8cd5-39296974b58d';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Birch Juice (Betula sap/water, as used in the referenced product): zero direct PubMed results across three search attempts (birch sap + skin, Betula pendula sap cosmetic, birch water hydration); the only birch-related citation found concerns betulin extracted from the outer bark, a different plant part and preparation from the sap, and would misattribute bark-specific allergy/chemistry data to the sap.' WHERE id = '7f4f6884-bb69-4dd5-bada-2a4388357668';
