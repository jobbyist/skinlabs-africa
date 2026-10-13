/**
 * review-image-sync — real product images for every published review (static, AI-generated, Sponsored/OpenHaus).
 *
 * For each review: take the product pages we already know (the price listings: the brand's own site first, then the retailers),
 * or find them with Parallel Search (default) / Nimble Search (fallback) on the brand site + the six retailers. Each page's HTML is
 * read (brand sites by a plain polite request, retailers through Nimble Extract because several sit behind bot challenges, which we
 * never bypass) and its own product image is taken from og:image / twitter:image / JSON-LD / image_src. Candidates are validated
 * (image content-type, not tiny) and saved as `pending`; NOTHING replaces a review's cover until a person approves it in
 * Admin > Data Quality (admin_decide_review_images). No model chooses or looks at an image.
 *
 * Schedule: pg_cron (migration 20261008220100) calls this only when a review is due. New generated reviews are picked up
 * automatically (review_price_targets trigger), so the generation pipeline needs no call into this function.
 * Auth: x-cron-secret (Vault review_price_sync_cron_secret, verified in the DB), the service-role bearer, or an admin JWT.
 * Secrets: PARALLEL_API_KEY (default search), NIMBLE_API_KEY (fallback search + retailer page reads).
 * POST body: { limit?: 1-10 (default 3), review_id?: string, wait?: boolean }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildSearchQueries,
  canonicalReviewListingUrl,
  extractProductImages,
  imageResponseOk,
  rankProductPages,
  REVIEW_RETAILERS,
  type PriceSearchResult,
  type ProductPage,
} from "../_shared/pricing/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PARALLEL_KEY = (Deno.env.get("PARALLEL_API_KEY") ?? "").trim();
const NIMBLE_KEY = (Deno.env.get("NIMBLE_API_KEY") ?? "").trim();
const RUN_TIME_BUDGET_MS = 110_000;
const DOMAINS = REVIEW_RETAILERS.map((r) => r.domain);
const UA = "SkinLabsImageBot/1.0 (+https://skinlabs.co.za)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

class ProviderUnavailable extends Error {
  constructor(public provider: string, public detail: string) {
    super(`${provider}: ${detail}`);
  }
}

interface Target {
  review_id: string;
  product_name: string;
  brand: string;
  size_ml: number | null;
  brand_domains: string[] | null;
  listing_urls: string[] | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- discovery (only for reviews with no known product page) --------------------------------------

async function searchParallel(t: Target, brandDomains: string[]): Promise<PriceSearchResult[]> {
  if (!PARALLEL_KEY) throw new ProviderUnavailable("parallel_search", "no PARALLEL_API_KEY");
  const target = { brand: t.brand, name: t.product_name };
  const res = await fetch("https://api.parallel.ai/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": PARALLEL_KEY },
    body: JSON.stringify({
      objective: `Find the product page of "${t.brand} ${t.product_name}" on the brand's own website and on Takealot, Dis-Chem, Clicks, Dermastore, SkinMiles and Faithful to Nature. Prefer individual product pages over category pages.`,
      search_queries: [...buildSearchQueries(target), ...brandDomains.map((d) => `${t.brand} ${t.product_name} ${d}`)],
      advanced_settings: { source_policy: { include_domains: [...DOMAINS, ...brandDomains] }, excerpt_settings: { max_chars_per_result: 300 }, max_results: 20 },
    }),
  });
  if ([401, 402, 403, 429].includes(res.status) || res.status >= 500) throw new ProviderUnavailable("parallel_search", `HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Parallel HTTP ${res.status}`);
  const body = (await res.json()) as { results?: { url: string; title?: string | null; excerpts?: string[] }[] };
  return (body.results ?? []).map((r) => ({ url: r.url, title: r.title, text: (r.excerpts ?? []).join("\n") }));
}

async function searchNimble(t: Target, brandDomains: string[]): Promise<PriceSearchResult[]> {
  if (!NIMBLE_KEY) throw new ProviderUnavailable("nimble", "no NIMBLE_API_KEY");
  const one = async (domain: string, attempt = 0): Promise<PriceSearchResult[]> => {
    const res = await fetch("https://sdk.nimbleway.com/v2/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${NIMBLE_KEY}` },
      body: JSON.stringify({ query: `${t.brand} ${t.product_name}`, include_domains: [domain], max_results: 4, search_depth: "lite" }),
    });
    if ([401, 402, 403].includes(res.status)) throw new ProviderUnavailable("nimble", `HTTP ${res.status}`);
    if (res.status === 429) {
      if (attempt === 0) {
        await sleep(2500);
        return one(domain, 1);
      }
      throw new ProviderUnavailable("nimble", "HTTP 429");
    }
    if (res.status >= 500) {
      if (attempt === 0) return one(domain, 1);
      return [];
    }
    if (!res.ok) return [];
    const body = (await res.json()) as { results?: { url: string; title?: string | null; description?: string | null }[] };
    return (body.results ?? []).map((r) => ({ url: r.url, title: r.title, text: r.description ?? "" }));
  };
  const all = [...DOMAINS, ...brandDomains];
  const out: PriceSearchResult[] = [];
  for (let i = 0; i < all.length; i += 3) {
    const settled = await Promise.allSettled(all.slice(i, i + 3).map((d) => one(d)));
    for (const s of settled) {
      if (s.status === "fulfilled") out.push(...s.value);
      else if (s.reason instanceof ProviderUnavailable) throw s.reason;
    }
  }
  return out;
}

// ---- page + image reading -------------------------------------------------------------------------

async function plainFetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null; // a 403/503 challenge is a failure, never something to work around
    return (await res.text()).slice(0, 600_000);
  } catch {
    return null;
  }
}

async function nimbleFetchHtml(url: string): Promise<string | null> {
  if (!NIMBLE_KEY) return null;
  try {
    const res = await fetch("https://sdk.nimbleway.com/v2/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${NIMBLE_KEY}` },
      body: JSON.stringify({ url, render: false }),
      signal: AbortSignal.timeout(40_000),
    });
    if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429) throw new ProviderUnavailable("nimble", `HTTP ${res.status}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { html?: string; content?: string }; html?: string; content?: string };
    const html = body.data?.html ?? body.html ?? body.data?.content ?? body.content ?? null;
    return typeof html === "string" ? html.slice(0, 600_000) : null;
  } catch (e) {
    if (e instanceof ProviderUnavailable) throw e;
    return null;
  }
}

async function validImage(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(8_000) });
    if (head.status === 405 || head.status === 403 || head.status === 501) return true; // can't tell: a person looks at it anyway
    if (!head.ok) return false;
    const len = head.headers.get("content-length");
    return imageResponseOk(head.headers.get("content-type"), len ? Number(len) : null);
  } catch {
    return false;
  }
}

interface CandidateOut {
  image_url: string;
  alt: string | null;
  source_page_url: string;
  source_kind: "brand" | "retailer";
  source_label: string;
  via: string;
  match_confidence: number | null;
}

const labelFor = (retailer: string, brand: string) => (retailer === "brand-direct" ? `${brand} website` : (REVIEW_RETAILERS.find((r) => r.slug === retailer)?.name ?? retailer));

async function imagesFromPage(page: { url: string; retailer: string; confidence: number | null }, brand: string): Promise<{ out: CandidateOut[]; diag: string }> {
  // Brand shops answer plain requests; the retailers (Cloudflare etc.) are read through Nimble. Either may fall back to the other.
  const order = page.retailer === "brand-direct" ? [plainFetchHtml, nimbleFetchHtml] : [nimbleFetchHtml, plainFetchHtml];
  let images: ReturnType<typeof extractProductImages> = [];
  const notes: string[] = [];
  for (const read of order) {
    const html = await read(page.url);
    notes.push(`${read === plainFetchHtml ? "plain" : "nimble"}:${html ? html.length : "none"}`);
    if (!html) continue;
    images = extractProductImages(html, page.url);
    if (images.length > 0) break;
  }
  const out: CandidateOut[] = [];
  let rejected = 0;
  for (const img of images.slice(0, 2)) {
    if (!(await validImage(img.url))) {
      rejected++;
      continue;
    }
    out.push({
      image_url: img.url,
      alt: img.alt,
      source_page_url: page.url,
      source_kind: page.retailer === "brand-direct" ? "brand" : "retailer",
      source_label: labelFor(page.retailer, brand),
      via: img.via,
      match_confidence: page.confidence,
    });
  }
  return { out, diag: `${page.retailer} ${page.url.slice(0, 70)} [${notes.join(" ")}] imgs=${images.length} rejected=${rejected} kept=${out.length}` };
}

// ---- run ------------------------------------------------------------------------------------------

async function authorised(req: Request, admin: Admin): Promise<boolean> {
  const secret = req.headers.get("x-cron-secret");
  if (secret) {
    const { data } = await admin.rpc("verify_review_price_secret", { p_secret: secret });
    if (data === true) return true;
  }
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!bearer) return false;
  if (SERVICE_KEY && bearer === SERVICE_KEY) return true;
  const { data: u } = await admin.auth.getUser(bearer);
  if (!u?.user?.id) return false;
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return isAdmin === true;
}

async function runBatch(admin: Admin, runId: string, limit: number, reviewId: string | null) {
  const started = Date.now();
  const summary = { targets: 0, checked: 0, with_images: 0, candidates_saved: 0, no_page: 0, deferred: 0, errors: [] as string[], stop: null as string | null, diag: [] as string[] };
  const down = new Set<string>();
  const { data: batch, error } = await admin.rpc("get_review_image_targets", { p_limit: limit, p_review_id: reviewId });
  if (error) summary.stop = `batch: ${error.message}`;
  const targets = (batch ?? []) as Target[];
  summary.targets = targets.length;

  for (const t of targets) {
    if (Date.now() - started > RUN_TIME_BUDGET_MS) {
      summary.stop = "time";
      break;
    }
    try {
      const brandDomains = t.brand_domains ?? [];
      const pages: { url: string; retailer: string; confidence: number | null }[] = [];
      for (const u of t.listing_urls ?? []) {
        const c = canonicalReviewListingUrl(u, brandDomains);
        if (c && !pages.some((p) => p.url === c.url)) pages.push({ url: c.url, retailer: c.retailer, confidence: 0.9 });
      }
      let tool: "parallel_search" | "nimble" = down.has("parallel_search") ? "nimble" : "parallel_search";
      // Known pages first; search only when we have fewer than two (or no brand page and the brand has a shop).
      if (pages.length < 2 || (brandDomains.length > 0 && !pages.some((p) => p.retailer === "brand-direct"))) {
        let results: PriceSearchResult[] = [];
        try {
          if (tool === "parallel_search") results = await searchParallel(t, brandDomains);
          else results = await searchNimble(t, brandDomains);
        } catch (e) {
          if (!(e instanceof ProviderUnavailable)) throw e;
          down.add(e.provider);
          if (e.provider === "parallel_search" && !down.has("nimble")) {
            tool = "nimble";
            results = await searchNimble(t, brandDomains); // may throw ProviderUnavailable -> handled below
          } else throw e;
        }
        const ranked: ProductPage[] = rankProductPages({ brand: t.brand, name: t.product_name, sizeMl: t.size_ml }, results, brandDomains, 3);
        for (const p of ranked) if (!pages.some((x) => x.url === p.url)) pages.push({ url: p.url, retailer: p.retailer, confidence: p.confidence });
      }
      pages.sort((a, b) => Number(b.retailer === "brand-direct") - Number(a.retailer === "brand-direct"));
      const top = pages.slice(0, 3);
      if (top.length === 0) summary.no_page++;

      const perPage = await Promise.all(top.map((p) => imagesFromPage(p, t.brand)));
      const candidates = perPage.flatMap((p) => p.out).slice(0, 4);
      if (summary.diag.length < 12) summary.diag.push(`${t.review_id}: ${perPage.map((p) => p.diag).join(" | ") || "no pages"}`.slice(0, 400));
      const { data: saved, error: saveErr } = await admin.rpc("save_review_image_candidates", { p_review_id: t.review_id, p_tool: tool, p_candidates: candidates });
      if (saveErr) throw new Error(saveErr.message);
      summary.checked++;
      if (candidates.length > 0) summary.with_images++;
      summary.candidates_saved += saved?.inserted ?? 0;
    } catch (e) {
      if (e instanceof ProviderUnavailable) {
        await admin.rpc("defer_review_image_check", { p_review_id: t.review_id, p_hours: 6 });
        summary.deferred++;
        summary.stop = `providers_unavailable: ${e.detail}`;
        break;
      }
      summary.errors.push(`${t.review_id}: ${(e as Error).message}`.slice(0, 200));
      await admin.rpc("defer_review_image_check", { p_review_id: t.review_id, p_hours: 6 });
      summary.deferred++;
    }
  }
  const status = summary.stop?.startsWith("providers_unavailable") ? "blocked" : summary.errors.length > 0 ? "partial" : "ok";
  await admin.from("review_price_runs").update({ finished_at: new Date().toISOString(), status, summary }).eq("id", runId);
  return { status, ...summary };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!(await authorised(req, admin))) return json({ error: "unauthorised" }, 401);
  const body = (await req.json().catch(() => ({}))) as { limit?: number; review_id?: string; wait?: boolean };
  const limit = Math.max(1, Math.min(Number(body.limit ?? 3) || 3, 10));
  const reviewId = typeof body.review_id === "string" && body.review_id.length < 200 ? body.review_id : null;
  if (!PARALLEL_KEY && !NIMBLE_KEY) return json({ status: "blocked_not_configured", detail: "set PARALLEL_API_KEY and/or NIMBLE_API_KEY" }, 503);

  const { data: run, error } = await admin.from("review_price_runs").insert({ source: "image", status: "running" }).select("id").single();
  if (error || !run) return json({ error: "could not start run" }, 500);
  const work = runBatch(admin, run.id, limit, reviewId).catch(async (e) => {
    await admin.from("review_price_runs").update({ finished_at: new Date().toISOString(), status: "error", summary: { error: String(e).slice(0, 300) } }).eq("id", run.id);
  });
  if (body.wait) return json(await work.then(async () => (await admin.from("review_price_runs").select("status, summary").eq("id", run.id).single()).data));
  // @ts-expect-error EdgeRuntime is provided by the Supabase Edge runtime
  EdgeRuntime.waitUntil(work);
  return json({ status: "accepted", run_id: run.id }, 202);
});
