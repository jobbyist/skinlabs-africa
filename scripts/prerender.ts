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
  "/skynn-ai",
  "/products",
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

  addDataSlugs("src/data/reviews.ts", "id", "/reviews");
  addDataSlugs("src/data/comparisons.ts", "slug", "/reviews/versus");
  addDataSlugs("src/data/spotlight.ts", "slug", "/spotlight");
  addDataSlugs("src/data/podcast.ts", "slug", "/podcast");
  addDataSlugs("src/data/faq.ts", "slug", "/knowledge-hub");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.from("news_articles_public").select("slug");
      for (const row of data ?? []) if (typeof row.slug === "string") routes.add(`/briefings/${row.slug}`);
    } catch (err) {
      console.warn("prerender: could not fetch briefing slugs:", err);
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
