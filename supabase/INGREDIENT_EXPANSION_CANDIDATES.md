# Ingredient Expansion Candidates

Living, append-only candidate list for growing the `ingredients` catalogue
past its current 128 rows. This is **not** a one-time list — per the
permanent weekly pipeline (see `INGREDIENT_CONTENT_STATUS.md`), when the
unprocessed candidates below run low, the next firing researches and
appends a fresh batch here (same dedupe discipline as below) before
continuing, so growth never silently stalls.

## Dedupe methodology

Every candidate below was checked against the live catalogue
(`select lower(inci_name), category from ingredients` — 128 rows as of
2026-09-21) and `ingredient_aliases` (13 rows) before being added. The
existing catalogue is dominated by generic/category-collective stub names
from the original bulk seed (e.g. "botanical extracts", "plant oil blend",
"uv filters", "vitamin complex") alongside a real core of specific INCI
actives (retinol, niacinamide, bakuchiol, ascorbic acid, hyaluronic acid,
ceramides, etc.) — candidates here are all **specific, real, individually
well-documented INCI ingredients**, chosen to be distinguishable from both
the generic stubs and the already-catalogued specific actives.

Two new category values are introduced here (`preservative`, `chelator`)
because a genuine cluster of real candidates doesn't fit any of the 16
existing values (`antioxidant, barrier-lipid, brightening, cleansing-base,
exfoliant-aha, exfoliant-bha, exfoliant-enzyme, humectant, peptide,
probiotic, repair-technology, retinoid, retinoid-alternative,
sebum-regulator, soothing-botanical, uv-filter`) — preservation and
chelation are structurally different ingredient functions from anything
already represented, and matter for the Ingredient Combination Checker
(e.g. EDTA chelation interactions, preservative-system compatibility).

## Status legend

`[ ]` not yet processed · `[~]` identity row created, content enrichment pending · `[x]` fully enriched (Phase 3 procedure complete)

---

## Humectant

- [x] Betaine — Betaine — humectant — osmolyte/water-binding compound, often beet-derived, compatible with skin's natural moisturizing factors
- [x] Sodium PCA — Sodium PCA — humectant — a natural moisturizing factor component, strong water-binding capacity
- [x] Trehalose — Trehalose — humectant — disaccharide with documented water-retention and stress-protectant properties for skin cells
- [ ] Propanediol — Propanediol — humectant — 1,3-propanediol, plant-derived humectant/solvent increasingly used in place of propylene glycol
- [ ] Inulin — Inulin — humectant — plant-derived polysaccharide (often chicory root) with film-forming/humectant properties
- [ ] Xylitylglucoside — Xylitylglucoside — humectant — part of the "aquaxyl" moisturizing complex family, supports skin hydration
- [ ] Glycereth-26 — Glycereth-26 — humectant — polyethylene glycol ether of glycerin, humectant/emulsifier
- [x] Urea — Urea — humectant — natural moisturizing factor component, also mild keratolytic at higher concentrations
- [ ] Sodium Lactate — Sodium Lactate — humectant — natural moisturizing factor component, pH-adjusting humectant
- [ ] Saccharide Isomerate — Saccharide Isomerate — humectant — plant-sugar-derived humectant studied for sustained hydration
- [ ] Mel Extract (Honey) — Mel — humectant — long-used natural humectant with documented moisture-retention properties
- [ ] Pentylene Glycol — Pentylene Glycol — humectant — humectant/solvent, also mild preservative-boosting co-ingredient
- [ ] Chlorella Vulgaris Extract — Algae Extract — humectant — algae-derived extract used for hydration/conditioning claims

## Exfoliant — AHA / PHA

- [x] Malic Acid — Malic Acid — exfoliant-aha — fruit-derived AHA, often used alongside glycolic/lactic acid in blends
- [ ] Tartaric Acid — Tartaric Acid — exfoliant-aha — grape-derived AHA
- [x] Citric Acid — Citric Acid — exfoliant-aha — commonly used as both a pH adjuster and mild AHA exfoliant
- [x] Gluconolactone — Gluconolactone — exfoliant-aha — polyhydroxy acid (PHA), gentler exfoliation profile than classic AHAs, also humectant
- [ ] Lactobionic Acid — Lactobionic Acid — exfoliant-aha — polyhydroxy acid (PHA) with antioxidant and humectant properties

