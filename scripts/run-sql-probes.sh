#!/usr/bin/env bash
# Runs every supabase/tests/*.sql probe against SUPABASE_DB_URL (a Postgres
# connection string with the migration owner's rights, e.g. the pooler
# "postgres" user). Each probe is one DO block that ALWAYS ends by raising:
# "…_PASSED" means every assertion held; anything else fails the run. Because
# the block raises, the whole transaction rolls back — safe on production.
set -uo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set — skipping SQL probes."
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
    echo "::warning title=SQL probes skipped::The SUPABASE_DB_URL repository secret is not set, so no SQL probe ran. Add it under Settings > Secrets and variables > Actions."
    [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && echo "### SQL probes skipped — \`SUPABASE_DB_URL\` secret is NOT set" >> "$GITHUB_STEP_SUMMARY"
    # Set REQUIRE_SQL_PROBES=1 (a repository variable) to make a missing secret a failure.
    [[ "${REQUIRE_SQL_PROBES:-}" == "1" ]] && exit 1
  fi
  exit 0
fi
[[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && echo "### SQL probes: \`SUPABASE_DB_URL\` secret is set" >> "$GITHUB_STEP_SUMMARY"

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
