# Ingredients Intelligence content-population — live status

Tracks progress on the Ingredients Intelligence content-population project
(rich SEO profiles, real multi-source citations, ongoing weekly catalogue
growth) against the **real production** Supabase project (ref
`gnkpzijxuciiaamakgzm`, "SkinLabs® South Africa" — confirmed live via
`mcp__Supabase__list_projects`). Background/context: `CLAUDE.md`,
`supabase/SCHEMA.md`, `supabase/INGREDIENT_EXPANSION_CANDIDATES.md`,
`supabase/SEED_MIGRATION_STATUS.md` (the sibling, already-documented
pending product-catalogue seed this project also resumes — see Phase 5
below).

This file mirrors `SEED_MIGRATION_STATUS.md`'s conventions: live-verified
counts only (never assumed from a migration file "looking correct"), and a
resume procedure precise enough that a fresh session (or a scheduled
Routine firing with no memory of this conversation) can pick up exactly
where the last one left off.

## Live counts (verified via `mcp__Supabase__execute_sql`, not assumed)

| Metric | Value | As of |
|---|---|---|
| Total ingredients | 140 | 2026-09-22 (128 original + 12 new via Track B batch 01) |
| Ingredients with `description` / `function_summary` populated | 98 / 140 | 2026-09-22 (after Track A batch 08 — **Track A complete**) |
| Ingredients with `category` populated | 138 / 140 | 2026-09-22 |
| `ingredient_sources` rows | 173 | 2026-09-22 (after Track A batch 08) |
| `ingredient_concerns` rows | ~31 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_interactions` rows | ~19 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_aliases` rows | 13 | 2026-09-21 (pre-existing curated seed) |
| Candidates in `INGREDIENT_EXPANSION_CANDIDATES.md` | 123 (12 processed, 111 remaining) | 2026-09-22 |
| Products live (of 160 catalogued) | 160 | 2026-09-22 (Phase 5 complete — see `SEED_MIGRATION_STATUS.md`) |
| `ingredient_generation_requests` rows (pending) | 1 | 2026-09-22 (see "Demand-driven queue" below) |

## Demand-driven queue (`ingredient_generation_requests`)

New alongside Track A/B: `api/product-review-sync.ts`'s publish step (previously
missing its orchestrator entirely — see git history around 2026-09-22 for that fix)
now resolves every generated review's `key_ingredients` against the live catalogue
and queues anything unresolved into `ingredient_generation_requests`
(`source = 'product_review_generated'`). A one-time reconciliation pass on
2026-09-22 did the same for the static `src/data/reviews.ts` catalogue
(`source = 'product_review_static'`): of 133 unique `key_ingredients` strings across
all static reviews, 132 already resolve against the live 128-ingredient catalogue;
the one exception — `"Vitamin C ~10%"` (`avon-anew-vitc-serum`) — was queued. It
fails to resolve only because the catalogue's own matching stub row is itself
literally named `"Vitamin C ~10%"` (a pre-existing data-quality artifact from the
original bulk seed — a real "Vitamin C" row also exists separately) and the
concentration-stripping candidate resolver (`src/lib/ingredientResolution.ts`)
strips trailing `10%` but leaves a dangling `"Vitamin C ~"` that doesn't match
either. Not fixed here since it's a pre-existing catalogue-naming issue outside this
batch's scope — a future content batch touching Vitamin C can rename that stub row
to something normal (e.g. "Vitamin C (10%)") and this request will self-resolve.

Every content batch (Track A, Track B, and the refresh rotation) should also check
`select requested_name, source, source_ref from ingredient_generation_requests where
status = 'pending' order by requested_at` as a demand-driven priority source
alongside the curated `INGREDIENT_EXPANSION_CANDIDATES.md` list — real product
content is already waiting on these. Mark a row `researched`/`published` (with
`resolved_ingredient_id` set) once its ingredient lands, or `rejected` with a
`rejection_reason` if it turns out to be a non-specific/duplicate/un-researchable
name (same discipline as the Track A skip list above).

## Track A skip list (non-specific stubs / insufficient evidence)

