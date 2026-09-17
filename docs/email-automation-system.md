# SkinLabs® Email & Lifecycle Automation System

This is the reference doc for the transactional/lifecycle email platform: a
business-event → outbox → Resend pipeline covering authentication, trials,
memberships, billing, SKYNN AI, forms/support, account lifecycle and admin
alerts. It's meant to let another developer understand and extend the
system without reverse-engineering the migrations.

## 1. Architecture

```
Business action (trigger / webhook / edge fn / cron)
   → enqueue_email_event()   INSERT email_events, UNIQUE idempotency_key
   → enqueue_email_job()     INSERT email_outbox,  UNIQUE idempotency_key
        │  (DB triggers only ever write rows — never call Resend directly)
        ▼
email-processor edge function (pg_cron, every 1 minute)
   → claim_pending_email_jobs()   SECURITY DEFINER, FOR UPDATE SKIP LOCKED
   → per job: run the template's guard (re-check CURRENT state, if any)
              → render (layout + template) → POST to send-email
                with Idempotency-Key: <outbox row id>
   → complete_email_job() / fail_email_job() / cancel_email_job()
        │
        ▼
Resend → email-webhooks edge function (delivered/bounced/opened/clicked…)
   → INSERT email_delivery_events, ON CONFLICT (resend_event_id) DO NOTHING
```

Two tables separate **business fact** from **delivery mechanics**:

- `email_events` — "this happened" (e.g. a trial started, a payment
  succeeded). Never a competing source of truth: it records that something
  worth emailing about occurred, and never writes back to `profiles`,
  `payment_transactions`, etc.
- `email_outbox` — "send this template to this address." One event can fan
  out to more than one job (e.g. a form submission enqueues both a user
  confirmation and an admin notification, sharing one event row).
- `email_delivery_events` — Resend's own webhook events, for observability
  (delivered/bounced/opened/clicked), linked back to `email_outbox` by
  `provider_message_id`.

Templates live in **code**, not the database:
`supabase/functions/_shared/email/`. `template_id` on an outbox row is only
ever a lookup key into the in-code registry — this keeps rendering
type-checked and unit-testable, and means a template can be edited without
touching the trigger/business-event layer at all.

## 2. Business event map / template inventory

