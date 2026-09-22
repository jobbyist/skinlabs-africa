/**
 * Daily South African skincare product review sync.
 *
 * Four clean roles, each doing only its own job:
 *   - Firecrawl  = researcher       (finds and fetches real source pages)
 *   - Gemini     = analyst + writer (turns a source into a scored, grounded verdict)
 *   - Supabase   = memory + orchestration + publication (dedup, cache, quota, storage)
 *   - SkinLabs   = editorial presentation (ReviewsGrid/ProductReview/SiteSearch render
 *                  whatever lands in ai_generated_product_reviews -- see src/hooks/
 *                  use-generated-reviews.ts -- with zero pipeline-specific UI code)
 *
 * Replaces the old newsroom-sync (Daily Skinny briefing) cron slot: instead of a daily
 * news column, this generates up to DAILY_REVIEW_CAP grounded product reviews a day --
 * 70% South African brands, 30% global brands available in SA -- and publishes them
 * straight to /reviews via the ai_generated_product_reviews table (see supabase/
 * migrations/20260913020000_product_review_pipeline_core.sql).
 *
 * Runs on Vercel (not a Supabase edge function) because it needs GEMINI_API_KEY from
 * Vercel's own project environment variables, per an explicit product decision -- see
 * vercel.json's `crons` entry (09:00 SAST = 07:00 UTC daily).
 *
 * Required Vercel project environment variables (none of these can be set from this
 * codebase -- an admin must add them in the Vercel dashboard before this pipeline can
 * run for real; until then every invocation fails fast with a clear "not configured"
 * error rather than silently doing nothing):
 *   - GEMINI_API_KEY          Google AI Studio / Gemini API key.
 *   - FIRECRAWL_API_KEY       Firecrawl API key (api.firecrawl.dev).
 *   - SUPABASE_SERVICE_ROLE_KEY   The Supabase project's service_role key (NOT the
 *     publishable key already used client-side -- this needs to bypass RLS to insert).
 *   - CRON_SECRET             Vercel's own convention: when set, Vercel signs every
 *     Cron invocation with `Authorization: Bearer $CRON_SECRET`, which this function
 *     checks. Also usable to trigger a manual/admin run with the same header.
 * Optional (quota knobs -- see "QUOTA MONITOR" below; defaults are deliberately
 * conservative placeholders, not a confirmed reading of either provider's actual free
 * tier for this account/model, since nothing in this environment can check that live):
 *   - GEMINI_MODEL              Defaults to "gemini-3.6-flash". (gemini-2.0-flash was
 *     retired by Google -- confirmed live via a 404 from the real API on 2026-09-13,
 *     which named gemini-3.6-flash as the direct replacement.)
 *   - FIRECRAWL_DAILY_LIMIT     Defaults to 20 real Firecrawl calls/day.
 *   - GEMINI_DAILY_LIMIT        Defaults to 100 real Gemini calls/day.
 *   - GEMINI_PER_MINUTE_LIMIT   Defaults to 10 real Gemini calls/minute.
 *   - VITE_SUPABASE_URL         Reused if set (already present for the client build);
 *     falls back to the hardcoded production project URL otherwise.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface VercelReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gnkpzijxuciiaamakgzm.supabase.co";

/** Hard daily publication cap -- SkinLabs' own editorial rate, independent of quota. */
const DAILY_REVIEW_CAP = 3;
/** Hard cap on real Firecrawl network calls per run (cache hits don't count). */
const MAX_FIRECRAWL_SOURCES_PER_RUN = 5;
/** Target 70% South African brands / 30% global-available-in-SA per the editorial brief. */
const SA_SHARE_TARGET = 0.7;
/** Bump the Spotlight edition/methodology version every N published reviews. */
const SPOTLIGHT_BUMP_INTERVAL = 25;
/** Count of reviews already in src/data/reviews.ts at the time this pipeline shipped. */
const STATIC_REVIEW_BASELINE = 160;

// ---------------------------------------------------------------------------
// QUOTA MONITOR (Supabase as memory) -- every real Firecrawl/Gemini call is logged to
// pipeline_api_usage, and checked against these thresholds *before* the next call, so
// a free-tier limit is respected proactively rather than discovered as a mid-run error.
// The exact numbers are conservative placeholders -- tune them via the env vars above
// to whatever this account's actual Firecrawl/Google AI Studio plan allows.
// ---------------------------------------------------------------------------
const FIRECRAWL_DAILY_LIMIT = Number(process.env.FIRECRAWL_DAILY_LIMIT) || 20;
const GEMINI_DAILY_LIMIT = Number(process.env.GEMINI_DAILY_LIMIT) || 100;
const GEMINI_PER_MINUTE_LIMIT = Number(process.env.GEMINI_PER_MINUTE_LIMIT) || 10;

