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
- **SKYNN AI (beta)** (`src/pages/AIFormulator.tsx` + `src/components/
  AIFormulator.tsx`, homepage-embedded and at `/ai-formulator`) —
  free-first acquisition funnel, rebranded from "AI Formulator": Intro →
  Consent → Photo → MST → Quiz → Results → signup gate.
  `claim_starter_analysis` RPC gates one free analysis for signed-in free
  users; `isMember` routes Insider/VIP to the live `skincare-ai` edge
  function instead. Subcomponents live in `src/components/ai-formulator/`
  (`StepperHeader`, `MstGrid`, `ConfidencePanel`).
  - **MST (Monk Skin Tone)** — a self-reported, OPTIONAL 1–10 scale
    (`src/data/mstScale.ts`, official Google/Ellis Monk hex values). It is
    a fairness/context signal only, never inferred and never treated as
    diagnostic — see `deriveMstSignal()` in `src/data/formulaResults.ts`
    for the (general, non-fabricated) dermatology guidance it can trigger
    (PIH risk, sunscreen texture) and `supabase/migrations/
    20260907130000_skynn_ai_mst_fields.sql` for its `mst_tone`/
    `mst_source` columns on `skincare_recommendations`.
  - **Grounded recommendations** — `src/lib/skynnProductMatch.ts` picks
    real, SkinLabs-reviewed products from `src/data/reviews.ts` (the same
    pattern as `RoutineBuilder.tsx`) for the starter analysis's AM/PM
    routine and PDF, falling back to generic product-type text rather
    than ever fabricating a product.
  - **"Analysis completeness"** (`computeCompleteness()` in
    `formulaResults.ts`, rendered by `ConfidencePanel`) is deliberately an
    INPUT-completeness measure, not a clinical-accuracy or bias-free-
    performance claim — never rename/relabel it into an accuracy score.
  - A full production fairness pipeline (consent-versioned records,
    `skynn_fairness_events`, benchmark evaluation across all 10 MST
    categories, etc.) is documented as a future blueprint but was
    deliberately NOT built — only the fields actually used today
    (`mst_tone`, `mst_source`, `analysis_completeness`) exist, to avoid
    feature sprawl ahead of real usage.
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
