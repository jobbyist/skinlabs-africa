# TanStack Start — Repo-Root Coexistence Test

**Status: complete.** This is Phase 2 of the TanStack Start feasibility work
(Phase 1: `spike/tanstack-start/`, an isolated subdirectory spike). This
phase tests whether TanStack Start + Nitro can coexist with the **real**
`vercel.json` and the **real** `api/product-review-sync.ts` — a live daily
Vercel Cron function — at the actual repository root, without disrupting
production. All work happened on branch
`claude/skinlabs-tanstack-start-migration-lko468`; `main`/production was
never touched.

Findings below are split into four categories per an explicit requirement:
**build success is not runtime proof.** Every claim about Vercel-hosted
runtime behavior that was not actually verified live is labeled
**NOT PROVEN — preview runtime is SSO-gated**, since preview URLs on this
Vercel account redirect to `vercel.com/sso-api` (confirmed via direct
`curl` in Phase 1).

---

## 1. BUILD COMPATIBILITY

*Can the dependency graph install and the application compile successfully?*

**PROVEN**, both locally and via real Vercel build logs.

- A fresh `npm install --legacy-peer-deps` resolves cleanly with the three
  new packages added (`@tanstack/react-start`, `@tanstack/react-router`,
  `nitro`) — 1040 packages, zero `ERESOLVE` errors.
- `--legacy-peer-deps` is still required — but for a **pre-existing,
  unrelated reason**: `react-helmet-async@2.0.5`'s React peer range
  (`^16.6.0 || ^17.0.0 || ^18.0.0`) rejects the app's React `^19.2.3`. This
  was reproduced identically on the **pristine, pre-TanStack-Start**
  `package.json` in an isolated scratch directory — TanStack Start adds
  **zero new conflicts**.
- The root app's existing `vite@^7.2.7` already satisfies
  `@tanstack/react-start`'s `vite: >=7.0.0` peer requirement — **no version
  bump needed**. (Phase 1's CLI-scaffolded spike defaulted to `vite@^8.0.0`
  out of fresh-scaffold habit; that bump is not actually required here.)
- `typescript@^5.8.3` and `@supabase/supabase-js@^2.87.1` — no bump needed.
- `@tanstack/router-cli` was **not** added as a dependency — route-tree
  codegen (`src/routeTree.gen.ts`, gitignored) runs automatically as part
  of the Vite build via `@tanstack/react-start`'s own bundled plugin.
- The real, unmodified `npm run build` (sitemap → podcast-rss →
  search-index → compress-images → `vite build` → prerender) succeeds with
  the TanStack Start dependencies present in `package.json` — confirmed
  locally (`exit 0`) and via Test A's full Vercel build (prerender:
  "326 rendered, 0 skipped").
- The new `npm run build:tanstack-start-test` (`vite build --config
  vite.tanstack-start.config.ts`) succeeds locally and on Vercel, using
  the root's existing Vite 7.2.7, with zero warnings after two fixes (see
  §3).
- Node `>=22.12.0` (required by `@tanstack/react-start`) is satisfied by
  this environment (22.22.2) and by Vercel's `nodejs24.x` runtime (used in
  both Test A and Test B).

---

## 2. VERCEL DEPLOYMENT COMPATIBILITY

*Can Vercel produce the expected TanStack/Nitro output alongside the
existing Vercel configuration and `api/product-review-sync.ts`?*

**PROVEN** via two real Vercel deployments (Test A and Test B, both
`READY`).

- Nitro's `vercel` preset auto-detected correctly from a one-line
  `vercel.json` addition (`{"framework": "tanstack-start"}` in the
  isolated Phase 1 spike; no equivalent change needed at the repo root
  since the TanStack build runs as a second script, not the primary
  framework build) — `[nitro:vercel] Using nodejs24.x runtime`,
  `preset: vercel`, zero extra Vercel-specific config required.
- **Test A** (control — `vercel.json`'s `buildCommand` left as bare
  `npm run build`): built normally in ~14 minutes, deployment metadata
  shows `lambdaRuntimeStats: {"nodejs": 1}` — the existing
  `api/product-review-sync` function, unaffected by the new files sitting
  unreferenced in the repo.
- **Test B** (coexistence — `buildCommand` changed, test-branch-only, to
  `npm run build && npm run build:tanstack-start-test`): built
  successfully end-to-end in ~13 minutes total (aided by a warm cache from
  Test A). Both build phases completed without error.
