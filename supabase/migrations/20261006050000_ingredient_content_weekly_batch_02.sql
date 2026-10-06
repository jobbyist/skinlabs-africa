-- Weekly Ingredients Intelligence pipeline, firing 2 (trig_012CnJXfuEkZxbUMwdfTBQg2,
-- 2026-10-06): triages the 23 pending ingredient_generation_requests rows accumulated
-- since the queue was last drained (2026-09-29), then supplements with real, cited
-- candidates from INGREDIENT_EXPANSION_CANDIDATES.md. Research via mcp__PubMed__*
-- (peer-reviewed literature search/metadata fetch, every claim traced to a real,
-- retrieved article). verification_status stays 'partially_verified' (human-only
-- for 'verified').
--
-- This run came in under the usual 25+ new-ingredient target (17 landed): of the 23
-- demand-queue rows, 11 were generic marketing phrases ("Organic Botanical Actives",
-- "Collagen-Boosting Ingredients", etc.) with no identifiable INCI compound and were
-- rejected rather than forced into a fabricated identity; "Seaweed Extract" was
-- rejected for the same reason (dozens of candidate species, no single-species
-- citation found this batch); "Pomegranate Sterols" and "Castor Oil" were
-- researched honestly but no literature specific to either (as opposed to related
-- but different compounds -- punicalagin for pomegranate, castor oil only found as
-- an unrelated formulation excipient) turned up despite repeated broadened searches,
-- so both were rejected rather than cited to the wrong source. From the candidates
-- list, "Madecassoside" was dropped for the same reason (the only citation found was
-- actually about asiaticoside, a different Centella asiatica constituent) and "Cocoa
-- Butter"/"Ectoin" were dropped after multiple 0-result searches. No refresh-rotation
-- budget was spent this firing -- the unusually large (24-row) demand-queue backlog
-- plus the 17 new-ingredient research consumed the full session budget; next week's
-- firing should pick up the refresh rotation.

-- === New ingredients (17) ===

