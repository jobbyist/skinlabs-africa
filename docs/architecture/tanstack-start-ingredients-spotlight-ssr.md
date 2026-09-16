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

## Routing: a new sibling-collision class, and two failed approaches before the real fix

Unlike Briefings/Reviews (whose non-slug siblings live under a completely
different path, e.g. `/briefings` vs. `/briefings/:slug`), Ingredients and
Spotlight each have **single-segment sibling static routes under the same
prefix** as their SSR-migrated slug pattern:

| Content type | Slug pattern | Sibling(s) that must NOT be swallowed |
|---|---|---|
| Ingredients | `/ingredients/:slug` | `/ingredients/checker` |
| Spotlight | `/spotlight/:brandSlug` | `/spotlight/methodology`, `/spotlight/archive` |

A bare `^/ingredients/([^/]+)$` pattern matches `/ingredients/checker`
too — since a naive splice puts SSR routes *before* the
`{handle:"filesystem"}` phase (required so a live SSR response is never
shadowed by a stale prerendered file), this would route the checker tool
to the SSR function instead of letting the filesystem phase serve its
real static page: a false ingredient-slug 404.

**Attempt 1 — negative lookahead.** Rejected before ever reaching a live
deployment: Vercel's production routing layer is not confirmed to run a
lookahead-capable regex engine — several platforms use a linear-time
engine (Rust's `regex` crate, RE2) that rejects lookaround entirely, and
nothing in this environment can verify which engine backs Vercel's
routing layer without shipping untested syntax to production.

**Attempt 2 — `continue: true` sibling-exclusion routes.** The first
version actually shipped: a literal `{src: "^/ingredients/checker$",
continue: true}` route spliced immediately before the general slug
pattern, reasoning that a matched `continue: true` route "applies no
destination and falls through" past the exclusion into the filesystem
phase. **This was wrong, and only live validation caught it**: `continue:
true` doesn't skip to the filesystem phase — it only advances to the
*next route in the array*, which was the general slug pattern for the
same prefix, positioned immediately after the exclusion. So
`/ingredients/checker` matched the exclusion (continue), then
immediately re-matched `^/ingredients/([^/]+)$` with `slug="checker"` and
got routed to the SSR function anyway, which correctly reported "not
found" for a nonexistent ingredient slug called "checker" — a real,
confirmed-live 404 on a page that should have loaded normally, on the
first preview deployment this migration reached (`dpl_CYg9GS5...`,
commit `54e2780`). The local build's own generated `config.json` looked
structurally correct in isolation; the bug only showed up once a real
request actually flowed through Vercel's route evaluator end to end.

**The actual fix — split by filesystem-phase placement.**
`scripts/assemble-vercel-output.ts` now splits SSR content types into two
groups, `SSR_ROUTE_CONTENT_TYPES_PRE_FILESYSTEM` (Briefings, Reviews —
no sibling-collision risk, spliced before filesystem as before) and
`SSR_ROUTE_CONTENT_TYPES_POST_FILESYSTEM` (Ingredients, Spotlight —
spliced *after* the `{handle:"filesystem"}` marker instead):

```json
{ "src": "^/briefings/([^/]+)$", "dest": "/__server" },
{ "src": "^/reviews/([^/]+)$", "dest": "/__server" },
{ "handle": "filesystem" },
{ "src": "^/ingredients/([^/]+)$", "dest": "/__server" },
{ "src": "^/spotlight/([^/]+)$", "dest": "/__server" },
{ "src": "/(.*)", "dest": "/__server" }
```

No exclusion list at all: the filesystem phase's own real-file check is
what protects `/ingredients/checker` and `/spotlight/methodology`/
`archive` now — a static file exists there (still prerendered — see
below), so filesystem serves it directly and the SSR patterns after it
never see the request. A real ingredient/brand slug has **no** static
file (prerender.ts was updated in the same commit to stop crawling
them — see next paragraph), so filesystem finds nothing and falls
through to the post-filesystem SSR pattern, which resolves it live. This
requires `scripts/prerender.ts` to no longer prerender real Ingredients/
Spotlight slugs, or a stale file would win the filesystem check ahead of
the live SSR route — the commit that introduced this routing fix also
removed that crawl (`addDataSlugs("src/data/spotlight.ts", ...)` and the
`ingredients` Supabase query block), leaving the sibling literals
(`/ingredients/checker`, `/spotlight/methodology`, `/spotlight/archive`)
in `prerender.ts`'s `STATIC_ROUTES` untouched.

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
confirmed by diffing error counts before/after this branch's changes),
`eslint` clean on every changed/new file, 80/80 `bun test` pass, full
`npm run build` succeeds end to end including the real
`build:tanstack-start` Nitro build and `assemble-vercel-output` — run
twice, once for the (broken) `continue: true` version and again after
the post-filesystem-splice fix, confirming the generated `config.json`
matches the JSON shown above exactly.

**Live, on real Vercel infrastructure — confirmed working**, after two
preview-deployment cycles on branch `claude/ingredients-spotlight-ssr-
migration`:

- **First deployment** (commit `54e2780`, `dpl_CYg9GS5...`) — stalled in
  `BUILDING` for 100+ minutes before eventually reaching `READY` (no
  action taken from this session unstuck it; it simply resolved on its
  own, most likely transient Vercel build-infrastructure contention —
  `scripts/prerender.ts` was unmodified in that commit and this exact
  pipeline had succeeded in every prior phase's live deployment). Once
  ready, live curl testing caught the `continue: true` bug described
  above: `/ingredients/checker`, `/spotlight/methodology` and
  `/spotlight/archive` all returned `404` with the SSR route's own
  ingredient-not-found body, not the real static page.
- **Second deployment** (commit `8815cad`, the post-filesystem-splice
  fix + the matching `prerender.ts` trim, `dpl_EVnxPFJ...`) — built in
  ~9 minutes (down from 165 to 115 prerendered routes) and reached
  `READY`. Full live curl verification against the preview URL, all
  results correct:

  | Path | Expected | Result |
  |---|---|---|
  | `/ingredients/checker` | 200, real checker tool | 200, `<title>Ingredient Combination Checker...` ✓ |
  | `/spotlight/methodology` | 200, real methodology page | 200, `<title>Spotlight Methodology...` ✓ |
  | `/spotlight/archive` | 200, real archive page | 200 ✓ |
  | `/ingredients/hyaluronic-acid` | 200, SSR content + JSON-LD | 200, correct `<title>`, `DefinedTerm` JSON-LD present ✓ |
  | `/spotlight/standard-beauty` | 200, SSR content + JSON-LD | 200, correct `<title>`, `application/ld+json` present ✓ |
  | `/ingredients/nonexistent-xyz` | 404 | 404 ✓ |
  | `/spotlight/nonexistent-xyz` | 404 | 404 ✓ |
  | `/briefings` (regression) | 200 | 200 ✓ |
  | `/reviews` (regression) | 200 | 200 ✓ |
  | `/dashboard` (SPA fallback, regression) | 200 | 200 ✓ |

`prerender.ts`'s Ingredients/Spotlight slug crawl was trimmed in the same
commit as the routing fix (not a separate follow-up) since the fix is
incorrect without it — both changes were validated together, live, per
the table above.

**Lesson for future SSR migrations with sibling-collision risk:** don't
trust a locally-generated `config.json`'s structure as proof the routing
actually behaves as intended, even when it looks byte-for-byte correct —
`continue: true`'s real semantics ("advance to the next array entry",
not "skip to the filesystem phase") were misread once already and only
a real deployed request surfaced it. Placing a content type's SSR routes
after the filesystem phase (when it has sibling-collision risk) is both
simpler and more robust than any same-array exclusion mechanism, since
it has no ordering trap to get wrong.

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
