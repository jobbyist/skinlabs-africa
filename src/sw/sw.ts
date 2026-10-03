/// <reference lib="webworker" />
/**
 * SkinLabs® service worker. Built to /sw.js by the `skinlabs-service-worker`
 * plugin in vite.config.ts (separate IIFE bundle — see docs/pwa.md).
 *
 * Deliberately dependency-free (no Workbox): the site already versions every
 * build asset with a content hash and redeploys many times a day, so a
 * hand-written runtime-caching worker is smaller and has no precache manifest
 * to keep in sync. What it caches — and, more importantly, what it refuses to
 * cache — is decided by src/lib/pwa/swCore.ts (unit tested).
 *
 *   /assets/*            cache-first   (content-hashed, immutable)
 *   images               stale-while-revalidate
 *   HTML navigations     network-first, cached copy / app shell / offline.html fallback
 *   public Supabase data network-first, fresh-enough cached copy fallback (whitelisted tables only)
 *   podcast audio        served ONLY from the member's download cache (Range aware)
 *   everything else      untouched (network): auth, RPC, storage, functions, /api, payments, admin
 */
import {
  AUDIO_CACHE_NAME,
  BACKGROUND_SYNC_TAG,
  CACHE_LIMITS,
  CACHE_NAMES,
  CACHE_PREFIX,
  CACHE_VERSION,
  NETWORK_TIMEOUT_MS,
  OFFLINE_FALLBACK_PATH,
  PUBLIC_DATA_MAX_AGE_MS,
  PWA_START_PATH,
  SW_MESSAGES,
} from "../lib/pwa/constants";
import {
  buildAudioResponse,
  cachesToDelete,
  classifyRequest,
  extractAssetUrls,
  isFreshEnough,
  isPrivatePath,
  pageCacheKey,
  shouldCachePage,
} from "../lib/pwa/swCore";
import { notificationFromPush, safeNotificationUrl } from "../lib/pwa/pushPayload";

declare const self: ServiceWorkerGlobalScope;

const SHELL_REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;
const SHELL_STATIC_URLS = [OFFLINE_FALLBACK_PATH, "/manifest.webmanifest", "/pwa-192.png", "/pwa-512.png", "/logosvg.png", "/logosvgwhite.png"];

// --- helpers -----------------------------------------------------------------

const trimCache = async (cacheName: string, limit: number) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - limit;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
};

