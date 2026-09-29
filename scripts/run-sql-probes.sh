#!/usr/bin/env bash
# Runs every supabase/tests/*.sql probe against SUPABASE_DB_URL (a Postgres
# connection string with the migration owner's rights, e.g. the pooler
# "postgres" user). Each probe is one DO block that ALWAYS ends by raising:
# "…_PASSED" means every assertion held; anything else fails the run. Because
# the block raises, the whole transaction rolls back — safe on production.
set -uo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set — skipping SQL probes."
  exit 0
fi

status=0
for f in supabase/tests/*.sql; do
  out=$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=0 -X -q -f "$f" 2>&1)
  if grep -q "_PASSED" <<<"$out"; then
    echo "PASS  $f  $(grep -o '[A-Z_]*_PASSED[^"]*' <<<"$out" | head -1)"
  else
    echo "FAIL  $f"
    echo "$out" | sed 's/^/      /'
    status=1
  fi
done
exit $status
