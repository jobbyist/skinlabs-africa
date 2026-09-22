/**
 * Shelf Showdown weekly comparison-article pipeline.
 *
 * Three clean roles, matching the existing product-review-sync/briefings-sync
 * pipelines' four-role architecture minus a researcher step -- there's no
 * Firecrawl role here because both compared products are already
 * SkinLabs-reviewed, real data:
 *   - Supabase   = memory + orchestration + publication (pair selection,
 *                  dedup, quota, storage in ai_generated_comparisons)
 *   - Gemini     = analyst + writer (turns two real, already-scored reviews
 *                  into a grounded head-to-head -- never invents a product,
 *                  price, ingredient or claim beyond what the two source
 *                  reviews already say)
 *   - SkinLabs   = editorial presentation (Compare.tsx/ComparisonArticle.tsx
 *                  render whatever lands here merged with the static
 *                  src/data/comparisons-part*.ts catalogue via
 *                  src/hooks/use-generated-comparisons.ts, zero
 *                  pipeline-specific UI code)
 *
 * Publishes 3-5 new Shelf Showdown comparisons/week via pg_cron, Thursdays
 * at 17:00 SAST (15:00 UTC) -- see supabase/migrations/
 * 20260922060000_shelf_showdown_pipeline.sql for the schedule and the
 * ai_generated_comparisons table.
 *
 * Sourcing: pairs are drawn ONLY from public.ai_generated_product_reviews
 * (the live product-review-sync pipeline's own output) -- never from the
 * static src/data/reviews.ts catalogue, which this edge function has no
 * way to read at runtime (it's bundled into the Vite app, not a DB table).
 * Two products in the SAME category, never already compared (tracked via
 * a stable pair_key), are the only inputs Gemini receives -- it is
 * explicitly instructed to ground every claim in the two supplied reviews'
 * own scores/verdict/ingredients and never manufacture a "winner": SkinLabs'
 * existing editorial voice for this franchise (see Compare.tsx's "How Shelf
 * Showdown works" copy) is "better for X", never a universal winner.
 *
 * Auth accepts EITHER of:
 *   - `x-cron-secret: <value>` checked against the `SHELF_SHOWDOWN_CRON_SECRET`
 *     Supabase Edge Function secret (Deno.env.get(...) -- never a literal in
 *     source). The pg_cron job pulls the same value from Supabase Vault at
 *     call time (`vault.decrypted_secrets`), so the plaintext secret is
 *     never committed to this repo -- same pattern as product-review-sync/
 *     briefings-sync after their 2026-09-22 hardcoded-secret fix.
 *   - A Supabase Auth JWT for a user holding the `admin` role.
 *
 * Required Supabase Edge Function secret:
 *   - GOOGLE_API_KEY_COMPARE   Google AI Studio / Gemini API key for this
 *     pipeline specifically (a distinct key from GEMINI_API_KEY_REVIEWS/
 *     _BRIEFINGS, per the pattern already established of one key per
 *     pipeline on this project).
 *   - SHELF_SHOWDOWN_CRON_SECRET   See auth section above.
 * SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are reserved, auto-injected.
 *
 * Optional:
 *   - GEMINI_MODEL_COMPARE, GEMINI_MODEL_COMPARE_FALLBACK_1/2 (defaults
 *     match the other pipelines' chain: gemini-3.6-flash / -3.1-flash-lite /
 *     -3.5-flash-lite).
 *   - GEMINI_DAILY_LIMIT_COMPARE / GEMINI_PER_MINUTE_LIMIT_COMPARE (default
 *     100/day, 10/minute -- same conservative placeholders as the other
 *     pipelines; this pipeline uses its own pipeline_api_usage `purpose`
 *     prefix so its quota accounting never collides with the daily
 *     pipelines' counts).
 *
 * Manual re-trigger: same endpoint, no special query param needed -- the
 * weekly cap (see WEEKLY_SHOWDOWN_CAP below) is computed from the most
 * recent Thursday 15:00 UTC boundary, so re-triggering mid-week tops up
 * toward that cap rather than publishing a fresh batch every time.
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

/** Editorial target: 3-5 new Shelf Showdowns per week. */
const WEEKLY_SHOWDOWN_CAP = 5;
const MIN_BODY_WORD_COUNT = 350;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

