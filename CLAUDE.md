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
  - **"Advanced" tier naming (2026-09-15)** — the paid/membership tier of
    SKYNN AI's analysis (previously "Advanced Skin Analysis"/"Advanced
    Analysis") is now branded **"Advanced AI Dermatology Report"** across
    `src/pages/SmartRoutines.tsx`, `AdvancedAssessmentCard.tsx`,
    `AnalysisPassPurchaseModal.tsx` and `AnalysisPassesCard.tsx` —
    deliberately "from SKYNN AI" rather than a bare possessive, to avoid
    implying SKYNN AI itself is a dermatologist. The medical-advice FAQ on
    `/routines` was strengthened to explicitly say the report is
    AI-generated, not a clinical diagnosis, precisely because "Dermatology
    Report" reads more clinical than the old name — don't drop that
    disclaimer if this copy is touched again. `/routines`'s hero also
    gained a real, Adobe-Stock-licensed editorial photo
    (`public/images/smart-routines-hero.jpg`, licensed and cropped via the
    Adobe MCP connector, not AI-generated — this environment's Adobe
    connector has no text-to-image tool, only Stock search/license +
    Photoshop-style editing) and the page's duplicate bottom-of-page CTA
    (a second button that just repeated the primary "get your report" CTA)
    was replaced with a distinct "Compare access options" anchor to the
    pricing cards.
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
- **Ingredients Intelligence Layer** (`/ingredients`, `/ingredients/:slug`,
  `/ingredients/checker`) — public, free, SEO-indexed directory/detail/
  checker built on the `ingredients`/`ingredient_concerns`/
  `ingredient_interactions` tables above, extended (never duplicated) by
  migrations `20260913080000_ingredients_intelligence_extensions.sql`
  (adds `ingredients.category`, a new `ingredient_aliases` table,
  `ingredient_interactions.explanation`/`usage_guidance`/
  `verification_status`/`verified_by`/`last_verified_at`, a `'compatible'`
  interaction-type enum value for myth-debunking, and three RPCs —
  `get_ingredient_interaction`, `search_ingredients`,
  `get_routine_conflicts`) and `20260913081000_ingredients_intelligence_
  curated_seed.sql` (category backfill, real aliases, real
  ingredient_concerns mappings, ~18 real sourced ingredient_interactions
  citing DermNet NZ / JAAD Pinnell et al. 2004 / dermnetnz.org). Ships
  deliberately on the existing 128-ingredient catalogue — no Firecrawl
  ingestion pipeline yet; growing past 128 is a scoped future fast-follow,
  not a gap to "fix" reflexively. New interaction rows go through the same
  admin Data Quality verification queue as everything else (extended in
  `AdminDashboard.tsx`).
  - **Active Ingredient Conflict Matcher** — Glow Insider & VIP exclusive
    (`"routine.conflict_matcher"` in `LADDER_CAPABILITIES.insider`/`.vip`,
    `src/lib/entitlements.ts` — both the `FeatureKey` union entry AND the
    ladder-array membership are required for the gate to actually pass;
    it's easy to add only the former and ship a feature nobody can reach).
    `src/lib/conflictMatcher.ts` resolves a member's **SKYNN AI generated
    routine only** (`GroundedRoutine.am`/`.pm` from
    `src/lib/skynnProductMatch.ts` — real `ProductReview` picks, `.id` ==
    `products.slug`) through `product_ingredients` (current
    `product_versions` only) to real `ingredients`, then calls
    `get_routine_conflicts` for every pairwise flag/synergy — never an LLM
    guess, and a pair with no seeded row simply produces nothing rather
    than being inferred. Deliberately does **not** scan the free-text
    manual dashboard Routine tracker (`use-routine.ts`), which has no
    product linkage to resolve ingredients from. `deriveSeasonalGuidance()`
    is pure, category-keyed, general non-fabricated seasonal/SPF guidance —
    same precedent as `deriveMstSignal()` in `formulaResults.ts`. Rendered
    via `ConflictMatcherPanel.tsx` inside `SavedAnalysisCard.tsx`, gated by
    `FeatureGate`. Unit tests: `src/lib/__tests__/conflictMatcher.test.ts`.
- **Product review pipeline** (`api/product-review-sync.ts`) — four clean
  roles: **Firecrawl = researcher** (finds/fetches real source pages),
  **Gemini = analyst + writer** (turns a source into a scored, grounded
  verdict, never inventing facts beyond it), **Supabase = memory +
  orchestration + publication** (dedup, research cache, quota bookkeeping,
  storage), **SkinLabs frontend = editorial presentation** (ReviewsGrid/
  ProductReview/SiteSearch just render whatever lands in
  `ai_generated_product_reviews`, with zero pipeline-specific UI code).
  Generates up to `DAILY_REVIEW_CAP` (3/day) grounded SA-context product
  reviews (70% South African brands, 30% global-available-in-SA, disclosed
  sponsored placements like Timeless Skincare), replacing the old
  newsroom-sync (Daily Skinny) auto-generation cron (that edge function and
  `/briefings` both still exist and can still be triggered manually — only
  its automatic daily pg_cron schedule was removed, see `supabase/
  migrations/20260913020100_unschedule_newsroom_sync_cron.sql`). Runs as a
  **Vercel Cron** (`vercel.json`'s `crons`, 07:00 UTC = 09:00 SAST daily),
  not a Supabase edge function, specifically because it needs
  `GEMINI_API_KEY` from Vercel's own project environment variables — a
  deliberate product decision, not an accident of convenience. Sources
  candidates from already-verified OpenHaus `marketplace_products` rows
  (no Firecrawl needed) plus Firecrawl-researched pages from Faithful to
  Nature's facial-skincare category and named SA/global brand sites (Geve,
  Orobaa, Kloom, Timeless), capped at `MAX_FIRECRAWL_SOURCES_PER_RUN` (5)
  real Firecrawl network calls per run. Writes to
  `public.ai_generated_product_reviews` (public SELECT, service_role write
  only), which `ReviewsGrid.tsx`, `ProductReview.tsx` and `SiteSearch.tsx`
  all merge in alongside the static `src/data/reviews.ts` catalogue via
  `src/hooks/use-generated-reviews.ts` — so a new day's reviews appear on
  `/reviews` with no code deploy.
  - **Research cache** (`public.pipeline_source_cache`, service-role only,
    migration `20260913040000_pipeline_cache_and_quota.sql`) — every real
    Firecrawl result is cached by source (a stable URL for the FTN scrape,
    a `search:<host>` key for the query-based brand-site searches) for
    `SOURCE_CACHE_TTL_MS` (3 days) before being fetched fresh again. A
    cache hit costs nothing against the per-run Firecrawl cap or the daily
    quota below — this is what actually keeps repeat daily runs against
    the same handful of listing pages cheap.
  - **Quota monitor** (`public.pipeline_api_usage`, same migration) — every
    real Firecrawl/Gemini call is logged here, and checked against
    `FIRECRAWL_DAILY_LIMIT` (20), `GEMINI_DAILY_LIMIT` (100) and
    `GEMINI_PER_MINUTE_LIMIT` (10) *before* the next call, so a free-tier
    ceiling is respected proactively rather than discovered as a run
    failure. All three are env-var overridable and are conservative
    placeholders, **not a confirmed reading of either provider's actual
    plan for this account** — nothing in this environment can check that
    live, so tune them against the real Firecrawl/Google AI Studio quota
    pages if they turn out to be wrong in either direction.
  - **Requires `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as Vercel project
    environment variables** — none of these can be set from this codebase
    or from any tool available to Claude Code in this environment, so the
    function 401s/500s with a clear "not configured" message until a human
    adds them in the Vercel dashboard (same category of manual step as the
    already-documented `MARKETPLACE_CRON_SECRET` gap on the Supabase side
    below). `GEMINI_MODEL` defaults to `gemini-3.6-flash` — `gemini-2.0-
    flash` was retired by Google, confirmed live via a 404 naming
    `gemini-3.6-flash` as the replacement during this pipeline's first
    real end-to-end test (2026-09-13).
  - The first 10 reviews (ids prefixed `aigen-`, `generated_by =
    'claude-manual-seed'`) were hand-seeded by Claude during pipeline setup
    (2026-09-13) to test the merge end-to-end — real, Firecrawl/WebFetch-
    sourced products, not run through the live Gemini pipeline, and
    distinguishable from future real pipeline output by that `generated_by`
    value.
- **Spotlight editions** (`public.spotlight_editions` table,
  `src/hooks/use-spotlight-edition.ts`) — tracks Spotlight's edition label
  and methodology version live (seeded from the prior hardcoded
  `SPOTLIGHT_EDITION_MONTH`/`SPOTLIGHT_METHODOLOGY_VERSION` constants in
  `src/data/spotlight.ts`, which now only serve as an offline fallback).
  The product-review pipeline bumps this every 25 published reviews
  (static + generated combined) — new edition label, incremented minor
  methodology version, and a real archive row (`SpotlightArchive.tsx` now
  lists genuine past editions instead of its old "we don't have an archive
  yet" placeholder). Deliberately mechanical-only: the hand-written brand
  ranking narrative (`brandEditorial` in `spotlight.ts` — positioning
  statements, "SkinLabs take", etc.) is **not** touched by this and stays
  human-curated, so a Gemini-generated review can never grow into an
  unreviewed editorial opinion about a brand. A brand introduced only via
  generated reviews simply surfaces under the existing "new-on-the-radar"
  tier (real computed scores, no narrative) until an editor gives it a
  proper `brandEditorial` entry.
- **OpenHaus marketplace** (`/marketplace/*`, `src/pages/marketplace/`) —
  SkinLabs' in-app skincare marketplace, deliberately its own schema
  (`marketplace_brands`/`marketplace_products`/`marketplace_product_images`/
  `marketplace_product_ratings` [external]/`marketplace_product_user_ratings`
  [internal]/`marketplace_cart_items`/`marketplace_fx_rates`/
  `marketplace_skinlabs_picks`/`marketplace_price_sync_log`, migration
  `20260912000000_openhaus_marketplace_core.sql`) rather than folded into
  the editorial skincare-intelligence tables above, cross-linked only in
  two narrow places: `src/lib/marketplaceCrossLink.ts` (SKYNN AI grounded
  recommendations → "Shop on OpenHaus") and a "Sponsored"-badged link on
  `ProductReview.tsx`. Live-seeded with 84 real products (Lelive 21/Esse
  17/SKOON 26/Standard Beauty 20) transcribed from a Faithful to Nature
  wholesale catalog into `src/data/marketplace/ftn-catalog.ts`, with
  rewritten (non-copy-pasted) descriptions/tags in `src/data/marketplace/
  tags/*.ts` and Firecrawl-sourced, URL-verified image sets in
  `src/data/marketplace/tags/images-*.ts` — `scripts/seed-openhaus-
  marketplace.ts` joins these into `supabase/migrations/
  20260912010000_openhaus_marketplace_seed.sql` (idempotent upserts,
  applied and verified live: 84 products / 220 images / 4 brands via
  direct REST check). Pricing is `computeMarkedUpPrice()` (`src/lib/
  marketplace/pricing.ts`, also duplicated into the edge function below
  with a "keep in sync" comment since edge functions can't cleanly share
  a module with the Vite app): source ZAR price × 1.04, charm-rounded up
  to end in `.99`. Product images reference the verified FTN CDN URLs
  directly rather than being re-hosted into the (provisioned but not yet
  used) `openhaus-product-images` storage bucket — a deliberate
  simplification since this environment has no service-role key to
  upload with; fast-follow if re-hosting is ever needed. Ratings are
  dual and never blended: `marketplace_product_ratings` is
  externally-sourced (currently empty — the FTN wholesale catalog PDF
  had no ratings data, confirmed by re-rendering its pages, so nothing
  was fabricated there) shown with a source-crediting tooltip, separate
  from `marketplace_product_user_ratings` (SkinLabs' own signed-in-user
  1-5 star ratings, aggregated by the `marketplace_product_internal_
  rating_summary` view). Cart is `CartContext.tsx` (localStorage for
  guests, synced to `marketplace_cart_items` on sign-in) and currency
  display is `CurrencyContext.tsx` reading `marketplace_fx_rates`; both
  are display/local-storage layers only — ZAR stays canonical. Three
  edge functions keep the catalogue live: `openhaus-fx-sync` (Frankfurter.
  app rates, every 6h), `openhaus-picks-rotation` (weekly "SkinLabs
  Picks" diversity-favouring rotation, Mondays 00:00 SAST), and
  `openhaus-price-sync` (re-parses each product's FTN page JSON-LD for
  price drift, daily) — all three deployed and pg_cron-scheduled, but
  **the `MARKETPLACE_CRON_SECRET` project secret these cron jobs
  authenticate with has not been set** (no tool in this environment can
  set a Supabase project secret) — until a human runs `supabase secrets
  set MARKETPLACE_CRON_SECRET=<value>` (the value used in the cron job
  definitions) matching what's embedded in the `openhaus_fx_sync_cron`/
  `openhaus_picks_rotation_cron`/`openhaus_price_sync_cron` pg_cron jobs,
  scheduled runs will 401; an admin JWT still works as a manual-trigger
  fallback. `openhaus-price-sync` is also untested against a real FTN
  product page in production — FTN sits behind a Cloudflare bot
  challenge that blocks this sandbox's outbound fetches (confirmed
  browser-UA curl requests succeed, bare/HEAD requests don't), so whether
  Supabase's edge runtime gets a cleaner path is unverified.
- **The Skin Deep podcast** — episode content is a hardcoded array in
  `src/data/podcast.ts` (no DB-backed episode table); cover art lives in
  `public/podcast/`. `/podcast` (hub, `PodcastPage.tsx`) and
  `/podcast/:slug` (`EpisodePage.tsx`) both read from it, plus the
  homepage teaser (`PodcastSection.tsx`). New episodes publish **every
  Friday at 12:00 SAST** (`getNextEpisodeDate()`) — this replaced an
  earlier "last Friday of the month" cadence on 2026-09-13. Engagement
  (play/like/share counts, `usePodcastEngagement` +
  `PodcastEngagementBar.tsx`) follows the same seed-plus-localStorage
  pattern used elsewhere (briefings' `view_count`): each episode carries
  a deterministic `seedPlays`/`seedLikes`/`seedShares` baseline, with
  real increments in localStorage and best-effort Supabase writes to
  `podcast_plays`/`podcast_likes`/`podcast_shares` for cross-device sync
  — none of these are a literal live global counter. `podcast_plays`
  (migration `20260820000000_create_podcast_plays_table.sql`) shipped
  with RLS enabled but **no INSERT policy at all** (it ends mid-comment),
  so every play write 42501'd silently until
  `20260913070000_fix_podcast_plays_insert_policy.sql` fixed it;
  `podcast_likes` was referenced in `use-podcast-engagement.ts` from the
  start but never had a migration until
  `20260913071000_podcast_likes_and_shares.sql` (which also added
  `podcast_shares`). If engagement writes start failing again, check for
  exactly this pattern (RLS on, policy missing) before assuming a GRANT
  problem — this project's `public` schema has `ALTER DEFAULT
  PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated` already set,
  so RLS policies (not GRANTs) are almost always the real gate here.
  **Episodes 1-4's real audio does not match what was originally written
  for them** — confirmed 2026-09-13 by actually transcribing the four
  `public/epNskinlabs.mp3` files (Adobe's `media_summarize` MCP tool has
  no working poll/status path in this headless CLI environment — every
  call starts a fresh job rather than checking an existing one — so the
  practical route was local: `apt-get install ffmpeg`, `ffmpeg` to 16kHz
  mono WAV, then Python `vosk` with the `vosk-model-en-us-0.22-lgraph`
  model). All four are a generic, non-SA-specific two-host "AI deep dive"
  style recording (think NotebookLM), not scripted SkinLabs-specific
  audio — e.g. episode 1 ("Weird Skincare") is actually about the beef
  tallow trend, not snail mucin/edible serums, and real runtimes are far
  shorter than originally listed (~5-8 min actual vs. 18-22 min claimed).
  `showNotes`/`timestamps`/`transcript`/`duration` for episodes 1-4 were
  rewritten from the real transcripts (timestamps verified against
  word-level ASR timing, not guessed); `productsMentioned` was cleared to
  `[]` for all four since the real audio never names any SkinLabs-
  reviewed product — the previous entries were fabricated. The
  `transcript` field intentionally stays a handful of short paraphrased
  pull-quotes (the pre-existing pattern, gated behind membership via
  `GatedOverlay`), not a raw ASR dump — the vosk output has real
  disfluencies and misheard proper nouns (e.g. dermatologist "Rebecca
  Marcus" transcribed as "Rebecca tablets") that would misinform readers
  if published verbatim. Full raw transcripts/JSON word-timing data from
  this pass were only saved to the session scratchpad, not committed —
  regenerate with the same ffmpeg+vosk pipeline if needed again.
  **Episodes 5-9 published 2026-09-13** (same ffmpeg+vosk transcription
  method), one per week starting 2026-09-18 (`publishedAt`
  2026-09-18/25, 10-02/09/16). Unlike 1-4, their real audio actually
  matches the pre-written titles/topics reasonably well — no rewrite of
  title/topics was needed, only description/showNotes/timestamps/
  transcript/duration from the real transcripts (same reasoning as 1-4:
  no fabricated `productsMentioned`, chapter timestamps from word-level
  ASR timing). One notable trait worth knowing before touching this data
  again: all nine published episodes (1-9) are the same synthetic
  "two-host NotebookLM-style deep dive" format, and episodes 5-9
  specifically frame themselves as reading from and discussing SkinLabs'
  *own* internal materials/ecosystem (editorial independence, the AI
  formulator, Seasons, the Review Engine, the dermatologist directory,
  budget-vs-luxury packaging stability) rather than being independently
  produced audio — i.e. the podcast is largely narrating the rest of the
  site back to itself. That's not necessarily a problem, but don't be
  surprised by it, and don't assume future episode audio will follow the
  same format without checking. Episode 10 is still `comingSoon: true`
  (real cover art and audio file are wired in — `public/ep10skinlabs.mp3`
  — but it has no publishedAt/showNotes/transcript yet, deliberately not
  published without the same transcription/QA pass).
- The engagement seed generator changed 2026-09-13 from a deterministic
  `seed(id, base, spread)` formula to a fixed `engagementSeed` lookup
  table (per explicit request: every published episode starts at a
  minimum of 3286 plays, likes/shares randomised proportionally). If
  asked to reseed again, generate fresh numbers the same way (Python
  `random` with a fixed seed for reproducibility) rather than reusing the
  old formula.
- `latestPublishedEpisode` (`src/data/podcast.ts`) drives the "New"
  badge on the hub grid, homepage teaser cards, and the episode page —
  it's whichever published episode has the most recent `publishedAt`,
  computed automatically, not hardcoded. When a new episode publishes,
  this updates itself; no manual badge toggling needed.
- **Podcast RSS feed** — `scripts/generate-podcast-rss.ts` (bun, build-time,
  wired into `npm run build` right after the sitemap step) generates
  `public/podcast.xml` from `publishedPodcastEpisodes`, served at
  `https://skinlabs.co.za/podcast.xml`. Standard RSS 2.0 + iTunes
  namespace (title/summary/duration/episode/season/explicit per item,
  channel-level owner/category/image) — this is what Apple Podcasts
  Connect and Spotify for Podcasters both want as the feed URL when
  submitting the show. `itunes:duration` reads from each episode's
  `durationSeconds` (ffprobe-verified, not derived at build time — see
  the QA note above) and `enclosure length` reads the real file size off
  disk via `fs.statSync`, so both stay accurate without needing ffmpeg on
  the build server. **Known gap: there is no show-level (or per-episode)
  artwork in this repo that meets Apple/Spotify's 1400x1400+ square
  minimum** — the feed currently points `itunes:image` at
  `public/podcast/ep-coming-soon.jpg` (1024x1024) as a placeholder, and
  episode-level images are 1080x1350 portrait, not square at all. The
  feed will generate and validate fine, but submitting it as-is to Apple
  Podcasts Connect or Spotify for Podcasters will likely get flagged or
  rejected on artwork grounds — a human needs to supply real ≥1400x1400
  (ideally 3000x3000) square show art before that submission step.
  Generating this feed is also **not** the same as being live on Apple/
  Spotify: actually submitting the feed URL through each platform's own
  podcaster console (Apple Podcasts Connect, Spotify for Podcasters) is a
  manual step by a human with ownership of those accounts — nothing in
  this environment can do that submission itself. The hub page links to
  `/podcast.xml` directly ("Subscribe via RSS") and via
  `<link rel="alternate" type="application/rss+xml">` for feed-reader
  autodiscovery in the meantime.

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
