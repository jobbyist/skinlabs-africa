# Briefing SSR Proof-of-Concept — Live Runtime Validation

**Status: complete.** This is Phase 3 of the TanStack Start feasibility
work (Phase 1: isolated spike; Phase 2: repo-root coexistence test,
CONDITIONAL GO). This phase closes the one remaining mandatory gate from
Phase 2: **live, Vercel-hosted runtime proof** — not just build success.

All work happened on branch `claude/skinlabs-tanstack-start-migration-lko468`.
`main`/production was never touched. Nitro version used throughout:
**`nitro@3.0.260610-beta`** via `@tanstack/react-start@1.168.53` +
`@tanstack/react-router@1.170.36` (same pinned versions as Phase 1/2 — the
Nitro v2 override was not used here; it was already decisively closed as
NO-GO in Phase 2).

## Real data used

Selected via read-only Supabase queries against the live production
project (`gnkpzijxuciiaamakgzm`), publishable-key-equivalent access only:

- **Main POC record**: `pollen-season-skin-south-africa` — real, published,
  complete SEO fields, real cover image + photo credit.
- **"Modified" test record**: `retinal-vs-retinol-hot-bathrooms-sa` — a
  real row whose `updated_at` is genuinely 4+ days after `created_at`
  (found by querying live data for the largest `updated_at - created_at`
  delta among published rows, not fabricated).
- **"Unpublished" test**: no real unpublished Briefing exists in production
  right now — all 63 rows in `news_articles` currently have
  `status = 'published'`. Verified structurally instead (see below), since
  writing a fake draft row into the live table to manufacture a test case
  would itself be an unauthorized production data mutation.

A real, pre-existing data-model finding, not introduced by this work: the
`news_articles` table's own `json_ld` column hardcodes `dateModified` to
always equal `datePublished` for every article (confirmed by inspecting a
live row). This POC's route instead derives `dateModified` from the real
`updated_at` column, confirmed correct against both records above
(2026-09-11 → 2026-09-12, and 2026-09-06 → 2026-09-12 respectively).

## What the route does

