import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { computeEstimate, formatBytes } from "../pwa/storage";
import { isNetworkError } from "../pwa/network";
import { downloadFailureMessage, downloadProgressPercent, resolveDownloadAccess } from "../pwa/downloadAccess";
import { shouldAdoptRemote } from "../pwa/playbackProgress";
import { buildArtwork } from "../pwa/mediaSession";

// --- in-memory IndexedDB stand-in (the wrapper's own API) --------------------------------------
const stores: Record<string, Map<string, unknown>> = { downloads: new Map(), queue: new Map(), kv: new Map() };
const keyOf = (store: string, v: unknown) => String((v as { slug?: string; key?: string })[store === "downloads" ? "slug" : "key"]);
mock.module("../pwa/idb", () => ({
  openPwaDb: async () => ({}),
  idbGet: async (s: string, k: string) => stores[s].get(k),
  idbGetAll: async (s: string) => [...stores[s].values()].map((v) => ({ ...(v as object) })),
  idbPut: async (s: string, v: unknown) => (stores[s].set(keyOf(s, v), v), true),
  idbDelete: async (s: string, k: string) => void stores[s].delete(k),
  idbClear: async (s: string) => stores[s].clear(),
}));

// --- fake Cache Storage + fetch + window -------------------------------------------------------
const cacheData = new Map<string, Map<string, Response>>();
const fakeCaches = {
  open: async (name: string) => {
    if (!cacheData.has(name)) cacheData.set(name, new Map());
    const m = cacheData.get(name) as Map<string, Response>;
    return {
      put: async (k: string, r: Response) => void m.set(k, r),
      match: async (k: string) => m.get(k)?.clone(),
      delete: async (k: string) => m.delete(k),
      keys: async () => [...m.keys()].map((u) => new Request(`https://skinlabs.co.za${u}`)),
    };
  },
  delete: async (n: string) => cacheData.delete(n),
  keys: async () => [...cacheData.keys()],
};
const g = globalThis as unknown as Record<string, unknown>;
let fetchImpl: (url: string, init?: RequestInit) => Promise<Response>;
const AUDIO = new Uint8Array(Array.from({ length: 5000 }, (_, i) => i % 251));
const PLENTY = 1e11;
let quotaFree = PLENTY;

const installEnv = () => {
  g.window = { caches: fakeCaches, indexedDB: {}, localStorage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined } };
  g.caches = fakeCaches;
  g.navigator = { onLine: true, userAgent: "x", storage: { estimate: async () => ({ quota: 1e12, usage: 1e12 - quotaFree }), persist: async () => true, persisted: async () => false } };
  g.fetch = (url: string, init?: RequestInit) => fetchImpl(url, init);
};

const cache = await import("../pwa/podcastCache");
const { __setPwaEventSink } = await import("../pwa/analytics");

const originalGlobals = { window: g.window, caches: g.caches, navigator: g.navigator, fetch: g.fetch, document: g.document };
const originalCreateObjectURL = URL.createObjectURL;
beforeAll(() => __setPwaEventSink(() => undefined));
afterAll(() => {
  __setPwaEventSink(null);
  URL.createObjectURL = originalCreateObjectURL;
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete g[key];
    else g[key] = value;
  }
});

const episode = { slug: "ep-1", title: "Episode 1", audioFile: "/ep1skinlabs.mp3", image: "/podcast/ep1.jpg" };
const streamOf = (bytes: Uint8Array, chunk = 1000) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunk) controller.enqueue(bytes.slice(i, i + chunk));
      controller.close();
    },
  });
const okAudio = () => new Response(streamOf(AUDIO), { status: 200, headers: { "Content-Type": "audio/mpeg", "Content-Length": String(AUDIO.length) } });
const wait = async (cond: () => boolean, ms = 1000) => {
  const start = Date.now();
  while (!cond() && Date.now() - start < ms) await new Promise((r) => setTimeout(r, 5));
  if (!cond()) throw new Error("timed out waiting");
};

beforeEach(async () => {
  Object.values(stores).forEach((m) => m.clear());
  cacheData.clear();
  quotaFree = PLENTY;
  installEnv();
  cache.__resetPodcastCacheForTests();
  fetchImpl = async () => okAudio();
});

