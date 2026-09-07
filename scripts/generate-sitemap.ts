/**
 * Build-time sitemap generator. The sitemap is derived from canonical,
 * indexable routes plus every published/programmatic content record.
 * Supports dynamic Unsplash image URLs via environment configuration.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://skinlabs.co.za";

interface StaticRoute { path: string; changefreq: string; priority: string; }

// Only canonical, indexable destinations belong in the sitemap. Redirects,
// retired commerce routes, dashboards and 404 paths are deliberately excluded.
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/business", changefreq: "monthly", priority: "0.6" },
  { path: "/partners", changefreq: "monthly", priority: "0.8" },
  { path: "/ai-formulator", changefreq: "weekly", priority: "0.95" },
  { path: "/briefings", changefreq: "daily", priority: "0.95" },
  { path: "/reviews", changefreq: "weekly", priority: "0.95" },
  { path: "/compare", changefreq: "weekly", priority: "0.9" },
  { path: "/podcast", changefreq: "weekly", priority: "0.9" },
  { path: "/spotlight", changefreq: "monthly", priority: "0.9" },
  { path: "/spotlight/methodology", changefreq: "monthly", priority: "0.5" },
  { path: "/spotlight/archive", changefreq: "monthly", priority: "0.4" },
  { path: "/seasonals", changefreq: "weekly", priority: "0.9" },
  { path: "/seasonals/spring", changefreq: "weekly", priority: "0.85" },
  { path: "/seasonals/summer", changefreq: "monthly", priority: "0.7" },
  { path: "/seasonals/autumn", changefreq: "monthly", priority: "0.7" },
  { path: "/seasonals/winter", changefreq: "monthly", priority: "0.7" },
  { path: "/consultations", changefreq: "monthly", priority: "0.8" },
  { path: "/consult", changefreq: "weekly", priority: "0.85" },
  { path: "/announcements", changefreq: "monthly", priority: "0.6" },
  { path: "/knowledge-hub", changefreq: "weekly", priority: "0.9" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.2" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.2" },
];

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

  for (const route of STATIC_ROUTES) add(route.path, route.changefreq, route.priority);

  const reviewsSource = readFileSync(resolve(root, "src/data/reviews.ts"), "utf-8");
  for (const id of extractQuoted(reviewsSource, "id")) add(`/reviews/${id}`, "monthly", "0.75");

  const comparisonsSource = readFileSync(resolve(root, "src/data/comparisons.ts"), "utf-8");
  for (const slug of extractQuoted(comparisonsSource, "slug")) add(`/reviews/versus/${slug}`, "monthly", "0.8");

  const spotlightSource = readFileSync(resolve(root, "src/data/spotlight.ts"), "utf-8");
  for (const slug of extractQuoted(spotlightSource, "slug")) add(`/spotlight/${slug}`, "monthly", "0.75");

  const podcastSource = readFileSync(resolve(root, "src/data/podcast.ts"), "utf-8");
  for (const slug of extractQuoted(podcastSource, "slug")) add(`/podcast/${slug}`, "monthly", "0.7");

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
      .select("slug, publish_date, updated_at")
      .order("publish_date", { ascending: false });
    if (error) {
      console.warn("generate-sitemap: could not fetch published briefings:", error.message);
    } else {
      for (const article of data ?? []) {
        if (typeof article.slug === "string") {
          add(`/briefings/${article.slug}`, "weekly", "0.85", article.updated_at?.slice(0, 10) || article.publish_date?.slice(0, 10) || today);
        }
      }
    }
  } else {
    console.warn("generate-sitemap: Supabase env vars unavailable — dynamic briefings omitted");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync(resolve(root, "public/sitemap.xml"), xml, "utf-8");
  console.log(`generate-sitemap: wrote ${urls.length} canonical URLs to public/sitemap.xml`);
}

main().catch((error) => {
  console.error("generate-sitemap failed:", error);
  process.exit(1);
});
