# Email trigger audit — 2026-10-03

Read-only checks against the live project (`gnkpzijxuciiaamakgzm`) and Resend.

## What is configured correctly

- **All 16 DB triggers exist** and each calls `enqueue_email()` with the right template:
  `auth.users` (welcome, verified, password, email change), `profiles` (trial / membership
  lifecycle), `payment_transactions` (receipt, failed, needs-review), `skincare_recommendations`
  (analysis completed / failed), 7 form tables (user confirmation + admin notice), `notify_me_requests`.
  RPCs `cancel_subscription`, `deactivate_account`, `reactivate_account` enqueue their emails.
- **Every template id the SQL layer enqueues is registered** in code (`templates.test.ts` enforces this).
- **Crons live:** `email-outbox-processor` (every minute), `trial-expiring-scan` (hourly),
  `expire-free-trials` (hourly), `newsletter-weekly-digest` (Mon 07:00 UTC), `briefings-sync` (04:00 UTC).
- Outbox history: 0 non-`sent` jobs; delivery webhooks recorded.

## Problems found (need the owner)

1. **Resend domain `skinlabs.co.za` has status `failed`.** Sender is `support@skinlabs.co.za`;
   the last email was sent 2026-09-29. Until the SPF/DKIM/DMARC records verify, new sends will be
   rejected and retried. Fix the DNS records in Resend (Domains → skinlabs.co.za → re-verify).
   (The *"Resend for Skinlabs"* connector in this workspace points at a different account holding
   only `cannaplug012.co.za` domains — use the plain *Resend* connector for SkinLabs.)
2. **`trial-lifecycle-emails-daily` is not scheduled** (known, `CLAUDE.md`). Dry run today
   (`trial_lifecycle_email_plan(current_date)`) returns 0 rows (no trials running), so it is safe to
   schedule now; it must be on before 25 Oct 2026 for the promo T-7 email:
   `SELECT cron.schedule('trial-lifecycle-emails-daily','5 4 * * *',$$SELECT public.enqueue_trial_lifecycle_emails()$$);`
3. **Edge functions are deployed by hand, not from git.** `email-processor` (live v39) and
   `email-unsubscribe` (v25) must be redeployed to get the unsubscribe footer, consent re-check and
   gradient buttons (include the whole `_shared/email/` tree — see docs/email-automation-system.md §13).
4. **Only 1 of 14 members has `marketing_consent = true`** (and that address is unconfirmed), so
   marketing emails reach almost nobody yet. Consent is opt-in at sign-up by design (POPIA).
5. Several trigger-driven emails have **never fired in production** (no trial, payment, membership
   or cancellation events yet), so those paths are verified by code/trigger inspection and unit tests only.

## Changes shipped in this branch

- Migration `20261003100000_smart_routines_basic_access.sql`
- Migration `20261003110000_marketing_email_automations.sql` (functions, `weekly_featured_brands`
  rotation table, 4 cron schedules). Validated against the live schema inside a rolled-back transaction.
