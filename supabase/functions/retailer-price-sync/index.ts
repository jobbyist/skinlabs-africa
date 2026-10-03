/**
 * retailer-price-sync — keeps SkinLabs' "where to buy in South Africa" prices real.
 *
 * Two modes, per retailer (Clicks, Dis-Chem, Takealot):
 *   refresh   re-reads the product page of every MATCHED listing that is due (daily) and
 *             records the current price (append-only history in product_prices);
 *   discover  finds the right product page for variants that have none: a web search
 *             (Firecrawl) limited to the retailer's host, candidates ranked by the strict
 *             matcher, the best page read and re-checked, then saved as matched (price
 *             recorded) or needs_review (a person decides). Nothing uncertain is shown.
 *
 * Rules baked in (see _shared/pricing/retailers.ts): product pages only, tracking
 * parameters stripped, Clicks' 10 s crawl delay and 04:00-08:45 UTC window, a daily
 * Firecrawl budget, and a stop on any auth/credit error instead of hammering the API.
 * All logic that decides anything lives in the tested pure library; this file is I/O.
 *
 * Auth: `x-cron-secret`, checked inside the database against the Vault secret
 * `retailer_price_sync_cron_secret` (verify_price_sync_secret), so no Edge secret has to
 * be set by hand. Firecrawl key: FIRECRAWL_API_KEY_PRICES, else FIRECRAWL_API_KEY, else
 * FIRECRAWL_API_KEY_BRIEFINGS.
 *
 * POST body / query: { retailer: "clicks"|"dis-chem"|"takealot", mode?: "refresh"|"discover",
 * limit?: 1-25, wait?: boolean }. Without `wait` it answers 202 and works in the background;
 * with `wait` it returns the run summary (used for manual checks).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  confirmWithPage,
  canonicalListingUrl,
  evaluateObservation,
  isRetailerSlug,
  isWithinVisitWindow,
  parseListing,
  rankSearchResults,
  RETAILER_POLICIES,
  scoreMatch,
  type RetailerPolicy,
} from "../_shared/pricing/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FIRECRAWL_KEY =
  Deno.env.get("FIRECRAWL_API_KEY_PRICES") ?? Deno.env.get("FIRECRAWL_API_KEY") ?? Deno.env.get("FIRECRAWL_API_KEY_BRIEFINGS") ?? "";

const DAILY_CREDIT_BUDGET = Number(Deno.env.get("RETAILER_PRICE_DAILY_CREDIT_BUDGET") ?? "250");
const CREDITS = { search: 2, scrape: 1 } as const;
const RUN_TIME_BUDGET_MS = 110_000;
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

class FirecrawlBlocked extends Error {}

interface Outcome {
  ref: string;
  outcome: string;
}

interface RunState {
  admin: Admin;
  policy: RetailerPolicy;
  startedAt: number;
  lastRetailerRequestAt: number;
  outcomes: Outcome[];
  creditsUsed: number;
  stop: null | "blocked_firecrawl" | "budget_reached" | "outside_window" | "time";
  stopDetail?: string;
}

async function creditsUsedToday(admin: Admin): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data } = await admin
    .from("pipeline_api_usage")
    .select("purpose")
    .eq("provider", "firecrawl")
    .like("purpose", "retailer-price-sync:%")
    .gte("called_at", startOfDay.toISOString());
  let credits = 0;
  for (const row of (data ?? []) as { purpose: string }[]) {
    credits += row.purpose.endsWith(":search") ? CREDITS.search : CREDITS.scrape;
  }
  return credits;
}

async function logUsage(admin: Admin, kind: "search" | "scrape", success: boolean) {
  await admin.from("pipeline_api_usage").insert({ provider: "firecrawl", purpose: `retailer-price-sync:${kind}`, success });
}

async function firecrawl(state: RunState, kind: "search" | "scrape", path: string, body: unknown): Promise<unknown | null> {
  if (!FIRECRAWL_KEY) {
    state.stop = "blocked_firecrawl";
    state.stopDetail = "no Firecrawl key configured";
    throw new FirecrawlBlocked(state.stopDetail);
  }
  if (state.creditsUsed + CREDITS[kind] > DAILY_CREDIT_BUDGET) {
    state.stop = "budget_reached";
    state.stopDetail = "daily credit budget reached";
    throw new FirecrawlBlocked(state.stopDetail);
  }
  const res = await fetch(`${FIRECRAWL_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_KEY}` },
    body: JSON.stringify(body),
  });
  state.creditsUsed += CREDITS[kind];
  await logUsage(state.admin, kind, res.ok);
  if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429) {
    state.stop = "blocked_firecrawl";
    state.stopDetail = `Firecrawl answered ${res.status}`;
    throw new FirecrawlBlocked(state.stopDetail);
  }
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

/** Waits out the retailer's crawl delay, then reads one product page. Returns null on a transient problem. */
async function fetchProductPage(state: RunState, url: string): Promise<{ html: string; status: number } | null> {
  if (!isWithinVisitWindow(state.policy, new Date())) {
    state.stop = "outside_window";
    return null;
  }
  const wait = state.policy.minIntervalMs - (Date.now() - state.lastRetailerRequestAt);
  if (wait > 0) await sleep(wait);
  state.lastRetailerRequestAt = Date.now();
  const payload = (await firecrawl(state, "scrape", "/scrape", {
    url,
    formats: ["rawHtml"],
    onlyMainContent: false,
    maxAge: 3_600_000,
  })) as { data?: { rawHtml?: string; metadata?: { statusCode?: number } } } | null;
  const html = payload?.data?.rawHtml;
  if (typeof html !== "string") return null;
  return { html, status: payload?.data?.metadata?.statusCode ?? 200 };
}