| Category | Event | Template ID | Source | Idempotency key |
|---|---|---|---|---|
| AUTH | USER_REGISTERED | `auth_welcome` | trigger on `auth.users` INSERT | `user_registered:{user_id}` |
| AUTH | EMAIL_VERIFIED | `auth_email_verified` | trigger on `auth.users` UPDATE (`email_confirmed_at` null→set) | `email_verified:{user_id}` |
| SECURITY | PASSWORD_CHANGED | `auth_password_changed` | trigger on `auth.users` UPDATE (`encrypted_password` changed) | `password_changed:{user_id}:{updated_at}` |
| SECURITY | EMAIL_CHANGED | `auth_email_changed` | trigger on `auth.users` UPDATE (`email` changed) | `email_changed:{user_id}:{new_email}` |
| ACCOUNT | ACCOUNT_DEACTIVATED / REACTIVATED | `account_deactivated` / `account_reactivated` | `deactivate_account()` / `reactivate_account()` RPCs | `account_deactivated:{user_id}:{date}` |
| ACCOUNT | ACCOUNT_DELETED | `account_deleted` | `account-delete` edge fn, enqueued **before** `deleteUser()` | `account_deleted:{user_id}` |
| TRIAL | TRIAL_STARTED | `trial_started` | `notify_subscription_change()` trigger, `trial_plan='insider'` only | `trial_started:{user_id}:{trial_started_at}` |
| TRIAL | TRIAL_EXPIRING (~24h left) | `trial_expiring` | hourly cron `enqueue_trial_expiring_events()` | `trial_expiring:{user_id}:{trial_ends_at::date}` |
| TRIAL | TRIAL_ENDED | `trial_ended` | same trigger, `trial→free` (written by the pre-existing `expire_finished_trials()` cron) | `trial_ended:{user_id}:{trial_ends_at}` |
| MEMBERSHIP | MEMBERSHIP_ACTIVATED | `membership_activated` | same trigger — any → paid tier, or a `trial_plan='glow_lite'` row (see §7) | `membership_activated:{user_id}:{subscription_started_at}` |
| MEMBERSHIP | MEMBERSHIP_UPGRADED | `membership_upgraded` | same trigger, paid → higher paid ladder rank | `membership_upgraded:{user_id}:{subscription_started_at}` |
| MEMBERSHIP | MEMBERSHIP_CANCELLED | `membership_cancelled` | **no source yet** — template defined, dormant (see §7) | `membership_cancelled:{user_id}:{cancelled_at}` |
| BILLING | PAYMENT_SUCCEEDED | `payment_succeeded` | trigger on `payment_transactions` INSERT (`status IN ('success','needs_review')`) | `payment_succeeded:{reference}` |
| BILLING | PAYMENT_FAILED | `payment_failed` | same trigger, `status='failed'` (paystack-payment now logs `charge.failed`) | `payment_failed:{reference}` |
| ADMIN | ADMIN_PAYMENT_NEEDS_REVIEW | `admin_payment_needs_review` | same trigger, `status='needs_review'` (founding-member sold-out race) | `admin_payment_review:{reference}` |
| SKYNN | ANALYSIS_COMPLETED | `analysis_completed` | `notify_new_recommendation()` trigger, `status='delivered'` | `analysis_completed:{recommendation_id}` |
| SKYNN | ANALYSIS_FAILED | `analysis_failed` | same trigger, `status='failed'` (skincare-ai now writes a failure row) | `analysis_failed:{recommendation_id}` |
| FORMS | FORM_SUBMITTED (user + admin) | `form_confirmation_<slug>` / `admin_form_notification_<slug>` | `AFTER INSERT` triggers on each form table | `form_submitted:{table}:{row_id}` / `admin_form_notice:{table}:{row_id}` |
| ADMIN | EMAIL_DELIVERY_FAILED_ALERT | `admin_delivery_failed` | `fail_email_job()`, on a **transactional** job's final failure only | `email_failed_alert:{outbox_id}` |

Form pairs wired: `contact` (new `contact_submissions` table), `partner`
(`partner_enquiries`), `spotlight_brand` (`spotlight_brand_requests`),
`custom_formula` (`custom_formula_requests`), `business`
(`business_enquiries`), `feature_waitlist` (`feature_waitlist` —
confirmation only, no admin notice).

**Not built:**
- A "Smart Routine generated" email — audited and confirmed there's no
  server-side generation event to hook (`SmartRoutines.tsx` hardcodes
  `hasAdvancedAnalysis = false` with a TODO). Building a trigger for this
  would fire on nothing, or worse, fake an event that never happened.
- Marketing/broadcast sending — no marketing-consent column exists on
  `profiles` (see §9). Every template here is `transactional = true`.

## 3. Source-of-truth map

| Domain | Authoritative source |
|---|---|
| Auth identity/lifecycle | `auth.users` (Supabase Auth) |
| Membership/trial tier | `profiles.subscription_status`, `.trial_plan`, `.trial_ends_at`, `.trial_used_at` |
| Payments | `payment_transactions` (unique on `reference`), written by the `paystack-payment` webhook |
| SKYNN analysis result | `skincare_recommendations.status` |
| Forms | one row per form table |
| Account deletion | Supabase Auth admin API result |

## 4. Idempotency model

- `email_events.idempotency_key` and `email_outbox.idempotency_key` are
  both `UNIQUE`. Every insert goes through `enqueue_email_event()` /
  `enqueue_email_job()`, which do `INSERT ... ON CONFLICT (idempotency_key)
  DO NOTHING` and, on conflict, `SELECT` and return the existing row's id.
  Concurrent or duplicate callers always converge on the same row.