/** How long a cached Firecrawl result is trusted before it's fetched fresh again. */
const SOURCE_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const KNOWN_RETAILERS = [
  "Clicks",
  "Dis-Chem",
  "Takealot",
  "Brand Direct",
  "Dermastore",
  "Faithful to Nature",
  "Superbalist",
  "SkinMiles",
  "BeautyOnTapp",
  "Wellness Warehouse",
  "Retailbox",
  "Edgars",
] as const;
type Retailer = (typeof KNOWN_RETAILERS)[number];

/** Must exactly match the category taxonomy already used across src/data/reviews.ts --
 *  ReviewsGrid's category filter dropdown is derived from that static set, so a
 *  category outside it would still render but wouldn't be selectable by name. */
const KNOWN_CATEGORIES = ["Moisturiser", "Serum", "Cleanser", "Sunscreen", "Exfoliant", "Eye Cream", "Body", "Mist"] as const;

type SourceType = "faithful_to_nature" | "brand_direct" | "sponsored" | "openhaus_marketplace";
type Origin = "south_africa" | "global_available_in_sa";

interface SourceSite {
  url: string;
  sourceType: SourceType;
  origin: Origin;
  isSponsored: boolean;
  retailerHint: Retailer;
}

/** Primary + secondary source sites named in the editorial brief. Firecrawl is asked
 *  to find individual product pages within each rather than review the listing page
 *  itself. */
const SOURCE_SITES: SourceSite[] = [
  {
    url: "https://www.faithful-to-nature.co.za/body-beauty/facial-skincare",
    sourceType: "faithful_to_nature",
    origin: "south_africa",
    isSponsored: false,
    retailerHint: "Faithful to Nature",
  },
  { url: "https://geveskincare.com", sourceType: "brand_direct", origin: "south_africa", isSponsored: false, retailerHint: "Brand Direct" },
  { url: "https://orobaa.africa", sourceType: "brand_direct", origin: "south_africa", isSponsored: false, retailerHint: "Brand Direct" },
  { url: "https://kloom.co.za", sourceType: "brand_direct", origin: "south_africa", isSponsored: false, retailerHint: "Brand Direct" },
  {
    url: "https://www.timelessha.com",
    sourceType: "sponsored",
    origin: "global_available_in_sa",
    isSponsored: true,
    retailerHint: "Brand Direct",
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const clampScore = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 6;
  return Math.min(10, Math.max(0, Math.round(n * 10) / 10));
};

// ---------------------------------------------------------------------------
// SUPABASE AS MEMORY: quota bookkeeping + research cache. Kept together since both are
// "ask Supabase what it remembers before calling out to Firecrawl/Gemini again."
// ---------------------------------------------------------------------------

type SupabaseAdmin = SupabaseClient;

async function recordApiUsage(admin: SupabaseAdmin, provider: "firecrawl" | "gemini", purpose: string, success: boolean) {
  try {
    await admin.from("pipeline_api_usage").insert({ provider, purpose, success });
  } catch {
    // Quota logging must never fail the run itself.
  }
}

async function withinDailyQuota(admin: SupabaseAdmin, provider: "firecrawl" | "gemini", limit: number): Promise<boolean> {
  const sinceUtcMidnight = new Date();
  sinceUtcMidnight.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", provider)
    .gte("called_at", sinceUtcMidnight.toISOString());
  return (count ?? 0) < limit;
}

async function withinPerMinuteQuota(admin: SupabaseAdmin, provider: "firecrawl" | "gemini", limit: number): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", provider)
    .gte("called_at", oneMinuteAgo);
  return (count ?? 0) < limit;
}

async function getCachedSource(admin: SupabaseAdmin, cacheKey: string): Promise<unknown | null> {
  const { data } = await admin.from("pipeline_source_cache").select("payload, expires_at").eq("cache_key", cacheKey).maybeSingle();
  const row = data as { payload?: unknown; expires_at?: string } | null;
  if (!row?.payload || !row.expires_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.payload;
}

async function setCachedSource(admin: SupabaseAdmin, cacheKey: string, payload: unknown) {
  try {
    await admin.from("pipeline_source_cache").upsert({
      cache_key: cacheKey,
      payload,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SOURCE_CACHE_TTL_MS).toISOString(),
    });
  } catch {
    // Caching is an optimisation, never a requirement for the run to succeed.
  }
}

