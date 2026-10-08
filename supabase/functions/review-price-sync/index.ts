/**
 * review-price-sync — real South African retail prices for EVERY published product review
 * (static catalogue, AI-generated and Sponsored/OpenHaus) from Takealot, Dis-Chem, Clicks, Dermastore,
 * SkinMiles and Faithful to Nature.
 *
 * Replaces Firecrawl for review pricing. One web search per product covers all six shops:
 *   1. Parallel Search (default, token-efficient excerpts, allow-listed to the six domains);
 *   2. Nimble Search, only when Parallel is unavailable (401/402/403/429/5xx or no key);
 * Candidates come from the pure, tested library (_shared/pricing/reviewPrices.ts): a price is only read
 * from a retailer PRODUCT page whose title passes the strict matcher. Every candidate is saved as
 * `pending`; nothing is public until a person approves it in Admin > SA Prices. An approved listing
 * refreshes itself on re-check unless its price jumps >50% (then it goes back to review).
 *
 * Schedule: pg_cron (migration 20261008200200) calls this every 10 minutes ONLY when a target is due.
 * A target is due every 25 days (prices must be re-verified within 30), or after 7 days if nothing was
 * found. New generated reviews get a target from a database trigger, so every future review-generation
 * run is priced by this job without changes to those pipelines.
 *
 * Auth: `x-cron-secret` (checked in the database against Vault `review_price_sync_cron_secret`), the
 * service-role bearer, or a signed-in admin's JWT. Secrets (set as Edge Function secrets by a human):
 * PARALLEL_API_KEY (default) and NIMBLE_API_KEY (fallback).
 *
 * POST body: { limit?: 1-10 (default 4), review_id?: string, source?: "auto"|"parallel"|"nimble", wait?: boolean }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildReviewPriceCandidates,
  buildSearchQueries,
  REVIEW_RETAILERS,
  searchObjective,
  type PriceSearchResult,
} from "../_shared/pricing/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PARALLEL_KEY = (Deno.env.get("PARALLEL_API_KEY") ?? "").trim();
const NIMBLE_KEY = (Deno.env.get("NIMBLE_API_KEY") ?? "").trim();
const RUN_TIME_BUDGET_MS = 110_000;
const DOMAINS = REVIEW_RETAILERS.map((r) => r.domain);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
type Provider = "parallel_search" | "nimble";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Provider cannot serve us right now (limits, auth, outage). The next provider is tried. */
class ProviderUnavailable extends Error {
  constructor(public provider: Provider, public detail: string) {
    super(`${provider}: ${detail}`);
  }
}

async function searchParallel(target: { brand: string; name: string; sizeMl?: number | null }): Promise<PriceSearchResult[]> {
  if (!PARALLEL_KEY) throw new ProviderUnavailable("parallel_search", "no PARALLEL_API_KEY");
  const res = await fetch("https://api.parallel.ai/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": PARALLEL_KEY },
    body: JSON.stringify({
      objective: searchObjective(target),
      search_queries: buildSearchQueries(target),
      advanced_settings: {
        source_policy: { include_domains: DOMAINS },
        excerpt_settings: { max_chars_per_result: 1500 },
        max_results: 20,
      },
    }),
  });
  if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429 || res.status >= 500) {
    throw new ProviderUnavailable("parallel_search", `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(`Parallel Search HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { results?: { url: string; title?: string | null; excerpts?: string[] }[] };
  return (body.results ?? []).map((r) => ({ url: r.url, title: r.title, text: (r.excerpts ?? []).join("\n") }));
}

async function searchNimble(target: { brand: string; name: string }): Promise<PriceSearchResult[]> {
  if (!NIMBLE_KEY) throw new ProviderUnavailable("nimble", "no NIMBLE_API_KEY");
  const res = await fetch("https://sdk.nimbleway.com/v2/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${NIMBLE_KEY}` },
    body: JSON.stringify({
      query: `${target.brand} ${target.name} price rand`,
      include_domains: DOMAINS,
      max_results: 20,
      search_depth: "fast",
      output_format: "plain_text",
    }),
  });
  if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429 || res.status >= 500) {
    throw new ProviderUnavailable("nimble", `HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(`Nimble HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { results?: { url: string; title?: string | null; description?: string | null; content?: string | null }[] };
  return (body.results ?? []).map((r) => ({ url: r.url, title: r.title, text: [r.content, r.description].filter(Boolean).join("\n") }));
}

interface RunState {
  down: Set<Provider>;
  perProvider: Record<string, number>;
  stop: string | null;
}

async function search(state: RunState, source: string, target: { brand: string; name: string; sizeMl?: number | null }) {
  const order: Provider[] = source === "nimble" ? ["nimble"] : source === "parallel" ? ["parallel_search"] : ["parallel_search", "nimble"];
  const errors: string[] = [];
  for (const provider of order) {
    if (state.down.has(provider)) {
      errors.push(`${provider}: unavailable earlier in this run`);
      continue;
    }
    try {
      const results = provider === "parallel_search" ? await searchParallel(target) : await searchNimble(target);
      state.perProvider[provider] = (state.perProvider[provider] ?? 0) + 1;
      return { provider, results };
    } catch (e) {
      if (e instanceof ProviderUnavailable) {
        state.down.add(provider);
        errors.push(e.message);
        continue;
      }
      throw e;
    }
  }
  throw new ProviderUnavailable(order[0], errors.join("; "));
}

async function authorised(req: Request, admin: Admin): Promise<boolean> {
  const secret = req.headers.get("x-cron-secret");
  if (secret) {
    const { data } = await admin.rpc("verify_review_price_secret", { p_secret: secret });
    if (data === true) return true;
  }
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!bearer) return false;
  if (SERVICE_KEY && bearer === SERVICE_KEY) return true;
  const { data: userData } = await admin.auth.getUser(bearer);
  const uid = userData?.user?.id;
  if (!uid) return false;
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
  return isAdmin === true;
}