- `claim_pending_email_jobs(p_limit)` claims atomically via
  `FOR UPDATE SKIP LOCKED` inside the `UPDATE` — two concurrent processor
  invocations can never claim the same row.
- `complete_email_job(job_id, processing_token, message_id)` only succeeds
  if the row is still `'processing'` under the **exact token** the
  claimant was handed. This stops a reclaimed/retried job from being
  double-completed by a stale worker that wakes up late.
- **Resend-level idempotency**: `email-processor` always sends the outbox
  row's own `id` as Resend's `Idempotency-Key` header (forwarded through
  `send-email`). If the processor crashes after Resend accepts a send but
  before `complete_email_job()` runs, the stuck-job sweep (below) retries
  the row and Resend recognizes the repeated key instead of sending again.
- **Webhook retries (Paystack)**: `payment_transactions.reference` is
  `UNIQUE`, and Postgres never fires `AFTER INSERT` for a row skipped by
  `ON CONFLICT DO NOTHING` — a redelivered webhook can't re-enqueue an
  email even before the outbox layer's own dedup applies.
- **Webhook retries (Resend)**: `email_delivery_events.resend_event_id` is
  `UNIQUE`; a redelivered webhook 23505s on the second insert and is
  treated as a success, not an error.
- **Cron retries**: `enqueue_trial_expiring_events()`'s idempotency key
  embeds the reminder **date**, not a timestamp — an hourly re-run
  produces the same key all day, so only the first run's insert wins.

## 5. Outbox job lifecycle

Statuses: `pending → processing → sent | failed | cancelled` (+
`suppressed`, reserved for a future Resend-suppression-list check, not
wired in v1 — Resend's own global suppression list is relied on instead of
reimplementing one).

**Send-time guards** (`supabase/functions/_shared/email/guards.ts`) —
templates whose content depends on state that can change between enqueue
and send: `trial_expiring` and `trial_ended` re-read `profiles` at send
time and cancel the job (via `cancel_email_job()`) if the trial already
converted or was cancelled before the reminder fired. Payment receipts,
welcome/activation emails and form confirmations have **no** guard — they
describe an immutable past fact, so they're always correct to send.

**Stuck-job sweep**: every `claim_pending_email_jobs()` call first runs
`UPDATE email_outbox SET status='pending' WHERE status='processing' AND
processing_started_at < now() - interval '5 minutes'` — recovers jobs
orphaned by a crashed worker. Safe because of the Resend `Idempotency-Key`
behaviour above.

**Retry/backoff**: `fail_email_job()` computes
`now() + least(2^attempt_count, 60) minutes`, up to `max_attempts` (default
5), then marks the job permanently `failed`. A permanently failed
**transactional** job also raises `EMAIL_DELIVERY_FAILED_ALERT` to the
admin inbox — marketing/non-transactional failures don't, to avoid noise.

## 6. Database schema (migrations)

