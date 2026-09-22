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
| Total ingredients | 128 | 2026-09-22 |
| Ingredients with `description` populated | 8 / 128 | 2026-09-22 |
| Ingredients with `category` populated | 126 / 128 | 2026-09-21 (pre-existing) |
| `ingredient_sources` rows | 18 | 2026-09-22 |
| `ingredient_concerns` rows | ~31 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_interactions` rows | ~19 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_aliases` rows | 13 | 2026-09-21 (pre-existing curated seed) |
| Candidates in `INGREDIENT_EXPANSION_CANDIDATES.md` | 123 | 2026-09-21 |
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
  and slug not in ('aha-bha-complex', 'antioxidant-complex', 'african-potato-extract') -- Track A skip list, see below
order by inci_name
limit :batch_size; -- 10-12 for the 6A catch-up burst
```

Cursor: **8 processed** (batch 01, 2026-09-22, alphabetically through
"Ascorbic Acid" — see batch log below for the full list and the 3-entry
skip list). Next firing resumes from `inci_name > 'Ascorbic Acid'`. Once
every one of the original 128 has `description IS NOT NULL` (or is on the
permanent skip list), Track A is done and the 6A catch-up trigger should
be disabled — all future firings run only Track B + the refresh rotation
(6B).

**Track B — add new ingredients from the living candidate list.**
`supabase/INGREDIENT_EXPANSION_CANDIDATES.md` is consumed top-to-bottom,
section by section. Cursor: **not started** (first unprocessed candidate
is "Betaine" under Humectant). When the file's unprocessed (`[ ]`)
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
