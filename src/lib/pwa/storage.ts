/** Storage reporting and clearing helpers. None of these ever touch auth state (localStorage / Supabase session). */
import { AUDIO_CACHE_NAME, CACHE_PREFIX } from "./constants";

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

export interface StorageEstimateInfo {
  quota: number;
  usage: number;
  available: number;
  /** 0–100 */
  percentUsed: number;
}

export const computeEstimate = (quota: number, usage: number): StorageEstimateInfo => {
  const safeQuota = Math.max(0, quota || 0);
  const safeUsage = Math.max(0, usage || 0);
  const available = Math.max(0, safeQuota - safeUsage);
  return { quota: safeQuota, usage: safeUsage, available, percentUsed: safeQuota > 0 ? Math.min(100, (safeUsage / safeQuota) * 100) : 0 };
};

/** navigator.storage.estimate(), or null where unsupported (older Safari, some webviews). */
export const getStorageEstimate = async (): Promise<StorageEstimateInfo | null> => {
  try {
    if (!navigator.storage?.estimate) return null;
    const { quota, usage } = await navigator.storage.estimate();
    return computeEstimate(quota ?? 0, usage ?? 0);
  } catch {
    return null;
  }
};

/** Asks the browser not to evict our data under storage pressure (best effort; iOS ignores it). */
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export interface CachedContentStats {
  entries: number;
  bytes: number;
}

/** Entry count + (best-effort) byte size of everything SkinLabs cached EXCEPT podcast downloads. */
export const getCachedContentStats = async (): Promise<CachedContentStats> => {
  if (typeof caches === "undefined") return { entries: 0, bytes: 0 };
  let entries = 0;
  let bytes = 0;
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith(CACHE_PREFIX) || name === AUDIO_CACHE_NAME) continue;
      const cache = await caches.open(name);
      const keys = await cache.keys();
      entries += keys.length;
      for (const request of keys) {
        const res = await cache.match(request);
        const length = Number(res?.headers.get("content-length"));
        if (Number.isFinite(length) && length > 0) bytes += length;
        else if (res) bytes += (await res.clone().blob()).size;
      }
    }
  } catch {
    /* partial numbers are fine */
  }
  return { entries, bytes };
};

/** Deletes cached pages/images/assets/public data. Podcast downloads and all auth/local state are untouched. */
export const clearCachedContent = async (): Promise<number> => {
  if (typeof caches === "undefined") return 0;
  let removed = 0;
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith(CACHE_PREFIX) || name === AUDIO_CACHE_NAME) continue;
      if (await caches.delete(name)) removed++;
    }
  } catch {
    /* ignore */
  }
  return removed;
};