function timeUp(state: RunState): boolean {
  if (Date.now() - state.startedAt > RUN_TIME_BUDGET_MS) {
    state.stop ??= "time";
    return true;
  }
  return state.stop !== null;
}

async function refresh(state: RunState, limit: number) {
  const { data: batch, error } = await state.admin.rpc("get_price_refresh_batch", { p_retailer: state.policy.slug, p_limit: limit });
  if (error) throw new Error(`refresh batch: ${error.message}`);
  for (const row of (batch ?? []) as {
    retailer_product_id: string;
    listing_url: string;
    last_price_zar: number | null;
    last_price_at: string | null;
    pending_price_zar: number | null;
  }[]) {
    if (timeUp(state)) break;
    const id = row.retailer_product_id;
    const canon = canonicalListingUrl(row.listing_url);
    if (!canon || canon.retailer !== state.policy.slug) {
      await state.admin.rpc("record_price_failure", { p_retailer_product_id: id, p_error: "stored URL is not a product page" });
      state.outcomes.push({ ref: id, outcome: "failed:bad_url" });
      continue;
    }
    const page = await fetchProductPage(state, canon.url);
    if (state.stop) break;
    if (!page) {
      state.outcomes.push({ ref: id, outcome: "transient:no_page" });
      continue;
    }
    if (page.status === 404 || page.status === 410) {
      await state.admin.rpc("record_price_failure", { p_retailer_product_id: id, p_error: `HTTP ${page.status}` });
      state.outcomes.push({ ref: id, outcome: `failed:http_${page.status}` });
      continue;
    }
    if (page.status >= 400) {
      state.outcomes.push({ ref: id, outcome: `transient:http_${page.status}` });
      continue;
    }
    const parsed = parseListing(state.policy.slug, page.html);
    if (!parsed) {
      await state.admin.rpc("record_price_failure", { p_retailer_product_id: id, p_error: "price not found on page" });
      state.outcomes.push({ ref: id, outcome: "failed:parse" });
      continue;
    }
    const prior = row.last_price_zar !== null && row.last_price_at ? { priceZar: Number(row.last_price_zar), recordedAt: new Date(row.last_price_at) } : null;
    const decision = evaluateObservation(parsed.priceZar, prior, new Date(), row.pending_price_zar === null ? null : Number(row.pending_price_zar));
    if (decision.action === "reject") {
      await state.admin.rpc("record_price_failure", { p_retailer_product_id: id, p_error: "price out of range" });
      state.outcomes.push({ ref: id, outcome: "failed:out_of_range" });
      continue;
    }
    const action = decision.action === "record" ? "record" : decision.action === "skip" ? "skip" : "hold";
    const { error: recErr } = await state.admin.rpc("record_price_observation", {
      p_retailer_product_id: id,
      p_action: action,
      p_price_zar: parsed.priceZar,
      p_in_stock: parsed.inStock,
      p_source_url: canon.url,
    });
    state.outcomes.push({ ref: id, outcome: recErr ? `error:${recErr.message}` : `${action}:${decision.reason}` });
  }
}

