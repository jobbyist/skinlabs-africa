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
 * from vercel.json's own headers/redirects/crons (single source of truth)
 * plus explicit routing for the migrated SSR paths.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const distDir = resolve(root, "dist");
const outputDir = resolve(root, ".vercel/output");
const staticDir = resolve(outputDir, "static");
const functionsDir = resolve(outputDir, "functions");
const serverFuncDir = resolve(functionsDir, "__server.func");
const vercelJsonPath = resolve(root, "vercel.json");

/**
 * Path patterns of TanStack Start routes that render server-side today.
 * Each entry becomes a Build Output API route sending matching requests to
 * the Nitro `__server` function *before* the filesystem phase, so a
 * previously-prerendered static file at the same path (scripts/prerender.ts
 * still crawls /briefings/:slug as of this commit) never shadows the live
 * SSR response. Extend this array, not the routing logic, as more content
 * types migrate.
 */
const SSR_ROUTE_PATTERNS = ["^/briefings/([^/]+)$"];

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

/**
 * Minimal vercel.json `source` -> Build Output API `src` regex converter.
 * Deliberately narrow: this project's vercel.json only ever uses a literal
 * path or a single `:param` capturing one full segment (no `*`, `+`, or
 * optional-segment syntax). Anything wider throws rather than silently
 * mis-routing -- extend this function first if vercel.json grows a pattern
 * it doesn't cover.
 */
function sourceToRegex(source: string): string {
  if (source === "/(.*)" || source.includes("(.*)")) return `^${source}$`.replace(/\^\^/, "^");
  if (/[*+?]/.test(source) || source.includes("(")) {
    throw new Error(`sourceToRegex: unsupported vercel.json source pattern "${source}" -- extend the converter.`);
  }
  const pattern = source.replace(/:[A-Za-z0-9_]+/g, "([^/]+)");
  return `^${pattern}$`;
}

function destFromDestination(destination: string): string {
  // vercel.json uses the same `:param` placeholders in redirect destinations;
  // Build Output API destinations use positional $1, $2, ... instead.
  let i = 0;
  return destination.replace(/:[A-Za-z0-9_]+/g, () => `$${++i}`);
}

type BoapiRoute = Record<string, unknown>;

function buildConfigJson(ssrAvailable: boolean): {
  version: 3;
  routes: BoapiRoute[];
  crons?: { path: string; schedule: string }[];
} {
  const vercelJson = JSON.parse(readFileSync(vercelJsonPath, "utf-8"));
  const routes: BoapiRoute[] = [];

  // 1. Redirects first (vercel.json's own order), converted 1:1.
  for (const r of vercelJson.redirects ?? []) {
    routes.push({
      src: sourceToRegex(r.source),
      headers: { Location: destFromDestination(r.destination) },
      status: r.permanent ? 308 : 307,
    });
  }

  // 2. Response headers (annotate, don't terminate routing).
  for (const h of vercelJson.headers ?? []) {
    const headerMap: Record<string, string> = {};
    for (const { key, value } of h.headers ?? []) headerMap[key] = value;
    routes.push({ src: sourceToRegex(h.source), headers: headerMap, continue: true });
  }

  // 3. SSR-migrated routes -> the Nitro server function. Must precede the
  //    filesystem phase (see SSR_ROUTE_PATTERNS comment above). Skipped
  //    entirely when the Nitro build didn't produce a usable function --
  //    those paths then fall through to whatever static/prerendered file
  //    scripts/prerender.ts already produced for them (today's behavior),
  //    rather than routing to a function that doesn't exist.
  if (ssrAvailable) {
    for (const pattern of SSR_ROUTE_PATTERNS) routes.push({ src: pattern, dest: "/__server" });
  }

  // 4. Filesystem phase: serve any real static/prerendered file as-is.
  routes.push({ handle: "filesystem" });

  // 5. SPA fallback for every route the SPA's client-side router owns that
  //    wasn't prerendered to a static file (mirrors vercel.json's own
  //    `rewrites: [{source: "/(.*)", destination: "/index.html"}]`).
  routes.push({ src: "/(.*)", dest: "/index.html" });

  const config: { version: 3; routes: BoapiRoute[]; crons?: { path: string; schedule: string }[] } = {
    version: 3,
    routes,
  };
  if (Array.isArray(vercelJson.crons) && vercelJson.crons.length > 0) config.crons = vercelJson.crons;
  return config;
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
  console.log(`[assemble-vercel-output] config.json: ${config.routes.length} route rules${config.crons ? `, ${config.crons.length} cron(s)` : ""}`);
}

main();
