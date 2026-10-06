# Notification dispatcher — runbook

Delivery half of the notification engine. SQL queues (`enqueue_notification()` → `notification_dispatches`), these
functions deliver. Schema and RPCs: `supabase/migrations/20261003200900…20261003203505_notification_*`.

| Piece | Where |
|---|---|
| Delivery worker | `supabase/functions/notification-dispatcher` (`verify_jwt = false`, custom auth) |
| Tap beacon | `supabase/functions/push-track` (`verify_jwt = false`, always answers 200) |
| Pure rules (tested) | `supabase/functions/_shared/push/notificationDispatch.ts`, `src/lib/__tests__/notificationDispatcher.test.ts` |
| Service worker | `src/sw/sw.ts` (`notificationclick` → `PUSH_TRACK_URL`) |

## How it runs

1. pg_cron `notification-dispatcher` fires every minute **only if** a push is due; it POSTs with
   `x-cron-secret` = Vault `notification_dispatcher_cron_secret` (pg_net waits 5 s, so the function answers `202` at once
   and finishes in `EdgeRuntime.waitUntil`).
2. Auth: any of `x-cron-secret` (checked by `notification_cron_secret_matches`), the service-role bearer, or a signed-in
   admin. No VAPID keys → `503 not_configured` **before** claiming, so dispatches simply stay `pending`.
3. `claim_notification_dispatches(100)` already applied the kill switch, preferences, quiet hours (SAST), daily cap and
   guards. Up to 5 rounds / 40 s while a full batch comes back.
4. Each (dispatch, device) is sent with `web-push` (pool 20, 10 s timeout, TTL 24 h, urgency `low` for
   promotional/briefing/podcast_episode/price_alert). Payload: `{title, body, url, tag, category, d}` where `d` is the
   per-device `push_deliveries.id`.
5. One `push_deliveries` row per device is written **before** pruning. 404/410 → subscription deleted; other failures
   increment `failure_count` and deactivate at 5; success resets it. Every claimed dispatch is closed with
   `complete_notification_dispatch` (`sent` / `partial` / `failed`).
6. Tapping the notification makes the service worker POST `{d}` to `push-track` → `record_push_click` sets `clicked_at`
   and marks the inbox row read.

## Secrets (humans set these; never commit)

`VAPID_PUBLIC_KEY` (same value as `VITE_VAPID_PUBLIC_KEY`), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
(`mailto:support@skinlabs.co.za`). The cron secret lives in Vault only.

## Manual run / smoke test

```bash
# counts back instead of 202 (admin JWT or service role; the cron secret works too)
curl -s -X POST "https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/notification-dispatcher?wait=1" \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN"
```

Queue a test: Admin → Notifications → Overview → "Send a test push to me" (or an admin calls `rpc admin_send_test_notification()`), or as service role
`select public.enqueue_notification('<admin user id>','test_push')`. Expect: a `push_deliveries` row with `status='sent'`,
the dispatch `status='sent'`, and `clicked_at` set after tapping the notification.

## Troubleshooting

* **Dispatches stay `pending`** — `503 not_configured` (missing VAPID secrets) or the global kill switch is off
  (`notification_settings.push_enabled`; flip via `rpc admin_set_notification_settings`). Outside quiet hours/cap they are rescheduled, not failed.
* **`skipped` with `no_devices`** — the member has no active subscription; `preference_off`, `daily_cap`,
  `guard_failed`, `expired` are decided in SQL (see `admin_notification_overview().skip_reasons`).
* **`failed`** — see `push_deliveries.error` (`http_<status>` or a network code). Endpoints/keys/payloads are never
  logged or stored in errors.
* **Tap not recorded** — the worker must be the new one (`dist/sw.js`); check `push-track` is deployed; the id is only
  valid for 30 days.
