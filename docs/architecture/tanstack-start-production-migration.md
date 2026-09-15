# TanStack Start Production Migration — Phase 1: Briefings

**Status: complete. Verdict: GO.** This is Phase 4 of the TanStack Start
work on this repo (Phase 1: isolated feasibility spike; Phase 2: repo-root
coexistence test, CONDITIONAL GO; Phase 3: Briefing SSR proof-of-concept,
GO). This phase is the actual production migration authorization: it
productionizes the build architecture, extracts a shared, reusable SEO/
JSON-LD layer, and migrates one real content type (Briefings) onto it —
not another spike or test.

All work happened on branch `claude/skinlabs-tanstack-start-migration-lko468`
(PR #87). `main`/production was never touched or merged into. This document
is the durable production-architecture reference; it does not repeat or
rewrite the two earlier phase documents, which remain the historical record
of how each finding was originally reached:

- `docs/architecture/tanstack-start-repo-root-coexistence-test.md` (Phase 2)
- `docs/architecture/tanstack-start-briefing-ssr-poc.md` (Phase 3)

## Why TanStack Start

Restated briefly (full reasoning in the Phase 1/2 documents): the existing
production app is a client-only Vite + `react-router-dom` SPA. Crawlability
for ~70 routes + all dynamic content today depends entirely on
`scripts/prerender.ts`, a build-time headless-Chromium crawl — real, but
structurally incapable of same-day freshness (a newly published or edited
Briefing is invisible to crawlers until the *next* full production build,
~13-20 minutes away at best). TanStack Start was selected over alternatives
because it lets specific, genuinely time-sensitive routes render
server-side **on the same Vite/Vercel/Supabase stack already in
production**, without a framework rewrite: no change to `react-router-dom`,
no change to the ~70 unmigrated routes, no change to the existing Supabase
client conventions.

## Nitro: what shipped, and the risk that's still real

`nitro@3.0.260610-beta`, via `@tanstack/react-start@1.168.53` +
`@tanstack/react-router@1.170.36` — unchanged from Phase 1/2/3. The
alternative, stable `@tanstack/nitro-v2-vite-plugin` (wrapping
`nitropack@2.13.4`) was decisively closed as **NO-GO** in Phase 2 with a
reproducible crash (`h3@1.x` vs `h3@2.x` calling-convention collision
against `api/product-review-sync.ts`'s classic `(req,res)` handler
signature). That finding is unchanged and still governs: **do not use the
Nitro v2 override.**

Nitro v3 remains beta, with no GA date and a slowing release cadence (last
checked: this phase). This is now running in the actual production build
path, not an isolated test — the named risk from Phase 1/2 is real and
active, not hypothetical. Accepted for this phase because: (a) the v2
alternative is a confirmed crash, not just "experimental" hedging: (b) this
phase's own testing surfaced and fixed two genuine, reproducible Nitro/
Vercel integration bugs (below) rather than encountering vague flakiness;
(c) the blast radius is bounded by the routing architecture (next section)
— a Nitro regression can only break SSR-migrated routes, never the ~70
unmigrated SPA routes, which are served straight from `dist/` regardless of
whether the SSR function works at all.

### `renderer: false` — still load-bearing

`nitro.config.ts` disables Nitro's own index.html auto-detection/serving.
Without it, Nitro silently shadows every route with the real app's root
`index.html`, discovered and confirmed in Phase 2. Unchanged, still
required.

### Supabase env-var fallback — still load-bearing

`src/lib/content/supabaseServerClient.ts` (extracted this phase from the
Phase 3 POC's inline fallback) reuses the exact pattern
`src/integrations/supabase/client.ts` already has: hardcoded, public-by-
design, RLS-enforced production `VITE_SUPABASE_URL`/
`VITE_SUPABASE_PUBLISHABLE_KEY` fallback values, because Vercel serverless
function environments don't reliably expose these at runtime (confirmed in
Phase 3, reconfirmed by this phase's own local testing — see Build
Architecture below).

## Build architecture — the part this phase actually had to solve

Phase 2/3 proved TanStack Start *builds* and *deploys* from the repo root.
Neither phase checked whether the **rest of the site** still worked in
those same test deployments — both only verified the one new SSR route
plus `api/product-review-sync`. This phase closed that gap, and it was a
real, non-trivial risk, not a formality:

**The problem, found by direct inspection of Nitro's `vercel` preset
source** (`node_modules/nitro/dist/_presets.mjs`): Nitro's preset is a
*wholesale* Vercel Build Output API v3 writer. `output.publicDir` is
`{{ output.dir }}/static/{{ baseURL }}` — its own directory, populated from
its own client build (a raw, uncompressed copy of `public/`, plus its
own route-specific JS chunks). It has **no awareness of `dist/`** — the
real SPA's actual build output, produced separately by the unchanged `vite
build` + `scripts/prerender.ts` pipeline. Confirmed empirically (local
build, `NITRO_PRESET=vercel` forced to match real Vercel infra exactly):
Nitro's own `.vercel/output/static/` contained no `index.html`, no real SPA
bundle, and its generated `config.json` routed *every* unmatched path to
the SSR function — which only knows the migrated routes. **Deployed as-is,
this would have broken the entire site except the routes actually migrated
to TanStack Start.** This is exactly the kind of finding "a successful
Nitro build" cannot surface — only assembling the real output and
inspecting it does.

### The fix: `scripts/assemble-vercel-output.ts`

A merge step, run as the final stage of `npm run build` (no `vercel.json`
buildCommand hack — the production build is plain `npm run build`, matching
the explicit requirement):

1. `vite build` + `scripts/prerender.ts` run **unchanged**, producing the
   real, complete, optimized SPA build in `dist/` — every one of the ~70
   `react-router-dom` routes, every prerendered per-route `index.html`,
   every compressed asset.
2. `npm run build:tanstack-start` (`NITRO_PRESET=vercel vite build
   --config vite.tanstack-start.config.ts`) produces Nitro's own
   `.vercel/output/functions/__server.func/` (the real SSR function) and
   its own `static/` fragment (discarded except for its genuinely new,
   route-specific asset chunks — see next point).
3. `assemble-vercel-output.ts`: diffs Nitro's `static/assets/` against
   `dist/assets/` by filename to isolate the SSR route's own client-
   hydration chunks (content-hashed, so no collision risk with the SPA's
   own hashed bundle — confirmed empirically, e.g. `index-C2sTQT3T.js`
   (real SPA) vs. `index-BX-8kGeP.js` (Nitro's own) coexisting cleanly),
   discards the rest of Nitro's `static/` (a redundant, uncompressed copy
   of `public/` — `dist/`'s own copy is already the optimized, authoritative
   one), replaces `.vercel/output/static/` wholesale with `dist/`, then
   grafts the isolated SSR chunks back in.
4. Regenerates `.vercel/output/config.json` from `vercel.json`'s own
   `headers`/`redirects` (kept as the single, human-edited source of
   truth — the script transforms them into Build Output API's low-level
   route format, it doesn't duplicate or fork them) plus explicit routing
   for SSR-migrated paths (see Routing Architecture below).
5. Degrades gracefully to a **static-only** deployment (todays's exact
   production shape) if the Nitro build fails or produces no server
   function — matching the existing fail-soft philosophy of every other
   `npm run build` step (sitemap, podcast-rss, image compression,
   prerender). A partial/inconsistent Nitro output (a server function with
   zero client chunks, the exact failure mode hit once during this phase —
   see below) is treated as a hard failure of the *assemble* step
   specifically, not silently shipped.

### Two real bugs this surfaced, found on real Vercel infrastructure

Both are exactly why this phase insisted on a real deployment rather than
trusting local build success, mirroring Phase 2/3's own discipline:

1. **Missing `@` path alias in `vite.tanstack-start.config.ts`.** The
   Briefing route's refactor onto the shared SEO layer (`@/lib/seo/*`,
   `@/lib/content/*`) introduced the repo's first `@/`-aliased imports
   inside SSR-migrated code. `vite.tanstack-start.config.ts` never
   configured the same `resolve.alias` the real `vite.config.ts` has. The
   **server**-environment build resolved the imports fine; the **client**-
   hydration environment build failed outright (`Rollup failed to resolve
   import "@/lib/seo/head"`) — confirmed both locally and on real Vercel
   infra (`dpl_8MsJmckgjpjDNFCqG45uLF9f5GD5`, state `ERROR`). Fixed by
   adding the identical alias to `vite.tanstack-start.config.ts`.
   `assemble-vercel-output.ts`'s own defensive check (a server function
   with zero client chunks is treated as a hard failure, not shipped)
   caught this correctly before the fix landed — it did exactly what it
   was built for.
2. **Crons cannot be duplicated into `config.json`.** Reasonable-seeming
   caution — copying `vercel.json`'s `crons` array into the generated
   `config.json` too, in case a custom Build Output API output bypasses
   `vercel.json`'s own cron reading — turned out to be actively wrong.
   Real deployment (`dpl_5Y8mZExC9nN2FYUiH642LUAb1pAz`) failed outright:
   `errorCode: "duplicated_cron_job"`, `"A duplicated cron job with the
   same schedule (0 7 * * *) and path (/api/product-review-sync) was
   found."` This is not documented clearly anywhere and could only be
   learned by deploying: **Vercel's platform reads crons from the
   project's git-connected `vercel.json` regardless of whether a custom
   buildCommand supplies `.vercel/output`.** `assemble-vercel-output.ts`
   no longer touches crons at all; `vercel.json` is their sole source of
   truth, full stop.

Both fixes are committed (`fff9fbd`, `d9fd935`) and confirmed on a
subsequent green deployment (`dpl_9GJ9tighGh2MbPeKmuir3u3Re3NX`, `READY`,
`lambdaRuntimeStats: {"nodejs":2}` — both the SSR function and
`api/product-review-sync` present).

## Routing architecture

One deliberate, explicit boundary, encoded in `assemble-vercel-output.ts`'s
`SSR_ROUTE_PATTERNS` constant — currently exactly one entry:

```
^/briefings/([^/]+)$
```

Ordering in the generated `config.json` matters and is not arbitrary:

1. Redirects (from `vercel.json`)
2. Response headers (from `vercel.json`, `continue: true` — annotate, don't
   terminate)
3. **SSR-migrated routes → the Nitro function**, deliberately positioned
   *before* the filesystem phase
4. `{"handle": "filesystem"}` — serve any real static/prerendered file
5. SPA fallback (`/(.*)  → /index.html`)

Step 3 precedes step 4 for a specific, load-bearing reason:
`scripts/prerender.ts` *was* still crawling `/briefings/:slug` (63+ real
articles) as of the start of this phase — meaning a static, potentially
stale `dist/briefings/<slug>/index.html` genuinely exists for every
Briefing. Had the SSR rule been ordered *after* the filesystem phase
(Nitro's own default-generated ordering, reasonable for its generic case
but wrong here), the stale prerendered file would have silently won on
every request, making the SSR migration a complete no-op in production
traffic despite building and deploying "successfully." This was caught by
reading `scripts/prerender.ts`'s actual crawl list, not assumed.

Verified, not just designed: a live request to `/briefings` (the list
page, *not* matched by the regex — no trailing slug) served the real
prerendered static file; a live request to `/briefings/<real-slug>` served
the live SSR response; a live request to `/newsroom/<slug>` correctly
308-redirected to `/briefings/<slug>` first, per `vercel.json`'s own
redirect ordering.

**No other route is SSR-migrated in this phase.** Every other public route,
every authenticated/application route (Auth, Dashboard, Glow Explorer/
Lite/Insider/VIP, SKYNN AI, AI Skin Analysis, Smart Routines, Analysis
Pass, Payments, Membership, Account/profile) is untouched, unmigrated, and
served exactly as before — plain `react-router-dom` client-side routing
from the real SPA build.

## Shared SEO / structured-data architecture

`src/lib/seo/` — content-type-agnostic, built for Briefings but assuming
nothing about Briefings specifically:

- `types.ts` — `PageMeta`, `ArticleJsonLdInput`, `BreadcrumbItem`, `HeadTags`.
- `canonical.ts` — `canonicalUrl()`/`absoluteUrl()`, same normalization
  `SEO.tsx` already does client-side (strip query strings, root at
  `SITE_URL`, collapse trailing slashes).
- `jsonLd.ts` — `articleJsonLd()`/`breadcrumbJsonLd()`. Grounded only in
  fields the caller actually has; author/publisher are always the real
  SkinLabs® organization (no per-article human byline exists in this data
  model today — revisit if that changes, don't fabricate one meanwhile).
- `breadcrumbs.ts` — `siteBreadcrumbTrail()`, roots every trail at the real
  SkinLabs home page.
- `head.ts` — `buildHeadTags()`, the single function every SSR route calls.
  Composes `PageMeta` + pre-built JSON-LD objects into the **exact** shape
  TanStack Router's `head()` API consumes — confirmed by reading
  `node_modules/@tanstack/react-router/dist/esm/headContentUtils.js`
  (Phase 3 finding, reused here, not rediscovered): `scripts` entries are
  **flat** `{type, children}`, not the nested `{attrs, children}` the
  TypeScript types suggest.

`src/lib/content/supabaseServerClient.ts` — deliberately the *only* thing
extracted into `src/lib/content/`. A generic content-loader abstraction
(loaders/types/schemas per content type) was considered and rejected for
this phase: Briefings is still the only migrated content type, and
building a generic shape now would mean guessing at Reviews/Knowledge Hub/
Ingredients/Podcast/Seasonals' actual Supabase schemas before any of them
exist in this architecture — the project's own standing instruction against
designing for hypothetical future requirements. The Supabase client factory
is the one piece that's already proven, content-type-agnostic, and load-
bearing (every future SSR route needs the exact same env-var fallback).

`src/routes/briefings.$slug.tsx` now composes these builders instead of
hand-rolling its own meta/JSON-LD objects — a structural refactor, not a
behavior change. Confirmed byte-for-byte equivalent output to the proven
Phase 3 POC via live HTTP comparison (see Validation below): same title/
description/canonical/OG fields, same Article + BreadcrumbList JSON-LD
shape, same `dateModified`-from-`updated_at` fix (still correctly diverges
from the `news_articles` table's own `json_ld` column, which hardcodes
`dateModified === datePublished` — a real, pre-existing data-model finding
from Phase 3, unchanged).

## Vercel architecture

- `vercel.json` is **unchanged** by this phase, and remains the sole,
  human-edited source of truth for `headers`, `redirects`, and `crons` —
  `assemble-vercel-output.ts` reads and transforms it, never forks it.
  `buildCommand` stays plain `npm run build`.
- Vercel's platform independently, zero-config-detects and compiles the
  `api/` folder (`api/product-review-sync.ts`) as its own build phase,
  running *after* the custom buildCommand's output is written — confirmed
  again this phase (build log: `"Installing dependencies... Using
  TypeScript 5.9.3 (local user-provided)..."` runs after Nitro/assemble
  finish), consistent with the Phase 2 finding. This is why the assembled
  `.vercel/output` never needs to include a function for it.
- Crons are sourced from `vercel.json` alone (see the bug above) —
  `assemble-vercel-output.ts` never writes a `crons` field.

## Remaining `scripts/prerender.ts` dependency

Still load-bearing for every content type that is *not* SSR-migrated:
static marketing/info pages (`STATIC_ROUTES` — `/about`, `/pricing`,
`/contact`, etc.), Reviews (`src/data/reviews.ts` slugs), Shelf Showdown
comparisons, Spotlight brand profiles, Podcast episodes, Knowledge Hub
FAQs, and Ingredients detail pages (still queried live from Supabase in
`collectRoutes()`). None of these are touched by this phase.

`/briefings/:slug` was removed from the crawl list in this phase's final
commit (`c9300da`) — and only then, after live-validating equivalent SSR
coverage on real Vercel infrastructure (see Validation), per the explicit
standing instruction not to reduce `prerender.ts`'s responsibilities
preemptively. The `/briefings` list page itself is untouched, still
crawled via `STATIC_ROUTES`.

## Migration sequence followed this phase

1. Productionize the TanStack Start foundation (build-output merge
   architecture, `renderer: false`, Supabase fallback carried forward,
   exact dependency versions unchanged from Phase 1-3).
2. Extract the shared SEO/JSON-LD layer (`src/lib/seo/*`,
   `src/lib/content/supabaseServerClient.ts`).
3. Refactor the existing, proven Briefing route onto that shared layer —
   without rewriting its already-validated behavior.
4. Validate: local build, lint, tests, real Vercel deployment, live HTTP
   checks (whole-site + Briefing-specific), freshness, schema structure.
5. Reduce `prerender.ts`'s scope for the one route SSR now covers, only
   after step 4 proved it.
6. This document + the final report.

## Validation methodology and results

**Local (structural):**
- `npm run build` (the real, full production script, unmodified except for
  its two new final steps) run end-to-end locally: sitemap, podcast RSS,
  search-index check, image compression, `vite build`, `scripts/
  prerender.ts` (326 routes, 0 skipped), `build:tanstack-start`, `assemble-
  vercel-output`. Inspected the assembled `.vercel/output/static/`
  directly: 502 files, real SPA `index.html` + real hashed bundle present,
  `/briefings/index.html` (list page) present as a real static file, SSR
  route's own client chunks present and non-colliding.
- `npx eslint` on every new/changed file: zero issues. Full `npm run lint`
  (`eslint . && search-index:check`): the eslint pass surfaces 4 pre-
  existing errors / 19 warnings, all in files this phase never touched
  (`PodcastPlayer.tsx`, `use-podcast-engagement.ts`,
  `previewAuthStorage.ts`, `AdminDashboard.tsx`, etc.) — confirmed
  pre-existing, not introduced here.
- `npx tsc --build tsconfig.app.json --noEmit`: zero errors attributable to
  any new/changed file (confirmed by filtering the output); remaining
  errors are pre-existing, in unrelated files.
- `bun test`: 80 pass, 0 fail (unchanged test suite).

**Live (real Vercel deployment, `dpl_9GJ9tighGh2MbPeKmuir3u3Re3NX`,
`READY`)**, via the same temporarily-disable-SSO / test-in-one-tight-window
/ immediately-re-enable methodology as Phase 3, per prior explicit
approval, verified via `get_project_deployment_protection` immediately
before and after each window:

| Check | Result |
|---|---|
| `GET /` | `200`, real SPA shell (`<div id="root">`), real hashed bundle referenced |
| `GET /reviews`, `/pricing` | `200`, real SPA content |
| `GET /briefings` (list, unmigrated) | `200`, served from the real prerendered static file, *not* the SSR function |
| `GET /briefings/pollen-season-skin-south-africa` | `200`, live SSR — same title/canonical/OG/JSON-LD as Phase 3's proven POC |
| `GET /briefings/this-slug-does-not-exist-xyz` | `404`, correct `notFound()` page |
| `GET /newsroom` | `308 → /briefings` |
| Response headers on `/` | `Cache-Control: no-cache, must-revalidate`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` — all present |
| Response headers on a real asset | `Cache-Control: public, max-age=31536000, immutable` |
| `GET /api/product-review-sync` | `401` (unauthenticated) — confirms the function is deployed and its own `CRON_SECRET` gate is intact, not that it's broken |
| Freshness: `/briefings/retinal-vs-retinol-hot-bathrooms-sa` (real row, `updated_at` genuinely 6 days after `created_at`) | `dateModified: 2026-09-12` (from `updated_at`), `datePublished: 2026-09-06` — identical to Phase 3's finding, now proven on the production-shaped deployment, no rebuild involved |
| JSON-LD structural validity | Both Article and BreadcrumbList blocks re-parsed via `json.loads` on the live response: valid JSON, correct `@context`/`@type`, all required Article fields present and non-empty |
| Unpublished-content protection | Verified at the code/RLS level (no real unpublished Briefing exists in production to test against, and creating one would be an unauthorized data mutation — same reasoning as Phase 3): the route's Supabase query carries an explicit `.eq('status', 'published')` filter, identical to the `news_articles_public` view's own `WHERE` clause and covered by the same RLS policy (`"Published articles are public"`, `qual: status = 'published'`) either way |

**Not proven, explicitly, carried forward from Phase 3 unchanged:** true
third-party submission to Google's Rich Results Test / the Schema.org
Validator's own hosted UI against the live URL. Structural JSON-LD validity
(valid JSON, correct vocabulary, required fields all present) is confirmed;
a live third-party tool run against the URL is a low-effort, non-blocking
follow-up, identical in status to Phase 3, which received a GO verdict with
this same gap open.

## Known limitations / remaining risks

1. Nitro v3 remains beta — unchanged risk from Phase 1/2, now live in the
   production build path. Bounded blast radius (only SSR-migrated routes
   can break; the SPA build is independent and unaffected by a Nitro
   regression).
2. Third-party Rich Results Test / Schema.org Validator UI submission — not
   proven, low-effort follow-up (see above).
3. This phase covers exactly one content type (Briefings) and one route
   shape. Reviews, Knowledge Hub, Ingredients, Podcast, Seasonals,
   dashboards, and every authenticated/application route remain unmigrated
   and untested — explicitly out of scope, per the phase authorization.
4. The two bugs this phase found and fixed (`@` alias, cron duplication)
   were both genuinely undiscoverable without a real deployment — local
   build success alone did not surface either. Future content-type
   migrations should budget for at least one real-deployment validation
   cycle each, not assume local build success is sufficient.
5. `scripts/prerender.ts` still prerenders 6 other content types
   (Reviews, comparisons, Spotlight, Podcast, Knowledge Hub, Ingredients);
   none of that crawl was touched, reduced, or otherwise affected by this
   phase beyond the one Briefings-specific removal.

**Superseded by Phase 5 below:** limitation 3's "Reviews... remain
unmigrated" and limitation 5's inclusion of Reviews in the still-crawled
list are no longer current — see Phase 5.

---

# Phase 5: Reviews — dual data source, and the SPA-fallback bug

**Status: complete. Verdict: GO.** Second content type migrated onto the
Phase 4 architecture, per the explicit instruction to "proceed to Reviews
as the next content type, carrying forward this build architecture, the
shared SEO layer, and the discipline of validating each migration on real
infrastructure, not just local build success." All work stayed on the same
branch/PR (`claude/skinlabs-tanstack-start-migration-lko468`, PR #87);
`main`/production was never touched.

This phase reused Phase 4's architecture directly — no redesign — but
surfaced a genuinely severe, previously-latent bug affecting the *entire
site*, not just Reviews. That bug, its three failed fix attempts, and its
eventual resolution are the most important thing in this section.

## `/reviews/:slug` SSR route

`src/routes/reviews.$slug.tsx`. Unlike Briefings, a review is sourced from
**either** of two places: the static, hand-curated `productReviews`
catalogue (`src/data/reviews.ts`) or the `ai_generated_product_reviews`
table (the Firecrawl+Gemini pipeline documented in `CLAUDE.md`). Per
`CLAUDE.md`, generated reviews were sitemapped but never prerendered — a
real, previously-documented crawlability gap. This migration closes it
outright: the server loader (`fetchReview`, a `createServerFn`) checks the
static array first, then falls back to a single-row Supabase query by
`id`, so both sources now get identical SSR coverage. Image resolution
mirrors `src/hooks/use-review-images.ts`'s exact three-tier priority (brand
banner → `review_images` row → category pool) server-side; related reviews
are resolved from both sources too (a static filter plus a scoped,
non-full-table generated-reviews query).

**`MemoryRouter` wrapper.** `ProductReview.tsx`'s existing, unmodified
production components (`RoutineBuilder`, `GatedOverlay`,
`RelatedKnowledgeHub`) use `react-router-dom`'s `<Link>`, which requires a
Router context — one this route's TanStack Router tree doesn't natively
provide. Wrapping the page body in `react-router-dom`'s `MemoryRouter`
(never touches `window.history`, purely satisfies the context requirement)
lets these components be reused completely unmodified rather than forked
or rewritten; every link inside still requires a full page navigation to
leave the SSR page and enter the SPA, identical to today's cross-page
navigation behavior anywhere else on the site.

**Shared SEO layer extended, not duplicated.** `src/lib/seo/types.ts` +
`jsonLd.ts` gained `ProductReviewJsonLdInput` / `productReviewJsonLd()` —
`Product` + `Review` + `AggregateRating` schema.org types, matching the
shape `ProductReview.tsx`'s own inline JSON-LD already emits. One real bug
found and fixed here: `offers` (an `AggregateOffer` built from
`Math.min`/`Math.max` over a review's retailer listings) is invalid JSON
when a review has zero retailers — `Math.min()`/`Math.max()` on an empty
array is `±Infinity`, which serializes to `null`. Fixed by making `offers`
genuinely optional in the builder's input type, populated only when
`retailers.length > 0`. Verified against both a real static-catalog review
(3 retailers, `offers` correctly present) and a real generated review
confirmed via direct Supabase query to have `retailers: []` (`offers`
correctly absent). The identical bug still exists, unfixed, in
`ProductReview.tsx`'s own inline JSON-LD — deliberately left alone, out of
this phase's scope.

## The SPA-fallback bug — the real story of this phase

Live-testing this migration on real Vercel infrastructure (the same
discipline Phase 4 established) surfaced a severe, site-wide regression
that had nothing to do with Reviews specifically: **`/dashboard`,
`/reviews/page/2`, `/reviews/versus/:slug`, `/spotlight/<nonexistent>` —
any real SPA route with no prerendered static file and not itself
SSR-migrated — returned Vercel's own platform-level `NOT_FOUND`
(`x-vercel-error: NOT_FOUND`) instead of falling through to serve the real
SPA.** This was a latent bug present since the very first Briefings-only
deployment in Phase 4, undetected until now because every earlier
validation pass only tested root-level and already-statically-covered
paths, never a genuinely dynamic, non-prerendered nested route. Deployed
as-is, this would have broken every authenticated/dashboard route,
comparison articles, pagination, and any other unmigrated SPA route with no
prerendered file — a correctness regression far larger than anything
Reviews-specific, and a hard blocker on shipping this phase, or continuing
to build on this architecture at all, until resolved.

### Three failed attempts at the documented fix

The documented, `@vercel/routing-utils`-generated canonical pattern for a
Build Output API v3 SPA fallback is `{handle:"filesystem"}` followed by
`{src:"^(?:/(.*))$", dest:"/index.html", check:true}`. All three attempts
below produced this exact rule and deployed it live; all three failed
identically.

1. **`05e2ba1` (`dpl_HexRr4E6pKUhwRN4hRod2S4qhXsU`).** The original
   hand-rolled `vercel.json`→routes transform was missing `check: true`
   entirely — confirmed by diffing its output against
   `@vercel/routing-utils`'s own `getTransformedRoutes()` (the real
   function Vercel's own zero-config framework builders call internally).
   Installed `@vercel/routing-utils@6.5.0` as a real devDependency, rewrote
   `buildConfigJson()` to call it directly instead of hand-rolling.
   **Result: bug persisted identically on live re-test.**
2. **`bbb5564` (`dpl_TBGu4zTnqcDz9emdDwFDby1ocQbN`).** Hypothesized
   `vercel.json`'s vestigial `"framework": "vite"` / `"outputDirectory":
   "dist"` fields (left over from before this project had a custom
   `buildCommand`) might trigger some zero-config Vite-specific handling
   conflicting with the custom Build Output API deployment. Removed both,
   and added a full `config.json` dump to build logs for better
   diagnostics. Build logs confirmed the deployed `config.json` was
   byte-for-byte identical to `getTransformedRoutes()`'s own official
   output. **Result: bug persisted identically on live re-test.**
3. **`ef02343` (`dpl_BekFwHuiETUQfA1p3M2gn4vJPdBx`).** Noted
   `config.json`'s documented schema includes a `framework` field
   (`{version, routes, images, wildcard, overrides, cache, framework,
   crons, services}`) this script never set, and that Nitro's own
   `generateBuildConfig()` (read directly from `node_modules/nitro/dist/
   _presets.mjs`) always sets one. Added `framework: {name: "vite"}` to
   the generated `config.json`. **Result: bug persisted identically on
   live re-test.**

Also ruled out along the way: `cleanUrls` (confirmed, by calling
`getTransformedRoutes()` locally with and without it, that it only adds
extra redirect rules — the fallback rule itself is byte-identical either
way); Nitro's own source offering a working reference implementation
(`node_modules/nitro/dist/_presets.mjs`'s `generateBuildConfig()` was read
directly — Nitro's own "static" preset doesn't implement an index.html
SPA-fallback at all, and its SSR preset's fallback routes to the server
function, not a static file, so it offers no precedent either validating
or invalidating the `check:true` approach here). Vercel's own documentation
(`mcp__Vercel__search_vercel_documentation`) only restates the generic
`{handle, src, dest, status}` schema, with no deeper explanation of
`check`'s actual runtime resolution behavior found in any fetched excerpt.

**Root cause remains genuinely unresolved.** The documented, officially-
generated pattern simply does not behave as documented in this project's
specific deployment context (a custom `buildCommand` producing
`.vercel/output` directly, combined with a project whose dashboard-level
Framework Preset setting is still "vite" and cannot be changed from
`vercel.json`). This is recorded here as an open platform-behavior finding,
not a solved mystery — a future revisit with fresh eyes, or a Vercel
support engagement, might explain it; this phase did not.

### The fix: route the fallback through the SSR function, not a static rewrite

Rather than continue guessing at `config.json` field permutations, the
final catch-all was pointed at `/__server` — **the exact function-based
mechanism already proven reliable, across every real deployment this and
the prior phase made, for the Briefings and Reviews SSR route patterns.**
A new TanStack Start splat/catch-all server route, `src/routes/$.ts`,
responds to any request reaching the function with the real,
build-time-embedded `dist/index.html` verbatim (a Vite `?raw` import,
resolved at `build:tanstack-start` time since `vite build` always runs
first in the `npm run build` pipeline), letting the client-side SPA boot
and take over exactly as a static-file fallback would have. It is
deliberately server-only (no `component`): the `Response` it returns is
the final HTTP response, with no TanStack Start document/head wrapping
applied — matching what a static file serve would have produced. Commit
`459858a`.

`vercel.json`'s `rewrites` field (the source of the broken rule) was
removed entirely — the fallback is now assembled directly in
`scripts/assemble-vercel-output.ts`, appended after the filesystem phase:
`ssrAvailable ? {src:"/(.*)", dest:"/__server"} : {src:"/(.*)",
dest:"/index.html", check:true}` (the degraded, no-function case keeps the
old, still-unproven-working rewrite as a last resort — see Known
limitations).

**A real bug in the fix itself, found and fixed before deploying:**
removing `rewrites` from `vercel.json` and simply omitting the `rewrites`
key from the `getTransformedRoutes()` call crashed the local build.
Reading `@vercel/routing-utils`'s own source
(`node_modules/@vercel/routing-utils/dist/index.js`) directly showed why:
`getTransformedRoutes()` only pushes the `{handle:"filesystem"}` phase
marker inside its own `if (typeof rewrites !== "undefined")` branch — an
omitted key skips that marker altogether, and this script's own
`filesystemIndex === -1` guard then throws. Fixed by passing `rewrites: []`
(present, but empty) instead of omitting the key — satisfies the check,
contributes zero actual rewrite rules. Caught locally (a crashed `bun run
scripts/assemble-vercel-output.ts`) before ever reaching a live deployment;
committed separately (`260e5f8`) for a clean diagnostic trail.

### Live validation (`dpl_GhVNksoxiawsXXzRa4Mm9jWHp5BD`, `READY`,
`lambdaRuntimeStats: {"nodejs":2}`)

Same temporarily-disable-SSO / test-in-one-tight-window /
immediately-re-enable methodology as Phase 3/4, verified via
`get_project_deployment_protection` immediately before and after the
window:

| Check | Result |
|---|---|
| `GET /dashboard` | `200`, real `dist/index.html` (`<!DOCTYPE html>`, real hashed bundle, `<div id="root">`) — previously platform `404` |
| `GET /reviews/page/2` | `200`, real `dist/index.html` — previously platform `404` |
| `GET /briefings/pollen-season-skin-south-africa` | `200`, live SSR, `<title>` correct, `"@type":"Article"` + `"@type":"BreadcrumbList"` present — regression-checked, still correct after the fallback rewrite |
| `GET /reviews/sb-cerious-proatection` (real static-catalog review) | `200`, live SSR, `<title>` correct, `"@type":"Product"` + `"@type":"AggregateRating"` present |
| `GET /briefings/this-slug-does-not-exist-xyz-999` | `404` — TanStack Start's own `notFound()`, not swallowed by the new splat fallback (route-priority confirmed correct: specific routes still beat the catch-all) |
| `GET /favicon.ico` | `200`, real static asset, correct `content-type`/`content-length` — confirms the filesystem phase still takes priority over the function-routed fallback for real files |

Also locally verified, before the live pass, via a local `srvx` run against
the assembled `__server.func` (mirroring Phase 3/4's local-verification
discipline): `/reviews/versus/some-slug` (a 2-segment, non-SSR-migrated
path) correctly served the SPA shell via the splat fallback rather than
being incorrectly matched by the single-segment `/reviews/:slug` SSR
pattern — confirming no route-priority collision between the two.

All checks pass. **The site-wide SPA-fallback regression is resolved.**

## `prerender.ts` reduction

`/reviews/:slug` removed from `scripts/prerender.ts`'s crawl list (the
`addDataSlugs("src/data/reviews.ts", "id", "/reviews")` call), only after
the live validation above proved equivalent SSR coverage — same discipline
as Phase 4's Briefings reduction, not preemptive. Unlike Briefings, this
also closes the Reviews-specific gap noted above: the static catalogue used
to get prerendered here, but generated reviews never did; SSR now covers
both uniformly, so this is a net crawlability improvement, not just a
build-time optimization. `/reviews/versus/:slug` (comparisons) and
`/reviews/page/:page` are untouched — neither is SSR-migrated, and
`SSR_ROUTE_PATTERNS`' single-segment pattern cannot collide with either
(both have 2+ path segments after `/reviews/`).

## Known limitations / remaining risks (Phase 5 additions)

1. **The SPA-fallback `check:true` root cause is unresolved**, not just
   worked around. The function-based fix is a proven, working alternative,
   not an explanation. If Vercel's platform behavior changes again, or if
   a future engineer wants a pure static-file fallback (marginally cheaper
   than invoking a function for every non-prerendered path), this gap is
   worth revisiting with fresh eyes.
2. **The degraded `ssrAvailable:false` path** (Nitro build itself fails,
   producing no server function to route the fallback to) still uses the
   old `check:true` static rewrite — the same rule proven broken in the
   primary path. This is a known, documented, *not* silently-assumed-fixed
   gap: if the Nitro build ever fails in production, the fallback for
   non-prerendered SPA routes may 404 until the Nitro build is fixed.
   Building full resilience for a failure-of-a-failure path was judged out
   of scope for this phase.
3. Reviews is the second and, as of this phase, last content type
   SSR-migrated. Knowledge Hub, Ingredients, Podcast, Seasonals, and every
   authenticated/application route remain unmigrated.
4. Same Rich Results Test / Schema.org Validator third-party UI submission
   gap as Phase 4 — not proven, low-effort follow-up.
