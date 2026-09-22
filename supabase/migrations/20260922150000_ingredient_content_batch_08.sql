-- Track A content batch 08 (final manual 6A continuation): 11 ingredients
-- (Sodium Hyaluronate, Succinic Acid, Tranexamic Acid, Tremella Extract,
-- Turmeric Extract, Vitamin A, Vitamin C ~10% [renamed + demand-queue
-- fix], Zinc, Zinc Gluconate, Zinc PCA, Zinc Salicylate). This completes
-- Track A: every real ingredient identified in supabase/
-- INGREDIENT_CONTENT_STATUS.md's resumable query now has a detailed,
-- cited profile or is on the permanent skip list. Research: PubMed
-- peer-reviewed literature. verification_status stays 'partially_verified'.

-- Sodium Hyaluronate
UPDATE ingredients SET
  description = 'Sodium Hyaluronate is the sodium salt form of hyaluronic acid, chemically very similar and used interchangeably with hyaluronic acid in skincare formulations as a humectant.',
  function_summary = 'Commonly used as a humectant to draw and hold moisture in the skin, functionally equivalent to hyaluronic acid. A controlled RCT of topical hyaluronic acid (of which sodium hyaluronate is the salt form typically used in cosmetic formulations) found low molecular weight forms significantly improved skin capacitance versus high molecular weight forms and vehicle, with no adverse effects.',
  typical_concentration_range = '0.1%-2%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1007/s00403-024-03003-2',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-06-03',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '38458214-f479-4838-bae4-1078747bc236';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('38458214-f479-4838-bae4-1078747bc236', 'https://doi.org/10.1007/s00403-024-03003-2', 'Effectiveness of topical hyaluronic acid of different molecular weights in xerosis cutis treatment in elderly', 'Archives of Dermatological Research', 'peer_reviewed_literature', '2024-06-03', 'moderate'::evidence_level, '36-subject double-blind RCT: low molecular weight hyaluronic acid (typically formulated as its sodium salt) significantly improved skin capacitance versus high molecular weight HA and vehicle after 4 weeks, with no adverse effects.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Succinic Acid