type SupabaseAdmin = SupabaseClient;

// ---------------------------------------------------------------------------
// A small pool of already-published, correctly-credited Unsplash images
// pulled from the existing static src/data/comparisons-part*.ts catalogue --
// reused rather than calling an unconfigured/uncredentialled photo API for
// this pipeline. Real photos, real photographer credit, already licensed
// for use on this exact franchise.
// ---------------------------------------------------------------------------
interface ThumbnailPick {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
  categories: string[];
}
const THUMBNAIL_POOL: ThumbnailPick[] = [
  {
    url: "https://images.unsplash.com/photo-1741896135512-084b251887f7?auto=format&fit=crop&w=1600&q=80",
    alt: "A skincare serum bottle and glass dropper resting on a pink surface",
    creditName: "Maria Lupan",
    creditUrl: "https://unsplash.com/@luandmario",
    categories: ["Serum"],
  },
  {
    url: "https://images.unsplash.com/photo-1710410815589-dd83514104d0?auto=format&fit=crop&w=1600&q=80",
    alt: "A glass skincare serum bottle with a black cap and silver dropper",
    creditName: "Muhammad Sulyman",
    creditUrl: "https://unsplash.com/@msulyman",
    categories: ["Serum"],
  },
  {
    url: "https://images.unsplash.com/photo-1622910076411-b126ff7e469b?auto=format&fit=crop&w=1600&q=80",
    alt: "A jar of thick barrier-repair moisturising cream on a neutral surface",
    creditName: "Daniela Chavez",
    creditUrl: "https://unsplash.com/@dani8808",
    categories: ["Moisturiser"],
  },
  {
    url: "https://images.unsplash.com/photo-1765964492963-b0aa8c172431?auto=format&fit=crop&w=1600&q=80",
    alt: "A jar of everyday face moisturiser on a marble surface",
    creditName: "Keity",
    creditUrl: "https://unsplash.com/@keityeco",
    categories: ["Moisturiser"],
  },
  {
    url: "https://images.unsplash.com/photo-1597931752949-98c74b5b159f?auto=format&fit=crop&w=1600&q=80",
    alt: "A cleanser bottle with a pump dispenser on a plain white surface",
    creditName: "Sincerely Media",
    creditUrl: "https://unsplash.com/@sincerelymedia",
    categories: ["Cleanser"],
  },
  {
    url: "https://images.unsplash.com/photo-1592819047700-2e18338a82f5?auto=format&fit=crop&w=1600&q=80",
    alt: "A bottle of micellar water on a bathroom counter",
    creditName: "Valentin Lacoste",
    creditUrl: "https://unsplash.com/@valentinlacoste",
    categories: ["Cleanser"],
  },
  {
    url: "https://images.unsplash.com/photo-1708642448328-37631ca58d65?auto=format&fit=crop&w=1600&q=80",
    alt: "A tube of sunscreen resting on a knit blue sweater",
    creditName: "Isaac Wolff",
    creditUrl: "https://unsplash.com/@isaacwolff",
    categories: ["Sunscreen"],
  },
  {
    url: "https://images.unsplash.com/photo-1594997791693-9e28b4bbad80?auto=format&fit=crop&w=1600&q=80",
    alt: "A white and blue sunscreen tube standing upright against a plain background",
    creditName: "BATCH by Wisconsin Hemp Scientific",
    creditUrl: "https://unsplash.com/@batch_by_whs",
    categories: ["Sunscreen"],
  },
  {
    url: "https://images.unsplash.com/photo-1637523783035-bcda83e8bff7?auto=format&fit=crop&w=1600&q=80",
    alt: "A glass body oil bottle with dropper on a neutral background",
    creditName: "Alia Hasan",
    creditUrl: "https://unsplash.com/@aliahasan",
    categories: ["Body"],
  },
  {
    url: "https://images.unsplash.com/photo-1671493235081-5842463637cd?auto=format&fit=crop&w=1600&q=80",
    alt: "A classic amber tissue oil bottle on a plain background",
    creditName: "Denise Chan",
    creditUrl: "https://unsplash.com/@elchan",
    categories: ["Body"],
  },
  {
    url: "https://images.unsplash.com/photo-1770732766528-d0e9fd0df233?auto=format&fit=crop&w=1600&q=80",
    alt: "A dark amber retinol serum bottle photographed in low light",
    creditName: "Ela De Pure",
    creditUrl: "https://unsplash.com/@eladepure",
    categories: ["Exfoliant"],
  },
  {
    url: "https://images.unsplash.com/photo-1687293375398-65aadbb792d1?auto=format&fit=crop&w=1600&q=80",
    alt: "A shelf stocked with an assortment of skincare product bottles",
    creditName: "Omar Lopez",
    creditUrl: "https://unsplash.com/@omarlopez1",
    categories: ["Eye Cream", "Mist"],
  },
];

