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
 * Migrated from api/product-review-sync.ts (Vercel Cron) to this Supabase Edge
 * Function on 2026-09-22.
 *
 * Auth accepts EITHER of:
 *   - `x-cron-secret: <value>` checked against the `PRODUCT_REVIEW_CRON_SECRET`
 *     Supabase Edge Function secret.
 *   - A Supabase Auth JWT for a user holding the `admin` role.
 *
 * Required Supabase Edge Function secrets: GEMINI_API_KEY_REVIEWS, FIRECRAWL_API_KEY,
 * PRODUCT_REVIEW_CRON_SECRET. SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are reserved.
 *
 * Manual backfill (new reviews): POST with ?backfillDate=YYYY-MM-DD publishes up to
 * DAILY_REVIEW_CAP reviews dated that day instead of today.
 *
 * SEO/structured supplemental fields (2026-09-22 follow-up -- see
 * supabase/migrations/20260922120000_add_seo_review_schema_fields.sql): every newly
 * published review now also gets a second, best-effort Gemini call
 * (generateSupplementalFields(), SUPPLEMENT_SCHEMA/SUPPLEMENT_INSTRUCTIONS) grounded
 * in the exact same source text, filling seo_intro/review_body/product_size/
 * product_format/country_of_origin/am_pm_usage/skin_concerns/benefits/cautions/faq.
 * It can never fail or block a review's publish -- that already committed by the time
 * this runs. A handful of the migration's columns (seo_title, seo_description,
 * key_ingredients_structured, related_ingredients_slugs, primary_image,
 * gallery_images, related_reviews, related_knowledge_articles, community_rating,
 * community_rating_count) are deliberately never written here -- see
 * generateSupplementalFields()'s own header comment for why (each already has a live,
 * more-accurate equivalent in the frontend).
 *
 * Manual backfill (existing reviews): POST/GET with ?backfillMissingFields=true (same
 * auth) processes up to BACKFILL_BATCH_SIZE rows published before this feature shipped
 * -- see runBackfillPass(). Independent of the daily review cap since it only UPDATEs
 * already-published rows. Re-invoke repeatedly to work through the full backlog; each
 * call picks up wherever the previous one left off (selection is `seo_intro IS NULL`,
 * oldest published_date first).
 *
 * Structured-data / Rich-Results fields (2026-09-22, second follow-up): seo_title,
 * seo_description, key_ingredients_structured, related_ingredients_slugs,
 * primary_image, related_reviews, community_rating/community_rating_count and
 * related_knowledge_articles are now also populated for every new review and every
 * backfilled row -- previously deliberately left null (see generateSupplementalFields
 * ()'s header comment for the original reasoning: each already had a live,
 * more-accurate client-side equivalent). Superseded per an explicit product decision
 * to optimise for Google Rich Results/structured-data validation, which needs these
 * present in the row Google actually reads, not only computed after client hydration.
 * Every one of the seven is real: computeSeoTitleDescription() is a deterministic
 * mirror of src/lib/seo-config.ts (kept in sync manually -- update both if that file's
 * formula changes), resolveKeyIngredients()/computeRelatedReviews()/
 * computeCommunityRating() are live RPC/SQL reads, resolvePrimaryImage() only ever
 * uses a real review_images row or a real Pexels search result (writing the latter
 * back into review_images too, so the client's own useReviewImages() picks up the
 * same real image rather than diverging), and computeRelatedKnowledgeArticles()
 * matches against KNOWLEDGE_HUB_INDEX, a generated slug/question/category/tags-only
 * snapshot of src/data/faq.ts's real entries (see that const's own comment for the
 * regeneration note). primary_image stays null for a review with neither a
 * review_images row nor a configured PEXELS_API_KEY secret -- a documented gap, not a
 * silent failure -- and community_rating/community_rating_count are a snapshot
 * refreshed at each publish/backfill pass, not a live subscription.
 *
 * OpenHaus marketplace reviews are now sponsored (2026-09-22, same follow-up):
 * candidate.isSponsored for the openhaus_marketplace pool flipped from false to true
 * -- SkinLabs marks up and profits from OpenHaus sales (see src/lib/marketplace/
 * pricing.ts), so a review sourced from it carries the same disclosable commercial
 * interest as the existing Timeless placements. Applies going forward automatically;
 * the 31 already-published openhaus_marketplace rows needed a one-time direct SQL
 * UPDATE (is_sponsored wasn't part of either backfill pass's own column set).
 *
 * Manual backfill (structured-data only): POST/GET with ?backfillStructuredData=true
 * (same auth) processes up to 15 rows missing seo_title -- see
 * runStructuredDataBackfillPass(). No Gemini/Firecrawl call at all, so independent of
 * both the daily review cap and the Gemini/Firecrawl quota; safe to re-invoke back to
 * back. Exists because ?backfillMissingFields=true's own selection (`seo_intro IS
 * NULL`) never re-visits a row it already finished, so a row backfilled before the
 * structured-data fields existed would otherwise never get them.
 *
 * Manual backfill (primary_image only): POST/GET with ?backfillPrimaryImage=true
 * (same auth) processes up to 25 rows missing primary_image -- see
 * runPrimaryImageBackfillPass(). For rows that already have seo_title set (so
 * ?backfillStructuredData=true no longer selects them) but never got an image because
 * PEXELS_API_KEY wasn't configured/valid at the time. Single-column update, safe to
 * re-invoke back to back.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callGeminiWithFallback,
  GeminiFatalError,
  GeminiAllModelsExhaustedError,
  type GeminiAttemptLog,
} from "../_shared/pipelines/geminiFallback.ts";
import { scanComplianceFlags } from "../_shared/pipelines/complianceTerms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const DAILY_REVIEW_CAP = 3;
const MAX_FIRECRAWL_SOURCES_PER_RUN = 5;
const SA_SHARE_TARGET = 0.7;
const SPOTLIGHT_BUMP_INTERVAL = 25;
const STATIC_REVIEW_BASELINE = 160;
const BACKFILL_BATCH_SIZE = 6;
const MAX_FIRECRAWL_BACKFILL_PER_RUN = 3;

const FIRECRAWL_DAILY_LIMIT = Number(Deno.env.get("FIRECRAWL_DAILY_LIMIT")) || 20;
const GEMINI_DAILY_LIMIT = Number(Deno.env.get("GEMINI_DAILY_LIMIT")) || 100;
const GEMINI_PER_MINUTE_LIMIT = Number(Deno.env.get("GEMINI_PER_MINUTE_LIMIT")) || 10;

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

function parseReviewResponse(text: string): GeneratedReviewFields {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) throw new Error("Gemini response was not a JSON object");
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

function qaProductReview(fields: GeneratedReviewFields): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!fields.product_name || fields.product_name.trim().length < 2) reasons.push("missing/too-short product_name");
  if (!fields.brand || fields.brand.trim().length < 2) reasons.push("missing/too-short brand");
  if (!(fields.local_price_zar > 0)) reasons.push("non-positive local_price_zar");
  if (!(KNOWN_CATEGORIES as readonly string[]).includes(fields.category)) reasons.push("category outside known enum");
  if (!fields.verdict || fields.verdict.trim().length < 20) reasons.push("verdict too short to be a real review");
  if (fields.key_ingredients.length === 0) reasons.push("no key_ingredients returned");
  for (const [label, score] of [
    ["score_efficacy", fields.score_efficacy],
    ["score_value", fields.score_value],
    ["score_texture", fields.score_texture],
    ["score_climate", fields.score_climate],
  ] as const) {
    if (!(score >= 0 && score <= 10)) reasons.push(`${label} out of 0-10 range`);
  }
  if (/\bclinically proven\b|\bdermatologist recommended\b|\bguaranteed results\b/i.test(fields.verdict)) {
    reasons.push("verdict contains an unverifiable superlative/clinical claim");
  }
  for (const flag of scanComplianceFlags(fields.verdict)) reasons.push(flag);
  return { passed: reasons.length === 0, reasons };
}

interface SupplementalFields {
  seo_intro: string;
  review_body: string;
  product_size: string | null;
  product_format: string | null;
  country_of_origin: string | null;
  am_pm_usage: string | null;
  skin_concerns: string[];
  benefits: string[];
  cautions: string[];
  faq: { question: string; answer: string }[];
}

const SUPPLEMENT_SCHEMA = {
  type: "object",
  properties: {
    seo_intro: { type: "string" },
    review_body: { type: "string" },
    product_size: { type: "string", nullable: true },
    product_format: { type: "string", nullable: true },
    country_of_origin: { type: "string", nullable: true },
    am_pm_usage: { type: "string", nullable: true },
    skin_concerns: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    cautions: { type: "array", items: { type: "string" } },
    faq: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, answer: { type: "string" } },
        required: ["question", "answer"],
      },
    },
  },
  required: ["seo_intro", "review_body", "skin_concerns", "benefits", "cautions", "faq"],
} as const;

const SUPPLEMENT_INSTRUCTIONS = `You are extending an already-published SkinLabs South Africa product review with
additional structured content for SEO and shopper reference. The core verdict and
scores are already finalised and given to you below for context -- never contradict
them, and never invent a fact (size, origin, usage timing, benefit, caution) that is
not stated in the supplied source material.

