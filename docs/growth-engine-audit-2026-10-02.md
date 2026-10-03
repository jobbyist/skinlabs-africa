# Growth Engine — repository audit (2026-10-02)

Baseline on `main` @ a2f499a: `bun test` 519 pass / 6 skip / 0 fail; `tsc -p tsconfig.app.json` exit 0.
Not yet run in this audit: `npm run lint`, `npx vite build`, Playwright e2e.

**The "SkinLabs Organic Growth & AdSense Revenue Strategy" document is not in the repo or the
session.** Nothing below is derived from it. Targets quoted come from the directive only.

## 1. Architecture

- Vite + React SPA (react-router, `lazyWithRetry` routes) is the primary app.
- `scripts/prerender.ts` (puppeteer, ~115 routes, 8-minute watchdog) snapshots static/content
  routes into HTML. Failure degrades to plain SPA.
- TanStack Start + Nitro (Vercel preset) SSR covers only: `/briefings/$slug`, `/reviews/$slug`,
  `/ingredients/$slug`, `/spotlight/$slug`, `/web-stories/$slug`, `/sitemap.xml`.
  `scripts/assemble-vercel-output.ts` merges both. `/briefings/$slug` SSR is unstyled but does
  fetch and render the article body (via `get_article_body`) and the editorial disclaimer for free
  briefings; premium briefings are withheld from anonymous requests by the RPC (verified in
  `src/routes/briefings.$slug.tsx`).
- Knowledge Hub (`/knowledge-hub[/:slug]`), podcast episodes, compare/versus, seasonals,
  ingredient directory, spotlight index are SPA + prerender only (client-rendered if prerender fails).
- Supabase `gnkpzijxuciiaamakgzm`; content in `news_articles`, `ai_generated_product_reviews`,
  `ai_generated_comparisons`, `ingredients`, plus static `src/data/*` (reviews, faq, podcast, comparisons).

## 2. Already in place (do not rebuild)

- SEO: `SEO.tsx` (canonical, OG, robots, `lang`), `src/lib/seo/*` (JSON-LD, breadcrumbs, canonical),
  one-Product-node review structured data with a unit test, live SSR sitemap + build-time fallback
  sharing `staticRoutes.ts`, robots.txt with AI crawlers named, `llms.txt`, `ads.txt`, podcast RSS.
- Ads: `AdFrame` + `useAdSenseUnit`, placement rules, ad density raised 2026-09-28, viewer-context
  ad policy (full/light/none), ad-block wall (never for crawlers), AdSense Auto ads recommended off.
- Internal linking: `RelatedKnowledgeHub` (keyword-driven via `content-graph`) on reviews, compare,
  episodes, briefings, spotlight; ingredient resolver linking; `related_reviews` persisted per review.
- Content engine: briefings pipeline (1/day cap, format QA, dedup), reviews pipeline (3/day),
  Shelf Showdown weekly, ingredient growth routines. Human editorial layer = admin verification
  queue; ingredients land `partially_verified` only.
- Email: outbox/Resend pipeline, `profiles.marketing_consent`, weekly digest, one-click unsubscribe.
- Analytics: `trackConversionEvent` (Vercel Analytics) vocabulary in `analytics-events.ts`;
  admin `ConversionFunnelPanel`; Vercel analytics MCP for pageviews.

## 3. Gaps against the directive's targets (evidence-backed)

| # | Gap | Evidence |
|---|-----|----------|
| G1 | **No general newsletter capture.** The only anonymous email form (`Newsletter.tsx`, home only) is a *dermatologist-consultation early-access* waitlist writing to `newsletter_subscribers`. No source/page, consent text, or double opt-in recorded (`email`, `subscribed_at`, `is_active` only). | `src/components/Newsletter.tsx`, migration `20260219052311` |
| G2 | **Weekly digest cannot reach non-account subscribers.** It fans out to `profiles.marketing_consent = true` only; `newsletter_subscribers` is never read by it. So anonymous organic visitors can't be nurtured toward the 100-subscriber milestone. | `20260919100000_marketing_consent_and_cancellation.sql` |
| G3 | **No growth/revenue measurement.** No events for scroll depth, internal-link/related-content clicks, newsletter-form view/submit by placement, or pages/session; nothing computes the RPM / pageview / indexed-URL / evergreen-vs-briefing mix the targets are expressed in. | grep of `src` for those events: none |
| G4 | **Evergreen/briefing mix is unmeasured and likely inverted.** Pipelines publish ~1 briefing + 3 reviews/day; evergreen = 57 FAQ entries + ingredients. 70/30 target needs a content-type dashboard before any generation changes. | pipeline caps in CLAUDE.md |
| G5 | **SA availability/pricing wedge has no data model.** Retail availability/price exists only in OpenHaus (private-beta, `/marketplace` is disallowed in robots) and `retailer_products`/`product_prices` in the intelligence schema, which CLAUDE.md says is unseeded beyond reviews. No public "where to buy in SA" surface. | `supabase/SCHEMA.md`, robots.txt |
| G6 | **Melanin-rich skin wedge is scattered.** Mentions exist in faq/seasonals/briefings/spotlight, but there is no hub, no tagged content set, and MST (self-reported) isn't used for content discovery. | grep: ~10 data files, no route |
| G7 | Knowledge Hub and several SEO-critical pages depend on prerender succeeding (SPA fallback otherwise). | `scripts/prerender.ts` degrade path |
| G8 | *(Corrected after review.)* Earlier draft claimed the briefing SSR route omits the body; it does not. Remaining question to measure, not assume: how many published briefings are `is_premium` and therefore show crawlers only the teaser, since that limits indexable evergreen text. | `src/routes/briefings.$slug.tsx` lines ~83-231 |

## 4. Proposed task order (needs approval, see questions)

1. **Subscriber engine core** (G1, G2): extend the existing `newsletter_subscribers` table
   (additive columns: source, consent text/version, confirmed_at, unsubscribe token) rather than
   adding a parallel table, so the admin list and the FORM_SUBMITTED trigger keep working; capture with source,
   consent text/version, double opt-in via the existing email outbox, extend digest recipients to
   confirmed subscribers, unsubscribe parity, inline + end-of-article form (ad-safe placement),
   events, RLS probe, tests.
2. **Measurement layer** (G3, G4): growth events + an admin "Growth" panel (indexed URLs from
   sitemap, content-type mix, subscribers by source, pageviews via Vercel, RPM *entered manually*
   from AdSense since there is no AdSense API credential here).
3. **Internal linking v2** (evergreen hubs ↔ briefings/reviews/ingredients, click events).
4. **SA availability/pricing wedge** (G5) — blocked on a data-source decision (see below).
5. **Melanin-rich skin hub** (G6) — editorial human layer required.

## 5. Guardrails restated (from CLAUDE.md + directive)

No invented RPM/traffic/prices/ratings; no ad-click prompts or incentives; no fake scarcity;
funding wording from `editorialIndependence.ts`; AI content stays `partially_verified` pending a human.