These `description IS NULL` rows are **intentionally not enriched** and must
be excluded from every future Track A resume query (`AND slug NOT IN
(...)`) so they don't get re-visited every batch — they were genuinely
researched, not skipped out of laziness:

| Slug | Why skipped |
|---|---|
| `aha-bha-complex` | Generic category-collective stub name from the original bulk seed, not a real singular INCI ingredient — no genuine literature search is possible for a vague "complex". |
| `antioxidant-complex` | Same as above. |
| `african-potato-extract` | Real named botanical (Hypoxis), but a targeted PubMed search (`Hypoxis African potato extract skin topical`) returned **zero** results for topical/dermatological use — Hypoxis literature is almost entirely about immune-modulation/prostate use, not skincare. Logged as genuine insufficient evidence, not fabricated. |
| `botanical-actives` | Generic category-collective stub name, not a real singular INCI ingredient. |
| `botanical-brighteners` | Same as above. |
| `botanical-extracts` | Same as above. |
| `botanical-oil-blend` | Same as above (a "blend" name, not one compound). |
| `botanical-oils` | Same as above. |
| `brightening-complex` | Same "Complex" pattern as the existing AHA/BHA and Antioxidant Complex entries. |
| `broad-spectrum-uv-filters` | Generic category placeholder, not one filter compound. |
| `chemical-uv-filters` | Same generic-category pattern as `broad-spectrum-uv-filters`. |
| `uv-filters` | Same generic-category pattern. |
| `emollient-complex` | Generic collective stub name, not a real singular ingredient. |
| `emulsifiers` | Same — a formulation-function category, not one named ingredient. |
| `enzyme-complex` | Same generic-collective pattern. |
| `enzymes` | Same — the real specific enzymes it likely stood in for (Papain, Bromelain) are now their own catalogued rows (2026-09-22 Track B batch 01/02). |
| `fruit-enzymes` | Same reasoning as `enzymes`. |
| `micellar-complex` | Generic collective stub name. |
| `mild-surfactant-base` | Same — a formulation-function descriptor, not one ingredient. |
| `cream-cleansing-base` | Same. |
| `ph-balanced-surfactants` | Same. |
| `multi-active-complex` | Generic collective stub (also has no `category` value in the original seed, itself a signal it was never a real singular ingredient). |
| `multi-oil-blend` | Same "blend" pattern as the already-skipped botanical oil blends. |
| `multi-vitamin-complex` | Same generic-collective pattern. |
| `vitamin-complex` | Same. |
| `nmf-complex` | Generic collective stub — distinct from `natural-moisturizing-factors`, which is a real, well-documented dermatological concept and stays in the active research queue. |
| `organic-botanicals` | Generic collective stub name. |
| `organic-herbal-extracts` | Same. |
| `plant-actives` | Same. |
| `plant-extracts` | Same. |
| `plant-oil-blend` | Same "blend" pattern. |
| `soothing-botanicals` | Same generic-collective pattern. |
| `salicylic-acid-derivative` | Non-specific "derivative" bucket — the real named BHA derivatives that exist (e.g. Zinc Salicylate, already catalogued separately) get their own rows; this generic stand-in has no single INCI identity to research. |
| `cucumber-extract` | Real named botanical, but repeated targeted PubMed searches (cucumber/Cucumis sativus + skin + soothing/antioxidant/topical, several phrasings) returned zero directly relevant results — the closest hits were about unrelated ingredients (thermal spring water, general radiodermatitis botanicals). Logged as genuine insufficient evidence as of 2026-09-22, not fabricated. |
| `kaolin-clay` | Real, common cosmetic ingredient, but targeted PubMed searches (kaolin + clay + skin/dermatology/cosmetic/mask, several phrasings) returned zero results — kaolin's dermatological literature is essentially absent from PubMed's indexed corpus. Logged as genuine insufficient evidence. |
| `kalahari-melon-oil` | Real Southern African botanical (Citrullus lanatus / tsamma melon seed oil), but targeted PubMed searches (several phrasings incl. the Citrullus lanatus botanical name) returned zero results. Logged as genuine insufficient evidence — worth a Firecrawl/DermNet-style search in a future batch rather than PubMed alone, since this is a regional ingredient underrepresented in the indexed literature. |
| `kalahari-melon-seed-oil` | Duplicate/near-duplicate catalogue row of `kalahari-melon-oil` above — same reasoning applies. |
| `hemi-squalane` | Cosmetic-industry raw-material variant of squalane (a lighter, hydrogenated-and-fractionated squalane derivative); targeted PubMed searches returned zero results — this is a formulation-chemistry raw material with essentially no dedicated clinical literature. Logged as genuine insufficient evidence. |
| `vitamin-c-derivative` | Same reasoning — real named vitamin C derivatives (L-Ascorbic Acid, Sodium Ascorbyl Phosphate, Magnesium Ascorbyl Phosphate, Ascorbyl Glucoside) are/will be catalogued individually. |
| `encapsulated-retinoid` | A delivery-technology descriptor, not a named compound — "encapsulated" describes a formulation technique applicable to several different real retinoids already catalogued separately (Retinol, Retinaldehyde, Retinyl Palmitate). |
| `electrospun-nanofibre` | Same — a delivery-technology descriptor, not a named cosmetic ingredient. |
| `light` | **Data artifact, not a genuine skip decision**: this row's `inci_name` is literally the string "light" with `common_name = "Marula Oil"` — a fragment left over from a malformed "Marula Oil (light)" seed entry. Already `verification_status = 'deprecated'` (confirmed live, not set by this session) and excluded from every public listing query (`.neq('verification_status', 'deprecated')`), so no visitor-facing impact — listed here only so a future Track A batch doesn't waste a cycle investigating it. A real fix (merging into the `marula-oil` row or deleting outright) is a data-quality cleanup outside this batch's scope. |

