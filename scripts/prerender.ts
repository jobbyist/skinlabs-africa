/**
 * Build-time prerendering for SEO, social unfurling and crawler accessibility.
 * Routes are enumerated from static pages plus every current programmatic/content slug.
 */
import { createClient } from "@supabase/supabase-js";
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

  // /reviews/:slug is NOT crawled here anymore, for either data source --
  // it's SSR-migrated (src/routes/reviews.$slug.tsx) and takes routing
  // priority over any static file at that path (see scripts/
  // assemble-vercel-output.ts's SSR_ROUTE_PATTERNS, ordered before the
  // filesystem phase). This closes a real, previously documented gap: the
  // static productReviews catalogue used to get prerendered here, but
  // AI-generated reviews (ai_generated_product_reviews) never did --
  // SSR now covers both uniformly. /reviews/versus/:slug (comparisons) and
  // /reviews/page/:page are untouched -- neither is SSR-migrated, and
  // SSR_ROUTE_PATTERNS' single-segment pattern can't collide with either.
  // See docs/architecture/tanstack-start-production-migration.md.
  addDataSlugs("src/data/comparisons.ts", "slug", "/reviews/versus");
  addDataSlugs("src/data/spotlight.ts", "slug", "/spotlight");
  addDataSlugs("src/data/podcast.ts", "slug", "/podcast");
  addDataSlugs("src/data/faq.ts", "slug", "/knowledge-hub");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // /briefings/:slug is NOT crawled here anymore -- it's SSR-migrated
    // (src/routes/briefings.$slug.tsx) and takes routing priority over any
    // static file at that path (see scripts/assemble-vercel-output.ts's
    // SSR_ROUTE_PATTERNS, ordered before the filesystem phase), so
    // prerendering it would be both wasted Chromium time and dead output.
    // The /briefings list page itself is still a plain SPA route, unaffected
    // and still covered by STATIC_ROUTES above. See
    // docs/architecture/tanstack-start-production-migration.md.
    try {
      const { data } = await supabase
        .from("ingredients")
        .select("slug")
        .neq("verification_status", "deprecated");
      for (const row of data ?? []) if (typeof row.slug === "string") routes.add(`/ingredients/${row.slug}`);
    } catch (err) {
      console.warn("prerender: could not fetch ingredient slugs:", err);
    }
  }
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
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  let ok = 0;
  let failed = 0;

  try {
    for (const route of routes) {
      const page = await browser.newPage();
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: PER_ROUTE_TIMEOUT_MS });
        await new Promise((r) => setTimeout(r, 1400));
        const html = await page.content();
        const outPath = outputPathFor(route);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, html, "utf-8");
        ok += 1;
      } catch (err) {
        failed += 1;
        console.warn(`prerender: failed on ${route}:`, err instanceof Error ? err.message : err);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await new Promise<void>((res, rej) => server.httpServer.close((err) => (err ? rej(err) : res())));
  }
  console.log(`prerender: done — ${ok} rendered, ${failed} skipped`);
}

main().catch((err) => {
  console.warn("prerender: skipped entirely due to an unexpected error:", err);
  process.exit(0);
});