function pickThumbnail(category: string, usedUrls: Set<string>): ThumbnailPick {
  const matching = THUMBNAIL_POOL.filter((t) => t.categories.includes(category) && !usedUrls.has(t.url));
  const pool = matching.length > 0 ? matching : THUMBNAIL_POOL.filter((t) => !usedUrls.has(t.url));
  const chosen = pool.length > 0 ? pool[0] : THUMBNAIL_POOL[0];
  usedUrls.add(chosen.url);
  return chosen;
}

// ---------------------------------------------------------------------------
// GEMINI: analyst + writer.
// ---------------------------------------------------------------------------

interface GeneratedComparisonFields {
  title: string;
  dek: string;
  sa_context: string;
  body_markdown: string;
  key_takeaways: string[];
  verdicts: { label: string; text: string }[];
  faqs: { question: string; answer: string }[];
  seo_title: string;
  seo_description: string;
}

const COMPARISON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    sa_context: { type: "string" },
    body_markdown: { type: "string" },
    key_takeaways: { type: "array", items: { type: "string" } },
    verdicts: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, text: { type: "string" } },
        required: ["label", "text"],
      },
    },
    faqs: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, answer: { type: "string" } },
        required: ["question", "answer"],
      },
    },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
  },
  required: ["title", "dek", "sa_context", "body_markdown", "key_takeaways", "verdicts", "faqs", "seo_title", "seo_description"],
} as const;

const COMPARISON_INSTRUCTIONS = `You are writing a "Shelf Showdown" for SkinLabs South Africa -- a head-to-head
comparison of exactly two products that a South African shopper would genuinely be
choosing between. Ground every claim STRICTLY in the two source reviews supplied below
-- never invent a product, price, ingredient, score or claim not present in them.

Editorial rule: there is NO universal winner. Every Shelf Showdown is a "better for X"
breakdown -- one product may suit oily/acne-prone skin or a tighter budget, the other
may suit dry/sensitive skin or someone who wants the stronger active. Be explicit when
the honest answer is "it depends on your skin, budget or climate."

title: punchy, names both brands, no clickbait.
dek: one sentence, the actual tension between the two products.
sa_context: 2-4 words, e.g. "Budget vs premium" or "Sensitive skin pick".
body_markdown: 450-650 words, plain paragraphs and a short comparison list using
  markdown -- covers actives/ingredients, texture, SA-climate performance and
  Rand-for-Rand value for BOTH products, grounded only in the supplied data.
key_takeaways: 3-4 short bullet-style sentences.
verdicts: exactly 2 entries, one per product, label = a short "Better for..." phrase,
  text = 1-2 sentences on who that product actually suits.
faqs: 2-3 genuinely useful questions a shopper would ask, answered from the source data.
seo_title: under 60 characters, includes both brand names.
seo_description: under 155 characters.
Never fabricate scarcity, ratings, "clinically proven" language, or a named-condition
treatment claim the source reviews don't themselves support. No exclamation marks.`;