- `supabase/migrations/20260916100000_email_system_core.sql` — the three
  tables, RLS (service_role-only writes; admin `SELECT` via `has_role()`
  for ad-hoc observability — no dedicated admin UI screen was built,
  matching this project's existing "query directly via SQL until there's a
  concrete reason to build one" precedent), and the six core RPCs
  (`enqueue_email_event`, `enqueue_email_job`, `enqueue_email` convenience
  wrapper, `claim_pending_email_jobs`, `complete_email_job`,
  `fail_email_job`, `cancel_email_job`).
- `supabase/migrations/20260916101000_email_system_triggers.sql` — wires
  everything above into the actual sources of truth: extends
  `notify_new_recommendation()`, `notify_subscription_change()` (the
  existing `notifications`-inbox triggers, whose in-app behaviour is
  unchanged) and adds new triggers on `payment_transactions`,
  `auth.users`, and six form tables (including the new
  `contact_submissions` table); extends `deactivate_account()` /
  `reactivate_account()`; adds `enqueue_trial_expiring_events()` + its
  hourly cron; schedules the `email-outbox-processor` cron (every minute).
- `supabase/migrations/20260916102000_email_system_hardening.sql` —
  post-advisor hardening pass (matches this project's existing
  hardening-migration pattern): `REVOKE` on a rate-limit trigger function
  the linter could otherwise see as PostgREST-callable, and a missing
  `SET search_path` on a helper function.

`email_events.user_id` / `email_outbox.user_id` use `ON DELETE SET NULL`,
**not** `CASCADE` — deliberately, so an account-deletion confirmation
email (and the historical record of every other email) survives the very
account deletion it describes. `recipient_email` is always captured as
plain text at enqueue time for the same reason — it never depends on a
live join to `auth.users`.

## 7. Two schema/product-copy resolutions worth knowing about

1. **Glow Lite vs. trial copy.** The pricing schema's A/B-variant machinery
   technically allows a `trial_plan='glow_lite'` row (from
   `20260907000001_starter_analysis_and_trial_variants.sql`), but Glow
   Lite must never read as a trial. Resolution: email selection branches
   on `trial_plan`, not on `subscription_status='trial'` alone — an
   insider trial gets `TRIAL_*` copy, a glow_lite trial (if that variant
   is ever active) gets plain `MEMBERSHIP_ACTIVATED` copy with no trial
   language.
2. **MEMBERSHIP_CANCELLED has no source.** No cancel-membership code path
   exists anywhere in the app today. The template and enqueue wiring point
   are ready, but nothing calls them — this is intentional, not a gap:
   building a fake trigger for an event that can't happen would violate
   this project's "never make an unfinished feature appear operational"
   rule. Wire it the moment a real cancellation flow ships.

## 8. Resend integration

- Sender: `SkinLabs® South Africa <support@skinlabs.co.za>` everywhere —
  no other identity is used.
- **Brand treatment** (`_shared/email/layout.ts`): the transparent
  SkinLabs logo (`public/email/skinlabs-logo.png`) renders in every
  email's header (140px) and again in the shared footer signature
  (120px). The signature also links `Instagram` (@skinlabsza) and
  `TikTok` (@skinlabsza) below the website link — one shared block
  (`renderSignature()`), never duplicated per-template.
  `templates.test.ts` asserts every one of the 35 templates includes the
  full signature (support email, website, Instagram, TikTok) once
  wrapped in the layout, so a new template can't ship without it.
- **`supabase/functions/send-email`** is the single function that ever
  calls the Resend API. It predates this work (deployed directly to the
  project, untracked by git) and was already used for magic-link-style
  sends; this work (a) committed it into the repo, (b) added an optional
  `idempotency_key` field forwarded as Resend's `Idempotency-Key` header,
  and (c) tightened its access check from "any authenticated user's JWT"
  to service-role-only (compares the bearer token to
  `SUPABASE_SERVICE_ROLE_KEY` directly), since its only legitimate caller
  now is `email-processor`.
- **`supabase/functions/email-processor`** claims jobs, renders, and calls
  `send-email`. Runs every minute via the `email-outbox-processor` pg_cron
  job, authenticated with a hardcoded `x-cron-secret` header (same idiom
  as the existing `daily-skinny-sync`/`openhaus-*` jobs) that must match
  the `EMAIL_CRON_SECRET` edge function secret.
- **`supabase/functions/email-webhooks`** receives Resend's delivery
  webhook (Svix-signed: `svix-id`/`svix-timestamp`/`svix-signature`
  headers, HMAC-SHA256 verified against `RESEND_WEBHOOK_SECRET`) and logs
  `email_delivery_events`.
- Auth **token-bearing** emails (signup confirmation link, magic link,
  password-reset link) are deliberately outside this whole pipeline — they
  keep flowing through Supabase Auth's own delivery path (and whatever
  Auth Hook wiring is configured in the Supabase Dashboard, which is
  outside this repo and wasn't touched).

### Required secrets (none settable from this environment — same
documented-gap pattern as `MARKETPLACE_CRON_SECRET`)