seo_intro: one or two plain sentences (roughly 30-60 words) introducing the product by
name and brand, suitable as a page lede. No markdown, no exclamation marks, no emoji,
no superlatives the source doesn't support.
review_body: a 120-220 word expanded write-up consistent with the given verdict -- more
detail on texture, performance and value, still grounded strictly in the source. Must
never contradict the verdict.
product_size / product_format / country_of_origin: only if explicitly stated in the
source (e.g. "50ml", "pump bottle", "made in South Africa") -- null if not stated.
Never guess a physical fact.
am_pm_usage: a short, real usage-cadence note taken strictly from the source's own
instructions (e.g. "AM and PM", "PM only, 2-3x weekly") -- null if the source gives no
timing at all.
skin_concerns: real concerns the source says this product addresses (0-6 short items).
benefits: real claimed benefits stated in the source (0-6 short phrases).
cautions: real cautions/warnings actually stated in the source only -- pregnancy/
breastfeeding notes, patch-test advice, ingredient-interaction warnings, sensitivity
notes. Empty array if the source states none -- never invent one to seem thorough.
faq: 0-4 genuine question/answer pairs a shopper would realistically ask, answered only
from the source and the given verdict/ingredients. Never phrase an answer as a
diagnosis or treatment claim.`;

function parseSupplementalResponse(text: string): SupplementalFields {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) throw new Error("Gemini response was not a JSON object");
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const arr = (v: unknown, max: number, itemMax = 120) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max).map((x) => x.slice(0, itemMax)) : [];
  const faqRaw = Array.isArray(parsed.faq) ? parsed.faq : [];
  return {
    seo_intro: str(parsed.seo_intro, 300) ?? "",
    review_body: str(parsed.review_body, 2000) ?? "",
    product_size: str(parsed.product_size, 60),
    product_format: str(parsed.product_format, 60),
    country_of_origin: str(parsed.country_of_origin, 60),
    am_pm_usage: str(parsed.am_pm_usage, 80),
    skin_concerns: arr(parsed.skin_concerns, 6, 60),
    benefits: arr(parsed.benefits, 6, 100),
    cautions: arr(parsed.cautions, 4, 150),
    faq: faqRaw
      .filter((f: unknown): f is { question?: unknown; answer?: unknown } => typeof f === "object" && f !== null)
      .slice(0, 4)
      .map((f) => ({ question: String(f.question ?? "").slice(0, 150), answer: String(f.answer ?? "").slice(0, 400) }))
      .filter((f) => f.question.length > 5 && f.answer.length > 5),
  };
}

function qaSupplementalFields(fields: SupplementalFields): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!fields.seo_intro || fields.seo_intro.trim().length < 15) reasons.push("seo_intro missing/too short");
  if (!fields.review_body || fields.review_body.trim().length < 60) reasons.push("review_body missing/too short");
  const combinedProse = `${fields.seo_intro} ${fields.review_body} ${fields.faq.map((f) => f.answer).join(" ")}`;
  if (/\bclinically proven\b|\bdermatologist recommended\b|\bguaranteed results\b/i.test(combinedProse)) {
    reasons.push("supplemental content contains an unverifiable superlative/clinical claim");
  }
  for (const flag of scanComplianceFlags(fields.seo_intro)) reasons.push(`seo_intro: ${flag}`);
  for (const flag of scanComplianceFlags(fields.review_body)) reasons.push(`review_body: ${flag}`);
  for (const item of fields.faq) {
    for (const flag of scanComplianceFlags(item.answer)) reasons.push(`faq answer: ${flag}`);
  }
  return { passed: reasons.length === 0, reasons };
}

async function generateSupplementalFields(args: {
  geminiKey: string;
  modelChain: string[];
  sourceText: string;
  context: { productName: string; brand: string; category: string; verdict: string; keyIngredients: string[] };
  onAttempt: (log: GeminiAttemptLog) => void | Promise<void>;
}): Promise<{ fields: SupplementalFields; modelUsed: string; rejectionReasons?: string[] } | { error: string }> {
  const contextBlock = `Product: ${args.context.productName}
Brand: ${args.context.brand}
Category: ${args.context.category}
Already-published verdict (do not contradict): ${args.context.verdict}
Key ingredients: ${args.context.keyIngredients.join(", ")}

