/**
 * Pure decision logic for the service worker (src/sw/sw.ts), kept here so it
 * is unit tested (src/lib/__tests__/pwaServiceWorker.test.ts) and so the
 * privacy rules live in ONE reviewable place.
 *
 * Privacy contract (CLAUDE.md / PWA brief):
 *  - Only same-origin GETs and a short whitelist of PUBLIC, read-only Supabase
 *    tables are ever cached. Auth, RPC, storage, edge-function and /api calls
 *    are never intercepted (`ignore`), so no token, profile, report, payment
 *    or admin response can land in a cache.
 *  - HTML for member-only routes is never stored page-by-page; offline they
 *    fall back to the generic app shell.
 */

export type RouteKind = "ignore" | "audio" | "asset" | "image" | "navigation" | "public-data";

export interface SwRequestInfo {
  url: URL;
  method: string;
  mode: string;
  destination?: string;
  /** The service worker's own origin (self.location.origin). */
  selfOrigin: string;
}

/** Public-read Supabase tables safe to cache (public SELECT policies, same rows for every viewer). */
export const PUBLIC_DATA_TABLES = ["news_articles_public", "ai_generated_product_reviews", "ai_generated_comparisons"] as const;

/** Routes whose HTML is a member/account surface: never cached as their own page. */
export const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/admin",
  "/welcome",
  "/reset-password",
  "/skynn-ai/advanced",
  "/marketplace/saved",
  "/newsletter/confirm",
  "/start",
];

/** Query keys that carry auth/payment/intent state — a URL carrying any of them is never cached. */
const SENSITIVE_QUERY_KEYS = [
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "error",
  "error_description",
  "type",
  "payment",
  "keep",
  "ping",
];

const AUDIO_EXTENSION = /\.(mp3|m4a|aac|ogg|oga|wav)$/i;
const IMAGE_EXTENSION = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;

const startsWithPath = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isPrivatePath = (pathname: string): boolean => PRIVATE_PATH_PREFIXES.some((p) => startsWithPath(pathname, p));

export const hasSensitiveQuery = (url: URL): boolean => {
  let sensitive = false;
  url.searchParams.forEach((_value, key) => {
    if (key.startsWith("pi_") || SENSITIVE_QUERY_KEYS.includes(key)) sensitive = true;
  });
  return sensitive;
};

export const isPublicDataRequest = (url: URL): boolean => {
  if (!url.hostname.endsWith(".supabase.co")) return false;
  if (!url.pathname.startsWith("/rest/v1/")) return false;
  const table = url.pathname.slice("/rest/v1/".length).split("/")[0];
  return (PUBLIC_DATA_TABLES as readonly string[]).includes(table);
};

export const classifyRequest = (info: SwRequestInfo): RouteKind => {
  const { url, method, mode } = info;
  if (method !== "GET") return "ignore";
  if (url.protocol !== "https:" && url.protocol !== "http:") return "ignore";

  if (url.origin !== info.selfOrigin) return isPublicDataRequest(url) ? "public-data" : "ignore";

  // Reachability probes (src/lib/pwa/network.ts) must always hit the real network.
  if (url.searchParams.has("ping")) return "ignore";

  const { pathname } = url;
  if (startsWithPath(pathname, "/api") || pathname === "/__server" || pathname === "/sw.js") return "ignore";
  if (AUDIO_EXTENSION.test(pathname)) return "audio";
  if (pathname.startsWith("/assets/")) return "asset";
  if (mode === "navigate") return "navigation";
  if (IMAGE_EXTENSION.test(pathname) || info.destination === "image") return "image";
  return "ignore";
};

/** Cache key for an HTML page: origin + pathname only (utm/tracking params never fragment the cache). */
export const pageCacheKey = (url: URL): string => `${url.origin}${url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname}`;

/** May this navigation's HTML response be stored as its own cached page? */
export const shouldCachePage = (url: URL, response: { ok: boolean; status: number; headers: { get(name: string): string | null } }): boolean => {
  if (!response.ok || response.status !== 200) return false;
  if (isPrivatePath(url.pathname) || hasSensitiveQuery(url)) return false;
  const type = response.headers.get("content-type") ?? "";
  if (!/text\/html/i.test(type)) return false;
  if (/no-store|private/i.test(response.headers.get("cache-control") ?? "")) return false;
  return true;
};

/** Hashed build assets referenced by an HTML document (precached with the shell). */
export const extractAssetUrls = (html: string): string[] => {
  const found = new Set<string>();
  const pattern = /(?:src|href)=["'](\/assets\/[^"'?#]+\.(?:js|css|woff2?|png|jpe?g|webp|svg))(?:[?#][^"']*)?["']/gi;
  for (const match of html.matchAll(pattern)) found.add(match[1]);
  return [...found];
};

// --- Range requests (audio) --------------------------------------------------

export interface ByteRange {
  start: number;
  /** Inclusive. */
  end: number;
}

/**
 * Parses a single `Range: bytes=…` header against a resource of `size` bytes.
 * Returns null when the header is absent/unsupported (serve the whole file) and
 * "unsatisfiable" for a range entirely outside the file (416).
 */
export const parseByteRange = (header: string | null, size: number): ByteRange | null | "unsatisfiable" => {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null; // multi-range or malformed: fall back to the full body
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;
  let start: number;
  let end: number;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (suffix === 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
};

/** Builds the 206/416/200 response for an audio element reading from the download cache. */
export const buildAudioResponse = async (cached: Response, rangeHeader: string | null): Promise<Response> => {
  const buffer = await cached.clone().arrayBuffer();
  const size = buffer.byteLength;
  const type = cached.headers.get("content-type") || "audio/mpeg";
  const range = parseByteRange(rangeHeader, size);
  if (range === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  if (!range) {
    return new Response(buffer, {
      status: 200,
      headers: { "Content-Type": type, "Content-Length": String(size), "Accept-Ranges": "bytes" },
    });
  }
  const slice = buffer.slice(range.start, range.end + 1);
  return new Response(slice, {
    status: 206,
    headers: {
      "Content-Type": type,
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
};

/** Which cache names this worker owns and keeps (everything else with our prefix, or legacy workbox, is deleted). */
export const cachesToDelete = (existing: string[], keep: string[], prefix: string, audioCache: string): string[] =>
  existing.filter((name) => {
    if (keep.includes(name) || name === audioCache) return false;
    return name.startsWith(prefix) || name.startsWith("workbox-") || name.startsWith("sw-precache");
  });

/** Is a cached public-data response still fresh enough to serve offline? */
export const isFreshEnough = (dateHeader: string | null, maxAgeMs: number, now: number = Date.now()): boolean => {
  if (!dateHeader) return true; // unknown age: better than nothing offline
  const t = Date.parse(dateHeader);
  if (!Number.isFinite(t)) return true;
  return now - t <= maxAgeMs;
};