| Secret | Status |
|---|---|
| `RESEND_API_KEY` | Already set (pre-existing, used by `send-email`) |
| `EMAIL_CRON_SECRET` | **Set** — matches the value hardcoded in the `email-outbox-processor` pg_cron job; confirmed live via a direct `curl` against `email-processor` returning `HTTP 200` |
| `RESEND_WEBHOOK_SECRET` | **Set** — confirmed live: a real test send produced both `email.sent` and `email.delivered` rows in `email_delivery_events`, correctly linked to the originating outbox row |
| `ADMIN_NOTIFICATION_EMAIL` | Optional — defaults to `support@skinlabs.co.za` in code if unset (not explicitly set; the default is correct per spec but the explicit override is unverified) |

### DNS / deliverability

The Resend account behind `RESEND_API_KEY` did not have `skinlabs.co.za`
as a verified sending domain at the time this system was built (confirmed
via a live domain check: 0 domains, 0 webhooks, one API key). Real sends
from `support@skinlabs.co.za` will be rejected by Resend until the domain
is added and its SPF/DKIM/DMARC DNS records are published — a manual step
outside this environment's reach. Verify with `list-domains` before
assuming production email actually works.

## 9. Marketing consent

Audited: **no marketing-consent column or table exists.**
`newsletter_subscribers` is a standalone, unlinked email-capture table
(not tied to `profiles`/`user_id`); `profiles.cookie_consent` is a
GDPR/POPIA cookie-banner flag, unrelated to email preferences. This system
ships **transactional/lifecycle email only** — every `email_outbox` row
defaults `transactional = true` and is never gated on marketing consent,
which is correct (transactional mail must not depend on opt-in). No
campaign/broadcast sending was built, since doing so without real consent
infrastructure would mean inventing a second, ungoverned consent system.
If marketing sends are ever built, they must add and check a real
`profiles.marketing_opt_in`-style column first — never reuse
`newsletter_subscribers` or `cookie_consent` for that purpose.

## 10. Testing

- `supabase/functions/_shared/email/__tests__/templates.test.ts` — every
  registered template renders without required vars missing, subject/
  preheader are non-empty, and the assembled (layout-wrapped) HTML
  contains the brand signature. Also spot-checks copy correctness (e.g.
  `membership_activated` never says "trial" for a `glow_lite` plan).
- `supabase/functions/_shared/email/__tests__/guards.test.ts` — the
  `trial_expiring`/`trial_ended` guards against a fake Supabase client,
  covering: still-active trial → send; converted to paid → cancel;
  reverted to free → cancel; no `user_id` → cancel.
- `supabase/functions/_shared/email/__tests__/outbox.integration.test.ts`
  — DB-backed idempotency tests (duplicate event → one row; concurrent
  enqueue → one job; same-day cron replay → one job; concurrent
  `claim_pending_email_jobs` → no overlapping claims; stale
  `processing_token` rejected by `complete_email_job`; webhook replay →
  `23505` on the second `email_delivery_events` insert, not a duplicate
  row). This is a new pattern for the repo — no existing test here talks
  to Supabase — justified because unique-constraint/concurrency
  correctness can't be verified as a pure function. Skips entirely (via
  `test.skip`, not a thrown error) unless `SUPABASE_SERVICE_ROLE_KEY` and
  `SUPABASE_URL`/`VITE_SUPABASE_URL` are set, so `bun test` stays green
  with no secrets configured; every row it creates is prefixed with a
  per-run id and deleted in `afterAll`.

Run with `bun test supabase/functions/_shared/email/__tests__/`, or just
`bun test` for the whole repo.

### Delivery semantics — precise, not aspirational

- **At-least-once business event recording** (DB-enforced by
  `ON CONFLICT DO NOTHING`, not exactly-once in the sense that a caller
  can still race, but the *result* always converges to one row).
- **At-most-once email job creation per idempotency key** (same
  mechanism).
- **At-least-once job processing** (crash-safe via the stuck-job reclaim
  sweep).
