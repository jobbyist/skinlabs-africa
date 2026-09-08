# SkinLabs backend clone kit

Everything needed to stand the SkinLabs backend up on an external Supabase
project, with structure **and** data, without breaking the running app.

Source project ref: `lxbknnvzkxgmvifksyze` (Lovable Cloud).

The move is deliberately split so the app keeps pointing at the current
backend until the new one has been verified.

---

## Stage 0 — before anything

1. Create (or pick) the target Supabase project and note its region.
2. Have ready: project URL, anon/publishable key, service role key,
   database connection string (with password).
3. Nothing in this stage touches the live app.

## Stage 1 — schema

Apply, in filename order, every file in `supabase/migrations/`:

```bash
supabase link --project-ref <TARGET_REF>
supabase db push            # or: psql "$TARGET_DB_URL" -f <each file in order>
```

Notes:
- `20260907120004_skincare_intelligence_seed.sql` is ~790 KB. If a single
  statement batch times out, split it with
  `scripts/split-seed-migration-chunks.sh` and apply the chunks in order.
- This also loads the reference catalogue (brands, products, ingredients,
  retailers, prices, reviews) — that data does **not** need a separate export.

## Stage 2 — drift patch

The live database has out-of-band changes made outside the migration files
(security hardening REVOKEs, policy tweaks, view options, cron jobs).
Run `02_drift_capture.sql` **against the source** to regenerate the exact
current definitions, then run its output against the target. Then apply
`03_post_apply.sql` (cron jobs, storage bucket, grants).

## Stage 3 — data

Reference/catalogue data arrives with Stage 1. What must be copied live:

| Table | Why |
| --- | --- |
| `news_articles` | Daily Skinny briefings generated after seeding |
| `news_article_views`, `news_article_engagement`, `news_comments` | engagement history |
| `review_images`, `review_ratings`, `review_comments` | review engagement |
| `news_sync_runs` | rate-limit ledger for the Firecrawl/Gemini job |
| `profiles`, `user_roles`, `skincare_recommendations`, `skin_journey_entries`, `ai_credit_transactions` | user data (needs auth users first) |
| `newsletter_subscribers`, `preorders`, `partner_enquiries`, `business_enquiries`, `custom_formula_requests`, `openhaus_waitlist`, `spotlight_brand_requests` | captured leads/orders |

See `04_data_export.md` for the per-table export/import procedure.

## Stage 4 — auth users

Passwords live in the `auth` schema and cannot be re-hashed. Either:

- **Preferred:** copy `auth.users` + `auth.identities` rows verbatim (same
  UUIDs, so every `user_id` foreign reference in Stage 3 stays valid), or
- have users reset their password on first sign-in.

Do Stage 4 **before** Stage 3's user-owned tables.

## Stage 5 — edge functions and secrets

Deploy all functions in `supabase/functions/` to the target:

```bash
supabase functions deploy skincare-ai paystack-payment auth-token-exchange \
  preorder-count newsroom-sync payfast-payment seed-review-images \
  --project-ref <TARGET_REF>
```

`supabase/config.toml` already carries the `verify_jwt = false` settings that
must be preserved. Secrets to set on the target: see `05_secrets.md`.

## Stage 6 — cutover

1. Point `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
   `VITE_SUPABASE_PROJECT_ID`) at the target.
2. Update `supabase/config.toml` `project_id`.
3. Re-point the Paystack webhook URL and the cross-domain auth redirect
   allowlist at the new function host.
4. Run `06_verify.sql` on both projects and compare the counts.
5. Only disable the old cron jobs once the new ones have published a briefing.