describe("offline podcast download lifecycle", () => {
  test("download → progress → stored in Cache Storage + metadata in IndexedDB → 'available offline'", async () => {
    await cache.startDownload(episode);
    expect(cache.getDownload("ep-1")?.status).toBe("downloading");
    await wait(() => cache.isDownloaded("ep-1"));
    const rec = cache.getDownload("ep-1");
    expect(rec?.totalBytes).toBe(AUDIO.length);
    // audio bytes live in the dedicated cache, keyed by path…
    const hit = await (await fakeCaches.open("skinlabs-podcast-audio")).match("/ep1skinlabs.mp3");
    expect(new Uint8Array(await (hit as Response).arrayBuffer())).toEqual(AUDIO);
    // …metadata (no bytes) in IndexedDB.
    const meta = stores.downloads.get("ep-1") as Record<string, unknown>;
    expect(meta.status).toBe("downloaded");
    expect(JSON.stringify(meta)).not.toContain("blob");
    expect(cache.getDownloadedBytes()).toEqual({ episodes: 1, bytes: AUDIO.length });
  });
  test("a finished download can be played from a blob URL and removed again (bytes + metadata)", async () => {
    URL.createObjectURL = () => "blob:test";
    await cache.startDownload(episode);
    await wait(() => cache.isDownloaded("ep-1"));
    expect(await cache.getDownloadedObjectUrl("ep-1")).toBe("blob:test");
    await cache.removeDownload("ep-1");
    expect(cache.isDownloaded("ep-1")).toBe(false);
    expect(stores.downloads.size).toBe(0);
    expect(await (await fakeCaches.open("skinlabs-podcast-audio")).match("/ep1skinlabs.mp3")).toBeUndefined();
  });
  test("a network failure marks it failed (retryable), and a retry succeeds", async () => {
    fetchImpl = async () => {
      throw new TypeError("Failed to fetch");
    };
    await cache.startDownload(episode);
    await wait(() => cache.getDownload("ep-1")?.status === "failed");
    expect(cache.getDownload("ep-1")?.failure).toBe("network");
    fetchImpl = async () => okAudio();
    await cache.startDownload(episode);
    await wait(() => cache.isDownloaded("ep-1"));
  });
  test("not enough storage is reported as 'quota' before filling the device", async () => {
    quotaFree = 100; // 100 bytes free, audio is 5000
    await cache.startDownload(episode);
    await wait(() => cache.getDownload("ep-1")?.status === "failed");
    expect(cache.getDownload("ep-1")?.failure).toBe("quota");
    expect(downloadFailureMessage("quota")).toMatch(/storage/i);
  });
  test("cancel aborts and forgets the download", async () => {
    let release: () => void = () => undefined;
    fetchImpl = async (_u, init) =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(AUDIO.slice(0, 100));
            init?.signal?.addEventListener("abort", () => c.error(new DOMException("aborted", "AbortError")));
            release = () => {
              try {
                c.close();
              } catch {
                /* already errored by abort */
              }
            };
          },
        }),
        { status: 200, headers: { "Content-Length": String(AUDIO.length) } },
      );
    await cache.startDownload(episode);
    await wait(() => (cache.getDownload("ep-1")?.bytesReceived ?? 0) > 0 || cache.getDownload("ep-1")?.status === "downloading");
    await cache.cancelDownload("ep-1");
    release();
    expect(cache.getDownload("ep-1")).toBeUndefined();
    expect(stores.downloads.size).toBe(0);
  });
  test("pause keeps what was received and resume continues with a Range request", async () => {
    const requests: (string | undefined)[] = [];
    let first = true;
    fetchImpl = async (_u, init) => {
      requests.push((init?.headers as Record<string, string> | undefined)?.Range);
      if (first) {
        first = false;
        return new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(AUDIO.slice(0, 2000));
              init?.signal?.addEventListener("abort", () => c.error(new DOMException("aborted", "AbortError")));
            },
          }),
          { status: 200, headers: { "Content-Length": String(AUDIO.length) } },
        );
      }
      return new Response(AUDIO.slice(2000), { status: 206, headers: { "Content-Length": String(AUDIO.length - 2000), "Content-Type": "audio/mpeg" } });
    };
    await cache.startDownload(episode);
    await wait(() => (cache.getDownload("ep-1")?.bytesReceived ?? 0) >= 2000);
    cache.pauseDownload("ep-1");
    await wait(() => cache.getDownload("ep-1")?.status === "paused");
    cache.resumeDownload("ep-1");
    await wait(() => cache.isDownloaded("ep-1"));
    expect(requests).toEqual([undefined, "bytes=2000-"]);
    const stored = await (await fakeCaches.open("skinlabs-podcast-audio")).match("/ep1skinlabs.mp3");
    expect(new Uint8Array(await (stored as Response).arrayBuffer())).toEqual(AUDIO);
  });
  test("metadata without bytes (cleared by the browser) is never reported as available offline; interrupted downloads become retryable", async () => {
    stores.downloads.set("ghost", { slug: "ghost", title: "Ghost", audioPath: "/ghost.mp3", image: "", status: "downloaded", bytesReceived: 1, totalBytes: 1 });
    stores.downloads.set("half", { slug: "half", title: "Half", audioPath: "/half.mp3", image: "", status: "downloading", bytesReceived: 1, totalBytes: 10 });
    await cache.loadDownloads();
    expect(cache.isDownloaded("ghost")).toBe(false);
    expect(stores.downloads.has("ghost")).toBe(false);
    expect(cache.getDownload("half")?.status).toBe("failed");
    expect(cache.getDownload("half")?.failure).toBe("interrupted");
  });
});

