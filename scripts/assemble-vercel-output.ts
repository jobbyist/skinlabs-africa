/**
 * Assembles the final `.vercel/output/` deployed by `npm run build`, merging two
 * independent build steps that must both run first:
 *
 *   1. The real SPA build (`vite build` + `npm run prerender`) -> `dist/`.
 *      This is the production app: ~70 react-router-dom routes, every
 *      prerendered per-route `index.html`, every optimized `public/` asset.
 *   2. The TanStack Start / Nitro build (`npm run build:tanstack-start`,
 *      `NITRO_PRESET=vercel`) -> `.vercel/output/`. This is the SSR server
 *      function for the (currently small, growing) set of migrated routes.
 *
 * Why this script exists: Nitro's own `vercel` preset is a wholesale Build
 * Output API writer (confirmed by direct source inspection in
 * docs/architecture/tanstack-start-repo-root-coexistence-test.md) -- it has
 * no awareness of `dist/` and never merges with it. Left alone, step 2's
 * `.vercel/output/static/` contains only Nitro's own route-specific JS
 * chunks plus a *raw, uncompressed* copy of `public/` -- the real SPA
 * (`dist/index.html`, the real hashed app bundle, all prerendered routes)
 * is entirely absent, and `.vercel/output/config.json`'s catch-all sends
 * every unmatched path to the SSR function, which only knows about the
 * migrated routes. Deployed as-is, this would 404/break every route except
 * the ones actually migrated to TanStack Start. This script fixes that by
 * discarding Nitro's own static/ output (dist/ is the authoritative,
 * already-optimized version of the same public/ files) except for the
 * genuinely new, Nitro-specific asset chunks, then rebuilding config.json
 * from vercel.json's own headers/redirects (single source of truth) plus
 * explicit routing for the migrated SSR paths. Crons are deliberately NOT
 * duplicated into config.json -- Vercel's platform reads those straight off
 * the project's git-connected vercel.json regardless, and generating them
 * here too fails the deployment with "duplicated_cron_job" (confirmed on
 * real infrastructure, see buildConfigJson()).
 */
import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { getTransformedRoutes } from "@vercel/routing-utils";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const distDir = resolve(root, "dist");
const outputDir = resolve(root, ".vercel/output");
const staticDir = resolve(outputDir, "static");
const functionsDir = resolve(outputDir, "functions");
const serverFuncDir = resolve(functionsDir, "__server.func");
const vercelJsonPath = resolve(root, "vercel.json");

/**
 * Content types whose TanStack Start slug route renders server-side today.
 * `prefix` + a bare `([^/]+)$` single-segment match becomes a Build Output
 * API route sending matching requests to the Nitro `__server` function.
 * Matching exactly one path segment (anchored with $) means it can never
 * capture a route with additional segments -- confirmed this does not
 * collide with /reviews/versus/:slug (2 segments after /reviews/) or
 * /reviews/page/:page (2 segments).
 *
 * Split into two groups by where they're spliced relative to the
 * `{handle:"filesystem"}` phase `getTransformedRoutes()` already emits:
 *
 * - `PRE_FILESYSTEM`: spliced in *before* filesystem, so a stale
 *   prerendered file at the same path can never shadow a live SSR
 *   response. Safe for Briefings/Reviews because their non-slug siblings
 *   live under a completely different prefix (e.g. /briefings vs.
 *   /briefings/:slug) -- there's nothing for the bare slug pattern to
 *   wrongly swallow.
 * - `POST_FILESYSTEM`: spliced in *after* filesystem instead. Ingredients
 *   and Spotlight each have a single-segment sibling *static* route under
 *   the exact same prefix as their slug pattern (/ingredients/checker vs.
 *   /ingredients/:slug; /spotlight/methodology and /spotlight/archive vs.
 *   /spotlight/:brandSlug -- see src/App.tsx), so a bare
 *   `^/prefix/([^/]+)$` placed before filesystem would swallow them into
 *   the SSR route (a false ingredient/brand-slug 404) -- confirmed live on
 *   a real deployment, not just reasoned about: an earlier version of this
 *   file tried excluding each sibling with its own `continue: true` route
 *   spliced immediately before the general pattern, but `continue: true`
 *   only advances to the *next* route in the array, which was that very
 *   general pattern -- so it matched again immediately and the exclusion
 *   was a no-op (confirmed by `/ingredients/checker` and
 *   `/spotlight/methodology` both 404ing on a live preview deployment). A
 *   negative-lookahead regex would also work but Vercel's production
 *   routing layer is not confirmed to run a lookahead-capable engine (some
 *   platforms use a linear-time engine, e.g. Rust's `regex` crate or RE2,
 *   which reject lookaround entirely) -- not worth risking on production
 *   routing. Placing these content types' SSR routes *after* filesystem
 *   instead needs no exclusion list at all: the filesystem phase's own
 *   real-file check is the correct mechanism, already proven reliable
 *   (it's the same primitive the site-wide catch-all already relies on).
 *   This *requires* scripts/prerender.ts to no longer crawl these two
 *   content types' real `:slug` pages (otherwise their stale prerendered
 *   files would win the filesystem-phase check ahead of the live SSR
 *   route, defeating the point of migrating them) -- see prerender.ts's
 *   own comment on this same requirement.
 */
