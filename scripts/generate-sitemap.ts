/**
 * Build-time sitemap generator. The sitemap is derived from canonical,
 * indexable routes plus every published/programmatic content record.
 * Supports dynamic Unsplash image URLs via environment configuration.
 *
 * This is now the FALLBACK path only: it writes the static public/sitemap.xml
 * baked into each deployment's build output. The live production sitemap is
 * served by src/routes/sitemap[.]xml.ts, a TanStack Start SSR route that
 * queries Supabase on every request — so newly published briefings/reviews
 * (which land via the daily Supabase-cron content pipelines, not a Vercel
 * build) show up immediately rather than waiting for the next deploy. This
 * script's output only matters if that SSR function is ever unavailable
 * (see scripts/assemble-vercel-output.ts's ssrAvailable fallback) or for a
 * local `vite build` preview without Nitro.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { STATIC_SITEMAP_ROUTES } from "../src/lib/sitemap/staticRoutes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://skinlabs.co.za";

const urlEntry = (loc: string, lastmod: string, changefreq: string, priority: string) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const extractQuoted = (source: string, field: string): string[] => {
  const pattern = new RegExp(`\\n\\s*${field}:\\s*"([a-z0-9-]+)"`, "g");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) values.push(match[1]);
  return values;
};

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (path: string, changefreq: string, priority: string, lastmod = today) => {
    const clean = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;
    if (seen.has(clean)) return;
    seen.add(clean);
    urls.push(urlEntry(`${SITE}${clean}`, lastmod, changefreq, priority));
  };

  for (const route of STATIC_SITEMAP_ROUTES) add(route.path, route.changefreq, route.priority);

  const reviewsSource = readFileSync(resolve(root, "src/data/reviews.ts"), "utf-8");
  for (const id of extractQuoted(reviewsSource, "id")) add(`/reviews/${id}`, "monthly", "0.75");

  const comparisonsSource = readFileSync(resolve(root, "src/data/comparisons.ts"), "utf-8");
  for (const slug of extractQuoted(comparisonsSource, "slug")) add(`/reviews/versus/${slug}`, "monthly", "0.8");

  const spotlightSource = readFileSync(resolve(root, "src/data/spotlight.ts"), "utf-8");
  for (const slug of extractQuoted(spotlightSource, "slug")) add(`/spotlight/${slug}`, "monthly", "0.75");

  // Only published episodes -- extractQuoted's blind field scan would
  // otherwise sitemap the current comingSoon episode too (empty
  // publishedAt, no real showNotes/transcript yet), indexing an
  // unfinished page. Split on comingSoon: true to exclude any episode
  // object containing that flag, rather than assuming episode count/order.
  const podcastSource = readFileSync(resolve(root, "src/data/podcast.ts"), "utf-8");
  const podcastEpisodeBlocks = podcastSource.split(/(?=\n\s*\{\s*\n\s*id:)/);
  for (const block of podcastEpisodeBlocks) {
    if (/comingSoon:\s*true/.test(block)) continue;
    for (const slug of extractQuoted(block, "slug")) add(`/podcast/${slug}`, "monthly", "0.7");
  }

  // /marketplace/concern/:slug intentionally not added here — every
  // /marketplace/* route is wrapped in <MarketplaceGate> (a real login-cookie
  // check via /api/marketplace-auth), so an unauthenticated crawl only ever
  // reaches a locked screen. See the removal note in
  // src/lib/sitemap/staticRoutes.ts for the full reasoning.

  // Every deep-linked Knowledge Hub answer is a real canonical URL and should
  // be discoverable independently, not only through the accordion hub page.
  const faqSource = readFileSync(resolve(root, "src/data/faq.ts"), "utf-8");
  for (const slug of extractQuoted(faqSource, "slug")) add(`/knowledge-hub/${slug}`, "monthly", "0.7");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("news_articles_public")
      .select("slug, publish_date")
      .order("publish_date", { ascending: false });
    if (error) {
      console.warn("generate-sitemap: could not fetch published briefings:", error.message);
    } else {
      for (const article of data ?? []) {
        if (typeof article.slug === "string") {
          add(`/briefings/${article.slug}`, "weekly", "0.85", article.publish_date?.slice(0, 10) || today);
        }
      }
    }

    // marketplace_products/marketplace_brands intentionally not queried here
    // — see the removal note above and in src/lib/sitemap/staticRoutes.ts.

    const { data: ingredientRows, error: ingredientsError } = await supabase
      .from("ingredients")
      .select("slug")
      .neq("verification_status", "deprecated");
    if (ingredientsError) {
      console.warn("generate-sitemap: could not fetch ingredient slugs:", ingredientsError.message);
    } else {
      for (const ingredient of ingredientRows ?? []) {
        if (typeof ingredient.slug === "string") add(`/ingredients/${ingredient.slug}`, "monthly", "0.6");
      }
    }

    const { data: generatedReviews, error: generatedReviewsError } = await supabase
      .from("ai_generated_product_reviews")
      .select("id, published_date");
    if (generatedReviewsError) {
      console.warn("generate-sitemap: could not fetch generated product reviews:", generatedReviewsError.message);
    } else {
      for (const review of generatedReviews ?? []) {
        if (typeof review.id === "string") {
          add(`/reviews/${review.id}`, "monthly", "0.75", review.published_date?.slice(0, 10) || today);
        }
      }
    }
  } else {
    console.warn("generate-sitemap: Supabase env vars unavailable — dynamic briefings/marketplace/reviews omitted");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync(resolve(root, "public/sitemap.xml"), xml, "utf-8");
  console.log(`generate-sitemap: wrote ${urls.length} canonical URLs to public/sitemap.xml`);
}

main().catch((error) => {
  console.error("generate-sitemap failed:", error);
  process.exit(1);
});