describe("who may download", () => {
  test("signed in; non-members only the episode they could stream", () => {
    expect(resolveDownloadAccess({ signedIn: false, isMember: false, canPlayFreeEpisode: true })).toBe("sign_in");
    expect(resolveDownloadAccess({ signedIn: true, isMember: false, canPlayFreeEpisode: false })).toBe("upgrade");
    expect(resolveDownloadAccess({ signedIn: true, isMember: false, canPlayFreeEpisode: true })).toBe("ok");
    expect(resolveDownloadAccess({ signedIn: true, isMember: true, canPlayFreeEpisode: false })).toBe("ok");
  });
  test("progress percent", () => {
    expect(downloadProgressPercent(50, 200)).toBe(25);
    expect(downloadProgressPercent(5, 0)).toBeNull();
    expect(downloadProgressPercent(500, 200)).toBe(100);
  });
});

describe("storage calculations", () => {
  test("formatBytes", () => {
    expect(formatBytes(0)).toBe("0 MB");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB");
    expect(formatBytes(3.5 * 1024 ** 3)).toBe("3.5 GB");
  });
  test("estimate: available, percent, and bad inputs", () => {
    expect(computeEstimate(1000, 250)).toEqual({ quota: 1000, usage: 250, available: 750, percentUsed: 25 });
    expect(computeEstimate(100, 400).available).toBe(0);
    expect(computeEstimate(100, 400).percentUsed).toBe(100);
    expect(computeEstimate(0, 0).percentUsed).toBe(0);
    expect(computeEstimate(NaN, -5)).toEqual({ quota: 0, usage: 0, available: 0, percentUsed: 0 });
  });
});