function parseComparisonResponse(text: string): GeneratedComparisonFields {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) throw new Error("Gemini response was not a JSON object");
  return {
    title: String(parsed.title ?? "").slice(0, 150),
    dek: String(parsed.dek ?? "").slice(0, 300),
    sa_context: String(parsed.sa_context ?? "").slice(0, 40),
    body_markdown: String(parsed.body_markdown ?? ""),
    key_takeaways: Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways.slice(0, 5).map((t: unknown) => String(t)) : [],
    verdicts: Array.isArray(parsed.verdicts)
      ? parsed.verdicts.slice(0, 2).map((v: { label?: unknown; text?: unknown }) => ({ label: String(v?.label ?? ""), text: String(v?.text ?? "") }))
      : [],
    faqs: Array.isArray(parsed.faqs)
      ? parsed.faqs.slice(0, 4).map((f: { question?: unknown; answer?: unknown }) => ({ question: String(f?.question ?? ""), answer: String(f?.answer ?? "") }))
      : [],
    seo_title: String(parsed.seo_title ?? "").slice(0, 70),
    seo_description: String(parsed.seo_description ?? "").slice(0, 165),
  };
}

function qaComparison(fields: GeneratedComparisonFields): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const wc = countWords(fields.body_markdown);
  if (wc < MIN_BODY_WORD_COUNT) reasons.push(`body word count ${wc} below minimum ${MIN_BODY_WORD_COUNT}`);
  if (!fields.title || fields.title.trim().length < 8) reasons.push("missing/too-short title");
  if (!fields.dek || fields.dek.trim().length < 10) reasons.push("missing/too-short dek");
  if (fields.verdicts.length !== 2) reasons.push(`expected exactly 2 verdicts, got ${fields.verdicts.length}`);
  if (fields.key_takeaways.length < 2) reasons.push("fewer than 2 key_takeaways");
  if (/\bclinically proven\b|\bdermatologist recommended\b|\bguaranteed results\b|\bwinner\b/i.test(fields.body_markdown)) {
    reasons.push("body contains an unverifiable superlative or declares a universal winner");
  }
  for (const flag of scanComplianceFlags(fields.body_markdown)) reasons.push(flag);
  return { passed: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// SUPABASE AS MEMORY: quota + pair selection.
// ---------------------------------------------------------------------------

async function recordApiUsage(admin: SupabaseAdmin, success: boolean) {
  try {
    await admin.from("pipeline_api_usage").insert({ provider: "gemini", purpose: "shelf-showdown-sync", success });
  } catch {
    // Quota logging must never fail the run itself.
  }
}

async function withinDailyQuota(admin: SupabaseAdmin, limit: number): Promise<boolean> {
  const sinceUtcMidnight = new Date();
  sinceUtcMidnight.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", "gemini")
    .eq("purpose", "shelf-showdown-sync")
    .gte("called_at", sinceUtcMidnight.toISOString());
  return (count ?? 0) < limit;
}

async function withinPerMinuteQuota(admin: SupabaseAdmin, limit: number): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("pipeline_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", "gemini")
    .eq("purpose", "shelf-showdown-sync")
    .gte("called_at", oneMinuteAgo);
  return (count ?? 0) < limit;
}

/** Most recent Thursday 15:00 UTC boundary on/before now -- the weekly cap resets here. */
function currentShowdownWeekStart(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0));
  const dayDiff = (d.getUTCDay() - 4 + 7) % 7; // days since last Thursday
  d.setUTCDate(d.getUTCDate() - dayDiff);
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

interface ReviewRow {
  id: string;
  product_name: string;
  brand: string;
  category: string;
  local_price_zar: number;
  score_efficacy: number;
  score_value: number;
  score_texture: number;
  score_climate: number;
  verdict: string;
  key_ingredients: string[];
  skin_type_match: string[];
  where_to_buy: string;
}

const pairKeyFor = (a: string, b: string) => [a, b].sort().join("::");

function buildCandidatePairs(reviews: ReviewRow[], usedPairKeys: Set<string>): [ReviewRow, ReviewRow][] {
  const byCategory = new Map<string, ReviewRow[]>();
  for (const r of reviews) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }
  const pairs: [ReviewRow, ReviewRow][] = [];
  for (const list of byCategory.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.brand === b.brand && a.product_name === b.product_name) continue;
        const key = pairKeyFor(a.id, b.id);
        if (usedPairKeys.has(key)) continue;
        pairs.push([a, b]);
      }
    }
  }
  // Prefer the widest price gap -- the most compelling "which is actually worth it" story.
  pairs.sort((p1, p2) => Math.abs(p2[0].local_price_zar - p2[1].local_price_zar) - Math.abs(p1[0].local_price_zar - p1[1].local_price_zar));
  return pairs;
}

