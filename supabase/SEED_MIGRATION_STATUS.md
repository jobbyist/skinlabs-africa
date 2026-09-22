# Skincare intelligence DB — live migration status

Tracks progress applying the 5 migrations in `supabase/migrations/20260907*
_skincare_intelligence_*.sql` to the **real production** Supabase project
(ref `gnkpzijxuciiaamakgzm`, "SkinLabs® South Africa" — confirmed live via
`mcp__Supabase__list_projects`, matching `.env`'s `VITE_SUPABASE_URL` and
`supabase/config.toml`'s `project_id`). Background/context: `CLAUDE.md`,
`supabase/SCHEMA.md`.

## Correction (2026-09-13)

Earlier revisions of this file targeted a **different, superseded** Supabase
project (`lxbknnvzkxgmvifksyze`, the pre-cutover "skinlabsza" project, applied
via `mcp__Lovable__query_database`). That work is not reflected on the real
production project at all — as of 2026-09-13, a direct check of
`gnkpzijxuciiaamakgzm` found the four schema/index migrations applied (tables,
enums, RLS, `search_products()` all present) but **zero rows** in every
knowledge table. The seed migration had simply never been run against the
project the app actually uses. This file now tracks the real project only;
do not resume against the old ref.

## Status as of this writing

| Migration | Status |
|---|---|
| `20260907120000_skincare_intelligence_core.sql` (enums, lookups, brands, ingredients) | ✅ Applied |
| `20260907120001_skincare_intelligence_products.sql` (products, variants, versions, ingredients, fit, claims, scores, climate fit) | ✅ Applied |
| `20260907120002_skincare_intelligence_commerce_reviews.sql` (retailer listings, price history, reviews) | ✅ Applied |
| `20260907120003_skincare_intelligence_indexes_functions.sql` (indexes, `current_product_prices` view, `search_products()`) | ✅ Applied |
| `20260907120004_skincare_intelligence_seed.sql` (160 products / 50 brands / 128 ingredients, real data from `src/data/reviews.ts`) | ✅ Applied — all 160 products/reviews live |

**Live counts, verified via `mcp__Supabase__execute_sql` against
`gnkpzijxuciiaamakgzm` (not assumed), as of 2026-09-22:** 128/128 ingredients,
50/50 brands, 8/8 categories, 8/8 skin_types, 7/7 skin_concerns, 12/12
retailers all fully seeded (chunk 00). **160/160 products/reviews live**
(all 21 chunks — chunk 00 lookups + chunks 01–20 products — applied and
verified chunk-by-chunk via a product-count check after every
`apply_migration` call), 290 `product_ingredients` rows. The seed migration
is fully applied; `get_advisors` (security + performance) was re-run after
the final chunk and found no new findings attributable to this seed data —
only pre-existing, schema-level findings (unindexed FKs, RLS
`auth.<fn>()` re-evaluation pattern, unused indexes, multiple permissive
policies) that predate this seed and apply to the products/reviews tables
generically, not specifically to the newly added rows.

One transcription slip happened while manually re-applying chunk 01 in this
session (a dropped `retailer_products` INSERT caused a price to be misattributed
to the wrong retailer for `sb-niacinamide-10`) — found and repaired via a
follow-up migration, then chunks 01–05 were re-verified by querying the exact
expected slug list back out of `products` after every chunk. Do the same
verification after every future chunk; don't trust "no SQL error" alone.

## Why the seed migration is chunked

`20260907120004_skincare_intelligence_seed.sql` is ~790KB / ~13,500 lines —
too large to reliably paste as a single `mcp__Supabase__apply_migration` call.
So the file gets split into smaller chunks and applied one at a time.

Every chunk is **idempotent and safe to re-run**: the lookups chunk uses
`ON CONFLICT ... DO NOTHING`, and every per-product `DO $product$ ... END
$product$;` block re-selects the existing row when its INSERT no-ops on
conflict. There is no harm in re-applying an already-applied chunk.

## How to resume in a new session

1. **Check what's actually live** (don't rely on the table above) — either a
   live REST check:

   ```bash
   cd /path/to/your/repo
   set -a; source .env; set +a
   curl -sS "$VITE_SUPABASE_URL/rest/v1/products?select=id" \
     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
     -H "Prefer: count=exact" -D - -o /dev/null | grep -i content-range
   ```

   or, from inside a session with the Supabase MCP server, just
   `mcp__Supabase__execute_sql` a `select count(*) from public.products;`
   against project_id `gnkpzijxuciiaamakgzm` (confirm this is still the real
   project ref via `mcp__Supabase__list_projects` first — it has changed once
   already, see CLAUDE.md's infrastructure notes).

   The seed data totals 160 products (and 160 published reviews, one per
   product). If the count is already 160, the seed migration is done.

2. **Regenerate the seed chunks** (NOT committed to the repo — only this
   script and the source migration are):

   ```bash
   bash scripts/split-seed-migration-chunks.sh
   ```

   This writes `chunk_00_lookups.sql` through `chunk_20_products.sql` (21
   files, 8 products per product-chunk — this exact size was chosen because
   it reliably stays under the `Read` tool's 25,000-token page cap; do not
   regenerate with a larger group size, it was tried and made things worse)
   to `.seed-chunks/` in the repo root (gitignored). It always reproduces the
   exact same 21 files byte-for-byte from the same source migration.

3. **Apply chunks 06–20 in order**, via `mcp__Supabase__apply_migration`
   (`project_id: gnkpzijxuciiaamakgzm`). For each chunk:
   a. `Read` the chunk file in full.
   b. Reproduce its exact content as the `query` parameter of
      `apply_migration` — copy mechanically, do not paraphrase or "clean up"
      anything, and do not skip any `DO $product$` block.
   c. **Immediately verify** — extract the chunk's product slugs (e.g.
      `grep -oE "SELECT '[a-z0-9-]+', b\.id" chunk_NN_products.sql`) and query
      `select slug from public.products where slug = ANY(ARRAY[...])` to
      confirm all 8 landed. If any are missing, apply just that missing
      product's block as a small follow-up migration (do not re-run the
      whole chunk blind — `ON CONFLICT DO NOTHING` will silently no-op the
      products that DID land, which is fine, but re-verify after any fixup).
   d. If a chunk applies but a later spot-check finds a wrong value (e.g. a
      price attached to the wrong retailer), fix it with a small, explicit
      `UPDATE`/`INSERT` migration referencing the correct source values from
      the chunk file — don't try to "undo" by deleting and re-running the
      whole `DO` block, since `ON CONFLICT DO NOTHING` means most of it won't
      re-insert.

4. **Verify — don't trust "no error" alone.** After the last chunk, re-run
   the REST/SQL count check from step 1 and confirm it reads 160. Also
   spot-check a couple of specific products' `product_scores`/`product_prices`
   via REST or SQL against the same product's `DO $product$` block in the
   source migration file.

5. After all 160 land, run `mcp__Supabase__get_advisors` (security +
   performance) once more, since this is a large batch of new rows.

## Once seed data is fully live

Update the status table above. The "Data Quality" tab in `/admin`
(`src/pages/AdminDashboard.tsx`) shows the imported brands/ingredients/products
for verification as they land — it already reflects the 40 products live now.