describe("network + sync rules", () => {
  test("real network failures are recognised; aborts and server errors are not 'offline'", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new TypeError("Load failed"))).toBe(true);
    expect(isNetworkError(new Error("NetworkError when attempting to fetch resource."))).toBe(true);
    expect(isNetworkError(new DOMException("aborted", "AbortError"))).toBe(false);
    expect(isNetworkError(new Error("duplicate key value"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
  test("stale offline progress never overwrites newer progress", () => {
    expect(shouldAdoptRemote(1000, 2000)).toBe(true);
    expect(shouldAdoptRemote(2000, 1000)).toBe(false);
    expect(shouldAdoptRemote(2000, 2000)).toBe(false);
  });
});

describe("media session artwork", () => {
  test("episode cover first, square app icons as fallback, absolute URLs", () => {
    g.window = { location: { origin: "https://skinlabs.co.za" } };
    const art = buildArtwork("/podcast/ep5.webp");
    expect(art[0]).toEqual({ src: "https://skinlabs.co.za/podcast/ep5.webp", sizes: "1080x1350", type: "image/webp" });
    expect(art.map((a) => a.src)).toContain("https://skinlabs.co.za/pwa-512.png");
  });
});

describe("offline action queue", () => {
  const q = () => import("../pwa/offlineQueue");
  const action = (key: string, over: Record<string, unknown> = {}) => ({ key, type: "podcast_progress" as const, userId: "u1", payload: { position: 1 }, ...over });

  test("queuing the same key again replaces the pending action (idempotent, newest wins)", async () => {
    const { enqueueAction, pendingQueueLength } = await q();
    await enqueueAction(action("podcast_progress:u1:ep-1", { payload: { position: 10 } }));
    await enqueueAction(action("podcast_progress:u1:ep-1", { payload: { position: 99 } }));
    expect(await pendingQueueLength()).toBe(1);
    expect((stores.queue.get("podcast_progress:u1:ep-1") as { payload: { position: number } }).payload.position).toBe(99);
  });
  test("flush replays in order, removes completed actions, and drops permanent failures", async () => {
    const { enqueueAction, flushQueue, registerQueueHandler, pendingQueueLength } = await q();
    const seen: string[] = [];
    registerQueueHandler("podcast_progress", async (a) => {
      seen.push(a.key);
      return a.key.endsWith("bad") ? "drop" : "done";
    });
    await enqueueAction(action("podcast_progress:u1:a"));
    await new Promise((r) => setTimeout(r, 2));
    await enqueueAction(action("podcast_progress:u1:bad"));
    await new Promise((r) => setTimeout(r, 2));
    await enqueueAction(action("podcast_progress:u1:c"));
    expect(await flushQueue()).toBe(2);
    expect(seen).toEqual(["podcast_progress:u1:a", "podcast_progress:u1:bad", "podcast_progress:u1:c"]);
    expect(await pendingQueueLength()).toBe(0);
  });
  test("while still offline an action is kept (attempt counted) and the run stops early; a later flush completes it", async () => {
    const { enqueueAction, flushQueue, registerQueueHandler, pendingQueueLength } = await q();
    let online = false;
    registerQueueHandler("podcast_progress", async () => (online ? "done" : "retry"));
    await enqueueAction(action("podcast_progress:u1:x"));
    expect(await flushQueue()).toBe(0);
    expect(await pendingQueueLength()).toBe(1);
    expect((stores.queue.get("podcast_progress:u1:x") as { attempts: number }).attempts).toBe(1);
    online = true;
    expect(await flushQueue()).toBe(1);
    expect(await pendingQueueLength()).toBe(0);
  });
  test("a handler that throws a network error retries; any other error drops the action; no duplicate concurrent runs", async () => {
    const { enqueueAction, flushQueue, registerQueueHandler, pendingQueueLength } = await q();
    let mode: "network" | "other" = "network";
    let runs = 0;
    registerQueueHandler("podcast_progress", async () => {
      runs++;
      throw mode === "network" ? new TypeError("Failed to fetch") : new Error("boom");
    });
    await enqueueAction(action("podcast_progress:u1:y"));
    await Promise.all([flushQueue(), flushQueue()]);
    expect(runs).toBe(1); // concurrent flushes share one run
    expect(await pendingQueueLength()).toBe(1);
    mode = "other";
    await flushQueue();
    expect(await pendingQueueLength()).toBe(0);
  });
  test("actions of a type with no loaded handler are left for later; after 8 failed attempts an action is discarded", async () => {
    const { enqueueAction, flushQueue, registerQueueHandler, pendingQueueLength } = await q();
    await enqueueAction(action("notification_preferences:u1", { type: "notification_preferences" }));
    await flushQueue();
    expect(await pendingQueueLength()).toBe(1);
    stores.queue.clear();
    registerQueueHandler("podcast_progress", async () => "retry");
    await enqueueAction(action("podcast_progress:u1:z"));
    for (let i = 0; i < 9; i++) await flushQueue();
    expect(await pendingQueueLength()).toBe(0);
  });
});

describe("reachability is confirmed, not guessed", () => {
  test("one failed request while the browser says it is online does NOT flip the app offline when our origin answers", async () => {
    const net = await import("../pwa/network");
    net.__resetNetworkForTests();
    g.window = { ...(g.window as object), setTimeout, clearTimeout };
    (g.navigator as { onLine: boolean }).onLine = true;
    fetchImpl = async () => new Response(null, { status: 200 });
    net.reportNetworkFailure(new TypeError("Failed to fetch"));
    await new Promise((r) => setTimeout(r, 700));
    expect(net.getNetworkSnapshot().reachable).toBe(true);
    net.__resetNetworkForTests();
  });
  test("when the probe fails too, it is unreachable; a later success restores it", async () => {
    const net = await import("../pwa/network");
    net.__resetNetworkForTests();
    (g.navigator as { onLine: boolean }).onLine = true;
    fetchImpl = async () => {
      throw new TypeError("Failed to fetch");
    };
    net.reportNetworkFailure(new TypeError("Failed to fetch"));
    await new Promise((r) => setTimeout(r, 700));
    expect(net.getNetworkSnapshot().reachable).toBe(false);
    expect(net.isEffectivelyOffline(net.getNetworkSnapshot())).toBe(true);
    net.reportNetworkSuccess();
    expect(net.getNetworkSnapshot().reachable).toBe(true);
    net.__resetNetworkForTests();
  });
  test("the browser reporting offline is trusted immediately, and non-network errors are ignored", async () => {
    const net = await import("../pwa/network");
    net.__resetNetworkForTests();
    net.reportNetworkFailure(new Error("duplicate key"));
    expect(net.getNetworkSnapshot().reachable).toBe(true);
    (g.navigator as { onLine: boolean }).onLine = false;
    net.reportNetworkFailure(new TypeError("Failed to fetch"));
    expect(net.getNetworkSnapshot().reachable).toBe(false);
    net.__resetNetworkForTests();
  });
});
