/**
 * GIPHY proxy for the Community composer's GIF search.
 *
 * Why a proxy: GIPHY's beta key allows 100 API calls per HOUR for the whole app, so the limit has to be shared by every member and
 * enforced where nobody can bypass it. The browser never talks to GIPHY and never sees the key. Every real GIPHY call first takes a slot from
 * `giphy_take_quota()` (rolling one-hour window in the database: 95 calls across everyone, 20 per member; the 5 spare calls are headroom).
 * Identical searches are answered from `giphy_response_cache` for an hour and cost nothing.
 *
 * GET /api/giphy?action=status            -> { ok, enabled }                          (no GIPHY call, no auth)
 * GET /api/giphy?q=<words>&offset=<n>     -> { ok, cached, data: { data, pagination } } (empty q = trending). Needs a signed-in member.
 *   429 { error: "rate_limited", reason: "global" | "user", retry_after } + Retry-After header when a limit is reached.
 *
 * Env (Vercel): GIPHY_API_KEY, or VITE_GIPHY_API_KEY (the name the key was added under), plus VITE_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY (already used by api/admin-analytics.ts).
 */
import { createClient } from "@supabase/supabase-js";

type VercelReq = { method?: string; headers: Record<string, string | string[] | undefined>; query: Record<string, string | string[] | undefined> };
type VercelRes = { status: (code: number) => VercelRes; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

export const GLOBAL_HOURLY_LIMIT = 95;
export const USER_HOURLY_LIMIT = 20;
export const PAGE_SIZE = 24;
const CACHE_TTL_SECONDS = 3600;
const MAX_OFFSET = 240;
const RENDITIONS = ["fixed_width_small", "fixed_width", "downsized", "fixed_height", "fixed_height_small"] as const;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export interface GifQuery {
  kind: "search" | "trending";
  q: string;
  offset: number;
  cacheKey: string;
}

/** Normalises user input so equivalent searches share one cache entry (and one GIPHY call). Null = invalid. */
export const parseGifQuery = (query: VercelReq["query"]): GifQuery | null => {
  const q = first(query.q).normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 50);
  const rawOffset = first(query.offset);
  const offset = rawOffset === "" ? 0 : Number(rawOffset);
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) return null;
  const kind = q ? "search" : "trending";
  return { kind, q, offset, cacheKey: `${kind}|${q}|${offset}` };
};

/** Keeps only what the composer reads, so cached rows and responses stay small and nothing else from GIPHY is passed on. */
export const trimGiphyPayload = (json: unknown): { data: unknown[]; pagination: { total_count: number } } => {
  const root = json as { data?: unknown; pagination?: { total_count?: unknown } } | null;
  const rows = Array.isArray(root?.data) ? (root!.data as unknown[]) : [];
  const data = rows.flatMap((row) => {
    const g = row as { id?: unknown; title?: unknown; images?: Record<string, unknown> } | null;
    if (!g || typeof g.id !== "string" || !g.images) return [];
    const images: Record<string, unknown> = {};
    for (const key of RENDITIONS) {
      const r = g.images[key] as { url?: unknown; width?: unknown; height?: unknown; size?: unknown } | undefined;
      if (r && typeof r.url === "string") images[key] = { url: r.url, width: r.width, height: r.height, size: r.size };
    }
    return [{ id: g.id, title: typeof g.title === "string" ? g.title.slice(0, 120) : "", images }];
  });
  const total = Number(root?.pagination?.total_count);
  return { data, pagination: { total_count: Number.isFinite(total) ? total : 0 } };
};

const giphyKey = () => process.env.GIPHY_API_KEY || process.env.VITE_GIPHY_API_KEY || "";

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return void res.status(405).json({ ok: false, error: "Method not allowed" });
  const key = giphyKey();

  if (first(req.query.action) === "status") return void res.status(200).json({ ok: true, enabled: Boolean(key) });
  if (!key) return void res.status(503).json({ ok: false, error: "not_configured" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return void res.status(503).json({ ok: false, error: "not_configured" });

  const header = req.headers.authorization;
  const token = (Array.isArray(header) ? header[0] : header)?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return void res.status(401).json({ ok: false, error: "Sign in to search GIFs." });

  const parsed = parseGifQuery(req.query);
  if (!parsed) return void res.status(400).json({ ok: false, error: "Invalid request" });

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) return void res.status(401).json({ ok: false, error: "Sign in to search GIFs." });

  // 1) A cached answer costs nothing against the hourly limit.
  const { data: cached } = await db.rpc("giphy_cache_get", { p_key: parsed.cacheKey, p_ttl_seconds: CACHE_TTL_SECONDS });
  if (cached) return void res.status(200).json({ ok: true, cached: true, data: cached });

  // 2) A real call: take a slot first. Failing to count must fail closed, never let calls through uncounted.
  const { data: quota, error: quotaError } = await db.rpc("giphy_take_quota", {
    p_user: userData.user.id,
    p_global_limit: GLOBAL_HOURLY_LIMIT,
    p_user_limit: USER_HOURLY_LIMIT,
  });
  if (quotaError || !quota) return void res.status(503).json({ ok: false, error: "unavailable" });
  const slot = quota as { ok: boolean; reason?: string; retry_after?: number };
  if (!slot.ok) {
    const retryAfter = Math.max(1, Math.min(3600, Math.round(slot.retry_after ?? 600)));
    res.setHeader("Retry-After", String(retryAfter));
    return void res.status(429).json({ ok: false, error: "rate_limited", reason: slot.reason ?? "global", retry_after: retryAfter });
  }

  const params = new URLSearchParams({ api_key: key, limit: String(PAGE_SIZE), offset: String(parsed.offset), rating: "pg", lang: "en", bundle: "messaging_non_clips" });
  if (parsed.kind === "search") params.set("q", parsed.q);
  let upstream: Response;
  try {
    upstream = await fetch(`https://api.giphy.com/v1/gifs/${parsed.kind}?${params}`, { signal: AbortSignal.timeout(8000) });
  } catch {
    return void res.status(502).json({ ok: false, error: "upstream_unreachable" });
  }
  if (upstream.status === 429) {
    res.setHeader("Retry-After", "900");
    return void res.status(429).json({ ok: false, error: "rate_limited", reason: "global", retry_after: 900 });
  }
  if (!upstream.ok) return void res.status(502).json({ ok: false, error: "upstream_error" });

  const payload = trimGiphyPayload(await upstream.json());
  await db.rpc("giphy_cache_put", { p_key: parsed.cacheKey, p_payload: payload });
  return void res.status(200).json({ ok: true, cached: false, data: payload, remaining: (slot as { remaining?: number }).remaining });
}
