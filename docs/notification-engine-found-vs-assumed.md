# Notification engine reconciliation: found vs assumed (2026-10-04)

The engine was applied straight to the live project (`gnkpzijxuciiaamakgzm`) on 3 Oct 2026. This note records what was
actually read before the repo was reconciled.

## Files opened
`CLAUDE.md`, `docs/pwa.md` (grep for push/VAPID sections only), `src/sw/sw.ts` (push + click handlers),
`src/lib/pwa/swCore.ts` (grep only), `src/lib/pwa/pushPayload.ts`, `src/lib/pwa/constants.ts`,
`src/lib/pwa/notificationManager.ts` (grep only), `supabase/functions/push-send/index.ts`,
`supabase/functions/_shared/push/dispatch.ts`, `supabase/functions/_shared/payments/authedUser.ts`,
`src/lib/__tests__/pwaPush.test.ts` (head), `src/pages/Welcome.tsx` (grep only), `src/components/dashboard/GettingStartedChecklist.tsx`
(grep only), `src/lib/dashboardTabs.ts` (grep only), `src/pages/AdminDashboard.tsx` (tab list only),
`scripts/check-supabase-types.ts`, `supabase/config.toml` (tail).
Not read in full: swCore.ts, notificationManager.ts, Welcome.tsx, the checklist, AdminDashboard.tsx.

## Found
* Live had 7 `notification_*` migrations not in the repo (versions 20261003200900 … 20261003203505). Exported verbatim; each
  file's MD5 equals `md5(statements[1])` in `supabase_migrations.schema_migrations`.
* The first migration's header comment points at `supabase/migrations/20261006100000_notification_engine_core.sql`, which does
  not exist. It was left unedited as instructed.
* `notification-dispatcher` and `push-track` were **not deployed** (function list checked 2026-10-04); built in this branch.
* The service worker did not carry a delivery id or report taps; `pushPayload.ts` only knew 6 categories.
* No admin UI for the engine exists in the repo (AdminDashboard has no Notifications tab) and the member preference UI
  (`notificationManager.ts`) only knows the original 6 categories. The new categories (`report_ready`, `skin_weather`,
  `journal_reminder`, `price_alert`) and quiet hours / daily cap are reachable only through SQL/RPCs today.
* Welcome and the Getting Started checklist have no push step.

## Assumed (not verified)
* `VITE_VAPID_PUBLIC_KEY` is set in production (stated by the owner; not checked from here).
* `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` Edge secrets exist (cannot be read from this environment).