## Exfoliant — BHA

- [ ] Betaine Salicylate — Betaine Salicylate — exfoliant-bha — salicylic-acid-derived BHA marketed as a gentler alternative

## Exfoliant — Enzyme

- [x] Papain — Papain — exfoliant-enzyme — proteolytic enzyme from papaya, used for enzymatic exfoliation
- [ ] Bromelain — Bromelain — exfoliant-enzyme — proteolytic enzyme from pineapple, used for enzymatic exfoliation
- [ ] Pumpkin Enzyme — Cucurbita Pepo (Pumpkin) Fruit Ferment Extract — exfoliant-enzyme — fruit-enzyme exfoliant, popular in gentle at-home peels

## Antioxidant

- [x] Resveratrol — Resveratrol — antioxidant — polyphenol antioxidant, often paired with ferulic acid/vitamin E in serums
- [ ] Astaxanthin — Astaxanthin — antioxidant — carotenoid antioxidant derived from algae
- [x] Alpha Lipoic Acid — Thioctic Acid — antioxidant — both water- and fat-soluble antioxidant
- [ ] Idebenone — Idebenone — antioxidant — synthetic antioxidant related to CoQ10
- [ ] Ergothioneine — Ergothioneine — antioxidant — amino-acid-derived antioxidant, naturally occurring in fungi
- [ ] Glutathione — Glutathione — antioxidant — tripeptide antioxidant, also marketed for skin brightening
- [ ] Epigallocatechin Gallate (EGCG) — EGCG / Green Tea Catechins — antioxidant — the primary active catechin in green tea extract, distinct entry from the existing generic "green tea extract" row
- [ ] Quercetin — Quercetin — antioxidant — flavonoid antioxidant
- [ ] Grape Seed Extract — Vitis Vinifera Seed Extract — antioxidant — proanthocyanidin-rich antioxidant botanical
- [ ] Sea Buckthorn Oil — Hippophae Rhamnoides Fruit Oil — antioxidant — carotenoid- and omega-7-rich oil, dual antioxidant/barrier function
- [ ] Rosemary Extract — Rosmarinus Officinalis Leaf Extract — antioxidant — polyphenol antioxidant, also used as a natural preservative booster
- [ ] Beta Carotene — Beta Carotene — antioxidant — carotenoid antioxidant/pigment
- [ ] Lycopene — Lycopene — antioxidant — carotenoid antioxidant, often tomato-derived
- [ ] Superoxide Dismutase — Superoxide Dismutase (SOD) — antioxidant — enzymatic antioxidant studied for oxidative-stress protection
- [ ] Schisandra Extract — Schisandra Chinensis Fruit Extract — antioxidant — adaptogenic botanical with antioxidant evidence
- [ ] Baicalin — Scutellaria Baicalensis Root Extract — antioxidant — flavonoid antioxidant, also studied for soothing properties
- [ ] Edelweiss Extract — Leontopodium Alpinum Extract — antioxidant — alpine-botanical antioxidant used in high-altitude-stress skincare positioning

## Retinoid

- [ ] Hydroxypinacolone Retinoate — Hydroxypinacolone Retinoate (HPR) — retinoid — "retinoid ester" that binds retinoic acid receptors without requiring conversion, marketed as lower-irritation
- [ ] Retinyl Retinoate — Retinyl Retinoate — retinoid — hybrid retinyl-ester/retinoic-acid-ester form, marketed as a stabilized retinoid option

## Retinoid Alternative

- [ ] Rambutan Extract — Nephelium Lappaceum Peel Extract — retinoid-alternative — botanical marketed as a plant-based retinol-alternative active, distinct from bakuchiol
- [ ] Bidens Pilosa Extract — Bidens Pilosa Extract — retinoid-alternative — botanical studied for retinol-like skin-renewal marketing claims

## Peptide

