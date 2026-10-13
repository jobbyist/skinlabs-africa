import { MEDIA_MAX_BYTES } from "./image";

/**
 * GIF search for the composer (Tenor's API is closed to new integrations). Searches go through our own proxy, `api/giphy.ts`:
 * the key stays on the server and GIPHY's 100-calls-per-hour beta limit is shared and enforced there (see that file). If the proxy
 * says GIF search isn't set up, the picker is not offered and the composer keeps its "upload a GIF" button, so nothing looks
 * available that isn't.
 *
 * Privacy: searching sends the typed words to our server and on to GIPHY (not the member's IP or account), so nothing is requested until the member opens the
 * picker. A chosen GIF is downloaded and then goes through the SAME upload pipeline as any picture (our own storage bucket,
 * size limits, quota), so readers never load anything from GIPHY and the post does not depend on it staying online.
 */


export const GIF_CATEGORIES: { label: string; query: string }[] = [
  { label: "Glow", query: "glowing skin" },
  { label: "Shock", query: "shocked" },
  { label: "Sunscreen", query: "sunscreen" },
  { label: "Routine", query: "skincare routine" },
  { label: "Hydrated", query: "hydrated skin" },
  { label: "Yes!", query: "yes" },
  { label: "Oops", query: "oops" },
];

export interface GifResult {
  id: string;
  title: string;
  /** Small animated preview for the grid. */
  previewUrl: string;
  /** The file that gets attached (kept under the upload limit). */
  fileUrl: string;
  width: number;
  height: number;
}

const HOST = /^(?:media\d*|i)\.giphy\.com$/;
/** Only GIPHY's own media hosts over https are ever fetched. */
export const isGiphyMediaUrl = (raw: unknown): raw is string => {
  if (typeof raw !== "string") return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && HOST.test(url.hostname);
  } catch {
    return false;
  }
};

interface Rendition {
  url?: unknown;
  width?: unknown;
  height?: unknown;
  size?: unknown;
}

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};

/** Picks the first rendition that is small enough to upload, from richest to leanest. */
const pickFile = (images: Record<string, Rendition | undefined>): Rendition | null => {
  for (const key of ["downsized", "fixed_height", "fixed_width", "fixed_height_small", "fixed_width_small"]) {
    const r = images[key];
    if (r && isGiphyMediaUrl(r.url) && (num(r.size) === 0 || num(r.size) <= MEDIA_MAX_BYTES)) return r;
  }
  return null;
};

/** Defensive parse: anything that doesn't look right is dropped rather than rendered. */
export const parseGifResults = (json: unknown): { results: GifResult[]; total: number } => {
  const root = json as { data?: unknown; pagination?: { total_count?: unknown } } | null;
  const rows = Array.isArray(root?.data) ? (root!.data as unknown[]) : [];
  const results: GifResult[] = [];
  for (const row of rows) {
    const g = row as { id?: unknown; title?: unknown; images?: Record<string, Rendition | undefined> } | null;
    if (!g || typeof g.id !== "string" || !g.images) continue;
    const preview = g.images.fixed_width_small ?? g.images.fixed_width;
    const file = pickFile(g.images);
    if (!preview || !isGiphyMediaUrl(preview.url) || !file) continue;
    results.push({
      id: g.id,
      title: typeof g.title === "string" && g.title.trim() ? g.title.trim().slice(0, 120) : "GIF",
      previewUrl: preview.url as string,
      fileUrl: file.url as string,
      width: num(preview.width) || 200,
      height: num(preview.height) || 200,
    });
  }
  return { results, total: num(root?.pagination?.total_count) };
};

export class GifError extends Error {
  /** Seconds until a rate-limited search may be retried. */
  retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.retryAfter = retryAfter;
  }
}

const ENDPOINT = "/api/giphy";
/** Repeat searches in this tab (a chip toggled back and forth) are answered here and never leave the browser. */
const memo = new Map<string, { at: number; value: { results: GifResult[]; total: number } }>();
const MEMO_MS = 10 * 60_000;

/** Whether the proxy has a GIPHY key. Never throws: any failure means "not available". */
export const fetchGifSearchEnabled = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${ENDPOINT}?action=status`);
    if (!res.ok) return false;
    return ((await res.json()) as { enabled?: unknown }).enabled === true;
  } catch {
    return false;
  }
};

export const rateLimitMessage = (seconds: number | undefined, reason?: string): string => {
  const minutes = Math.max(1, Math.ceil((seconds ?? 600) / 60));
  return reason === "user"
    ? `You've searched a lot of GIFs this hour. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or upload your own.`
    : `GIF search is busy right now. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or upload your own.`;
};

export const searchGifs = async (query: string, offset: number, signal?: AbortSignal): Promise<{ results: GifResult[]; total: number }> => {
  const q = query.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 50);
  const key = `${q}|${offset}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.value;

  const { supabase } = await import("@/integrations/supabase/client");
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new GifError("Sign in to search GIFs.");
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?${new URLSearchParams({ q, offset: String(offset) })}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new GifError("Couldn't reach the GIF library. Check your connection.");
  }
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number; reason?: string };
    const retry = body.retry_after ?? (Number(res.headers.get("Retry-After")) || undefined);
    throw new GifError(rateLimitMessage(retry, body.reason), retry);
  }
  if (!res.ok) throw new GifError("GIF search isn't available right now.");
  const body = (await res.json()) as { data?: unknown };
  const value = parseGifResults(body.data);
  memo.set(key, { at: Date.now(), value });
  return value;
};

export const fetchGifFile = async (gif: GifResult, signal?: AbortSignal): Promise<File> => {
  if (!isGiphyMediaUrl(gif.fileUrl)) throw new GifError("That GIF couldn't be added.");
  let res: Response;
  try {
    res = await fetch(gif.fileUrl, { signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new GifError("Couldn't download that GIF. Try another one.");
  }
  if (!res.ok) throw new GifError("Couldn't download that GIF. Try another one.");
  const blob = await res.blob();
  if (blob.size > MEDIA_MAX_BYTES) throw new GifError("That GIF is too large to attach. Try another one.");
  return new File([blob], `giphy-${gif.id}.gif`, { type: "image/gif" });
};