- **Best-effort external delivery**, bounded by Resend's own
  `Idempotency-Key` retention window — this is what keeps a genuine
  crash-after-Resend-accepted scenario from becoming a real duplicate send
  in practice, but it is not a database-level guarantee once the request
  has left this system. This system never claims exactly-once delivery to
  an inbox.

## 11. How to add a new business event + email

1. Decide the authoritative source (a trigger on an existing table, a new
   RPC, a cron scan, or an edge function). Don't invent a new state column
   just to make email easier — reuse whatever already answers "did this
   happen."
2. Build a deterministic idempotency key from real identifiers already
   available at that source (never a bare timestamp) — see the patterns
   in §2/§4.
3. Call `enqueue_email_event()` (or the `enqueue_email()` convenience
   wrapper, which does both event + job in one call) from a
   `SECURITY DEFINER` trigger/RPC, following the `REVOKE ALL FROM PUBLIC,
   anon, authenticated; GRANT EXECUTE TO service_role` idiom used
   throughout `20260916100000_email_system_core.sql`.
4. Add the template (see §12) and, if its content depends on mutable state
   that could change before send, add a guard in `guards.ts`.
5. Add it to the inventory table in `templates.test.ts`'s expected-ids
   list and re-run `bun test`.

## 12. How to add a new template

1. Pick a `category` from the taxonomy (`AUTH, ACCOUNT, MEMBERSHIP, TRIAL,
   BILLING, SKYNN, ROUTINES, PRODUCT, SUPPORT, FORMS, SECURITY, SYSTEM,
   ADMIN, MARKETING`).
2. In the matching file under `supabase/functions/_shared/email/templates/`
   (or a new one, added to `templates/index.ts`'s import list), call
   `registerTemplate({ id, category, internalName, transactional,
   requiredVars, subject, preheader, render })`. Build the body with the
   shared components in `../components.ts` (`emailHeading`,
   `emailParagraph`, `emailButton`, `emailNotice`, `emailKeyValueTable`,
   `emailDivider`) — never hand-roll HTML or duplicate the signature
   block, which `renderEmailLayout()` in `layout.ts` already adds to every
   email exactly once.
3. `requiredVars` should list every variable `render()`/`subject()`/
   `preheader()` actually reads — `email-processor` calls
   `missingRequiredVars()` before sending and fails the job loudly instead
   of shipping a broken email.
4. Deploy `email-processor` via `mcp__Supabase__deploy_edge_function`,
   including the full `_shared/email/` tree (the deploy tool resolves
   relative imports against the virtual root it's given — see the
   deployment note below).

## 13. Deployment notes

Edge functions here are multi-file (`email-processor` imports the entire
`_shared/email/` tree). When deploying via
`mcp__Supabase__deploy_edge_function`, pass `entrypoint_path:
"email-processor/index.ts"` and include every shared file with its path
**relative to `supabase/functions/`** (e.g. `_shared/email/layout.ts`,
`_shared/email/templates/auth.ts`) in the same `files` array — this
mirrors exactly how the Supabase CLI itself resolves a function's `../
_shared/...` imports. `send-email` and `email-webhooks` are self-contained
single files and deploy with the default `entrypoint_path: "index.ts"`.

After any DDL change to this system, run
`mcp__Supabase__get_advisors` (both `security` and `performance`) and
confirm no new findings reference the new tables/functions — the
performance advisor's response is large enough to need saving to a file
and grepping rather than reading whole (see this project's own standing
practice in `CLAUDE.md`).

## 14. Known gaps / fast-follows

- `MEMBERSHIP_CANCELLED` is dormant until a real cancellation flow exists
  (§7).
- No admin UI reads `email_events`/`email_outbox`/`email_delivery_events`
  yet — query them directly via SQL, same precedent as
  `skynn_fairness_summary`. Worth a dashboard tab once there's a concrete
  operational need, not before.
- Marketing/broadcast sending is out of scope until real consent
  infrastructure exists (§9).