UPDATE ingredients SET
  description = 'Succinic acid is a dicarboxylic acid used in skincare formulations for its sebum-regulating and anti-acne properties, often combined with other actives.',
  function_summary = 'Commonly used, typically combined with other ingredients like niacinamide, to help address acne and skin microbiota imbalance. An open-label clinical study of 44 subjects with mild-to-moderate acne found a cream gel containing succinic acid, niacinamide and a biotechnological phytocomplex improved skin bacterial diversity and clinical acne severity over 8 weeks.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.16452',
  source_type = 'peer_reviewed_literature',
  source_date = '2024-08-28',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'a2071cb5-e3e0-4fc4-a64e-e90e8222db36';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('a2071cb5-e3e0-4fc4-a64e-e90e8222db36', 'https://doi.org/10.1111/jocd.16452', 'New clinical approach in facial mild-moderate acne: Re-stabilization of skin microbiota balance with a topical biotechnological phytocomplex', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2024-08-28', 'moderate'::evidence_level, '44-subject open-label study, 8 weeks: a facial cream gel with succinic acid, niacinamide and a biotechnological phytocomplex improved skin bacterial diversity (16S rRNA sequencing) and clinical acne severity (IGA).')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Tranexamic Acid
UPDATE ingredients SET
  description = 'Tranexamic acid is a synthetic amino acid derivative used topically in skincare for its skin-brightening properties, working by inhibiting the plasmin pathway implicated in pigment production.',
  function_summary = 'Commonly used to help treat melasma and post-inflammatory hyperpigmentation. A randomized double-blind controlled trial found tranexamic acid/niacinamide creams (both niosomal and conventional formulations) performed comparably to hydroquinone, the gold-standard treatment, for melasma, and a separate open-label study found a tranexamic-acid-containing serum improved melasma and PIH severity over 16 weeks.',
  typical_concentration_range = '2%-5%',
  evidence_level = 'strong'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1038/s41598-025-26693-8',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-11-28',
  confidence = 'high'::confidence_level,
  last_verified_at = now()
WHERE id = '8daf6d01-6e14-451e-8f22-0c7687343034';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('8daf6d01-6e14-451e-8f22-0c7687343034', 'https://doi.org/10.1038/s41598-025-26693-8', 'Safety and efficacy of niosomal and conventional tranexamic acid/niacinamide vs. hydroquinone creams in melasma: A randomized, double-blind, case-controlled clinical trial', 'Scientific Reports', 'peer_reviewed_literature', '2025-11-28', 'strong'::evidence_level, '99-patient randomized double-blind case-controlled trial: niosomal and conventional tranexamic acid/niacinamide creams performed comparably to gold-standard hydroquinone for melasma treatment.'),
  ('8daf6d01-6e14-451e-8f22-0c7687343034', 'https://doi.org/10.36849/JDD.9644', 'Efficacy and Tolerability of a Topical Pigment-Correcting Serum in Melasma and Postinflammatory Hyperpigmentation', 'Journal of Drugs in Dermatology', 'peer_reviewed_literature', '2026-07-01', 'moderate'::evidence_level, '16-week open-label study: a serum containing tranexamic acid, lotus sprout extract and niacinamide improved overall hyperpigmentation, tone unevenness and roughness in melasma/PIH patients.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Tremella Extract
UPDATE ingredients SET
  description = 'Tremella extract (from Tremella fuciformis, "snow mushroom") is a polysaccharide-rich fungal extract used in skincare as a moisturizing ingredient, sometimes marketed as a plant-based alternative to hyaluronic acid.',
  function_summary = 'Commonly used as a moisturizing, antioxidant ingredient. A laboratory study comparing Tremella fuciformis extract to hyaluronic acid in human dermal fibroblasts found the extract produced comparable wound-healing-supportive effects (collagen biosynthesis, scratch-wound closure) through different mechanisms, and a separate study found a Tremella polysaccharide hydrogel provided real antioxidant and skin-whitening effects against UVB damage — both real but preclinical (cell-culture/in vitro) evidence, not yet human clinical trials.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3390/molecules31132354',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-07-03',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '92f5524a-767d-4c5d-9c19-1f09805f8b31';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('92f5524a-767d-4c5d-9c19-1f09805f8b31', 'https://doi.org/10.3390/molecules31132354', 'Tremella Fuciformis Extract Evokes Similar Effect as Hyaluronic Acid on Wound Healing but Through Different Mechanisms in Human Dermal Fibroblasts', 'Molecules', 'peer_reviewed_literature', '2026-07-03', 'limited'::evidence_level, 'Human dermal fibroblast study: Tremella fuciformis extract matched hyaluronic acid on cell viability, collagen biosynthesis and scratch-wound closure, via distinct signalling mechanisms.'),
  ('92f5524a-767d-4c5d-9c19-1f09805f8b31', 'https://doi.org/10.1016/j.carbpol.2026.125126', 'Naturally derived polysaccharides and ganoderic acid A hydrogel with whitening potential to combat oxidative stress and melanin production caused by ultraviolet B', 'Carbohydrate Polymers', 'peer_reviewed_literature', '2026-02-23', 'limited'::evidence_level, 'In vitro study: a Tremella fuciformis polysaccharide hydrogel scavenged ABTS/hydroxyl radicals/UVB-induced ROS and reduced melanin content and tyrosinase activity.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Turmeric Extract
UPDATE ingredients SET
  description = 'Turmeric extract, standardized for its active compound curcumin, is used in skincare for its antioxidant and anti-inflammatory properties.',
  function_summary = 'Commonly used as an antioxidant/anti-inflammatory botanical extract. A randomized double-blind placebo-controlled trial found a topical curcumin gel reduced pain and inflammation-related symptoms when applied to joints, demonstrating real topical anti-inflammatory activity for curcumin — though this trial evaluated joint pain rather than skin-specific outcomes, so direct skin-efficacy human trial data for turmeric extract remains limited.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.3389/fpain.2026.1789088',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-04-01',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = '16aa8ae0-6719-49e5-ba2a-9578eb257f97';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('16aa8ae0-6719-49e5-ba2a-9578eb257f97', 'https://doi.org/10.3389/fpain.2026.1789088', 'The effect of a topical curcumin formulation (VAS-101) on knee pain in adults with knee osteoarthritis: a randomised, double-blind, placebo-controlled study', 'Frontiers in Pain Research', 'peer_reviewed_literature', '2026-04-01', 'limited'::evidence_level, '60-adult, 28-day RCT: a topical curcumin gel reduced knee pain and symptoms versus placebo, demonstrating real topical anti-inflammatory activity for curcumin (turmeric''s active compound), though not evaluated on skin outcomes specifically.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Vitamin A
UPDATE ingredients SET
  description = 'Vitamin A is the parent compound of the retinoid family used in skincare (including Retinol, Retinaldehyde and Retinyl Palmitate, each catalogued separately), valued for its role in skin cell turnover and collagen support.',
  function_summary = 'Commonly used as an umbrella term for retinoid-family ingredients that support skin cell turnover, collagen production and the appearance of photoaged skin — see the individually catalogued Retinol, Retinaldehyde and Retinyl Palmitate entries for form-specific evidence. A randomized clinical trial of a topical tretinoin-precursor blend (retinol + retinyl esters, both vitamin A derivatives) found comparable efficacy to prescription tretinoin on photoaging measures with significantly less irritation.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1001/jamadermatol.2022.1891',
  source_type = 'peer_reviewed_literature',
  source_date = '2022-08-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '049ba95b-4d00-4d02-a2ba-c499db4f9386';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('049ba95b-4d00-4d02-a2ba-c499db4f9386', 'https://doi.org/10.1001/jamadermatol.2022.1891', 'Biomarkers of Tretinoin Precursors and Tretinoin Efficacy in Patients With Moderate to Severe Facial Photodamage: A Randomized Clinical Trial', 'JAMA Dermatology', 'peer_reviewed_literature', '2022-08-01', 'moderate'::evidence_level, '24-patient RCT: a topical vitamin-A-derivative blend (retinol + retinyl acetate + retinyl palmitate) matched prescription tretinoin on photoaging scores while causing erythema 6x less often.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Zinc
UPDATE ingredients SET
  description = 'Zinc is an essential trace mineral used in skincare both topically (as zinc oxide, zinc PCA, zinc gluconate and other salts) and referenced generally for its role in skin health, wound healing and sebum regulation.',
  function_summary = 'Commonly used to help support skin health and manage acne, in both oral and topical forms. A systematic review and meta-analysis found acne patients have significantly lower serum zinc levels than controls, and that zinc treatment produces a significant improvement in acne — real, aggregated evidence across the zinc-and-acne literature.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/dth.14252',
  source_type = 'peer_reviewed_literature',
  source_date = '2020-09-15',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '59e33e9f-b278-46c8-8e81-281e370f85dc';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('59e33e9f-b278-46c8-8e81-281e370f85dc', 'https://doi.org/10.1111/dth.14252', 'Serum zinc levels and efficacy of zinc treatment in acne vulgaris: A systematic review and meta-analysis', 'Dermatologic Therapy', 'peer_reviewed_literature', '2020-09-15', 'moderate'::evidence_level, 'PRISMA systematic review/meta-analysis: acne patients had significantly lower serum zinc levels than controls, and zinc treatment (oral and topical) produced significant improvement in acne.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Zinc Gluconate
UPDATE ingredients SET
  description = 'Zinc Gluconate is a well-absorbed zinc salt, used primarily as an oral supplement (and occasionally topically) for inflammatory acne management.',
  function_summary = 'Commonly used, primarily via oral supplementation, to help manage inflammatory acne. A double-blind study of 67 patients with inflammatory acne compared two zinc gluconate dosing regimens over three months, finding real, measurable reductions in inflammatory lesion counts with both regimens.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://pubmed.ncbi.nlm.nih.gov/10846252/',
  source_type = 'peer_reviewed_literature',
  source_date = '2000-06-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '9b7cd7ba-dc00-485f-96ca-572c679c9bcf';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('9b7cd7ba-dc00-485f-96ca-572c679c9bcf', 'https://pubmed.ncbi.nlm.nih.gov/10846252/', 'Efficacy and safety study of two zinc gluconate regimens in the treatment of inflammatory acne', 'European Journal of Dermatology', 'peer_reviewed_literature', '2000-06-01', 'moderate'::evidence_level, '67-patient double-blind study, 3 months: two zinc gluconate dosing regimens both produced real reductions in inflammatory acne lesion counts, with no significant difference between regimens.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Zinc PCA
UPDATE ingredients SET
  description = 'Zinc PCA (zinc salt of L-pyrrolidone carboxylic acid) is a water-soluble zinc salt used in skincare and haircare for its sebum-regulating and antimicrobial properties.',
  function_summary = 'Commonly used to help regulate sebum production, particularly on the scalp and oily skin. A prospective cohort clinical study found a Zinc PCA-containing scalp gel, combined with salicylic acid and piroctone olamine, improved symptoms of moderate-to-severe seborrheic dermatitis, a condition linked to sebum secretion and skin microbiota dysbiosis.',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/jocd.16742',
  source_type = 'peer_reviewed_literature',
  source_date = '2025-01-01',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = 'e5e74596-0360-4214-a0cb-331c26a67b62';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('e5e74596-0360-4214-a0cb-331c26a67b62', 'https://doi.org/10.1111/jocd.16742', 'A Cohort Clinical Study on the Efficacy of Topical Salicylic Acid/Piroctone Olamine Dandruff Pre-Gel and Cleanser in Improving Symptoms of Moderate to Severe Seborrheic Dermatitis of the Scalp', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2025-01-01', 'moderate'::evidence_level, '20-patient prospective cohort study: a Zinc PCA/salicylic acid/piroctone olamine scalp gel and cleanser combination improved moderate-to-severe scalp seborrheic dermatitis symptoms.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Zinc Salicylate
UPDATE ingredients SET
  description = 'Zinc Salicylate is a zinc salt of salicylic acid, combining the sebum-regulating properties of zinc with the exfoliating, anti-inflammatory properties of salicylic acid in a single compound.',
  function_summary = 'Commonly used in acne-focused formulations to combine zinc''s and salicylic acid''s established individual benefits. No dedicated clinical study of the combined zinc salicylate compound itself was found; the established real evidence for each individual component is strong — a systematic review/meta-analysis found zinc treatment significantly improves acne, and salicylic acid has real RCT evidence for acne treatment (see the separately catalogued Salicylic Acid and Zinc entries) — but this is component-level evidence, not compound-specific data.',
  evidence_level = 'limited'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1111/dth.14252',
  source_type = 'peer_reviewed_literature',
  source_date = '2020-09-15',
  confidence = 'low'::confidence_level,
  last_verified_at = now()
WHERE id = 'a1f0e3ba-a23d-4fe5-8591-f053143bff0b';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('a1f0e3ba-a23d-4fe5-8591-f053143bff0b', 'https://doi.org/10.1111/dth.14252', 'Serum zinc levels and efficacy of zinc treatment in acne vulgaris: A systematic review and meta-analysis', 'Dermatologic Therapy', 'peer_reviewed_literature', '2020-09-15', 'limited'::evidence_level, 'Systematic review/meta-analysis establishing zinc''s real efficacy component in acne treatment — cited here as component-level evidence for zinc salicylate, since no compound-specific clinical study was found.'),
  ('a1f0e3ba-a23d-4fe5-8591-f053143bff0b', 'https://doi.org/10.1111/jocd.16568', 'Efficacy and Tolerability of a Novel Cosmetic and Over-the-Counter Facial Acne Regimen Versus a Prescription Treatment', 'Journal of Cosmetic Dermatology', 'peer_reviewed_literature', '2024-09-20', 'limited'::evidence_level, '54-adult double-blind RCT establishing salicylic acid''s real efficacy component in acne treatment — cited here as component-level evidence for zinc salicylate, since no compound-specific clinical study was found.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

-- Vitamin C ~10% (data-quality fix: rename the malformed stub row while
-- also giving it real content, resolving the pre-existing
-- ingredient_generation_requests queue entry for avon-anew-vitc-serum)
UPDATE ingredients SET
  inci_name = 'Vitamin C (10%)',
  description = 'Vitamin C at a 10% concentration refers to a specific formulation strength of ascorbic acid or a vitamin C derivative, commonly called out on product labels as a mid-range strength between gentler low-concentration formulas and more intensive high-strength serums.',
  function_summary = 'Commonly used at 10% as a moderate-strength antioxidant formulation intended to balance efficacy with tolerability for regular use. Clinical evidence for vitamin C broadly (see the separately catalogued Vitamin C and L-Ascorbic Acid entries) supports antioxidant, collagen-synthesis-cofactor and tyrosinase-inhibition benefits at this concentration range, which sits within the commonly studied 5%-20% effective range.',
  typical_concentration_range = '10%',
  evidence_level = 'moderate'::evidence_level,
  verification_status = 'partially_verified',
  source_url = 'https://doi.org/10.1016/j.clindermatol.2026.02.007',
  source_type = 'peer_reviewed_literature',
  source_date = '2026-02-12',
  confidence = 'medium'::confidence_level,
  last_verified_at = now()
WHERE id = '2a81e100-a69b-4853-a8ff-68240e38f031';

INSERT INTO ingredient_sources (ingredient_id, source_url, source_title, publisher, source_type, publication_date, evidence_level, evidence_summary)
VALUES
  ('2a81e100-a69b-4853-a8ff-68240e38f031', 'https://doi.org/10.1016/j.clindermatol.2026.02.007', 'Vitamins and the skin: Vitamin C in dermatology', 'Clinics in Dermatology', 'peer_reviewed_literature', '2026-02-12', 'moderate'::evidence_level, 'Review: clinical studies confirm topical vitamin C''s effectiveness across its commonly formulated concentration range (typically 5%-20%) in preventing photoaging, reducing wrinkles and mitigating hyperpigmentation.')
ON CONFLICT (ingredient_id, source_url) DO NOTHING;

UPDATE ingredient_generation_requests
SET status = 'published',
    resolved_ingredient_id = '2a81e100-a69b-4853-a8ff-68240e38f031',
    resolved_at = now()
WHERE normalized_name = 'vitamin c ~10%'
  AND status = 'pending';
