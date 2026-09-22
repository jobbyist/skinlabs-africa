-- Ingredients Intelligence content-population, Track A batch 02: 8 real ingredients
-- enriched with genuine PubMed + reputable dermatology-review research (never
-- fabricated). See supabase/INGREDIENT_CONTENT_STATUS.md for the full batch log,
-- live counts, and this batch's 7 generic-collective skip-list additions (Botanical
-- Actives/Brighteners/Extracts/Oil Blend/Oils, Brightening Complex, Broad-Spectrum UV
-- Filters -- non-specific stub names, no research attempted, same reasoning as the
-- existing AHA/BHA Complex / Antioxidant Complex skip-list entries).

-- Bakuchiol
UPDATE public.ingredients SET
  description = 'A meroterpene phenol derived from the seeds of Psoralea corylifolia (babchi), marketed as a plant-derived alternative to retinol.',
  function_summary = 'Retinol-alternative anti-aging active -- functions as a retinol analogue through similar gene-expression effects despite having no structural resemblance to retinoids. Clinical studies show reductions in wrinkle depth, photodamage and post-inflammatory hyperpigmentation comparable to topical retinol, with better tolerability (less scaling/stinging) reported than retinol.',
  typical_concentration_range = '0.5% (concentration used in the head-to-head RCT vs. 0.5% retinol)',
  evidence_level = 'moderate',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/bjd.16918',
  source_type = 'peer_reviewed_literature',
  source_date = '2018-09-21',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '39fd7010-2da3-4e62-999f-ce1f90d4ada9';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('39fd7010-2da3-4e62-999f-ce1f90d4ada9', 'https://doi.org/10.1111/jocd.15420', 'Applications of bakuchiol in dermatology: Systematic review of the literature', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2022-10-31', 'moderate', 'Systematic review of 30 studies (16 pre-clinical, 7 clinical) -- bakuchiol shown effective for photoaging, acne and PIH with a retinol-like mechanism; one adverse-event report of contact dermatitis.'),
  ('39fd7010-2da3-4e62-999f-ce1f90d4ada9', 'https://doi.org/10.1111/bjd.16918', 'Prospective, randomized, double-blind assessment of topical bakuchiol and retinol for facial photoageing', 'British Journal of Dermatology', 'peer_reviewed_literature', '2018-09-21', 'moderate', '44-patient, 12-week RCT: bakuchiol 0.5% cream twice daily vs. retinol 0.5% cream daily -- both significantly reduced wrinkle surface area and hyperpigmentation with no statistical difference; retinol users reported more scaling/stinging.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Baobab Oil
UPDATE public.ingredients SET
  description = 'A seed oil pressed from Adansonia digitata (baobab), rich in oleic, linoleic and palmitic fatty acids, traditionally used across Africa for skin and hair care.',
  function_summary = 'Emollient plant oil -- its fatty-acid profile (free fatty acids, triglycerides, vitamins, antioxidants) is associated with supporting skin barrier function and wound healing per traditional-use literature review; direct clinical-trial data on baobab oil specifically for skin remains limited.',
  evidence_level = 'limited',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/dth.14968',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-05-16',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '7f1eb119-d9ad-44cb-915d-7e094f22d8d3';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('7f1eb119-d9ad-44cb-915d-7e094f22d8d3', 'https://doi.org/10.1111/dth.14968', 'African oils in dermatology', 'Dermatologic Therapy', 'peer_reviewed_literature', '2021-05-16', 'limited', 'Literature review of 7 African plant/seed oils (incl. baobab) used traditionally for skin/scalp care in Nigeria -- constituents linked to barrier function, wound healing and anti-inflammatory effects; traditional-use evidence, not clinical trials.'),
  ('7f1eb119-d9ad-44cb-915d-7e094f22d8d3', 'https://doi.org/10.1039/d5ra02490k', 'A sustainable approach to extracting baobab oil: neat supercritical CO2 optimization', 'RSC Advances', 'peer_reviewed_literature', '2025-06-25', 'limited', 'Confirms baobab seed oil''s fatty-acid profile (oleic 37%, linoleic 29%, palmitic 30%) is suitable for cosmetic applications; an extraction-chemistry study, not a skin-efficacy trial.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Beeswax
UPDATE public.ingredients SET
  description = 'A natural wax secreted by honeybees (Apis mellifera), composed of over 300 constituents including wax esters, hydrocarbons and free fatty acids.',
  function_summary = 'Occlusive/emollient and emulsion-stabilizing ingredient -- forms a barrier on skin that reduces transepidermal water loss; a nanostructured-lipid-carrier gel using beeswax as the solid lipid phase showed 2.8-fold higher skin hydration than a beeswax-free gel on an ex vivo model. Also documented with antimicrobial, anti-inflammatory and wound-healing activity.',
  evidence_level = 'moderate',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/ijms27083486',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-04-13',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '715dfae4-b4f8-4330-b527-fb18a43fd20c';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('715dfae4-b4f8-4330-b527-fb18a43fd20c', 'https://doi.org/10.3390/ijms27083486', 'Beeswax in Pharmaceutical Sciences: A Comprehensive Review', 'International Journal of Molecular Sciences', 'peer_reviewed_literature', '2026-04-13', 'moderate', 'Narrative review: beeswax functions as stiffening agent, viscosity modifier and emulsion stabilizer, forming an occlusive barrier that enhances skin hydration; documented antimicrobial, anti-inflammatory and wound-healing activity.'),
  ('715dfae4-b4f8-4330-b527-fb18a43fd20c', 'https://doi.org/10.3390/gels10070466', 'Functional Nanostructured Lipid Carrier-Enriched Hydrogels Tailored to Repair Damaged Epidermal Barrier', 'Gels', 'peer_reviewed_literature', '2024-07-16', 'moderate', 'Beeswax used as the solid-lipid phase of an NLC hydrogel; provided 2.8-fold higher skin hydration than the beeswax-free gel on an ex vivo porcine ear model, with a measurable occlusion effect.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Buchu Extract
UPDATE public.ingredients SET
  description = 'An extract of Agathosma betulina or A. crenulata (buchu), South African fynbos shrubs long used in traditional medicine and increasingly explored for perfume, flavouring and cosmetic applications.',
  function_summary = 'Traditionally used botanical with demonstrated in vitro antioxidant activity (Trolox equivalent antioxidant capacity assays) and anti-inflammatory activity (COX-1/COX-2 and 5-lipoxygenase enzyme inhibition in lab assays); no human topical dermatology trials have been conducted to date.',
  evidence_level = 'limited',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3389/fphar.2022.813142',
  source_type = 'peer_reviewed_literature',
  source_date = '2022-02-07',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '702d6bf6-bf01-4063-9e54-fdb05037255a';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('702d6bf6-bf01-4063-9e54-fdb05037255a', 'https://doi.org/10.3389/fphar.2022.813142', 'Buchu (Agathosma betulina and A. crenulata): Rightfully Forgotten or Underutilized?', 'Frontiers in Pharmacology', 'peer_reviewed_literature', '2022-02-07', 'limited', 'Review of pharmacological research: moderate antimicrobial and antioxidant activity, COX-1/COX-2 and 5-LO inhibition in vitro; authors note undisclosed extract composition and no randomized, double-blind human trials exist yet.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Bulbine Frutescens
UPDATE public.ingredients SET
  description = 'A succulent plant native to South Africa, traditionally applied to wounds, burns and skin irritation; the leaf sap is a common ingredient in South African skincare and after-sun products.',
  function_summary = 'Wound-healing/soothing botanical -- comparative lab studies found B. frutescens leaf extract promoted keratinocyte migration in an in vitro scratch assay and achieved the highest tissue regeneration (90%) among five compared Bulbine species in a zebrafish caudal-fin regeneration model, consistent with its traditional use for treating wounds.',
  evidence_level = 'limited',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.jep.2024.118901',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-10-05',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'd54e282a-2d69-4364-bf12-0eceae125f3f';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('d54e282a-2d69-4364-bf12-0eceae125f3f', 'https://doi.org/10.1016/j.jep.2024.118901', 'Insights into the wound-healing properties of medicinally important South African Bulbine species', 'Journal of Ethnopharmacology', 'peer_reviewed_literature', '2024-10-05', 'limited', 'Comparative in vitro (HaCaT scratch assay) and in vivo (zebrafish larvae caudal-fin regeneration) study of 5 Bulbine species -- B. frutescens showed the highest regeneration (90%) and was non-cytotoxic at tested concentrations.'),
  ('d54e282a-2d69-4364-bf12-0eceae125f3f', 'https://doi.org/10.2147/NSA.S445116', 'Antihistamine and Wound Healing Potential of Gold Nanoparticles Synthesized Using Bulbine frutescens', 'Nanotechnology, Science and Applications', 'peer_reviewed_literature', '2024-03-13', 'limited', 'Freeze-dried B. frutescens leaf-juice extract stimulated wound closure in HaCaT keratinocyte cells and significantly inhibited histamine production, supporting its traditional use for eczema/wound care.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Caffeine
UPDATE public.ingredients SET
  description = 'A naturally occurring xanthine alkaloid found in coffee, tea and guarana, used topically in skincare for its antioxidant and penetration-modifying properties.',
  function_summary = 'Topical active readily absorbed through skin -- pharmaceutical-science studies confirm real percutaneous absorption and show it can be used as a marker/enhancer compound in penetration research; commonly included in eye creams and anti-redness/anti-cellulite formulations, though these specific cosmetic-efficacy claims have less direct clinical-trial support than its absorption behaviour.',
  evidence_level = 'limited',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.xphs.2023.09.025',
  source_type = 'peer_reviewed_literature',
  source_date = '2023-10-04',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '361e49c5-0407-4bfe-a650-22266abb50b4';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('361e49c5-0407-4bfe-a650-22266abb50b4', 'https://doi.org/10.1016/j.xphs.2023.09.025', 'Solvent and Crystallization Effects on the Dermal Absorption of Hydrophilic and Lipophilic Compounds', 'Journal of Pharmaceutical Sciences', 'peer_reviewed_literature', '2023-10-04', 'limited', 'In vitro human-skin permeation study using radiolabeled caffeine (among other solutes) -- confirms real dermal absorption and how solvent/crystallization state affects permeation.'),
  ('361e49c5-0407-4bfe-a650-22266abb50b4', 'https://doi.org/10.1002/adhm.202402836', 'Casting New Light on the Retinol and Retinyl Palmitate Functions as Chemical Enhancers for Transdermal/Topical Drug Delivery', 'Advanced Healthcare Materials', 'peer_reviewed_literature', '2024-11-24', 'limited', 'Used caffeine as a marker compound to show retinol/retinyl palmitate significantly enhance skin penetration -- mechanistic evidence for caffeine''s own skin permeability rather than a caffeine efficacy trial.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Calendula Oil
UPDATE public.ingredients SET
  description = 'An oil infusion or extract of Calendula officinalis (marigold) flowers, traditionally used to support skin healing and soothe irritation.',
  function_summary = 'Wound-healing and skin-soothing botanical -- randomized clinical trials show Calendula-based preparations can speed epithelialization of acute hand wounds and, combined with low-level laser therapy, support diabetic foot ulcer healing and pain relief. Irritancy and allergic contact dermatitis have been reported in sensitized individuals, particularly with medicinal-strength use.',
  evidence_level = 'moderate',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1080/21688370.2021.1994822',
  source_type = 'peer_reviewed_literature',
  source_date = '2021-10-21',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'fb693fd9-e2d6-4369-ad8e-91461f2d6a65';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('fb693fd9-e2d6-4369-ad8e-91461f2d6a65', 'https://doi.org/10.1080/21688370.2021.1994822', 'Treatment of acute wounds in hand with Calendula officinalis L.: A randomized trial', 'Tissue Barriers', 'peer_reviewed_literature', '2021-10-21', 'moderate', '38-wound RCT: standardized Calendula extract shortened epithelization time (8.6 vs 13.2 days) and increased healing speed vs. mineral oil control (p<0.05).'),
  ('fb693fd9-e2d6-4369-ad8e-91461f2d6a65', 'https://doi.org/10.1590/S0080-623420160000500013', 'Low-level laser therapy and Calendula officinalis in repairing diabetic foot ulcers', 'Revista da Escola de Enfermagem da USP', 'peer_reviewed_literature', '2016-01-01', 'moderate', '32-patient RCT: low-level laser therapy combined with Calendula officinalis oil reduced pain and accelerated diabetic foot ulcer tissue repair.'),
  ('fb693fd9-e2d6-4369-ad8e-91461f2d6a65', 'https://dermnetnz.org/topics/marigold', 'Marigold (Calendula officinalis)', 'DermNet NZ', 'ingredient_database', NULL, NULL, 'Documents reported irritancy/allergy to Calendula officinalis, including a study finding 2% of 400+ patients allergic, with sensitisation associated with medicinal use.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Centella Asiatica
UPDATE public.ingredients SET
  description = 'Also known as Gotu Kola or "cica," a medicinal herb in the Apiaceae family long used in Ayurvedic, Chinese and Unani traditions for wound healing and skin conditions.',
  function_summary = 'Wound-healing, barrier-repair and soothing active -- its triterpenoid compounds (asiaticoside, madecassoside, asiatic acid, madecassic acid) stimulate fibroblast proliferation, collagen synthesis and angiogenesis. A diabetic-rat burn-wound study found Centella extract-based cream/ointment reduced wound area and inflammatory markers while increasing regenerative growth factors; a peer-reviewed dermatology review additionally cites a systematic review of double-blind RCTs (172 women) finding Centella-based creams reduced periorbital/lip wrinkles and improved hydration with fewer adverse events than tretinoin.',
  evidence_level = 'moderate',
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s10735-026-10788-1',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-04-04',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '61edec7f-3262-43f8-897e-5cdd3bb839b9';

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('61edec7f-3262-43f8-897e-5cdd3bb839b9', 'https://doi.org/10.1007/s10735-026-10788-1', 'Effects of Centella asiatica extract on burn wound healing in streptozotocin-induced diabetic rats', 'Journal of Molecular Histology', 'peer_reviewed_literature', '2026-04-04', 'moderate', 'Diabetic-rat burn model: topical 2.5% Centella asiatica cream/ointment significantly reduced wound area and TNF-alpha while increasing FGF-2, EGF, VEGF and IGF-1 expression vs. untreated diabetic-burn controls (p<0.05).'),
  ('61edec7f-3262-43f8-897e-5cdd3bb839b9', 'https://jintegrativederm.org/doi/10.64550/joid.mjyk2r15', 'A review of the dermatologic activity and applications of Centella asiatica', 'Journal of Integrative Dermatology', 'peer_reviewed_literature', NULL, 'moderate', 'Narrative review citing a systematic review of 5 double-blind RCTs (172 women) finding Centella-based creams/gels reduced periorbital and lip wrinkles and improved hydration with fewer adverse events than tretinoin; also covers anti-inflammatory, antioxidant and hair-growth mechanisms.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;