const SSR_ROUTE_CONTENT_TYPES_PRE_FILESYSTEM = ["/briefings/", "/reviews/"];
const SSR_ROUTE_CONTENT_TYPES_POST_FILESYSTEM = ["/ingredients/", "/spotlight/"];

function assertExists(path: string, what: string) {
  if (!existsSync(path)) {
    throw new Error(
      `assemble-vercel-output: expected ${what} at ${path} but it does not exist. ` +
        `Did the SPA build (vite build / prerender) run first?`,
    );
  }
}

function walk(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(full.slice(base.length + 1));
  }
  return out;
}

type BoapiRoute = Record<string, unknown>;

/**
 * Builds config.json's `routes` from vercel.json's own high-level
 * headers/redirects/trailingSlash (single source of truth) using
 * `@vercel/routing-utils`'s `getTransformedRoutes()` -- the same official
 * transform Vercel's own zero-config framework builders use internally
 * (confirmed by reading its source), rather than a hand-rolled regex
 * converter.
 *
 * The SPA fallback itself is NOT derived from vercel.json's `rewrites`
 * (that field has been removed) and does NOT use the documented
 * `{handle:"filesystem"}` + `{dest:"/index.html", check:true}` static-
 * rewrite pattern. That pattern was tried three times on real Vercel
 * infrastructure this phase -- first with a hand-rolled transform, then
 * with getTransformedRoutes()'s own official output (confirmed byte-for-
 * byte identical to the documented shape), then with a `framework` field
 * added to config.json -- and in every case /dashboard, /reviews/page/2,
 * and every other non-prerendered, non-SSR-migrated path still returned
 * Vercel's platform-level NOT_FOUND instead of falling through to serve
 * the real SPA. Root cause unresolved (see docs/architecture/
 * tanstack-start-production-migration.md); `check: true` static rewrites
 * simply do not behave as documented in this project's real deployment
 * context, so this script no longer relies on them at all.
 *
 * The fallback instead routes to `/__server` -- the exact same
 * function-based mechanism already proven reliable, on real Vercel
 * infrastructure, for every SSR_ROUTE_CONTENT_TYPES_PRE_FILESYSTEM/
 * _POST_FILESYSTEM entry above. src/routes/
 * $.ts is a TanStack Start splat/catch-all server route that responds
 * with the real dist/index.html verbatim, letting the client-side SPA
 * boot exactly as a static-file fallback would have. Only available when
 * ssrAvailable -- see the static-only branch below for the degraded case.
 */