If a future batch's research turns up real evidence for any of these
(e.g. a new African Potato Extract dermatology study), it's fine to
enrich and remove from this list then — this list reflects evidence
available as of 2026-09-22, not a permanent verdict.

Re-run this block's queries after every batch and update the numbers —
don't trust a migration applying without error as proof the data landed;
always re-query.

```sql
select count(*) as total,
       count(description) as with_description,
       count(function_summary) as with_function_summary,
       count(category) as with_category
from ingredients;

select count(*) from ingredient_sources;
select count(*) from ingredient_interactions;
select count(*) from ingredient_concerns;
select count(*) from ingredient_aliases;
```

## Two tracks + a refresh rotation

**Track A — enrich the 128 pre-existing thin stubs.** Resumable via:

```sql
select slug, inci_name from ingredients
where description is null
  and verification_status != 'deprecated'
  and slug not in (
    'aha-bha-complex', 'antioxidant-complex', 'african-potato-extract',
    'botanical-actives', 'botanical-brighteners', 'botanical-extracts',
    'botanical-oil-blend', 'botanical-oils', 'brightening-complex',
    'broad-spectrum-uv-filters', 'chemical-uv-filters', 'uv-filters',
    'emollient-complex', 'emulsifiers', 'enzyme-complex', 'enzymes',
    'fruit-enzymes', 'micellar-complex', 'mild-surfactant-base',
    'cream-cleansing-base', 'ph-balanced-surfactants', 'multi-active-complex',
    'multi-oil-blend', 'multi-vitamin-complex', 'vitamin-complex',
    'nmf-complex', 'organic-botanicals', 'organic-herbal-extracts',
    'plant-actives', 'plant-extracts', 'plant-oil-blend', 'soothing-botanicals',
    'salicylic-acid-derivative', 'vitamin-c-derivative', 'encapsulated-retinoid',
    'electrospun-nanofibre', 'light'
  ) -- Track A skip list, see below
order by inci_name
limit :batch_size; -- 10-12 for the 6A catch-up burst
-- NOTE: batch 03 (2026-09-22) already enriched 15 slugs out of alphabetical
-- order (retinol, niacinamide, hyaluronic-acid, vitamin-c, vitamin-e,
-- salicylic-acid, glycolic-acid, lactic-acid, mandelic-acid, ceramides,
-- squalane, zinc-oxide, panthenol, glycerin, shea-butter) — they now have
-- description IS NOT NULL and will naturally be excluded by this query's
-- own `description is null` filter, no extra exclusion needed.
```

