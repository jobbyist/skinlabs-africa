/**
 * Build-time prerendering.
 *
 * This app is a client-rendered SPA (Vite + React Router) fetching most content
 * from Supabase after mount, which means crawlers and social-link unfurlers that
 * don't execute JS — and even the first paint for real visitors — see an empty
 * shell until the client bundle loads and fetches settle. This script runs
 * *after* `vite build`: it serves the built `dist/` with Vite's own preview
 * server, visits every route we can enumerate at build time with a headless
 * Chromium, and writes each fully-rendered DOM out as `dist/<route>/index.html`.
 * Static hosts (Vercel included) resolve a request for `/pricing` to
 * `dist/pricing/index.html` when that file exists, before falling back to the
 * SPA-wide rewrite — so real content and JSON-LD are present with zero client
 * JS, while client-side navigation between routes is completely unaffected
 * (the emitted HTML still boots the same hydrated app).
 *
 * Deliberately best-effort: any failure here (missing browser binary, a slow
 * network call, one bad route) is logged and swallowed so it can never fail
 * the production build. Losing prerendering for a run just means that build's
 * output behaves like the plain SPA shell did before this script existed.
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
const MAX_ROUTES = 300;

const STATIC_ROUTES = [
  "/about",
  "/pricing",
  "/contact",
  "/business",
  "/partners",
  "/ai-formulator",
  "/products",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/shop",
  "/podcast",
  "/newsroom",
  "/reviews",
  "/compare",
  "/consultations",
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

  const reviewsSource = readFileSync(resolve(root, "src/data/reviews.ts"), "utf-8");
  for (const id of extractQuoted(reviewsSource, "id")) routes.add(`/reviews/${id}`);

  const comparisonsSource = readFileSync(resolve(root, "src/data/comparisons.ts"), "utf-8");
  for (const slug of extractQuoted(comparisonsSource, "slug")) routes.add(`/reviews/versus/${slug}`);

  const spotlightSource = readFileSync(resolve(root, "src/data/spotlight.ts"), "utf-8");
  for (const slug of extractQuoted(spotlightSource, "slug")) routes.add(`/spotlight/${slug}`);

  const podcastSource = readFileSync(resolve(root, "src/data/podcast.ts"), "utf-8");
  for (const slug of extractQuoted(podcastSource, "slug")) routes.add(`/podcast/${slug}`);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase.from("news_articles_public").select("slug");
      for (const row of data ?? []) {
        if (typeof row.slug === "string") routes.add(`/newsroom/${row.slug}`);
      }
    } catch (err) {
      console.warn("prerender: could not fetch newsroom slugs, skipping those routes:", err);
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

  const server = await preview({
    root,
    preview: { port: PORT, strictPort: true, host: "127.0.0.1" },
  });
  const baseUrl = `http://127.0.0.1:${PORT}`;

  // Lazily imported: keeps the build script cheap when the prerender step is skipped.
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  let ok = 0;
  let failed = 0;

  try {
    for (const route of routes) {
      const page = await browser.newPage();
      try {
        // domcontentloaded + a fixed settle delay, not networkidle0: AdSense and
        // analytics keep background connections open indefinitely on every page,
        // so networkidle0 would time out on effectively every route.
        await page.goto(`${baseUrl}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: PER_ROUTE_TIMEOUT_MS,
        });
        await new Promise((r) => setTimeout(r, 1200));
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
    await new Promise<void>((res, rej) =>
      server.httpServer.close((err) => (err ? rej(err) : res())),
    );
  }

  console.log(`prerender: done — ${ok} rendered, ${failed} skipped`);
}

main().catch((err) => {
  console.warn("prerender: skipped entirely due to an unexpected error:", err);
  process.exit(0);
});
