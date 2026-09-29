-- Weekly Ingredients Intelligence pipeline, firing 1 (trig_012CnJXfuEkZxbUMwdfTBQg2,
-- 2026-09-29): processes the demand-driven ingredient_generation_requests queue
-- (22 pending rows accumulated since the queue was last drained on 2026-09-22)
-- as priority source, then adds real, cited ingredients from
-- INGREDIENT_EXPANSION_CANDIDATES.md to clear this week's 25+ target. Research:
-- PubMed peer-reviewed literature (via mcp__PubMed__*) plus Firecrawl web search
-- for two Southern African regional oils PubMed doesn't directly index.
-- verification_status stays 'partially_verified' (human-only for 'verified').
-- No refresh-rotation budget spent this firing -- the demand-queue triage plus
-- 25 new-ingredient research consumed the full session budget.

-- === New ingredients (25) ===

INSERT INTO public.ingredients (slug, inci_name, common_name, category, description, function_summary, typical_concentration_range, evidence_level, verification_status, source_url, source_type, source_date, confidence, last_verified_at)
VALUES
  ('rose-extract', 'Rosa Damascena Extract', 'Rose Extract', 'soothing-botanical',
   'An extract from Rosa damascena (damask rose), distinct from rosewater/rose hydrosol, used in skincare for its soothing and antioxidant properties.',
   'According to PubMed, a study developing a liposomal nano-encapsulated Rosa damascena callus extract for topical wound-healing found significant improvement in wound closure versus the plain marketed extract in animal models, with no skin toxicity or irritation observed -- real evidence for rose extract''s soothing/tissue-repair properties, though from a specialized callus-extract preparation rather than a simple leaf/petal extract.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.2174/0122117385417799251208214954', 'peer_reviewed_literature', '2026-04-08', 'low'::confidence_level, now()),

  ('chamomile-extract', 'Chamomilla Recutita (Matricaria) Flower Extract', 'Chamomile Extract', 'soothing-botanical',
   'A classic soothing botanical extract from Matricaria recutita (German chamomile), source of the anti-inflammatory compound bisabolol.',
   'Commonly used as a calming, anti-inflammatory botanical. According to PubMed, a randomized double-blind trial in head-and-neck cancer patients undergoing radiotherapy compared a liposomal gel with and without chamomile extract for preventing radiation dermatitis; no statistically significant difference was found between groups, though the chamomile group showed lower symptom burden and lower-grade dermatitis, suggesting a modest but not conclusively proven protective effect in this specific high-irritation context.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.radonc.2024.110440', 'peer_reviewed_literature', '2024-07-19', 'low'::confidence_level, now()),

  ('manketti-oil', 'Schinziophyton Rautanenii Seed Oil', 'Manketti Oil (Mungongo Oil)', 'barrier-lipid',
   'A cold-pressed seed oil from Schinziophyton rautanenii (also called mungongo, native to Southern Africa: Zambia, Angola, Namibia, Botswana, Zimbabwe), traditionally used as a skin cleanser, moisturizer and body rub.',
   'Traditionally used as a lightweight facial/body oil. A peer-reviewed study characterizing mungongo cold-pressed oil found it rich in unsaturated fatty acids (elaeostearic acid, linoleic acid, oleic acid), and documented its traditional Southern African use as a skin cleanser and moisturizer, concluding the oil has real potential for cosmetic-industry applications -- fatty-acid-composition and traditional-use evidence, not a controlled clinical efficacy trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.17660/ActaHortic.2007.756.43', 'peer_reviewed_literature', '2007-11-01', 'low'::confidence_level, now()),

  ('yangu-oil', 'Trichilia Emetica Seed Oil', 'Yangu Oil (Mafura Butter)', 'barrier-lipid',
   'A seed/kernel oil from Trichilia emetica (known regionally as mafura or yangu oil across Southern and East Africa), used in skincare as an emollient rich in oleic acid and vitamin E-family tocols.',
   'According to PubMed, a comparative analysis of Trichilia emetica and T. dregeana mafura butter oils (South African-sourced) found kernel oils rich in oleic acid (up to 47.6%) and alpha-tocotrienol, with strong oxidative stability, explicitly noting the oils are gaining recognition in the cosmeceutical industry for cosmetic and nutraceutical formulations -- real fatty-acid/antioxidant-composition evidence, not a controlled skin-efficacy trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/plants14193071', 'peer_reviewed_literature', '2025-10-04', 'low'::confidence_level, now()),

  ('kigelia-africana', 'Kigelia Africana Fruit Extract', 'Kigelia Africana (Sausage Tree)', 'soothing-botanical',
   'An extract from Kigelia africana (the "sausage tree"), a pan-African traditional medicinal plant used in skincare for its antioxidant and anti-inflammatory properties.',
   'According to PubMed, a phytochemistry and pharmacology review of Kigelia africana documented confirmed anti-inflammatory, analgesic and antioxidant activity across extracts of different plant parts, roughly 150 characterized bioactive compounds, and noted the plant''s recognized role in skin-care maintenance has already resulted in commercial skin formulations -- a comprehensive review of real pharmacological data rather than a single controlled clinical trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.jep.2016.05.049', 'peer_reviewed_literature', '2016-05-21', 'low'::confidence_level, now()),

  ('cbd', 'Cannabidiol', 'CBD', 'soothing-botanical',
   'Cannabidiol (CBD), a non-intoxicating cannabinoid compound, used topically in skincare for its purported calming and anti-inflammatory properties.',
   'According to PubMed, a randomized open-label trial of topical cannabis balms (CBD versus THC) in breast cancer survivors with aromatase-inhibitor-associated joint pain found both balms were feasible and well-tolerated on skin over 2-4 weeks of hand application, with only minor skin irritation reported by 24% of participants -- real topical safety/tolerability evidence from a musculoskeletal-symptom trial, not a facial-skincare efficacy study.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1177/25785125251398286', 'peer_reviewed_literature', '2025-12-29', 'low'::confidence_level, now()),

  ('sodium-lactate', 'Sodium Lactate', NULL, 'humectant',
   'The sodium salt of lactic acid, a genuine component of skin''s natural moisturizing factor (NMF), used in skincare as a humectant and pH adjuster.',
   'A natural moisturizing factor (NMF) component. According to PubMed, a controlled study of sodium lauryl sulphate-induced barrier disruption found lactate (along with ornithine and urea) was among the NMF components that actually increased in response to surfactant exposure and normalized fastest during skin recovery -- evidence for lactate''s physiological role in the skin''s own moisture-regulation system, from a barrier-disruption study rather than a topical-supplementation trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1111/ics.12101', 'peer_reviewed_literature', '2013-11-20', 'low'::confidence_level, now()),

  ('lactobionic-acid', 'Lactobionic Acid', NULL, 'exfoliant-aha',
   'A polyhydroxy acid (PHA) derived from lactose, valued in skincare for a gentler exfoliation and moisturizing profile than classic AHAs.',
   'Commonly used as a gentle exfoliant and antioxidant, suited to sensitive skin. According to PubMed, a literature review of lactic and lactobionic acids found both compounds bind substantial water and act as antioxidants through matrix-metalloproteinase inhibition and metal-chelating properties, while maintaining epidermal barrier integrity -- making lactobionic acid usable even on sensitive, couperose-prone skin.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1111/ijd.14202', 'peer_reviewed_literature', '2018-09-30', 'medium'::confidence_level, now()),

  ('astaxanthin', 'Astaxanthin', NULL, 'antioxidant',
   'A carotenoid antioxidant, often algae-derived, used in skincare to help neutralize reactive oxygen species from UV, visible light and pollution exposure.',
   'According to PubMed, a 12-week open-label clinical study of a topical antioxidant serum containing vitamin C, astaxanthin, fermented turmeric and vitamin E found all 32 subjects showed improvement in overall skin quality, with all subjects showing improved fine-line appearance by week 12 -- real clinical evidence for the multi-antioxidant formulation, not astaxanthin tested in isolation.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1111/jocd.15967', 'peer_reviewed_literature', '2023-08-22', 'low'::confidence_level, now()),

  ('ergothioneine', 'Ergothioneine', NULL, 'antioxidant',
   'A naturally occurring, stable sulfur-containing amino-acid antioxidant, often derived from fungi, used topically for its cytoprotective and anti-inflammatory properties.',
   'According to PubMed, a controlled study in rats found topically applied L-(+)-ergothioneine to the periwound region significantly accelerated wound healing versus untreated controls (predicted >90% healing by day 15 versus ~70% for controls), supporting its role as a transdermally active antioxidant for skin repair -- a real animal-model efficacy study, human clinical trial data specific to ergothioneine is still limited.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/ijms27146102', 'peer_reviewed_literature', '2026-07-08', 'medium'::confidence_level, now()),

  ('glutathione', 'Glutathione', NULL, 'brightening',
   'A tripeptide antioxidant naturally produced by the body, marketed in skincare (oral, topical and intravenous forms) for skin-brightening/lightening effects.',
   'Commonly used as a skin-lightening/brightening active. According to PubMed, a narrative review evaluating oral, topical and intravenous glutathione for skin lightening found oral administration produces significant but variable melanin reduction with limited side effects, and topical formulations provide good-level melanin reduction with variable sustainability -- intravenous use carries serious safety concerns (anaphylaxis, hepatotoxicity) and is explicitly flagged as needing caution, a real safety distinction worth knowing before choosing a delivery form.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.7759/cureus.78045', 'peer_reviewed_literature', '2025-01-27', 'medium'::confidence_level, now()),

  ('egcg', 'Epigallocatechin Gallate (EGCG)', 'EGCG / Green Tea Catechin', 'antioxidant',
   'The primary active catechin in green tea, a potent polyphenol antioxidant, distinct from the existing generic "Green Tea Extract" catalogue entry.',
   'According to PubMed, a study developing an injectable collagen hydrogel physically crosslinked with EGCG found the hydrogel showed excellent skin compatibility and prolonged surface retention with moisturizing effects, leveraging EGCG''s established skin-health benefits alongside collagen for topical delivery -- real formulation-science evidence for EGCG as a functional topical ingredient beyond its antioxidant reputation alone.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1021/acs.biomac.5c01683', 'peer_reviewed_literature', '2025-11-13', 'low'::confidence_level, now()),

  ('quercetin', 'Quercetin', NULL, 'antioxidant',
   'A flavonoid antioxidant found in many fruits and vegetables, studied in skincare for photoprotective and anti-aging properties.',
   'According to PubMed, a study developing a quercetin nano-emulsion for topical delivery found it significantly reduced UVA-induced photoaging markers in both human skin fibroblasts and a mouse model -- 73% reduction in senescence-associated markers, 66% reduction in reactive oxygen species, and a 30.6% reduction in UVA-induced skin-fold thickening in vivo, via modulation of the NRF2/NF-kB signaling pathway -- real mechanistic and in vivo evidence supporting quercetin as a photoprotective active once delivery challenges (poor solubility, low skin permeability) are addressed via formulation.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/ph19050746', 'peer_reviewed_literature', '2026-05-09', 'medium'::confidence_level, now()),

  ('linoleic-acid', 'Linoleic Acid', NULL, 'barrier-lipid',
   'An essential omega-6 fatty acid and key structural component of skin barrier ceramides, commonly supplied via linoleic-acid-rich plant oils.',
   'According to PubMed, a review of linoleic acid''s role in skin and hair health found it is metabolized into ceramide components essential for barrier function, and that skin diseases including acne, atopic dermatitis and psoriasis are associated with disordered linoleic acid metabolism -- topically applied linoleic acid or linoleic-acid-rich oils showed skin-barrier repair, wound-healing, photoprotective and anti-inflammatory activity in animal/cell-model studies, with clinical human trial data still an active research area.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/ijms26010246', 'peer_reviewed_literature', '2024-12-30', 'medium'::confidence_level, now()),

  ('oleic-acid', 'Oleic Acid', NULL, 'barrier-lipid',
   'An omega-9 fatty acid common in plant oils, used in skincare both as an emollient and as a penetration enhancer for other actives.',
   'Commonly used as an emollient and permeation enhancer. According to PubMed, a study developing a polarity-induced ceramide liposome delivery system found oleic acid worked synergistically with ceramide and lecithin to disrupt stratum corneum lipid structure and increase membrane fluidity, significantly enhancing skin delivery of active ingredients in both in vitro and clinical testing -- real evidence for oleic acid''s penetration-enhancing mechanism, distinct from claims about oleic acid as a standalone moisturizing ingredient.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.ijpharm.2025.126360', 'peer_reviewed_literature', '2025-11-06', 'low'::confidence_level, now()),

  ('phytosphingosine', 'Phytosphingosine', NULL, 'barrier-lipid',
   'A ceramide precursor/component naturally occurring in the skin barrier, used in skincare formulations for barrier repair.',
   'According to PubMed, a 28-day clinical trial of a novel N-acyl-phytosphingosine ceramide (synthesized from marula oil-derived fatty acids) found topical application significantly improved barrier function in 32 subjects with barrier-compromised skin -- reduced transepidermal water loss and erythema, increased skin thickness and density, matching or exceeding a conventional ceramide comparator, with increased expression of the barrier proteins filaggrin and loricrin.',
   '0.05% (studied concentration in the clinical trial)', 'moderate', 'partially_verified', 'https://doi.org/10.2147/CCID.S586054', 'peer_reviewed_literature', '2026-03-05', 'medium'::confidence_level, now()),

  ('dimethicone', 'Dimethicone', NULL, 'barrier-lipid',
   'A silicone-based occlusive ingredient that forms a breathable barrier film on skin, widely used as a skin protectant and in moisturizers.',
   'According to PubMed, a randomized crossover trial in health care workers found dimethicone cream (compared with hydrocolloid dressing and N95-mask-alone conditions) significantly reduced adverse skin reactions from prolonged N95 mask wear, without interfering with mask seal integrity -- real clinical evidence for dimethicone''s protective, barrier-forming function under mechanical/occlusive stress, a different use case from its more common role as a lightweight moisturizer emollient.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1093/milmed/usae202', 'peer_reviewed_literature', '2024-11-05', 'medium'::confidence_level, now()),

  ('petrolatum', 'Petrolatum', NULL, 'barrier-lipid',
   'A classic, extensively studied occlusive barrier agent (petroleum jelly), used in skincare and wound care to prevent water loss and support healing.',
   'Commonly used as an occlusive moisturizer and post-procedure wound protectant. According to PubMed, a comparative split-face pilot study after ablative fractional CO2 laser resurfacing found white petrolatum (combined with spring thermal water) performed as a reliable, biocompatible primary wound dressing, though a newer film-forming gel formula showed better performance on several clinical parameters during the earliest, most delicate healing phase.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1111/jdv.14446', 'peer_reviewed_literature', '2017-08-04', 'medium'::confidence_level, now()),

  ('magnesium-ascorbyl-phosphate', 'Magnesium Ascorbyl Phosphate', NULL, 'brightening',
   'A stable, water-soluble vitamin C derivative used in skincare for brightening and antioxidant benefits, better tolerated than L-ascorbic acid for some skin types.',
   'According to PubMed, a systematic review of vitamin C''s clinical dermatology applications found magnesium ascorbyl phosphate (alongside ascorbyl palmitate) provides rapid pigment-lightening effects when formulated as an emulgel, and works well paired with procedural delivery methods like microneedling -- part of a broader review confirming multiple stable vitamin C derivatives each have their own validated niche depending on skin type and formulation goals.',
   NULL, 'moderate', 'partially_verified', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13588479/', 'peer_reviewed_literature', '2026-07-01', 'medium'::confidence_level, now()),

  ('sulfur', 'Sulfur', NULL, 'sebum-regulator',
   'A long-used keratolytic and sebum-regulating mineral ingredient, historically one of the earliest topical treatments for acne-prone skin.',
   'A traditional keratolytic/sebum-regulating agent for acne-prone skin. According to PubMed, a historical review of American acne treatment traces sulfur preparations back to some of the earliest rational (non-humoral) topical acne therapies from the late 19th and early 20th centuries, predating antibiotic and retinoid-era treatments -- real historical/traditional-use documentation; modern controlled clinical trial data specific to sulfur alone is comparatively limited versus newer acne actives.',
   NULL, 'anecdotal', 'partially_verified', 'https://doi.org/10.1016/j.clindermatol.2025.11.001', 'peer_reviewed_literature', '2025-11-13', 'low'::confidence_level, now()),

  ('bisabolol', 'Alpha-Bisabolol', 'Bisabolol', 'soothing-botanical',
   'A chamomile-derived anti-inflammatory and soothing compound, one of the primary active constituents responsible for chamomile''s calming skincare reputation.',
   'According to PubMed, a controlled clinical study of topical anti-inflammatory compounds used bisabolol (described as "the active component of chamomile") as an active benchmark comparator, finding it significantly inhibited methyl-nicotinate-induced erythema in human skin -- while a newer Evodia rutaecarpa biomimetic mixture was found to be even more potent, this study establishes bisabolol''s own real topical anti-inflammatory efficacy as the baseline it was measured against.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1016/j.jdermsci.2005.12.009', 'peer_reviewed_literature', '2006-01-19', 'medium'::confidence_level, now()),

  ('colloidal-oatmeal', 'Avena Sativa (Oat) Kernel Flour', 'Colloidal Oatmeal', 'soothing-botanical',
   'An FDA-recognized skin protectant made from finely ground oat kernels, distinct from the existing "Oat Bran Extract" catalogue entry, widely used for soothing sensitive and eczema-prone skin.',
   'According to PubMed, an open-label clinical study of a 1% colloidal-oatmeal cream and baby-wash regimen in children with mild-to-moderate atopic dermatitis found significant improvements in eczema severity scores, quality of life and pruritus as early as day 1, sustained through 28 days of twice-daily use, with skin barrier measures significantly improved at most study visits.',
   '1% (studied concentration in the pediatric clinical trial)', 'strong', 'partially_verified', 'https://doi.org/10.36849/JDD.9095', 'peer_reviewed_literature', '2025-10-01', 'high'::confidence_level, now()),

  ('bifida-ferment-lysate', 'Bifida Ferment Lysate', NULL, 'probiotic',
   'A fermented, probiotic-derived ingredient made from Bifidobacterium fermentation, studied in skincare for microbiome-supportive and skin-brightening properties.',
   'According to PubMed, a study of Bifidobacterium longum fermentation-lysate extracts (isolated from a Chinese centenarian) found the lysates efficiently reduced melanin production in both cell-culture and zebrafish-embryo models, downregulated melanogenesis-related gene expression, and showed antioxidant activity against oxidative stress -- real preclinical evidence supporting the ingredient class''s brightening/antioxidant potential, not yet confirmed in human clinical trials.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/ijms241612810', 'peer_reviewed_literature', '2023-08-15', 'low'::confidence_level, now()),

  ('avobenzone', 'Avobenzone', NULL, 'uv-filter',
   'A broad-spectrum chemical UVA filter widely used in sunscreens, known for a photostability challenge that formulators address with stabilizing co-ingredients or encapsulation.',
   'According to PubMed, a study encapsulating avobenzone in polymeric nanocapsules using a natural palm oil as the oily core found the encapsulated avobenzone retained 51-52% of its initial UV-filtering content after 48 hours of UVA exposure, versus only 10% retention for free (non-encapsulated) avobenzone -- real evidence for how modern delivery-system formulation meaningfully improves avobenzone''s well-documented photostability limitation.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/molecules31173022', 'peer_reviewed_literature', '2026-08-28', 'medium'::confidence_level, now()),

  ('phenoxyethanol', 'Phenoxyethanol', NULL, 'preservative',
   'One of the most widely used cosmetic preservatives, valued for a broad-spectrum antimicrobial profile and an extensive safety review history.',
   'According to PubMed, a human volunteer study measuring dermal penetration of 2-phenoxyethanol found it is rapidly absorbed transdermally (about 45% dermal resorption rate) and extensively metabolized and eliminated in urine within 48 hours, establishing detailed real-world toxicokinetic data that supports its continued safety-substantiated use as a cosmetic preservative at regulated concentrations.',
   NULL, 'strong', 'partially_verified', 'https://doi.org/10.1007/s00204-024-03938-5', 'peer_reviewed_literature', '2024-12-24', 'high'::confidence_level, now())
ON CONFLICT (slug) DO NOTHING;

-- === Multi-source citations (1-2 per ingredient, matching the description above) ===

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
SELECT i.id, v.source_url, v.source_title, v.publisher, 'peer_reviewed_literature'::data_source_type, v.publication_date::date, v.evidence_level::evidence_level, v.evidence_summary
FROM (VALUES
  ('rose-extract', 'https://doi.org/10.2174/0122117385417799251208214954', 'From Plant to Nano-Clinic: Advancing Wound Healing with Nano-Encapsulated Rosa damascena Callus Extract', 'Pharmaceutical Nanotechnology', '2026-04-08', 'limited', 'Liposomal nano-encapsulated Rosa damascena callus extract significantly improved wound healing versus the marketed extract in animal models, with no skin toxicity or irritation.'),
  ('chamomile-extract', 'https://doi.org/10.1016/j.radonc.2024.110440', 'Comparison of liposomal gel with and without addition of chamomile for prevention of radiation dermatitis in head and neck cancer patients: A randomized controlled trial', 'Radiotherapy and Oncology', '2024-07-19', 'limited', '60-participant double-blind RCT found no statistically significant difference between chamomile and control liposomal gel for radiation dermatitis, though the chamomile group had lower symptom burden.'),
  ('manketti-oil', 'https://doi.org/10.17660/ActaHortic.2007.756.43', 'Mungongo Cold Pressed Oil (Schinziophyton rautanenii): A New Natural Product with Potential Cosmetic Applications', 'Acta Horticulturae (Juliani, Koroch, Simon, Wamulwange)', '2007-11-01', 'limited', 'Characterized mungongo/manketti seed oil composition (rich in elaeostearic, linoleic and oleic acids) and documented its traditional Southern African use as a skin cleanser and moisturizer.'),
  ('yangu-oil', 'https://doi.org/10.3390/plants14193071', 'Comparative Analysis of Mafura Butter Oils from Trichilia emetica and Trichilia dregeana Extracted by Screw-Press from Seeds Collected in KwaZulu-Natal Province of South Africa', 'Plants (Basel) (Mabaso, Buthelezi, Zharare)', '2025-10-04', 'limited', 'South African-sourced Trichilia emetica/dregeana kernel and aril oils showed strong oxidative stability and rich oleic acid/tocol content, explicitly noted as gaining cosmeceutical-industry recognition.'),
  ('kigelia-africana', 'https://doi.org/10.1016/j.jep.2016.05.049', 'Kigelia africana (Lam.) Benth. (Sausage tree): Phytochemistry and pharmacological review of a quintessential African traditional medicinal plant', 'Journal of Ethnopharmacology', '2016-05-21', 'limited', 'Comprehensive review confirming anti-inflammatory, analgesic, antioxidant and anticancer activity across ~150 characterized bioactive compounds; notes existing commercial skin formulations.'),
  ('cbd', 'https://doi.org/10.1177/25785125251398286', 'A Randomized, Open-Label Trial to Assess Feasibility and Tolerability of Topical Cannabis Balms for the Treatment of Aromatase Inhibitor-Associated Musculoskeletal Syndrome (AIMSS)', 'Cannabis and Cannabinoid Research', '2025-12-29', 'limited', '21-participant RCT: topical CBD and THC balms applied 3x daily for 2-4 weeks were feasible and well-tolerated, with minor skin irritation in 24% of participants.'),
  ('sodium-lactate', 'https://doi.org/10.1111/ics.12101', 'Immediate and extended effects of sodium lauryl sulphate exposure on stratum corneum natural moisturizing factor', 'International Journal of Cosmetic Science', '2013-11-20', 'limited', 'Lactate was among the NMF components that increased (rather than decreased) in response to surfactant-induced barrier disruption and normalized fastest during skin recovery.'),
  ('lactobionic-acid', 'https://doi.org/10.1111/ijd.14202', 'Lactic and lactobionic acids as typically moisturizing compounds', 'International Journal of Dermatology', '2018-09-30', 'moderate', 'Literature review: lactobionic and lactic acids bind substantial water, act as antioxidants via MMP inhibition/chelation, and maintain epidermal barrier integrity even on sensitive/couperose skin.'),
  ('astaxanthin', 'https://doi.org/10.1111/jocd.15967', 'A clinical evaluation of the efficacy and tolerability of a novel topical antioxidant formulation featuring vitamin C, astaxanthin, and fermented turmeric', 'Journal of Cosmetic Dermatology', '2023-08-22', 'limited', '32-subject, 12-week open-label study of a multi-antioxidant serum containing astaxanthin found overall skin quality and fine-line improvement in all subjects.'),
  ('ergothioneine', 'https://doi.org/10.3390/ijms27146102', 'Unveiling and Benefits of Topically Applied l-(+)-Ergothioneine in Periwound Region', 'International Journal of Molecular Sciences', '2026-07-08', 'moderate', 'Rat wound-healing study: topical ergothioneine in the periwound region significantly accelerated healing (>90% predicted healing by day 15 vs ~70% for controls).'),
  ('glutathione', 'https://doi.org/10.7759/cureus.78045', 'Exploring the Safety and Efficacy of Glutathione Supplementation for Skin Lightening: A Narrative Review', 'Cureus', '2025-01-27', 'moderate', 'Narrative review: oral and topical glutathione both show real melanin-reduction efficacy with acceptable safety; intravenous use carries serious risks (anaphylaxis, hepatotoxicity).'),
  ('egcg', 'https://doi.org/10.1021/acs.biomac.5c01683', 'Facile and Rapid Preparation of Injectable Collagen Hydrogel Mediated by EGCG Physical Crosslinking', 'Biomacromolecules', '2025-11-13', 'limited', 'EGCG-crosslinked collagen hydrogel showed excellent skin compatibility and prolonged moisturizing surface retention in topical application testing.'),
  ('quercetin', 'https://doi.org/10.3390/ph19050746', 'Quercetin Emulsion Ameliorates UVA-Induced Skin via Modulation of NRF2/NF-kB Signaling Pathways', 'Pharmaceuticals (Basel)', '2026-05-09', 'moderate', 'Quercetin nano-emulsion reduced UVA-induced photoaging markers by 66-73% in human fibroblasts and reduced skin-fold thickening by 30.6% in a mouse model via NRF2/NF-kB modulation.'),
  ('linoleic-acid', 'https://doi.org/10.3390/ijms26010246', 'The Role of Linoleic Acid in Skin and Hair Health: A Review', 'International Journal of Molecular Sciences', '2024-12-30', 'moderate', 'Review confirms linoleic acid''s essential role in barrier ceramide synthesis; disordered LA metabolism is linked to acne, atopic dermatitis and psoriasis; topical LA shows barrier-repair activity in preclinical models.'),
  ('oleic-acid', 'https://doi.org/10.1016/j.ijpharm.2025.126360', 'Polarity-induced intermolecular association of ceramide liposomes for enhanced skin delivery', 'International Journal of Pharmaceutics', '2025-11-06', 'limited', 'Oleic acid worked synergistically with ceramide/lecithin to enhance skin permeability in a delivery-system study, with in vitro and clinical confirmation of improved active-ingredient delivery.'),
  ('phytosphingosine', 'https://doi.org/10.2147/CCID.S586054', 'Efficacy Evaluation of N-Acyl-Phytosphingosine Prepared from Marula Oil Derived Fatty Acids in Skin Barrier Repair', 'Clinical, Cosmetic and Investigational Dermatology', '2026-03-05', 'moderate', '28-day, 32-subject clinical trial: 0.05% N-acyl-phytosphingosine cream significantly improved TEWL, erythema, skin thickness and density in barrier-compromised skin.'),
  ('dimethicone', 'https://doi.org/10.1093/milmed/usae202', 'Impact of Hydrocolloid Dressing and Moisturizing Cream as Facial Skin Protectants Among Health Care Workers', 'Military Medicine', '2024-11-05', 'moderate', '73-participant randomized crossover trial: dimethicone cream significantly reduced adverse skin reactions from prolonged N95 mask wear without compromising mask seal.'),
  ('petrolatum', 'https://doi.org/10.1111/jdv.14446', 'Advanced film-forming gel formula vs spring thermal water and white petrolatum as primary dressings after full-face ablative fractional CO2 laser resurfacing: a comparative split-face pilot study', 'Journal of the European Academy of Dermatology and Venereology', '2017-08-04', 'moderate', 'Split-face pilot study: white petrolatum performed as a reliable, biocompatible primary post-laser wound dressing, though a newer film-forming gel showed advantages in the earliest healing phase.'),
  ('magnesium-ascorbyl-phosphate', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13588479/', 'Clinical Applications of Vitamin C in Dermatology: A Systematic Review', 'The Journal of Clinical and Aesthetic Dermatology', '2026-07-01', 'moderate', 'Systematic review of 44 studies: magnesium ascorbyl phosphate emulgels provide rapid pigment-lightening effects, one of several validated stable vitamin C derivatives reviewed.'),
  ('sulfur', 'https://doi.org/10.1016/j.clindermatol.2025.11.001', 'From Salves to Sulzberger: The emergence of the American approach to acne treatment', 'Clinics in Dermatology', '2025-11-13', 'anecdotal', 'Historical review tracing sulfur preparations to some of the earliest rational topical acne therapies, predating the antibiotic and retinoid treatment eras.'),
  ('bisabolol', 'https://doi.org/10.1016/j.jdermsci.2005.12.009', 'Anti-inflammatory activity in skin by biomimetic of Evodia rutaecarpa extract from traditional Chinese medicine', 'Journal of Dermatological Science', '2006-01-19', 'moderate', 'Clinical study used bisabolol (identified as "the active component of chamomile") as an active anti-inflammatory comparator, confirming its real topical efficacy at inhibiting induced erythema.'),
  ('colloidal-oatmeal', 'https://doi.org/10.36849/JDD.9095', '1% Colloidal Oatmeal Cream/Baby Wash Regimen Improved Atopic Dermatitis in Pediatric Patients From First Use', 'Journal of Drugs in Dermatology', '2025-10-01', 'strong', '31-subject open-label pediatric trial: 1% colloidal oatmeal cream/wash regimen significantly improved eczema severity, quality of life and pruritus as early as day 1 through 28 days.'),
  ('bifida-ferment-lysate', 'https://doi.org/10.3390/ijms241612810', 'Anti-Melanogenic and Antioxidant Activity of Bifidobacterium longum Strain ZJ1 Extracts, Isolated from a Chinese Centenarian', 'International Journal of Molecular Sciences', '2023-08-15', 'limited', 'Bifidobacterium longum fermentation-lysate extracts reduced melanin production in cell-culture and zebrafish models and showed real antioxidant activity against oxidative stress.'),
  ('avobenzone', 'https://doi.org/10.3390/molecules31173022', 'Licuri Oil as a Natural Oily Core for Cationic Polymeric Nanocapsules for Topical Formulation: Development, Characterization, and Incorporation into Hydrogels', 'Molecules', '2026-08-28', 'moderate', 'Avobenzone encapsulated in polymeric nanocapsules retained 51-52% of initial UV-filtering content after 48h UVA exposure versus 10% for free avobenzone -- a real photostability improvement.'),
  ('phenoxyethanol', 'https://doi.org/10.1007/s00204-024-03938-5', 'Dermal penetration of 2-phenoxyethanol in humans: in vivo metabolism and toxicokinetics', 'Archives of Toxicology', '2024-12-24', 'strong', 'Human volunteer study: phenoxyethanol is rapidly absorbed transdermally (~45% dermal resorption) and extensively metabolized/eliminated in urine within 48 hours, establishing real toxicokinetic safety data.')
) AS v(candidate_slug, source_url, source_title, publisher, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- === Demand-queue triage (22 pending ingredient_generation_requests rows) ===

-- Published: real ingredients created above
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'rose-extract'), resolved_at = now() WHERE id = '4bcaef38-dc45-43ef-838e-ae1873243591';
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'chamomile-extract'), resolved_at = now() WHERE id = '7cecc0b3-bb10-4682-a746-0c7d4b075ac4';
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'manketti-oil'), resolved_at = now() WHERE id = '9cda752f-0b53-4dbd-b048-ae2e6eab2c4a';
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'yangu-oil'), resolved_at = now() WHERE id = '66d7d8a5-c55e-4ecc-be7e-24fc2f7af2fc';
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'kigelia-africana'), resolved_at = now() WHERE id = '41d38078-f46a-4379-bfb3-bd7a1708f73d';
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM ingredients WHERE slug = 'cbd'), resolved_at = now() WHERE id = 'cac4c4d4-0a29-4d66-81a8-5cacba8be2ae';

