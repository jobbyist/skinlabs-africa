/**
 * Offline podcast downloads.
 *
 *   audio bytes  → Cache Storage, cache `skinlabs-podcast-audio`, keyed by the episode's audio path
 *                  (e.g. /ep1skinlabs.mp3). Never put in localStorage/IndexedDB. The service worker
 *                  serves these (with Range support) whenever the audio element requests that path.
 *   metadata     → IndexedDB `downloads` store: status, sizes, timestamps — separate from the audio.
 *
 * Downloads stream with progress, can be paused (resumed with a Range request), cancelled, retried and
 * removed. If the browser has no Cache Storage/IndexedDB the feature reports itself unsupported and the
 * player simply streams as before. The service worker is not required to *play* a download: when it isn't
 * controlling the page, the player falls back to a blob: URL built from the cached bytes
 * (getDownloadedObjectUrl()).
 */
import { AUDIO_CACHE_NAME } from "./constants";
import { idbDelete, idbGetAll, idbPut } from "./idb";
import { getStorageEstimate, requestPersistentStorage } from "./storage";
import { isNetworkError, reportNetworkFailure } from "./network";
import { trackPwaEvent } from "./analytics";

export type DownloadStatus = "downloading" | "paused" | "downloaded" | "failed";
export type DownloadFailure = "quota" | "network" | "interrupted" | "unknown";

export interface DownloadRecord {
  slug: string;
  title: string;
  /** Path used as the cache key and fetched from, e.g. "/ep1skinlabs.mp3". */
  audioPath: string;
  image: string;
  status: DownloadStatus;
  bytesReceived: number;
  totalBytes: number;
  downloadedAt?: number;
  failure?: DownloadFailure;
}

export interface DownloadableEpisode {
  slug: string;
  title: string;
  audioFile: string;
  image: string;
}

interface ActiveDownload {
  controller: AbortController;
  chunks: Uint8Array[];
  received: number;
  total: number;
  contentType: string;
  pausing: boolean;
}

let records = new Map<string, DownloadRecord>();
let snapshotCache: DownloadRecord[] = [];
let loaded: Promise<void> | null = null;
const active = new Map<string, ActiveDownload>();
const listeners = new Set<() => void>();

const publish = () => {
  snapshotCache = [...records.values()].sort((a, b) => (b.downloadedAt ?? 0) - (a.downloadedAt ?? 0));
  listeners.forEach((l) => l());
};

export const subscribeDownloads = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getDownloadsSnapshot = (): DownloadRecord[] => snapshotCache;
export const getServerDownloadsSnapshot = (): DownloadRecord[] => [];

export const isOfflineDownloadSupported = (): boolean =>
  typeof window !== "undefined" && "caches" in window && "indexedDB" in window && typeof fetch === "function";

const persist = (record: DownloadRecord) => idbPut("downloads", record);

/** Loads persisted metadata once. Anything that was mid-download when the page closed is marked interrupted (retryable). */
export const loadDownloads = (): Promise<void> => {
  if (loaded) return loaded;
  loaded = (async () => {
    if (!isOfflineDownloadSupported()) return;
    const stored = await idbGetAll<DownloadRecord>("downloads");
    const cache = await caches.open(AUDIO_CACHE_NAME);
    for (const rec of stored) {
      if (rec.status === "downloaded") {
        // Metadata without bytes (cleared by the browser/another tab) must not claim "available offline".
        if (!(await cache.match(rec.audioPath))) {
          await idbDelete("downloads", rec.slug);
          continue;
        }
      } else if (!active.has(rec.slug)) {
        rec.status = "failed";
        rec.failure = "interrupted";
        await persist(rec);
      }
      records.set(rec.slug, rec);
    }
    publish();
  })().catch(() => undefined);
  return loaded;
};

export const getDownload = (slug: string): DownloadRecord | undefined => records.get(slug);
export const isDownloaded = (slug: string): boolean => records.get(slug)?.status === "downloaded";

const mimeFor = (path: string, header: string | null): string => {
  if (header && /^audio\//i.test(header)) return header;
  return /\.m4a$/i.test(path) ? "audio/mp4" : "audio/mpeg";
};

const update = (slug: string, patch: Partial<DownloadRecord>, save = false) => {
  const current = records.get(slug);
  if (!current) return;
  const next = { ...current, ...patch };
  records.set(slug, next);
  if (save) void persist(next);
  publish();
};

const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22 || error.name === "NS_ERROR_DOM_QUOTA_REACHED");

const fail = (slug: string, failure: DownloadFailure) => {
  active.delete(slug);
  update(slug, { status: "failed", failure }, true);
};

