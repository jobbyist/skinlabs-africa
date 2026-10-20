-- Weekly Ingredients Intelligence pipeline, firing 4 (2026-10-20).
--
-- Demand queue this firing was light (10 pending rows, requested 2026-10-13
-- through 2026-10-18): 4 duplicates of already-published ingredients
-- resolved (Organic Rooibos -> rooibos-extract, Kigelia Extract ->
-- kigelia-africana, Live Probiotics -> live-lactobacillus-cultures, Organic
-- Shea Butter -> shea-butter), 6 rejected as non-specific/generic (None
-- listed, Essential oils, SPF 15, Nourishing formula, Gentle cleansing
-- agents, Microbiome-Balancing Actives). No new ingredient creation was
-- needed from the demand queue this firing.
--
-- Track B: 16 new ingredients researched and added from
-- INGREDIENT_EXPANSION_CANDIDATES.md (one candidate on that list, "Mel
-- Extract (Honey)", turned out to already be live and verified under slug
-- `honey` -- confirmed via a live query before writing this migration, left
-- untouched, ticked off the candidates file as already done). Every new row
-- below carries real PubMed citations; several intentionally report
-- negative/safety findings rather than one-sided benefit claims (pentylene
-- glycol and chlorphenesin contact-allergy/irritancy data, cocamidopropyl
-- betaine and caprylic/capric triglyceride real case reports of allergic
-- contact dermatitis, homosalate's real human systemic-absorption data).
-- No refresh-rotation budget was spent this firing (demand-queue triage +
-- 16-ingredient research consumed the full session budget, same situation
-- as the three prior firings) -- the refresh rotation remains fully
-- untouched and should be prioritized by a future firing with lighter
-- demand-queue/candidate-research load.

-- ============================================================
-- Part 1: 16 new ingredient identity + content rows
-- ============================================================

INSERT INTO public.ingredients (
  slug, inci_name, common_name, category, description, function_summary,
  evidence_level, irritancy_risk, source_url, source_type, source_date,
  verification_status, confidence, last_verified_at
) VALUES
(
  'pentylene-glycol', 'Pentylene Glycol', '1,2-Pentanediol', 'humectant',
  'A humectant and solvent, also used to help stabilize and boost preservative systems in cosmetic formulations.',
  'According to PubMed, a 2026 retrospective patch-test study at Antwerp University Hospital found pentylene glycol allergy in 6.74% of patients tested with it, with concomitant propylene glycol reactions in most of those cases -- a real contact-allergy signal that runs against its marketing as a gentle propylene-glycol alternative (DOI: https://doi.org/10.1111/cod.70211). Separately, pentylene glycol (as 1,2-pentanediol) has been studied as a cosmetically-approved component of surfactant-free microemulsions for delivering actives such as alpha-arbutin through the skin (DOI: https://doi.org/10.1021/acs.langmuir.4c00382).',
  'moderate', 'moderate',
  'https://doi.org/10.1111/cod.70211', 'peer_reviewed_literature', '2026-06-30',
  'partially_verified', 'medium', now()
),
(
  'lycopene', 'Lycopene', NULL, 'antioxidant',
  'A red carotenoid pigment and antioxidant, naturally found in tomatoes, studied (mostly as part of carotenoid groups and oral supplements) for skin photoprotection.',
  'According to PubMed, a 2025 review on carotenoids in skin photoaging groups lycopene with beta-carotene, astaxanthin, lutein and zeaxanthin as antioxidants that scavenge reactive oxygen species and modulate oxidative-stress signalling pathways (MAPK, Nrf2, NF-kB), noting both oral and topical administration have shown benefit for photoaging in various studies (DOI: https://doi.org/10.3390/antiox14050577). Most human clinical evidence specifically involving lycopene comes from oral multi-ingredient antioxidant supplements rather than a standalone topical lycopene product, so direct topical efficacy data for lycopene alone is thinner than for the carotenoid class as a whole.',
  'limited', 'low',
  'https://doi.org/10.3390/antiox14050577', 'peer_reviewed_literature', '2025-05-11',
  'partially_verified', 'medium', now()
),
(
  'palmitoyl-pentapeptide-4', 'Palmitoyl Pentapeptide-4', 'Matrixyl 3000 component', 'peptide',
  'A signal peptide from the widely used "Matrixyl" peptide family, marketed to support collagen signalling and reduce the visible appearance of wrinkles.',
  'According to PubMed, a 2025 study developed a glycyrrhizic-acid-based ionic-liquid nanomicelle delivery system to improve skin permeation of palmitoyl pentapeptide-4 (PAL-4), finding that in cellular and animal photoaging models the delivered peptide boosted collagen and hyaluronic acid regeneration, reduced inflammation and apoptosis, and lessened skin wrinkles while improving elasticity (DOI: https://doi.org/10.1002/advs.202412581). This is real but preclinical (cell- and animal-model) evidence centered on a delivery-system innovation rather than a human clinical trial of the peptide alone.',
  'limited', 'low',
  'https://doi.org/10.1002/advs.202412581', 'peer_reviewed_literature', '2025-01-09',
  'partially_verified', 'medium', now()
),
(
  'acetyl-octapeptide-3', 'Acetyl Octapeptide-3', 'Argireline-type peptide', 'peptide',
  'A neurotransmitter-release-inhibiting peptide marketed with a "Botox-like" relaxing effect on expression lines, most often formulated into eye-area and anti-wrinkle products.',
  'According to PubMed, a 2024 clinical study of a dissolving microneedle patch containing acetyl octapeptide-3 (alongside L-ascorbic acid 2-glucoside and other actives) found the treated group showed effective improvement of eye wrinkles, reduced transepidermal water loss, and enhanced skin elasticity and lifting with no adverse effects over 28 days, versus a placebo patch (DOI: https://doi.org/10.5021/ad.23.136). A separate 2019 monocentric clinical trial of hyaluronic-acid microneedle patches containing acetyl octapeptide-3 plus several other bioactive peptides found a 25.8% decrease in fine lines/wrinkles and improved hydration, density and thickness over 12 weeks (DOI: https://doi.org/10.1111/jocd.13009). Both studies tested acetyl octapeptide-3 only as part of a multi-ingredient formulation, not as a standalone active, so its individual contribution cannot be isolated from these results.',
  'moderate', 'low',
  'https://doi.org/10.5021/ad.23.136', 'peer_reviewed_literature', '2024-08-01',
  'partially_verified', 'medium', now()
),
(
  'sunflower-seed-oil', 'Helianthus Annuus Seed Oil', 'Sunflower Seed Oil', 'barrier-lipid',
  'A linoleic-acid-rich plant oil used as a barrier-supportive emollient, well studied in both cosmetic and clinical dermatology contexts, including for infant and malnourished-child skin care.',
  'According to PubMed, a 2025 randomized controlled trial in 212 Bangladeshi children with severe acute malnutrition found that adjunctive topical sunflower seed oil therapy improved skin barrier function and reduced infection risk, working through local cutaneous rather than systemic immune effects (DOI: https://doi.org/10.1038/s41390-025-04602-z). A 2025 narrative review further describes sunflower seed oil''s linoleic- and oleic-acid-rich composition as restoring lipid bilayer organization and ceramide synthesis, citing clinical evidence of reduced transepidermal water loss, improved hydration, and accelerated wound healing in xerosis and atopic dermatitis -- while noting oils high in oleic acid can, in some cases, compromise barrier function instead (DOI: https://doi.org/10.1007/s13346-025-01939-0).',
  'moderate', 'low',
  'https://doi.org/10.1038/s41390-025-04602-z', 'peer_reviewed_literature', '2025-12-19',
  'partially_verified', 'medium', now()
),
(
  'cetyl-alcohol', 'Cetyl Alcohol', NULL, 'barrier-lipid',
  'A fatty alcohol used as an emollient and emulsion stabilizer in creams and lotions; despite the word "alcohol" in its name, it is a waxy, non-drying ingredient chemically unrelated to drying alcohols like ethanol.',
  'According to PubMed, a 2022 case series of seven patients with allergic contact dermatitis from stearyl alcohol in topical medications found that when these same patients were patch-tested with the closely related fatty alcohol cetyl alcohol, two of three also showed a positive reaction -- a real cross-reactivity/safety signal rather than an efficacy finding, since cetyl and stearyl alcohol are structurally related fatty alcohols (DOI: https://doi.org/10.1111/1346-8138.16325).',
  'limited', 'low',
  'https://doi.org/10.1111/1346-8138.16325', 'peer_reviewed_literature', '2022-02-16',
  'partially_verified', 'medium', now()
),
(
  '4-butylresorcinol', '4-n-Butylresorcinol', NULL, 'brightening',
  'A tyrosinase-inhibiting brightening active used in serums and spot-treatment products targeting hyperpigmentation, dark spots and uneven tone.',
  'According to PubMed, a multicenter, single-blind clinical study found 4-n-butylresorcinol to be by far the most potent inhibitor of human tyrosinase among the compounds tested (IC50 of 21 umol/L), far exceeding hydroquinone, arbutin and kojic acid, and confirmed in vivo that it visibly reduced age spots within 8 weeks versus a vehicle control; a second comparison in the same study also found it more effective than both 4-hexylresorcinol and 4-phenylethylresorcinol (DOI: https://doi.org/10.1111/jdv.12051). A 2026 formulation study explored co-delivering 4-butylresorcinol with licochalcone A specifically to offset its known skin irritancy while preserving its whitening effect, reporting a 30.55% reduction in skin melanin content after 28 days of use (DOI: https://doi.org/10.1039/d5tb01755f).',
  'strong', 'high',
  'https://doi.org/10.1111/jdv.12051', 'peer_reviewed_literature', '2013-01-01',
  'partially_verified', 'medium', now()
),
(
  'ascorbyl-glucoside', 'Ascorbyl Glucoside', NULL, 'brightening',
  'A stable, water-soluble vitamin C derivative that converts to ascorbic acid in the skin, used in brightening serums as a gentler alternative to pure L-ascorbic acid.',
  'According to PubMed, a 2026 systematic review of 44 studies on vitamin C in dermatology describes ascorbyl glucoside, with or without arginine, as well tolerated for chronic hyperpigmentation (https://pubmed.ncbi.nlm.nih.gov/42761976/ -- no DOI listed for this article in PubMed). A separate 2026 human in vivo skin-permeation study using ToF-SIMS and OrbiSIMS imaging found ascorbyl glucoside penetrates into intracellular regions of the stratum corneum in a depth-dependent pattern, distinct from the surface-localised pattern seen for 3-O-ethyl ascorbic acid in the same study, though the study characterized permeation pathways rather than clinical efficacy (DOI: https://doi.org/10.1016/j.ijpharm.2026.127447).',
  'moderate', 'low',
  'https://doi.org/10.1016/j.ijpharm.2026.127447', 'peer_reviewed_literature', '2026-09-25',
  'partially_verified', 'medium', now()
),
(
  'madecassoside', 'Madecassoside', NULL, 'soothing-botanical',
  'A triterpene compound derived from Centella asiatica, studied for its role in skin wound healing and protecting keratinocytes from UV damage, distinct from the already-catalogued whole Centella Asiatica extract.',
  'According to PubMed, a 2025 in-vitro study using human keratinocyte (HaCaT) cell cultures found madecassoside enhanced wound healing and protected cells against UVB-induced apoptosis and loss of viability, acting through calcium-, AMPK- and mTOR-dependent ERK signalling pathways (DOI: https://doi.org/10.1080/21688370.2025.2532229). This is real but preclinical (cell-culture) evidence; no human clinical trial specifically isolating madecassoside''s effect was found.',
  'limited', 'low',
  'https://doi.org/10.1080/21688370.2025.2532229', 'peer_reviewed_literature', '2025-07-16',
  'partially_verified', 'medium', now()
),
(
  'homosalate', 'Homosalate', NULL, 'uv-filter',
  'A chemical UVB filter used in sunscreens, among the most widely used organic UV filters worldwide.',
  'According to PubMed, a 2024 human toxicokinetic study had four volunteers apply a sunscreen containing 10% homosalate to their whole body under regular-use conditions and found systemic absorption occurred, with elimination half-times around 24 hours; calculated margins of safety for a single whole-body application ranged from 11 to 92 depending on the exposure-assessment approach used (DOI: https://doi.org/10.1007/s00204-024-03704-7). A 2025 review grouping homosalate with other Category III "non-GRASE" UV filters (alongside avobenzone, octocrylene, oxybenzone, octinoxate and octisalate) discusses ongoing concerns about photodegradation and systemic absorption across this class, and surveys formulation strategies such as encapsulation aimed at reducing these risks while keeping UV protection effective (DOI: https://doi.org/10.1016/j.ijpharm.2025.125790).',
  'moderate', 'moderate',
  'https://doi.org/10.1007/s00204-024-03704-7', 'peer_reviewed_literature', '2024-03-14',
  'partially_verified', 'medium', now()
),
(
  'octisalate', 'Octisalate', '2-Ethylhexyl Salicylate / Octyl Salicylate', 'uv-filter',
  'A chemical UVB filter used in sunscreens, often paired with other filters to broaden protection and help stabilize avobenzone.',
  'According to PubMed, a photochemistry study found that octyl salicylate (octisalate) and homosalate both suppress singlet-oxygen generation photosensitized by the UV-A stabilizer Corapan TQ, quenching its excited singlet state -- a previously unreported protective characteristic beyond simple UV absorption, relevant to preventing UV-driven skin damage (DOI: https://doi.org/10.1039/c9pp00104b). It is also named, alongside homosalate, among the Category III "non-GRASE" UV filters facing ongoing photostability and systemic-absorption scrutiny described in a 2025 review (DOI: https://doi.org/10.1016/j.ijpharm.2025.125790).',
  'limited', 'low',
  'https://doi.org/10.1039/c9pp00104b', 'peer_reviewed_literature', '2019-06-12',
  'partially_verified', 'medium', now()
),
(
  'cocamidopropyl-betaine', 'Cocamidopropyl Betaine', 'CAPB', 'cleansing-base',
  'An amphoteric, coconut-derived surfactant widely used as a foam booster and mild cleansing agent in shampoos, body washes and facial cleansers.',
  'According to PubMed, a 2026 15-year Thai market survey found cocamidopropyl betaine (CAPB) was the most prevalent surfactant in personal-care cleansers (43.2% of products), and while its patch-test positivity rate among dermatitis patients has declined over time despite rising market use, it remains among the surfactants with the highest patch-test positivity rates recorded (DOI: https://doi.org/10.1177/17103568261484376). A 2022 case report identified an impurity formed during CAPB''s manufacturing process (lauramidopropyl dimethylamine) as the likely cause of a patient''s allergic contact dermatitis from CAPB-containing shampoo and body cleanser, rather than CAPB itself (DOI: https://doi.org/10.15036/arerugi.71.1136).',
  'moderate', 'moderate',
  'https://doi.org/10.1177/17103568261484376', 'peer_reviewed_literature', '2026-09-04',
  'partially_verified', 'medium', now()
),
(
  'decyl-glucoside', 'Decyl Glucoside', NULL, 'cleansing-base',
  'A sugar-derived, non-ionic surfactant valued for its mildness, commonly used in gentle cleansers, baby products and micellar formulas.',
  'According to PubMed, a 2025 study developing a sustainable shampoo formulation used decyl glucoside and coco-glucoside (both alkyl polyglucosides) as the surfactant base, finding the resulting formulation had a significantly lower zein number -- a standard marker of surfactant-driven protein denaturation and skin-irritation potential -- compared to a reference shampoo, supporting alkyl polyglucosides'' reputation as milder surfactants than conventional alternatives (DOI: https://doi.org/10.3390/molecules30183817).',
  'limited', 'low',
  'https://doi.org/10.3390/molecules30183817', 'peer_reviewed_literature', '2025-09-19',
  'partially_verified', 'medium', now()
),
(
  'benzyl-alcohol', 'Benzyl Alcohol', NULL, 'preservative',
  'A preservative, solvent and fragrance ingredient widely used across cosmetics and topical medications, functioning both as a standalone antimicrobial and alongside other preservative systems.',
  'According to PubMed, a 2026 four-country European market survey of solid shampoos found benzyl alcohol was the single most common preservative used (present in 29 of the preservative-containing products surveyed), ahead of sodium benzoate (DOI: https://doi.org/10.1111/cod.70085). Separately, a 2022 case series documented allergic contact dermatitis to benzyl alcohol, used as an excipient in chlorhexidine-containing antiseptics, in six children, with several sensitized to more than one ingredient in the same product -- underscoring that even common preservative/excipient ingredients can sensitize, particularly with repeated early-life exposure (DOI: https://doi.org/10.1111/pde.15127).',
  'moderate', 'moderate',
  'https://doi.org/10.1111/cod.70085', 'peer_reviewed_literature', '2026-01-20',
  'partially_verified', 'medium', now()
),
(
  'caprylic-capric-triglyceride', 'Caprylic/Capric Triglyceride', NULL, 'barrier-lipid',
  'A lightweight, non-comedogenic emollient ester derived from coconut or palm-kernel oil and glycerin, used to improve the spreadability and skin feel of creams and serums.',
  'According to PubMed, a 2021 case report documented facial allergic contact dermatitis in a patient caused by caprylic/capric triglyceride in a cosmetic cream, confirmed via patch testing -- a reminder that even widely used "natural emollient" ingredients can occasionally sensitize (DOI: https://doi.org/10.1111/cod.14019). A separate formulation-chemistry study found caprylic/capric triglycerides favour the formation of lamellar liquid-crystal structures in cosmetic emulsions (close to the alpha-gel phase), which influences the sensory spreadability of the finished product on skin (DOI: https://doi.org/10.1111/ics.12498).',
  'limited', 'low',
  'https://doi.org/10.1111/cod.14019', 'peer_reviewed_literature', '2021-12-16',
  'partially_verified', 'medium', now()
),
(
  'chlorphenesin', 'Chlorphenesin', NULL, 'preservative',
  'A broad-spectrum preservative with additional antimicrobial and anti-irritant claims, often used alongside other preservative systems such as phenoxyethanol.',
  'According to PubMed, a multicenter Korean study patch-testing 584 patients with suspected cosmetic contact dermatitis found chlorphenesin had one of the highest irritancy rates among tested preservatives, concluding that the optimum formulation concentration to avoid skin reactions is less than 0.5% (DOI: https://doi.org/10.1111/j.1346-8138.2012.01551.x). A separate comparative study of cosmetic preservatives found chlorphenesin produced similar objective (patch-test) irritation to parabens and phenoxyethanol, but higher subjective (sensory, stinging/burning) irritation than other tested preservatives, and that combining it with phenoxyethanol notably increased sensory irritation (DOI: https://doi.org/10.1111/j.1600-0536.2007.01001.x).',
  'moderate', 'high',
  'https://doi.org/10.1111/j.1346-8138.2012.01551.x', 'peer_reviewed_literature', '2012-05-01',
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
  ('pentylene-glycol', 'https://doi.org/10.1111/cod.70211', 'Contact Allergy and Allergic Contact Dermatitis From Propylene Glycol and Related Glycols: Cosmetic Skin Sensitisers After All?', 'Contact Dermatitis', 'peer_reviewed_literature', '2026-06-30', 'moderate', 'Retrospective patch-test study at Antwerp University Hospital; pentylene glycol allergy found in 6.74% of patients tested with it.'),
  ('pentylene-glycol', 'https://doi.org/10.1021/acs.langmuir.4c00382', 'Cosmetically Approved Short-Chain Alcohol/Triethyl Citrate/Water Surfactant-Free Microemulsions and Potential Application to Transdermal Penetration of alpha-Arbutin', 'Langmuir', 'peer_reviewed_literature', '2024-05-13', 'limited', '1,2-Pentanediol studied as a cosmetically approved microemulsion component for delivering alpha-arbutin through skin.'),
  ('lycopene', 'https://doi.org/10.3390/antiox14050577', 'Carotenoids in Skin Photoaging: Unveiling Protective Effects, Molecular Insights, and Safety and Bioavailability Frontiers', 'Antioxidants (Basel)', 'peer_reviewed_literature', '2025-05-11', 'limited', 'Review grouping lycopene with other carotenoids for antioxidant/photoaging protection; most direct human evidence is from oral multi-ingredient supplements.'),
  ('palmitoyl-pentapeptide-4', 'https://doi.org/10.1002/advs.202412581', 'Bioactive Glycyrrhizic Acid Ionic Liquid Self-Assembled Nanomicelles for Enhanced Transdermal Delivery of Anti-Photoaging Signal Peptides', 'Advanced Science', 'peer_reviewed_literature', '2025-01-09', 'limited', 'Cellular and animal photoaging models; delivery-system study for palmitoyl pentapeptide-4 (PAL-4).'),
  ('acetyl-octapeptide-3', 'https://doi.org/10.5021/ad.23.136', 'Clinical Safety and Efficacy Evaluation of a Dissolving Microneedle Patch Having Dual Anti-Wrinkle Effects With Safe and Long-Term Activities', 'Annals of Dermatology', 'peer_reviewed_literature', '2024-08-01', 'moderate', 'Clinical study of a microneedle patch containing acetyl octapeptide-3; reduced TEWL, improved wrinkles/elasticity vs placebo over 28 days.'),
  ('acetyl-octapeptide-3', 'https://doi.org/10.1111/jocd.13009', 'Efficacy of bioactive peptides loaded on hyaluronic acid microneedle patches: A monocentric clinical study', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2019-05-28', 'moderate', '12-week clinical trial of HA microneedle patches with acetyl octapeptide-3 and other peptides; 25.8% decrease in fine lines/wrinkles.'),
  ('sunflower-seed-oil', 'https://doi.org/10.1038/s41390-025-04602-z', 'Immune responses to topical emollient therapy with sunflower seed oil in young children with severe acute malnutrition in Bangladesh: a randomized controlled trial', 'Pediatric Research', 'peer_reviewed_literature', '2025-12-19', 'moderate', 'RCT in 212 children; topical sunflower seed oil improved skin barrier function and reduced infection risk.'),
  ('sunflower-seed-oil', 'https://doi.org/10.1007/s13346-025-01939-0', 'Mechanistic insights and clinical evidence of Helianthus annuus Linn. (Sunflower) seed oil for dermatological applications: A narrative review', 'Drug Delivery and Translational Research', 'peer_reviewed_literature', '2025-08-09', 'moderate', 'Narrative review covering barrier restoration mechanisms and clinical evidence for TEWL reduction, hydration, wound healing.'),
  ('cetyl-alcohol', 'https://doi.org/10.1111/1346-8138.16325', 'Seven cases of contact dermatitis due to stearyl alcohol contained in topical medications', 'The Journal of Dermatology', 'peer_reviewed_literature', '2022-02-16', 'limited', 'Case series; 2 of 3 patients allergic to stearyl alcohol also patch-test positive to cetyl alcohol (cross-reactivity).'),
  ('4-butylresorcinol', 'https://doi.org/10.1111/jdv.12051', '4-n-butylresorcinol, a highly effective tyrosinase inhibitor for the topical treatment of hyperpigmentation', 'Journal of the European Academy of Dermatology and Venereology', 'peer_reviewed_literature', '2013-01-01', 'strong', 'Multicenter single-blind RCT; most potent tyrosinase inhibitor tested, visibly reduced age spots in 8 weeks vs vehicle.'),
  ('4-butylresorcinol', 'https://doi.org/10.1039/d5tb01755f', 'Co-delivery of loaded 4-butylresorcinol and licochalcone A in a supramolecular system for synergistic permeation and whitening effects', 'Journal of Materials Chemistry B', 'peer_reviewed_literature', '2026-03-05', 'moderate', 'Formulation study addressing 4-butylresorcinol''s known irritancy via co-delivery; 30.55% melanin reduction in 28 days.'),
  ('ascorbyl-glucoside', 'https://pubmed.ncbi.nlm.nih.gov/42761976/', 'Clinical Applications of Vitamin C in Dermatology: A Systematic Review', 'The Journal of Clinical and Aesthetic Dermatology', 'peer_reviewed_literature', '2026-07-01', 'moderate', 'Systematic review of 44 studies; ascorbyl glucoside with/without arginine described as well tolerated for chronic hyperpigmentation.'),
  ('ascorbyl-glucoside', 'https://doi.org/10.1016/j.ijpharm.2026.127447', 'Permeation behaviour of cosmetic actives into the human stratum corneum', 'International Journal of Pharmaceutics', 'peer_reviewed_literature', '2026-09-25', 'limited', 'Human in vivo ToF-SIMS/OrbiSIMS study of stratum corneum permeation of ascorbyl glucoside and other vitamin C derivatives.'),
  ('madecassoside', 'https://doi.org/10.1080/21688370.2025.2532229', 'Phytochemical Madecassoside enhances skin wound healing and protects against UVB-induced keratinocyte damage', 'Tissue Barriers', 'peer_reviewed_literature', '2025-07-16', 'limited', 'In-vitro HaCaT keratinocyte study; madecassoside enhanced wound healing and reduced UVB-induced apoptosis.'),
  ('homosalate', 'https://doi.org/10.1007/s00204-024-03704-7', 'Toxicokinetics of homosalate in humans after dermal application: applicability of oral-route data for exposure assessment by human biomonitoring', 'Archives of Toxicology', 'peer_reviewed_literature', '2024-03-14', 'moderate', 'Human toxicokinetic study; systemic absorption confirmed after whole-body sunscreen application, margins of safety calculated.'),
  ('homosalate', 'https://doi.org/10.1016/j.ijpharm.2025.125790', 'The dual challenge of FDA-evaluated non-GRASE UV filters: Photostability and systemic absorption - A path toward safer and more effective sunscreens', 'International Journal of Pharmaceutics', 'peer_reviewed_literature', '2025-05-30', 'moderate', 'Review of Category III non-GRASE UV filters including homosalate and octisalate; photodegradation and absorption concerns.'),
  ('octisalate', 'https://doi.org/10.1039/c9pp00104b', 'A novel characteristic of salicylate UV absorbers: suppression of diethylhexyl 2,6-naphthalate (Corapan TQ)-photosensitized singlet oxygen generation', 'Photochemical & Photobiological Sciences', 'peer_reviewed_literature', '2019-06-12', 'limited', 'Photochemistry study; octyl salicylate and homosalate suppress photosensitized singlet-oxygen generation.'),
  ('cocamidopropyl-betaine', 'https://doi.org/10.1177/17103568261484376', 'Evolving Surfactant Trends in the Thai Personal Care Market Over 15 Years and Their Association with Clinical Patch Test Reactivity', 'Dermatitis', 'peer_reviewed_literature', '2026-09-04', 'moderate', '15-year Thai market survey; CAPB most prevalent cleanser surfactant (43.2%), among highest patch-test positivity rates.'),
  ('cocamidopropyl-betaine', 'https://doi.org/10.15036/arerugi.71.1136', 'A case of allergic contact dermatitis caused by detergents containing cocamidopropyl betaine in which an impurity was the possible causative agent', 'Arerugi', 'peer_reviewed_literature', '2022-01-01', 'limited', 'Case report; manufacturing impurity (lauramidopropyl dimethylamine) identified as likely sensitizer rather than CAPB itself.'),
  ('decyl-glucoside', 'https://doi.org/10.3390/molecules30183817', 'Application of Alkyl Polyglucosides as Components of the Extraction Medium in the Preparation of a Shampoo Cosmetic Formulation Containing Substances Isolated from Red Grape Pomace', 'Molecules', 'peer_reviewed_literature', '2025-09-19', 'limited', 'Decyl glucoside/coco-glucoside shampoo formulation; lower zein number (less irritation potential) vs reference.'),
  ('benzyl-alcohol', 'https://doi.org/10.1111/cod.70085', 'Solid Shampoo Is Mostly Not Preserved, in Contrast to Liquid Shampoos Used in Hairdressing-A Market Survey in Four European Countries', 'Contact Dermatitis', 'peer_reviewed_literature', '2026-01-20', 'moderate', 'Four-country market survey; benzyl alcohol most common solid-shampoo preservative.'),
  ('benzyl-alcohol', 'https://doi.org/10.1111/pde.15127', 'Allergic contact dermatitis to chlorhexidine-containing antiseptics and their excipients in children: A series of six cases', 'Pediatric Dermatology', 'peer_reviewed_literature', '2022-12-13', 'limited', 'Case series; benzyl alcohol (as antiseptic excipient) caused allergic contact dermatitis in children.'),
  ('caprylic-capric-triglyceride', 'https://doi.org/10.1111/cod.14019', 'Facial allergic contact dermatitis caused by caprylic/capric triglyceride in a cosmetic cream', 'Contact Dermatitis', 'peer_reviewed_literature', '2021-12-16', 'limited', 'Case report; confirmed by patch testing.'),
  ('caprylic-capric-triglyceride', 'https://doi.org/10.1111/ics.12498', 'Influence of the emollient on emulsions containing lamellar liquid crystals: from molecular organization towards applicative properties', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2018-11-29', 'limited', 'Formulation-chemistry study; caprylic/capric triglycerides favour lamellar liquid-crystal structure near the alpha-gel phase.'),
  ('chlorphenesin', 'https://doi.org/10.1111/j.1346-8138.2012.01551.x', 'Multicenter study of preservative sensitivity in patients with suspected cosmetic contact dermatitis in Korea', 'The Journal of Dermatology', 'peer_reviewed_literature', '2012-05-01', 'moderate', 'Multicenter patch-test study of 584 patients; chlorphenesin among the highest-irritancy preservatives tested.'),
  ('chlorphenesin', 'https://doi.org/10.1111/j.1600-0536.2007.01001.x', 'Comparison of objective and sensory skin irritations of several cosmetic preservatives', 'Contact Dermatitis', 'peer_reviewed_literature', '2007-03-01', 'moderate', 'Comparative irritation study; chlorphenesin had higher subjective irritation than other tested preservatives.')
) AS v(candidate_slug, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- ============================================================
-- Part 3: drain the demand-driven queue (10 pending rows)
-- ============================================================

-- Duplicates of already-published ingredients
UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '65d3aab4-5f94-4290-976a-4662f6bb1210', resolved_at = now()
WHERE id = 'cdce6f05-f870-470b-b50f-3c038468a099'; -- Organic Rooibos -> rooibos-extract

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '23c3ca3b-d27a-4b8c-bc0a-2bc00ce5d56a', resolved_at = now()
WHERE id = 'ccf0be8a-f826-4199-b8d4-170364e4b500'; -- Kigelia Extract -> kigelia-africana

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = 'b4d796f1-4f00-4f82-8c29-5cfa0262c513', resolved_at = now()
WHERE id = '3fbd9b22-0972-4f0b-8eb9-9e19a09b19ef'; -- Live Probiotics -> live-lactobacillus-cultures

UPDATE public.ingredient_generation_requests
SET status = 'published', resolved_ingredient_id = '50264fd2-8f59-44e6-b8a4-3cc2008ef3de', resolved_at = now()
WHERE id = '038212a1-3ba2-4e53-a429-592b7224d314'; -- Organic Shea Butter -> shea-butter

-- Rejected: non-specific / generic / not an ingredient
UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'No ingredient name was actually extracted ("None listed") -- nothing to research.', resolved_at = now()
WHERE id = '59445774-ecdd-4a07-8b86-5d1329da0922'; -- None listed

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic category term ("Essential oils"), not a single named INCI ingredient -- same pattern as the existing "Botanical Oils"/"Plant Oil Blend" skip-listed stubs.', resolved_at = now()
WHERE id = '561e3405-b7d2-4196-a7b0-0a6f52a26fc0'; -- Essential oils

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'A sun-protection-factor rating ("SPF 15"), not an ingredient at all.', resolved_at = now()
WHERE id = 'e7ae07e5-7f64-45b1-bcb7-660f13f75158'; -- SPF 15

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("Nourishing formula"), not a named ingredient or ingredient category.', resolved_at = now()
WHERE id = '0f0a9318-13f9-4095-97ea-2a81d1d75294'; -- Nourishing formula

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic category descriptor ("Gentle cleansing agents"), not one named ingredient -- same pattern as the existing "Mild Surfactant Base"/"pH-Balanced Surfactants" skip-listed stubs.', resolved_at = now()
WHERE id = 'e20947db-8dfa-4a13-8bd4-3efc1ccbe838'; -- Gentle cleansing agents

UPDATE public.ingredient_generation_requests
SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("Microbiome-Balancing Actives"), not a named ingredient -- the real underlying ingredient from the same product (Live Probiotics) is handled separately as a duplicate of live-lactobacillus-cultures.', resolved_at = now()
WHERE id = '1343119b-a6c0-40e5-922a-17e21dbeff6e'; -- Microbiome-Balancing Actives