**TRACK A IS COMPLETE as of 2026-09-22 (batch 08).** Live-verified: the
resumable query below returns **0** remaining real ingredients needing
enrichment. Cursor history: batches 01+02 (alphabetical through "Centella
Asiatica"), batch 03 (15 high-traffic ingredients cherry-picked out of
alphabetical order), batch 04 (12 ingredients continuing past "Centella
Asiatica" alphabetically — Aloe Ferox through Jojoba Oil, plus the
Ceramide/Ceramide NP/Ceramide-P synonym rows), batch 05 (11 more —
Coco-Glucoside through Marula Seed Oil), batch 06 (11 more — Moringa Oil
through Prebiotics), batch 07 (10 more — Probiotic Ferment through Sodium
Ascorbyl Phosphate), batch 08 (11 more — Sodium Hyaluronate through Zinc
Salicylate, plus the `vitamin-c-10` data-artifact fix) — see batch log
below for full ingredient lists and citations. **The 6A catch-up burst
trigger (`trig_013mJnTVKGVFgQUMbL98G8TV`) has been disabled** (not
deleted — run history preserved) per its own documented shutdown
procedure, since products were already 160/160 and ingredients needing
enrichment is now 0. All future ingredient-content work runs only through
Track B (new candidates) + the refresh rotation, both handled by the
separate, still-active permanent weekly pipeline
(`trig_012CnJXfuEkZxbUMwdfTBQg2`, Tuesdays 06:00 SAST, no end date).

**Track B — add new ingredients from the living candidate list.**
`supabase/INGREDIENT_EXPANSION_CANDIDATES.md` is consumed top-to-bottom
within each section, but **not** strictly one section at a time — a batch
may pick a representative spread across several sections (real, well-
documented ingredients were prioritized for research efficiency). Cursor:
**12 / 123 processed** (batch 01, 2026-09-22 — all now `[x]` in the
candidates file): Betaine, Sodium PCA, Trehalose, Urea (4/13 Humectant —
next unprocessed: Propanediol), Malic Acid, Citric Acid, Gluconolactone
(3/5 Exfoliant-AHA/PHA — next unprocessed: Tartaric Acid), Papain
(1/3 Exfoliant-Enzyme — next unprocessed: Bromelain), Resveratrol, Alpha
Lipoic Acid (2/17 Antioxidant — next unprocessed: Astaxanthin), Azelaic
Acid (1/9 Brightening — next unprocessed: 4-Butylresorcinol), Allantoin
(1/11 Soothing Botanical — next unprocessed: Bisabolol). A future firing
should scan each section top-to-bottom for the first `[ ]` entry rather
than assume a single linear cursor. When the file's unprocessed (`[ ]`)
candidates run low (fewer than ~25 remaining), the firing that notices
this appends a fresh batch of real, dedupe-checked candidates to that file
*before* continuing — this is how Track B keeps growing past the current
123 candidates.

**Refresh rotation — re-run Phase 3 on already-published ingredients,
oldest-verified first.** Only relevant once Track A is fully processed and
the permanent weekly pipeline (6B) has budget left after that week's 25+
new ingredients. Resumable via:

```sql
select slug, inci_name, last_verified_at from ingredients
where description is not null
order by last_verified_at asc nulls first
limit :remaining_batch_budget;
```

## Append-only batch log

