# Academy Phase 0 — baseline & approvals (2026-10-07)

Owner decisions: **D1–D12 accepted at the recommended defaults** (see ACADEMY_IMPLEMENTATION_PLAN.md §1).

## Baseline on `main` @ e0997dc (before any Academy code)
| Check | Result |
|---|---|
| `bun install --frozen-lockfile` | OK (1146 packages) |
| `npm run build:tanstack-start` (alone) | fails: `src/routes/$.ts` imports `dist/index.html` — build order matters, run `vite build` first (it still generates `src/routeTree.gen.ts`, which tsc needs) |
| `npx tsc -p tsconfig.app.json --noEmit` | **0 errors** (the 317-error note in CLAUDE.md is stale) |
| `npx eslint .` | 1 error, 23 warnings. The error is pre-existing: `src/integrations/supabase/previewAuthStorage.ts:38 prefer-const` |
| `bun test` | 885 pass / 6 skip / **1 fail** (pre-existing: `giveaway.test.ts` expects CTA "Enter the Giveaway", code says "Enter the giveaway") |
| `npx vite build` | OK |
| `search-index:check`, `types:check` | OK |
| `npx playwright test` (4 projects, built `dist`) | see "Playwright baseline" below |

## Playwright baseline
Run against the production build with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`. Pre-existing failures (all unrelated to Academy; present before any change): `giveaway.e2e.ts` (journey + landing + TikTok), `notifications-member.e2e.ts` (Settings → App → Notifications), `pwa.e2e.ts` (checklist/install), one in `admin-notifications.e2e.ts`. Exact counts are in the PR description.

## Spikes
- `payment_checkout_intents`: only CHECK is `gateway IN (payfast, paypal)` — **no purchase_type CHECK**, so a `"course"` purchase type needs no DDL there. `payment_transactions` likewise has none.
- Email: `email_outbox.category` CHECK = AUTH, ACCOUNT, MEMBERSHIP, TRIAL, BILLING, SKYNN, ROUTINES, PRODUCT, SUPPORT, FORMS, SECURITY, SYSTEM, ADMIN, MARKETING. No ACADEMY category: Phase 8 either maps Academy mail to existing categories (enrolment/certificate → ACCOUNT or PRODUCT) or adds one by migration. `email_events` has no category CHECK.
- `PodcastPlayer`: `usePodcastPlayer()` exposes `toggle()`, `close()`, `isPlaying`, `current` → the Academy audio player can call `close()`/`toggle()` when it starts. No new API needed.
- `profiles` live statuses: free, vip, trial (insider), plus founding-member flag. `resolveTier()` in `use-membership.ts` is mirrored in SQL by `academy_user_tier()`.
- Live Supabase is Postgres 17.6; `CREATE OR REPLACE TRIGGER` and `storage.objects` policy creation both work there (checked in a rolled-back transaction).
- A signed URL cannot be minted from a Postgres RPC → `academy-asset-url` edge function (architecture corrected).