function buildConfigJson(ssrAvailable: boolean): { version: 3; routes: BoapiRoute[] } {
  const vercelJson = JSON.parse(readFileSync(vercelJsonPath, "utf-8"));
  // `rewrites: []` (not omitted) is deliberate: getTransformedRoutes() only
  // emits the {handle:"filesystem"} phase marker inside its own
  // `if (typeof rewrites !== "undefined")` branch (confirmed by reading its
  // source, node_modules/@vercel/routing-utils/dist/index.js) -- omitting
  // the key entirely (as this script did briefly while removing the broken
  // check:true rewrite) skips that marker altogether and crashes the
  // `filesystemIndex === -1` guard below. An empty array still satisfies
  // that check and contributes zero actual rewrite rules.
  const { routes: baseRoutes, error } = getTransformedRoutes({
    trailingSlash: vercelJson.trailingSlash,
    redirects: vercelJson.redirects,
    headers: vercelJson.headers,
    rewrites: [],
  });
  if (error || !baseRoutes) {
    throw new Error(`assemble-vercel-output: getTransformedRoutes failed on vercel.json: ${JSON.stringify(error)}`);
  }

  // Splice the pre-filesystem SSR routes in just before the
  // `handle: filesystem` phase getTransformedRoutes() already emits --
  // must precede it (see SSR_ROUTE_CONTENT_TYPES_PRE_FILESYSTEM comment
  // above) and follow the redirect/header rules (also already correctly
  // ordered by getTransformedRoutes()). The post-filesystem SSR routes go
  // immediately after that same marker instead. Both skipped entirely
  // when the Nitro build didn't produce a usable function -- those paths
  // then fall through to whatever static/prerendered file
  // scripts/prerender.ts already produced for them (today's behavior),
  // rather than routing to a function that doesn't exist.
  const filesystemIndex = baseRoutes.findIndex((r) => "handle" in r && r.handle === "filesystem");
  if (filesystemIndex === -1) {
    throw new Error("assemble-vercel-output: getTransformedRoutes() did not emit a filesystem handle phase as expected.");
  }
  const toSsrRoutes = (prefixes: string[]): BoapiRoute[] =>
    ssrAvailable ? prefixes.map((prefix): BoapiRoute => ({ src: `^${prefix}([^/]+)$`, dest: "/__server" })) : [];
  const preFilesystemSsrRoutes = toSsrRoutes(SSR_ROUTE_CONTENT_TYPES_PRE_FILESYSTEM);
  const postFilesystemSsrRoutes = toSsrRoutes(SSR_ROUTE_CONTENT_TYPES_POST_FILESYSTEM);

  // Final catch-all, placed AFTER the filesystem phase (and the
  // post-filesystem SSR routes) so a real static file (a prerendered page,
  // a real asset) always wins first. ssrAvailable routes it to the SSR
  // function (see comment above); the ssrAvailable:false branch has no
  // function to route to, so it falls back to the still-unproven-working
  // check:true static rewrite as a last resort -- a known, documented
  // limitation of that degraded path, not a claim that it's confirmed
  // fixed there too.
  const fallbackRoute: BoapiRoute = ssrAvailable
    ? { src: "/(.*)", dest: "/__server" }
    : { src: "/(.*)", dest: "/index.html", check: true };
  const routes: BoapiRoute[] = [
    ...baseRoutes.slice(0, filesystemIndex),
    ...preFilesystemSsrRoutes,
    baseRoutes[filesystemIndex],
    ...postFilesystemSsrRoutes,
    ...baseRoutes.slice(filesystemIndex + 1),
    fallbackRoute,
  ];

  // Deliberately NOT duplicating vercel.json's `crons` into config.json here.
  // Confirmed on real Vercel infrastructure (not just inferred from docs):
  // the platform reads crons from the project's git-connected vercel.json
  // even when a custom buildCommand supplies .vercel/output, and doing both
  // fails the deployment outright with errorCode "duplicated_cron_job" ("A
  // duplicated cron job with the same schedule and path was found") --
  // vercel.json stays the sole source of truth for crons; nothing extra is
  // needed here.
  return { version: 3, routes };
}