- [ ] Palmitoyl Tripeptide-1 — Palmitoyl Tripeptide-1 — peptide — signal peptide, part of the widely studied "Matrixyl" family
- [ ] Palmitoyl Pentapeptide-4 — Palmitoyl Pentapeptide-4 — peptide — signal peptide (Matrixyl 3000 component), collagen-signaling claims
- [ ] Acetyl Octapeptide-3 — Acetyl Octapeptide-3 (SNAP-8-type) — peptide — neurotransmitter-inhibiting "Botox-like" peptide
- [ ] Palmitoyl Tetrapeptide-7 — Palmitoyl Tetrapeptide-7 — peptide — signal peptide targeting inflammation/collagen pathways
- [ ] sh-Oligopeptide-1 — sh-Oligopeptide-1 (EGF) — peptide — recombinant epidermal growth factor analogue
- [ ] Palmitoyl Hexapeptide-12 — Palmitoyl Hexapeptide-12 — peptide — signal peptide marketed for firmness/collagen-signaling claims
- [ ] Nonapeptide-1 — Nonapeptide-1 (Melitane-type) — peptide — peptide marketed for pigmentation-related signaling
- [ ] Pentapeptide-18 — Pentapeptide-18 (Leuphasyl-type) — peptide — neurotransmitter-modulating peptide, "Botox-like" positioning distinct from Acetyl Octapeptide-3
- [ ] Diaminobutyroyl Benzylamide Diacetate — Diaminobutyroyl Benzylamide Diacetate (Syn-Ake-type) — peptide — snake-venom-mimetic peptide marketed for expression-line claims

## Barrier / Lipid

- [ ] Linoleic Acid — Linoleic Acid — barrier-lipid — essential omega-6 fatty acid, key structural lipid for barrier ceramide synthesis
- [ ] Oleic Acid — Oleic Acid — barrier-lipid — omega-9 fatty acid, common in plant oils
- [ ] Phytosphingosine — Phytosphingosine — barrier-lipid — a ceramide precursor/component, barrier repair
- [ ] Dimethicone — Dimethicone — barrier-lipid — silicone-based occlusive, forms a breathable barrier film
- [ ] Petrolatum — Petrolatum — barrier-lipid — classic, extensively studied occlusive barrier agent
- [ ] Meadowfoam Seed Oil — Limnanthes Alba Seed Oil — barrier-lipid — highly oxidative-stable emollient oil
- [ ] Sunflower Seed Oil — Helianthus Annuus Seed Oil — barrier-lipid — linoleic-acid-rich emollient, studied for barrier support
- [ ] Evening Primrose Oil — Oenothera Biennis Oil — barrier-lipid — gamma-linolenic-acid-rich emollient oil
- [ ] Squalene — Squalene — barrier-lipid — plant/olive-derived precursor to squalane, distinct entry from the existing hydrogenated "squalane" row
- [ ] Cetyl Alcohol — Cetyl Alcohol — barrier-lipid — fatty alcohol emollient/emulsion-stabilizer
- [ ] Glyceryl Stearate — Glyceryl Stearate — barrier-lipid — emollient/emulsifier derived from glycerin and stearic acid
- [ ] Caprylic/Capric Triglyceride — Caprylic/Capric Triglyceride — barrier-lipid — lightweight, non-comedogenic emollient ester
- [ ] Cocoa Butter — Theobroma Cacao Seed Butter — barrier-lipid — occlusive plant butter, long-used emollient
- [ ] Mango Butter — Mangifera Indica Seed Butter — barrier-lipid — occlusive plant butter emollient
- [ ] Macadamia Oil — Macadamia Ternifolia Seed Oil — barrier-lipid — palmitoleic-acid-rich emollient oil
- [ ] Camellia Oil — Camellia Oleifera Seed Oil — barrier-lipid — oleic-acid-rich emollient oil, traditionally used in East Asian skincare

## Brightening