async function discover(state: RunState, limit: number) {
  const { data: batch, error } = await state.admin.rpc("get_price_discovery_batch", { p_retailer: state.policy.slug, p_limit: limit });
  if (error) throw new Error(`discovery batch: ${error.message}`);
  for (const target of (batch ?? []) as { variant_id: string; product_slug: string; brand: string; product_name: string; size_ml: number | null }[]) {
    if (timeUp(state)) break;
    const matchTarget = { brand: target.brand, name: target.product_name, sizeMl: target.size_ml };
    const search = (await firecrawl(state, "search", "/search", {
      query: `${target.brand} ${target.product_name} site:${state.policy.searchHost}`,
      limit: 8,
    })) as { data?: { web?: { url?: string; title?: string; description?: string }[] } | { url?: string; title?: string; description?: string }[] } | null;
    if (state.stop) break;
    if (search === null) {
      // The call itself failed: say nothing about the product (a miss would hide it for 30 days).
      state.outcomes.push({ ref: target.product_slug, outcome: "transient:search_failed" });
      continue;
    }
    const rows = Array.isArray(search?.data) ? search?.data : search?.data?.web ?? [];
    const candidates = rankSearchResults(
      matchTarget,
      state.policy.slug,
      (rows ?? []).filter((r): r is { url: string; title?: string; description?: string } => typeof r?.url === "string"),
    );
    if (candidates.length === 0) {
      await state.admin.rpc("mark_price_discovery_miss", { p_variant_id: target.variant_id, p_retailer_slug: state.policy.slug, p_note: "no product page found" });
      state.outcomes.push({ ref: target.product_slug, outcome: "miss:no_candidate" });
      continue;
    }

    // Read the best candidate's page: it must show a price and its own titles must confirm the match.
    const best = candidates[0];
    const page = await fetchProductPage(state, best.url);
    if (state.stop) break;
    const parsed = page && page.status < 400 ? parseListing(state.policy.slug, page.html) : null;
    let decision = best.match;
    let reasons = best.match.reasons;
    if (parsed) {
      const sizes = candidates.map((c) => c.match.listingSizeMl).filter((s): s is number => s !== null);
      const pageMatch = scoreMatch(matchTarget, [...best.evidence, ...parsed.titles].filter(Boolean), sizes, candidates.length);
      decision = confirmWithPage(best.match, pageMatch);
      reasons = decision.reasons;
    } else {
      // Can't read a price from the page: keep the URL for a person, never show it.
      decision = { ...best.match, decision: "needs_review", reasons: [...best.match.reasons, "price could not be read from the page"] };
      reasons = decision.reasons;
    }

    const { data: savedId, error: saveErr } = await state.admin.rpc("save_listing_candidate", {
      p_variant_id: target.variant_id,
      p_retailer_slug: state.policy.slug,
      p_url: best.url,
      p_title: parsed?.titles[0] ?? best.title,
      p_size_ml: decision.listingSizeMl,
      p_status: decision.decision === "rejected" ? "unmatched" : decision.decision,
      p_confidence: decision.confidence,
      p_reasons: reasons,
    });
    if (saveErr) {
      state.outcomes.push({ ref: target.product_slug, outcome: `error:${saveErr.message}` });
      continue;
    }
    if (decision.decision === "matched" && parsed && savedId) {
      await state.admin.rpc("record_price_observation", {
        p_retailer_product_id: savedId,
        p_action: "record",
        p_price_zar: parsed.priceZar,
        p_in_stock: parsed.inStock,
        p_source_url: best.url,
      });
    }
    state.outcomes.push({ ref: target.product_slug, outcome: decision.decision });
  }
}

