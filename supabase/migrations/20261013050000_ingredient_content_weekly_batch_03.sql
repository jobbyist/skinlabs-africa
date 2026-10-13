-- Weekly Ingredients Intelligence pipeline, firing 3 (trig_012CnJXfuEkZxbUMwdfTBQg2,
-- 2026-10-13): triages the 22 pending ingredient_generation_requests rows accumulated
-- since the queue was last drained (2026-10-06), then supplements with real, cited
-- candidates from INGREDIENT_EXPANSION_CANDIDATES.md. Research via mcp__PubMed__*
-- (every claim traced to a real, retrieved article). verification_status stays
-- 'partially_verified' (human-only for 'verified').
--
-- This run landed 18 new ingredients, again under the usual 25+ target: of the 22
-- demand-queue rows, 6 were rejected -- 3 generic/non-specific marketing phrases
-- ("Micro-particles", "Advanced Spectral Technology", "SPF50+ UV Filters") and 3
-- proprietary trade names with no independent peer-reviewed literature found despite
-- real search attempts ("Diamond" -- the only diamond+skin literature found concerns
-- diamond-tip microdermabrasion DEVICES, not diamond powder formulated into a cream,
-- a mismatch rather than a real citation; "Hydromanil" and "Procerad" are Lipotec/
-- Sederma trade names with zero specific results). 5 resolved as duplicates of
-- already-catalogued ingredients (Turmeric, CBD Isolate, Green Tea, Vitamin B5,
-- Retinal). From the candidates list, several more searches (Propanediol, Mango
-- Butter, Tartaric Acid, Inulin, Pentylene Glycol, Superoxide Dismutase) returned
-- zero or mismatched results this round and were left unprocessed rather than forced.
-- No refresh-rotation budget was spent this firing -- the demand-queue triage plus
-- 18-ingredient research consumed the full session budget.

-- === New ingredients (18) ===

