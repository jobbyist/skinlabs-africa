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
  the DB, not from constants in code.
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

- Live Supabase project ("skinlabsza") is only reachable in this
  environment via the **Lovable MCP connector**
  (`mcp__Lovable__query_database`, project_id
  `3a7fffe1-a651-4cb0-9824-839db53d00ae`) — the Supabase MCP server has no
  access to this project. `supabase/config.toml`'s `project_id`
  (`lxbknnvzkxgmvifksyze`) is the Supabase project ref, a different ID
  from the Lovable project_id above — don't confuse the two.
- `mcp__Lovable__query_database` has a history of going unresponsive
  (60s timeouts on every call, including `select 1;`) for stretches of a
  session, while `get_database_status` on the same connector keeps
  responding. When this happens there is currently no fallback path (no
  service-role key in `.env`, only the anon/publishable key, and
  Postgres DDL can't go through PostgREST anyway) — migrations get
  written and committed but their live-application status must be
  verified via a live REST API check
  (`curl "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1"` with the
  publishable key — a `PGRST205` "could not find the table" response
  means it's NOT applied) before ever reporting a migration as "applied."
  Don't assume a migration succeeded just because the SQL file exists and
  looks correct.
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
- The **Supabase MCP connector in this environment has zero access to the
  SkinLabs project** — it's authenticated against a different, unrelated
  Supabase account (`list_projects` returns only a project called
  "Puntr"). This means no `deploy_edge_function`/`get_project`/etc. against
  SkinLabs is possible here — confirmed by trying, not assumed. Edge
  function source changes (e.g. `supabase/functions/skincare-ai/index.ts`)
  get committed and pushed like any other file, but actually deploying
  them to the live Supabase Edge Runtime requires the team's normal
  pipeline (Lovable's sync, or `supabase functions deploy` via someone
  with dashboard/CLI access) — never report an edge function change as
  "live" from this environment, only "committed."
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