-- Published: real duplicates resolved to an existing, already-populated catalogue row
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = '7f1eb119-d9ad-44cb-915d-7e094f22d8d3', resolved_at = now() WHERE id = '57fa85db-21ca-457c-9c1c-b2465e046b28'; -- Baobab -> baobab-oil
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = 'e08727c0-e0d1-4e31-a28b-e6c7152a3762', resolved_at = now() WHERE id = 'fbc4ffd2-602a-438b-a7a6-62938e860d3e'; -- Probiotics -> probiotic-ferment
UPDATE ingredient_generation_requests SET status = 'published', resolved_ingredient_id = 'f5f0e4cd-4cac-4dd1-990b-c12f818d479b', resolved_at = now() WHERE id = '839ad573-6180-4706-a1b7-6eae626e3283'; -- Pre/Probiotics -> prebiotics

-- Rejected: generic collective/category names, no single real-world compound identity
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing term for an unspecified oil blend, not a single named ingredient -- would require fabricating a specific compound identity.', resolved_at = now() WHERE id = '8e72adc8-c437-46fa-8421-6bf9301421e6'; -- Natural Oils
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Refers to a class of fatty acids (omega-3/6/9), not one INCI ingredient -- the specific fatty acids it stands in for (e.g. Linoleic Acid, Oleic Acid) are catalogued individually in this batch.', resolved_at = now() WHERE id = '49b36c51-03e0-4e4a-81c9-fd7b87862288'; -- Omega 3, 6, 9
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'No genuine cosmetic-science or clinical literature found for yoghurt/yoghurt extract as a skincare ingredient -- only marketing/blog sources located, insufficient for a cited profile.', resolved_at = now() WHERE id = 'f754c117-045d-469b-a759-1d4381f8361a'; -- Swiss Yoghurt
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Describes a product format (cleanser texture/consistency), not an ingredient.', resolved_at = now() WHERE id = '3fa539be-3526-4466-b2c2-5a5a7b3606da'; -- Gel-to-milk cleanser
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing "complex" name, not a single named ingredient.', resolved_at = now() WHERE id = 'ea5994c9-49d1-437c-b820-45330ac4404a'; -- Lightweight Botanical Complex
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic formulation-property descriptor, not a named ingredient.', resolved_at = now() WHERE id = 'b87a11b6-e034-4899-85c8-026867247ebb'; -- Non-Comedogenic Actives
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'No single INCI ingredient identifiable; the retrieved literature concerns endogenous UVB-driven vitamin D synthesis physiology, not a topical formulated ingredient -- writing a profile would fabricate a compound identity.', resolved_at = now() WHERE id = '1dd56ed2-935d-4f67-af7b-f9c6f92dc485'; -- Provitamin D
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing "complex" name, not a single named ingredient.', resolved_at = now() WHERE id = '90cb287d-f6cd-425c-aed7-5d220c0e0a16'; -- Barrier-Repair Complex
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing "complex" name, not a single named ingredient.', resolved_at = now() WHERE id = '422cc393-ffa0-45f1-b340-a1b4baba45a4'; -- Hydrating Complex
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing "complex" name, not a single named ingredient.', resolved_at = now() WHERE id = '7cad04cb-b677-4082-9044-02ade7fc05ab'; -- Brightening & Firming Complex
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic category term ("Antioxidants"), not a single named ingredient -- specific antioxidants (Astaxanthin, Ergothioneine, Glutathione, EGCG, Quercetin) are catalogued individually in this batch.', resolved_at = now() WHERE id = '973f7973-3c8b-4f2c-9ed0-0259aa5a167b'; -- Antioxidants
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Product packaging/applicator component (a physical part of the product), not a skincare ingredient.', resolved_at = now() WHERE id = 'd0e95ecd-18d6-4f68-af37-4305613f7857'; -- Silicone tip
UPDATE ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Product packaging/applicator component (a physical part of the product), not a skincare ingredient.', resolved_at = now() WHERE id = '75683800-a5e1-479a-8fda-2ef214dc8c62'; -- Wooden handle