async function runBatch(admin: Admin, runId: string, limit: number, reviewId: string | null, source: string) {
  const started = Date.now();
  const state: RunState = { down: new Set(), perProvider: {}, stop: null };
  const summary = { targets: 0, checked: 0, with_listings: 0, listings_saved: 0, refreshed: 0, sent_back_to_review: 0, empty: 0, deferred: 0, errors: [] as string[] };

  const { data: batch, error } = await admin.rpc("get_review_price_batch", { p_limit: limit, p_review_id: reviewId });
  if (error) {
    state.stop = `batch: ${error.message}`;
  }
  const targets = (batch ?? []) as { review_id: string; product_name: string; brand: string; size_ml: number | null }[];
  summary.targets = targets.length;

  for (const t of targets) {
    if (Date.now() - started > RUN_TIME_BUDGET_MS) {
      state.stop = "time";
      break;
    }
    try {
      const target = { brand: t.brand, name: t.product_name, sizeMl: t.size_ml };
      const { provider, results } = await search(state, source, target);
      const candidates = buildReviewPriceCandidates(target, results);
      const listings = candidates.map((c) => ({
        retailer: c.retailer,
        url: c.url,
        title: c.title,
        price_zar: c.priceZar,
        special_price_zar: c.specialPriceZar,
        in_stock: c.inStock,
        size_ml: c.sizeMl,
        confidence: c.confidence,
        needs_attention: c.needsAttention,
        reasons: c.reasons,
        evidence: c.evidence,
      }));
      const { data: saved, error: saveErr } = await admin.rpc("save_review_price_check", { p_review_id: t.review_id, p_source: provider, p_listings: listings });
      if (saveErr) throw new Error(saveErr.message);
      summary.checked++;
      if (listings.length > 0) summary.with_listings++;
      else summary.empty++;
      summary.listings_saved += saved?.inserted ?? 0;
      summary.refreshed += saved?.refreshed ?? 0;
      summary.sent_back_to_review += saved?.sent_back_to_review ?? 0;
    } catch (e) {
      if (e instanceof ProviderUnavailable) {
        // Nothing was learned: retry later, and stop hammering unavailable providers.
        await admin.rpc("defer_review_price_check", { p_review_id: t.review_id, p_hours: 6 });
        summary.deferred++;
        state.stop = `providers_unavailable: ${e.detail}`;
        break;
      }
      summary.errors.push(`${t.review_id}: ${(e as Error).message}`.slice(0, 200));
      await admin.rpc("defer_review_price_check", { p_review_id: t.review_id, p_hours: 6 });
      summary.deferred++;
    }
  }

  const status = state.stop?.startsWith("providers_unavailable") ? "blocked" : summary.errors.length > 0 ? "partial" : "ok";
  await admin
    .from("review_price_runs")
    .update({ finished_at: new Date().toISOString(), status, summary: { ...summary, providers: state.perProvider, stop: state.stop } })
    .eq("id", runId);
  return { status, ...summary, providers: state.perProvider, stop: state.stop };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!(await authorised(req, admin))) return json({ error: "unauthorised" }, 401);

  const body = (await req.json().catch(() => ({}))) as { limit?: number; review_id?: string; source?: string; wait?: boolean };
  const limit = Math.max(1, Math.min(Number(body.limit ?? 4) || 4, 10));
  const source = body.source === "parallel" || body.source === "nimble" ? body.source : "auto";
  const reviewId = typeof body.review_id === "string" && body.review_id.length < 200 ? body.review_id : null;

  if (!PARALLEL_KEY && !NIMBLE_KEY) {
    // Fail before claiming anything: targets stay due and the job resumes the moment a key is set.
    return json({ status: "blocked_not_configured", detail: "set PARALLEL_API_KEY (and optionally NIMBLE_API_KEY) as Edge Function secrets" }, 503);
  }

  const { data: run, error } = await admin.from("review_price_runs").insert({ source, status: "running" }).select("id").single();
  if (error || !run) return json({ error: "could not start run" }, 500);

  const work = runBatch(admin, run.id, limit, reviewId, source).catch(async (e) => {
    await admin.from("review_price_runs").update({ finished_at: new Date().toISOString(), status: "error", summary: { error: String(e).slice(0, 300) } }).eq("id", run.id);
  });
  if (body.wait) return json(await work.then(async () => (await admin.from("review_price_runs").select("status, summary").eq("id", run.id).single()).data));
  // @ts-expect-error EdgeRuntime is provided by the Supabase Edge runtime
  EdgeRuntime.waitUntil(work);
  return json({ status: "accepted", run_id: run.id }, 202);
});