- [x] Azelaic Acid — Azelaic Acid — brightening — dicarboxylic acid, dual brightening/anti-inflammatory/anti-acne evidence base
- [ ] 4-Butylresorcinol — 4-Butylresorcinol — brightening — tyrosinase-inhibiting brightening agent
- [ ] Phenylethyl Resorcinol — Phenylethyl Resorcinol — brightening — tyrosinase-inhibiting brightening agent (marketed as "Symwhite")
- [ ] Mulberry Extract — Morus Alba Root Extract — brightening — botanical tyrosinase inhibitor
- [ ] Bearberry Extract — Arctostaphylos Uva-Ursi Leaf Extract — brightening — natural source of arbutin, tyrosinase-inhibiting botanical
- [ ] Ethyl Ascorbic Acid — 3-O-Ethyl Ascorbic Acid — brightening — stable vitamin C derivative, distinct entry from the existing ascorbic acid/L-ascorbic acid rows
- [ ] Magnesium Ascorbyl Phosphate — Magnesium Ascorbyl Phosphate — brightening — stable, water-soluble vitamin C derivative
- [ ] Ascorbyl Glucoside — Ascorbyl Glucoside — brightening — stable vitamin C derivative that converts to ascorbic acid on the skin
- [ ] Hexylresorcinol — Hexylresorcinol — brightening — tyrosinase-inhibiting brightening agent, also antioxidant properties

## Sebum Regulator

- [ ] Sulfur — Sulfur — sebum-regulator — long-used keratolytic/sebum-regulating agent for acne-prone skin
- [ ] Bentonite Clay — Bentonite (Montmorillonite) — sebum-regulator — oil-absorbing clay commonly used in masks for oily/acne-prone skin
- [ ] Sebacic Acid — Sebacic Acid — sebum-regulator — dicarboxylic acid studied alongside azelaic acid for sebum-related concerns

## Soothing Botanical

- [ ] Bisabolol — Alpha-Bisabolol — soothing-botanical — chamomile-derived anti-inflammatory/soothing compound
- [x] Allantoin — Allantoin — soothing-botanical — soothing, skin-conditioning agent with long clinical usage history
- [ ] Colloidal Oatmeal — Avena Sativa (Oat) Kernel Flour — soothing-botanical — FDA-recognized skin-protectant, distinct from the existing "oat bran extract" row
- [ ] Madecassoside — Madecassoside — soothing-botanical — Centella asiatica-derived triterpene, soothing/barrier-repair evidence
- [ ] Beta-Glucan — Beta-Glucan (Oat or Yeast-derived) — soothing-botanical — soothing, barrier-supportive polysaccharide
- [ ] Feverfew Extract — Tanacetum Parthenium Extract — soothing-botanical — anti-inflammatory botanical extract
- [ ] Chamomile Extract — Chamomilla Recutita (Matricaria) Flower Extract — soothing-botanical — classic soothing botanical, source of bisabolol
- [ ] Tea Tree Oil — Melaleuca Alternifolia Leaf Oil — soothing-botanical — antimicrobial/soothing essential oil, well-studied for acne-prone skin use
- [ ] Willowherb Extract — Epilobium Angustifolium Extract — soothing-botanical — anti-inflammatory botanical, often used in sensitive-skin formulations
- [ ] Marshmallow Root Extract — Althaea Officinalis Root Extract — soothing-botanical — mucilage-rich soothing botanical
- [ ] Houttuynia Cordata Extract — Houttuynia Cordata Extract — soothing-botanical — botanical popular in Korean skincare for soothing/calming claims

## Probiotic

- [ ] Bifida Ferment Lysate — Bifida Ferment Lysate — probiotic — fermented probiotic-derived ingredient studied for barrier/microbiome support
- [ ] Lactobacillus Ferment — Lactobacillus Ferment — probiotic — fermented ingredient studied for skin microbiome support
- [ ] Saccharomyces Ferment — Saccharomyces Ferment — probiotic — yeast-fermentation-derived ingredient studied for skin-conditioning claims
- [ ] Lactococcus Ferment Lysate — Lactococcus Ferment Lysate — probiotic — fermented ingredient studied for barrier/microbiome support

## UV Filter