// ---------------------------------------------------------------------------
// GEMINI: analyst + writer. Takes source text/data and returns a scored, grounded
// verdict -- never asked to invent a product, price or claim beyond what it's given.
// ---------------------------------------------------------------------------

interface GeneratedReviewFields {
  product_name: string;
  brand: string;
  local_price_zar: number;
  category: string;
  skin_type_match: string[];
  score_efficacy: number;
  score_value: number;
  score_texture: number;
  score_climate: number;
  verdict: string;
  key_ingredients: string[];
}

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    product_name: { type: "string" },
    brand: { type: "string" },
    local_price_zar: { type: "number" },
    category: { type: "string", enum: [...KNOWN_CATEGORIES] },
    skin_type_match: { type: "array", items: { type: "string" } },
    score_efficacy: { type: "number" },
    score_value: { type: "number" },
    score_texture: { type: "number" },
    score_climate: { type: "number" },
    verdict: { type: "string" },
    key_ingredients: { type: "array", items: { type: "string" } },
  },
  required: [
    "product_name",
    "brand",
    "local_price_zar",
    "category",
    "skin_type_match",
    "score_efficacy",
    "score_value",
    "score_texture",
    "score_climate",
    "verdict",
    "key_ingredients",
  ],
} as const;

const REVIEW_INSTRUCTIONS = `You are a SkinLabs South Africa product review editor. Write ONE product review
grounded strictly in the supplied source material -- never invent a product, price,
ingredient or claim that is not present in the source.

Voice: match SkinLabs' existing published reviews -- confident, plain-spoken, one or two
sentences, willing to call out both strengths and real limitations (price, fragrance,
weak evidence). Never fabricate scarcity, ratings, or "clinically proven" language the
source does not itself support.

score_efficacy/score_value/score_texture/score_climate: 0-10, one decimal. score_climate
specifically means performance in South African heat, humidity, sun and dryness --
reason about the actives and texture described, do not default to a flat number.
verdict: one or two sentences, no markdown, no exclamation marks, no emoji.
key_ingredients: the real actives/ingredients named in the source, 2-6 items.
local_price_zar: the ZAR price from the source. If the source gives a different
currency, convert at a reasonable approximate rate and note nothing extra -- just the number.
category: pick the single best fit from the provided enum.`;

class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface GeminiApiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

async function generateReview(sourceText: string, apiKey: string, model: string): Promise<GeneratedReviewFields> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: REVIEW_INSTRUCTIONS }] },
      contents: [{ parts: [{ text: sourceText.slice(0, 14000) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: REVIEW_SCHEMA,
        temperature: 0.4,
      },
    }),
  });

  const payload = (await res.json().catch(() => null)) as GeminiApiResponse | null;
  if (!res.ok) {
    throw new GeminiError(res.status, `Gemini ${res.status}: ${JSON.stringify(payload)?.slice(0, 300)}`);
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Gemini returned no usable content");

  const parsed = JSON.parse(text);
  return {
    product_name: String(parsed.product_name ?? "").slice(0, 120),
    brand: String(parsed.brand ?? "").slice(0, 80),
    local_price_zar: Math.max(1, Number(parsed.local_price_zar) || 1),
    category: KNOWN_CATEGORIES.includes(parsed.category) ? parsed.category : "Moisturiser",
    skin_type_match: Array.isArray(parsed.skin_type_match) ? parsed.skin_type_match.slice(0, 5) : [],
    score_efficacy: clampScore(parsed.score_efficacy),
    score_value: clampScore(parsed.score_value),
    score_texture: clampScore(parsed.score_texture),
    score_climate: clampScore(parsed.score_climate),
    verdict: String(parsed.verdict ?? "").slice(0, 500),
    key_ingredients: Array.isArray(parsed.key_ingredients) ? parsed.key_ingredients.slice(0, 6) : [],
  };
}

// ---------------------------------------------------------------------------
// FIRECRAWL: researcher. Finds and fetches real product pages -- every call here is
// gated by the research cache and the quota monitor before it reaches the network.
// ---------------------------------------------------------------------------

interface FirecrawlPage {
  url: string;
  title: string;
  markdown: string;
}

interface FirecrawlScrapeResponse {
  data?: { markdown?: string; metadata?: { title?: string } };
}

