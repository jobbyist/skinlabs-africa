# Skincare intelligence DB — live migration status

Tracks progress applying the 5 migrations in `supabase/migrations/20260907*
_skincare_intelligence_*.sql` to the live "skinlabsza" Supabase project
(Lovable project_id `3a7fffe1-a651-4cb0-9824-839db53d00ae`, Supabase project
ref `lxbknnvzkxgmvifksyze`). Background/context: `CLAUDE.md`, `supabase/
SCHEMA.md`.

## Status as of this writing

| Migration | Status |
|---|---|
| `20260907120000_skincare_intelligence_core.sql` (enums, lookups, brands, ingredients) | ✅ Applied |
| `20260907120001_skincare_intelligence_products.sql` (products, variants, versions, ingredients, fit, claims, scores, climate fit) | ✅ Applied |
| `20260907120002_skincare_intelligence_commerce_reviews.sql` (retailer listings, price history, reviews) | ✅ Applied |
| `20260907120003_skincare_intelligence_indexes_functions.sql` (indexes, `current_product_prices` view, `search_products()`) | ✅ Applied |
| `20260907120004_skincare_intelligence_seed.sql` (160 products / 50 brands / 128 ingredients, real data from `src/data/reviews.ts`) | 🔶 Partially applied — see below |

**Don't trust this table blindly** — verify live state before resuming (see
"Check what's actually live" below). It was accurate when written but the
seed migration was still being applied in a background process when this
file was committed: as of this writing, 40 of 160 products (chunks
00-05 of the 21-chunk split described below) were confirmed live via REST.

## Why the seed migration is chunked

`20260907120004_skincare_intelligence_seed.sql` is ~790KB / ~13,500 lines.
The only available path to run SQL against this project in this environment
is `mcp__Lovable__query_database` (the Supabase MCP server has no access to
this project — see CLAUDE.md), and that tool's `sql` parameter cannot
reliably carry the whole file in one call. So the file gets split into
smaller chunks and applied one at a time.

Every chunk is **idempotent and safe to re-run**: the lookups chunk uses
`ON CONFLICT ... DO NOTHING`, and every per-product `DO $product$ ... END
$product$;` block re-selects the existing row when its INSERT no-ops on
conflict. There is no harm in re-applying an already-applied chunk.

## How to resume in a new session

1. **Check what's actually live** (don't rely on the table above):

   ```bash
   cd /path/to/your/repo   # navigate to your local repo directory
   set -a; source .env; set +a
   curl -sS "$VITE_SUPABASE_URL/rest/v1/products?select=id" \
     -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
     -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
     -H "Prefer: count=exact" -D - -o /dev/null | grep -i content-range
   ```

   The seed data totals 160 products (and 160 published reviews, one per
   product). If the count is already 160, the seed migration is done —
   just spot-check a couple of tables (`brands` should be 50, `ingredients`
   should be 128) and update the status table above.

   If migrations 1-4 haven't landed at all (a `products` query returns
   `PGRST205: could not find the table`), start from migration 1, not the
   seed — apply each of files 1-4 in full via `mcp__Lovable__query_database`
   (each is small enough to send in one call), in order, then come back to
   the seed migration below.

2. **Regenerate the seed chunks** (they are NOT committed to the repo —
   only this script and the source migration are):

   ```bash
   bash scripts/split-seed-migration-chunks.sh
   ```

   This writes `chunk_00_lookups.sql` through `chunk_20_products.sql` to
   `.seed-chunks/` in the repo root (gitignored — pass a different output
   dir as the first arg if you'd rather use a scratch directory). It always
   reproduces the exact same 21 files byte-for-byte from the same source
   migration.

3. **Apply chunks in order**, starting from `chunk_00_lookups.sql`, via the
   `mcp__Lovable__query_database` tool (`project_id`:
   `3a7fffe1-a651-4cb0-9824-839db53d00ae`). For each chunk: read its full
   content, pass that exact content as the `sql` parameter, and confirm the
   result is `{"rows":[]}`. Since every chunk is idempotent, it's fine (and
   simplest) to just re-apply chunk 00 and all product chunks from 01
   onward, even ones that already landed — nothing will be duplicated or
   overwritten incorrectly.

   If you know roughly how many products are already live (e.g. 32 of 160
   from the products count in step 1), you can skip straight to the chunk
   whose products start after that point — each product chunk holds 8
   products in slug order matching the source file, so 32 live products
   means chunks 01-04 are done and you can start at chunk_05. When in
   doubt, just start from chunk_01 anyway — the `ON CONFLICT DO NOTHING`
   guards make redundant application harmless, just slightly slower.

   **Important tool-name note:** the Lovable MCP server's tool ID prefix
   has been observed to change across reconnects in this environment (seen
   as both `mcp__Lovable__query_database` and
   `mcp__<random-uuid>__query_database` in the same session). If a call to
   `mcp__Lovable__query_database` fails with a "tool not found"-style
   error, use `ToolSearch` with query `"query_database"` to find the
   current name before retrying.

4. **Handle connector timeouts.** `mcp__Lovable__query_database` has a
   documented history (see CLAUDE.md) of going unresponsive — 60s timeouts
   on every call, including trivial ones like `select 1;` — for stretches
   of a session, while `mcp__Lovable__get_database_status` keeps responding
   normally on the same connector. There is currently no fallback path (no
   service-role key in `.env`, and the Supabase MCP server has no access to
   this project — confirmed via `mcp__Supabase__list_projects`, which only
   returns an unrelated project). If you hit this: retry a couple of times,
   and if it's still down, wait and retry later (a `send_later` /
   scheduled-trigger check-in works well for this — see how this session
   used it) rather than giving up or routing the data somewhere else.

5. **Verify — don't trust "no error" alone.** After the last chunk, re-run
   the REST count check from step 1 and confirm it reads 160. Also
   spot-check a couple of specific products' `product_scores` via REST
   against the same product's `DO $product$` block in the source migration
   file — this migration has already had one transcription slip (a hand-
   copied score off by one) that only a value-level spot-check caught, not
   just a row-count check.

## Once seed data is fully live

Update the status table above, and per the original task tracker: mark
"Confirm schema migrations applied to live DB" and "Apply seed data to live
DB and spot-check via REST API" as completed. The "Data Quality" tab in
`/admin` (`src/pages/AdminDashboard.tsx`) will start showing the imported
brands/ingredients/products for verification once the seed data is live.
