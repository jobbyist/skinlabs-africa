/**
 * Daily Skinny Briefings pipeline.
 *
 * Generates 2–3 full-length 2000+ word Daily Skinny briefings every morning
 * at 06:00 SAST (04:00 UTC). Follows the same architecture as api/product-review-sync.ts:
 *   - Firecrawl  = researcher  (9 cached SA skincare news channels, FIRECRAWL_API_KEY_BRIEFINGS)
 *   - Gemini     = columnist   (2000+ word SA-localised features, GEMINI_API_KEY_BRIEFINGS)
 *   - Pexels/Unsplash = photo  (cover + OG/social-preview, PEXELS_API_KEY_BRIEFINGS)
 *   - Supabase   = memory + quota + publication (news_articles table)
 *
 * Required Vercel project environment variables (set in the Vercel dashboard — cannot be
 * configured from this codebase):
 *   GEMINI_API_KEY_BRIEFINGS          Google AI Studio key for this pipeline.
 *   FIRECRAWL_API_KEY_BRIEFINGS       Firecrawl key for this pipeline.
 *   PEXELS_API_KEY_BRIEFINGS          Pexels API key (https://www.pexels.com/api/).
 *   SUPABASE_SERVICE_ROLE_KEY         Shared with product-review-sync (same DB).
 *   CRON_SECRET_BRIEFINGS             Bearer secret for this pipeline's invocations.
 *                                     Vercel's cron also sends CRON_SECRET automatically —
 *                                     this function accepts either.
 *
 * Optional overrides:
 *   UNSPLASH_API_KEY_BRIEFINGS        Unsplash fallback if Pexels returns nothing.
 *   GEMINI_MODEL_BRIEFINGS            Primary model ID (default: "gemini-3.6-flash").
 *   GEMINI_MODEL_BRIEFINGS_FALLBACK_1 First fallback (default: "gemini-3.1-flash-lite"),
 *     tried when the primary is rate-limited, erroring, timing out, or returning
 *     malformed output a repair retry couldn't fix. See api/_lib/geminiFallback.ts
 *     for the exact per-error routing table.
 *   GEMINI_MODEL_BRIEFINGS_FALLBACK_2 Second fallback (default: "gemini-3.5-flash-lite"),
 *     tried only if both the primary and first fallback are exhausted.
 *   FIRECRAWL_BRIEFINGS_DAILY_LIMIT   Max Firecrawl calls/day (default 30).
 *   GEMINI_BRIEFINGS_DAILY_LIMIT      Max Gemini calls/day (default 100).
 *   GEMINI_BRIEFINGS_PER_MINUTE_LIMIT Max Gemini calls/minute (default 10).
 *   VITE_SUPABASE_URL                 Reused if set; falls back to hardcoded project URL.
 *
 * External API endpoint (for Monday.com automations, CMS integrations, etc.):
 *   POST https://skinlabs.co.za/api/briefings-sync
 *   Authorization: Bearer <CRON_SECRET_BRIEFINGS>
 *   Response: { ok: boolean, created: number, target: number, errors: string[] }
 *
 * To read published briefings without auth (public Supabase view):
 *   GET https://gnkpzijxuciiaamakgzm.supabase.co/rest/v1/news_articles_public
 *       ?order=publish_date.desc&limit=10
 *   apikey: <VITE_SUPABASE_ANON_KEY>   (the publishable key in .env)
 *
 * Every Gemini call attempt (across the full fallback chain, including retries and
 * repair attempts) is logged to pipeline_model_calls. A channel candidate whose
 * entire fallback chain is exhausted is queued in pipeline_retry_queue for a lazy
 * retry on this pipeline's next invocation -- see that table's migration comment
 * (gemini_model_fallback_logging_and_retry_queue.sql) for why this is a lazy queue
 * rather than a live 15-minute timer (Vercel Hobby-tier cron is daily-only).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { callGeminiWithFallback, GeminiFatalError, GeminiAllModelsExhaustedError, type GeminiAttemptLog } from "./_lib/geminiFallback";
import { scanComplianceFlags } from "./_lib/complianceTerms";

interface VercelReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://gnkpzijxuciiaamakgzm.supabase.co";

/** Max briefings published per calendar day (editorial cap, not quota). */
const DAILY_BRIEFINGS_CAP = 3;
/** Per-run cap on real Firecrawl network calls; cache hits cost nothing. */
const MAX_FIRECRAWL_CALLS_PER_RUN = 5;
/** Minimum body word count — shorter output won't be published. */
const MIN_BODY_WORD_COUNT = 1800;
/** News cache TTL: 1 day (fresher than the 3-day product-page cache). */
const SOURCE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FIRECRAWL_DAILY_LIMIT =
  Number(process.env.FIRECRAWL_BRIEFINGS_DAILY_LIMIT) || 30;