Source material:
${args.sourceText}`;

  try {
    const { data, modelUsed } = await callGeminiWithFallback({
      apiKey: args.geminiKey,
      models: args.modelChain,
      systemInstruction: SUPPLEMENT_INSTRUCTIONS,
      userContent: contextBlock,
      responseSchema: SUPPLEMENT_SCHEMA,
      temperature: 0.4,
      parse: parseSupplementalResponse,
      onAttempt: args.onAttempt,
    });
    const qa = qaSupplementalFields(data);
    if (!qa.passed) return { fields: data, modelUsed, rejectionReasons: qa.reasons };
    return { fields: data, modelUsed };
  } catch (err) {
    return { error: String(err).slice(0, 200) };
  }
}

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

const cacheKeyFor = (site: SourceSite): string =>
  site.sourceType === "faithful_to_nature" ? `scrape:${site.url}` : `search:${new URL(site.url).hostname.replace(/^www\./, "")}`;

interface ResearchResult {
  pages: FirecrawlPage[];
  madeRealCall: boolean;
  skippedReason?: string;
}

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

interface MarketplaceProductRow {
  slug: string;
  name: string;
  description: string;
  marked_up_price_zar: number;
  category: string;
  key_actives: string[] | null;
  concern: string[] | null;
  brand: { name: string } | null;
}

interface SearchIngredientRow {
  id: string;
  slug: string;
  common_name: string | null;
  inci_name: string | null;
}

/** Same alias-aware `search_ingredients` RPC the Ingredient Checker's combobox and
 *  src/lib/ingredientResolution.ts use client-side -- only ever a confident, exact
 *  (case-insensitive) common_name/inci_name match, never a fuzzy top-result guess,
 *  since a wrong link is worse than no link. Returns null on no match. */
async function matchIngredient(admin: SupabaseAdmin, rawName: string): Promise<SearchIngredientRow | null> {
  const { data } = await admin.rpc("search_ingredients", { p_search: rawName, p_page: 1, p_per_page: 5 });
  const rows = (data ?? []) as SearchIngredientRow[];
  const lower = rawName.trim().toLowerCase();
  return rows.find((row) => row.common_name?.toLowerCase() === lower || row.inci_name?.toLowerCase() === lower) ?? null;
}

async function queueUnresolvedIngredients(admin: SupabaseAdmin, keyIngredients: string[], reviewId: string) {
  for (const rawName of keyIngredients) {
    const normalized = rawName.trim().toLowerCase();
    if (!normalized) continue;
    try {
      if (await matchIngredient(admin, rawName)) continue;
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
      console.error(`queueUnresolvedIngredients: failed for "${rawName}"`, err);
    }
  }
}

/** key_ingredients_structured / related_ingredients_slugs -- see
 *  supabase/migrations/20260922120000_add_seo_review_schema_fields.sql. Real,
 *  resolved-or-not-linked-at-all data only, via the same resolver as
 *  src/lib/ingredientResolution.ts, never a fabricated slug or description. */
async function resolveKeyIngredients(
  admin: SupabaseAdmin,
  keyIngredients: string[],
): Promise<{ structured: { name: string; slug: string | null; resolved: boolean }[]; slugs: string[] }> {
  const structured: { name: string; slug: string | null; resolved: boolean }[] = [];
  const slugs: string[] = [];
  for (const name of keyIngredients) {
    const match = await matchIngredient(admin, name);
    structured.push({ name, slug: match?.slug ?? null, resolved: Boolean(match) });
    if (match) slugs.push(match.slug);
  }
  return { structured, slugs };
}

// ---------------------------------------------------------------------------
// STRUCTURED-DATA / RICH-RESULTS fields (2026-09-22 follow-up). These four helpers
// populate seo_title, seo_description, key_ingredients_structured/
// related_ingredients_slugs (resolveKeyIngredients above), primary_image,
// related_reviews, related_knowledge_articles and community_rating/
// community_rating_count directly in the DB at publish/backfill time, so a crawler
// (or anything reading ai_generated_product_reviews outside the live app) sees real
// structured data without needing client-side JS to compute it. Each one is either a
// pure deterministic mirror of an existing frontend formula (kept in sync manually,
// same "duplicate into the edge function, note it" precedent already used for
// marketplace pricing.ts) or a real, live SQL read -- never a Gemini guess.
// ---------------------------------------------------------------------------

const SEO_BRAND = "SkinLabs®";

/** Mirrors src/lib/seo-config.ts's productReviewTitle()/productReviewDescription()
 *  EXACTLY -- if those change, update this too. Deliberately not Gemini-generated:
 *  a deterministic formula over already-known real fields has zero fabrication risk
 *  and guarantees every review gets a correctly-formatted title/description, not
 *  just the ones a model happens to phrase well. */
function computeSeoTitleDescription(args: {
  productName: string;
  brand: string;
  score: number;
  keyIngredients: string[];
  skinTypes: string[];
}): { title: string; description: string } {
  const title = `${args.brand} ${args.productName} Review | ${SEO_BRAND}`;

  const parts: string[] = [`Independent review of ${args.productName} by ${args.brand}`];
  if (args.score) parts.push(`(${args.score}/10)`);
  if (args.keyIngredients.length > 0) parts.push(`— ${args.keyIngredients.slice(0, 2).join(", ")}`);
  if (args.skinTypes.length > 0) parts.push(`for ${args.skinTypes.slice(0, 2).join(" & ")} skin`);
  parts.push("in South African climate.");
  const joined = parts.join(" ");
  const description = joined.length > 160 ? `${joined.slice(0, 157)}...` : joined;

  return { title, description };
}

/** Real, live rows only -- other published reviews sharing this one's category,
 *  most recent first. Mirrors the same relatedReviews computation ProductReview.tsx
 *  already does client-side (a live category filter), cached here for SSR/
 *  structured-data availability -- kept fresh by re-running at every backfill pass. */
async function computeRelatedReviews(
  admin: SupabaseAdmin,
  category: string,
  excludeId: string,
): Promise<{ id: string; product_name: string; brand: string }[]> {
  const { data } = await admin
    .from("ai_generated_product_reviews")
    .select("id, product_name, brand")
    .eq("category", category)
    .neq("id", excludeId)
    .order("published_date", { ascending: false })
    .limit(3);
  return (data ?? []) as { id: string; product_name: string; brand: string }[];
}

/** Real aggregate from review_ratings -- the same table ProductReview.tsx's own
 *  avgRating/comments state reads client-side. A cached snapshot, refreshed at
 *  publish/backfill time; genuinely 0/null (not fabricated) until a member rates. */
async function computeCommunityRating(
  admin: SupabaseAdmin,
  reviewId: string,
): Promise<{ rating: number | null; count: number }> {
  const { data } = await admin.from("review_ratings").select("rating").eq("review_id", reviewId);
  const ratings = (data ?? []) as { rating: number }[];
  if (ratings.length === 0) return { rating: null, count: 0 };
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { rating: Math.round(avg * 10) / 10, count: ratings.length };
}

/** Real image only -- checks review_images (the same table src/hooks/
 *  use-review-images.ts reads client-side) first; if this review has none yet and a
 *  PEXELS_API_KEY Supabase secret is configured, does one real Pexels search and
 *  writes the result INTO review_images (not just the primary_image cache column) so
 *  the existing client-side image-resolution chain picks it up too, rather than
 *  creating a second, divergent image source. Returns null (never fabricates a URL)
 *  if neither source has anything -- most AI-generated reviews will stay null here
 *  until a human sets PEXELS_API_KEY, a known, documented gap (see this file's own
 *  header comment). */
async function resolvePrimaryImage(
  admin: SupabaseAdmin,
  reviewId: string,
  category: string,
  brand: string,
): Promise<string | null> {
  const { data: existing } = await admin.from("review_images").select("image_url").eq("review_id", reviewId).maybeSingle();
  if (existing?.image_url) return existing.image_url;

  const pexelsKey = Deno.env.get("PEXELS_API_KEY");
  if (!pexelsKey) return null;

  try {
    const query = `${brand} ${category} skincare product bottle`;
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: pexelsKey },
    });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as {
      photos?: { src?: { large?: string; original?: string }; alt?: string; photographer?: string; photographer_url?: string }[];
    } | null;
    const photo = payload?.photos?.[0];
    const url = photo?.src?.large || photo?.src?.original;
    if (!url) return null;

    await admin.from("review_images").upsert(
      {
        review_id: reviewId,
        image_url: url,
        alt: photo?.alt || `${category} product photography`,
        credit_name: photo?.photographer || "Pexels Contributor",
        credit_url: photo?.photographer_url || "https://www.pexels.com",
      },
      { onConflict: "review_id" },
    );
    return url;
  } catch {
    return null;
  }
}

/** Slim {slug, question, category, tags} extract of src/data/faq.ts's faqEntries
 *  (question/category/tags only -- the fields significantWords()/relatedKnowledge
 *  HubEntries() in src/lib/content-graph.ts actually match on; answer/evidence/
 *  relatedQuestions/relatedPages are dropped since nothing here needs them). The
 *  full file can't be imported into this Deno function (it pulls in src/data/
 *  plans.ts and isn't published as its own module), so this is a generated, manually
 *  kept-in-sync snapshot -- same duplication precedent as pricing.ts elsewhere in
 *  this codebase. Regenerate by re-extracting slug/question/category/tags from every
 *  entry in src/data/faq.ts if that file's entries change meaningfully. */
const KNOWLEDGE_HUB_INDEX_DATA: { slug: string; question: string; category: string; tags: string[] }[] = [
  { slug: "what-is-skinlabs", question: "What is SkinLabs?", category: "about", tags: ["skinlabs", "platform", "overview"] },
  { slug: "is-skinlabs-only-for-south-africa", question: "Is SkinLabs only for South African users?", category: "about", tags: ["south africa", "eligibility"] },
  { slug: "how-does-the-ai-formulator-work", question: "How does SKYNN AI work?", category: "about", tags: ["ai formulator", "skynn ai", "quiz", "how it works"] },
  { slug: "is-skinlabs-free-to-use", question: "Is SkinLabs free to use?", category: "about", tags: ["free", "pricing", "membership"] },
  { slug: "does-skinlabs-sell-products", question: "Do you sell skincare products?", category: "about", tags: ["retailer", "independence", "commercial relationships"] },
  { slug: "what-skin-types-do-you-cater-to", question: "What skin types do you cater to?", category: "skin-basics", tags: ["skin type", "oily", "dry", "combination", "sensitive"] },
  { slug: "how-do-i-know-my-skin-type", question: "How do I know my skin type?", category: "skin-basics", tags: ["skin type", "self assessment"] },
  { slug: "what-causes-dry-skin-in-gauteng", question: "What causes dry skin in Gauteng?", category: "skin-basics", tags: ["gauteng", "dry skin", "altitude", "TEWL"] },
  { slug: "what-is-niacinamide-and-what-does-it-do", question: "What is niacinamide and what does it do?", category: "ingredients", tags: ["niacinamide", "vitamin b3", "pores", "oil control", "pigmentation"] },
  { slug: "are-retinoids-safe-for-all-skin-types", question: "Are retinoids safe for all skin types?", category: "ingredients", tags: ["retinoids", "retinol", "tretinoin", "adapalene", "anti-aging"] },
  { slug: "whats-the-difference-between-ahas-and-bhas", question: "What's the difference between AHAs and BHAs?", category: "ingredients", tags: ["aha", "bha", "salicylic acid", "glycolic acid", "exfoliation"] },
  { slug: "do-i-really-need-vitamin-c-serum", question: "Do I really need vitamin C serum?", category: "ingredients", tags: ["vitamin c", "l-ascorbic acid", "antioxidant", "brightening"] },
  { slug: "what-are-ceramides", question: "What are ceramides?", category: "ingredients", tags: ["ceramides", "barrier", "moisture"] },
  { slug: "is-hyaluronic-acid-good-for-dry-skin", question: "Is hyaluronic acid good for dry skin?", category: "ingredients", tags: ["hyaluronic acid", "humectant", "hydration"] },
  { slug: "are-parabens-and-sulfates-bad", question: "Are parabens and sulfates bad?", category: "ingredients", tags: ["parabens", "sulfates", "preservatives", "clean beauty"] },
  { slug: "whats-the-deal-with-snail-mucin", question: "What's the deal with snail mucin?", category: "ingredients", tags: ["snail mucin", "hydration", "soothing"] },
  { slug: "can-you-help-with-acne-prone-skin", question: "Can you help with acne-prone skin?", category: "concerns", tags: ["acne", "breakouts", "salicylic acid", "benzoyl peroxide"] },
  { slug: "i-have-hyperpigmentation-can-you-help", question: "I have hyperpigmentation. Can you help?", category: "concerns", tags: ["hyperpigmentation", "dark spots", "post-inflammatory", "melanin-rich skin"] },
  { slug: "what-about-sensitive-or-reactive-skin", question: "What about sensitive or reactive skin?", category: "concerns", tags: ["sensitive skin", "reactive skin", "barrier", "fragrance-free"] },
  { slug: "can-skinlabs-help-with-aging-skin-concerns", question: "Can SkinLabs help with aging skin concerns?", category: "concerns", tags: ["aging", "wrinkles", "retinoids", "peptides", "antioxidants"] },
  { slug: "whats-a-basic-skincare-routine", question: "What's a basic skincare routine?", category: "routines", tags: ["basic routine", "cleanser", "moisturiser", "sunscreen"] },
  { slug: "should-i-use-different-products-in-summer-vs-winter", question: "Should I use different products in summer vs. winter?", category: "routines", tags: ["seasonal", "summer", "winter", "moisturiser"] },
  { slug: "in-what-order-should-i-apply-my-products", question: "In what order should I apply my products?", category: "routines", tags: ["order", "layering", "am pm routine"] },
  { slug: "how-long-before-i-see-results", question: "How long before I see results?", category: "routines", tags: ["results", "timeline", "patience"] },
  { slug: "can-i-use-retinol-and-vitamin-c-together", question: "Can I use retinol and vitamin C together?", category: "routines", tags: ["retinol", "vitamin c", "combining actives"] },
  { slug: "whats-the-best-time-to-do-my-skincare-routine", question: "What's the best time to do my skincare routine?", category: "routines", tags: ["am routine", "pm routine", "timing"] },
  { slug: "how-do-i-know-if-im-over-exfoliating", question: "How do I know if I'm over-exfoliating?", category: "routines", tags: ["over-exfoliating", "barrier damage", "purging"] },
  { slug: "do-i-need-a-toner", question: "Do I need a toner?", category: "routines", tags: ["toner", "essence"] },
  { slug: "do-i-need-sunscreen-in-south-africa", question: "Do I need sunscreen in South Africa?", category: "sun-protection", tags: ["sunscreen", "spf", "uv", "south africa"] },
  { slug: "what-spf-should-i-use", question: "What SPF should I use?", category: "sun-protection", tags: ["spf", "reapplication", "sunscreen amount"] },
  { slug: "chemical-vs-mineral-sunscreen-which-is-better", question: "Chemical vs. mineral sunscreen — which is better?", category: "sun-protection", tags: ["chemical sunscreen", "mineral sunscreen", "zinc oxide"] },
  { slug: "do-i-need-sunscreen-indoors", question: "Do I need sunscreen indoors?", category: "sun-protection", tags: ["indoor sunscreen", "uva", "windows"] },
  { slug: "can-i-use-makeup-with-spf-instead", question: "Can I use makeup with SPF instead?", category: "sun-protection", tags: ["makeup spf", "foundation"] },
  { slug: "what-sunscreens-are-good-for-oily-skin", question: "What sunscreens are good for oily skin?", category: "sun-protection", tags: ["oily skin", "sunscreen", "mattifying"] },
  { slug: "how-does-south-african-climate-affect-my-skincare-routine", question: "How does South African climate affect my skincare routine?", category: "south-africa", tags: ["climate", "humidity", "highveld", "coastal"] },
  { slug: "what-skincare-ingredients-work-best-for-south-african-skin-tones", question: "What skincare ingredients work best for South African skin tones?", category: "south-africa", tags: ["melanin-rich skin", "skin tone", "hyperpigmentation"] },
  { slug: "are-international-brands-sold-in-sa-authentic", question: "Are international brands sold in SA authentic?", category: "south-africa", tags: ["authenticity", "counterfeit", "retailers"] },
  { slug: "can-i-use-overseas-skincare-tips-in-south-africa", question: "Can I use overseas skincare tips in South Africa?", category: "south-africa", tags: ["overseas advice", "tiktok", "social media skincare"] },
  { slug: "whats-the-best-skincare-for-johannesburgs-climate", question: "What's the best skincare for Johannesburg's climate?", category: "south-africa", tags: ["johannesburg", "highveld", "altitude"] },
  { slug: "are-there-dermatologists-i-can-consult-in-south-africa", question: "Are there dermatologists I can consult in South Africa?", category: "south-africa", tags: ["dermatologist", "consultation", "practitioner"] },
  { slug: "what-south-african-skincare-brands-do-you-recommend", question: "What South African skincare brands do you recommend?", category: "products", tags: ["sa brands", "local skincare", "recommendations"] },
  { slug: "where-can-i-buy-the-products-you-recommend", question: "Where can I buy the products you recommend?", category: "products", tags: ["retailers", "where to buy"] },
  { slug: "are-drugstore-products-as-good-as-expensive-ones", question: "Are drugstore products as good as expensive ones?", category: "products", tags: ["affordable skincare", "value", "drugstore"] },
  { slug: "whats-a-good-affordable-vitamin-c-serum-in-sa", question: "What's a good affordable vitamin C serum in SA?", category: "products", tags: ["vitamin c", "affordable", "budget"] },
  { slug: "best-moisturizer-for-dry-skin-under-r200", question: "Best moisturizer for dry skin under R200?", category: "products", tags: ["moisturiser", "dry skin", "budget"] },
  { slug: "where-can-i-find-the-ordinary-products-in-sa", question: "Where can I find The Ordinary products in SA?", category: "products", tags: ["the ordinary", "stock", "availability"] },
  { slug: "how-much-do-recommended-products-typically-cost", question: "How much do recommended products typically cost?", category: "products", tags: ["budget", "cost", "pricing"] },
  { slug: "what-payment-methods-do-sa-retailers-accept", question: "What payment methods do SA retailers accept?", category: "products", tags: ["payment", "retailers", "instalments"] },
  { slug: "how-does-shipping-and-delivery-work", question: "How does shipping and delivery work for products you recommend?", category: "products", tags: ["shipping", "delivery"] },
  { slug: "what-is-your-return-policy", question: "What's the return policy on skincare products?", category: "products", tags: ["returns", "refunds"] },
  { slug: "what-if-i-have-an-allergic-reaction-to-a-product", question: "What if I have an allergic reaction to a product?", category: "products", tags: ["allergic reaction", "irritation", "safety"] },
  { slug: "do-you-have-a-subscription-service", question: "Do you have a subscription service?", category: "membership", tags: ["subscription", "glow insider", "glow vip", "pricing"] },
  { slug: "how-many-ai-skin-analyses-do-i-get", question: "How many AI skin analyses and consultations do I get per plan?", category: "membership", tags: ["ai quota", "glow insider", "glow vip", "consultations"] },
  { slug: "are-there-any-hidden-costs", question: "Are there any hidden costs?", category: "membership", tags: ["hidden costs", "free trial", "pricing transparency"] },
];

const KNOWLEDGE_HUB_INDEX: { slug: string; question: string; category: string; tags: string[] }[] = KNOWLEDGE_HUB_INDEX_DATA;

const SEARCH_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "of", "to", "in", "on", "with", "is", "are",
  "how", "what", "does", "do", "can", "you", "your", "it", "this", "that",
]);

function significantWords(keywords: string[]): string[] {
  const words = keywords
    .flatMap((k) => k.toLowerCase().split(/[^a-z0-9]+/))
    .filter((w) => w.length > 2 && !SEARCH_STOPWORDS.has(w));
  return Array.from(new Set(words));
}

/** Mirrors src/lib/content-graph.ts's relatedKnowledgeHubEntries() matching logic
 *  against the slim KNOWLEDGE_HUB_INDEX snapshot above. Real Knowledge Hub entries
 *  only -- an empty result (no keyword overlap) returns []. */
function computeRelatedKnowledgeArticles(keywords: string[], limit = 3): { title: string; url: string }[] {
  const words = significantWords(keywords);
  if (words.length === 0) return [];
  const scored = KNOWLEDGE_HUB_INDEX.map((entry) => {
    const haystack = `${entry.question} ${entry.tags.join(" ")} ${entry.category}`.toLowerCase();
    const score = words.reduce((sum, w) => sum + (haystack.includes(w) ? 1 : 0), 0);
    return { entry, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ title: s.entry.question, url: `/knowledge-hub/${s.entry.slug}` }));
}

interface BackfillRow {
  id: string;
  product_name: string;
  brand: string;
  category: string;
  verdict: string;
  key_ingredients: string[];
  skin_type_match: string[];
  source_url: string;
  source_type: SourceType;
  published_date: string;
  score_efficacy: number;
  score_value: number;
  score_texture: number;
  score_climate: number;
}

async function reconstructSourceText(
  admin: SupabaseAdmin,
  row: BackfillRow,
  firecrawlKey: string,
  firecrawlBudget: { remaining: number },
): Promise<{ text: string } | { reason: string }> {
  if (row.source_type === "openhaus_marketplace") {
    const slug = row.source_url.replace(/^https:\/\/skinlabs\.co\.za\/marketplace\/product\//, "");
    const { data } = await admin
      .from("marketplace_products")
      .select("name, description, how_to_use, size, key_actives, concern, brand:marketplace_brands(name, origin)")
      .eq("slug", slug)
      .maybeSingle();
    const product = data as unknown as {
      name: string;
      description: string | null;
      how_to_use: string | null;
      size: string | null;
      key_actives: string[] | null;
      concern: string[] | null;
      brand: { name: string; origin: string | null } | null;
    } | null;
    if (!product) return { reason: `no live marketplace_products row for slug "${slug}"` };
    return {
      text: `Product: ${product.name}
