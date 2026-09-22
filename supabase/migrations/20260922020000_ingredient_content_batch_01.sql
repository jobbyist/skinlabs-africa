-- First content-enrichment batch (Track A, alphabetical cursor start).
-- Real research only: every claim traces to a PubMed-indexed peer-reviewed
-- source or DermNet NZ, retrieved and read this session (see git commit
-- message / INGREDIENT_CONTENT_STATUS.md batch log for the full citation
-- list). Cosmetic-claims-only language throughout. evidence_level graded
-- per the documented criteria (strong/moderate/limited/anecdotal), never
-- defaulted. pregnancy_safe/irritancy_risk left NULL where no source
-- directly addressed them. verification_status stays 'partially_verified'
-- -- never 'verified', which is human-only via the admin Data Quality queue.
--
-- Two catalogue rows in this alphabetical window (AHA/BHA Complex,
-- Antioxidant Complex) are generic category-collective stub names, not
-- real singular compounds -- no genuine literature search is possible for
-- them, so they are intentionally left untouched here rather than given
-- fabricated content. African Potato Extract (Hypoxis) returned zero
-- relevant PubMed results for topical/dermatological use and is also left
-- untouched -- logged as "insufficient evidence" in
-- INGREDIENT_CONTENT_STATUS.md's batch log, not silently skipped.

-- Acetyl Glucosamine (N-Acetyl Glucosamine / NAG)
UPDATE public.ingredients SET
  description = 'N-Acetyl Glucosamine (NAG) is a stable amino-sugar derivative of glucosamine, used in skincare formulations aimed at uneven skin tone for its studied effect on the pigmentation pathway.',
  function_summary = 'In a randomized, double-blind, placebo-controlled split-face trial, 2% topical N-Acetyl Glucosamine reduced the appearance of facial hyperpigmentation over 8 weeks, with a greater effect when combined with 4% niacinamide.',
  typical_concentration_range = 'around 2%, often combined with niacinamide',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1111/j.1473-2165.2007.00295.x',
  source_type = 'peer_reviewed_literature',
  source_date = '2007-03-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = '74dc9fee-8f85-4229-9fd7-2f7a82c10cd1';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('74dc9fee-8f85-4229-9fd7-2f7a82c10cd1', 'https://doi.org/10.1111/j.1473-2165.2007.00295.x', 'Reduction in the appearance of facial hyperpigmentation by topical N-acetyl glucosamine', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2007-03-01', 'moderate', '8-week double-blind, placebo-controlled, split-face RCT: 2% topical NAG reduced facial hyperpigmentation; combination with 4% niacinamide was more effective than NAG alone.'),
