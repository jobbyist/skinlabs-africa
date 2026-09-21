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
| Total ingredients | 128 | 2026-09-21 |
| Ingredients with `description` populated | 0 | 2026-09-21 |
| Ingredients with `category` populated | 126 / 128 | 2026-09-21 (pre-existing) |
| `ingredient_sources` rows | 0 | 2026-09-21 (table just created) |
| `ingredient_concerns` rows | ~31 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_interactions` rows | ~19 | 2026-09-21 (pre-existing curated seed) |
| `ingredient_aliases` rows | 13 | 2026-09-21 (pre-existing curated seed) |
| Candidates in `INGREDIENT_EXPANSION_CANDIDATES.md` | 123 | 2026-09-21 |
| Products live (of 160 catalogued) | 40 | 2026-09-21 (Phase 5, see `SEED_MIGRATION_STATUS.md`) |

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
order by inci_name
limit :batch_size; -- 10-12 for the 6A catch-up burst
```

Cursor: **not started** (first firing should start from the beginning of
the alphabet). Once every one of the original 128 has `description IS NOT
NULL`, Track A is done and the 6A catch-up trigger should be disabled —
all future firings run only Track B + the refresh rotation (6B).

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

- **6A catch-up burst** (temporary, self-terminating): every ~2 hours,
  process a Track A batch (10-12 ingredients) plus continue Phase 5's
  pending product-seed chunks. Disable this trigger once Track A shows
  128/128 with `description IS NOT NULL` and the product seed is complete
  (160/160 products).
- **6B permanent weekly pipeline** (ongoing, no end date): every Tuesday
  06:00 SAST (`0 4 * * 2` UTC), add 25+ new ingredients from Track B, then
  spend remaining batch budget on the refresh rotation. Runs indefinitely.
