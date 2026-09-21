/**
 * Build-time prerendering for SEO, social unfurling and crawler accessibility.
 * Routes are enumerated from static pages plus every current programmatic/content slug.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { preview } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const PORT = 4488;
const PER_ROUTE_TIMEOUT_MS = 20_000;
const MAX_ROUTES = 1000;
/** Hard ceiling on browser launch. Confirmed live (2026-09-21): a hung
 *  puppeteer.launch() in this build environment can block indefinitely with
 *  zero log output, silently stalling the entire production deploy -- three
 *  consecutive builds stalled here or in the per-route loop below with no
 *  error, no timeout, and no way to detect it short of external wall-clock
 *  monitoring against the Vercel API. This gives it 30s then fails loudly,
 *  which the outer main().catch() below converts into the same graceful
 *  "ship without prerendering" degrade path a normal error already takes. */
const BROWSER_LAUNCH_TIMEOUT_MS = 30_000;
/** Absolute ceiling on the whole per-route render loop. A healthy full run
 *  of ~115 routes completes in a few minutes; page.content()/page.close()
 *  have no timeout of their own (only page.goto() does, via
 *  PER_ROUTE_TIMEOUT_MS), so a hang in either of those -- or in the browser
 *  process itself -- previously had nothing to bound it. Exiting here lets
 *  the build continue with whatever was rendered so far; the rest simply
 *  fall back to client-side rendering, same as any other route this script
 *  fails on. */
const GLOBAL_WATCHDOG_MS = 8 * 60 * 1000;

/** Races a promise against a deadline. Rejects with a clear, labelled error
 *  if `ms` elapses first; the original promise is left to settle on its own
 *  in the background (harmless here since the whole process exits shortly
 *  after any watchdog rejection propagates to main().catch() below). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

const STATIC_ROUTES = [
  "/about",
  "/pricing",
  "/contact",
  "/business",
  "/partners",
  "/brand-ambassadors",
  "/skynn-ai",
  "/knowledge-hub",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/shop",
  "/podcast",
  "/briefings",
  "/reviews",
  "/compare",
  "/consultations",
  "/consult",
  "/announcements",
  "/spotlight",
  "/spotlight/methodology",
  "/spotlight/archive",
  "/seasonals",
  "/seasonals/spring",
  "/seasonals/summer",
  "/seasonals/autumn",
  "/seasonals/winter",
  "/ingredients",
  "/ingredients/checker",
];

const extractQuoted = (source: string, field: string): string[] => {
  const pattern = new RegExp(`\\n\\s*${field}:\\s*"([a-z0-9-]+)"`, "g");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) values.push(match[1]);
  return values;
};

async function collectRoutes(): Promise<string[]> {
  const routes = new Set<string>(["/", ...STATIC_ROUTES]);
  const addDataSlugs = (file: string, field: string, prefix: string) => {
    const source = readFileSync(resolve(root, file), "utf-8");
    for (const slug of extractQuoted(source, field)) routes.add(`${prefix}/${slug}`);
  };

  // /reviews/:slug, /ingredients/:slug and /spotlight/:brandSlug are NOT
  // crawled here -- each is SSR-migrated (src/routes/reviews.$slug.tsx,
  // ingredients.$slug.tsx, spotlight.$slug.tsx). Ingredients/Spotlight
  // specifically must NOT be prerendered: their SSR routes are spliced in
  // *after* the {handle:"filesystem"} phase in scripts/
  // assemble-vercel-output.ts (SSR_ROUTE_CONTENT_TYPES_POST_FILESYSTEM),
  // precisely so the filesystem phase's real-file check is what protects
  // their single-segment static siblings (/ingredients/checker,
  // /spotlight/methodology, /spotlight/archive) from being swallowed by
  // the SSR slug pattern -- a stale prerendered file at a real slug's own
  // path would win that same filesystem check ahead of the live SSR
  // route, silently defeating the migration. Reviews/Briefings are the
  // opposite case (SSR spliced in *before* filesystem, since their
  // non-slug siblings live under a different prefix entirely and can't
  // collide) and still shouldn't be prerendered either, since a stale file
  // there would only ever be dead, unreachable output. /reviews/versus/:slug
  // (comparisons) and /reviews/page/:page are untouched -- neither is
  // SSR-migrated. See docs/architecture/tanstack-start-production-migration.md
  // and tanstack-start-ingredients-spotlight-ssr.md.
  addDataSlugs("src/data/comparisons.ts", "slug", "/reviews/versus");
  addDataSlugs("src/data/podcast.ts", "slug", "/podcast");
  addDataSlugs("src/data/faq.ts", "slug", "/knowledge-hub");

  return [...routes].slice(0, MAX_ROUTES);
}

function outputPathFor(route: string): string {
  if (route === "/") return join(distDir, "index.html");
  return join(distDir, route.replace(/^\//, ""), "index.html");
}

async function main() {
  const routes = await collectRoutes();
  console.log(`prerender: ${routes.length} routes to render`);
  const server = await preview({ root, preview: { port: PORT, strictPort: true, host: "127.0.0.1" } });
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;
  const browser = await withTimeout(
    puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true }),
    BROWSER_LAUNCH_TIMEOUT_MS,
    "browser launch",
  );
  let ok = 0;
  let failed = 0;

  // Global watchdog: fires if the per-route loop below is still running past
  // GLOBAL_WATCHDOG_MS, regardless of which route or browser call it's stuck
  // in. Cleared in the `finally` block on a normal (successful or per-route-
  // failure) completion, so it never fires on a healthy run.
  const watchdog = setTimeout(() => {
    console.warn(
      `prerender: global watchdog (${GLOBAL_WATCHDOG_MS}ms) exceeded -- exiting so the build doesn't hang ` +
        `indefinitely. ${ok} route(s) already rendered stay written; the rest fall back to client-side rendering.`,
    );
    process.exit(0);
  }, GLOBAL_WATCHDOG_MS);

  try {
    for (const route of routes) {
      const page = await withTimeout(browser.newPage(), PER_ROUTE_TIMEOUT_MS, `newPage(${route})`);
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: PER_ROUTE_TIMEOUT_MS });
        await new Promise((r) => setTimeout(r, 1400));
        const html = await withTimeout(page.content(), PER_ROUTE_TIMEOUT_MS, `content(${route})`);
        const outPath = outputPathFor(route);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html, "utf-8");
        ok += 1;
      } catch (err) {
        failed += 1;
        console.warn(`prerender: failed on ${route}:`, err instanceof Error ? err.message : err);
      } finally {
        await withTimeout(page.close(), 5_000, `page.close(${route})`).catch(() => {
          // Best-effort cleanup only -- a stuck close() must never block the next route.
        });
      }
    }
  } finally {
    clearTimeout(watchdog);
    await browser.close();
    await new Promise<void>((res, rej) => server.httpServer.close((err) => (err ? rej(err) : res())));
  }
  console.log(`prerender: done — ${ok} rendered, ${failed} skipped`);
}

main().catch((err) => {
  console.warn("prerender: skipped entirely due to an unexpected error:", err);
  process.exit(0);
});
