import { MEDIA_MAX_BYTES } from "./image";

/**
 * GIF search for the composer, straight from the browser to GIPHY (Tenor's API is closed to new integrations).
 * Needs `VITE_GIPHY_API_KEY`; GIPHY keys are public by design (they identify the app, they are not secrets). Without one,
 * the picker is not offered and the composer keeps its "upload a GIF" button, so nothing looks available that isn't.
 *
 * Privacy: searching sends the typed words and the visitor's IP to GIPHY, so nothing is requested until the member opens the
 * picker. A chosen GIF is downloaded and then goes through the SAME upload pipeline as any picture (our own storage bucket,
 * size limits, quota), so readers never load anything from GIPHY and the post does not depend on it staying online.
 */

const API = "https://api.giphy.com/v1/gifs";
const PAGE = 24;

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

export const giphyConfigured = (): boolean => Boolean(import.meta.env.VITE_GIPHY_API_KEY);

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

export class GifError extends Error {}

const call = async (path: string, params: Record<string, string>, signal?: AbortSignal) => {
  const key = import.meta.env.VITE_GIPHY_API_KEY as string | undefined;
  if (!key) throw new GifError("GIF search isn't available right now.");
  const qs = new URLSearchParams({ api_key: key, limit: String(PAGE), rating: "pg", lang: "en", bundle: "messaging_non_clips", ...params });
  let res: Response;
  try {
    res = await fetch(`${API}/${path}?${qs}`, { signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new GifError("Couldn't reach the GIF library. Check your connection.");
  }
  if (res.status === 429) throw new GifError("GIF search is busy. Try again in a minute.");
  if (!res.ok) throw new GifError("GIF search isn't available right now.");
  return parseGifResults(await res.json());
};

export const searchGifs = (query: string, offset: number, signal?: AbortSignal) =>
  query.trim() ? call("search", { q: query.trim().slice(0, 50), offset: String(offset) }, signal) : call("trending", { offset: String(offset) }, signal);

/** Downloads the chosen GIF as a File so it can enter the normal image pipeline. */
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
