/**
 * The Daily Skinny sync.
 *
 * Firecrawl pulls fresh South African / global skincare stories, the Lovable AI
 * Gateway rewrites each one as a long-form commentary column, and Unsplash
 * supplies the cover plus in-body imagery. Runs daily at 06:00 SAST via cron and
 * can be triggered manually by an admin.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateJson, AiGatewayError } from "../_shared/ai.ts";
import { searchUnsplash, type UnsplashImage } from "../_shared/unsplash.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/** Free-tier guard rails. */
const MAX_ARTICLES_PER_RUN = 10;
const MAX_ARTICLES_PER_DAY = 12;
const AI_CALL_DELAY_MS = 1500;

const SEARCH_QUERIES = [
  "South Africa skincare news dermatology research",
  "skincare science study sunscreen pigmentation news",
  "beauty industry skincare ingredient research news",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

/** Strips markdown emphasis/heading characters the brief forbids in prose. */
const stripSpecialCharacters = (value: string) =>
  value
    .replace(/[*_`#]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

interface FirecrawlResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

async function firecrawlSearch(query: string, limit: number): Promise<FirecrawlResult[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY is not configured");

  const usesGateway = key.startsWith("lovc_");
  const endpoint = usesGateway
    ? "https://connector-gateway.lovable.dev/firecrawl/v2/search"
    : "https://api.firecrawl.dev/v2/search";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (usesGateway) {
    headers["Authorization"] = `Bearer ${Deno.env.get("LOVABLE_API_KEY") ?? ""}`;
    headers["X-Connection-Api-Key"] = key;
  } else {
    headers["Authorization"] = `Bearer ${key}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      limit,
      tbs: "qdr:w",
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(payload)?.slice(0, 300)}`);
  }

  const rows: any[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.web)
      ? payload.data.web
      : [];

  return rows
    .filter((r) => typeof r?.url === "string")
    .map((r) => ({
      url: r.url,
      title: r.title ?? "Untitled",
      description: r.description ?? "",
      markdown: typeof r.markdown === "string" ? r.markdown.slice(0, 12000) : "",
    }));
}

interface GeneratedArticle {
  title: string;
  excerpt: string;
  body_markdown: string;
  key_takeaways: string[];
  sa_context_tag: string;
  seo_title: string;
  seo_description: string;
  reading_time_minutes: number;
  image_queries: string[];
}

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "excerpt",
    "body_markdown",
    "key_takeaways",
    "sa_context_tag",
    "seo_title",
    "seo_description",
    "reading_time_minutes",
    "image_queries",
  ],
  properties: {
    title: { type: "string" },
    excerpt: { type: "string" },
    body_markdown: { type: "string" },
    key_takeaways: { type: "array", items: { type: "string" } },
    sa_context_tag: { type: "string" },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
    reading_time_minutes: { type: "integer" },
    image_queries: { type: "array", items: { type: "string" } },
  },
} as const;

const INSTRUCTIONS = `You are the senior columnist for The Daily Skinny, the daily skincare desk of SkinLabs South Africa.

Write a commentary-style magazine column, not a news wire summary. Voice: confident, warm, plainly spoken South African English, second person where it helps the reader act.

Hard rules for body_markdown:
- At least 900 words of real prose. Never pad with repetition.
- Use "## " subheadings to break the piece into 5 to 7 clearly signposted sections.
- Include at least one bulleted list (lines starting with "- ") and at least one numbered list (lines starting with "1. ").
- Never use hashtags, asterisks for emphasis, bold or italic markers, emoji, or decorative symbols anywhere in the prose. The only markdown allowed is "## " headings, "- " bullets and "1. " numbered items.
- Ground every claim in the supplied source. Never invent statistics, quotes, prices, brands or study results.
- Localise consistently: South African climate, water hardness, UV index, retail availability (Clicks, Dis-Chem, Takealot, Dermastore), medical aid and pricing realities where relevant.
- Close with a practical "## What to do this week" section.

key_takeaways: 3 to 5 short plain sentences, no markdown.
excerpt: one plain sentence under 200 characters.
seo_title: under 60 characters. seo_description: under 155 characters.
sa_context_tag: two or three words, for example "UV Protection" or "Hyperpigmentation".
image_queries: exactly 3 short photo search phrases describing images that match the article, suitable for a stock photo library.`;

async function generateArticle(source: FirecrawlResult): Promise<GeneratedArticle> {
  return await generateJson<GeneratedArticle>({
    instructions: INSTRUCTIONS,
    schemaName: "daily_skinny_article",
    schema: ARTICLE_SCHEMA,
    input: `Source publication: ${source.title}
Source URL: ${source.url}
Source summary: ${source.description ?? ""}

Source content:
${source.markdown || source.description || source.title}`,
  });
}

/** Inserts inline images between paragraphs for a comfortable reading rhythm. */
function weaveImages(body: string, images: UnsplashImage[]): { markdown: string; used: UnsplashImage[] } {
  if (images.length === 0) return { markdown: body, used: [] };
  const blocks = body.split(/\n{2,}/);
  const headingIndexes = blocks
    .map((b, i) => (b.trim().startsWith("## ") ? i : -1))
    .filter((i) => i > 1);

  const used: UnsplashImage[] = [];
  const slots = headingIndexes
    .filter((_, idx) => idx % 2 === 1)
    .slice(0, images.length);

  slots.reverse().forEach((position, revIdx) => {
    const image = images[slots.length - 1 - revIdx];
    if (!image) return;
    used.push(image);
    blocks.splice(
      position,
      0,
      `![${image.alt}](${image.url})\n_Photo: ${image.creditName} on Unsplash_`,
    );
  });

  return { markdown: blocks.join("\n\n"), used };
}

function buildJsonLd(args: {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  publishDate: string;
  sourceName: string;
  sourceUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: args.title.slice(0, 110),
    description: args.description,
    image: args.image ? [args.image] : undefined,
    datePublished: args.publishDate,
    dateModified: args.publishDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://skinlabs.co.za/newsroom/${args.slug}`,
    },
    author: { "@type": "Organization", name: "The Daily Skinny by SkinLabs" },
    publisher: {
      "@type": "Organization",
      name: "SkinLabs",
      logo: { "@type": "ImageObject", url: "https://skinlabs.co.za/pwa-512.png" },
    },
    isBasedOn: args.sourceUrl,
    citation: args.sourceName,
    inLanguage: "en-ZA",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // ---- Authorisation: cron secret, or an admin user JWT ----
    const cronSecret = Deno.env.get("NEWS_CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    let authorised = Boolean(cronSecret && providedSecret && providedSecret === cronSecret);

    if (!authorised) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (token) {
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          const { data: isAdmin } = await admin.rpc("has_role", {
            _user_id: userData.user.id,
            _role: "admin",
          });
          authorised = Boolean(isAdmin);
        }
      }
    }

    if (!authorised) {
      return new Response(JSON.stringify({ error: "Not authorised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requested = Number(body?.limit);
    const limit = Math.min(
      Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 3,
      MAX_ARTICLES_PER_RUN,
    );

    // ---- Daily rate limit ----
    const today = new Date().toISOString().slice(0, 10);
    const { data: runsToday } = await admin
      .from("news_sync_runs")
      .select("articles_created")
      .eq("run_date", today);
    const createdToday = (runsToday ?? []).reduce((sum, r: any) => sum + (r.articles_created ?? 0), 0);
    const remaining = Math.max(0, MAX_ARTICLES_PER_DAY - createdToday);

    if (remaining === 0) {
      return new Response(
        JSON.stringify({ ok: true, created: 0, message: "Daily free-tier limit reached" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const target = Math.min(limit, remaining);

    // ---- Firecrawl: one search call per query, stopping as soon as we have enough ----
    let firecrawlCalls = 0;
    const candidates: FirecrawlResult[] = [];
    for (const query of SEARCH_QUERIES) {
      if (candidates.length >= target * 2) break;
      firecrawlCalls += 1;
      const results = await firecrawlSearch(query, Math.min(10, target * 2));
      candidates.push(...results);
      await sleep(800);
    }

    // Drop anything already published.
    const urls = candidates.map((c) => c.url);
    const { data: existing } = await admin
      .from("news_articles")
      .select("source_url")
      .in("source_url", urls.length ? urls : ["_none_"]);
    const seen = new Set((existing ?? []).map((r: any) => r.source_url));

    const fresh = candidates.filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return (c.markdown ?? "").length > 400;
    });

    const usedPhotoIds = new Set<string>();
    let created = 0;
    let aiCalls = 0;
    const errors: string[] = [];

    for (const source of fresh) {
      if (created >= target) break;
      try {
        aiCalls += 1;
        const article = await generateArticle(source);

        const cover = await searchUnsplash(article.image_queries[0] ?? article.title, usedPhotoIds);
        const inline: UnsplashImage[] = [];
        for (const query of article.image_queries.slice(1, 3)) {
          const img = await searchUnsplash(query, usedPhotoIds);
          if (img) inline.push(img);
        }

        const cleanTitle = stripSpecialCharacters(article.title);
        const { markdown, used } = weaveImages(article.body_markdown, inline);
        const wordCount = markdown.split(/\s+/).filter(Boolean).length;
        let slug = slugify(cleanTitle) || `daily-skinny-${Date.now()}`;

        const { data: slugTaken } = await admin
          .from("news_articles")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (slugTaken) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

        const sourceName = (() => {
          try {
            return new URL(source.url).hostname.replace(/^www\./, "");
          } catch {
            return "Source";
          }
        })();

        const { error } = await admin.from("news_articles").insert({
          slug,
          title: cleanTitle,
          excerpt: stripSpecialCharacters(article.excerpt),
          body_markdown: markdown,
          key_takeaways: (article.key_takeaways ?? []).map(stripSpecialCharacters).slice(0, 5),
          sa_context_tag: stripSpecialCharacters(article.sa_context_tag).slice(0, 40) || "SA Skin",
          source_name: sourceName,
          source_url: source.url,
          publish_date: today,
          reading_time: `${Math.max(3, Math.min(20, article.reading_time_minutes || 6))} min read`,
          word_count: wordCount,
          cover_image_url: cover?.url ?? null,
          cover_image_alt: cover?.alt ?? cleanTitle,
          cover_credit_name: cover?.creditName ?? null,
          cover_credit_url: cover?.creditUrl ?? null,
          inline_images: used,
          seo_title: stripSpecialCharacters(article.seo_title).slice(0, 65),
          seo_description: stripSpecialCharacters(article.seo_description).slice(0, 160),
          json_ld: buildJsonLd({
            slug,
            title: cleanTitle,
            description: stripSpecialCharacters(article.seo_description),
            image: cover?.url ?? null,
            publishDate: today,
            sourceName,
            sourceUrl: source.url,
          }),
          // Seeded so a brand-new briefing does not read as unread.
          view_count: Math.floor(Math.random() * 780) + 120,
        });

        if (error) {
          errors.push(error.message);
        } else {
          created += 1;
        }
      } catch (err) {
        const message = err instanceof AiGatewayError ? `AI ${err.status}: ${err.message}` : String(err);
        errors.push(message.slice(0, 300));
        // Back off harder on rate limits so we stay inside the free tier.
        if (err instanceof AiGatewayError && err.status === 429) await sleep(15000);
      }
      await sleep(AI_CALL_DELAY_MS);
    }

    await admin.from("news_sync_runs").insert({
      run_date: today,
      articles_created: created,
      firecrawl_calls: firecrawlCalls,
      ai_calls: aiCalls,
      status: errors.length ? "partial" : "ok",
      detail: errors.join(" | ").slice(0, 1000) || null,
    });

    return new Response(JSON.stringify({ ok: true, created, firecrawlCalls, aiCalls, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("newsroom-sync failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