async function firecrawlScrape(url: string, apiKey: string): Promise<FirecrawlPage | null> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  const payload = (await res.json().catch(() => null)) as FirecrawlScrapeResponse | null;
  if (!res.ok || !payload?.data?.markdown) return null;
  return {
    url,
    title: payload.data.metadata?.title ?? url,
    markdown: payload.data.markdown.slice(0, 14000),
  };
}

interface FirecrawlSearchRow {
  url?: string;
  title?: string;
  markdown?: string;
}
interface FirecrawlSearchResponse {
  data?: FirecrawlSearchRow[] | { web?: FirecrawlSearchRow[] };
}

async function firecrawlSearchProductPages(site: SourceSite, apiKey: string, limit: number): Promise<FirecrawlPage[]> {
  const host = new URL(site.url).hostname.replace(/^www\./, "");
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query: `site:${host} skincare product price`,
      limit,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  const payload = (await res.json().catch(() => null)) as FirecrawlSearchResponse | null;
  if (!res.ok) return [];
  const rows: FirecrawlSearchRow[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.web)
      ? (payload?.data as { web: FirecrawlSearchRow[] }).web
      : [];
  return rows
    .filter((r) => typeof r.url === "string" && typeof r.markdown === "string" && r.markdown.length > 300)
    .map((r) => ({ url: r.url as string, title: r.title ?? r.url!, markdown: r.markdown!.slice(0, 14000) }));
}

/** Cache key for a source site -- a stable URL for scrape targets, a query-shaped key
 *  for search targets (there's no single fixed page to key off for those). */
const cacheKeyFor = (site: SourceSite): string =>
  site.sourceType === "faithful_to_nature" ? `scrape:${site.url}` : `search:${new URL(site.url).hostname.replace(/^www\./, "")}`;

interface ResearchResult {
  pages: FirecrawlPage[];
  madeRealCall: boolean;
  skippedReason?: string;
}

/** The research step for one source site: cache first, then quota, then network.
 *  Only a genuine network call counts against the per-run Firecrawl budget or the
 *  daily/per-minute quota -- a cache hit is free on both. */
async function researchSource(admin: SupabaseAdmin, site: SourceSite, apiKey: string, runBudgetRemaining: boolean): Promise<ResearchResult> {
  const cacheKey = cacheKeyFor(site);
  const cached = await getCachedSource(admin, cacheKey);
  if (cached) return { pages: cached as FirecrawlPage[], madeRealCall: false };

  if (!runBudgetRemaining) {
    return { pages: [], madeRealCall: false, skippedReason: `Firecrawl run budget (${MAX_FIRECRAWL_SOURCES_PER_RUN}) exhausted` };
  }
  if (!(await withinDailyQuota(admin, "firecrawl", FIRECRAWL_DAILY_LIMIT))) {
    return { pages: [], madeRealCall: false, skippedReason: `Firecrawl daily quota (${FIRECRAWL_DAILY_LIMIT}) reached` };
  }

  const pages =
    site.sourceType === "faithful_to_nature"
      ? [await firecrawlScrape(site.url, apiKey)].filter((p): p is FirecrawlPage => Boolean(p))
      : await firecrawlSearchProductPages(site, apiKey, 3);

  await recordApiUsage(admin, "firecrawl", site.url, pages.length > 0);
  if (pages.length > 0) await setCachedSource(admin, cacheKey, pages);
  return { pages, madeRealCall: true };
}

// ---------------------------------------------------------------------------
// INGREDIENT DEMAND SIGNAL: every published review's key_ingredients are resolved
// against the live `ingredients` catalogue (same alias-aware `search_ingredients` RPC
// the frontend's src/lib/resolveIngredientSlug.ts uses). Anything unresolved is queued
// into `ingredient_generation_requests` for the Ingredients Intelligence content
// pipeline (see supabase/INGREDIENT_CONTENT_STATUS.md) to pick up on its next
// scheduled run -- this function never generates ingredient content itself.
// ---------------------------------------------------------------------------

interface SearchIngredientRow {
  id: string;
  slug: string;
  common_name: string | null;
  inci_name: string | null;
}

async function isIngredientResolved(admin: SupabaseAdmin, rawName: string): Promise<boolean> {
  const { data } = await admin.rpc("search_ingredients", { p_search: rawName, p_page: 1, p_per_page: 5 });
  const rows = (data ?? []) as SearchIngredientRow[];
  const lower = rawName.trim().toLowerCase();
  return rows.some((row) => row.common_name?.toLowerCase() === lower || row.inci_name?.toLowerCase() === lower);
}