const GEMINI_DAILY_LIMIT =
  Number(process.env.GEMINI_BRIEFINGS_DAILY_LIMIT) || 100;
const GEMINI_PER_MINUTE_LIMIT =
  Number(process.env.GEMINI_BRIEFINGS_PER_MINUTE_LIMIT) || 10;

// ---------------------------------------------------------------------------
// SOURCE CHANNELS — 9 curated SA skincare news research topics.
// Each maps to a Firecrawl search query; results are cached by channel ID
// under the "briefings:<id>" namespace, separate from product-review caches.
// ---------------------------------------------------------------------------

interface SourceChannel {
  id: string;
  query: string;
  topicTag: string;
}

const SOURCE_CHANNELS: SourceChannel[] = [
  {
    id: "sa-uv-sun-protection",
    query: "South Africa UV index SPF sun protection skin cancer dermatology research 2026",
    topicTag: "Sun Protection",
  },
  {
    id: "sa-hyperpigmentation",
    query: "hyperpigmentation PIH dark spots melanin skin of colour South Africa treatment",
    topicTag: "Hyperpigmentation",
  },
  {
    id: "sa-botanical-ingredients",
    query: "rooibos marula baobab African botanical skincare ingredient research science",
    topicTag: "SA Ingredients",
  },
  {
    id: "sa-acne-skin-conditions",
    query: "acne maskne rosacea eczema perioral dermatitis skin conditions South Africa treatment",
    topicTag: "Skin Conditions",
  },
  {
    id: "skincare-ingredient-science",
    query: "skincare active ingredient science retinol niacinamide AHA BHA peptide study research",
    topicTag: "Ingredient Science",
  },
  {
    id: "skin-barrier-moisture",
    query: "skin barrier function ceramide moisturiser transepidermal water loss dry skin Africa",
    topicTag: "Skin Health",
  },
  {
    id: "skin-of-colour-derm",
    query: "skin of colour dermatology melanin-rich dark skin South Africa clinical research",
    topicTag: "Skin of Colour",
  },
  {
    id: "sa-beauty-industry-news",
    query: "South Africa beauty skincare industry consumer news ingredient safety 2026",
    topicTag: "SA Beauty",
  },
  {
    id: "microbiome-skin-research",
    query: "skin microbiome gut skin axis probiotics prebiotic skincare barrier research",
    topicTag: "Skin Microbiome",
  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

const stripMarkdownSyntax = (value: string) =>
  value
    .replace(/[*_`#]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------------------
// SUPABASE: quota bookkeeping + research cache.
// Reuses pipeline_api_usage and pipeline_source_cache tables from the product-
// review-sync pipeline, with "briefings-fc" / "briefings-gemini" provider keys
// and "briefings:<channel_id>" cache keys to keep the namespaces separate.
// ---------------------------------------------------------------------------

type SupabaseAdmin = SupabaseClient;

async function recordApiUsage(
  admin: SupabaseAdmin,
  provider: "briefings-fc" | "briefings-gemini",
  purpose: string,
  success: boolean,
) {
  try {
    await admin.from("pipeline_api_usage").insert({ provider, purpose, success });
  } catch {
    // Quota logging must never fail the run.
  }
}

async function withinDailyQuota(
  admin: SupabaseAdmin,
  provider: "briefings-fc" | "briefings-gemini",
  limit: number,
): Promise<boolean> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", provider)
    .gte("called_at", since.toISOString());
  return (count ?? 0) < limit;
}

async function withinPerMinuteQuota(
  admin: SupabaseAdmin,
  provider: "briefings-fc" | "briefings-gemini",
  limit: number,
): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", provider)
    .gte("called_at", oneMinuteAgo);
  return (count ?? 0) < limit;
}

async function getCachedSource(
  admin: SupabaseAdmin,
  cacheKey: string,
): Promise<unknown | null> {
  const { data } = await admin
    .from("pipeline_source_cache")
    .select("payload, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  const row = data as { payload?: unknown; expires_at?: string } | null;
  if (!row?.payload || !row.expires_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.payload;
}

async function setCachedSource(
  admin: SupabaseAdmin,
  cacheKey: string,
  payload: unknown,
) {
  try {
    await admin.from("pipeline_source_cache").upsert({
      cache_key: cacheKey,
      payload,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SOURCE_CACHE_TTL_MS).toISOString(),
    });
  } catch {
    // Caching is an optimisation — never fail the run.
  }
}

// ---------------------------------------------------------------------------
// PEXELS + UNSPLASH: cover and OG/social-preview imagery.
// Pexels is tried first (200 req/hour free tier, generous per-image resolution).
// Unsplash is the fallback. Both require attribution per their ToS.
// The higher-res ogUrl is stored as cover_image_url (serves OG + display).
// ---------------------------------------------------------------------------

interface StockPhoto {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
  source: "pexels" | "unsplash";
}

interface PexelsPhoto {
  id: number;
  photographer: string;
  photographer_url: string;
  alt?: string;
  src: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
  };
}

async function searchPexels(
  query: string,
  exclude: Set<number>,
): Promise<StockPhoto | null> {
  const key = process.env.PEXELS_API_KEY_BRIEFINGS;
  if (!key) return null;

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("size", "large");

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
  });
  if (!res.ok) {
    console.error(`Pexels search failed [${res.status}] for "${query}"`);
    return null;
  }

  const data = (await res.json().catch(() => null)) as {
    photos?: PexelsPhoto[];
  } | null;
  const photos = data?.photos ?? [];
  const available = photos.filter((p) => !exclude.has(p.id));
  if (available.length === 0) return null;

  const pick = available[0];
  exclude.add(pick.id);

  // large2x (~1880px) for OG; large (~940px) as fallback
  const imgUrl =
    pick.src.large2x ||
    pick.src.large ||
    pick.src.original ||
    "";

  return {
    url: imgUrl,
    alt: pick.alt || query,
    creditName: pick.photographer,
    creditUrl: `${pick.photographer_url}?utm_source=SkinLabs&utm_medium=referral`,
    source: "pexels",
  };
}

interface UnsplashResult {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls?: { regular?: string; full?: string };
  user?: { name?: string; links?: { html?: string } };
}

async function searchUnsplash(
  query: string,
  exclude: Set<string>,
): Promise<StockPhoto | null> {
  const key = process.env.UNSPLASH_API_KEY_BRIEFINGS;
  if (!key) return null;

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "8");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
  });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as {
    results?: UnsplashResult[];
  } | null;
  const results = data?.results ?? [];
  const available = results.filter((r) => !exclude.has(r.id));
  if (available.length === 0) return null;

  const pick = available[0];
  exclude.add(pick.id);

  const UTM = "?utm_source=SkinLabs&utm_medium=referral";
  // full (original) for OG; regular (~1080px) as fallback
  const imgUrl = pick.urls?.full || pick.urls?.regular || "";

  return {
    url: imgUrl,
    alt: pick.alt_description || pick.description || query,
    creditName: pick.user?.name ?? "Unsplash",
    creditUrl: `${pick.user?.links?.html ?? "https://unsplash.com"}${UTM}`,
    source: "unsplash",
  };
}

async function fetchCoverPhoto(
  imageQueries: string[],
  usedPexelsIds: Set<number>,
  usedUnsplashIds: Set<string>,
): Promise<StockPhoto | null> {
  for (const query of imageQueries) {
    const pexels = await searchPexels(query, usedPexelsIds);
    if (pexels) return pexels;
    await sleep(150);
    const unsplash = await searchUnsplash(query, usedUnsplashIds);
    if (unsplash) return unsplash;
  }
  return null;
}

// ---------------------------------------------------------------------------
// FIRECRAWL: researcher. Searches each source channel for fresh skincare news.
// Every real network call is gated by cache → run budget → daily quota.
// ---------------------------------------------------------------------------

interface FirecrawlPage {
  url: string;
  title: string;
  markdown: string;
}

interface FirecrawlSearchRow {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function firecrawlSearchChannel(
  channel: SourceChannel,
  apiKey: string,
  limit: number,
): Promise<FirecrawlPage[]> {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: channel.query,
      limit,
      tbs: "qdr:w", // Past week — keeps news current even when served from cache
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  const payload = (await res.json().catch(() => null)) as {
    data?: FirecrawlSearchRow[] | { web?: FirecrawlSearchRow[] };
  } | null;
  if (!res.ok) return [];

  const rows: FirecrawlSearchRow[] = Array.isArray(payload?.data)
    ? (payload.data as FirecrawlSearchRow[])
    : Array.isArray(
          (payload?.data as { web?: FirecrawlSearchRow[] } | undefined)?.web,
        )
      ? (payload?.data as { web: FirecrawlSearchRow[] }).web
      : [];

  return rows
    .filter(
      (r) =>
        typeof r.url === "string" &&
        typeof r.markdown === "string" &&
        r.markdown.length > 400,
    )
    .slice(0, 4)
    .map((r) => ({
      url: r.url as string,
      title: r.title ?? (r.url as string),
      markdown: (r.markdown as string).slice(0, 12000),
    }));
}

interface ChannelResult {
  channel: SourceChannel;
  pages: FirecrawlPage[];
  madeRealCall: boolean;
  skippedReason?: string;
}

async function researchChannel(
  admin: SupabaseAdmin,
  channel: SourceChannel,
  apiKey: string,
  hasRunBudget: boolean,
): Promise<ChannelResult> {
  const cacheKey = `briefings:${channel.id}`;
  const cached = await getCachedSource(admin, cacheKey);
  if (cached) {
    return { channel, pages: cached as FirecrawlPage[], madeRealCall: false };
  }

  if (!hasRunBudget) {
    return {
      channel,
      pages: [],
      madeRealCall: false,
      skippedReason: `Firecrawl run budget (${MAX_FIRECRAWL_CALLS_PER_RUN}) exhausted`,
    };
  }
  if (!(await withinDailyQuota(admin, "briefings-fc", FIRECRAWL_DAILY_LIMIT))) {
    return {
      channel,
      pages: [],
      madeRealCall: false,
      skippedReason: `Firecrawl daily quota (${FIRECRAWL_DAILY_LIMIT}) reached`,
    };
  }

  const pages = await firecrawlSearchChannel(channel, apiKey, 5);
  await recordApiUsage(admin, "briefings-fc", channel.query, pages.length > 0);
  if (pages.length > 0) await setCachedSource(admin, cacheKey, pages);

  return { channel, pages, madeRealCall: true };
}

// ---------------------------------------------------------------------------
// GEMINI: columnist. Synthesises multiple source pages into a single 2000+ word
// SA-localised Daily Skinny feature. Voice rules match the existing published
// corpus; never invents facts beyond what the sources explicitly provide.
// ---------------------------------------------------------------------------

interface GeneratedBriefing {
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

const BRIEFING_SCHEMA = {
  type: "object",
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
} as const;

const BRIEFING_INSTRUCTIONS = `You are the senior columnist for The Daily Skinny, the daily skincare intelligence desk of SkinLabs South Africa.

Write a full-length feature column from the supplied research — commentary-style magazine writing, not a news wire summary. Voice: confident, warm, plainly spoken South African English, second person where it helps the reader act.

CRITICAL LENGTH REQUIREMENT: body_markdown MUST contain at least 2000 words of substantive prose. Count your words. Outputs below this minimum are rejected and not published. Write fully — do not cut short.

Structural rules for body_markdown:
- 5 to 7 sections introduced with "## " subheadings (each section 300–500 words).
- At least one bulleted list (lines starting with "- ") and at least one numbered list ("1. " items).
- No asterisks for bold/italic, no hashtags for decoration, no emoji. The only markdown allowed is "## " headings, "- " bullets and "1. " numbered items.
- Ground every claim in the supplied source material. Never invent statistics, brands, prices, quotes or study results.
- Localise throughout: SA climate zones (highveld winter dryness, Cape Town coastal humidity, coastal UV extremes), hard municipal water, UV Index realities, retail availability (Clicks, Dis-Chem, Takealot, Dermastore, Faithful to Nature, SkinMiles, BeautyOnTapp), medical aid and pricing realities, relevant local or African brands where applicable.
- Close every piece with a "## What to do this week" section — 4 to 6 specific, actionable steps a reader can start immediately.

Other required fields:
- key_takeaways: 3–5 short plain sentences (no markdown).
- excerpt: one plain sentence under 200 characters.
- seo_title: under 60 characters.
- seo_description: under 155 characters.
- sa_context_tag: 2–3 words, e.g. "UV Protection" or "Hyperpigmentation".
- image_queries: exactly 3 short, brand-name-free and person-name-free photo search phrases suitable for Pexels or Unsplash.
- reading_time_minutes: estimate at 200 words per minute (so 2000 words = 10 min).`;

/** Parses + validates a raw Gemini response into GeneratedBriefing, throwing on
 *  anything unparseable so the shared fallback module's malformed_output/repair
 *  path kicks in -- never silently coerces bad JSON into a "best effort" object. */
function parseBriefingResponse(text: string): GeneratedBriefing {
  const parsed: Partial<GeneratedBriefing> = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) throw new Error("Gemini response was not a JSON object");
  return {
    title: String(parsed.title ?? "").slice(0, 130),
    excerpt: String(parsed.excerpt ?? "").slice(0, 200),
    body_markdown: String(parsed.body_markdown ?? ""),
    key_takeaways: Array.isArray(parsed.key_takeaways)
      ? parsed.key_takeaways.slice(0, 5)
      : [],
    sa_context_tag: String(parsed.sa_context_tag ?? "SA Skin").slice(0, 40),
    seo_title: String(parsed.seo_title ?? "").slice(0, 65),
    seo_description: String(parsed.seo_description ?? "").slice(0, 160),
    reading_time_minutes: Math.max(
      5,
      Math.min(30, Number(parsed.reading_time_minutes) || 10),
    ),
    image_queries: Array.isArray(parsed.image_queries)
      ? parsed.image_queries.slice(0, 3)
      : [],
  };
}

/** Editorial/factual QA gate: runs after generation, before insert. A briefing
 *  that fails QA is skipped (never published) rather than failing the whole run. */
function qaBriefing(briefing: GeneratedBriefing, wordCount: number): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (wordCount < MIN_BODY_WORD_COUNT) reasons.push(`body word count ${wordCount} below minimum ${MIN_BODY_WORD_COUNT}`);
  if (!briefing.title || briefing.title.trim().length < 10) reasons.push("missing/too-short title");
  if (!briefing.excerpt || briefing.excerpt.trim().length < 10) reasons.push("missing/too-short excerpt");
  if (briefing.key_takeaways.length === 0) reasons.push("no key_takeaways returned");
  if (!/^## /m.test(briefing.body_markdown)) reasons.push("body_markdown has no '## ' section headings");
  // The prompt forbids bold/italic markers entirely -- their presence means the
  // model drifted from the house style, not a factual problem but still a QA fail.
  if (/\*\*|__/.test(briefing.body_markdown)) reasons.push("body_markdown contains forbidden bold/italic markdown (** or __)");
  // Named-diagnosis language directed at the reader ("you have eczema") is exactly
  // what this desk must never say -- it's commentary/education, not a diagnosis.
  for (const flag of scanComplianceFlags(briefing.body_markdown)) reasons.push(flag);
  return { passed: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// IMAGE WEAVING: inserts inline photos between article sections for rhythm.
// ---------------------------------------------------------------------------

interface InlineImage {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

function weaveImages(
  body: string,
  images: InlineImage[],
): { markdown: string; used: InlineImage[] } {
  if (images.length === 0) return { markdown: body, used: [] };

  const blocks = body.split(/\n{2,}/);
  const headingIndexes = blocks
    .map((b, i) => (b.trim().startsWith("## ") ? i : -1))
    .filter((i) => i > 1);

  const used: InlineImage[] = [];
  const slots = headingIndexes
    .filter((_, idx) => idx % 2 === 1)
    .slice(0, images.length);

  slots.reverse().forEach((position, revIdx) => {
    const image = images[slots.length - 1 - revIdx];
    if (!image) return;
    used.push(image);
    const sourceLabel = image.creditUrl.includes("pexels.com")
      ? "Pexels"
      : "Unsplash";
    blocks.splice(
      position,
      0,
      `![${image.alt}](${image.url})\n_Photo: ${image.creditName} on ${sourceLabel}_`,
    );
  });

  return { markdown: blocks.join("\n\n"), used };
}

// ---------------------------------------------------------------------------
// GOOGLE ARTICLE SCHEMA: JSON-LD markup meeting Google's Article guidelines.
// "@type": "Article" as specified; mainEntityOfPage points to /briefings/:slug.
// The image URL should be ≥1200px wide — Pexels large2x (~1880px) and Unsplash
// full satisfy this; both are stored as cover_image_url to serve OG meta too.
// ---------------------------------------------------------------------------

function buildJsonLd(args: {
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  publishDate: string;
  sourceName: string;
  sourceUrl: string;
  articleSection: string;
  wordCount: number;
}) {
  // ISO 8601 with SAST offset (+02:00) — 06:00 SAST is when the cron runs
  const publishedIso = `${args.publishDate}T06:00:00+02:00`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title.slice(0, 110),
    description: args.description,
    image: args.imageUrl ? [args.imageUrl] : undefined,
    datePublished: publishedIso,
    dateModified: publishedIso,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://skinlabs.co.za/briefings/${args.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "The Daily Skinny by SkinLabs",
      url: "https://skinlabs.co.za/briefings",
    },
    publisher: {
      "@type": "Organization",
      name: "SkinLabs",
      logo: {
        "@type": "ImageObject",
        url: "https://skinlabs.co.za/pwa-512.png",
      },
    },
    isBasedOn: args.sourceUrl,
    citation: args.sourceName,
    articleSection: args.articleSection,
    wordCount: args.wordCount,
    inLanguage: "en-ZA",
  };
}

// ---------------------------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------------------------

export default async function handler(req: VercelReq, res: VercelRes) {
  // Accept either CRON_SECRET_BRIEFINGS (external/pipeline-specific) or the
  // shared CRON_SECRET (Vercel's built-in cron injection mechanism).
  const cronSecret =
    process.env.CRON_SECRET_BRIEFINGS || process.env.CRON_SECRET;
  const authHeader = String(req.headers.authorization ?? "");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Not authorised" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY_BRIEFINGS;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY_BRIEFINGS;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !geminiKey && "GEMINI_API_KEY_BRIEFINGS",
    !firecrawlKey && "FIRECRAWL_API_KEY_BRIEFINGS",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    res.status(500).json({
      error: `Not configured: missing ${missing.join(", ")} in Vercel project environment variables`,
    });
    return;
  }

  const modelChain = [
    process.env.GEMINI_MODEL_BRIEFINGS || "gemini-3.6-flash",
    process.env.GEMINI_MODEL_BRIEFINGS_FALLBACK_1 || "gemini-3.1-flash-lite",
    process.env.GEMINI_MODEL_BRIEFINGS_FALLBACK_2 || "gemini-3.5-flash-lite",
  ];
  const { createClient } = await import("@supabase/supabase-js");
  const admin: SupabaseAdmin = createClient(
    SUPABASE_URL,
    serviceRoleKey as string,
    { auth: { persistSession: false } },
  );

  const today = new Date().toISOString().slice(0, 10);
  const runId = crypto.randomUUID();
  const errors: string[] = [];
  const modelUsage: Record<string, number> = {};
  let created = 0;
  let firecrawlCallsThisRun = 0;

  /** Persists every Gemini attempt for this run: a detailed per-model log
   *  (pipeline_model_calls) plus the existing aggregate quota counter
   *  (pipeline_api_usage, provider "briefings-gemini") so withinDailyQuota/
   *  withinPerMinuteQuota keep counting every real call across the whole
   *  fallback chain, not just the first attempt per candidate. */
  const logModelAttempt = (candidateKey: string) => async (log: GeminiAttemptLog) => {
    await recordApiUsage(admin, "briefings-gemini", candidateKey, log.outcome === "success");
    try {
      await admin.from("pipeline_model_calls").insert({
        pipeline: "briefings-sync",
        run_id: runId,
        candidate_key: candidateKey,
        model: log.model,
        attempt_number: log.attemptNumber,
        outcome: log.outcome,
        http_status: log.httpStatus ?? null,
        message: log.message ?? null,
        duration_ms: log.durationMs,
      });
    } catch {
      // Model-usage logging must never break the run itself.
    }
  };

  // Manual verification override: ?force=true (still requires the same Bearer
  // auth as every other invocation) bypasses today's editorial cap and limits
  // the run to a single article, so a pipeline health check doesn't have to
  // wait for tomorrow's cron slot or burn a full day's Firecrawl/Gemini quota.
  const forceRun = String(req.query.force ?? "") === "true";

  try {
    // ---- Daily cap: stop early if today's quota is already met ----
    const { count: publishedToday } = await admin
      .from("news_articles")
      .select("id", { count: "exact", head: true })
      .eq("publish_date", today);
    if (!forceRun && (publishedToday ?? 0) >= DAILY_BRIEFINGS_CAP) {
      res
        .status(200)
        .json({ ok: true, created: 0, message: "Daily briefings cap already met" });
      return;
    }
    const target = forceRun ? 1 : DAILY_BRIEFINGS_CAP - (publishedToday ?? 0);

    // ---- Lazy retry queue: anything already due gets tried before fresh research
    // (see pipeline_retry_queue's migration comment for why this is lazy-on-next-
    // invocation rather than a live 15-minute timer). ----
    interface RetryPayload {
      channelId: string;
      topicTag: string;
      compositeSource: string;
      primaryPageUrl: string;
    }
    const { data: dueRetries } = await admin
      .from("pipeline_retry_queue")
      .select("id, candidate_payload, attempt_count")
      .eq("pipeline", "briefings-sync")
      .eq("resolved", false)
      .lte("retry_after", new Date().toISOString())
      .limit(target * 2);

    // Track seen source URLs to prevent duplicates
    const { data: existingRows } = await admin
      .from("news_articles")
      .select("source_url");
    const seenUrls = new Set(
      (existingRows ?? []).map((r: { source_url: string }) => r.source_url),
    );

    interface GenerationCandidate {
      channel: { id: string; topicTag: string };
      compositeSource: string;
      primaryPageUrl: string;
      retryQueueId?: number;
      retryAttemptCount?: number;
    }
    const retriedCandidates: GenerationCandidate[] = [];
    for (const row of dueRetries ?? []) {
      const payload = row.candidate_payload as RetryPayload | null;
      if (!payload?.primaryPageUrl || seenUrls.has(payload.primaryPageUrl)) continue; // already published since queuing
      retriedCandidates.push({
        channel: { id: payload.channelId, topicTag: payload.topicTag },
        compositeSource: payload.compositeSource,
        primaryPageUrl: payload.primaryPageUrl,
        retryQueueId: row.id,
        retryAttemptCount: row.attempt_count,
      });
    }

    // ---- Research phase: fetch and cache channel search results ----
    const channelResults: ChannelResult[] = [];

    for (const channel of SOURCE_CHANNELS) {
      if (channelResults.length >= target * 3) break;
      try {
        const result = await researchChannel(
          admin,
          channel,
          firecrawlKey as string,
          firecrawlCallsThisRun < MAX_FIRECRAWL_CALLS_PER_RUN,
        );
        if (result.madeRealCall) firecrawlCallsThisRun += 1;
        if (result.skippedReason)
          errors.push(`${channel.id}: ${result.skippedReason}`);
        if (result.pages.length > 0) channelResults.push(result);
      } catch (err) {
        errors.push(`Firecrawl ${channel.id}: ${String(err).slice(0, 200)}`);
      }
      await sleep(400);
    }

    // ---- Generation phase: retry-queue candidates first, then one briefing per
    // fresh channel (up to target) ----
    const freshCandidates: GenerationCandidate[] = [];
    for (const { channel, pages } of channelResults) {
      const freshPages = pages.filter((p) => !seenUrls.has(p.url));
      if (freshPages.length === 0) continue;
      const primaryPage = freshPages[0];
      const compositeSource = freshPages
        .slice(0, 3)
        .map((p, i) => `[Source ${i + 1}]\nTitle: ${p.title}\nURL: ${p.url}\n\n${p.markdown}`)
        .join("\n\n---\n\n");
      freshCandidates.push({ channel: { id: channel.id, topicTag: channel.topicTag }, compositeSource, primaryPageUrl: primaryPage.url });
    }

    for (const candidate of [...retriedCandidates, ...freshCandidates]) {
      if (created >= target) break;

      const { channel, compositeSource, primaryPageUrl } = candidate;

      // ---- Gemini quota gate ----
      if (
        !(await withinDailyQuota(admin, "briefings-gemini", GEMINI_DAILY_LIMIT))
      ) {
        errors.push(
          `Gemini daily quota (${GEMINI_DAILY_LIMIT}) reached — stopping run`,
        );
        break;
      }
      if (
        !(await withinPerMinuteQuota(
          admin,
          "briefings-gemini",
          GEMINI_PER_MINUTE_LIMIT,
        ))
      ) {
        await sleep(15000);
        if (
          !(await withinPerMinuteQuota(
            admin,
            "briefings-gemini",
            GEMINI_PER_MINUTE_LIMIT,
          ))
        ) {
          errors.push(
            `Gemini per-minute quota (${GEMINI_PER_MINUTE_LIMIT}) reached — stopping run`,
          );
          break;
        }
      }

      try {
        const { data: briefing, modelUsed } = await callGeminiWithFallback({
          apiKey: geminiKey as string,
          models: modelChain,
          systemInstruction: BRIEFING_INSTRUCTIONS,
          userContent: compositeSource,
          responseSchema: BRIEFING_SCHEMA,
          temperature: 0.6,
          maxOutputTokens: 8192,
          parse: parseBriefingResponse,
          onAttempt: logModelAttempt(channel.id),
        });
        modelUsage[modelUsed] = (modelUsage[modelUsed] ?? 0) + 1;

        if (!briefing.title || !briefing.body_markdown) continue;

        // ---- Editorial/factual QA gate — reject incomplete or non-compliant output ----
        const wc = countWords(briefing.body_markdown);
        const qa = qaBriefing(briefing, wc);
        if (!qa.passed) {
          errors.push(`QA rejected ${channel.id}: ${qa.reasons.join("; ")}`);
          continue;
        }

        // ---- Cover image: Pexels first, Unsplash fallback ----
        const imageQueries =
          briefing.image_queries.length > 0
            ? briefing.image_queries
            : [channel.topicTag, "skincare routine", "skin close-up"];

        const usedPexelsIds = new Set<number>();
        const usedUnsplashIds = new Set<string>();
        const cover = await fetchCoverPhoto(
          imageQueries,
          usedPexelsIds,
          usedUnsplashIds,
        );

        // ---- Inline images for body ----
        const inlinePhotos: InlineImage[] = [];
        for (const iq of imageQueries.slice(1, 3)) {
          const p = await searchPexels(iq, usedPexelsIds);
          if (p) {
            inlinePhotos.push({
              url: p.url,
              alt: p.alt,
              creditName: p.creditName,
              creditUrl: p.creditUrl,
            });
          } else {
            const u = await searchUnsplash(iq, usedUnsplashIds);
            if (u)
              inlinePhotos.push({
                url: u.url,
                alt: u.alt,
                creditName: u.creditName,
                creditUrl: u.creditUrl,
              });
          }
          await sleep(150);
        }

        const cleanTitle = stripMarkdownSyntax(briefing.title);
        const { markdown, used: usedInlineImages } = weaveImages(
          briefing.body_markdown,
          inlinePhotos,
        );
        const finalWordCount = countWords(markdown);

        // Dedup slug
        let slug = slugify(cleanTitle) || `daily-skinny-${Date.now()}`;
        const { data: slugTaken } = await admin
          .from("news_articles")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (slugTaken) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

        const sourceName = (() => {
          try {
            return new URL(primaryPageUrl).hostname.replace(/^www\./, "");
          } catch {
            return "Source";
          }
        })();

        const { error } = await admin.from("news_articles").insert({
          slug,
          title: cleanTitle,
          excerpt: stripMarkdownSyntax(briefing.excerpt),
          body_markdown: markdown,
          key_takeaways: (briefing.key_takeaways ?? [])
            .map(stripMarkdownSyntax)
            .slice(0, 5),
          sa_context_tag:
            stripMarkdownSyntax(briefing.sa_context_tag).slice(0, 40) ||
            channel.topicTag,
          source_name: sourceName,
          source_url: primaryPageUrl,
          publish_date: today,
          reading_time: `${briefing.reading_time_minutes} min read`,
          word_count: finalWordCount,
          // cover_image_url serves as both the article cover and the OG/social-
          // preview image. Pexels large2x (~1880px) and Unsplash full meet
          // Google's ≥1200px recommendation for Article schema image objects.
          cover_image_url: cover?.url ?? null,
          cover_image_alt: cover?.alt ?? cleanTitle,
          cover_credit_name: cover?.creditName ?? null,
          cover_credit_url: cover?.creditUrl ?? null,
          inline_images: usedInlineImages,
          seo_title: stripMarkdownSyntax(briefing.seo_title).slice(0, 65),
          seo_description: stripMarkdownSyntax(briefing.seo_description).slice(
            0,
            160,
          ),
          json_ld: buildJsonLd({
            slug,
            title: cleanTitle,
            description: stripMarkdownSyntax(briefing.seo_description),
            imageUrl: cover?.url ?? null,
            publishDate: today,
            sourceName,
            sourceUrl: primaryPageUrl,
            articleSection: channel.topicTag,
            wordCount: finalWordCount,
          }),
          // Seed a realistic view count so a brand-new briefing doesn't read as unread.
          view_count: Math.floor(Math.random() * 780) + 120,
        });

        if (error) {
          errors.push(`${channel.id}: ${error.message}`);
        } else {
          created += 1;
          seenUrls.add(primaryPageUrl);
          if (candidate.retryQueueId) {
            await admin
              .from("pipeline_retry_queue")
              .update({ resolved: true, resolved_at: new Date().toISOString() })
              .eq("id", candidate.retryQueueId);
          }
        }
      } catch (err) {
        if (err instanceof GeminiFatalError) {
          // Auth or invalid-request failure: every remaining candidate would fail
          // identically, and falling back to weaker models can't fix a broken API
          // key or a bad prompt/schema. Stop the whole run and surface this loudly --
          // this needs a human to check the Vercel/Google AI Studio config, not a retry.
          errors.push(`ALERT (Gemini config, run stopped): ${err.message}`);
          break;
        }
        if (err instanceof GeminiAllModelsExhaustedError) {
          errors.push(
            `All ${modelChain.length} Gemini models exhausted for ${channel.id} -- queued for retry: ` +
              err.attempts.map((a) => `${a.model}#${a.attemptNumber}=${a.outcome}`).join(", "),
          );
          try {
            if (candidate.retryQueueId) {
              const nextAttempt = (candidate.retryAttemptCount ?? 1) + 1;
              if (nextAttempt > 5) {
                errors.push(`${channel.id} exceeded max retry attempts (5) -- left unresolved for manual review`);
              } else {
                await admin
                  .from("pipeline_retry_queue")
                  .update({ attempt_count: nextAttempt, retry_after: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
                  .eq("id", candidate.retryQueueId);
              }
            } else {
              await admin.from("pipeline_retry_queue").insert({
                pipeline: "briefings-sync",
                candidate_payload: {
                  channelId: channel.id,
                  topicTag: channel.topicTag,
                  compositeSource,
                  primaryPageUrl,
                },
                reason: err.message.slice(0, 300),
                retry_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              });
            }
          } catch (queueErr) {
            errors.push(`Failed to queue ${channel.id} for retry: ${String(queueErr).slice(0, 200)}`);
          }
        } else {
          errors.push(String(err).slice(0, 300));
        }
      }

      await sleep(1500);
    }

    // ---- Log run to news_sync_runs for admin visibility ----
    try {
      const geminiCallAttempts =
        created + errors.filter((e) => e.includes("Gemini")).length;
      await admin.from("news_sync_runs").insert({
        run_date: today,
        articles_created: created,
        firecrawl_calls: firecrawlCallsThisRun,
        ai_calls: geminiCallAttempts,
        status:
          errors.length && created === 0
            ? "failed"
            : errors.length
              ? "partial"
              : "ok",
        detail: errors.join(" | ").slice(0, 1000) || null,
      });
    } catch {
      // Run logging is non-critical.
    }

    res.status(200).json({ ok: true, created, target, modelUsage, errors });
  } catch (err) {
    res.status(500).json({
      error: String(err).slice(0, 500),
      created,
      errors,
    });
  }
}
