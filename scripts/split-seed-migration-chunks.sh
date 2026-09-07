#!/usr/bin/env bash
# Splits supabase/migrations/20260907120004_skincare_intelligence_seed.sql into
# smaller, independently-applyable chunks for the Lovable `query_database` MCP
# tool, which cannot reliably accept the full ~790KB file in one call.
#
# Every chunk is safe to (re-)apply any number of times: the lookups chunk
# uses `ON CONFLICT ... DO NOTHING`, and every per-product `DO $product$ ...
# END $product$;` block re-selects existing rows when the INSERTs no-op on
# conflict. So resuming after a partial application just means re-running
# this script and re-applying chunks from wherever the live product count
# (see supabase/SEED_MIGRATION_STATUS.md) says you left off.
#
# Usage:
#   scripts/split-seed-migration-chunks.sh [output_dir] [blocks_per_chunk]
#
# Produces:
#   <output_dir>/chunk_00_lookups.sql       — categories/skin_types/skin_concerns/retailers/brands/ingredients
#   <output_dir>/chunk_01_products.sql      — first N product DO blocks
#   <output_dir>/chunk_02_products.sql      — next N product DO blocks
#   ...
#
# Apply each chunk in order (00 first, then 01, 02, ...) via the Lovable MCP
# query_database tool against project_id 3a7fffe1-a651-4cb0-9824-839db53d00ae.
# See supabase/SEED_MIGRATION_STATUS.md for full instructions and current
# progress.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED="$REPO_ROOT/supabase/migrations/20260907120004_skincare_intelligence_seed.sql"
OUT="${1:-$REPO_ROOT/.seed-chunks}"
GROUP="${2:-8}"

if [ ! -f "$SEED" ]; then
  echo "Seed migration not found at $SEED" >&2
  exit 1
fi

mkdir -p "$OUT"
rm -f "$OUT"/chunk_*.sql

# ---------- chunk 00: everything before the first product DO block ----------
FIRST_DO_LINE="$(grep -n '^DO \$product\$' "$SEED" | head -1 | cut -d: -f1)"
if [ -z "$FIRST_DO_LINE" ]; then
  echo "Could not find any 'DO \$product\$' block in $SEED" >&2
  exit 1
fi
sed -n "1,$((FIRST_DO_LINE - 1))p" "$SEED" > "$OUT/chunk_00_lookups.sql"

# ---------- product chunks: group consecutive DO $product$ ... END $product$; blocks ----------
grep -n '^DO \$product\$' "$SEED" | cut -d: -f1 > /tmp/.seed_split_starts.$$
grep -n '^END \$product\$;' "$SEED" | cut -d: -f1 > /tmp/.seed_split_ends.$$
paste /tmp/.seed_split_starts.$$ /tmp/.seed_split_ends.$$ > /tmp/.seed_split_blocks.$$
rm -f /tmp/.seed_split_starts.$$ /tmp/.seed_split_ends.$$

total_blocks="$(wc -l < /tmp/.seed_split_blocks.$$ | tr -d ' ')"
i=0
chunknum=1
gstart=""
gend=""
while read -r start end; do
  if [ $((i % GROUP)) -eq 0 ]; then
    gstart="$start"
  fi
  i=$((i + 1))
  gend="$end"
  if [ $((i % GROUP)) -eq 0 ]; then
    printf -v cn "%02d" "$chunknum"
    sed -n "${gstart},${gend}p" "$SEED" > "$OUT/chunk_${cn}_products.sql"
    chunknum=$((chunknum + 1))
  fi
done < /tmp/.seed_split_blocks.$$
if [ $((i % GROUP)) -ne 0 ]; then
  printf -v cn "%02d" "$chunknum"
  sed -n "${gstart},${gend}p" "$SEED" > "$OUT/chunk_${cn}_products.sql"
fi
rm -f /tmp/.seed_split_blocks.$$

echo "Wrote $(ls "$OUT"/chunk_*.sql | wc -l | tr -d ' ') chunk files to $OUT (from $total_blocks product blocks)."
