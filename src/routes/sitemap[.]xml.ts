import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseServerClient } from "@/lib/content/supabaseServerClient";
import { STATIC_SITEMAP_ROUTES } from "@/lib/sitemap/staticRoutes";
import { productReviews } from "@/data/reviews";
import { comparisonArticles } from "@/data/comparisons";
import { spotlightRanking } from "@/data/spotlight";
import { publishedPodcastEpisodes } from "@/data/podcast";
import { faqEntries } from "@/data/faq";
import { isAmpEligible } from "@/lib/webStories/amp";
import { storyFromRow, WEB_STORY_SELECT, type WebStoryRow } from "@/lib/webStories/stories";

const SITE = "https://skinlabs.co.za";

/**
 * Live production sitemap.xml — SSR'd on every request (see
 * scripts/assemble-vercel-output.ts's exact-match "/sitemap.xml" pre-filesystem
 * route) rather than baked into the build like scripts/generate-sitemap.ts's
 * static fallback. The daily briefings/product-review pipelines publish via
 * Supabase pg_cron, not a Vercel build, so a build-time-only sitemap could sit
 * stale for days; querying Supabase live here means a briefing or review
 * published minutes ago is already in the sitemap Google/Bing next crawl.
 * Mirrors generate-sitemap.ts's route set — see that file's own comment for
 * why it still exists as a fallback.
 */

const urlEntry = (loc: string, lastmod: string, changefreq: string, priority: string) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

async function buildSitemapXml(): Promise<string> {
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

  for (const review of productReviews) add(`/reviews/${review.id}`, "monthly", "0.75");
  for (const article of comparisonArticles) add(`/reviews/versus/${article.slug}`, "monthly", "0.8");
  for (const entry of spotlightRanking) add(`/spotlight/${entry.slug}`, "monthly", "0.75");
  for (const episode of publishedPodcastEpisodes) add(`/podcast/${episode.slug}`, "monthly", "0.7");
  for (const entry of faqEntries) add(`/knowledge-hub/${entry.slug}`, "monthly", "0.7");
  // /marketplace/concern/:slug intentionally not added here — see the
  // STATIC_SITEMAP_ROUTES removal note in src/lib/sitemap/staticRoutes.ts:
  // every /marketplace/* route is login-gated (MarketplaceGate), so listing
  // it in the sitemap only sends crawlers/agents to a locked screen.

  try {
    const supabase = createSupabaseServerClient();

    // marketplace_products/marketplace_brands intentionally not queried here
    // — every /marketplace/* route is login-gated (MarketplaceGate), so a
    // crawler/agent following these URLs would only ever reach a locked
    // screen. See the STATIC_SITEMAP_ROUTES removal note in
    // src/lib/sitemap/staticRoutes.ts for the full reasoning.
    const [briefings, ingredientRows, generatedReviews, webStories] = await Promise.all([
      supabase.from("news_articles_public").select("slug, publish_date").order("publish_date", { ascending: false }),
      supabase.from("ingredients").select("slug").neq("verification_status", "deprecated"),
      supabase.from("ai_generated_product_reviews").select("id, published_date"),
      supabase.from("web_stories").select(WEB_STORY_SELECT),
    ]);

    for (const article of briefings.data ?? []) {
      if (typeof article.slug === "string") {
        add(`/briefings/${article.slug}`, "weekly", "0.85", article.publish_date?.slice(0, 10) || today);
      }
    }
    for (const ingredient of ingredientRows.data ?? []) {
      if (typeof ingredient.slug === "string") add(`/ingredients/${ingredient.slug}`, "monthly", "0.6");
    }
    // Only stories that actually have an AMP page; promotional ones are ads
    // (rendered noindex) so they're kept out of the sitemap too.
    for (const row of (webStories.data ?? []) as unknown as WebStoryRow[]) {
      const story = storyFromRow(row);
      if (story.kind !== "promotional" && isAmpEligible(story)) {
        add(`/web-stories/${story.slug}`, "weekly", "0.7", story.publishAt.slice(0, 10));
      }
    }
    for (const review of generatedReviews.data ?? []) {
      if (typeof review.id === "string") {
        add(`/reviews/${review.id}`, "monthly", "0.75", review.published_date?.slice(0, 10) || today);
      }
    }
  } catch (error) {
    // Fall through with the static + data-file URLs already collected above
    // rather than 500ing the whole sitemap over a transient DB error.
    console.error("sitemap.xml SSR route: Supabase query failed, serving static+data-file URLs only:", error);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = await buildSitemapXml();
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
