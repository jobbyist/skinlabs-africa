# SkinLabs — project memory

Durable context for future work on this repo. Keep this updated as major
architecture changes land; don't duplicate detail that already lives in
code comments or `supabase/SCHEMA.md` — link to it instead.

## Product principle (standing instruction, do not violate)

SkinLabs = South African skincare intelligence infrastructure, not a
content subscription. Optimise for: free acquisition, AI analysis
completion, first-party skin-profile creation, SEO discovery,
ingredient/product knowledge accumulation, retention, trust, selective
monetisation, proprietary data accumulation, strategic value. Avoid
feature sprawl; prefer reusable data models over page-level features;
never sacrifice editorial independence for monetisation; never fabricate
social proof, scarcity, product data, reviews, ratings or performance
claims; never expose sensitive user data; never make an unfinished
feature appear operational.

## Major systems

- **Entitlements** — `src/lib/entitlements.ts` is the single source of
  truth for plan tiers (Glow Explorer/Lite/Insider/VIP, founding member,
  professional). Use `isPaidSubscriptionStatus()` — `subscription_status`
  is written as `"insider"`/`"vip"`, never literally `"premium"`. Gating
  goes through `useEntitlements` + `FeatureGate`/`UpgradePrompt`, not ad
  hoc checks.
- **SKYNN AI (beta)** — free-first acquisition funnel, rebranded from "AI
  Formulator": Intro → Consent → Photo → MST → Quiz → Results → signup
  gate. Lives at **`/skynn-ai`** (`/ai-formulator` is a permanent
  `<Navigate replace>` redirect in `src/App.tsx` — keep both routes; never
  delete the redirect). Page wrapper is `src/pages/AIFormulator.tsx`; all
  logic/UI is `src/components/AIFormulator.tsx` (still named
  `AIFormulator` deliberately — only the route/nav copy is branded SKYNN
  AI, the file/component names were left alone to minimise churn).
  `claim_starter_analysis` RPC gates one free analysis for signed-in free
  users; `isMember` routes Insider/VIP to the live `skincare-ai` edge
  function instead. Subcomponents live in `src/components/ai-formulator/`
  (`StepperHeader`, `MstGrid`, `ConfidencePanel`). Nav/link text should
  always read "Skin Analysis (SKYNN AI)" (Header/Footer/About/Products/
  UserDashboard), never bare "AI Formulator" — except genuinely historical
  content (dated newsroom articles, the 2025 roadmap timeline entry in
  About.tsx, past `Announcements.tsx` entries) which must keep the old
  name since it's a factual record of what shipped at the time.
  - **MST (Monk Skin Tone)** — a self-reported, OPTIONAL 1–10 scale
    (`src/data/mstScale.ts`, official Google/Ellis Monk hex values, plus
    `mstBand()` bucketing into light 1-3/medium 4-7/deep 8-10). It is a
    fairness/context signal only, never inferred and never treated as
    diagnostic — see `deriveMstSignal()` in `src/data/formulaResults.ts`
    for the (general, non-fabricated) dermatology guidance it can trigger
    (PIH risk, sunscreen texture) and `supabase/migrations/
    20260907130000_skynn_ai_mst_fields.sql` for its `mst_tone`/
    `mst_source` columns on `skincare_recommendations`.
  - **Grounded recommendations** — `src/lib/skynnProductMatch.ts` picks
    real, SkinLabs-reviewed products from `src/data/reviews.ts` (the same
    pattern as `RoutineBuilder.tsx`) for the starter analysis's AM/PM
    routine and PDF, falling back to generic product-type text rather
    than ever fabricating a product. `matchStats` on the returned
    `GroundedRoutine` records how many of the 4 attempted category
    lookups actually found a product — this feeds the fairness pipeline
    below, don't let it silently drift out of sync with `am`/`pm`.
  - **"Analysis completeness"** (`computeCompleteness()` in
    `formulaResults.ts`, rendered by `ConfidencePanel`) is deliberately an
    INPUT-completeness measure, not a clinical-accuracy or bias-free-
    performance claim — never rename/relabel it into an accuracy score.
  - **Fairness-benchmarking pipeline** (`supabase/migrations/
    20260907140000_skynn_fairness_pipeline.sql`) — append-only,
    no-PII `skynn_fairness_events` table (write via `src/lib/
    skynnFairness.ts`'s `logFairnessEvent()` from the starter path, and
    directly from `supabase/functions/skincare-ai/index.ts` for the live
    AI path, which additionally runs `scanComplianceFlags()` against the
    model's own output for named-diagnosis violations — the one rule
    that's actually checkable without fabricated ground truth). Admin-only
    `skynn_fairness_summary` view aggregates completeness/grounded-match-
    rate/compliance-flag-count per MST band so a gap for e.g. "deep" tones
    surfaces as a real catalogue/prompt gap to fix, not a hidden average.
    No admin UI reads this yet (deliberately — query it directly via SQL
    until there's a concrete reason to build one; don't add a dashboard
    tab speculatively).
- **Monetisation** — DB-driven, not hardcoded: `pricing_plans`,
  `credit_packs`, `pricing_experiment_variants` tables; `src/lib/
  pricing-config.ts` does variant bucketing; `paystack-payment` edge
  function is DB-driven. Pricing page and dashboard read plan config from
  the DB, not from constants in code. `credit_packs` includes both
  `single_1` (R25, one "Analysis Pass") and `starter_3` (R59, 3 passes) —
  `single_1` already existed on the live project with this exact
  price/credits (name "1 Analysis Pass", not "Analysis Pass") before
  `20260908150000_user_dashboard_redesign.sql`'s `ON CONFLICT DO NOTHING`
  insert ran, so the row currently reads the pre-existing name; harmless
  functionally, but don't be surprised the display name doesn't match the
  migration file. Every verified charge is also logged to `payment_transactions` by the
  webhook (idempotent on `reference`), which is what the dashboard's
  Billing tab reads for transaction history and downloadable receipts
  (`src/lib/generateInvoicePdf.ts` — a real receipt from that row, never a
  fabricated invoicing system).
- **User dashboard** (`src/pages/UserDashboard.tsx`,
  `src/components/dashboard/*`) — tab-based member area:
  Home/Profile/Skin Analysis/Routine/Skin Journey/Billing/Inbox/Security/
  Account, with `?tab=` synced to the URL so notifications and emails can
  deep-link into a specific tab. "Profile strength" (`src/lib/
  profileStrength.ts`, shown as a ring on Home) is a broader,
  encouragement-only completeness score across optional fields (phone,
  address, allergies, routine time) — distinct from the stricter, RLS-
  enforced `is_profile_complete()`/`useProfileComplete()` gate used for
  commenting and the AI Formulator; don't conflate the two. The routine
  tracker (`routine_steps`/`routine_checkins` tables, `use-routine.ts`) is
  user-authored (no fabricated products) with a simple daily-completion
  streak. The inbox (`notifications` table) is populated only by real
  server-side triggers (a new AI analysis, a credit grant, a plan change —
  see `20260908150000_user_dashboard_redesign.sql`, hardened in
  `20260908160000_dashboard_redesign_hardening.sql` per the Supabase
  advisors: RLS policies use `(select auth.uid())`, and the trigger
  functions are explicitly revoked from `anon`/`authenticated` since a
  bare `CREATE OR REPLACE FUNCTION` doesn't carry forward an earlier
  `REVOKE`), never fabricated
  client-side; dermatologist messaging is a genuinely unshipped feature and
  is labelled "Coming soon" with a `feature_waitlist` opt-in rather than
  any working-looking chat UI. Temporary deactivation is a reversible
  `deactivate_account()`/`reactivate_account()` RPC pair; permanent
  deletion goes through the `account-delete` edge function (only the
  service-role admin API can remove an `auth.users` row) and cascades via
  `ON DELETE CASCADE` through every user-owned table. Data export
  (`src/lib/generateAccountDataPdf.ts`) is a client-side PDF built from the
  same reads already used to render the dashboard — no separate export
  pipeline.
- **Skincare intelligence database** — normalized schema (brands,
  products, product_variants, product_versions, ingredients,
  product_ingredients, retailers, retailer_products, product_prices
  (append-only price history), reviews, etc.) meant to eventually power
  reviews, AI Skin Analysis, recommendations, ingredient analysis, Shelf
  Showdowns, Spotlight, climate-fit scoring, SEO pages, price
  intelligence, and future B2B APIs. Every fact table carries provenance
  (source_url/source_type/source_date/verification_status/verified_by/
  confidence/last_verified_at) and a data_quality_status
  (unverified/partially_verified/verified/deprecated). Full docs,
  entity list, and example queries: **`supabase/SCHEMA.md`**. Admin
  verification queue lives in the "Data Quality" tab of
  `src/pages/AdminDashboard.tsx`. Seed ETL: `scripts/seed-skincare-
  intelligence.ts` (imports real data from `src/data/reviews.ts` only —
  never fabricates).

## Infrastructure notes

- **There are two, unrelated live databases reachable from this
  environment — do not confuse them.** As of 2026-09-08 (verified by
  cross-checking a write against the real production REST API, not
  assumed):
  1. **The real production project** — Supabase ref `gnkpzijxuciiaamakgzm`
     ("SkinLabs® South Africa"), exactly what `.env`'s `VITE_SUPABASE_URL`
     and `supabase/config.toml`'s `project_id` point to, and therefore
     what the deployed app and its edge functions actually run against.
     Reachable from this environment via the **Supabase MCP server**
     (`mcp__Supabase__execute_sql` / `apply_migration` /
     `deploy_edge_function` / `get_advisors` etc., `project_id
     gnkpzijxuciiaamakgzm`) — despite older guidance in this file, the
     Supabase MCP connector in this environment does have working access
     to this project; don't assume otherwise without trying it fresh.
  2. **The Lovable-native "Cloud Database"** — reachable via
     `mcp__Lovable__query_database` (Lovable project_id
     `3a7fffe1-a651-4cb0-9824-839db53d00ae`, the same project also
     addressable via `mcp__Lovable__get_project`). This is Lovable's own
     bundled Supabase-backed database, separate from #1 — most likely a
     holdover from before the "Cut over app config to the Supabase
     connector project" commit (04298d8) moved the app to project #1.
     Writes made here (including DDL) succeed and are readable back
     through the *same* `query_database` tool, but do **not** appear on
     project #1's REST API, even for a trivial existing-row `UPDATE`, with
     no caching layer involved (`cf-cache-status: DYNAMIC` on the REST
     response) — this was misread as "PostgREST schema cache staleness"
     once already; it is not that. **Do not use the Lovable connector to
     apply or verify migrations** — anything done through it has no effect
     on what users actually experience. Its only remaining known use is
     inspecting the Lovable project's own metadata (name, screenshot,
     publish status) via `get_project`/`get_database_status`, not its data.
  Given this, always resolve the real project ref with
  `mcp__Supabase__list_projects` (or read `.env`/`supabase/config.toml`)
  before assuming it, rather than trusting a project ref documented here
  or anywhere else without a fresh check — it has already changed once.
