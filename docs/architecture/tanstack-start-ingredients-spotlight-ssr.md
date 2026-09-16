# TanStack Start SSR Migration — Ingredients & Spotlight

Extends the SSR architecture from Phases 4-5 (`tanstack-start-production-
migration.md`: Briefings, Reviews) to the top two content types identified
in `tanstack-start-remaining-migrations-scope.md`'s priority audit:
Ingredients (highest freshness payoff — an active admin verification
queue) and Brand Spotlight (medium payoff — a live edition label/
methodology version badge). Knowledge Hub, Podcast and Seasonal Guides
remain out of scope per that same audit (low/no freshness case).

## What shipped

- `src/routes/ingredients.$slug.tsx` — server loader replicates
  `use-ingredient-detail.ts`'s four-query fan-out line for line: the
  ingredient row, its `ingredient_concerns` join, its bidirectional
  `ingredient_interactions` self-join (resolving "the other ingredient"
  from whichever FK side — `ingredient_a_id`/`ingredient_b_id` — matched),
  and up to 12 linked current-formulation products. `head()` emits a
  `DefinedTerm` JSON-LD block (schema.org has no dedicated cosmetic-
  ingredient type; `DefinedTerm` — a term defined within a larger
  vocabulary/dataset — is the closest accurate fit without overclaiming
  `Product`) plus the standard `BreadcrumbList`. No `MemoryRouter` needed:
  every reused component (`EvidenceBadge`, `IngredientDisclaimer`,
  `SourceCitationList`) was confirmed to have zero `react-router-dom`
  dependency by reading each file, so internal links render as plain
  `<a href>`.
- `src/routes/spotlight.$slug.tsx` — server loader resolves the static
  brand ranking (`getSpotlightBrand()`, a synchronous lookup — Spotlight's
  narrative content is deliberately build-time-static per `CLAUDE.md`)
  plus a live `spotlight_editions` query mirroring `use-spotlight-
  edition.ts`'s fallback-on-error behaviour. `head()` emits an `Article`
  JSON-LD block matching the client page's existing inline JSON-LD field
  for field, plus `BreadcrumbList`. Wrapped in `MemoryRouter` (same
  pattern as Reviews) since several reused components
  (`RelatedKnowledgeHub`, `GatedOverlay`'s internal upgrade CTA) use
  `react-router-dom`'s `Link`. Membership gating (Glow Lite+ get full
  profiles; free/signed-out visitors get a client-only localStorage view
  quota) is inherently unresolvable server-side — no server-readable
  session exists — so, matching Reviews' precedent for its own membership-
  gated breakdown, the SSR'd HTML always renders the full profile and the
  real `GatedOverlay` + `useEntitlements` + `access-quotas` client logic
  applies the lock after hydration.

## Shared SEO layer additions

`src/lib/seo/types.ts` / `jsonLd.ts` gained two new builders:

- `ingredientJsonLd()` — new `IngredientJsonLdInput` type (`canonicalUrl`,
  `name`, `category`, `description`), emits `DefinedTerm`.
- `spotlightBrandJsonLd()` — new `SpotlightBrandJsonLdInput` type,
  **deliberately narrower** than `ArticleJsonLdInput`: no
  `datePublished`/`dateModified`/`images` fields. The client's own inline
  JSON-LD for this page (`SpotlightBrandProfile.tsx`) has never carried
  those fields, and `src/data/spotlight.ts`'s brand entries have no real
  per-brand date or logo-URL field to source them from — adding them would
  mean fabricating data, which `CLAUDE.md`'s standing rule forbids. The
  original scope doc (`tanstack-start-remaining-migrations-scope.md`)
  speculated an `organizationJsonLd()`/`Organization` type for Spotlight;
  reading the actual client page found it emits `Article`, not
  `Organization`, so this migration matches the real existing shape
  instead of the earlier speculative plan.

## `src/lib/content/supabaseServerClient.ts`: typed with `Database`

The factory previously called `createClient(url, key)` with no generic,
unlike the client-side `supabase` export
(`src/integrations/supabase/client.ts`), which passes `Database`. This was
invisible for Briefings and Reviews (flat selects, no joined relations),
but Ingredients' nested self-join query surfaced it immediately: without
the `Database` generic, supabase-js falls back to its select-string type
inference, which cannot determine a joined relation's real one-to-many vs.
many-to-one cardinality and defaults it to an array — producing spurious
`TS2352` cast errors on code that is otherwise a faithful, line-for-line
copy of the already-typed client hook. Adding `createClient<Database>(...)`
fixed the inference at the root (all four flagged casts resolved to zero
errors) rather than papering over it with `as unknown as ...` at each call
site. This is now correct for every future SSR route that joins relations,
not just Ingredients.

