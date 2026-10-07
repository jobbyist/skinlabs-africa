# Academy Phase 1 — foundations (2026-10-07)

## Added
- `supabase/migrations/20261007100000_academy_foundations.sql` — **in the repo, NOT applied live** (needs owner go-ahead; see below).
  18 tables (config, role assignments, instructors, categories, courses, versions, modules, lessons, lesson content, assets, lesson assets, sources, course instructors, prerequisites, publication reviews, accreditations, audit log, enrolments[schema only]); RLS on every table with all default grants revoked then re-granted narrowly (column-level for public reads); internal + client helpers; publish gate `academy_validate_version()`; workflow RPCs (submit / review / publish / unpublish); admin RPCs (config, roles, accreditation save/verify); triggers (version state machine, frozen published content, author ≠ reviewer, prerequisite cycles, accreditation verify-only-by-RPC, append-only audit log); 3 storage buckets (`academy-audio`, `academy-resources` private; `academy-course-media` public) with path-scoped staff policies; two unpublished launch tracks (D1).
- `supabase/tests/academy_foundations.sql` — rolled-back probe, 61 assertions.
- `src/lib/academy/{terminology,blocks,access,rpc}.ts`, `src/hooks/use-academy-config.ts`, `src/hooks/use-academy-roles.ts` (no UI, nothing routed).
- Tests: `academyTerminology.test.ts` (guard + SQL/TS regex parity), `academyBlocks.test.ts`, `academyAccess.test.ts` (12 tests).

## Verification
| Check | Result |
|---|---|
| SQL probe on a local Postgres 16 with a stubbed Supabase schema | `ACADEMY_FOUNDATIONS_PASSED 61 assertions` |
| SQL syntax features on live (Postgres 17.6, rolled back) | storage policies + `CREATE OR REPLACE TRIGGER` OK |
| Full migration + probe on live in one rolled-back transaction | **not completed**: the first live attempt surfaced a real bug (`text[] || unknown literal` in the validator, fixed with `array_append`); re-running it needs the migration pasted through the SQL tool again. Run `scripts/run-sql-probes.sh` with `SUPABASE_DB_URL` after applying. |
| tsc | 0 errors |
| eslint | unchanged vs baseline (1 pre-existing error, 23 warnings); no new findings |
| bun test | 897 pass / 1 fail (same pre-existing giveaway failure) — +12 new tests |
| search-index / types guard | OK |
| e2e | not affected (no UI, no routes) |

## Decisions / deviations (also in DB spec §11)
- Assessments, progress, certificates etc. are deliberately absent (Phases 3–8).
- Added `academy_assets.course_id`, `academy_lessons.mentions_accreditation_topic`.
- Learner asset delivery is an edge function (`academy-asset-url`), not an RPC.
- Rollout stage `preview` is staff-only for now (no allow-list).

## To apply live (owner approval required)
1. Apply the migration (`mcp__Supabase__apply_migration`), then `get_advisors` (security + performance).
2. Run `supabase/tests/academy_foundations.sql` against live (always rolls back).
3. Regenerate `src/integrations/supabase/types.ts`, delete `src/lib/academy/rpc.ts` shim, run `npm run types:check`.
4. Assign the first Academy roles only when a real instructor exists (`academy_admin_assign_role`). Platform admins already have admin rights.
`rollout_stage` stays `disabled`; no member-visible change.