('74dc9fee-8f85-4229-9fd7-2f7a82c10cd1', 'https://doi.org/10.1111/j.1468-3083.2011.04130.x', 'Natural options for the management of hyperpigmentation', 'Journal of the European Academy of Dermatology and Venereology', 'peer_reviewed_literature', '2011-05-31', 'moderate', 'Review covering evidence-backed natural depigmenting agents, including N-acetylglucosamine alongside soy, licorice, kojic acid, arbutin and niacinamide.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Acetyl Hexapeptide-8 (Argireline)
UPDATE public.ingredients SET
  description = 'Acetyl Hexapeptide-8 (marketed as Argireline) is a synthetic peptide modeled on part of the SNAP-25 protein, studied for a modest effect on the neuromuscular signaling associated with expression lines -- a mechanism often compared to, but far milder than, botulinum toxin injections.',
  function_summary = 'A randomized, placebo-controlled trial in Chinese subjects found a 48.9% subjective improvement in peri-orbital (crow''s feet) wrinkles after twice-daily application for 4 weeks, versus 0% in the placebo group, with objective skin-roughness measurements also improving.',
  formulation_notes = 'Skin penetration is highly dependent on the delivery vehicle -- research comparing emulsion types found multiple water-in-oil-in-water formulations enhanced delivery into skin compared to simple oil-in-water or water-in-oil emulsions.',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1007/s40257-013-0009-9',
  source_type = 'peer_reviewed_literature',
  source_date = '2013-04-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = 'af11d880-e617-43ad-bb36-771147e9b076';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('af11d880-e617-43ad-bb36-771147e9b076', 'https://doi.org/10.1007/s40257-013-0009-9', 'The anti-wrinkle efficacy of argireline, a synthetic hexapeptide, in Chinese subjects: a randomized, placebo-controlled study', 'American Journal of Clinical Dermatology', 'peer_reviewed_literature', '2013-04-01', 'moderate', 'RCT, 60 subjects, 4 weeks twice-daily application: 48.9% subjective anti-wrinkle efficacy vs 0% placebo; objective roughness parameters significantly decreased.'),
('af11d880-e617-43ad-bb36-771147e9b076', 'https://doi.org/10.1016/j.ejps.2014.12.006', 'Topical delivery of acetyl hexapeptide-8 from different emulsions', 'European Journal of Pharmaceutical Sciences', 'peer_reviewed_literature', '2014-12-09', 'limited', 'Formulation/delivery study: multiple water-in-oil-in-water emulsions significantly increased skin penetration of AH-8 compared to simple O/W and W/O emulsions.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Aloe Vera
UPDATE public.ingredients SET
  description = 'Aloe vera is a succulent plant whose leaf gel has a long history of topical use for soothing and wound-healing purposes, and has been studied in clinical and experimental settings for its effects on skin healing and irritation.',
  function_summary = 'A randomized controlled trial in skin graft patients found topical aloe vera gel significantly sped up wound epithelialization (11.5 vs 13.67 days) compared to placebo, though it did not significantly reduce pain. A broader dermatology review found supportive evidence for use in burns, minor wounds and inflammatory skin conditions, while cautioning that overall clinical evidence for oral and topical aloe vera remains incompletely explored.',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1097/PRS.0000000000004515',
  source_type = 'peer_reviewed_literature',
  source_date = '2018-07-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = 'cfabdbad-2ea6-45df-9bb1-436b97f4ed7f';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('cfabdbad-2ea6-45df-9bb1-436b97f4ed7f', 'https://doi.org/10.1097/PRS.0000000000004515', 'Topical Aloe Vera Gel for Accelerated Wound Healing of Split-Thickness Skin Graft Donor Sites', 'Plastic and Reconstructive Surgery', 'peer_reviewed_literature', '2018-07-01', 'moderate', 'Double-blind RCT + systematic review: aloe vera significantly accelerated donor-site epithelialization (11.5 vs 13.67 days, p<0.05); no significant pain-relief difference.'),
('cfabdbad-2ea6-45df-9bb1-436b97f4ed7f', 'https://pubmed.ncbi.nlm.nih.gov/19218914/', 'Aloe vera in dermatology: a brief review', 'Giornale Italiano di Dermatologia e Venereologia', 'peer_reviewed_literature', '2009-02-01', 'limited', 'Systematic review of 40 studies: supportive evidence for burns, wound healing, psoriasis and other inflammatory conditions; notes topical aloe is not effective for radiation injury or sunburn prevention, and that clinical evidence overall remains incompletely explored.'),
('cfabdbad-2ea6-45df-9bb1-436b97f4ed7f', 'https://dermnetnz.org/topics/aloe-vera-and-the-skin', 'Aloe vera and the skin', 'DermNet NZ', 'ingredient_database', NULL, NULL, 'Consumer-facing dermatology summary of aloe vera''s uses (burns, minor irritation, acne, skin ageing, eczema, psoriasis), side effects and contraindications.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Alpha Arbutin (distinct row from Arbutin below -- alpha-arbutin is a stereoisomer)
UPDATE public.ingredients SET
  description = 'Alpha-arbutin is a synthetically stabilized derivative of hydroquinone (a stereoisomer of arbutin) used in skincare for its tyrosinase-inhibiting, skin-brightening properties, generally regarded as a gentler alternative to hydroquinone itself.',
  function_summary = 'A split-face clinical study in melasma patients found alpha-arbutin delivered via a chitosan-nanoparticle hydrogel produced greater reductions in melasma severity scores than a standard alpha-arbutin hydrogel, supporting its role as a tyrosinase-inhibiting brightening active.',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1080/10717544.2022.2058652',
  source_type = 'peer_reviewed_literature',
  source_date = '2022-12-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = '0b9698d9-5d20-4ca4-8bbe-c691615de080';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('0b9698d9-5d20-4ca4-8bbe-c691615de080', 'https://doi.org/10.1080/10717544.2022.2058652', 'Functionalized chitosan nanoparticles for cutaneous delivery of a skin whitening agent: melasma treatment', 'Drug Delivery', 'peer_reviewed_literature', '2022-12-01', 'moderate', 'Split-face clinical study: alpha-arbutin-loaded chitosan nanoparticle hydrogel outperformed free-drug hydrogel on mMASI scores and epidermal melanin measures in melasma patients.'),
('0b9698d9-5d20-4ca4-8bbe-c691615de080', 'https://doi.org/10.1007/s13346-018-0508-6', 'Polymeric nanoparticles for topical delivery of alpha and beta arbutin: preparation and characterization', 'Drug Delivery and Translational Research', 'peer_reviewed_literature', '2019-04-01', 'limited', 'Formulation/delivery comparison of alpha- and beta-arbutin chitosan nanoparticles -- both showed improved release vs free-form arbutin; not a human efficacy trial.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Arbutin (beta form -- distinct row from Alpha Arbutin above)
UPDATE public.ingredients SET
  description = 'Arbutin is a naturally occurring glycoside (a glycosylated form of hydroquinone), most often derived from bearberry and related plants, used in skincare as a tyrosinase-inhibiting brightening ingredient.',
  function_summary = 'Comparative laboratory studies found arbutin inhibits human tyrosinase, but relatively weakly -- with a half-maximal inhibitory concentration in the millimolar range -- making it markedly less potent in vitro than newer agents like 4-n-butylresorcinol, though it remains a widely used, gentler option in brightening formulations.',
  typical_concentration_range = 'around 1%',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1111/jdv.12051',
  source_type = 'peer_reviewed_literature',
  source_date = '2013-01-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = '20dcf4d2-a287-40c7-be66-76b32a5ac556';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('20dcf4d2-a287-40c7-be66-76b32a5ac556', 'https://doi.org/10.1111/jdv.12051', '4-n-butylresorcinol, a highly effective tyrosinase inhibitor for the topical treatment of hyperpigmentation', 'Journal of the European Academy of Dermatology and Venereology', 'peer_reviewed_literature', '2013-01-01', 'moderate', 'Comparative in vitro/in vivo study: arbutin weakly inhibits human tyrosinase (IC50 in millimolar range) and was the least active agent for melanin-production inhibition among those compared.'),
('20dcf4d2-a287-40c7-be66-76b32a5ac556', 'https://doi.org/10.1016/j.jid.2018.01.019', 'Inhibition of Human Tyrosinase Requires Molecular Motifs Distinctively Different from Mushroom Tyrosinase', 'Journal of Investigative Dermatology', 'peer_reviewed_literature', '2018-02-07', 'moderate', 'Confirms arbutin only weakly inhibits recombinant human tyrosinase relative to newer resorcinyl-thiazole inhibitors.'),
('20dcf4d2-a287-40c7-be66-76b32a5ac556', 'https://dermnetnz.org/topics/bleaching-agents', 'Bleaching creams', 'DermNet NZ', 'ingredient_database', NULL, NULL, 'Lists arbutin 1% (a glycosylated hydroquinone) among botanical bleaching-cream ingredients.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Argan Oil
UPDATE public.ingredients SET
  description = 'Argan oil is a plant oil derived from the kernels of the argan tree (Argania spinosa), native to Morocco, rich in fatty acids and vitamin E, and used in skincare as an emollient.',
  function_summary = 'A randomized controlled trial in postmenopausal women found that both dietary consumption and topical application of argan oil significantly improved measures of skin elasticity over a 60-day period.',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.2147/CIA.S71684',
  source_type = 'peer_reviewed_literature',
  source_date = '2015-01-30',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = '45aaa377-9f65-4cc1-b446-d368b8855e93';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('45aaa377-9f65-4cc1-b446-d368b8855e93', 'https://doi.org/10.2147/CIA.S71684', 'The effect of dietary and/or cosmetic argan oil on postmenopausal skin elasticity', 'Clinical Interventions in Aging', 'peer_reviewed_literature', '2015-01-30', 'moderate', 'RCT, 60 postmenopausal women, 60 days: dietary and/or topical argan oil significantly increased skin elasticity parameters (R2, R5, R7) and decreased resonance running time.'),
('45aaa377-9f65-4cc1-b446-d368b8855e93', 'https://doi.org/10.1111/jocd.14125', 'RCT: adsorbent lotion (incl. argan kernel oil) vs low-potency corticosteroid for intertrigo', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2021-04-18', 'limited', 'Argan oil tested only as one component of a multi-ingredient lotion (alongside tapioca starch, shea extract, aloe, rosehip oil, allantoin) vs 1% hydrocortisone for intertrigo -- not an argan-oil-specific efficacy result.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Ascorbic Acid (Vitamin C)
UPDATE public.ingredients SET
  description = 'Ascorbic acid (L-ascorbic acid), the active form of vitamin C, is a water-soluble antioxidant widely used in skincare for its roles in collagen synthesis and photoprotection, though it is notoriously unstable and requires careful formulation to remain effective.',
  function_summary = 'A double-blind, placebo-controlled clinical trial found that a 5% topical vitamin C cream applied daily for 6 months produced a significant clinical improvement in photoaged skin, including increased skin microrelief density, reduced furrow depth, and ultrastructural evidence of elastic tissue repair.',
  typical_concentration_range = 'around 5% in the clinically studied formulation, though commercial products vary more broadly',
  evidence_level = 'moderate',
  confidence = 'medium',
  source_url = 'https://doi.org/10.1034/j.1600-0625.2003.00008.x',
  source_type = 'peer_reviewed_literature',
  source_date = '2003-06-01',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = 'fbf82a5a-8457-4208-9b3f-a22bb48446d7';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('fbf82a5a-8457-4208-9b3f-a22bb48446d7', 'https://doi.org/10.1034/j.1600-0625.2003.00008.x', 'Topical ascorbic acid on photoaged skin: double-blind study vs. placebo', 'Experimental Dermatology', 'peer_reviewed_literature', '2003-06-01', 'moderate', 'Double-blind RCT, 6 months, 5% vitamin C cream: significant clinical improvement in photoaged skin, increased microrelief density, reduced furrow depth, ultrastructural elastic-tissue repair.'),
('fbf82a5a-8457-4208-9b3f-a22bb48446d7', 'https://doi.org/10.1080/10717544.2021.1886377', 'Topical delivery of l-ascorbic acid spanlastics for stability enhancement and treatment of UVB induced damaged skin', 'Drug Delivery', 'peer_reviewed_literature', '2021-12-01', 'limited', 'Formulation/stability study (rat model): novel delivery vesicle improved L-ascorbic acid stability, skin penetration and protection against UVB photodamage vs plain solution -- preclinical, not a human trial.'),
('fbf82a5a-8457-4208-9b3f-a22bb48446d7', 'https://dermnetnz.org/topics/topical-vitamin-c', 'Vitamin C cream', 'DermNet NZ', 'ingredient_database', NULL, NULL, 'Consumer-facing dermatology summary of topical vitamin C''s use for fine lines and skin appearance.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- African Black Soap
UPDATE public.ingredients SET
  description = 'African black soap is a traditional soap made by combining alkali derived from the ash of plant matter (such as plantain skins or cocoa pods) with vegetable oils, without added synthetic cosmetic ingredients -- long used across West Africa, particularly Nigeria and Ghana, as a gentle cleanser.',
  function_summary = 'A 2021 dermatology review found real evidence that traditional African black soap has antimicrobial activity against Staphylococcal and some Streptococcal organisms, and describes it as gentle and superfatted; the same review notes that many other popularly claimed benefits -- such as anti-acne, exfoliating and scar-fading effects -- remain anecdotal rather than clinically established.',
  evidence_level = 'limited',
  confidence = 'low',
  source_url = 'https://doi.org/10.1111/dth.14870',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-03-10',
  verification_status = 'partially_verified',
  last_verified_at = now()
WHERE id = '8df8bf58-93f1-4f85-9440-433feb9d80af';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary) VALUES
('8df8bf58-93f1-4f85-9440-433feb9d80af', 'https://doi.org/10.1111/dth.14870', 'African black soap: Physiochemical, phytochemical properties, and uses', 'Dermatologic Therapy', 'peer_reviewed_literature', '2021-03-10', 'limited', 'Review: real antimicrobial activity found against Staphylococcal/Streptococcal organisms; other widely claimed benefits (anti-acne, exfoliating, scar-fading) explicitly flagged as anecdotal, not clinically established.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