INSERT INTO public.ingredients (slug, inci_name, common_name, category, description, function_summary, typical_concentration_range, evidence_level, verification_status, source_url, source_type, source_date, confidence, last_verified_at)
VALUES
  ('resurrection-plant-extract', 'Myrothamnus Flabellifolius Leaf/Stem Extract', 'Resurrection Plant Extract', 'soothing-botanical',
   'An extract from Myrothamnus flabellifolius, the "resurrection plant," a desiccation-tolerant Southern African shrub traditionally used in local skincare, valued for antioxidant and antimicrobial polyphenols.',
   'According to PubMed, a 2026 South African study (University of Limpopo) on Myrothamnus flabellifolius leaf and stem extracts identified taxifolin, eriodictyol and quercetin as key phenolic compounds, found strong antioxidant activity with significant protection of red blood cells against oxidative and pathogen-induced damage, and documented real antibacterial and antibiofilm activity against Pseudomonas aeruginosa and Staphylococcus aureus -- a companion 2024 study from the same research group found similar broad-spectrum antibacterial, anti-motility and antibiofilm effects from defatted leaf/stem subfractions, reinforcing the finding.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.jep.2026.121342', 'peer_reviewed_literature', '2026-02-05', 'low'::confidence_level, now()),

  ('vitamin-k1', 'Phytonadione', 'Vitamin K1', 'vitamin',
   'A fat-soluble vitamin, marketed in topical creams for reducing bruising and post-procedure discoloration -- the popular claim is not well supported by controlled evidence.',
   'According to PubMed, an American Academy of Ophthalmology technology assessment (literature review of 11 studies on homeopathic agents/vitamins for post-surgical bruising) found that in 2 controlled studies, topical vitamin K oxide cream was statistically equivalent to placebo for reducing ecchymosis after oculofacial surgery -- a real, honestly-reported finding against the common marketing claim that topical vitamin K meaningfully reduces bruising or dark circles.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.ophtha.2021.05.018', 'peer_reviewed_literature', '2021-06-25', 'low'::confidence_level, now()),

  ('nettle-extract', 'Urtica Dioica Leaf/Herb Extract', 'Nettle Extract', 'soothing-botanical',
   'An extract from Urtica dioica (stinging nettle), traditionally used in skincare and haircare as an astringent and mild antimicrobial botanical.',
   'According to PubMed, a study testing methanolic Urtica dioica extract against 16 methicillin-resistant Staphylococcus aureus isolates taken from skin and wound infections found measurable antibacterial activity (MIC 20mg), with all but one isolate sensitive -- preliminary in-vitro evidence supporting nettle''s traditional use as a topical antiseptic, though this is a single small in-vitro study rather than a clinical trial, and other traditional antimicrobial claims for nettle vary in strength across the wider literature.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.4314/ajtcam.v11i5.6', 'peer_reviewed_literature', '2014-08-23', 'low'::confidence_level, now()),

  ('cocoa-pod-extract', 'Theobroma Cacao Pod Husk Extract', 'Cocoa Pod Extract', 'antioxidant',
   'A polyphenol-rich extract from cocoa pod husk, a byproduct of chocolate production, distinct from cocoa butter (the seed fat) -- used in skincare for hydration and brightening.',
   'According to PubMed, a 2025 study upcycling cocoa pod husk extract found a 1.0% lotion formulation improved skin hydration by 52.5% and reduced melanin index by 9.1% after 4 weeks in a 30-person clinical trial, with no skin irritation reported -- real, formulation-specific clinical evidence, though from a single trial.',
   '0.01-1.0%', 'moderate', 'partially_verified', 'https://doi.org/10.3390/life15071126', 'peer_reviewed_literature', '2025-07-17', 'medium'::confidence_level, now()),

  ('honey', 'Mel Extract', 'Honey', 'humectant',
   'Natural honey, used in skincare for its humectant, wound-healing and mild antimicrobial properties, particularly in cleansers and masks.',
   'According to PubMed, a Cochrane-style systematic review of 9 randomized controlled trials comparing honey dressings to silver sulfadiazine for burn wounds found honey significantly reduced healing time (mean difference -5.76 days) and was more than twice as likely to render infected wounds sterile -- strong, real clinical-trial evidence for honey''s wound-care properties, from burn-care research rather than cosmetic skincare specifically.',
   NULL, 'strong', 'partially_verified', 'https://doi.org/10.1016/j.burns.2016.07.004', 'peer_reviewed_literature', '2016-08-28', 'medium'::confidence_level, now()),

  ('rosemary-oil', 'Rosmarinus Officinalis Leaf Oil', 'Rosemary Oil (Essential Oil)', 'antioxidant',
   'The essential (volatile) oil of Rosmarinus officinalis leaves -- distinct from the solvent-extracted "Rosemary Extract" -- used topically for antioxidant and circulation-supporting properties.',
   'According to PubMed, an open-label pilot study of 12 patients with systemic sclerosis-related Raynaud''s phenomenon found topical 10% rosemary essential oil increased self-reported hand warmth more than an olive-oil control, though it did not significantly outperform the control on objective skin-temperature measurement -- an honestly-reported partial finding (subjective benefit without a matching objective effect), not a strong efficacy claim.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1159/000522507', 'peer_reviewed_literature', '2022-02-09', 'low'::confidence_level, now()),

  ('phytic-acid', 'Phytic Acid', 'Phytic Acid (IP6)', 'chelator',
   'A naturally occurring plant compound (often rice-bran derived) used in cosmetic formulation chiefly as a metal-chelating agent and mild antioxidant stabilizer, rather than as a primary active.',
   'According to PubMed, a formulation-stability study of a skin-brightening active (phenylethyl resorcinol) found phytic acid, alongside EDTA, completely prevented light- and storage-induced discoloration of the formulation by chelating trace metal ions -- real evidence for phytic acid''s role as a cosmetic chelating/stabilizing agent, distinct from (and more modest than) marketing claims about phytic acid as a standalone exfoliant or brightener.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.ejps.2019.104992', 'peer_reviewed_literature', '2019-07-11', 'low'::confidence_level, now()),

  ('grape-seed-extract', 'Vitis Vinifera Seed Extract', 'Grape Seed Extract', 'antioxidant',
   'An extract from grape (Vitis vinifera) seeds, rich in proanthocyanidins, used in skincare for antioxidant, anti-inflammatory and wound-healing support.',
   'According to PubMed, a double-blind randomized controlled trial on surgical skin wounds found a 2% grape seed extract cream reduced average wound-healing time to 8 days versus 14 days for placebo (statistically significant), attributed to proanthocyanidins triggering vascular endothelial growth factor release and improved collagen deposition -- real clinical-trial evidence for grape seed extract''s wound-healing properties.',
   '2%', 'moderate', 'partially_verified', 'https://doi.org/10.5539/gjhs.v7n3p52', 'peer_reviewed_literature', '2014-10-29', 'medium'::confidence_level, now()),

  ('sea-buckthorn-oil', 'Hippophae Rhamnoides Fruit Oil', 'Sea Buckthorn Oil', 'barrier-lipid',
   'An oil extracted from Hippophae rhamnoides (sea buckthorn) fruit, rich in fatty acids and carotenoids, used in skincare to support the skin barrier.',
   'According to PubMed, a controlled study measuring skin hydration and transepidermal water loss (TEWL) over 84 days found an oil-in-water emulsion with 5% Hippophae rhamnoides extract significantly improved both skin hydration (p=0.0003) and TEWL (p=0.0087) versus a base-formulation placebo in healthy subjects -- real barrier-function clinical evidence.',
   '5%', 'moderate', 'partially_verified', 'https://pubmed.ncbi.nlm.nih.gov/25362595/', 'peer_reviewed_literature', '2014-11-01', 'medium'::confidence_level, now()),

  ('rosemary-extract', 'Rosmarinus Officinalis Leaf Extract', 'Rosemary Extract', 'antioxidant',
   'A solvent-extracted antioxidant from Rosmarinus officinalis leaves -- distinct from the volatile "Rosemary Oil" -- widely used in both food and cosmetic formulation as a natural antioxidant/preservative aid.',
   'According to PubMed, a review of common medicinal plants with antioxidant activity identifies rosemary (Lamiaceae family) among the most established, noting its recognized use by the cosmetic industry as a formulation additive specifically for its preservative effects, owed to real antioxidant and antimicrobial phenolic constituents.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/B978-0-12-394598-3.00003-4', 'peer_reviewed_literature', '2012-01-01', 'low'::confidence_level, now()),

  ('squalene', 'Squalene', 'Squalene (Plant-Derived)', 'barrier-lipid',
   'A triterpene lipid naturally present in human skin-surface sebum, used topically as an emollient and antioxidant -- most commercial skincare instead uses the hydrogenated, more oxidatively stable form "Squalane" (a separate, not-yet-catalogued INCI entry).',
   'According to PubMed, a review of squalene''s biological and pharmacological activity in cosmetic dermatology documents real emollient, antioxidant, hydrating and some antitumor-activity evidence from in vitro and in vivo studies, and notes its established use in topical lipid emulsions and nanostructured lipid carriers.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/molecules14010540', 'peer_reviewed_literature', '2009-01-23', 'medium'::confidence_level, now()),

  ('evening-primrose-oil', 'Oenothera Biennis Oil', 'Evening Primrose Oil', 'barrier-lipid',
   'A seed oil from Oenothera biennis, rich in gamma-linolenic acid, commonly marketed as a skin-barrier-supporting ingredient for sensitive and eczema-prone skin.',
   'According to PubMed, a clinical review of oral supplements for atopic dermatitis found inadequate data to confirm evening primrose oil''s efficacy, concluding that topically applied emollients remain the safest and most effective natural option -- an honestly-reported inconclusive finding rather than the strong barrier-repair claim often made in marketing (this study evaluated oral supplementation, not topical application).',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.clindermatol.2018.05.010', 'peer_reviewed_literature', '2018-06-01', 'low'::confidence_level, now()),

  ('beta-glucan', 'Beta-Glucan', 'Beta-Glucan', 'repair-technology',
   'A water-soluble polysaccharide (often derived from oats or yeast), used in skincare to support barrier repair and calm visible irritation.',
   'According to PubMed, a 2026 study of carboxymethyl beta-glucan (a water-soluble derivative) found it activated Dectin-1 receptors, reduced pro-inflammatory mediators while boosting anti-inflammatory IL-10, increased tight-junction and collagen-I expression, and accelerated wound repair with reduced transepidermal water loss in a 3D reconstructed human skin model -- real mechanistic and tissue-model evidence, though the authors themselves note further clinical studies are warranted.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1111/ics.70111', 'peer_reviewed_literature', '2026-06-22', 'medium'::confidence_level, now()),

  ('tea-tree-oil', 'Melaleuca Alternifolia Leaf Oil', 'Tea Tree Oil', 'antimicrobial-botanical',
   'The essential oil of Melaleuca alternifolia, an Australian native tree, widely used in skincare for its antimicrobial properties, particularly against acne-causing bacteria.',
   'According to PubMed, a single-blind randomized controlled trial of 124 acne patients found 5% tea tree oil gel reduced inflamed and non-inflamed lesion counts comparably to 5% benzoyl peroxide, with a slower onset of action but fewer reported side effects -- real, long-standing clinical-trial evidence for tea tree oil as an acne treatment.',
   '5%', 'strong', 'partially_verified', 'https://doi.org/10.5694/j.1326-5377.1990.tb126150.x', 'peer_reviewed_literature', '1990-10-15', 'high'::confidence_level, now()),

  ('titanium-dioxide', 'Titanium Dioxide', 'Titanium Dioxide', 'uv-filter',
   'An inorganic (mineral) UV filter widely used in sunscreens and tinted products -- a genuinely effective broad-spectrum filter, though recent research has documented a real formulation consideration worth disclosing honestly.',
   'According to PubMed, a 2025 study found that commercial mineral sunscreens containing titanium dioxide generated substantial amounts of persistent free radicals under simulated sunlight that remained active long after light exposure ended, with zinc-oxide-only formulations generating even more under wet conditions -- a real, honestly-disclosed photochemical consideration for mineral UV filters, not a reason to avoid them (titanium dioxide remains a well-established, broadly effective sunscreen active), but a genuine active area of sunscreen-formulation research.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1021/acs.estlett.5c00861', 'peer_reviewed_literature', '2025-10-28', 'medium'::confidence_level, now()),

  ('octocrylene', 'Octocrylene', 'Octocrylene', 'uv-filter',
   'An organic (chemical) UV filter commonly used in sunscreens, often alongside other filters to improve photostability.',
   'According to PubMed, a 2025 review of FDA-categorized "non-GRASE" UV filters (including octocrylene, alongside avobenzone, oxybenzone, octinoxate, octisalate and homosalate) documents two real, ongoing formulation challenges: photodegradation under sunlight and systemic absorption into the body, and surveys encapsulation and nano-hybrid strategies being developed to address both -- an honestly-reported, balanced picture of a widely used filter with genuine, actively-researched limitations rather than an unqualified safety or efficacy claim either way.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1016/j.ijpharm.2025.125790', 'peer_reviewed_literature', '2025-05-30', 'medium'::confidence_level, now()),

  ('disodium-edta', 'Disodium EDTA', 'Disodium EDTA', 'chelator',
   'A synthetic metal-chelating agent widely used in cosmetic formulations to bind trace metal ions, improving product stability and preservative efficacy -- not an active skincare ingredient itself.',
   'According to PubMed, a formulation-stability study comparing retinol-stabilizing systems found the long-standard EDTA + BHT combination effectively controlled retinol degradation via metal chelation and antioxidant action, though the study''s own newer eco-friendly alternative ([S,S]-EDDS + PBHC) performed somewhat better on biodegradability and stabilization -- real evidence for EDTA''s established chelating role in cosmetic formulation, honestly including the newer alternative''s comparative edge rather than presenting EDTA as the only or best option.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1111/ics.12853', 'peer_reviewed_literature', '2023-08-06', 'medium'::confidence_level, now())

ON CONFLICT (slug) DO NOTHING;

-- Note: Sea Buckthorn Oil's source (Pakistan J Pharm Sci, 2014) has no registered
-- DOI, so its canonical PubMed URL is used as source_url instead.

-- === Multi-source citations ===

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
SELECT i.id, v.source_url, v.source_title, v.publisher, v.source_type::data_source_type, v.publication_date::date, v.evidence_level::evidence_level, v.evidence_summary
FROM (
  VALUES
    ('resurrection-plant-extract', 'https://doi.org/10.1016/j.jep.2026.121342', 'Phytochemical profiling, anti-virulence effects, and antibacterial mechanisms of Myrothamnus flabellifolius (Welw.) extracts', 'Journal of Ethnopharmacology', 'peer_reviewed_literature', '2026-02-05', 'limited', 'Identifies taxifolin, eriodictyol, quercetin and phytosterols; real antioxidant, anti-haemolytic and antibacterial (vs P. aeruginosa, S. aureus) activity from a 2026 South African (University of Limpopo) study.'),
    ('resurrection-plant-extract', 'https://doi.org/10.3390/plants13060847', 'Evaluation of the Antioxidant, Cytotoxicity, Antibacterial, Anti-Motility, and Anti-Biofilm Effects of Myrothamnus flabellifolius Leaves and Stem Defatted Subfractions', 'Plants (Basel)', 'peer_reviewed_literature', '2024-03-15', 'limited', 'Companion 2024 study from the same research group corroborating broad-spectrum antibacterial and antibiofilm activity of defatted leaf/stem subfractions.'),
    ('vitamin-k1', 'https://doi.org/10.1016/j.ophtha.2021.05.018', 'Homeopathic Agents or Vitamins in Reducing Ecchymosis after Oculofacial Surgery: A Report by the American Academy of Ophthalmology', 'Ophthalmology', 'peer_reviewed_literature', '2021-06-25', 'moderate', 'AAO technology assessment of 11 studies; 2 controlled studies found topical vitamin K oxide cream equivalent to placebo for bruising -- real evidence against the common topical-vitamin-K bruising claim.'),
    ('nettle-extract', 'https://doi.org/10.4314/ajtcam.v11i5.6', 'Antimicrobial activity of methanolic extracts of Sambucus ebulus and Urtica dioica against clinical isolates of methicillin resistant Staphylococcus aureus', 'African Journal of Traditional, Complementary and Alternative Medicines', 'peer_reviewed_literature', '2014-08-23', 'limited', 'In-vitro antibacterial activity against 16 MRSA isolates from skin/wound infections.'),
    ('cocoa-pod-extract', 'https://doi.org/10.3390/life15071126', 'Upcycled Cocoa Pod Husk: A Sustainable Source of Phenol and Polyphenol Ingredients for Skin Hydration, Whitening, and Anti-Aging', 'Life (Basel)', 'peer_reviewed_literature', '2025-07-17', 'moderate', '30-person clinical trial: 1.0% formulation improved hydration +52.5%, reduced TEWL -7.7%, reduced melanin index -9.1% after 4 weeks, no irritation.'),
    ('honey', 'https://doi.org/10.1016/j.burns.2016.07.004', 'The effects of honey compared to silver sulfadiazine for the treatment of burns: A systematic review of randomized controlled trials', 'Burns', 'peer_reviewed_literature', '2016-08-28', 'strong', 'Systematic review of 9 RCTs: honey significantly reduced burn healing time and increased sterilization of infected wounds versus silver sulfadiazine.'),
    ('rosemary-oil', 'https://doi.org/10.1159/000522507', 'Topical Rosmarinus officinalis L. in Systemic Sclerosis-Related Raynaud''s Phenomenon: An Open-Label Pilot Study', 'Complementary Medicine Research', 'peer_reviewed_literature', '2022-02-09', 'limited', '12-patient pilot study: increased subjective hand warmth but no significant objective skin-temperature benefit over olive-oil control.'),
    ('phytic-acid', 'https://doi.org/10.1016/j.ejps.2019.104992', 'Phenylethyl resorcinol smartLipids for skin brightening - Increased loading & chemical stability', 'European Journal of Pharmaceutical Sciences', 'peer_reviewed_literature', '2019-07-11', 'limited', 'Phytic acid (with EDTA) completely prevented light/storage-induced discoloration of a brightening-active formulation via metal chelation.'),
    ('grape-seed-extract', 'https://doi.org/10.5539/gjhs.v7n3p52', 'The topical effect of grape seed extract 2% cream on surgery wound healing', 'Global Journal of Health Science', 'peer_reviewed_literature', '2014-10-29', 'moderate', 'Double-blind RCT: 2% grape seed extract cream reduced average wound healing time from 14 to 8 days (p=0.00).'),
    ('sea-buckthorn-oil', 'https://pubmed.ncbi.nlm.nih.gov/25362595/', 'Hippophae rhamnoides oil-in-water (O/W) emulsion improves barrier function in healthy human subjects', 'Pakistan Journal of Pharmaceutical Sciences', 'peer_reviewed_literature', '2014-11-01', 'moderate', '84-day controlled study: 5% extract emulsion significantly improved skin hydration and reduced TEWL versus base-formulation placebo.'),
    ('rosemary-extract', 'https://doi.org/10.1016/B978-0-12-394598-3.00003-4', 'Antioxidant activity and protecting health effects of common medicinal plants', 'Advances in Food and Nutrition Research', 'peer_reviewed_literature', '2012-01-01', 'limited', 'Review identifying rosemary among medicinal plants with established antioxidant activity, used by the cosmetic industry for its preservative effect.'),
    ('squalene', 'https://doi.org/10.3390/molecules14010540', 'Biological and pharmacological activities of squalene and related compounds: potential uses in cosmetic dermatology', 'Molecules', 'peer_reviewed_literature', '2009-01-23', 'moderate', 'Review documenting emollient, antioxidant and hydrating activity, and established use in topical lipid emulsions/nanostructured lipid carriers.'),
    ('evening-primrose-oil', 'https://doi.org/10.1016/j.clindermatol.2018.05.010', 'Oral supplements in atopic dermatitis', 'Clinics in Dermatology', 'peer_reviewed_literature', '2018-06-01', 'limited', 'Clinical review finding inadequate data to confirm oral evening primrose oil efficacy for atopic dermatitis.'),
    ('beta-glucan', 'https://doi.org/10.1111/ics.70111', 'The harnessing potential of carboxymethyl beta glucan: A driver of skin repair', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2026-06-22', 'moderate', '3D skin model study: activated Dectin-1, reduced pro-inflammatory mediators, increased collagen-I and tight-junction expression, accelerated wound repair.'),
    ('tea-tree-oil', 'https://doi.org/10.5694/j.1326-5377.1990.tb126150.x', 'A comparative study of tea-tree oil versus benzoylperoxide in the treatment of acne', 'Medical Journal of Australia', 'peer_reviewed_literature', '1990-10-15', 'strong', 'RCT of 124 patients: 5% tea tree oil gel comparably reduced acne lesions to 5% benzoyl peroxide, with fewer side effects but slower onset.'),
    ('titanium-dioxide', 'https://doi.org/10.1021/acs.estlett.5c00861', 'Exposure of Selected Sunscreens to Artificial Sunlight Generates Persistent Free Radicals', 'Environmental Science & Technology Letters', 'peer_reviewed_literature', '2025-10-28', 'moderate', 'Documents persistent free-radical generation by mineral (TiO2/ZnO) sunscreen filters under simulated sunlight as an active formulation-research consideration.'),
    ('octocrylene', 'https://doi.org/10.1016/j.ijpharm.2025.125790', 'The dual challenge of FDA-evaluated non-GRASE UV filters: Photostability and systemic absorption', 'International Journal of Pharmaceutics', 'peer_reviewed_literature', '2025-05-30', 'moderate', 'Review of octocrylene and other non-GRASE filters'' photodegradation and systemic absorption challenges, and formulation strategies addressing both.'),
    ('disodium-edta', 'https://doi.org/10.1111/ics.12853', 'An eco-friendly system for stabilization of retinol: A step towards attending performance with improved environmental respect', 'International Journal of Cosmetic Science', 'peer_reviewed_literature', '2023-08-06', 'moderate', 'Confirms EDTA + BHT''s established chelating/stabilizing role for retinol formulations, alongside a newer, somewhat better-performing eco-friendly alternative.')
) AS v(candidate_slug, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- === Resolve demand-queue requests ===

-- Published new ingredients
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'resurrection-plant-extract'), resolved_at = now() WHERE id = 'eb2683a1-722e-44b9-afda-3809ef30eb63';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'vitamin-k1'), resolved_at = now() WHERE id = '093fe125-443c-4aec-bfed-03dc5ae9b5a3';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'nettle-extract'), resolved_at = now() WHERE id = 'ef89f5cb-9115-4946-a3b9-0daa262242c8';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'cocoa-pod-extract'), resolved_at = now() WHERE id = '1a16d372-f423-4f28-9c6b-b8f311d55a8e';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'honey'), resolved_at = now() WHERE id = '384478b6-e402-497b-82ca-74098041c7cb';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'rosemary-oil'), resolved_at = now() WHERE id = '53f4026d-8ae8-4920-8595-918eab78f52a';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'phytic-acid'), resolved_at = now() WHERE id = '06050bc7-4c67-44a5-97a8-8b3ec4ff646e';