function main() {
  assertExists(distDir, "the SPA build output");

  // The Nitro/TanStack Start build (npm run build:tanstack-start) runs
  // before this script but -- like every other non-essential step in
  // npm run build -- is allowed to fail soft. If it did, or if it produced
  // no server function, ship a pure-static deployment (identical to
  // today's production shape) rather than aborting the whole site build
  // over the new, still-narrow SSR feature.
  const ssrAvailable = existsSync(outputDir) && existsSync(serverFuncDir);
  if (!ssrAvailable) {
    console.warn(
      "[assemble-vercel-output] No Nitro server function found (.vercel/output/functions/__server.func) -- " +
        "shipping a static-only deployment. SSR-migrated routes will fall back to their prerendered static files.",
    );
  }

  mkdirSync(outputDir, { recursive: true });

  // Capture Nitro's own asset chunks (genuinely new files, not a copy of
  // public/) before static/ is discarded and rebuilt from dist/.
  const distAssetNames = new Set(existsSync(join(distDir, "assets")) ? readdirSync(join(distDir, "assets")) : []);
  const nitroAssetsDir = join(staticDir, "assets");
  const nitroOnlyAssetFiles = existsSync(nitroAssetsDir)
    ? readdirSync(nitroAssetsDir).filter((f) => !distAssetNames.has(f))
    : [];
  if (ssrAvailable && nitroOnlyAssetFiles.length === 0) {
    throw new Error(
      "assemble-vercel-output: the Nitro build produced a server function but zero SSR-specific asset chunks " +
        "under .vercel/output/static/assets -- the SSR route's client hydration bundle would be missing from " +
        "the final output. Aborting rather than shipping a broken deployment.",
    );
  }
  const stagedNitroAssets = nitroOnlyAssetFiles.map((f) => ({ name: f, path: join(nitroAssetsDir, f) }));
  const stagingDir = resolve(root, ".vercel-output-staging");
  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(stagingDir, { recursive: true });
  for (const { name, path } of stagedNitroAssets) cpSync(path, join(stagingDir, name));

  // Discard Nitro's own static/ output (its raw, uncompressed copy of
  // public/) and replace it wholesale with the real, optimized SPA build.
  rmSync(staticDir, { recursive: true, force: true });
  cpSync(distDir, staticDir, { recursive: true });

  // Re-add the SSR route's own client hydration chunks, if any.
  mkdirSync(join(staticDir, "assets"), { recursive: true });
  for (const { name } of stagedNitroAssets) cpSync(join(stagingDir, name), join(staticDir, "assets", name));
  rmSync(stagingDir, { recursive: true, force: true });

  // If the Nitro build didn't produce a usable function, don't ship a
  // possibly-partial functions/ directory alongside a static-only config.
  if (!ssrAvailable) rmSync(functionsDir, { recursive: true, force: true });

  // Rebuild config.json from vercel.json (single source of truth) plus the
  // explicit SSR routing this migration adds.
  const config = buildConfigJson(ssrAvailable);
  writeFileSync(resolve(outputDir, "config.json"), JSON.stringify(config, null, 2));

  const staticFileCount = walk(staticDir).length;
  console.log(
    `[assemble-vercel-output] static/: ${staticFileCount} files (real SPA build${
      stagedNitroAssets.length > 0 ? ` + ${stagedNitroAssets.length} SSR chunk(s): ${nitroOnlyAssetFiles.join(", ")}` : ""
    })`,
  );
  console.log(
    `[assemble-vercel-output] functions/: ${existsSync(functionsDir) ? readdirSync(functionsDir).join(", ") : "(none -- static-only deployment)"}`,
  );
  console.log(`[assemble-vercel-output] config.json: ${config.routes.length} route rules`);
  console.log(`[assemble-vercel-output] full config.json:\n${JSON.stringify(config, null, 2)}`);
}

main();