## Routing: a new sibling-collision class, and why it's solved without lookahead

Unlike Briefings/Reviews (whose non-slug siblings live under a completely
different path, e.g. `/briefings` vs. `/briefings/:slug`), Ingredients and
Spotlight each have **single-segment sibling static routes under the same
prefix** as their SSR-migrated slug pattern:

| Content type | Slug pattern | Sibling(s) that must NOT be swallowed |
|---|---|---|
| Ingredients | `/ingredients/:slug` | `/ingredients/checker` |
| Spotlight | `/spotlight/:brandSlug` | `/spotlight/methodology`, `/spotlight/archive` |

A bare `^/ingredients/([^/]+)$` pattern matches `/ingredients/checker`
too — since `SSR_ROUTE_PATTERNS`' entries are spliced in *before* the
`{handle:"filesystem"}` phase (required so a live SSR response is never
shadowed by a stale prerendered file), this would route the checker tool
to the SSR function instead of letting the filesystem phase serve its
real static page: a false ingredient-slug 404.

A negative-lookahead regex (`^/ingredients/(?!checker$)([^/]+)$`) would
also solve this and was the first approach tried. It was rejected before
ever reaching a live deployment: Vercel's production routing layer is not
confirmed to run a lookahead-capable regex engine — several platforms use
a linear-time engine (Rust's `regex` crate, RE2) that rejects lookaround
entirely for guaranteed-linear-time matching, and nothing in this
environment can verify which engine backs Vercel's routing layer without
literally shipping the untested syntax to production and finding out.

Instead, `scripts/assemble-vercel-output.ts` now builds each content
type's SSR routes from a `{prefix, siblings?}` list
(`SSR_ROUTE_CONTENT_TYPES`) and, for each `siblings` entry, emits a
`continue: true` route (a documented, first-class Build Output API v3
field — confirmed in `node_modules/@vercel/routing-utils/dist/types.d.ts`)
immediately before the general slug pattern:

```json
{ "src": "^/ingredients/checker$", "continue": true },
{ "src": "^/ingredients/([^/]+)$", "dest": "/__server" },
{ "src": "^/spotlight/methodology$", "continue": true },
{ "src": "^/spotlight/archive$", "continue": true },
{ "src": "^/spotlight/([^/]+)$", "dest": "/__server" }
```

A matched `continue: true` route applies no destination and falls through
to the next route in the array — here, past the two sibling literals,
into the `{handle:"filesystem"}` phase — achieving the identical exclusion
with zero reliance on unverified regex engine behaviour. Confirmed correct
both structurally (the exact JSON above, verified via
`npm run assemble-vercel-output`'s own debug output) and live (see
Validation below).

## Sitemap: real gap found and resolved, unrelated to routing

While verifying `scripts/generate-sitemap.ts` covers both new content
types (it already did, unmodified — its Supabase-backed ingredient-slug
query and static `spotlight.ts` slug extraction predate this migration),
a real, separate gap surfaced: **the git-committed `public/sitemap.xml`
had zero `/ingredients/:slug` entries**, despite 127 real, non-deprecated
ingredients existing in production (confirmed via a direct
`mcp__Supabase__execute_sql` count against the live `ingredients` table).
Root cause: `generate-sitemap.ts` has no hardcoded Supabase fallback
(unlike `supabaseServerClient.ts`/`src/integrations/supabase/client.ts`,
which both fall back to the real production URL/key) — it silently skips
every Supabase-backed section (ingredients, reviews, briefings,
marketplace) when `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`
aren't in `process.env`, which is exactly this sandbox's condition and,
it turned out, whatever condition produced the last committed snapshot.

The **live** production sitemap (`https://skinlabs.co.za/sitemap.xml`,
regenerated fresh on every real Vercel build, which does have the real
project env vars) was confirmed — after this phase's live-validation
window (see below) — to already contain all 127 ingredient slugs and all
50 Spotlight brand slugs correctly. The committed git snapshot is a
point-in-time artifact the build always regenerates, not a second source
of truth, so it was left un-updated from this sandbox run rather than
committing a strictly worse version (missing not just ingredients but
also every reviews/briefings/marketplace entry, ~300 fewer URLs than the
live count) over the real one. No code change was needed or made to
`generate-sitemap.ts` itself.

## Validation

Local: `tsc --noEmit` (zero new errors vs. an `origin/main` baseline,
confirmed by diffing error counts before/after this branch's changes —
20 pre-existing errors unrelated to this work, 14 after, i.e. strictly
fewer), `eslint` clean on every changed/new file, 80/80 `bun test` pass,
full `npm run build` succeeds end to end including the real
`build:tanstack-start` Nitro build and `assemble-vercel-output`.

**Blocked, not skipped.** Live validation on real Vercel infrastructure
(branch `claude/ingredients-spotlight-ssr-migration`) could not be
completed this session. The git-triggered preview build for commit
`54e2780` (deployment `dpl_CYg9GS5Pyc1SorFVdawRaFSLVjZK`) stalled in the
`BUILDING` state for over 100 minutes — far past this project's
historical 13-20 minute end-to-end build time for this exact pipeline
(Phase 5's own documented estimate; `npm run build`'s biggest cost is
`scripts/prerender.ts`'s headless-Chromium crawl) — with zero new log
output after `prerender: 165 routes to render`, and zero error/stderr/
exit events in that window (`mcp__Vercel__get_deployment_build_logs` with
`errorsOnly: true` returned none throughout). A follow-up commit
(`42ac7bf`, this doc) was pushed specifically to queue a second, fresh
build attempt (`dpl_tKDDB7RzPTMJN2ZYzcpc3dbssrow`) — it stayed `QUEUED`
the entire time, confirmed blocked behind the first build holding this
account's single concurrent-build slot, which itself never resolved to
either `READY` or `ERROR`.

`scripts/prerender.ts` was not touched by this migration's diff, and this
exact pipeline (including its 165-ish-route Chromium crawl) succeeded on
real Vercel infrastructure in every prior phase's live deployment — this
reads as transient Vercel build-infrastructure flakiness (or an
environment-specific headless-Chromium hang inside that one build
container) rather than a regression introduced by this migration's code.
No tool available in this session can cancel a running Vercel build, so
there was no way to unstick it from here.

**What this means concretely:** the code in this migration is fully
built, typechecked, linted, tested, and proven to produce the correct
`.vercel/output/config.json` route structure via a real, successful local
`npm run build` (see Local above) — but the specific claim "proven
correct via a live-hosted request/response, not just build-time
structure" (the standard this project's prior phases held themselves to,
and the standard the SPA-fallback regression in Phase 5 specifically
proved is necessary) is **not yet met** for `/ingredients/:slug` and
`/spotlight/:slug`. Per this project's own standing discipline ("never
make an unfinished feature appear operational"), `scripts/prerender.ts`'s
crawl for these two slug patterns has deliberately **not** been trimmed
(see the `tanstack-start-remaining-migrations-scope.md` precedent: this
step is explicitly gated on live proof, never done preemptively) — both
routes stay fully prerendered as a static fallback in the meantime, so
nothing regresses even though the SSR path is unconfirmed live.

**Next step, whenever a build succeeds:** confirm on the resulting
preview URL — a valid ingredient slug (e.g. `/ingredients/hyaluronic-
acid`), a valid Spotlight brand slug, both sibling static pages
(`/ingredients/checker`, `/spotlight/methodology`, `/spotlight/archive`
— must NOT 404 or serve SSR-route content), a 404 case for each content
type, and a regression check on `/briefings/:slug`, `/reviews/:slug` and
the SPA fallback. Only after that passes: trim `prerender.ts`'s
Ingredients/Spotlight slug crawl, per the established discipline.

## Production accessibility: Vercel Authentication was blocking all public access

Independently of this migration, production was found gated behind
Vercel Authentication (SSO protection, `deploymentType: "all"`) — every
request, including `robots.txt` and `sitemap.xml`, redirected to a Vercel
SSO login page instead of serving content. This had been surfaced once
earlier in this project's session history and left as-is at the time.
It directly blocked the standing request behind this migration's Part D
(submitting the sitemap to Google Search Console — Googlebot cannot
crawl or verify a site stuck behind an SSO redirect). Raised explicitly
to the user as a decision point; disabled per their explicit choice.
Production (`https://skinlabs.co.za`) is now publicly reachable.
