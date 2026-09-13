/**
 * Daily South African skincare product review sync.
 *
 * Replaces the old newsroom-sync (Daily Skinny briefing) cron slot: instead of a daily
 * news column, this generates 3-5 grounded product reviews a day -- 70% South African
 * brands, 30% global brands available in SA -- and publishes them straight to /reviews
 * via the ai_generated_product_reviews table (see supabase/migrations/
 * 20260913020000_product_review_pipeline_core.sql; ReviewsGrid/ProductReview/SiteSearch
 * already merge that table in alongside the static src/data/reviews.ts catalogue).
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
 * Optional:
 *   - GEMINI_MODEL            Defaults to "gemini-3.6-flash" if unset. (gemini-2.0-flash
 *     was retired by Google -- confirmed live via a 404 from the real API on 2026-09-13,
 *     which named gemini-3.6-flash as the direct replacement.)
 *   - VITE_SUPABASE_URL       Reused if set (already present for the client build);
 *     falls back to the hardcoded production project URL otherwise.
 */

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
const MIN_REVIEWS_PER_RUN = 3;
const MAX_REVIEWS_PER_RUN = 5;
/** Target 70% South African brands / 30% global-available-in-SA per the editorial brief. */
const SA_SHARE_TARGET = 0.7;
/** Bump the Spotlight edition/methodology version every N published reviews. */
const SPOTLIGHT_BUMP_INTERVAL = 25;
/** Count of reviews already in src/data/reviews.ts at the time this pipeline shipped. */
const STATIC_REVIEW_BASELINE = 160;

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

export default async function handler(req: VercelReq, res: VercelRes) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = String(req.headers.authorization ?? "");
  const authorised = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
  if (!authorised) {
    res.status(401).json({ error: "Not authorised" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !geminiKey && "GEMINI_API_KEY",
    !firecrawlKey && "FIRECRAWL_API_KEY",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    res.status(500).json({ error: `Not configured: missing ${missing.join(", ")} in Vercel project environment variables` });
    return;
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(SUPABASE_URL, serviceRoleKey as string, { auth: { persistSession: false } });

  const today = new Date().toISOString().slice(0, 10);
  const errors: string[] = [];
  let created = 0;

  try {
    const { count: publishedToday } = await admin
      .from("ai_generated_product_reviews")
      .select("id", { count: "exact", head: true })
      .eq("published_date", today);
    if ((publishedToday ?? 0) >= MAX_REVIEWS_PER_RUN) {
      res.status(200).json({ ok: true, created: 0, message: "Daily target already met" });
      return;
    }

    const target = Math.min(MAX_REVIEWS_PER_RUN, Math.max(MIN_REVIEWS_PER_RUN, MAX_REVIEWS_PER_RUN - (publishedToday ?? 0)));

    const { data: existingRows } = await admin.from("ai_generated_product_reviews").select("source_url, origin");
    const seenUrls = new Set((existingRows ?? []).map((r: { source_url: string }) => r.source_url));
    const saCount = (existingRows ?? []).filter((r: { origin: string }) => r.origin === "south_africa").length;
    const globalCount = (existingRows ?? []).length - saCount;

    // ---- Candidate pool A: real OpenHaus marketplace products (already-verified data,
    // no scraping needed -- Gemini only writes the verdict/scores against real fields). ----
    const { data: marketplaceRows } = await admin
      .from("marketplace_products")
      .select("slug, name, description, marked_up_price_zar, category, key_actives, concern, brand:marketplace_brands(name)")
      .eq("in_stock", true)
      .limit(40);

    const marketplaceCandidates = ((marketplaceRows ?? []) as unknown as MarketplaceProductRow[]).filter(
      (p) => !seenUrls.has(`https://skinlabs.co.za/marketplace/product/${p.slug}`),
    );

    // ---- Candidate pool B: Firecrawl-sourced real product pages from the named sites. ----
    const firecrawlCandidates: Array<{ site: SourceSite; page: FirecrawlPage }> = [];
    for (const site of SOURCE_SITES) {
      if (firecrawlCandidates.length >= target * 2) break;
      try {
        const pages =
          site.sourceType === "faithful_to_nature"
            ? [await firecrawlScrape(site.url, firecrawlKey as string)].filter((p): p is FirecrawlPage => Boolean(p))
            : await firecrawlSearchProductPages(site, firecrawlKey as string, 3);
        for (const page of pages) {
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
    const queue: Array<{ text: string; origin: Origin; sourceUrl: string; sourceType: SourceType; isSponsored: boolean; retailerHint: Retailer | null }> = [];
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
      try {
        const fields = await generateReview(candidate.text, geminiKey as string, model);
        if (!fields.product_name || !fields.brand) continue;

        const slug = slugify(`${fields.brand}-${fields.product_name}`);
        const id = `aigen-${slug || Date.now()}`;
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
          generated_by: "gemini",
          published_date: today,
        });

        if (error) {
          errors.push(`${candidate.sourceUrl}: ${error.message}`);
        } else {
          created += 1;
          seenUrls.add(candidate.sourceUrl);
          if (candidate.origin === "south_africa") runningSa += 1;
          else runningGlobal += 1;
        }
      } catch (err) {
        const message = err instanceof GeminiError ? `Gemini ${err.status}: ${err.message}` : String(err);
        errors.push(message.slice(0, 300));
        if (err instanceof GeminiError && err.status === 429) await sleep(10000);
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

    res.status(200).json({ ok: true, created, target, errors });
  } catch (err) {
    res.status(500).json({ error: String(err).slice(0, 500), created, errors });
  }
}