const putSafely = async (cacheName: string, key: Request | string, response: Response, limit?: number) => {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(key, response);
    if (limit) await trimCache(cacheName, limit);
  } catch {
    // Quota exceeded or an opaque/streaming edge case: caching is best-effort, never fatal.
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

// --- app shell ---------------------------------------------------------------

/**
 * The shell is the SPA document served for /start plus the entry assets it
 * references, kept in their own (untrimmed) cache so lazy-chunk churn can
 * never evict what the app needs to boot offline.
 */
const refreshShell = async () => {
  const shell = await caches.open(CACHE_NAMES.shell);
  const res = await fetch(PWA_START_PATH, { cache: "reload", credentials: "same-origin" });
  if (!res.ok || !/text\/html/i.test(res.headers.get("content-type") ?? "")) return;
  const html = await res.clone().text();
  await shell.put(PWA_START_PATH, res);
  const assets = extractAssetUrls(html);
  await Promise.allSettled(
    assets.map(async (asset) => {
      const assetRes = await fetch(asset, { credentials: "same-origin" });
      if (assetRes.ok) await shell.put(asset, assetRes);
    }),
  );
  // Drop entry assets from previous deploys.
  const wanted = new Set([PWA_START_PATH, ...SHELL_STATIC_URLS, ...assets]);
  for (const req of await shell.keys()) {
    const path = new URL(req.url).pathname;
    if (!wanted.has(path)) await shell.delete(req);
  }
};

const precacheStatics = async () => {
  const shell = await caches.open(CACHE_NAMES.shell);
  await Promise.allSettled(
    SHELL_STATIC_URLS.map(async (path) => {
      const res = await fetch(path, { cache: "reload", credentials: "same-origin" });
      if (res.ok) await shell.put(path, res);
    }),
  );
};

self.addEventListener("install", (event) => {
  // No skipWaiting(): an updated worker waits until the member taps "Update now"
  // (SKIP_WAITING message) so a running session is never swapped mid-flow.
  event.waitUntil(Promise.allSettled([precacheStatics(), refreshShell()]).then(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = Object.values(CACHE_NAMES) as string[];
      const stale = cachesToDelete(await caches.keys(), keep, CACHE_PREFIX, AUDIO_CACHE_NAME);
      await Promise.all(stale.map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

// --- strategies --------------------------------------------------------------

const cacheFirst = async (request: Request, cacheName: string, limit: number): Promise<Response> => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  // The entry bundle also lives in the shell cache.
  const shellHit = await (await caches.open(CACHE_NAMES.shell)).match(request);
  if (shellHit) return shellHit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") void putSafely(cacheName, request, res.clone(), limit);
  return res;
};

const staleWhileRevalidate = async (event: FetchEvent, cacheName: string, limit: number): Promise<Response> => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then((res) => {
      if (res.ok && res.type === "basic") void putSafely(cacheName, event.request, res.clone(), limit);
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return (await refresh) ?? Response.error();
};

const maybeRefreshShell = async (event: FetchEvent) => {
  const shell = await caches.open(CACHE_NAMES.shell);
  const cached = await shell.match(PWA_START_PATH);
  const date = cached?.headers.get("date");
  const age = date ? Date.now() - Date.parse(date) : Infinity;
  if (age > SHELL_REFRESH_AFTER_MS) event.waitUntil(refreshShell().catch(() => undefined));
};

const offlineFallback = async (): Promise<Response> => {
  const shell = await caches.open(CACHE_NAMES.shell);
  return (await shell.match(PWA_START_PATH)) ?? (await shell.match(OFFLINE_FALLBACK_PATH)) ?? Response.error();
};

const handleNavigation = async (event: FetchEvent): Promise<Response> => {
  const url = new URL(event.request.url);
  const key = pageCacheKey(url);
  const pages = await caches.open(CACHE_NAMES.pages);
  const cached = isPrivatePath(url.pathname) ? undefined : await pages.match(key);

  const network = fetch(event.request).then((res) => {
    if (shouldCachePage(url, res)) event.waitUntil(putSafely(CACHE_NAMES.pages, key, res.clone(), CACHE_LIMITS.pages));
    return res;
  });

  try {
    // With a cached copy we only wait a few seconds; without one we wait for the
    // network (a slow connection beats a degraded shell) and fall back only on failure.
    const res = cached ? await withTimeout(network, NETWORK_TIMEOUT_MS) : await network;
    if (res.status >= 500 && cached) return cached;
    if (res.ok) void maybeRefreshShell(event);
    return res;
  } catch {
    event.waitUntil(network.catch(() => undefined)); // let a slow request still refresh the cache
    return cached ?? (await offlineFallback());
  }
};

const handlePublicData = async (event: FetchEvent): Promise<Response> => {
  const cache = await caches.open(CACHE_NAMES.publicData);
  const keyUrl = event.request.url;
  const cached = await cache.match(keyUrl);
  const usable = cached && isFreshEnough(cached.headers.get("date"), PUBLIC_DATA_MAX_AGE_MS) ? cached : undefined;
  const network = fetch(event.request).then((res) => {
    if (res.ok) event.waitUntil(putSafely(CACHE_NAMES.publicData, keyUrl, res.clone(), CACHE_LIMITS.publicData));
    return res;
  });
  try {
    const res = usable ? await withTimeout(network, NETWORK_TIMEOUT_MS) : await network;
    return res.status >= 500 && usable ? usable : res;
  } catch {
    event.waitUntil(network.catch(() => undefined));
    if (usable) return usable;
    throw new Error("offline");
  }
};

const handleAudio = async (event: FetchEvent): Promise<Response | undefined> => {
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  const url = new URL(event.request.url);
  const cached = await audioCache.match(url.pathname);
  if (!cached) return undefined; // not downloaded: the browser streams it normally
  return buildAudioResponse(cached, event.request.headers.get("range"));
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const kind = classifyRequest({
    url: new URL(request.url),
    method: request.method,
    mode: request.mode,
    destination: request.destination,
    selfOrigin: self.location.origin,
  });
  switch (kind) {
    case "ignore":
      return;
    case "asset":
      event.respondWith(cacheFirst(request, CACHE_NAMES.assets, CACHE_LIMITS.assets));
      return;
    case "image":
      event.respondWith(staleWhileRevalidate(event, CACHE_NAMES.images, CACHE_LIMITS.images));
      return;
    case "navigation":
      event.respondWith(handleNavigation(event));
      return;
    case "public-data":
      event.respondWith(handlePublicData(event));
      return;
    case "audio":
      // respondWith must be called synchronously; fall through to the network when not downloaded.
      event.respondWith(handleAudio(event).then((res) => res ?? fetch(request)));
      return;
  }
});

// --- messages ----------------------------------------------------------------

self.addEventListener("message", (event) => {
  const type = (event.data as { type?: string } | null)?.type;
  if (type === SW_MESSAGES.skipWaiting) {
    void self.skipWaiting();
  } else if (type === SW_MESSAGES.getVersion) {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }
});

// --- background sync (Chromium): ask open windows to flush the offline queue ----

const broadcast = async (message: Record<string, unknown>) => {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  windows.forEach((client) => client.postMessage(message));
  return windows.length;
};

self.addEventListener("sync", (event) => {
  const syncEvent = event as ExtendableEvent & { tag?: string };
  if (syncEvent.tag === BACKGROUND_SYNC_TAG) {
    // The worker holds no credentials (never stores tokens), so it only wakes a window to do the sync.
    syncEvent.waitUntil(broadcast({ type: SW_MESSAGES.flushQueue }).then(() => undefined));
  }
});

// --- push --------------------------------------------------------------------

self.addEventListener("push", (event) => {
  const parsed = notificationFromPush(() => (event.data ? event.data.json() : null), self.location.origin);
  event.waitUntil(
    (async () => {
      // Every push must show a notification (userVisibleOnly; iOS revokes the subscription otherwise).
      await self.registration.showNotification(parsed.title, {
        body: parsed.body,
        icon: parsed.icon,
        badge: parsed.badge,
        tag: parsed.tag,
        data: { url: parsed.url, category: parsed.category },
        actions: parsed.actions,
        lang: "en-ZA",
        // `actions` is Chromium/Android only and missing from the WebWorker lib typings.
      } as NotificationOptions & { actions: typeof parsed.actions });
      const nav = self.navigator as WorkerNavigator & { setAppBadge?: (n?: number) => Promise<void> };
      if (parsed.badgeCount != null && nav.setAppBadge) await nav.setAppBadge(parsed.badgeCount).catch(() => undefined);
      await broadcast({ type: SW_MESSAGES.pushReceived, category: parsed.category });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const target = safeNotificationUrl((event.notification.data as { url?: string } | undefined)?.url, self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: SW_MESSAGES.notificationClick, url: target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // The browser rotated/expired the subscription. The worker can't talk to the
  // authenticated API, so it wakes the windows; the app re-registers on next open
  // (src/lib/pwa/notificationManager.ts → syncSubscription()).
  (event as ExtendableEvent).waitUntil(broadcast({ type: "PUSH_SUBSCRIPTION_CHANGED" }).then(() => undefined));
});