- A migration is only "applied" once it succeeds via
  `mcp__Supabase__apply_migration` (or `execute_sql`) against the real
  project ref **and** a follow-up read — either
  `mcp__Supabase__execute_sql` against `information_schema`, or better, a
  live REST check (`curl "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1"`
  with the publishable key — a `PGRST205` "could not find the table"
  response means it's NOT applied and reachable) — confirms it against
  that same project. Don't report a migration as "applied" from the SQL
  file looking correct, from a Lovable `query_database` result, or from
  `apply_migration` returning success without also confirming which
  project it landed on.
- After any DDL change, run `mcp__Supabase__get_advisors` (both
  `security` and `performance`) — it reliably catches missing FK indexes,
  RLS policies re-evaluating `auth.<fn>()` per row instead of
  `(select auth.<fn>())`, and SECURITY DEFINER functions left callable by
  `anon`/`authenticated` when they shouldn't be (a plain `CREATE OR
  REPLACE FUNCTION` does **not** carry forward a previous `REVOKE` on that
  function — each redefinition needs its own explicit `REVOKE ALL ... FROM
  PUBLIC, anon, authenticated` if that's still the intent). The
  `performance` advisor's JSON response is large enough to blow the tool's
  token budget on a database this size — expect it to save to a file and
  `grep` that file for the specific table/pattern you care about rather
  than requesting the whole thing.
- Deploying an edge function for real means
  `mcp__Supabase__deploy_edge_function` against the real project ref
  (`gnkpzijxuciiaamakgzm`) with the function's full source inlined as
  `files`, matching whatever `verify_jwt` setting `supabase/config.toml`
  declares for it (this codebase's payment/auth functions all set it to
  `false` and verify the JWT themselves inside the handler). Committing
  the function's source to this repo does **not** deploy it — confirm with
  `mcp__Supabase__list_edge_functions` (or a live request) that the
  function you expect actually exists and reflects the source you just
  committed, rather than assuming the commit was enough.
- The seed migration (`20260907120004_skincare_intelligence_seed.sql`,
  ~790KB) is too large for one `query_database` call and must be applied in
  chunks — see **`supabase/SEED_MIGRATION_STATUS.md`** for current
  live-application progress and the exact resume procedure (including
  `scripts/split-seed-migration-chunks.sh`, which regenerates the chunks
  deterministically so they don't need to be committed).
- Bun is used as a TS-native script runner for one-off ETL scripts
  (`bun run scripts/<name>.ts`), importing `.ts` data files directly.
- New tables need an **explicit `GRANT`** to `anon`/`authenticated` even
  when an RLS policy already covers the same role+command — an RLS policy
  alone does not imply the underlying table-level privilege on this
  project, and the failure mode is a misleading `42501 "new row violates
  row-level security policy"` even though `pg_policies` shows the policy
  is correct. Always pair `CREATE POLICY ... FOR INSERT TO anon` with
  `GRANT INSERT ON <table> TO anon` (see existing migrations for the
  pattern) and verify with a live REST insert, not just by reading the
  policy back.
- A `RETURNING`/`Prefer: return=representation` insert (or any `.select()`
  chained onto `.insert()` in supabase-js) additionally requires the
  connecting role to satisfy a **SELECT** policy on that table, since
  Postgres RLS treats the returned row as a read. A write-only table (like
  `skynn_fairness_events`, admin-only SELECT) must be inserted into
  WITHOUT `.select()`/`RETURNING` from anon/authenticated context, or the
  insert itself gets rejected — don't "fix" this by loosening the SELECT
  policy just to make a debug query work.
- Earlier revisions of this file claimed "the Supabase MCP connector has
  zero access to the SkinLabs project (only sees an unrelated project
  called 'Puntr')." That was true at the time but is **not current** —
  as of 2026-09-08 `mcp__Supabase__list_projects` correctly returns the
  real `gnkpzijxuciiaamakgzm` project (see the infrastructure bullet
  above), and edge functions can be deployed to it directly via
  `mcp__Supabase__deploy_edge_function`. Re-verify with
  `mcp__Supabase__list_projects` each session rather than trusting either
  version of this claim — access here has already changed once without
  this file being updated at the time.
- Headless Chromium (Playwright) launched in this sandbox does **not**
  automatically route through the environment's `HTTPS_PROXY` — every
  outbound call from a real browser page (Supabase, Google Fonts, ad
  networks) fails with `net::ERR_CONNECTION_RESET` unless the browser is
  launched with `proxy: { server: process.env.HTTPS_PROXY, bypass:
  "127.0.0.1,localhost" }`. Even then, some third-party hosts (ad/font/
  analytics CDNs) still fail inside the tunnel — expected sandbox noise,
  not a real bug. For verifying a Supabase read/write actually works,
  prefer a direct `curl` against the REST API (curl respects
  `HTTPS_PROXY` natively) over a full browser E2E test.