`src/routes/briefings.$slug.tsx` — mirrors the real `/briefings/:slug`
route (`src/pages/NewsroomArticle.tsx`) and its data shape, but renders
server-side. Queries the base `news_articles` table (not the
`news_articles_public` view, which doesn't expose `updated_at`) with an
explicit `status = 'published'` filter — the identical security boundary
either way, enforced by the same RLS policy
(`"Published articles are public"`, `qual: status = 'published'`, for
`anon, authenticated`). Not wired into the real app — reachable only
through the same `build:tanstack-start-test` pipeline used in Phase 2.

## Validation — four methods, as required

### 1. Local `curl` (before any deployment)
Confirmed via direct HTTP requests to a locally-running production build:
real title, meta description, canonical, full OG/Twitter set, and two
valid `application/ld+json` script tags for the real slug; genuine `404`
for a nonexistent slug.

### 2. Real headless-browser load
Loaded via `puppeteer-core` against the pre-installed Chromium (the same
browser this environment's `scripts/prerender.ts` itself uses). Confirmed:
`document.title`, `<h1>`, canonical `<link>`, `og:title`, both JSON-LD
`<script>` tags present in the live DOM, cover image rendering. One
console error (`ERR_CONNECTION_RESET` loading the external Unsplash image)
is this sandbox's documented outbound-proxy limitation on third-party
hosts, not an application defect.

### 3. Live Vercel deployment — **the decisive step**

Deployed via the same coexistence-proven two-step `buildCommand`
(`npm run build && npm run build:tanstack-start-test`) from Phase 2.
Preview URLs on this account are SSO-gated; per explicit user approval,
deployment protection was **temporarily disabled, tested, and immediately
re-verified re-enabled** — two tight windows, not left open:

**First window** surfaced a real bug: the deployed function returned a
false `notFound()` for the real, published Briefing. Root cause: the
serverless function's `process.env` did not expose
`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` at runtime. Rather than
guess at Vercel env-var scoping, the fix applied the **same fallback
pattern `src/integrations/supabase/client.ts` already uses** (hardcoded,
public-by-design, RLS-enforced production values, with an explicit comment
anticipating exactly this gap) — confirmed locally with zero env vars set
before redeploying. This is reported as a genuine finding, not glossed
over: catching it is precisely why live validation was required instead of
trusting local-only tests.

**Second window**, after the fix, was decisive:
```
GET /briefings/pollen-season-skin-south-africa → HTTP 200
GET /briefings/this-slug-does-not-exist-xyz    → HTTP 404
```
The live response contained, verified by direct inspection of the raw
captured HTML:
- `<title>Pollen and Skin in South Africa: Spring Flares, Not a Glow Dust | SkinLabs®</title>`
- `<meta name="description" content="...">`
- `<link rel="canonical" href="https://skinlabs.co.za/briefings/pollen-season-skin-south-africa"/>`
- Full `og:title`/`og:description`/`og:url`/`og:type`/`og:image`/`og:site_name`
- Two valid `application/ld+json` blocks (Article + BreadcrumbList),
  re-parsed from the live response and confirmed: valid JSON, correct
  `@context`/`@type`, every required Article field
  (headline/description/image/datePublished/dateModified/author/publisher)
  present and non-empty.
- The 404 page's own `<h1>Briefing not found</h1>` present for the
  nonexistent slug.

Both protection-toggle windows were confirmed via
`get_project_deployment_protection` immediately before and after — the
project's deployment protection is restored to `ssoProtection: {enabled:
true, deploymentType: "all"}`, the closest available equivalent to its
original `"all_except_custom_domains"` state (that exact label is a
Vercel-reported value, not one of the settable options; "all" is
functionally equivalent since custom domains were never protectable
through this mechanism regardless).

### 4. Third-party validators — partially completed, stated precisely

Live `curl` + structural JSON-LD re-validation (parsed as JSON, all
required Article fields checked) were performed against the actual
deployed response during the second window. A true third-party submission
to Google's Rich Results Test or the Schema.org Validator's own hosted UI
was **not** performed — doing so would have meant extending the
protection-disabled window for a check that tests the identical
requirements (valid JSON-LD, correct schema.org vocabulary, required
fields) already confirmed structurally against the live response, and
prolonging the exposure window wasn't justified for that marginal
confirmation. **Stated plainly: true Google Rich Results Test / Schema.org
Validator UI submission against the live URL remains NOT PROVEN** — this
is a five-minute follow-up (paste the canonical URL into either tool)
that can be done any time protection is next disabled, or once/if the
route is ever promoted past SSO protection.

## `scripts/prerender.ts` vs. this SSR POC

Directly measured, not estimated, in this session:

| | `scripts/prerender.ts` (current production) | TanStack Start SSR (this POC) |
|---|---|---|
| Mechanism | Headless Chromium crawls a bounded route list (up to 1000) at **build time**, writes static `dist/<route>/index.html` per route | Server function queries Supabase **per request**, renders on demand |
| Time to make ONE briefing crawlable | Full production build: **~12–16 minutes** (confirmed: Test B's prerender step alone ran 18:08:38→18:20:39, ~12 min, out of a ~13–16 min total build, consistent with a separately-checked known-good deployment's own `Build Completed [16m]` log line) | **Next request** — no rebuild, no redeploy. Confirmed: local `build:tanstack-start-test` builds in 3–7 seconds (measured across five builds this session), and that build step compiles the *route*, not the *content* — content itself is fetched fresh per request with no rebuild trigger at all |
| What happens for a newly published/edited Briefing today | Invisible to crawlers until the *next full production build* runs (whatever triggers that — a deploy, a scheduled rebuild) | Visible to crawlers on the very next request after publish/edit, proven directly by this POC's live "modified" test (`dateModified` reflecting a real edit with no rebuild involved) |
| Failure mode | Fails soft per-route and overall (`console.warn`, `process.exit(0)`) — a broken prerender never fails the build, but also never retries; a route that fails to prerender silently falls back to the SPA rewrite until the next successful build | A request-time error is just that request's error — doesn't affect any other route or require a rebuild to recover |

**Conclusion**: for content types with a real publish/edit cadence
(Briefings, and the AI-generated Reviews tier per the Phase 1 audit), SSR
directly closes the exact gap `prerender.ts` structurally cannot: same-day
or same-hour crawlability of new/edited content, without waiting on the
next ~12–16 minute full production build. This matches Phase 1's
per-content-type recommendation (SSR for genuinely time-sensitive content;
build-time prerender/SSG remains appropriate for the fully-static content
types, where this gap doesn't exist).

## Remaining risks

1. True third-party Rich Results Test / Schema.org Validator UI submission
   against the live URL — NOT PROVEN (see §4). Low-effort follow-up.
2. The env-var gap found and fixed here (§3) was specific to this Preview
   deployment's function runtime; whether Production-target deployments
   have the same gap wasn't tested (out of scope — production was never
   touched), and the fallback fix applied is a reasonable, already-vetted
   safety net either way.
3. Nitro v3 remains beta (per Phase 1/2's unchanged finding) — this
   phase's success doesn't change that status; it's still a named,
   accepted risk requiring an explicit decision before full migration.
4. This POC covers exactly one content type (Briefings) and one route
   shape. Reviews, Knowledge Hub, Ingredients, Podcast, Seasonals,
   dashboards and all other routes remain unmigrated and untested, per
   explicit scope.

## Decision

**GO** — runtime and SSR/SEO proof is complete for the scope tested. Real,
live, Vercel-hosted request/response cycles (not just build output) proved
correct SSR content, complete SEO metadata, and valid Article +
BreadcrumbList JSON-LD in the initial HTTP response for a real production
Briefing, a real modified-date case, and a real 404 case — closing the
exact gap Phase 2 left open. The one incomplete item (§4, third-party
validator UI submission) is a low-effort, non-blocking follow-up, not a
structural unknown. Proceed with a phased migration, starting from
Briefings as the walking-skeleton content type (per Phase 1's original
recommendation), carrying forward the two concrete fixes this phase
surfaced (`nitro.config.ts`'s `renderer: false`, and the Supabase env-var
fallback pattern) into that work rather than rediscovering them.