Brand: ${product.brand?.name ?? row.brand}
Brand origin: ${product.brand?.origin ?? "unknown"}
Size: ${product.size ?? "not stated"}
Description: ${product.description ?? "not stated"}
How to use: ${product.how_to_use ?? "not stated"}
Key actives: ${(product.key_actives ?? []).join(", ")}
Concerns addressed: ${(product.concern ?? []).join(", ")}`,
    };
  }

  if (firecrawlBudget.remaining <= 0) return { reason: "MAX_FIRECRAWL_BACKFILL_PER_RUN exhausted for this invocation" };
  if (!(await withinDailyQuota(admin, "firecrawl", FIRECRAWL_DAILY_LIMIT))) return { reason: "Firecrawl daily quota reached" };
  firecrawlBudget.remaining -= 1;
  const page = await firecrawlScrape(row.source_url, firecrawlKey);
  await recordApiUsage(admin, "firecrawl", row.source_url, Boolean(page));
  if (!page) return { reason: `Firecrawl re-scrape of ${row.source_url} returned nothing` };
  return { text: `Source page title: ${page.title}\nSource URL: ${page.url}\n\n${page.markdown}` };
}

async function runBackfillPass(args: {
  admin: SupabaseAdmin;
  geminiKey: string;
  firecrawlKey: string;
  modelChain: string[];
  logModelAttempt: (candidateKey: string) => (log: GeminiAttemptLog) => Promise<void>;
}): Promise<{ processed: number; updated: number; skipped: Array<{ id: string; reason: string }> }> {
  const { admin, geminiKey, firecrawlKey, modelChain, logModelAttempt } = args;
  const { data: rows } = await admin
    .from("ai_generated_product_reviews")
    .select(
      "id, product_name, brand, category, verdict, key_ingredients, skin_type_match, source_url, source_type, published_date, score_efficacy, score_value, score_texture, score_climate",
    )
    .is("seo_intro", null)
    .order("published_date", { ascending: true })
    .limit(BACKFILL_BATCH_SIZE);

  const skipped: Array<{ id: string; reason: string }> = [];
  let updated = 0;
  const firecrawlBudget = { remaining: MAX_FIRECRAWL_BACKFILL_PER_RUN };

  for (const row of (rows ?? []) as BackfillRow[]) {
    if (!(await withinDailyQuota(admin, "gemini", GEMINI_DAILY_LIMIT))) {
      skipped.push({ id: row.id, reason: "Gemini daily quota reached -- stopping backfill pass" });
      break;
    }
    if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) {
      await sleep(15000);
      if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) {
        skipped.push({ id: row.id, reason: "Gemini per-minute quota reached -- stopping backfill pass" });
        break;
      }
    }

    const source = await reconstructSourceText(admin, row, firecrawlKey, firecrawlBudget);
    if ("reason" in source) {
      skipped.push({ id: row.id, reason: source.reason });
      continue;
    }

    const supplemental = await generateSupplementalFields({
      geminiKey,
      modelChain,
      sourceText: source.text,
      context: {
        productName: row.product_name,
        brand: row.brand,
        category: row.category,
        verdict: row.verdict,
        keyIngredients: row.key_ingredients,
      },
      onAttempt: logModelAttempt(`backfill:${row.id}`),
    });

    if ("error" in supplemental) {
      skipped.push({ id: row.id, reason: supplemental.error });
      continue;
    }
    if (supplemental.rejectionReasons) {
      skipped.push({ id: row.id, reason: `QA rejected: ${supplemental.rejectionReasons.join("; ")}` });
      continue;
    }

    // Structured-data fields -- real (deterministic formula / live SQL/RPC reads),
    // never Gemini output, computed regardless of the supplemental call's own
    // success so a row isn't left without them just because Gemini's prose call
    // had a bad day.
    const { title: seo_title, description: seo_description } = computeSeoTitleDescription({
      productName: row.product_name,
      brand: row.brand,
      score: Math.round(((row.score_efficacy + row.score_value + row.score_texture + row.score_climate) / 4) * 10) / 10,
      keyIngredients: row.key_ingredients,
      skinTypes: row.skin_type_match,
    });
    const { structured: key_ingredients_structured, slugs: related_ingredients_slugs } = await resolveKeyIngredients(
      admin,
      row.key_ingredients,
    );
    const related_reviews = await computeRelatedReviews(admin, row.category, row.id);
    const { rating: community_rating, count: community_rating_count } = await computeCommunityRating(admin, row.id);
    const primary_image = await resolvePrimaryImage(admin, row.id, row.category, row.brand);
    const related_knowledge_articles = computeRelatedKnowledgeArticles([...row.key_ingredients, row.category, row.brand]);

    const { error } = await admin
      .from("ai_generated_product_reviews")
      .update({
        seo_intro: supplemental.fields.seo_intro,
        review_body: supplemental.fields.review_body,
        product_size: supplemental.fields.product_size,
        product_format: supplemental.fields.product_format,
        country_of_origin: supplemental.fields.country_of_origin,
        am_pm_usage: supplemental.fields.am_pm_usage,
        skin_concerns: supplemental.fields.skin_concerns,
        benefits: supplemental.fields.benefits,
        cautions: supplemental.fields.cautions,
        faq: supplemental.fields.faq,
        currency: "ZAR",
        date_published: new Date(`${row.published_date}T00:00:00Z`).toISOString(),
        skin_types: row.skin_type_match,
        seo_title,
        seo_description,
        key_ingredients_structured,
        related_ingredients_slugs,
        related_reviews,
        community_rating,
        community_rating_count,
        primary_image,
        related_knowledge_articles,
      })
      .eq("id", row.id);

    if (error) skipped.push({ id: row.id, reason: `update failed: ${error.message}` });
    else updated += 1;

    await sleep(1200);
  }

  return { processed: (rows ?? []).length, updated, skipped };
}

/** Backfills ONLY the structured-data / Rich-Results fields (seo_title,
 *  seo_description, key_ingredients_structured, related_ingredients_slugs,
 *  primary_image, related_reviews, related_knowledge_articles, community_rating/
 *  community_rating_count) -- no Gemini or Firecrawl call, so no quota to respect and
 *  a much larger batch is safe. Exists as its own pass (separate from
 *  runBackfillPass()) because selecting on `seo_title IS NULL` catches rows
 *  runBackfillPass() already finished (its own selection is `seo_intro IS NULL`,
 *  which a row keeps non-null forever once set) as well as rows still waiting on
 *  Gemini quota -- both get their structured-data fields regardless of where they are
 *  in the Gemini-dependent backfill. */
async function runStructuredDataBackfillPass(admin: SupabaseAdmin): Promise<{
  processed: number;
  updated: number;
  skipped: Array<{ id: string; reason: string }>;
}> {
  const { data: rows } = await admin
    .from("ai_generated_product_reviews")
    .select(
      "id, product_name, brand, category, key_ingredients, score_efficacy, score_value, score_texture, score_climate, skin_type_match",
    )
    .is("seo_title", null)
    .order("published_date", { ascending: true })
    .limit(15);

  const skipped: Array<{ id: string; reason: string }> = [];
  let updated = 0;

  for (const row of (rows ?? []) as {
    id: string;
    product_name: string;
    brand: string;
    category: string;
    key_ingredients: string[];
    score_efficacy: number;
    score_value: number;
    score_texture: number;
    score_climate: number;
    skin_type_match: string[];
  }[]) {
    try {
      const { title: seo_title, description: seo_description } = computeSeoTitleDescription({
        productName: row.product_name,
        brand: row.brand,
        score: Math.round(((row.score_efficacy + row.score_value + row.score_texture + row.score_climate) / 4) * 10) / 10,
        keyIngredients: row.key_ingredients,
        skinTypes: row.skin_type_match,
      });
      const { structured: key_ingredients_structured, slugs: related_ingredients_slugs } = await resolveKeyIngredients(
        admin,
        row.key_ingredients,
      );
      const related_reviews = await computeRelatedReviews(admin, row.category, row.id);
      const { rating: community_rating, count: community_rating_count } = await computeCommunityRating(admin, row.id);
      const primary_image = await resolvePrimaryImage(admin, row.id, row.category, row.brand);
      const related_knowledge_articles = computeRelatedKnowledgeArticles([...row.key_ingredients, row.category, row.brand]);

      const { error } = await admin
        .from("ai_generated_product_reviews")
        .update({
          seo_title,
          seo_description,
          key_ingredients_structured,
          related_ingredients_slugs,
          related_reviews,
          community_rating,
          community_rating_count,
          primary_image,
          related_knowledge_articles,
        })
        .eq("id", row.id);

      if (error) skipped.push({ id: row.id, reason: `update failed: ${error.message}` });
      else updated += 1;
    } catch (err) {
      skipped.push({ id: row.id, reason: String(err).slice(0, 200) });
    }
  }

  return { processed: (rows ?? []).length, updated, skipped };
}

/** Targeted re-run of resolvePrimaryImage() ONLY, for rows that already have every
 *  other structured-data field set (so `seo_title IS NULL` no longer selects them --
 *  see runStructuredDataBackfillPass() above) but never got a primary_image because
 *  PEXELS_API_KEY wasn't configured (or was invalid) at the time they were processed.
 *  Selects on `primary_image IS NULL` specifically so it never re-touches a row that
 *  already resolved one, and never recomputes the other fields (cheap, single-column
 *  update). Exists as its own pass rather than resetting seo_title to null and
 *  re-running runStructuredDataBackfillPass(), which would needlessly recompute
 *  everything else. */
async function runPrimaryImageBackfillPass(admin: SupabaseAdmin): Promise<{
  processed: number;
  updated: number;
  skipped: Array<{ id: string; reason: string }>;
}> {
  const { data: rows } = await admin
    .from("ai_generated_product_reviews")
    .select("id, category, brand")
    .is("primary_image", null)
    .order("published_date", { ascending: true })
    .limit(25);

  const skipped: Array<{ id: string; reason: string }> = [];
  let updated = 0;

  for (const row of (rows ?? []) as { id: string; category: string; brand: string }[]) {
    try {
      const primary_image = await resolvePrimaryImage(admin, row.id, row.category, row.brand);
      if (!primary_image) {
        skipped.push({ id: row.id, reason: "no review_images row and no Pexels result (PEXELS_API_KEY unset, invalid, or no match)" });
        continue;
      }
      const { error } = await admin.from("ai_generated_product_reviews").update({ primary_image }).eq("id", row.id);
      if (error) skipped.push({ id: row.id, reason: `update failed: ${error.message}` });
      else updated += 1;
    } catch (err) {
      skipped.push({ id: row.id, reason: String(err).slice(0, 200) });
    }
  }

  return { processed: (rows ?? []).length, updated, skipped };
}

async function isAuthorised(req: Request, admin: SupabaseAdmin): Promise<boolean> {
  const cronSecret = Deno.env.get("PRODUCT_REVIEW_CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (cronSecret && providedSecret && providedSecret === cronSecret) return true;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer /, "");
  if (!token) return false;
  const { data: userData } = await admin.auth.getUser(token);
  if (!userData?.user) return false;
  const { data: adminRole } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
  return Boolean(adminRole);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin: SupabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (!(await isAuthorised(req, admin))) {
    return new Response(JSON.stringify({ error: "Not authorised" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY_REVIEWS");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const missing = [!geminiKey && "GEMINI_API_KEY_REVIEWS", !firecrawlKey && "FIRECRAWL_API_KEY"].filter(Boolean);
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({ error: `Not configured: missing ${missing.join(", ")} as Supabase Edge Function secrets (supabase secrets set ...)` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const modelChain = [
    Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash",
    Deno.env.get("GEMINI_MODEL_FALLBACK_1") || "gemini-3.1-flash-lite",
    Deno.env.get("GEMINI_MODEL_FALLBACK_2") || "gemini-3.5-flash-lite",
  ];

  const url = new URL(req.url);
  const rawBackfillDate = url.searchParams.get("backfillDate") ?? "";
  const backfillDate = /^\d{4}-\d{2}-\d{2}$/.test(rawBackfillDate) ? rawBackfillDate : null;
  const today = backfillDate ?? new Date().toISOString().slice(0, 10);
  const runId = crypto.randomUUID();
  const errors: string[] = [];
  const modelUsage: Record<string, number> = {};
  let created = 0;

  const logModelAttempt = (candidateKey: string) => async (log: GeminiAttemptLog) => {
    await recordApiUsage(admin, "gemini", candidateKey, log.outcome === "success");
    try {
      await admin.from("pipeline_model_calls").insert({
        pipeline: "product-review-sync",
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

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (url.searchParams.get("backfillMissingFields") === "true") {
    try {
      const result = await runBackfillPass({
        admin,
        geminiKey: geminiKey as string,
        firecrawlKey: firecrawlKey as string,
        modelChain,
        logModelAttempt,
      });
      return jsonResponse({ ok: true, mode: "backfillMissingFields", ...result });
    } catch (err) {
      return jsonResponse({ ok: false, mode: "backfillMissingFields", error: String(err).slice(0, 500) }, 500);
    }
  }

  // Structured-data-only backfill: no Gemini/Firecrawl call, so independent of both
  // the daily review cap and the Gemini quota -- see runStructuredDataBackfillPass()'s
  // own header comment for why this is a separate mode from ?backfillMissingFields.
  if (url.searchParams.get("backfillStructuredData") === "true") {
    try {
      const result = await runStructuredDataBackfillPass(admin);
      return jsonResponse({ ok: true, mode: "backfillStructuredData", ...result });
    } catch (err) {
      return jsonResponse({ ok: false, mode: "backfillStructuredData", error: String(err).slice(0, 500) }, 500);
    }
  }

  // Primary-image-only re-run -- see runPrimaryImageBackfillPass()'s own header
  // comment for why this is separate from ?backfillStructuredData=true.
  if (url.searchParams.get("backfillPrimaryImage") === "true") {
    try {
      const result = await runPrimaryImageBackfillPass(admin);
      return jsonResponse({ ok: true, mode: "backfillPrimaryImage", ...result });
    } catch (err) {
      return jsonResponse({ ok: false, mode: "backfillPrimaryImage", error: String(err).slice(0, 500) }, 500);
    }
  }

  // Diagnostic only, never exposes the key itself -- distinguishes "PEXELS_API_KEY
  // unset" from "set but Pexels rejected/errored" from "set and working but this
  // exact query found nothing" so a real gap can be told apart from a false negative
  // without guessing. Safe to leave in permanently; remove once resolvePrimaryImage()
  // has real production evidence either way and this stops being needed.
  if (url.searchParams.get("pexelsDiagnostic") === "true") {
    const pexelsKey = Deno.env.get("PEXELS_API_KEY");
    if (!pexelsKey) {
      return jsonResponse({ ok: true, mode: "pexelsDiagnostic", configured: false });
    }
    try {
      const res = await fetch(
        "https://api.pexels.com/v1/search?query=skincare+moisturiser+bottle&per_page=1&orientation=landscape",
        { headers: { Authorization: pexelsKey } },
      );
      const body = (await res.json().catch(() => null)) as { photos?: unknown[]; error?: string; code?: number } | null;
      return jsonResponse({
        ok: true,
        mode: "pexelsDiagnostic",
        configured: true,
        fetchStatus: res.status,
        fetchOk: res.ok,
        resultCount: Array.isArray(body?.photos) ? body.photos.length : null,
        errorFromPexels: !res.ok ? (body?.error ?? body?.code ?? null) : null,
      });
    } catch (err) {
      return jsonResponse({ ok: true, mode: "pexelsDiagnostic", configured: true, fetchThrew: String(err).slice(0, 300) });
    }
  }

  try {
    const { count: publishedToday } = await admin
      .from("ai_generated_product_reviews")
      .select("id", { count: "exact", head: true })
      .eq("published_date", today);
    if ((publishedToday ?? 0) >= DAILY_REVIEW_CAP) {
      return jsonResponse({ ok: true, created: 0, message: "Daily review cap already met" });
    }
    const target = DAILY_REVIEW_CAP - (publishedToday ?? 0);

    const { data: dueRetries } = await admin
      .from("pipeline_retry_queue")
      .select("id, candidate_payload, attempt_count")
      .eq("pipeline", "product-review-sync")
      .eq("resolved", false)
      .lte("retry_after", new Date().toISOString())
      .limit(target * 2);

    const { data: existingRows } = await admin.from("ai_generated_product_reviews").select("source_url, origin");
    const seenUrls = new Set((existingRows ?? []).map((r: { source_url: string }) => r.source_url));
    const saCount = (existingRows ?? []).filter((r: { origin: string }) => r.origin === "south_africa").length;
    const globalCount = (existingRows ?? []).length - saCount;

    const { data: marketplaceRows } = await admin
      .from("marketplace_products")
      .select("slug, name, description, marked_up_price_zar, category, key_actives, concern, brand:marketplace_brands(name)")
      .eq("in_stock", true)
      .limit(40);

    const marketplaceCandidates = ((marketplaceRows ?? []) as unknown as MarketplaceProductRow[]).filter(
      (p) => !seenUrls.has(`https://skinlabs.co.za/marketplace/product/${p.slug}`),
    );

    const firecrawlCandidates: Array<{ site: SourceSite; page: FirecrawlPage }> = [];
    let firecrawlCallsThisRun = 0;
    for (const site of SOURCE_SITES) {
      if (firecrawlCandidates.length >= target * 2) break;
      try {
        const result = await researchSource(admin, site, firecrawlKey as string, firecrawlCallsThisRun < MAX_FIRECRAWL_SOURCES_PER_RUN);
        if (result.madeRealCall) firecrawlCallsThisRun += 1;
        if (result.skippedReason) errors.push(`Firecrawl skipped ${site.url}: ${result.skippedReason}`);
        for (const page of result.pages) {
          if (seenUrls.has(page.url)) continue;
          firecrawlCandidates.push({ site, page });
        }
      } catch (err) {
        errors.push(`Firecrawl ${site.url}: ${String(err).slice(0, 200)}`);
      }
      await sleep(500);
    }

    let runningSa = saCount;
    let runningGlobal = globalCount;
    const wantsSa = () => runningSa / Math.max(1, runningSa + runningGlobal) < SA_SHARE_TARGET;

    interface QueueItem {
      text: string;
      origin: Origin;
      sourceUrl: string;
      sourceType: SourceType;
      isSponsored: boolean;
      retailerHint: Retailer | null;
      retryQueueId?: number;
      retryAttemptCount?: number;
    }
    const queue: QueueItem[] = [];

    for (const row of dueRetries ?? []) {
      const payload = row.candidate_payload as Omit<QueueItem, "retryQueueId" | "retryAttemptCount"> | null;
      if (!payload?.sourceUrl || seenUrls.has(payload.sourceUrl)) continue;
      queue.push({ ...payload, retryQueueId: row.id, retryAttemptCount: row.attempt_count });
    }

    for (const p of marketplaceCandidates) {
      queue.push({
        text: `Product: ${p.name}\nBrand: ${p.brand?.name ?? "Unknown"}\nCategory: ${p.category}\nPrice: R${p.marked_up_price_zar}\nDescription: ${p.description}\nKey actives: ${(p.key_actives ?? []).join(", ")}\nConcerns addressed: ${(p.concern ?? []).join(", ")}`,
        origin: "south_africa",
        sourceUrl: `https://skinlabs.co.za/marketplace/product/${p.slug}`,
        sourceType: "openhaus_marketplace",
        // OpenHaus is SkinLabs' own in-app marketplace (marked-up pricing, see
        // src/lib/marketplace/pricing.ts) -- SkinLabs has a direct commercial
        // interest in a reader buying via a review sourced from it, same as the
        // existing disclosed Timeless placements. Flagged sponsored per the
        // 2026-09-22 editorial decision to disclose this consistently everywhere,
        // not just in the reviews that happen to mention it in prose.
        isSponsored: true,
        retailerHint: null,
      });
    }
    for (const { site, page } of firecrawlCandidates) {
      queue.push({
        text: `Source page title: ${page.title}\nSource URL: ${page.url}\n\n${page.markdown}`,
        origin: site.origin,
        sourceUrl: page.url,
        sourceType: site.sourceType,
        isSponsored: site.isSponsored,
        retailerHint: site.retailerHint,
      });
    }

    queue.sort((a, b) => {
      const aWanted = wantsSa() ? a.origin === "south_africa" : a.origin === "global_available_in_sa";
      const bWanted = wantsSa() ? b.origin === "south_africa" : b.origin === "global_available_in_sa";
      return Number(bWanted) - Number(aWanted);
    });

    for (const candidate of queue) {
      if (created >= target) break;

      if (!(await withinDailyQuota(admin, "gemini", GEMINI_DAILY_LIMIT))) {
        errors.push(`Gemini daily quota (${GEMINI_DAILY_LIMIT}) reached -- stopping run`);
        break;
      }
      if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) {
        await sleep(15000);
        if (!(await withinPerMinuteQuota(admin, "gemini", GEMINI_PER_MINUTE_LIMIT))) {
          errors.push(`Gemini per-minute quota (${GEMINI_PER_MINUTE_LIMIT}) reached -- stopping run`);
          break;
        }
      }

      try {
        const { data: fields, modelUsed } = await callGeminiWithFallback({
          apiKey: geminiKey as string,
          models: modelChain,
          systemInstruction: REVIEW_INSTRUCTIONS,
          userContent: candidate.text,
          responseSchema: REVIEW_SCHEMA,
          temperature: 0.4,
          parse: parseReviewResponse,
          onAttempt: logModelAttempt(candidate.sourceUrl),
        });
        modelUsage[modelUsed] = (modelUsage[modelUsed] ?? 0) + 1;

        if (!fields.product_name || !fields.brand) continue;

        const qa = qaProductReview(fields);
        if (!qa.passed) {
          errors.push(`QA rejected ${candidate.sourceUrl}: ${qa.reasons.join("; ")}`);
          continue;
        }

        const slug = slugify(`${fields.brand}-${fields.product_name}`);
        const id = `${slug || Date.now()}`;
        const { data: idTaken } = await admin.from("ai_generated_product_reviews").select("id").eq("id", id).maybeSingle();
        const finalId = idTaken ? `${id}-${Math.floor(Math.random() * 9000 + 1000)}` : id;

        const retailers = candidate.retailerHint
          ? [{ retailer: candidate.retailerHint, price_zar: fields.local_price_zar, in_stock: true, url: candidate.sourceUrl }]
          : [];

        const { error } = await admin.from("ai_generated_product_reviews").insert({
          id: finalId,
          product_name: fields.product_name,
          brand: fields.brand,
          local_price_zar: fields.local_price_zar,
          where_to_buy:
            candidate.sourceType === "openhaus_marketplace" ? "OpenHaus Marketplace" : candidate.retailerHint ?? "Brand Direct",
          category: fields.category,
          skin_type_match: fields.skin_type_match,
          score_efficacy: fields.score_efficacy,
          score_value: fields.score_value,
          score_texture: fields.score_texture,
          score_climate: fields.score_climate,
          verdict: fields.verdict,
          key_ingredients: fields.key_ingredients,
          retailers,
          origin: candidate.origin,
          source_url: candidate.sourceUrl,
          source_type: candidate.sourceType,
          is_sponsored: candidate.isSponsored,
          generated_by: modelUsed,
          published_date: today,
          currency: "ZAR",
          date_published: new Date(`${today}T00:00:00Z`).toISOString(),
          skin_types: fields.skin_type_match,
        });

        if (error) {
          errors.push(`${candidate.sourceUrl}: ${error.message}`);
        } else {
          created += 1;
          seenUrls.add(candidate.sourceUrl);
          if (candidate.origin === "south_africa") runningSa += 1;
          else runningGlobal += 1;
          if (candidate.retryQueueId) {
            await admin
              .from("pipeline_retry_queue")
              .update({ resolved: true, resolved_at: new Date().toISOString() })
              .eq("id", candidate.retryQueueId);
          }
          await queueUnresolvedIngredients(admin, fields.key_ingredients, finalId);

          const supplemental = await generateSupplementalFields({
            geminiKey: geminiKey as string,
            modelChain,
            sourceText: candidate.text,
            context: {
              productName: fields.product_name,
              brand: fields.brand,
              category: fields.category,
              verdict: fields.verdict,
              keyIngredients: fields.key_ingredients,
            },
            onAttempt: logModelAttempt(`${candidate.sourceUrl}#supplemental`),
          });
          if ("error" in supplemental) {
            errors.push(`Supplemental fields for ${finalId}: ${supplemental.error}`);
          } else if (supplemental.rejectionReasons) {
            errors.push(`Supplemental fields QA-rejected for ${finalId}: ${supplemental.rejectionReasons.join("; ")}`);
          } else {
            const { error: updateError } = await admin
              .from("ai_generated_product_reviews")
              .update({
                seo_intro: supplemental.fields.seo_intro,
                review_body: supplemental.fields.review_body,
                product_size: supplemental.fields.product_size,
                product_format: supplemental.fields.product_format,
                country_of_origin: supplemental.fields.country_of_origin,
                am_pm_usage: supplemental.fields.am_pm_usage,
                skin_concerns: supplemental.fields.skin_concerns,
                benefits: supplemental.fields.benefits,
                cautions: supplemental.fields.cautions,
                faq: supplemental.fields.faq,
              })
              .eq("id", finalId);
            if (updateError) errors.push(`Supplemental fields update failed for ${finalId}: ${updateError.message}`);
          }

          // Structured-data / Rich-Results fields -- all real (deterministic formula
          // or live SQL/RPC reads), never Gemini output. Best-effort: never fails the
          // review's publish, which already committed above.
          try {
            const { title: seo_title, description: seo_description } = computeSeoTitleDescription({
              productName: fields.product_name,
              brand: fields.brand,
              score: Math.round(((fields.score_efficacy + fields.score_value + fields.score_texture + fields.score_climate) / 4) * 10) / 10,
              keyIngredients: fields.key_ingredients,
              skinTypes: fields.skin_type_match,
            });
            const { structured: key_ingredients_structured, slugs: related_ingredients_slugs } = await resolveKeyIngredients(
              admin,
              fields.key_ingredients,
            );
            const related_reviews = await computeRelatedReviews(admin, fields.category, finalId);
            const { rating: community_rating, count: community_rating_count } = await computeCommunityRating(admin, finalId);
            const primary_image = await resolvePrimaryImage(admin, finalId, fields.category, fields.brand);
            const related_knowledge_articles = computeRelatedKnowledgeArticles([
              ...fields.key_ingredients,
              fields.category,
              fields.brand,
            ]);

            const { error: structuredError } = await admin
              .from("ai_generated_product_reviews")
              .update({
                seo_title,
                seo_description,
                key_ingredients_structured,
                related_ingredients_slugs,
                related_reviews,
                community_rating,
                community_rating_count,
                primary_image,
                related_knowledge_articles,
              })
              .eq("id", finalId);
            if (structuredError) errors.push(`Structured-data fields update failed for ${finalId}: ${structuredError.message}`);
          } catch (structuredErr) {
            errors.push(`Structured-data fields for ${finalId}: ${String(structuredErr).slice(0, 200)}`);
          }
        }
      } catch (err) {
        if (err instanceof GeminiFatalError) {
          errors.push(`ALERT (Gemini config, run stopped): ${err.message}`);
          break;
        }
        if (err instanceof GeminiAllModelsExhaustedError) {
          errors.push(
            `All ${modelChain.length} Gemini models exhausted for ${candidate.sourceUrl} -- queued for retry: ` +
              err.attempts.map((a) => `${a.model}#${a.attemptNumber}=${a.outcome}`).join(", "),
          );
          try {
            if (candidate.retryQueueId) {
              const nextAttempt = (candidate.retryAttemptCount ?? 1) + 1;
              if (nextAttempt > 5) {
                errors.push(`${candidate.sourceUrl} exceeded max retry attempts (5) -- left unresolved for manual review`);
              } else {
                await admin
                  .from("pipeline_retry_queue")
                  .update({ attempt_count: nextAttempt, retry_after: new Date(Date.now() + 15 * 60 * 1000).toISOString() })
                  .eq("id", candidate.retryQueueId);
              }
            } else {
              await admin.from("pipeline_retry_queue").insert({
                pipeline: "product-review-sync",
                candidate_payload: {
                  text: candidate.text,
                  origin: candidate.origin,
                  sourceUrl: candidate.sourceUrl,
                  sourceType: candidate.sourceType,
                  isSponsored: candidate.isSponsored,
                  retailerHint: candidate.retailerHint,
                },
                reason: err.message.slice(0, 300),
                retry_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              });
            }
          } catch (queueErr) {
            errors.push(`Failed to queue ${candidate.sourceUrl} for retry: ${String(queueErr).slice(0, 200)}`);
          }
        } else {
          errors.push(String(err).slice(0, 300));
        }
      }
      await sleep(1200);
    }

    try {
      const { count: totalGenerated } = await admin.from("ai_generated_product_reviews").select("id", { count: "exact", head: true });
      const totalReviews = STATIC_REVIEW_BASELINE + (totalGenerated ?? 0);

      const { data: currentEdition } = await admin
        .from("spotlight_editions")
        .select("id, review_count_at_snapshot, methodology_version")
        .eq("is_current", true)
        .maybeSingle();

      if (currentEdition) {
        const lastMilestone = Math.floor(currentEdition.review_count_at_snapshot / SPOTLIGHT_BUMP_INTERVAL);
        const currentMilestone = Math.floor(totalReviews / SPOTLIGHT_BUMP_INTERVAL);
        if (currentMilestone > lastMilestone) {
          const versionMatch = /v(\d+)\.(\d+)/.exec(currentEdition.methodology_version);
          const nextVersion = versionMatch
            ? `Spotlight Methodology v${versionMatch[1]}.${Number(versionMatch[2]) + 1}`
            : currentEdition.methodology_version;
          const nextLabel = new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

          await admin.from("spotlight_editions").update({ is_current: false }).eq("id", currentEdition.id);
          await admin.from("spotlight_editions").insert({
            edition_label: nextLabel,
            methodology_version: nextVersion,
            review_count_at_snapshot: totalReviews,
            is_current: true,
          });
        }
      }
    } catch (err) {
      errors.push(`Spotlight edition bump: ${String(err).slice(0, 200)}`);
    }

    return jsonResponse({ ok: true, created, target, modelUsage, backfillDate, errors });
  } catch (err) {
    return jsonResponse({ error: String(err).slice(0, 500), created, errors }, 500);
  }
});