function reviewToGroundingText(r: ReviewRow, label: "A" | "B"): string {
  return `Product ${label}: ${r.product_name} by ${r.brand}
Category: ${r.category}
Price: R${r.local_price_zar}
Where to buy: ${r.where_to_buy}
Scores (0-10): efficacy ${r.score_efficacy}, value ${r.score_value}, texture ${r.score_texture}, SA-climate performance ${r.score_climate}
Key ingredients: ${r.key_ingredients.join(", ") || "not specified"}
Skin type match: ${r.skin_type_match.join(", ") || "not specified"}
SkinLabs verdict: ${r.verdict}`;
}

async function isAuthorised(req: Request, admin: SupabaseAdmin): Promise<boolean> {
  const cronSecret = Deno.env.get("SHELF_SHOWDOWN_CRON_SECRET");
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

  const geminiKey = Deno.env.get("GOOGLE_API_KEY_COMPARE");
  if (!geminiKey) {
    return new Response(
      JSON.stringify({ error: "Not configured: missing GOOGLE_API_KEY_COMPARE as a Supabase Edge Function secret (supabase secrets set ...)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const modelChain = [
    Deno.env.get("GEMINI_MODEL_COMPARE") || "gemini-3.6-flash",
    Deno.env.get("GEMINI_MODEL_COMPARE_FALLBACK_1") || "gemini-3.1-flash-lite",
    Deno.env.get("GEMINI_MODEL_COMPARE_FALLBACK_2") || "gemini-3.5-flash-lite",
  ];
  const GEMINI_DAILY_LIMIT = Number(Deno.env.get("GEMINI_DAILY_LIMIT_COMPARE")) || 100;
  const GEMINI_PER_MINUTE_LIMIT = Number(Deno.env.get("GEMINI_PER_MINUTE_LIMIT_COMPARE")) || 10;

  const runId = crypto.randomUUID();
  const errors: string[] = [];
  const modelUsage: Record<string, number> = {};
  let created = 0;

  const logModelAttempt = (candidateKey: string) => async (log: GeminiAttemptLog) => {
    await recordApiUsage(admin, log.outcome === "success");
    try {
      await admin.from("pipeline_model_calls").insert({
        pipeline: "shelf-showdown-sync",
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
    const weekStart = currentShowdownWeekStart();
    const { count: publishedThisWeek } = await admin
      .from("ai_generated_comparisons")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString());
    if ((publishedThisWeek ?? 0) >= WEEKLY_SHOWDOWN_CAP) {
      return jsonResponse({ ok: true, created: 0, message: "Weekly Shelf Showdown cap already met", weekStart: weekStart.toISOString() });
    }
    const target = WEEKLY_SHOWDOWN_CAP - (publishedThisWeek ?? 0);

    const { data: reviewRows } = await admin
      .from("ai_generated_product_reviews")
      .select(
        "id, product_name, brand, category, local_price_zar, score_efficacy, score_value, score_texture, score_climate, verdict, key_ingredients, skin_type_match, where_to_buy",
      );
    const reviews = (reviewRows ?? []) as ReviewRow[];

    const { data: existingPairs } = await admin.from("ai_generated_comparisons").select("pair_key");
    const usedPairKeys = new Set((existingPairs ?? []).map((r: { pair_key: string }) => r.pair_key));
    const usedThumbnails = new Set<string>();

    const { data: existingIds } = await admin.from("ai_generated_comparisons").select("id");
    const takenIds = new Set((existingIds ?? []).map((r: { id: string }) => r.id));

    const candidates = buildCandidatePairs(reviews, usedPairKeys);
    if (candidates.length === 0) {
      return jsonResponse({ ok: true, created: 0, message: "No eligible product pairs available -- need at least 2 reviews in the same category that haven't already been compared" });
    }

    for (const [a, b] of candidates) {
      if (created >= target) break;

      if (!(await withinDailyQuota(admin, GEMINI_DAILY_LIMIT))) {
        errors.push(`Gemini daily quota (${GEMINI_DAILY_LIMIT}) reached -- stopping run`);
        break;
      }
      if (!(await withinPerMinuteQuota(admin, GEMINI_PER_MINUTE_LIMIT))) {
        await sleep(15000);
        if (!(await withinPerMinuteQuota(admin, GEMINI_PER_MINUTE_LIMIT))) {
          errors.push(`Gemini per-minute quota (${GEMINI_PER_MINUTE_LIMIT}) reached -- stopping run`);
          break;
        }
      }

      const pairKey = pairKeyFor(a.id, b.id);
      const userContent = `${reviewToGroundingText(a, "A")}\n\n${reviewToGroundingText(b, "B")}`;

      try {
        const { data: fields, modelUsed } = await callGeminiWithFallback({
          apiKey: geminiKey,
          models: modelChain,
          systemInstruction: COMPARISON_INSTRUCTIONS,
          userContent,
          responseSchema: COMPARISON_SCHEMA,
          temperature: 0.5,
          parse: parseComparisonResponse,
          onAttempt: logModelAttempt(pairKey),
        });
        modelUsage[modelUsed] = (modelUsage[modelUsed] ?? 0) + 1;

        const qa = qaComparison(fields);
        if (!qa.passed) {
          errors.push(`QA rejected ${pairKey}: ${qa.reasons.join("; ")}`);
          continue;
        }

        let id = slugify(fields.title) || `showdown-${pairKey}`;
        if (takenIds.has(id)) id = `${id}-${Math.floor(Math.random() * 9000 + 1000)}`;

        const thumbnail = pickThumbnail(a.category, usedThumbnails);
        const today = new Date().toISOString().slice(0, 10);
        const wordsPerMinute = 220;
        const readingMinutes = Math.max(3, Math.round(countWords(fields.body_markdown) / wordsPerMinute));

        const productsCompared = [a, b].map((r) => ({
          name: r.product_name,
          brand: r.brand,
          priceZar: r.local_price_zar,
          reviewSlug: r.id,
          officialBrandUrl: "https://skinlabs.co.za/reviews/" + r.id,
        }));

        const { error } = await admin.from("ai_generated_comparisons").insert({
          id,
          title: fields.title,
          dek: fields.dek,
          sa_context: fields.sa_context,
          body_markdown: fields.body_markdown,
          key_takeaways: fields.key_takeaways,
          verdicts: fields.verdicts,
          faqs: fields.faqs,
          products_compared: productsCompared,
          source_review_ids: [a.id, b.id],
          pair_key: pairKey,
          thumbnail_url: thumbnail.url,
          thumbnail_alt: thumbnail.alt,
          thumbnail_credit_name: thumbnail.creditName,
          thumbnail_credit_url: thumbnail.creditUrl,
          reading_time: `${readingMinutes} min read`,
          seo_title: fields.seo_title,
          seo_description: fields.seo_description,
          generated_by: modelUsed,
          publish_date: today,
          modified_date: today,
        });

        if (error) {
          errors.push(`${pairKey}: ${error.message}`);
        } else {
          created += 1;
          takenIds.add(id);
          usedPairKeys.add(pairKey);
        }
      } catch (err) {
        if (err instanceof GeminiFatalError) {
          errors.push(`ALERT (Gemini config, run stopped): ${err.message}`);
          break;
        }
        if (err instanceof GeminiAllModelsExhaustedError) {
          errors.push(
            `All ${modelChain.length} Gemini models exhausted for ${pairKey}: ` +
              err.attempts.map((a2) => `${a2.model}#${a2.attemptNumber}=${a2.outcome}`).join(", "),
          );
        } else {
          errors.push(String(err).slice(0, 300));
        }
      }
      await sleep(1200);
    }

    return jsonResponse({ ok: true, created, target, modelUsage, weekStart: weekStart.toISOString(), errors });
  } catch (err) {
    return jsonResponse({ error: String(err).slice(0, 500), created, errors }, 500);
  }
});
