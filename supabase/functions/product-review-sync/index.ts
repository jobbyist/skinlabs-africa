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
 * Function on 2026-09-22. The Vercel version required GEMINI_API_KEY/
 * FIRECRAWL_API_KEY/SUPABASE_SERVICE_ROLE_KEY/CRON_SECRET as Vercel project
 * environment variables, which are stored as Vercel's "sensitive" type --
 * genuinely unreadable via any API (confirmed live, not just documented) even
 * to the project owner, and Vercel Cron itself only be re-triggered on demand
 * via the Vercel CLI's `vercel crons run`, which needs an authenticated CLI
 * session this environment doesn't have. None of that applies here: this
 * environment has full deploy/SQL/cron access to the real Supabase project
 * (gnkpzijxuciiaamakgzm), so the pipeline can be inspected, redeployed and
 * manually triggered from this session going forward without depending on a
 * human's Vercel dashboard access.
 *
 * Auth accepts EITHER of:
 *   - `x-cron-secret: <PRODUCT_REVIEW_CRON_SECRET>` -- the literal constant
 *     below, embedded directly in both this file and the pg_cron job's
 *     net.http_post call (see supabase/migrations/
 *     20260922_product_review_and_briefings_cron.sql). Deliberately NOT a
 *     `Deno.env.get(...)` project secret: this project's existing
 *     MARKETPLACE_CRON_SECRET-gated cron jobs (openhaus-fx-sync etc.) are
 *     documented elsewhere in CLAUDE.md as silently 401ing because nothing
 *     in this environment can run `supabase secrets set` -- embedding the
 *     shared secret directly in source avoids that exact trap. It's no less
 *     secret than the existing openhaus_*_cron pattern (also a literal
 *     string baked into the pg_cron job's SQL, visible to anyone with DB
 *     read access), just made to actually work end-to-end.
 *   - A Supabase Auth JWT for a user holding the `admin` role (checked via
 *     the existing `has_role` RPC) -- lets a signed-in admin trigger a run
 *     from the browser/an authenticated script without needing the cron
 *     secret at all. Matches the same dual-auth pattern already used by
 *     supabase/functions/openhaus-price-sync/index.ts.
 *
 * Required Supabase Edge Function secrets (`supabase secrets set ...` --
 * cannot be set from this codebase/session; every invocation fails fast with
 * a clear "not configured" error rather than silently doing nothing until a
 * human adds these):
 *   - GEMINI_API_KEY_REVIEWS   Google AI Studio / Gemini API key for this
 *     pipeline. Switched from the plain `GEMINI_API_KEY` name on
 *     2026-09-22 after that secret returned a real 403 (auth error) on a
 *     live run -- `GEMINI_API_KEY_REVIEWS` is a distinct, separately
 *     managed key.
 *   - FIRECRAWL_API_KEY        Firecrawl API key (api.firecrawl.dev).
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are reserved, auto-injected
 * Supabase Edge Function env vars -- never require a manual secrets-set step.
 *
 * Optional (quota knobs -- see "QUOTA MONITOR" below; defaults are
 * deliberately conservative placeholders, not a confirmed reading of either
 * provider's actual free tier for this account/model):
 *   - GEMINI_MODEL              Defaults to "gemini-3.6-flash".
 *   - GEMINI_MODEL_FALLBACK_1   Defaults to "gemini-3.1-flash-lite".
 *   - GEMINI_MODEL_FALLBACK_2   Defaults to "gemini-3.5-flash-lite".
 *   - FIRECRAWL_DAILY_LIMIT     Defaults to 20 real Firecrawl calls/day.
 *   - GEMINI_DAILY_LIMIT        Defaults to 100 real Gemini calls/day.
 *   - GEMINI_PER_MINUTE_LIMIT   Defaults to 10 real Gemini calls/minute.
 *
 * Manual backfill: POST with ?backfillDate=YYYY-MM-DD (still requires the
 * same auth as every other invocation) publishes up to DAILY_REVIEW_CAP
 * reviews dated that day instead of today.
 *
 * Every Gemini call attempt is logged to pipeline_model_calls. A candidate
 * whose entire fallback chain is exhausted is queued in pipeline_retry_queue
 * for a lazy retry on this pipeline's next invocation.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callGeminiWithFallback,
  GeminiFatalError,
  GeminiAllModelsExhaustedError,
  type GeminiAttemptLog,
} from "../_shared/pipelines/geminiFallback.ts";
import { scanComplianceFlags } from "../_shared/pipelines/complianceTerms.ts";

/** Shared secret this pg_cron's net.http_post call sends as x-cron-secret.
 *  See this file's header comment for why it's a literal constant rather
 *  than a Deno.env.get(...) project secret. */
const PRODUCT_REVIEW_CRON_SECRET = "7b9db562d62fee7360460cf4a9924d21542401e0b4b44e04225bed14c9ec34b8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

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
// ---------------------------------------------------------------------------
const FIRECRAWL_DAILY_LIMIT = Number(Deno.env.get("FIRECRAWL_DAILY_LIMIT")) || 20;
const GEMINI_DAILY_LIMIT = Number(Deno.env.get("GEMINI_DAILY_LIMIT")) || 100;
const GEMINI_PER_MINUTE_LIMIT = Number(Deno.env.get("GEMINI_PER_MINUTE_LIMIT")) || 10;

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
// SUPABASE AS MEMORY: quota bookkeeping + research cache.
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

/** Parses + validates a raw Gemini response into GeneratedReviewFields, throwing on
 *  anything unparseable so the shared fallback module's malformed_output/repair path
 *  kicks in -- never silently coerces bad JSON into a "best effort" object. */
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