const run = async (slug: string, resume: boolean) => {
  const rec = records.get(slug);
  if (!rec) return;
  const state: ActiveDownload = resume && active.get(slug) ? (active.get(slug) as ActiveDownload) : { controller: new AbortController(), chunks: [], received: 0, total: 0, contentType: "", pausing: false };
  state.controller = new AbortController();
  state.pausing = false;
  active.set(slug, state);
  update(slug, { status: "downloading", failure: undefined });

  try {
    const headers: HeadersInit = state.received > 0 ? { Range: `bytes=${state.received}-` } : {};
    const res = await fetch(rec.audioPath, { signal: state.controller.signal, headers });
    if (!(res.ok || res.status === 206)) throw new Error(`HTTP ${res.status}`);
    if (state.received > 0 && res.status !== 206) {
      // The server ignored the Range header: start over rather than corrupt the file.
      state.chunks = [];
      state.received = 0;
    }
    state.contentType = mimeFor(rec.audioPath, res.headers.get("content-type"));
    const length = Number(res.headers.get("content-length")) || 0;
    state.total = state.received + length || state.total;

    if (state.total > 0) {
      const estimate = await getStorageEstimate();
      if (estimate && estimate.available > 0 && estimate.available < (state.total - state.received) * 1.1) {
        state.controller.abort();
        return fail(slug, "quota");
      }
    }
    update(slug, { totalBytes: state.total });

    const reader = res.body?.getReader();
    if (!reader) {
      // No streaming support: take the whole body at once (no progress, still works).
      const buffer = new Uint8Array(await res.arrayBuffer());
      state.chunks.push(buffer);
      state.received += buffer.byteLength;
    } else {
      let lastPublish = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        state.chunks.push(value);
        state.received += value.byteLength;
        const now = performance.now();
        if (now - lastPublish > 150) {
          lastPublish = now;
          update(slug, { bytesReceived: state.received, totalBytes: state.total || state.received });
        }
      }
    }

    const blob = new Blob(state.chunks as BlobPart[], { type: state.contentType });
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.put(
      rec.audioPath,
      new Response(blob, { status: 200, headers: { "Content-Type": state.contentType, "Content-Length": String(blob.size) } }),
    );
    active.delete(slug);
    update(slug, { status: "downloaded", bytesReceived: blob.size, totalBytes: blob.size, downloadedAt: Date.now(), failure: undefined }, true);
    trackPwaEvent("podcast_download_completed", { episode: slug, size_mb: Math.round(blob.size / 1_048_576) });
    void requestPersistentStorage();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (state.pausing) {
        update(slug, { status: "paused", bytesReceived: state.received }, false);
      }
      return; // cancel() already removed the record
    }
    if (isQuotaError(error)) return fail(slug, "quota");
    if (isNetworkError(error)) {
      reportNetworkFailure(error);
      return fail(slug, "network");
    }
    console.warn("[pwa] podcast download failed:", error);
    fail(slug, "unknown");
  }
};

/** Starts (or restarts after a failure) a download. */
export const startDownload = async (episode: DownloadableEpisode): Promise<boolean> => {
  if (!isOfflineDownloadSupported()) return false;
  await loadDownloads();
  const existing = records.get(episode.slug);
  if (existing && (existing.status === "downloading" || existing.status === "downloaded")) return true;
  active.delete(episode.slug); // a retry always starts clean
  records.set(episode.slug, {
    slug: episode.slug,
    title: episode.title,
    audioPath: episode.audioFile,
    image: episode.image,
    status: "downloading",
    bytesReceived: 0,
    totalBytes: 0,
  });
  publish();
  trackPwaEvent("podcast_download_started", { episode: episode.slug });
  void run(episode.slug, false);
  return true;
};

export const pauseDownload = (slug: string) => {
  const state = active.get(slug);
  if (!state || records.get(slug)?.status !== "downloading") return;
  state.pausing = true;
  state.controller.abort();
};

export const resumeDownload = (slug: string) => {
  if (records.get(slug)?.status !== "paused" || !active.has(slug)) return;
  void run(slug, true);
};

/** Aborts an in-flight download and forgets it. */
export const cancelDownload = async (slug: string) => {
  const state = active.get(slug);
  if (state) {
    state.pausing = false;
    state.controller.abort();
    active.delete(slug);
  }
  records.delete(slug);
  await idbDelete("downloads", slug);
  publish();
};

/** Removes a finished download: its audio bytes and its metadata. */
export const removeDownload = async (slug: string) => {
  const rec = records.get(slug);
  if (isActive(slug)) await cancelDownload(slug);
  if (rec) {
    try {
      await (await caches.open(AUDIO_CACHE_NAME)).delete(rec.audioPath);
    } catch {
      /* already gone */
    }
  }
  records.delete(slug);
  await idbDelete("downloads", slug);
  publish();
  if (rec?.status === "downloaded") trackPwaEvent("podcast_download_removed", { episode: slug });
};

const isActive = (slug: string) => active.has(slug);

export const removeAllDownloads = async () => {
  await Promise.all([...records.keys()].map((slug) => removeDownload(slug)));
  try {
    await caches.delete(AUDIO_CACHE_NAME);
  } catch {
    /* ignore */
  }
};

export const getDownloadedBytes = (): { episodes: number; bytes: number } => {
  const done = [...records.values()].filter((r) => r.status === "downloaded");
  return { episodes: done.length, bytes: done.reduce((sum, r) => sum + r.totalBytes, 0) };
};

/**
 * A blob: URL for a downloaded episode, for when the service worker isn't controlling the page.
 * The caller owns it and must URL.revokeObjectURL() it.
 */
export const getDownloadedObjectUrl = async (slug: string): Promise<string | null> => {
  const rec = records.get(slug);
  if (!rec || rec.status !== "downloaded") return null;
  try {
    const res = await (await caches.open(AUDIO_CACHE_NAME)).match(rec.audioPath);
    if (!res) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
};

/** Test hook: reset all in-memory state. */
export const __resetPodcastCacheForTests = () => {
  records = new Map();
  active.clear();
  snapshotCache = [];
  loaded = null;
};