INSERT INTO public.ingredients (slug, inci_name, common_name, category, description, function_summary, typical_concentration_range, evidence_level, verification_status, source_url, source_type, source_date, confidence, last_verified_at)
VALUES
  ('telomerase', 'Telomerase', 'Telomerase', 'antioxidant',
   'A biological enzyme marketed in some anti-aging serums on the theory that preserving telomere length could slow visible skin aging -- a real cellular mechanism, but one with no controlled topical cosmetic efficacy trial behind it.',
   'According to PubMed, a review of telomerase biology notes that oxidative stress is known to shorten telomeres, and speculates that topical, transdermal or systemic antioxidant administration "may be beneficial" at preserving telomere length -- a real but explicitly speculative mechanistic link, not a demonstrated topical cosmetic efficacy claim. The review is about telomerase regulation generally (regenerative medicine, oncology), not a trial of a topical telomerase-containing product.',
   NULL, 'anecdotal', 'partially_verified', 'https://doi.org/10.1002/jbm.a.35515', 'peer_reviewed_literature', '2015-08-14', 'low'::confidence_level, now()),

  ('propolis', 'Propolis Extract', 'Propolis (Bee Propolis)', 'soothing-botanical',
   'A resinous substance bees produce from plant compounds, used in skincare for its antimicrobial and wound-healing properties.',
   'According to PubMed, a 2026 study testing propolis (combined with birch bark) extracts in hydrogel and bigel formulations found real wound-healing improvement in keratinocyte cell lines from both healthy donors and epidermolysis bullosa patients, with no cytotoxicity observed -- real cell-model evidence for propolis''s wound-repair properties, from specialized skin-disease research rather than a general cosmetic efficacy trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/ijms27135746', 'peer_reviewed_literature', '2026-06-25', 'low'::confidence_level, now()),

  ('sweet-almond-oil', 'Prunus Amygdalus Dulcis (Sweet Almond) Oil', 'Sweet Almond Oil', 'barrier-lipid',
   'An emollient oil pressed from almonds, used in skincare for softening and antioxidant support.',
   'According to PubMed, a randomized controlled trial found daily ORAL almond consumption increased resistance to UVB-induced erythema (a higher minimal erythema dose) in healthy women over 12 weeks, though it found no measurable difference in skin roughness, melanin, hydration or sebum between groups -- the trial itself tested oral consumption, not topical application; the same paper''s introduction cites separate in vitro/in vivo evidence for topical almond oil reducing UVB-induced photoaging, but that evidence was not the subject of this trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1111/jocd.13946', 'peer_reviewed_literature', '2021-01-24', 'low'::confidence_level, now()),

  ('thermal-spring-water', 'Thermal Spring Water', 'Thermal Spring Water', 'soothing-botanical',
   'Mineral-rich water sourced from natural thermal springs, used by several skincare brands (including as a named ingredient in some La Roche-Posay products) for its traditional skin-soothing reputation.',
   'According to PubMed, a 2025 review on thermal spring water for skin health describes real anti-inflammatory, immunomodulatory and skin-barrier-reinforcement potential, bridging traditional spa therapy with modern dermatology -- a real, directly on-topic review, though published as a letter rather than reporting new controlled-trial data of its own.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1007/s00403-025-04189-9', 'peer_reviewed_literature', '2025-04-11', 'low'::confidence_level, now()),

  ('tallow', 'Tallow', 'Tallow (Rendered Animal Fat)', 'barrier-lipid',
   'A solid fat rendered from animal fat, trending in "natural" skincare as a moisturizer -- the evidence behind this trend is genuinely thin.',
   'According to PubMed, a 2024 scoping review searching EMBASE and PubMed for tallow''s effects on skin found significant research gaps: of 147 screened studies only 19 met inclusion criteria, and the reviewers concluded that while tallow is well-studied as an animal-feed, cooking and soap ingredient, there is comparatively little controlled research on its use directly on human skin, including on its side effects -- an honest "more research is needed" finding rather than a validated cosmetic benefit.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.7759/cureus.60981', 'peer_reviewed_literature', '2024-05-24', 'low'::confidence_level, now()),

  ('witch-hazel', 'Hamamelis Virginiana Water', 'Witch Hazel', 'soothing-botanical',
   'A plant-derived astringent and toner ingredient distilled from the witch hazel shrub, long used for its mild anti-inflammatory and skin-calming properties.',
   'According to PubMed, a randomized trial comparing breast milk to a witch hazel (Hamamelis virginiana)-containing cream for treating diaper dermatitis in infants found both groups improved, with witch hazel cream producing a real, measurable decrease in dermatitis severity -- though smaller than the breast-milk group''s improvement, and baseline severity differences between the groups limit a direct efficacy comparison.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1177/15568253251406258', 'peer_reviewed_literature', '2025-12-22', 'low'::confidence_level, now()),

  ('sodium-benzoate', 'Sodium Benzoate', 'Sodium Benzoate', 'preservative',
   'A widely used cosmetic and food preservative that inhibits microbial growth, extending product shelf life.',
   'According to PubMed, a study testing sodium benzoate against bacterial biofilms (alongside methylisothiazolinone and phenoxyethanol, two other common cosmetic preservatives) found measurable antimicrobial/antibiofilm activity, though less potent than methylisothiazolinone -- real antimicrobial-efficacy evidence for its established preservative role, corroborated by a separate review discussing sodium benzoate among the standard alternatives to parabens in cosmetic formulation.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1080/08927014.2021.1978988', 'peer_reviewed_literature', '2021-10-11', 'medium'::confidence_level, now()),

  ('fulvic-acid', 'Fulvic Acid', 'Fulvic Acid', 'antioxidant',
   'A naturally occurring humic substance (formed from decomposed organic matter) used in some skincare for its antioxidant and anti-inflammatory properties.',
   'According to PubMed, a 2025 review of humic substances (which include fulvic and humic acid) found real antioxidant, anti-inflammatory, antimicrobial and wound-healing properties documented across the research base, alongside a chelating/heavy-metal-binding capacity -- a real, broad biomedical review, though it notes composition varies widely by source and calls for standardized extraction methods and more rigorous preclinical evaluation before stronger claims are warranted.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/antiox14091139', 'peer_reviewed_literature', '2025-09-21', 'low'::confidence_level, now()),

  ('citrus-aurantium-flower-extract', 'Citrus Aurantium Flower Extract', 'Citrus Aurantium (Bitter Orange) Flower Extract', 'antioxidant',
   'An extract from Citrus aurantium (bitter orange) flowers, used in skincare for brightening and antioxidant properties -- a solvent extract, distinct from the steam-distilled essential oil (Neroli Oil), for which no direct literature was found this batch.',
   'According to PubMed, a study fermenting Citrus aurantium flower extract with Lactobacillus found the fermented extract had substantially higher antityrosinase, antioxidant, antibacterial and antiwrinkle activity than the unfermented extract, reducing melanin formation in a cell model with no toxic effect observed at tested concentrations -- real, directly on-topic cell-model evidence specifically for the flower extract (never tested as the distilled essential oil marketed as "Neroli").',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1016/j.heliyon.2022.e10498', 'peer_reviewed_literature', '2022-09-01', 'low'::confidence_level, now()),

  ('bentonite-clay', 'Bentonite', 'Bentonite Clay', 'cleansing-base',
   'A natural clay mineral used in masks and cleansers for its oil-absorbing and mild clarifying properties.',
   'According to PubMed, a 2023 clinical study of a clay face-mask formulation (containing both kaolin and bentonite) in 75 adults with oily/combination skin found significant improvements in acne-related outcomes, sebum content and skin hydration after 4 weeks of twice-weekly use, with high product tolerability -- real clinical evidence, though from a multi-ingredient mask formulation rather than bentonite clay tested in isolation.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1111/srt.13513', 'peer_reviewed_literature', '2023-11-01', 'low'::confidence_level, now()),

  ('potassium-sorbate', 'Potassium Sorbate', 'Potassium Sorbate', 'preservative',
   'A salt of sorbic acid widely used as a mild preservative in cosmetics, particularly in formulations for infants and sensitive skin.',
   'According to PubMed, a 2024 study analyzing preservative trends in infant and sensitive-population cosmetics found sorbic acid/its salts (including potassium sorbate) remain among the most prevalent traditional preservatives used, at concentrations within regulatory safety limits, though challenge testing showed product preservation could still be compromised under certain conditions regardless of preservative system -- real, current market-surveillance evidence for its established, comparatively gentle preservative role.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1038/s41598-024-69624-9', 'peer_reviewed_literature', '2024-08-17', 'medium'::confidence_level, now()),

  ('bromelain', 'Bromelain', 'Bromelain', 'exfoliant-enzyme',
   'A proteolytic enzyme derived from pineapple stems, used in skincare for enzymatic exfoliation -- its best-documented topical medical use is actually in wound debridement rather than cosmetic exfoliation.',
   'According to PubMed, proof-of-concept clinical studies of a topical bromelain-enriched enzymatic concentrate (originally developed and already used for burn-wound debridement) found it eradicated basal cell carcinoma lesions in the majority of 22 tumors treated, well tolerated with healing within 2-3 weeks -- real, if specialized, clinical evidence for bromelain''s proteolytic/anti-inflammatory action, from a medical/oncology-debridement context rather than a cosmetic exfoliation efficacy trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/jcm13216624', 'peer_reviewed_literature', '2024-11-04', 'low'::confidence_level, now()),

  ('idebenone', 'Idebenone', 'Idebenone', 'antioxidant',
   'A synthetic antioxidant structurally related to Coenzyme Q10, used in anti-aging formulations to help counter UV-induced oxidative stress.',
   'According to PubMed, a 2023 study using microneedle-assisted bioadhesive nanoparticles to deliver idebenone into skin found it suppressed reactive oxygen species, reduced advanced glycation end-products, and suppressed melanogenesis in UV-damaged skin more effectively than non-adhesive delivery systems -- real mechanistic evidence for idebenone''s antioxidant action, from an advanced-delivery-technology study rather than a trial of a standard leave-on cosmetic formulation.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.3390/biomedicines11061649', 'peer_reviewed_literature', '2023-06-06', 'medium'::confidence_level, now()),

  ('beta-carotene', 'Beta-Carotene', 'Beta Carotene', 'antioxidant',
   'A carotenoid pigment and antioxidant, used both as an orally-ingested "sunless tan" agent and as a topical antioxidant in some formulations.',
   'According to PubMed, a 2026 systematic review of self-tanning agents found that ingested carotenoids (including beta-carotene) accumulate in skin and subcutaneous fat, producing a yellow-orange cosmetic tint, but concluded that carotenoids "remain underresearched in human populations" for this use, with limited long-term safety and efficacy data -- an honestly-reported, still-thin evidence base rather than a validated topical-antioxidant or tanning claim.',
   NULL, 'limited', 'partially_verified', 'https://pubmed.ncbi.nlm.nih.gov/41890775/', 'peer_reviewed_literature', '2026-02-01', 'low'::confidence_level, now()),

  ('palmitoyl-tripeptide-1', 'Palmitoyl Tripeptide-1', 'Palmitoyl Tripeptide-1', 'peptide',
   'A signal peptide used in anti-aging formulations to support the skin''s own collagen production, part of the widely studied "Matrixyl" peptide family.',
   'According to PubMed, a 2026 study found collagen metabolism in skin fibroblasts follows a circadian rhythm, and that applying palmitoyl tripeptide-1 specifically at night (timed to when collagen synthesis genes peak) produced measurable clinical improvements in a 30-person trial: skin luminance improved 16.29%, nasolabial fold depth decreased 36.35%, and firmness improved 24.35% -- real, recent clinical-trial evidence, though for a specific day/night-timed regimen alongside a second active (baicalin) rather than palmitoyl tripeptide-1 used alone.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1111/jocd.70638', 'peer_reviewed_literature', '2026-01-01', 'medium'::confidence_level, now()),

  ('glyceryl-stearate', 'Glyceryl Stearate', 'Glyceryl Stearate', 'barrier-lipid',
   'An emollient and emulsifier derived from glycerin and stearic acid, widely used to stabilize creams and lotions and soften skin texture.',
   'According to PubMed, the Cosmetic Ingredient Review (CIR) Expert Panel''s safety assessment of the glyceryl monoester family (which explicitly includes Glyceryl Palmitate/Stearate) found these ingredients are generally non-irritating and non-sensitizing at cosmetic-use concentrations, with little acute or chronic toxicity in animal studies, and concluded they are safe for use in current cosmetic practice.',
   NULL, 'moderate', 'partially_verified', 'https://doi.org/10.1080/10915810490499064', 'peer_reviewed_literature', '2004-01-01', 'medium'::confidence_level, now()),

  ('cocoa-butter', 'Theobroma Cacao Seed Butter', 'Cocoa Butter', 'barrier-lipid',
   'An occlusive plant butter pressed from cocoa beans, long marketed for preventing or fading stretch marks -- a claim the controlled evidence does not support.',
   'According to PubMed, a British Journal of Dermatology review of topical modalities for preventing striae gravidarum (pregnancy stretch marks) concluded that "cocoa butter and olive oil are not effective for preventing SG or reducing the severity of lesions" -- a real, honestly-reported negative finding directly against cocoa butter''s most common marketing claim; the same review found only limited evidence for centella and bitter almond oil massage, and weak evidence for hyaluronic acid, for this specific use.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.1111/bjd.13426', 'peer_reviewed_literature', '2015-02-08', 'low'::confidence_level, now()),

  ('macadamia-oil', 'Macadamia Ternifolia Seed Oil', 'Macadamia Oil', 'barrier-lipid',
   'A fatty-acid-rich emollient oil pressed from macadamia nuts, valued in skincare for its palmitoleic-acid content, which closely resembles the skin''s own sebum.',
   'According to PubMed, a 2026 compositional analysis of macadamia oils from 15 cultivars found oleic acid (56.7-62.8%) and palmitoleic acid (12.2-18.7%) as the dominant fatty acids, with antioxidant capacity correlating strongly to polyphenol, squalene and tocopherol content -- real fatty-acid-composition and antioxidant-capacity evidence, not a controlled skin-efficacy trial.',
   NULL, 'limited', 'partially_verified', 'https://doi.org/10.3390/foods15152596', 'peer_reviewed_literature', '2026-07-24', 'low'::confidence_level, now())

ON CONFLICT (slug) DO NOTHING;

-- === Multi-source citations ===

INSERT INTO public.ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
SELECT i.id, v.source_url, v.source_title, v.publisher, v.source_type::data_source_type, v.publication_date::date, v.evidence_level::evidence_level, v.evidence_summary
FROM (
  VALUES
    ('telomerase', 'https://doi.org/10.1002/jbm.a.35515', 'Tissue formation and tissue engineering through host cell recruitment... telomerase activation therapies', 'Journal of Biomedical Materials Research Part A', 'peer_reviewed_literature', '2015-08-14', 'anecdotal', 'Speculative review link between oxidative stress, telomere shortening and antioxidant administration -- not a topical cosmetic efficacy trial.'),
    ('propolis', 'https://doi.org/10.3390/ijms27135746', 'Wound-Healing Effects of Birch Bark and Propolis Extracts on Epidermolysis Bullosa Keratinocytes', 'International Journal of Molecular Sciences', 'peer_reviewed_literature', '2026-06-25', 'limited', 'Real wound-healing improvement in keratinocyte cell lines, no cytotoxicity observed.'),
    ('sweet-almond-oil', 'https://doi.org/10.1111/jocd.13946', 'Almond consumption increased UVB resistance in healthy Asian women', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2021-01-24', 'limited', 'RCT of oral almond consumption increasing UVB erythema resistance; no difference in skin texture/hydration/sebum found.'),
    ('thermal-spring-water', 'https://doi.org/10.1007/s00403-025-04189-9', 'Usage of thermal spring water for optimal skin health: bridging traditional therapy with modern dermatology', 'Archives of Dermatological Research', 'peer_reviewed_literature', '2025-04-11', 'limited', 'Review of anti-inflammatory, immunomodulatory and barrier-reinforcement potential.'),
    ('tallow', 'https://doi.org/10.7759/cureus.60981', 'Tallow, Rendered Animal Fat, and Its Biocompatibility With Skin: A Scoping Review', 'Cureus', 'peer_reviewed_literature', '2024-05-24', 'limited', 'Scoping review finding significant research gaps on tallow''s direct effects on human skin.'),
    ('witch-hazel', 'https://doi.org/10.1177/15568253251406258', 'Comparison of the Effects of Breast Milk and Witch Hazel on the Healing of Diaper Dermatitis in Infants', 'Breastfeeding Medicine', 'peer_reviewed_literature', '2025-12-22', 'limited', 'RCT: both breast milk and witch hazel cream improved diaper dermatitis severity.'),
    ('sodium-benzoate', 'https://doi.org/10.1080/08927014.2021.1978988', 'Anti-biofouling efficacy of three home and personal care product preservatives', 'Biofouling', 'peer_reviewed_literature', '2021-10-11', 'moderate', 'Real antimicrobial/antibiofilm testing of sodium benzoate alongside MIT and phenoxyethanol.'),
    ('sodium-benzoate', 'https://doi.org/10.1016/j.envres.2020.110488', 'Controversy around parabens: Alternative strategies for preservative use in cosmetics', 'Environmental Research', 'peer_reviewed_literature', '2020-11-19', 'limited', 'Review listing sodium benzoate among standard paraben alternatives in cosmetic formulation.'),
    ('fulvic-acid', 'https://doi.org/10.3390/antiox14091139', 'Biomedical Applications of Humic Substances: From Natural Biopolymers to Therapeutic Agents', 'Antioxidants', 'peer_reviewed_literature', '2025-09-21', 'limited', 'Review of antioxidant, anti-inflammatory, antimicrobial and wound-healing properties of fulvic/humic acid.'),
    ('citrus-aurantium-flower-extract', 'https://doi.org/10.1016/j.heliyon.2022.e10498', 'Submerged fermentation with Lactobacillus significantly improved the physiological activities of Citrus aurantium flower extract', 'Heliyon', 'peer_reviewed_literature', '2022-09-01', 'limited', 'Fermented extract showed higher antityrosinase, antioxidant, antibacterial and antiwrinkle activity; reduced melanin formation in cell model.'),
    ('bentonite-clay', 'https://doi.org/10.1111/srt.13513', 'Comprehensive assessment of the efficacy and safety of a clay mask in oily and acne skin', 'Skin Research and Technology', 'peer_reviewed_literature', '2023-11-01', 'limited', '75-person clinical study: clay mask (kaolin + bentonite) improved acne, sebum and hydration over 4 weeks.'),
    ('potassium-sorbate', 'https://doi.org/10.1038/s41598-024-69624-9', 'Deciphering trends in replacing preservatives in cosmetics intended for infants and sensitive population', 'Scientific Reports', 'peer_reviewed_literature', '2024-08-17', 'moderate', 'Market-surveillance study: sorbic acid/salts remain prevalent traditional preservatives within safety limits.'),
    ('bromelain', 'https://doi.org/10.3390/jcm13216624', 'Effective Treatment of Basal Cell Carcinoma with a Topical Enzymatic Mixture Enriched in Bromelain', 'Journal of Clinical Medicine', 'peer_reviewed_literature', '2024-11-04', 'limited', 'Proof-of-concept clinical studies: topical bromelain concentrate eradicated BCC lesions in most of 22 tumors treated.'),
    ('idebenone', 'https://doi.org/10.3390/biomedicines11061649', 'Microneedle-Assisted Topical Delivery of Idebenone-Loaded Bioadhesive Nanoparticles Protect against UV-Induced Skin Damage', 'Biomedicines', 'peer_reviewed_literature', '2023-06-06', 'moderate', 'Microneedle-delivered idebenone suppressed ROS, AGEs and melanogenesis in UV-damaged skin.'),
    ('beta-carotene', 'https://pubmed.ncbi.nlm.nih.gov/41890775/', 'Insights into Tanning Biology and Tanning Products', 'The Journal of Clinical and Aesthetic Dermatology', 'peer_reviewed_literature', '2026-02-01', 'limited', 'Systematic review: ingested carotenoids accumulate in skin producing a cosmetic tint; human efficacy/safety data remain limited.'),
    ('palmitoyl-tripeptide-1', 'https://doi.org/10.1111/jocd.70638', 'Targeting Circadian Rhythm for the Regulation of Skin Collagen Metabolism', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2026-01-01', 'moderate', '30-person clinical trial: night-timed palmitoyl tripeptide-1 (with daytime baicalin) improved luminance, nasolabial fold depth and firmness.'),
    ('glyceryl-stearate', 'https://doi.org/10.1080/10915810490499064', 'Final report of the amended safety assessment of Glyceryl Laurate... and related glyceryl esters', 'International Journal of Toxicology', 'peer_reviewed_literature', '2004-01-01', 'moderate', 'CIR Expert Panel safety assessment of the glyceryl monoester family, including Glyceryl Palmitate/Stearate.'),
    ('cocoa-butter', 'https://doi.org/10.1111/bjd.13426', 'Stretch marks during pregnancy: a review of topical prevention', 'British Journal of Dermatology', 'peer_reviewed_literature', '2015-02-08', 'limited', 'Review finding cocoa butter and olive oil are NOT effective for preventing or reducing stretch marks.'),
    ('macadamia-oil', 'https://doi.org/10.3390/foods15152596', 'Compositional Characteristics of Macadamia Nuts and Oils from Major Growing Regions in China', 'Foods', 'peer_reviewed_literature', '2026-07-24', 'limited', 'Fatty-acid composition and antioxidant-capacity analysis across 15 cultivars.')
) AS v(candidate_slug, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
JOIN public.ingredients i ON i.slug = v.candidate_slug
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- === Resolve demand-queue requests ===

-- Published new ingredients
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'telomerase'), resolved_at = now() WHERE id = '35fb8033-eef5-4652-b513-daa24e6f7d73';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'propolis'), resolved_at = now() WHERE id = '3847fe84-8b28-417d-8c45-e3a6fb757f67';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'sweet-almond-oil'), resolved_at = now() WHERE id = '4b382a0c-f59c-47a3-bcaa-c7a36b81a0a4';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'thermal-spring-water'), resolved_at = now() WHERE id = '1865d4c3-69e9-4662-8466-29e3b5033414';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'tallow'), resolved_at = now() WHERE id = 'f9bb914a-e9f3-46f6-80c1-da4c2f29e4a5';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'witch-hazel'), resolved_at = now() WHERE id = '669312a2-4326-4ff1-9b3e-4f97b9464346';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'sodium-benzoate'), resolved_at = now() WHERE id = '5988b907-8a3f-46e4-aabf-e5361a39e1d0';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'fulvic-acid'), resolved_at = now() WHERE id = '5c96823b-350c-41e1-957f-c633ee2ac618';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'citrus-aurantium-flower-extract'), resolved_at = now() WHERE id = '61cd7703-a3ac-42ae-94c2-7181eabbb454';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'bentonite-clay'), resolved_at = now() WHERE id = '3a7ec313-5caf-40c1-a360-ecba9b52ea73';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'potassium-sorbate'), resolved_at = now() WHERE id = '789121e2-0679-41e8-b588-96fcca9d6276';