- **Decisive finding**: after Nitro's own build finished writing
  `.vercel/output` (`18:20:46 Generated .vercel/output/nitro.json`), the
  build log shows a **separate, subsequent** phase:
  ```
  18:20:46  Installing dependencies...
  18:20:47  up to date in 2s
  18:20:48  Using TypeScript 5.9.3 (local user-provided)
  18:20:52  Build Completed in /vercel/output [13m]
  ```
  This is Vercel's **own native `api/` folder function compiler**, running
  independently *after and in addition to* the custom `buildCommand`'s own
  output. This directly answers the central open question from the
  pre-test research (does Vercel's platform still zero-config-detect
  `api/` when a custom `buildCommand` supplies `.vercel/output` directly)
  — **yes, it does.**
- Test B's deployment metadata shows `lambdaRuntimeStats: {"nodejs": 2}`
  — one more Node.js function than Test A's `{"nodejs": 1}` — consistent
  with the TanStack Start SSR function (`__server.func`) and the
  separately-compiled `api/product-review-sync` function both being
  present in the same deployment.

---

## 3. ROUTING/ARTIFACT COMPATIBILITY

*Does the generated output show: TanStack SSR routes exist,
`api/product-review-sync.ts` remains represented correctly, cron
configuration remains intact, no route namespace collision exists?*

**PROVEN** (from build-log artifact-tree listings — no direct file-listing
tool into a completed deployment's `.vercel/output` was available, so this
is log-based, not a raw directory read):

- `.vercel/output/functions/__server.func/` generated correctly by
  Nitro's `vercel` preset in Test B, containing the full TanStack Start
  SSR bundle (React, the Supabase client, the router, etc. — confirmed via
  the itemized file-size listing in the build log).
- **No index.html-shadowing warning** appeared in Test B's real Vercel
  build log (see §5 for what this bug was and how it was found/fixed) —
  the `nitro.config.ts` `renderer: false` fix holds on real Vercel
  infrastructure, not just locally.
- **No route-collision, duplicate-function, or "output overwritten"**
  errors or warnings appeared anywhere in either Test A's or Test B's full
  build logs.
- Two Node.js lambda functions confirmed present in Test B's deployment
  metadata (§2) — consistent with the SSR function and the
  `api/product-review-sync` function coexisting in one deployment.

**NOT DIRECTLY VERIFIED** (inferred from unchanged input config, not
observed as output):

- The literal contents of the resulting cron registration (Vercel's
  internal representation of `vercel.json`'s `crons` block after
  deployment) were not retrievable through any available tool — only
  build logs and deployment/project metadata could be queried, not a live
  read of the deployment's registered cron schedule. `vercel.json`'s
  `crons` block itself was never edited in either Test A or Test B (only
  `buildCommand` was), so continuity is inferred from **the input being
  untouched**, not from directly reading the resulting registration.
- Whether the `api/product-review-sync` function Vercel separately
  compiled in Test B is byte-identical in behavior to the one in Test A /
  production was not diffed — only its *existence* (via the lambda count)
  was confirmed.

---

## 4. RUNTIME COMPATIBILITY

*What has actually been proven at runtime versus what remains untested
because preview URLs are SSO-protected?*

### Local runtime: PROVEN (real HTTP requests, this machine)

- **Phase 1, isolated spike**: `node .output/server/index.mjs` on this
  machine, real `curl` request, returned genuine SSR HTML containing
  real production Supabase data (128 ingredients, matching the catalogue
  size documented elsewhere in this repo) for a route with no conflicting
  `index.html` present.
- **Phase 2, repo-root test, before the `renderer: false` fix**: the local
  server returned **wrong** content — the real app's own static
  `index.html`, byte-for-byte, for every path including a deliberately
  made-up nonexistent one (all returned `200` with identical output,
  confirmed via `diff`). Root cause traced to
  `.output/server/_chunks/renderer-template.mjs`, which had the real
  `index.html` baked in verbatim by Nitro's auto-detected "renderer"
  fallback (Nitro's own documented feature: it auto-discovers any
  project-root `index.html` and serves it for all unmatched routes —
  the real app already has one, and this build never intersected with
  TanStack Start's own `__root.tsx` shell as a result).
- **Phase 2, repo-root test, after the fix** (`nitro.config.ts`:
  `renderer: false`): local server, real `curl` requests, correct SSR
  content returned at `/tanstack-start-test` with real Supabase data
  (128 ingredients again, same production project), and a genuine `404`
  for a nonexistent path — confirming the fix actually works, via actual
  HTTP responses, not just a clean build.
- **Test C (Nitro v2 override)**: local server, a real `curl` request to
  `/api/product-review-sync`, a real crash:
  ```
  TypeError: Cannot read properties of undefined (reading 'status')
      at Object.handler (.../chunks/routes/api/product-review-sync.mjs:213:9)
  ```
  with the full stack trace pointing at the real file's own
  `res.status(200).json(...)` call. Root cause: nitropack v2's router
  invokes handlers as single-argument H3 event handlers
  (`handler(event)`), while the real file's exported signature is
  Vercel's classic two-argument `(req, res)` — confirmed by reading
  `.output/server/index.mjs`'s `toEventHandler` (a no-op passthrough in
  this build) and `defineLazyEventHandler`'s `handler(event)` call site.
  This is decisive, reproduced, real evidence — not inference.