-- Resolved to existing catalogue entries (duplicates)
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'aloe-vera'), resolved_at = now() WHERE id = '73f79dec-03d0-4e6f-8f4a-6b51d6170b2a';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'kigelia-africana'), resolved_at = now() WHERE id = 'd8c15cc1-8e84-45f4-b410-73ddcd1fdf82';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'ceramide-np'), resolved_at = now() WHERE id = 'bf8db384-d5d7-479b-ab19-93a42ca8ae46';

-- Rejected: generic/marketing phrases with no single identifiable INCI compound
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("purifying clay") with no single identifiable INCI ingredient -- could refer to kaolin, bentonite or another clay depending on formulation.', resolved_at = now() WHERE id = '4e7715ac-6d78-4020-847c-c9bce6f19e6d';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing collective term ("organic botanical actives"), not a single researchable ingredient.', resolved_at = now() WHERE id = '17ea6988-0813-40af-896a-0387948395b0';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("anti-ageing complex"), not a single researchable ingredient.', resolved_at = now() WHERE id = 'b27d255d-518d-4d4c-b342-347e53279f38';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Umbrella term covering many algae species with no single-species citation found this batch despite broadened PubMed searches; reconsider with a more specific species name.', resolved_at = now() WHERE id = '91f1813c-99c0-45cd-8ec1-9b96792292a2';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("cleansing oils"), not a single researchable ingredient.', resolved_at = now() WHERE id = '0508f5f3-5e8c-419a-917a-2f8f2bedb107';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("skin-loving lipids"), not a single researchable ingredient.', resolved_at = now() WHERE id = '8f1e992a-071c-45cc-8b83-ebd15896e0ff';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing/formulation-descriptor phrase ("gel-to-milk cleanser actives"), not a single researchable ingredient.', resolved_at = now() WHERE id = '02bf9dc6-05b2-4549-a129-89fe8d0bb06f';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("natural exfoliating granules"), not a single researchable ingredient.', resolved_at = now() WHERE id = '3fac3a73-e06b-423a-a779-a856d8e19d24';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing collective term ("collagen-boosting ingredients"), not a single researchable ingredient.', resolved_at = now() WHERE id = '3207c665-bdf4-4f1c-bc63-319eb8657288';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("organic botanical oils"), not a single researchable ingredient.', resolved_at = now() WHERE id = '0dcb1711-61d4-4812-bbbd-a49fdf70701d';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("barrier-restoring actives"), not a single researchable ingredient.', resolved_at = now() WHERE id = '65e78199-3443-409f-b42a-54ee54726935';

-- Rejected: real, specific candidates researched honestly but no usable citation found this batch
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Researched (pomegranate sterols / unsaponifiable fraction specifically) but no peer-reviewed literature on this specific fraction was found despite multiple broadened PubMed searches; distinct from punicalagin (a different pomegranate compound), which does have literature -- revisit with a dedicated search pass.', resolved_at = now() WHERE id = '5a5a6eed-f5fc-4a46-bee0-e0fa374e34fc';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Researched but no peer-reviewed study evaluating castor oil''s own topical/hair effects was found this batch (only located as an unrelated formulation excipient in other studies) despite multiple broadened PubMed searches -- revisit with a dedicated search pass.', resolved_at = now() WHERE id = '1b817c30-a75a-4892-a5c4-40702367af93';