async function queueUnresolvedIngredients(admin: SupabaseAdmin, keyIngredients: string[], reviewId: string) {
  for (const rawName of keyIngredients) {
    const normalized = rawName.trim().toLowerCase();
    if (!normalized) continue;
    try {
      if (await isIngredientResolved(admin, rawName)) continue;
      await admin.from("ingredient_generation_requests").upsert(
        {
          requested_name: rawName.trim(),
          normalized_name: normalized,
          source: "product_review_generated",
          source_ref: reviewId,
        },
        { onConflict: "normalized_name", ignoreDuplicates: true },
      );
    } catch (err) {
      // Demand-signal queuing is best-effort -- never fails the review publish itself.
      console.error(`queueUnresolvedIngredients: failed for "${rawName}"`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// ORCHESTRATOR: ties researcher (Firecrawl) -> analyst/writer (Gemini) -> memory +
// publication (Supabase) together for one run. Invoked by Vercel Cron daily, or
// manually with the same Authorization: Bearer $CRON_SECRET header.
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not configured for this Vercel project -- the product review pipeline cannot run until an admin adds it.`,
    );
  }
  return value;
}

interface SiteRunOutcome {
  site: string;
  status: "published" | "skipped" | "error";
  reason?: string;
  reviewId?: string;
}

/** Publishes at most one review from a researched source page. Returns null (not an
 *  error) when Gemini quota is exhausted or the model's output doesn't clear the bar
 *  for publication -- the caller moves on to the next source rather than failing. */
async function publishOneReview(
  admin: SupabaseAdmin,
  site: SourceSite,
  page: FirecrawlPage,
  geminiApiKey: string,
  geminiModel: string,
): Promise<{ reviewId: string } | null> {
  if (!(await withinDailyQuota(admin, "gemini", GEMINI_DAILY_LIMIT))) return null;
  if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) {
    await sleep(6000);
    if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) return null;
  }

  let fields: GeneratedReviewFields;
  try {
    fields = await generateReview(`${page.title}\n\n${page.markdown}`, geminiApiKey, geminiModel);
    await recordApiUsage(admin, "gemini", site.url, true);
  } catch (err) {
    await recordApiUsage(admin, "gemini", site.url, false);
    throw err;
  }

  if (!fields.product_name.trim() || !fields.brand.trim()) return null;

  const baseId = slugify(`${fields.brand}-${fields.product_name}`) || slugify(fields.product_name) || "sa-skincare-review";
  let id = baseId;
  const { data: existingById } = await admin.from("ai_generated_product_reviews").select("id").eq("id", id).maybeSingle();
  if (existingById) id = `${baseId}-${Date.now().toString(36).slice(-4)}`;

  const retailers = [
    {
      retailer: site.retailerHint,
      price_zar: fields.local_price_zar,
      in_stock: true,
      url: page.url,
    },
  ];

  const { error: insertError } = await admin.from("ai_generated_product_reviews").insert({
    id,
    product_name: fields.product_name,
    brand: fields.brand,
    local_price_zar: fields.local_price_zar,
    where_to_buy: site.retailerHint,
    category: fields.category,
    skin_type_match: fields.skin_type_match,
    score_efficacy: fields.score_efficacy,
    score_value: fields.score_value,
    score_texture: fields.score_texture,
    score_climate: fields.score_climate,
    verdict: fields.verdict,
    key_ingredients: fields.key_ingredients,
    retailers,
    origin: site.origin,
    source_url: page.url,
    source_type: site.sourceType,
    is_sponsored: site.isSponsored,
    generated_by: "gemini",
    data_quality_status: "unverified",
  });

  if (insertError) throw new Error(`Insert failed for "${id}": ${insertError.message}`);

  await queueUnresolvedIngredients(admin, fields.key_ingredients, id);

  return { reviewId: id };
}

/** Bumps the current Spotlight edition/methodology version once the total published
 *  review count (static catalogue baseline + this table) crosses the next multiple of
 *  SPOTLIGHT_BUMP_INTERVAL since the current edition's own snapshot. Never touches
 *  src/data/spotlight.ts's hand-written brandEditorial narrative -- purely mechanical. */
async function maybeBumpSpotlight(admin: SupabaseAdmin): Promise<boolean> {
  const { count } = await admin.from("ai_generated_product_reviews").select("id", { count: "exact", head: true });
  const totalReviews = STATIC_REVIEW_BASELINE + (count ?? 0);

  const { data: current } = await admin
    .from("spotlight_editions")
    .select("id, edition_label, methodology_version, review_count_at_snapshot")
    .eq("is_current", true)
    .maybeSingle();
  if (!current) return false;

  const snapshot = current.review_count_at_snapshot as number;
  const nextThreshold = Math.floor(snapshot / SPOTLIGHT_BUMP_INTERVAL) * SPOTLIGHT_BUMP_INTERVAL + SPOTLIGHT_BUMP_INTERVAL;
  if (totalReviews < nextThreshold) return false;

  const versionMatch = /^(.*v)(\d+)\.(\d+)$/.exec(current.methodology_version as string);
  const nextVersion = versionMatch ? `${versionMatch[1]}${versionMatch[2]}.${Number(versionMatch[3]) + 1}` : `${current.methodology_version} v2`;
  const nextLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  await admin.from("spotlight_editions").update({ is_current: false }).eq("id", current.id as string);
  const { error: insertError } = await admin.from("spotlight_editions").insert({
    edition_label: nextLabel,
    methodology_version: nextVersion,
    review_count_at_snapshot: totalReviews,
    is_current: true,
  });
  if (insertError) throw new Error(`Spotlight bump insert failed: ${insertError.message}`);
  return true;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method && req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const provided = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (provided !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  let geminiApiKey: string;
  let firecrawlApiKey: string;
  let serviceRoleKey: string;
  try {
    geminiApiKey = requireEnv("GEMINI_API_KEY");
    firecrawlApiKey = requireEnv("FIRECRAWL_API_KEY");
    serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (err) {
    res.status(500).json({ configured: false, error: (err as Error).message });
    return;
  }

  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const admin = createClient(SUPABASE_URL, serviceRoleKey, { auth: { persistSession: false } }) as SupabaseAdmin;

  const results: SiteRunOutcome[] = [];
  let published = 0;
  let firecrawlCallsMade = 0;

  // SOURCE_SITES is deliberately ordered 4 South-African sources before the 1 global/
  // sponsored source -- for DAILY_REVIEW_CAP=3, trying sites in this order already
  // satisfies the >=70% SA-brand editorial share target without needing a separate
  // live-rebalancing mechanism; the global source is only reached once SA sources have
  // no new, unpublished product to offer.
  for (const site of SOURCE_SITES) {
    if (published >= DAILY_REVIEW_CAP) {
      results.push({ site: site.url, status: "skipped", reason: "Daily review cap reached" });
      continue;
    }

    try {
      const runBudgetRemaining = firecrawlCallsMade < MAX_FIRECRAWL_SOURCES_PER_RUN;
      const research = await researchSource(admin, site, firecrawlApiKey, runBudgetRemaining);
      if (research.madeRealCall) firecrawlCallsMade += 1;

      if (research.skippedReason) {
        results.push({ site: site.url, status: "skipped", reason: research.skippedReason });
        continue;
      }
      if (research.pages.length === 0) {
        results.push({ site: site.url, status: "skipped", reason: "No usable source pages found" });
        continue;
      }

      let publishedThisSite = false;
      for (const page of research.pages) {
        if (published >= DAILY_REVIEW_CAP) break;

        // Dedupe on source_url BEFORE spending a Gemini call.
        const { data: existing } = await admin.from("ai_generated_product_reviews").select("id").eq("source_url", page.url).maybeSingle();
        if (existing) continue;

        const outcome = await publishOneReview(admin, site, page, geminiApiKey, geminiModel);
        if (outcome) {
          published += 1;
          results.push({ site: page.url, status: "published", reviewId: outcome.reviewId });
          publishedThisSite = true;
          break; // one review per source site per run
        }
      }

      if (!publishedThisSite) {
        results.push({
          site: site.url,
          status: "skipped",
          reason: "No new, unpublished product found (or Gemini quota exhausted)",
        });
      }
    } catch (err) {
      results.push({ site: site.url, status: "error", reason: (err as Error).message });
    }
  }

  let spotlightBumped = false;
  try {
    spotlightBumped = await maybeBumpSpotlight(admin);
  } catch (err) {
    // A Spotlight edition bump is a nice-to-have -- never fail the whole run over it.
    console.error("maybeBumpSpotlight failed", err);
  }

  res.status(200).json({
    configured: true,
    publishedCount: published,
    firecrawlCallsMade,
    spotlightBumped,
    results,
  });
}