### Vercel-hosted runtime: **NOT PROVEN — preview runtime is SSO-gated**

- Whether a real HTTP request to the Vercel-deployed
  `/tanstack-start-test` route actually renders correct SSR content:
  **NOT PROVEN — preview runtime is SSO-gated.** (Confirmed via `curl`
  returning `302` to `vercel.com/sso-api` with a `_vercel_sso_nonce`
  cookie in Phase 1 spike testing — an account-level setting, not an
  application defect.)
- Whether a real HTTP request to the Vercel-deployed
  `/api/product-review-sync` (with or without a valid `CRON_SECRET`)
  actually reaches the function correctly and returns the expected
  `401`/"not configured" response: **NOT PROVEN — preview runtime is
  SSO-gated.**
- Whether the registered Vercel Cron actually fires and invokes the
  deployed function on schedule: **NOT PROVEN — preview runtime is
  SSO-gated**, and separately, a short-lived preview deployment's
  lifetime doesn't meaningfully exercise a daily cron schedule regardless.
- Whether Vercel's separately-compiled `api/product-review-sync` function
  in Test B behaves identically at runtime to the production one:
  **NOT PROVEN — preview runtime is SSO-gated.**

A successful build, a clean `.vercel/output` artifact tree, and a `READY`
deployment state are **build-time and deployment-time evidence only**.
They are not being represented as runtime proof anywhere in this document.

---

## 5. `scripts/prerender.ts` — inspected, behavior summarized

This script was read during Phase 1's audit and its real-world timing was
directly observed during Phase 2's Test A/B builds; it is directly
relevant to the migration decision and is not a peripheral detail.

- Build-time, headless-Chromium script (`@sparticuz/chromium` +
  `puppeteer-core`), run as the **last** step of `npm run build`, after
  `vite build`.
- Crawls a bounded route list: hardcoded `STATIC_ROUTES` + slugs
  regex-scraped from static data files (reviews, comparisons, spotlight,
  podcast, FAQ) + live Supabase-fetched slugs (`news_articles_public` for
  briefings, `ingredients`) — capped at `MAX_ROUTES = 1000`.
- 20s per-route timeout; waits a flat 1400ms after `domcontentloaded`
  before capturing `page.content()`.
- Writes real static HTML to `dist/<route>/index.html` (or
  `dist/index.html` for `/`) per route — this is what makes prerendered
  routes get served directly by Vercel's static file resolution, ahead of
  the SPA-fallback rewrite.
- **Fails soft**: per-route (`console.warn`, continues) and overall
  (`main().catch(...) → process.exit(0)`) — a broken prerender never fails
  the Vercel build.
- **Empirically confirmed this phase**: this single step accounts for the
  large majority of the real production build's total time. Test B's
  build log: `prerender: 326 routes to render` at `18:08:38` →
  `prerender: done — 326 rendered, 0 skipped` at `18:20:39` — **~12
  minutes**, out of a ~13-minute total build. A separately-checked
  known-good production deployment's full build log showed `Build
  Completed in /vercel/output [16m]`, consistent with this step
  dominating build time generally, not just in this test.
- **Relevance to the migration decision**: this is a real, working, if
  slow, crawlability mechanism already in production today. Any SSR
  migration must explicitly decide to preserve it (for content not yet
  migrated to TanStack Start), replace it (with TanStack Start's own SSR,
  for migrated routes), or budget for its cost in CI/deploy time — it is
  not something a migration can silently ignore or assume away, and its
  ~12-16 minute cost is a real constraint on iteration speed during any
  incremental route-by-route migration.

---

## Nitro dependency findings (recap, established before this phase's builds)

- `@tanstack/react-start@1.168.53` and `@tanstack/start-plugin-core` have
  **zero** dependency on `nitro`/`nitropack` in their own published
  `dependencies` — confirmed by downloading and grepping their published
  source. Nitro v3-beta is not architecturally required by TanStack
  Start's core.
- It **is** specifically what the official scaffold's Vercel deployment
  add-on wires in (`import { nitro } from 'nitro/vite'`), matching
  Vercel's own official docs for TanStack Start.
- A stable alternative exists: `@tanstack/nitro-v2-vite-plugin@1.155.2`
  (wraps real stable `nitropack@2.13.4`) — but its own readme says
  "Experimental," and **this phase's Test C proved it is not viable**:
  it auto-discovers `api/product-review-sync.ts` (unlike Nitro v3, which
  never scans the repo's `api/` folder at all) but invokes it with an
  incompatible calling convention, causing a real, reproduced crash on
  every request. This is a **decisive NO-GO** for the Nitro v2 override
  specifically, separate from and in addition to the previously-known
  `TanStack/ai#505` `h3`/`h3-v2` collision bug (which never got exercised
  in this test, since the crash happens first, unconditionally).