- [ ] Avobenzone — Avobenzone — uv-filter — broad-spectrum chemical UVA filter
- [ ] Octocrylene — Octocrylene — uv-filter — chemical UV filter, also used to stabilize avobenzone
- [ ] Homosalate — Homosalate — uv-filter — chemical UVB filter
- [ ] Titanium Dioxide — Titanium Dioxide — uv-filter — mineral UV filter, distinct from the existing zinc oxide row
- [ ] Bemotrizinol — Bemotrizinol (Tinosorb S) — uv-filter — broad-spectrum chemical UV filter, approved in EU/other markets, not FDA-approved in the US
- [ ] Octisalate — Octisalate (Octyl Salicylate) — uv-filter — chemical UVB filter
- [ ] Ensulizole — Ensulizole (Phenylbenzimidazole Sulfonic Acid) — uv-filter — water-soluble chemical UVB filter
- [ ] Bisoctrizole — Bisoctrizole (Tinosorb M) — uv-filter — broad-spectrum organic/inorganic hybrid UV filter, approved in EU/other markets

## Cleansing Base

- [ ] Sodium Cocoyl Isethionate — Sodium Cocoyl Isethionate — cleansing-base — mild, coconut-derived surfactant common in "syndet" bars
- [ ] Decyl Glucoside — Decyl Glucoside — cleansing-base — mild, sugar-derived non-ionic surfactant
- [ ] Cocamidopropyl Betaine — Cocamidopropyl Betaine — cleansing-base — widely used amphoteric surfactant, foam booster
- [ ] Sodium Lauroyl Sarcosinate — Sodium Lauroyl Sarcosinate — cleansing-base — mild anionic surfactant used in gentle cleansers
- [ ] Lauryl Glucoside — Lauryl Glucoside — cleansing-base — sugar-derived non-ionic surfactant
- [ ] Disodium Cocoamphodiacetate — Disodium Cocoamphodiacetate — cleansing-base — mild amphoteric surfactant used in baby/sensitive-skin cleansers
- [ ] Polysorbate 20 — Polysorbate 20 — cleansing-base — non-ionic surfactant/solubilizer used in micellar and cleansing formulas

## Repair Technology

- [ ] Ectoin — Ectoin — repair-technology — extremolyte compound studied for cell-protectant/osmolyte properties under environmental stress

## Preservative (new category)

- [ ] Phenoxyethanol — Phenoxyethanol — preservative — one of the most widely used cosmetic preservatives, extensive safety review history
- [ ] Potassium Sorbate — Potassium Sorbate — preservative — commonly used preservative, often paired with other systems
- [ ] Sodium Benzoate — Sodium Benzoate — preservative — commonly used preservative
- [ ] Ethylhexylglycerin — Ethylhexylglycerin — preservative — preservative-booster/deodorizing co-ingredient, also mild emollient
- [ ] Benzyl Alcohol — Benzyl Alcohol — preservative — widely used preservative, also functions as a solvent/fragrance ingredient
- [ ] Caprylyl Glycol — Caprylyl Glycol — preservative — preservative-booster and humectant co-ingredient
- [ ] Sodium Dehydroacetate — Sodium Dehydroacetate — preservative — broad-spectrum preservative, often paired with benzyl alcohol
- [ ] Chlorphenesin — Chlorphenesin — preservative — preservative with additional antimicrobial/anti-irritant claims

## Chelator (new category)

- [ ] Disodium EDTA — Disodium EDTA — chelator — chelating agent that binds trace metal ions to stabilize formulations
- [ ] Sodium Phytate — Sodium Phytate — chelator — plant-derived (phytic acid salt) chelating agent, natural alternative to EDTA
- [ ] Tetrasodium EDTA — Tetrasodium EDTA — chelator — higher-substitution EDTA salt, same chelating function as disodium EDTA
- [ ] Trisodium Ethylenediamine Disuccinate — Trisodium Ethylenediamine Disuccinate (EDDS) — chelator — biodegradable EDTA alternative chelating agent

---

**Running total added from this list**: 12 / 123 processed (2026-09-22, Track B
batch 01 — see `INGREDIENT_CONTENT_STATUS.md` for the live cursor and full batch
log). This first batch of 123 real candidates comfortably covers the
122-ingredient expansion milestone and will be supplemented by further append
rounds (same research/dedupe discipline) as weekly firings consume it,
continuing indefinitely thereafter.