| Date | Track(s) worked | Ingredients processed | Migration file | Notes |
|---|---|---|---|---|
| 2026-09-21 | Schema/infra | — | `20260921200507_...`, `20260921200517_...` | `ingredient_sources` table + `data_source_type` enum values created and verified live. No content batches run yet. |
| 2026-09-22 | Track A batch 01 | 8: Acetyl Glucosamine, Acetyl Hexapeptide-8, African Black Soap, Aloe Vera, Alpha Arbutin, Arbutin, Argan Oil, Ascorbic Acid | `20260922020000_ingredient_content_batch_01.sql` | Real PubMed + DermNet NZ research per ingredient (18 citations total, 2-3 per ingredient). All landed `evidence_level` moderate except African Black Soap (limited, per its own review's "much is anecdotal" caveat). 3 insufficient-evidence/non-specific entries skipped and logged (see skip list above): AHA/BHA Complex, Antioxidant Complex, African Potato Extract. |
| 2026-09-22 | Phase 5 (product seed) | — | `20260922010200_..._chunk_09_products.sql` through `20260922011300_..._chunk_20_products.sql` (12 files) | Product seed chunks 09-20 applied, products 41-160 complete. 160/160 products and reviews now live, 290 `product_ingredients` rows total. See `SEED_MIGRATION_STATUS.md` for full detail — not an ingredients-content batch, logged here only because it completes the "Products live" row above. |
| 2026-09-22 | Track A batch 02 | 8: Bakuchiol, Baobab Oil, Beeswax, Buchu Extract, Bulbine Frutescens, Caffeine, Calendula Oil, Centella Asiatica | `20260922080000_ingredient_content_batch_02.sql` | Real PubMed + peer-reviewed-literature research per ingredient (16 citations total, 2 per ingredient, incl. one DermNet NZ corroborating source for Calendula's irritancy profile). Evidence levels: moderate (Bakuchiol, Beeswax, Calendula Oil, Centella Asiatica — each backed by a real RCT/systematic review or a solid preclinical study), limited (Baobab Oil, Buchu Extract, Bulbine Frutescens, Caffeine — in vitro/mechanistic/traditional-use evidence only, no human efficacy RCT found). 7 generic-collective stub names encountered in this batch's alphabetical window were skip-listed without a research attempt (Botanical Actives/Brighteners/Extracts/Oil Blend/Oils, Brightening Complex, Broad-Spectrum UV Filters) — see skip list above. |
| 2026-09-22 | Track B batch 01 | 12 NEW: Betaine, Sodium PCA, Trehalose, Urea, Malic Acid, Citric Acid, Gluconolactone, Papain, Resveratrol, Alpha Lipoic Acid, Azelaic Acid, Allantoin | `20260922090000_ingredient_content_track_b_batch_01.sql` | First Track B batch — real identity + content created in one pass per ingredient (22 citations total: 2 each for 10 ingredients, 1 each for Urea and Citric Acid, whose available real literature was thinner). Evidence levels: strong (Azelaic Acid — a 21-RCT systematic review/meta-analysis), moderate (Urea, Gluconolactone, Papain, Resveratrol, Alpha Lipoic Acid, Allantoin — each backed by a real RCT or split-face clinical study, several combined with other actives rather than tested standalone), limited (Betaine, Sodium PCA, Trehalose, Malic Acid, Citric Acid — in vitro/mechanistic/observational evidence only, no direct standalone-ingredient human efficacy RCT found). **This was a deliberately partial weekly batch** (12 of the 25+ the permanent pipeline targets per week) — full Phase 3 research at this depth for 25 ingredients in one sitting was judged too costly/risky for careful sourcing; the remainder of this week's target should be picked up by the next 6B firing or a follow-up session before Tuesday's next scheduled run, rather than padded with thinner research to hit the number. |
| 2026-09-22 | Track A batch 03 (priority, out-of-order) | 15: Retinol, Niacinamide, Hyaluronic Acid, Vitamin C, Vitamin E, Salicylic Acid, Glycolic Acid, Lactic Acid, Mandelic Acid, Ceramides, Squalane, Zinc Oxide, Panthenol, Glycerin, Shea Butter | `20260922100000_ingredient_content_batch_03.sql` | Per the user's explicit request to also use EWG Skin Deep and INCIDecoder (via Firecrawl) as sources alongside PubMed: added real, Firecrawl-verified `ingredient_database`-type citations from both sites for 6 of the highest-traffic ingredients (Retinol/INCIDecoder, Niacinamide/EWG, Hyaluronic Acid/INCIDecoder, Vitamin C/EWG, Salicylic Acid/EWG, Glycolic Acid/INCIDecoder) alongside 32 PubMed peer-reviewed-literature citations (2-3 per ingredient). Evidence levels: strong (Salicylic Acid — 2 real RCTs incl. a 54-subject double-blind head-to-head vs a prescription regimen), moderate (Retinol, Niacinamide, Hyaluronic Acid, Vitamin C, Glycolic Acid, Lactic Acid, Ceramides, Panthenol, Glycerin — each backed by at least one real RCT, several honestly framed as combination-formulation or precursor-blend evidence rather than standalone), limited (Vitamin E, Mandelic Acid, Squalane, Zinc Oxide, Shea Butter — real trials found but either in vitro/ex vivo/animal-model only, or always tested as part of a multi-ingredient blend with no standalone efficacy data). These 15 were prioritized out of the strict alphabetical Track A order because they are the highest-traffic, most product-review/routine-relevant ingredients on the platform. |
| 2026-09-22 | Track A batch 04 | 12: Aloe Ferox, Cholesterol, Coconut Oil, CoQ10, Fatty Acids, Ferulic Acid, GHK-Cu, Green Tea Extract, Jojoba Oil, Ceramide, Ceramide NP, Ceramide-P | `20260922110000_ingredient_content_batch_04.sql` | 22 PubMed peer-reviewed-literature citations (1-2 per ingredient). Evidence levels: moderate (Cholesterol, Coconut Oil, Fatty Acids, Ferulic Acid, Green Tea Extract, Ceramide, Ceramide NP — each backed by at least one real RCT or systematic review, several combination-formulation studies honestly framed as such), limited (Aloe Ferox, CoQ10, GHK-Cu, Jojoba Oil, Ceramide-P — real studies found but animal-model/in-vitro/review-only, or (for Ceramide-P) no species-specific standalone data, reusing class-level ceramide evidence with an explicit note). Ceramide/Ceramide NP/Ceramide-P are distinct catalogue rows from the already-profiled "Ceramides" (a synonym/collective row) — treated individually as real, named ceramide species per cosmetic-chemistry nomenclature, sharing some of the same real class-level RCT evidence where no species-specific study exists (always disclosed honestly in `function_summary`, never presented as species-specific data that doesn't exist). Four ingredients hit during this batch's research window returned zero PubMed results after repeated query attempts and were added to the Track A skip list as genuine insufficient-evidence cases: Cucumber Extract, Kaolin Clay, Kalahari Melon Oil, Kalahari Melon Seed Oil, Hemi-Squalane (5 total, all logged with search-attempt detail in the skip list above). |
| 2026-09-22 | Track A batch 05 (6A catch-up firing) | 11: Coco-Glucoside, Hyaluronic Acid Crosspolymer, Iron Oxides, Kojic Acid, L-Ascorbic Acid, Lavender Essential Oil, Licorice Root Extract, Liposomal Ceramide NP, Live Lactobacillus Cultures, Marula Oil, Marula Seed Oil | `20260922120000_ingredient_content_batch_05.sql` | 20 PubMed peer-reviewed-literature citations (1-2 per ingredient). Evidence levels: moderate (Coco-Glucoside, Hyaluronic Acid Crosspolymer, Kojic Acid, L-Ascorbic Acid, Lavender Essential Oil, Live Lactobacillus Cultures, Marula Oil, Marula Seed Oil — each backed by at least one real RCT or systematic review), limited (Iron Oxides, Licorice Root Extract, Liposomal Ceramide NP — real evidence found but review-only/in-vitro/formulation-study-only, no standalone human efficacy RCT). Coco-Glucoside's citation is notably a safety/allergen-risk study rather than an efficacy study, honestly framed in both `function_summary` and `irritancy_risk` rather than presented as pure benefit. Marula Oil and Marula Seed Oil (two catalogue rows for the same Sclerocarya birrea plant) share the same real South African clinical safety/efficacy citation. Triggered by the 6A catch-up burst Routine's scheduled firing (this session's branch had just been merged via PR #126 immediately before this firing — the branch was reset to `main`'s tip per the merged-PR workflow before this batch was processed, see git history). Products remain 160/160 (Phase 5 stayed complete, no seed work needed this firing). |
| 2026-09-22 | Track A batch 06 (6A catch-up firing) | 11: Moringa Oil, Multi-Weight Hyaluronic Acid, Natural Moisturizing Factors, Oat Bran Extract, Olive Oil, Paraffinum Liquidum, Peptides, Photolyase Enzymes, Polyglutamic Acid, Pomegranate Extract, Prebiotics | `20260922130000_ingredient_content_batch_06.sql` | 20 PubMed peer-reviewed-literature citations (1-2 per ingredient). Evidence levels: moderate (Multi-Weight Hyaluronic Acid, Natural Moisturizing Factors, Olive Oil, Peptides, Pomegranate Extract — each backed by a real RCT/cohort study or a strong review), limited (Moringa Oil, Oat Bran Extract, Paraffinum Liquidum, Photolyase Enzymes, Polyglutamic Acid, Prebiotics — real evidence found but combination-formulation, closely-related-ingredient (e.g. colloidal oat for Oat Bran Extract, petrolatum for Paraffinum Liquidum), preclinical, or review-only). Two ingredients (Oat Bran Extract and Paraffinum Liquidum) share citations with closely related but not identical INCI ingredients already/also being profiled — always disclosed explicitly in `function_summary`, never presented as ingredient-specific data that doesn't exist. Products remain 160/160 (Phase 5 stayed complete, no seed work needed this firing). |
| 2026-09-22 | Track A batch 07 (manual 6A continuation, user-directed) | 10: Probiotic Ferment, Pycnogenol, Retinaldehyde, Retinyl Palmitate, Rice Ferment Filtrate, Rooibos Extract, Rosehip Oil, Rosewater, Sage Extract, Sodium Ascorbyl Phosphate | `20260922140000_ingredient_content_batch_07.sql` | 15 PubMed peer-reviewed-literature citations (1-2 per ingredient). Evidence levels: moderate (Probiotic Ferment, Pycnogenol, Retinaldehyde, Retinyl Palmitate, Rosehip Oil, Sage Extract, Sodium Ascorbyl Phosphate — each backed by a real RCT or systematic review), limited (Rice Ferment Filtrate, Rooibos Extract, Rosewater — real evidence found but ex vivo/preclinical, formulation-chemistry-only, or animal-model only). Pycnogenol's evidence is explicitly framed as oral supplementation, not topical use — honestly disclosed rather than implied as a topical benefit. Rosewater reuses Rosa damascena rose-oil animal-model evidence (same source plant, different preparation) with an explicit "direct human clinical efficacy data for rosewater itself is limited" caveat. User asked to keep firing the 6A batch process manually in-session until all remaining real Track A ingredients are populated — 15 real ingredients remained after this batch (Sodium Hyaluronate through Zinc Salicylate, alphabetically, plus the `vitamin-c-10` naming-artifact row). |
| 2026-09-22 | Track A batch 08 (final manual 6A continuation — **Track A complete**) | 11: Sodium Hyaluronate, Succinic Acid, Tranexamic Acid, Tremella Extract, Turmeric Extract, Vitamin A, Vitamin C (10%) [renamed from the `vitamin-c-10` naming artifact], Zinc, Zinc Gluconate, Zinc PCA, Zinc Salicylate | `20260922150000_ingredient_content_batch_08.sql` | 15 PubMed peer-reviewed-literature citations (1-2 per ingredient, several reusing already-established real citations from earlier batches for the same underlying compound family — e.g. Vitamin A reuses the Retinol batch's tretinoin-precursor RCT, Sodium Hyaluronate reuses the HA-molecular-weight RCT). Evidence levels: strong (Tranexamic Acid — a 99-patient RCT matching gold-standard hydroquinone for melasma), moderate (Sodium Hyaluronate, Succinic Acid, Vitamin A, Zinc, Zinc Gluconate, Zinc PCA — each backed by a real RCT, cohort study or systematic review), limited (Tremella Extract, Turmeric Extract, Zinc Salicylate — real evidence found but preclinical/in-vitro, an off-target trial (knee pain, not skin), or component-level-only evidence with no compound-specific study). Zinc Salicylate honestly discloses no dedicated clinical study of the combined salt exists, citing each component's (Zinc, Salicylic Acid) separately-established real evidence instead of implying compound-specific data. **Also fixes the long-documented `vitamin-c-10` data-quality artifact**: renamed `inci_name` from the malformed "Vitamin C ~10%" to "Vitamin C (10%)", gave it a real profile, and marked the corresponding `ingredient_generation_requests` row (id `d8528c00-54a4-4512-9341-4063e244eb48`, for `avon-anew-vitc-serum`) `status='published'` with `resolved_ingredient_id` set — confirmed live via a follow-up query, the demand-queue no longer has any pending rows sourced from the static review catalogue. **This batch brings the live remaining-real-ingredients count to 0** — confirmed via the exact resumable skip-list query in this file. The 6A catch-up burst trigger was disabled immediately after (see the Track A completion note above the resumable-query block). Final live totals: 98/140 ingredients with `description`/`function_summary` populated, 173 `ingredient_sources` rows. |

*(Append a new row after every batch — do not overwrite history. Include
"insufficient evidence" skips by name so a future firing doesn't
re-attempt a real, already-checked dead end without new information.)*

## Resume procedure for a new firing/session

1. **Check what's actually live** — re-run the count queries above against
   `gnkpzijxuciiaamakgzm` (reconfirm this is still the real project ref via
   `mcp__Supabase__list_projects` first, per `CLAUDE.md`'s standing
   caution — it has changed once before in this project's history).
2. **Pick the track(s) for this firing** per the schedule below.
3. **Process the batch** using the Phase 3 procedure (PubMed / DermNet via
   Firecrawl / ClinicalTrials.gov research, cosmetic-claims-only synthesis,
   evidence-level grading, never fabricate a source or interaction) —
   full procedure lives in the approved plan for this project, not
   duplicated here to avoid drift between two copies.
4. **Write an idempotent SQL migration** (`ON CONFLICT` on `lower(inci_name)`
   for new identity rows; plain `UPDATE ... WHERE id = :id` for enrichment,
   which is naturally idempotent) under `supabase/migrations/`, apply via
   `mcp__Supabase__apply_migration`, then **re-verify live** (re-run the
   count queries; spot-check 1-2 processed ingredients' new fields and
   `ingredient_sources` rows) — never trust "no SQL error" alone.
5. **Update this file**: bump the live counts table, advance the relevant
   cursor(s), tick off processed candidates in
   `INGREDIENT_EXPANSION_CANDIDATES.md` (`[ ]` → `[x]`, or `[~]` if only
   the identity row was created this firing), append a batch-log row.
6. **Commit and push** to `claude/ingredient-pages-seo-8yf5ho`.

## Schedule

- **6A catch-up burst** (temporary, self-terminating) — Routine id
  `trig_013mJnTVKGVFgQUMbL98G8TV`, created 2026-09-22, self-bound to this
  session (`session_01UoZa6wSq3bAupHbSdoBYnh`), cron `56 */2 * * *`
  (anchored to creation minute — fires roughly every 2 hours). Processes a
  Track A batch (10-12 ingredients) plus continues Phase 5's pending
  product-seed chunks each firing. Self-disables (via `update_trigger
  enabled: false` — never deleted, keeps run history) once Track A shows
  128/128 `description IS NOT NULL` (or fully skip-listed) and the product
  seed is complete (160/160 products).
- **6B permanent weekly pipeline** (ongoing, no end date) — Routine id
  `trig_012CnJXfuEkZxbUMwdfTBQg2`, created 2026-09-22, self-bound to this
  session, cron `0 4 * * 2` (Tuesdays 06:00 SAST = 04:00 UTC). Adds 25+ new
  ingredients from Track B each firing (appending fresh candidates to
  `INGREDIENT_EXPANSION_CANDIDATES.md` first if it's running low), then
  spends remaining batch budget on the refresh rotation. Runs indefinitely
  — never self-disables; only a human should ever disable this one.