- Nitro v3 has been in beta ~2 years, with release cadence recently
  slowing (a ~3-month gap between the June 2026 and September 2026 beta
  releases) and no committed GA date.

---

## Exact dependency versions used

| Package | Version | Role |
|---|---|---|
| `@tanstack/react-start` | 1.168.53 | Core (Test A/B/C) |
| `@tanstack/react-router` | 1.170.36 | Core (Test A/B/C) |
| `nitro` | 3.0.260610-beta | Vercel deploy target (Test A/B) |
| `@tanstack/nitro-v2-vite-plugin` | 1.155.2 | Stable-Nitro override (Test C — NO-GO) |
| `nitropack` (via the v2 shim) | 2.13.4 | — |
| `vite` | ^7.2.7 (unchanged) | Root app's existing version — sufficient |
| `typescript` | ^5.8.3 (unchanged) | Root app's existing version — sufficient |
| `@supabase/supabase-js` | ^2.87.1 (unchanged) | Root app's existing version — sufficient |
| Node.js | >=22.12.0 required | Satisfied by this env (22.22.2) and Vercel (`nodejs24.x`) |

## Exact files changed

- `package.json` / `package-lock.json` — added `@tanstack/react-start`,
  `@tanstack/react-router`, `nitro` (dependencies);
  `@tanstack/nitro-v2-vite-plugin` (devDependency, Test C only); new
  script `build:tanstack-start-test`.
- `.gitignore` — added `.output/`, `.nitro/`, `src/routeTree.gen.ts`
  (build artifacts).
- New: `nitro.config.ts` — `renderer: false` (load-bearing fix, §4).
- New: `tsr.config.json` — route-tree codegen config.
- New: `vite.tanstack-start.config.ts` — Test A/B build config (Nitro v3).
- New: `vite.tanstack-start-nitro-v2.config.ts` — Test C build config
  (Nitro v2 override, kept as an inert, documented-failure reference).
- New: `src/router.tsx`, `src/routes/__root.tsx`,
  `src/routes/tanstack-start-test.tsx` — the additive SSR route tree.
- `vercel.json` — `buildCommand` was temporarily changed to a two-step
  build for Test B's duration only, then **reverted** to plain
  `npm run build` once evidence was gathered (this repo's history shows
  both the change and the revert as separate commits).
- `api/product-review-sync.ts` — **never modified**; verification target
  only throughout.

## `installCommand` finding (recap)

`--legacy-peer-deps` is still required after adding the TanStack Start
dependencies, but for a pre-existing, unrelated reason
(`react-helmet-async@2.0.5`'s React peer range), reproduced identically on
the pristine pre-TanStack-Start `package.json`. TanStack Start itself adds
no new peer-dependency conflicts.

## Remaining risks

1. Vercel-hosted runtime behavior is entirely unverified live — everything
   in §4's "NOT PROVEN" list needs a real check (either lifting/bypassing
   the account's SSO deployment protection for one test URL, or promoting
   a build to a production-target deployment briefly) before any
   production commitment.
2. Nitro v3 remains beta with no GA date — accepted as a named,
   unresolved risk per the Phase 1 report; this phase did not change that
   status.
3. The cron registration itself (not just its unchanged input config) was
   never directly read back from Vercel — worth a direct API/CLI check
   (`vercel crons ls` or equivalent) before treating cron continuity as
   fully confirmed rather than inferred.
4. Test B's coexistence relies on Vercel's own `api/` auto-detection
   running *after* a custom `buildCommand` — this is currently-observed
   platform behavior, not a documented contract; it should be treated as
   "works today, confirmed once" rather than a guaranteed, permanent
   platform behavior.

## Recommendation

**CONDITIONAL GO**

Build compatibility, Vercel deployment compatibility, and artifact-level
routing compatibility are all proven with real, reproduced evidence — the
core coexistence question this phase set out to answer has a positive
result: TanStack Start (Nitro v3 path) can be built and deployed from the
real repo root, alongside the real `vercel.json` and the real
`api/product-review-sync.ts`, in one Vercel deployment, without visible
route collisions or config loss.

The condition: before any route migration begins, close the runtime-proof
gap explicitly labeled in §4 — verify live, Vercel-hosted request handling
for both the SSR route and the `api/` cron function (not just their
presence in build output) — and treat Nitro v3's continued beta status as
an accepted, named risk requiring an explicit human decision, not a
default. The Nitro v2 override is a closed question: **NO-GO**, decisively
proven unviable for this repo's `api/` function.
