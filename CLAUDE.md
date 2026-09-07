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
- **AI Formulator** (`src/pages/AIFormulator.tsx`) — free-first
  acquisition funnel: Intro → Consent → Quiz → Photo → Results → signup
  gate. `claim_starter_analysis` RPC gates one free analysis for signed-in
  free users.
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
- The Lovable MCP server's tool ID prefix has been observed to change
  across reconnects within the same session (seen as both
  `mcp__Lovable__query_database` and `mcp__<random-uuid>__query_database`).
  If a call to a previously-working Lovable tool name fails as unknown,
  re-run `ToolSearch` (query `"query_database"` or `"lovable"`) to find the
  current name before concluding the connector is down.
- The seed migration (`20260907120004_skincare_intelligence_seed.sql`,
  ~790KB) is too large for one `query_database` call and must be applied in
  chunks — see **`supabase/SEED_MIGRATION_STATUS.md`** for current
  live-application progress and the exact resume procedure (including
  `scripts/split-seed-migration-chunks.sh`, which regenerates the chunks
  deterministically so they don't need to be committed).
- Bun is used as a TS-native script runner for one-off ETL scripts
  (`bun run scripts/<name>.ts`), importing `.ts` data files directly.