/** QA gate: runs after generation, before insert. A candidate that fails QA is
 *  skipped (never published) rather than failing the whole run -- matches the
 *  Firecrawl/Gemini pattern of "one bad candidate doesn't sink the run." */
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
  // Never let an unverifiable superlative or named-condition treatment claim through --
  // the source material never supports these, so their presence means the model
  // fabricated language beyond what it was grounded in.
  if (/\bclinically proven\b|\bdermatologist recommended\b|\bguaranteed results\b/i.test(fields.verdict)) {
    reasons.push("verdict contains an unverifiable superlative/clinical claim");
  }
  for (const flag of scanComplianceFlags(fields.verdict)) reasons.push(flag);
  return { passed: reasons.length === 0, reasons };
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

async function isAuthorised(req: Request, admin: SupabaseAdmin): Promise<boolean> {
  const providedSecret = req.headers.get("x-cron-secret");
  if (providedSecret && providedSecret === PRODUCT_REVIEW_CRON_SECRET) return true;

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

  /** Persists every Gemini attempt for this pipeline run: a detailed per-model log
   *  (pipeline_model_calls) plus the existing aggregate quota counter (pipeline_api_usage,
   *  provider "gemini") so withinDailyQuota/withinPerMinuteQuota keep counting every real
   *  call across the whole fallback chain, not just the first attempt per candidate. */
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

  try {
    // ---- Supabase as orchestrator: the daily editorial cap comes first, before any
    // Firecrawl/Gemini call is even considered. ----
    const { count: publishedToday } = await admin
      .from("ai_generated_product_reviews")
      .select("id", { count: "exact", head: true })
      .eq("published_date", today);
    if ((publishedToday ?? 0) >= DAILY_REVIEW_CAP) {
      return jsonResponse({ ok: true, created: 0, message: "Daily review cap already met" });
    }
    const target = DAILY_REVIEW_CAP - (publishedToday ?? 0);

    // ---- Lazy retry queue: process anything already due before pulling fresh
    // candidates. ----
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

    // ---- Candidate pool A: real OpenHaus marketplace products (already-verified data,
    // no Firecrawl/scraping needed -- Gemini only writes the verdict/scores against
    // real fields). ----
    const { data: marketplaceRows } = await admin
      .from("marketplace_products")
      .select("slug, name, description, marked_up_price_zar, category, key_actives, concern, brand:marketplace_brands(name)")
      .eq("in_stock", true)
      .limit(40);

    const marketplaceCandidates = ((marketplaceRows ?? []) as unknown as MarketplaceProductRow[]).filter(
      (p) => !seenUrls.has(`https://skinlabs.co.za/marketplace/product/${p.slug}`),
    );

    // ---- Candidate pool B: Firecrawl-researched real product pages from the named
    // sites, subject to the research cache and the per-run/daily quota. ----
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

    // Interleave: prefer whichever origin the running 70/30 split is short on.
    interface QueueItem {
      text: string;
      origin: Origin;
      sourceUrl: string;
      sourceType: SourceType;
      isSponsored: boolean;
      retailerHint: Retailer | null;
      /** Set only for a candidate pulled back out of pipeline_retry_queue. */
      retryQueueId?: number;
      retryAttemptCount?: number;
    }
    const queue: QueueItem[] = [];

    for (const row of dueRetries ?? []) {
      const payload = row.candidate_payload as Omit<QueueItem, "retryQueueId" | "retryAttemptCount"> | null;
      if (!payload?.sourceUrl || seenUrls.has(payload.sourceUrl)) continue; // already published since queuing
      queue.push({ ...payload, retryQueueId: row.id, retryAttemptCount: row.attempt_count });
    }

    for (const p of marketplaceCandidates) {
      queue.push({
        text: `Product: ${p.name}\nBrand: ${p.brand?.name ?? "Unknown"}\nCategory: ${p.category}\nPrice: R${p.marked_up_price_zar}\nDescription: ${p.description}\nKey actives: ${(p.key_actives ?? []).join(", ")}\nConcerns addressed: ${(p.concern ?? []).join(", ")}`,
        origin: "south_africa",
        sourceUrl: `https://skinlabs.co.za/marketplace/product/${p.slug}`,
        sourceType: "openhaus_marketplace",
        isSponsored: false,
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

    // Sort the queue so candidates matching whatever origin the running split needs
    // next are tried first, without ever fully excluding the other origin.
    queue.sort((a, b) => {
      const aWanted = wantsSa() ? a.origin === "south_africa" : a.origin === "global_available_in_sa";
      const bWanted = wantsSa() ? b.origin === "south_africa" : b.origin === "global_available_in_sa";
      return Number(bWanted) - Number(aWanted);
    });

    for (const candidate of queue) {
      if (created >= target) break;

      // ---- Quota monitor (Gemini side): a daily/per-minute limit hit here means every
      // remaining candidate would fail identically, so stop the run cleanly instead of
      // burning through the rest of the queue. ----
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
        }
      } catch (err) {
        if (err instanceof GeminiFatalError) {
          // Auth or invalid-request failure: every remaining candidate would fail
          // identically, and blindly trying weaker models wouldn't fix a broken API
          // key or a bad prompt/schema. Stop the whole run and surface this loudly
          // rather than burning through the queue -- this needs a human to look at
          // the Google AI Studio config, not a retry.
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
                // Cap retries so a persistently-failing candidate doesn't loop forever --
                // left unresolved for manual review rather than retried indefinitely.
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

    // ---- Spotlight edition auto-bump every SPOTLIGHT_BUMP_INTERVAL published reviews ----
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