-- Resolved to existing catalogue entries (duplicates)
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'turmeric-extract'), resolved_at = now() WHERE id = 'f74d8572-3c7b-4944-9597-cfa1d43d4bfe';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'cbd'), resolved_at = now() WHERE id = 'dfe9e94c-2c7a-4fea-8b0f-96c1becace0b';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'green-tea-extract'), resolved_at = now() WHERE id = 'bddf2581-3b5c-4884-9edf-110ebb9fa370';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'panthenol'), resolved_at = now() WHERE id = '04904576-f00d-41ad-ad4e-5142890a9c98';
UPDATE public.ingredient_generation_requests SET status = 'published', resolved_ingredient_id = (SELECT id FROM public.ingredients WHERE slug = 'retinaldehyde'), resolved_at = now() WHERE id = '3d686fef-6dfb-45e7-8dd1-a9de37dca443';

-- Rejected: generic/non-specific marketing phrases
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("micro-particles"), not a single identifiable ingredient.', resolved_at = now() WHERE id = '465d6b2f-82e6-4ed2-8312-ddf7c30d2fe4';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic marketing phrase ("advanced spectral technology"), not a single researchable ingredient.', resolved_at = now() WHERE id = 'c44f7b2f-d7dc-4df6-868c-3087d666822d';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Generic category phrase ("SPF50+ UV filters") covering multiple possible filter compounds, not one ingredient.', resolved_at = now() WHERE id = '7c673e4f-184a-453c-88e8-05e7cf0fd51e';

-- Rejected: proprietary trade names / mismatched literature
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Researched but the only diamond+skin literature found concerns diamond-tip microdermabrasion DEVICES, not diamond powder formulated into a cream -- a mismatch, not a usable citation.', resolved_at = now() WHERE id = 'a250552e-d5f8-47af-a219-996e2671968d';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Proprietary trade-name ingredient (Lipotec/Lubrizol "Hydromanil") with no independent peer-reviewed literature found despite broadened searches.', resolved_at = now() WHERE id = '1717f32d-5858-40a8-9f52-04196a117a78';
UPDATE public.ingredient_generation_requests SET status = 'rejected', rejection_reason = 'Proprietary trade-name ingredient (Sederma "Procerad") with zero PubMed results found despite multiple search attempts.', resolved_at = now() WHERE id = 'f76c3ac4-0cc9-4462-933f-07a2971ad236';
