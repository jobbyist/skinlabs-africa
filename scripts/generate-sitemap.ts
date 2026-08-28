/**
 * Regenerates public/sitemap.xml from the site's actual routes plus its dynamic,
 * DB- and data-file-backed content (newsroom briefings, product reviews, podcast
 * episodes) so the sitemap can't silently drift out of sync the way a hand-maintained
 * static file does. Run via `bun run sitemap` (wired into the GitHub Pages deploy
 * workflow before `bun run build`).
 *
 * Reviews and podcast slugs are parsed out of their data files with a lightweight
 * regex rather than imported, so this script has no dependency on Vite's asset/alias
 * resolution and can run under plain Bun/Node.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://skinlabs.co.za";

interface StaticRoute {
  path: string;
  changefreq: string;
  priority: string;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/newsroom", changefreq: "daily", priority: "0.95" },
  { path: "/reviews", changefreq: "weekly", priority: "0.9" },
  { path: "/podcast", changefreq: "weekly", priority: "0.85" },
  { path: "/ai-formulator", changefreq: "weekly", priority: "0.9" },
  { path: "/consultations", changefreq: "monthly", priority: "0.8" },
  { path: "/devices", changefreq: "weekly", priority: "0.7" },
  { path: "/serums", changefreq: "weekly", priority: "0.7" },
  { path: "/custom-formulas", changefreq: "weekly", priority: "0.7" },
  { path: "/bundled-kits", changefreq: "weekly", priority: "0.7" },
  { path: "/business", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/shipping", changefreq: "monthly", priority: "0.5" },
  { path: "/returns", changefreq: "monthly", priority: "0.5" },
  { path: "/track-order", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
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
  const urls: string[] = STATIC_ROUTES.map((route) => urlEntry(`${SITE}${route.path}`, today, route.changefreq, route.priority));

  const reviewsSource = readFileSync(resolve(root, "src/data/reviews.ts"), "utf-8");
  for (const id of extractQuoted(reviewsSource, "id")) {
    urls.push(urlEntry(`${SITE}/reviews/${id}`, today, "monthly", "0.7"));
  }

  const comparisonsSource = readFileSync(resolve(root, "src/data/comparisons.ts"), "utf-8");
  for (const slug of extractQuoted(comparisonsSource, "slug")) {
    urls.push(urlEntry(`${SITE}/reviews/versus/${slug}`, today, "monthly", "0.8"));
  }

  const podcastSource = readFileSync(resolve(root, "src/data/podcast.ts"), "utf-8");
  for (const slug of extractQuoted(podcastSource, "slug")) {
    urls.push(urlEntry(`${SITE}/podcast/${slug}`, today, "monthly", "0.6"));
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("news_articles_public")
      .select("slug, publish_date")
      .order("publish_date", { ascending: false });
    if (error) {
      console.warn("generate-sitemap: could not fetch newsroom articles, skipping:", error.message);
    } else {
      for (const article of data ?? []) {
        urls.push(urlEntry(`${SITE}/newsroom/${article.slug}`, article.publish_date, "weekly", "0.8"));
      }
    }
  } else {
    console.warn("generate-sitemap: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set — skipping newsroom articles");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync(resolve(root, "public/sitemap.xml"), xml, "utf-8");
  console.log(`generate-sitemap: wrote ${urls.length} URLs to public/sitemap.xml`);
}

main().catch((error) => {
  console.error("generate-sitemap failed:", error);
  process.exit(1);
});