async function run(admin: Admin, retailer: string, mode: "refresh" | "discover", limit: number): Promise<Record<string, unknown>> {
  const policy = RETAILER_POLICIES[retailer as keyof typeof RETAILER_POLICIES];
  const { data: runRow } = await admin.from("retailer_price_runs").insert({ retailer, mode }).select("id").single();
  const state: RunState = {
    admin,
    policy,
    startedAt: Date.now(),
    lastRetailerRequestAt: 0,
    outcomes: [],
    creditsUsed: await creditsUsedToday(admin),
    stop: null,
  };
  const creditsBefore = state.creditsUsed;
  let status: "ok" | "skipped" | "blocked_firecrawl" | "budget_reached" | "error" = "ok";
  let errorMessage: string | undefined;

  try {
    if (!isWithinVisitWindow(policy, new Date()) && (mode === "refresh" || mode === "discover")) {
      state.stop = "outside_window";
    } else if (mode === "refresh") {
      await refresh(state, limit);
    } else {
      await discover(state, limit);
    }
  } catch (err) {
    if (!(err instanceof FirecrawlBlocked)) {
      status = "error";
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  if (state.stop === "blocked_firecrawl") status = "blocked_firecrawl";
  else if (state.stop === "budget_reached") status = "budget_reached";
  else if (state.stop === "outside_window" && state.outcomes.length === 0) status = "skipped";

  const counts: Record<string, number> = {};
  for (const o of state.outcomes) counts[o.outcome.split(":")[0]] = (counts[o.outcome.split(":")[0]] ?? 0) + 1;
  const summary = {
    stop: state.stop,
    stop_detail: state.stopDetail,
    error: errorMessage,
    processed: state.outcomes.length,
    counts,
    outcomes: state.outcomes.slice(0, 50),
    credits_used: state.creditsUsed - creditsBefore,
    credits_today: state.creditsUsed,
    credit_budget: DAILY_CREDIT_BUDGET,
  };
  if (runRow?.id) {
    await admin.from("retailer_price_runs").update({ status, finished_at: new Date().toISOString(), summary }).eq("id", runRow.id);
  }
  return { status, ...summary };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Not configured" }, 500);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const secret = req.headers.get("x-cron-secret");
  const ok = secret ? (await admin.rpc("verify_price_sync_secret", { p_secret: secret })).data === true : false;
  if (!ok) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* an empty body is fine; query params are read below */
  }
  const url = new URL(req.url);
  const retailer = String(body.retailer ?? url.searchParams.get("retailer") ?? "");
  const mode = String(body.mode ?? url.searchParams.get("mode") ?? "refresh");
  const limit = Math.min(25, Math.max(1, Number(body.limit ?? url.searchParams.get("limit") ?? 6) || 6));
  const wait = body.wait === true || url.searchParams.get("wait") === "1";
  if (!isRetailerSlug(retailer)) return json({ error: "Unknown retailer" }, 400);
  if (mode !== "refresh" && mode !== "discover") return json({ error: "Unknown mode" }, 400);

  const work = run(admin, retailer, mode, limit).catch((err) => {
    console.error("retailer-price-sync failed", err);
    return { status: "error", error: String(err) };
  });
  if (wait) return json(await work);

  // EdgeRuntime.waitUntil keeps the isolate alive until the run settles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (runtime?.waitUntil) runtime.waitUntil(work);
  return json({ accepted: true, retailer, mode, limit }, 202);
});
