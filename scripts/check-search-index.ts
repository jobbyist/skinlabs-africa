/**
 * Keeps src/lib/search-index.ts (the "Pages" group in SiteSearch, the site's Cmd/Ctrl+K
 * command palette) honest against the actual routes declared in src/App.tsx.
 *
 * Run via `bun run search-index:check` — wired into `npm run build` and `npm run lint`
 * so a new page added to App.tsx without a matching search-index entry fails the build,
 * and a stale entry (pointing at a route that no longer exists, or now just redirects)
 * is flagged as a warning. This is the guardrail for the "search scope should auto-update
 * with the codebase" requirement on routes that carry no other structured data source —
 * product reviews, comparisons, podcast episodes, spotlight brands, seasonal hubs and
 * newsroom briefings are already indexed live from their own data files/hooks and need
 * no entry here.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const appSource = readFileSync(resolve(repoRoot, "src/App.tsx"), "utf8");
const searchIndexSource = readFileSync(resolve(repoRoot, "src/lib/search-index.ts"), "utf8");

/** Routes intentionally left out of search-index.ts: internal/auth-gated pages, the
 *  catch-all, and specific instances already surfaced by a dedicated SiteSearch group. */
const KNOWN_EXCLUSIONS = new Set(["/admin", "/dashboard", "*", "/seasonals/spring"]);

interface RouteEntry {
  path: string;
  component: string;
}

const routeRegex = /<Route\s+path="([^"]+)"\s+element=\{<(\w+)[^}]*\/>\}\s*\/>/gs;
const routes: RouteEntry[] = [];
for (const match of appSource.matchAll(routeRegex)) {
  routes.push({ path: match[1], component: match[2] });
}

if (routes.length === 0) {
  console.error("check-search-index: found zero <Route> declarations in src/App.tsx — regex likely out of date or file format changed.");
  console.error("Please verify that src/App.tsx contains <Route> declarations in the expected format.");
  process.exit(1);
}

const contentRoutes = routes.filter(
  (r) => r.component !== "Navigate" && !r.path.includes(":") && !KNOWN_EXCLUSIONS.has(r.path),
);

const indexedHrefRegex = /href:\s*"([^"]+)"/g;
const indexedHrefs = new Set(Array.from(searchIndexSource.matchAll(indexedHrefRegex), (m) => m[1]));

const missing = contentRoutes.filter((r) => !indexedHrefs.has(r.path));
const routePaths = new Set(routes.map((r) => r.path));
const stale = Array.from(indexedHrefs).filter((href) => !routePaths.has(href));

if (stale.length > 0) {
  console.warn(
    `check-search-index: ${stale.length} searchablePages entr${stale.length === 1 ? "y" : "ies"} in src/lib/search-index.ts no longer match a route in App.tsx (safe to remove or update):\n` +
      stale.map((h) => `  - ${h}`).join("\n"),
  );
}

if (missing.length > 0) {
  console.error(
    `check-search-index: ${missing.length} content route${missing.length === 1 ? "" : "s"} in src/App.tsx ${missing.length === 1 ? "has" : "have"} no entry in src/lib/search-index.ts, so it won't be findable via site search:\n` +
      missing.map((r) => `  - ${r.path} (${r.component})`).join("\n") +
      "\n\nAdd an entry to searchablePages, or if this route is covered elsewhere (a dedicated SiteSearch group, or intentionally not searchable), add it to KNOWN_EXCLUSIONS in scripts/check-search-index.ts.",
  );
  process.exit(1);
}

console.log(`check-search-index: OK — ${contentRoutes.length} content routes all present in search-index.ts.`);
