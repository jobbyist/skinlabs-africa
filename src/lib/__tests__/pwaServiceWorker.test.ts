import { describe, expect, test } from "bun:test";
import { AUDIO_CACHE_NAME, CACHE_NAMES, CACHE_PREFIX } from "../pwa/constants";
import {
  buildAudioResponse,
  cachesToDelete,
  classifyRequest,
  extractAssetUrls,
  hasSensitiveQuery,
  isFreshEnough,
  isPrivatePath,
  pageCacheKey,
  parseByteRange,
  chooseNotificationActions,
  pickWindowIndexForClick,
  pushTrackUrl,
  requiresVisibleNotification,
  safeClickTarget,
  shouldCachePage,
  shouldSuppressSystemNotification,
} from "../pwa/swCore";
import { notificationFromPush, safeNotificationUrl } from "../pwa/pushPayload";

const SELF = "https://skinlabs.co.za";
const classify = (url: string, init: { method?: string; mode?: string; destination?: string } = {}) =>
  classifyRequest({ url: new URL(url), method: init.method ?? "GET", mode: init.mode ?? "cors", destination: init.destination, selfOrigin: SELF });

describe("what the service worker will touch (privacy contract)", () => {
  test("hashed build assets are cache-first; images stale-while-revalidate; navigations network-first", () => {
    expect(classify(`${SELF}/assets/index-abc123.js`)).toBe("asset");
    expect(classify(`${SELF}/podcast/ep1-weird-skincare.jpg`)).toBe("image");
    expect(classify(`${SELF}/logosvg.png`, { destination: "image" })).toBe("image");
    expect(classify(`${SELF}/reviews/some-serum`, { mode: "navigate" })).toBe("navigation");
  });
  test("Supabase auth, RPC, storage, edge functions and private tables are NEVER intercepted", () => {
    const base = "https://gnkpzijxuciiaamakgzm.supabase.co";
    for (const path of [
      "/auth/v1/token?grant_type=refresh_token",
      "/auth/v1/user",
      "/rest/v1/rpc/get_advanced_assessment_access",
      "/rest/v1/profiles?select=*",
      "/rest/v1/payment_subscriptions",
      "/rest/v1/skincare_recommendations",
      "/rest/v1/notifications",
      "/rest/v1/advanced_assessment_reports",
      "/storage/v1/object/sign/skynn-advanced-intake/x.pdf",
      "/functions/v1/payfast-payment",
      "/realtime/v1/websocket",
    ]) {
      expect(classify(`${base}${path}`)).toBe("ignore");
    }
  });
  test("only whitelisted public editorial tables are cached", () => {
    const base = "https://gnkpzijxuciiaamakgzm.supabase.co/rest/v1";
    expect(classify(`${base}/news_articles_public?select=*&limit=3`)).toBe("public-data");
    expect(classify(`${base}/ai_generated_product_reviews?select=*`)).toBe("public-data");
    expect(classify(`${base}/ai_generated_comparisons?select=*`)).toBe("public-data");
    expect(classify(`${base}/news_articles?select=*`)).toBe("ignore");
  });
  test("non-GET, /api, other origins, probes and the worker itself are ignored", () => {
    expect(classify(`${SELF}/assets/x.js`, { method: "POST" })).toBe("ignore");
    expect(classify(`${SELF}/api/admin-analytics`)).toBe("ignore");
    expect(classify("https://pagead2.googlesyndication.com/x.js")).toBe("ignore");
    expect(classify("https://images.unsplash.com/photo.jpg", { destination: "image" })).toBe("ignore");
    expect(classify(`${SELF}/manifest.webmanifest?ping=1`)).toBe("ignore");
    expect(classify(`${SELF}/sw.js`)).toBe("ignore");
  });
  test("podcast audio is routed to the download cache only", () => {
    expect(classify(`${SELF}/ep1skinlabs.mp3`)).toBe("audio");
    expect(classify(`${SELF}/pouches.m4a`)).toBe("audio");
  });
});

describe("page caching rules", () => {
  const html = (over: Partial<{ ok: boolean; status: number; type: string; cc: string }> = {}) => ({
    ok: over.ok ?? true,
    status: over.status ?? 200,
    headers: { get: (n: string) => (n === "content-type" ? over.type ?? "text/html; charset=utf-8" : n === "cache-control" ? over.cc ?? "public, max-age=0" : null) },
  });
  test("public pages are cacheable; member/account routes never are", () => {
    expect(shouldCachePage(new URL(`${SELF}/reviews/some-serum`), html())).toBe(true);
    for (const p of ["/dashboard", "/dashboard/x", "/admin", "/welcome", "/reset-password", "/skynn-ai/advanced", "/marketplace/saved", "/start"]) {
      expect(isPrivatePath(p)).toBe(true);
      expect(shouldCachePage(new URL(`${SELF}${p}`), html())).toBe(false);
    }
    expect(isPrivatePath("/dashboards-guide")).toBe(false);
    expect(isPrivatePath("/skynn-ai")).toBe(false);
  });
  test("auth / intent / payment query strings, errors, non-HTML and no-store are never cached", () => {
    expect(hasSensitiveQuery(new URL(`${SELF}/?code=abc`))).toBe(true);
    expect(hasSensitiveQuery(new URL(`${SELF}/pricing?pi_action=trial&pi_return=%2F`))).toBe(true);
    expect(hasSensitiveQuery(new URL(`${SELF}/reviews/x?utm_source=tiktok`))).toBe(false);
    expect(shouldCachePage(new URL(`${SELF}/?code=abc`), html())).toBe(false);
    expect(shouldCachePage(new URL(`${SELF}/x`), html({ ok: false, status: 404 }))).toBe(false);
    expect(shouldCachePage(new URL(`${SELF}/x`), html({ type: "application/json" }))).toBe(false);
    expect(shouldCachePage(new URL(`${SELF}/x`), html({ cc: "private, no-store" }))).toBe(false);
  });
  test("cache key ignores query strings and trailing slashes", () => {
    expect(pageCacheKey(new URL(`${SELF}/reviews/x/?utm_source=a`))).toBe(`${SELF}/reviews/x`);
    expect(pageCacheKey(new URL(`${SELF}/`))).toBe(`${SELF}/`);
  });
});

describe("cache housekeeping + shell assets", () => {
  test("obsolete caches go, current ones stay, and the podcast download cache is NEVER deleted", () => {
    const current = Object.values(CACHE_NAMES) as string[];
    const existing = [...current, `${CACHE_PREFIX}assets-v0`, "workbox-precache-v2-https://skinlabs.co.za/", "someone-elses-cache", AUDIO_CACHE_NAME];
    expect(cachesToDelete(existing, current, CACHE_PREFIX, AUDIO_CACHE_NAME).sort()).toEqual([`${CACHE_PREFIX}assets-v0`, "workbox-precache-v2-https://skinlabs.co.za/"].sort());
  });
  test("entry assets are read from the shell HTML", () => {
    const doc = `<link rel="stylesheet" href="/assets/index-1.css"><script type="module" src="/assets/index-2.js"></script><link rel="modulepreload" href="/assets/vendor-3.js?x=1"><img src="/logosvg.png">`;
    expect(extractAssetUrls(doc).sort()).toEqual(["/assets/index-1.css", "/assets/index-2.js", "/assets/vendor-3.js"].sort());
  });
  test("cached public data expires after its max age", () => {
    const now = Date.parse("2026-10-10T00:00:00Z");
    expect(isFreshEnough("Sat, 03 Oct 2026 12:00:00 GMT", 7 * 86400_000, now)).toBe(true);
    expect(isFreshEnough("Mon, 01 Sep 2026 12:00:00 GMT", 7 * 86400_000, now)).toBe(false);
    expect(isFreshEnough(null, 1, now)).toBe(true);
  });
});

describe("Range requests for offline audio", () => {
  test("parseByteRange", () => {
    expect(parseByteRange(null, 1000)).toBeNull();
    expect(parseByteRange("bytes=0-", 1000)).toEqual({ start: 0, end: 999 });
    expect(parseByteRange("bytes=100-199", 1000)).toEqual({ start: 100, end: 199 });
    expect(parseByteRange("bytes=900-5000", 1000)).toEqual({ start: 900, end: 999 });
    expect(parseByteRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
    expect(parseByteRange("bytes=1000-", 1000)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=5-2", 1000)).toBe("unsatisfiable");
    expect(parseByteRange("bytes=0-1,5-9", 1000)).toBeNull();
    expect(parseByteRange("garbage", 1000)).toBeNull();
  });
  test("buildAudioResponse returns 200 / 206 / 416 with correct headers and bytes", async () => {
    const bytes = new Uint8Array(Array.from({ length: 100 }, (_, i) => i));
    const cached = new Response(bytes, { headers: { "Content-Type": "audio/mpeg" } });

    const full = await buildAudioResponse(cached, null);
    expect(full.status).toBe(200);
    expect(full.headers.get("Accept-Ranges")).toBe("bytes");
    expect(new Uint8Array(await full.arrayBuffer()).length).toBe(100);

    const part = await buildAudioResponse(cached, "bytes=10-19");
    expect(part.status).toBe(206);
    expect(part.headers.get("Content-Range")).toBe("bytes 10-19/100");
    expect(Array.from(new Uint8Array(await part.arrayBuffer()))).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

    const open = await buildAudioResponse(cached, "bytes=90-");
    expect(open.status).toBe(206);
    expect(open.headers.get("Content-Length")).toBe("10");

    const bad = await buildAudioResponse(cached, "bytes=500-");
    expect(bad.status).toBe(416);
    expect(bad.headers.get("Content-Range")).toBe("bytes */100");
  });
});

describe("push payloads are untrusted input", () => {
  test("click targets are same-origin relative paths only", () => {
    expect(safeNotificationUrl("/podcast/ep-1", SELF)).toBe("/podcast/ep-1");
    expect(safeNotificationUrl("https://skinlabs.co.za/briefings/x?y=1#z", SELF)).toBe("/start"); // absolute URLs are refused: relative "/…" only
    expect(safeNotificationUrl("https://evil.example/phish", SELF)).toBe("/start");
    expect(safeNotificationUrl("//evil.example", SELF)).toBe("/start");
    expect(safeNotificationUrl("javascript:alert(1)", SELF)).toBe("/start");
    expect(safeNotificationUrl(undefined, SELF)).toBe("/start");
  });
  test("fields are typed, clipped and defaulted; unknown actions dropped", () => {
    const n = notificationFromPush(
      () => ({ title: "x".repeat(500), body: 42, category: "podcast_episode", url: "/podcast", actions: [{ action: "open", title: "Listen now" }, { action: "evil", title: "x" }, { action: "dismiss", title: "Later" }, { action: "open", title: "third" }], badge_count: 7 }),
      SELF,
    );
    expect(n.title.length).toBe(80);
    expect(n.body).toBe("You have a new update.");
    expect(n.category).toBe("podcast_episode");
    expect(n.tag).toBe("skinlabs-podcast_episode");
    expect(n.actions).toEqual([{ action: "open", title: "Listen now" }, { action: "dismiss", title: "Later" }]);
    expect(n.badgeCount).toBe(7);
  });
  test("empty or malformed payloads still produce a safe visible notification", () => {
    for (const read of [() => null, () => "oops", () => { throw new Error("bad json"); }]) {
      const n = notificationFromPush(read, SELF);
      expect(n.title).toBe("SkinLabs®");
      expect(n.url).toBe("/start");
      expect(n.category).toBe("other");
    }
  });
});

describe("notification click validation", () => {
  test("accepts a same-origin relative path and keeps its query and hash", () => {
    expect(safeClickTarget("/dashboard?tab=inbox", SELF)).toBe("/dashboard?tab=inbox");
    expect(safeClickTarget("/podcast/ep-1#notes", SELF)).toBe("/podcast/ep-1#notes");
  });
  test("rejects //host, backslashes, absolute and scheme URLs, control characters, empties and non-strings", () => {
    for (const bad of ["//evil.example", "/\\evil.example", "/a\\b", "https://skinlabs.co.za/x", "https://evil.example", "javascript:alert(1)", "data:text/html,x", "", "dashboard", "/ok\u0000x", "/ok\nx", `/${"a".repeat(400)}`, undefined, null, 42, {}]) {
      expect(safeClickTarget(bad as unknown, SELF)).toBeNull();
    }
  });
  test("the worker falls back to the start page through safeNotificationUrl", () => {
    expect(safeNotificationUrl("//evil.example", SELF)).toBe("/start");
    expect(safeNotificationUrl("/\\evil.example", SELF)).toBe("/start");
  });
});

describe("visible-window suppression", () => {
  const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
  const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
  const MAC_SAFARI = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
  const win = (over: Partial<{ url: string; visibilityState: string; focused: boolean }> = {}) => ({ url: `${SELF}/dashboard`, visibilityState: "visible", focused: true, ...over });
  test("a visible AND focused SkinLabs window suppresses the system notification", () => {
    expect(shouldSuppressSystemNotification([win()], SELF, ANDROID)).toBe(true);
  });
  test("hidden, unfocused, other-origin or no windows: show the notification", () => {
    expect(shouldSuppressSystemNotification([win({ visibilityState: "hidden" })], SELF, ANDROID)).toBe(false);
    expect(shouldSuppressSystemNotification([win({ focused: false })], SELF, ANDROID)).toBe(false);
    expect(shouldSuppressSystemNotification([win({ url: "https://evil.example/" })], SELF, ANDROID)).toBe(false);
    expect(shouldSuppressSystemNotification([win({ url: "not a url" })], SELF, ANDROID)).toBe(false);
    expect(shouldSuppressSystemNotification([], SELF, ANDROID)).toBe(false);
  });
  test("any one qualifying window is enough", () => {
    expect(shouldSuppressSystemNotification([win({ focused: false }), win()], SELF, ANDROID)).toBe(true);
  });
  test("never on WebKit (iOS and Safari revoke a subscription whose pushes show nothing)", () => {
    expect(requiresVisibleNotification(IPHONE)).toBe(true);
    expect(requiresVisibleNotification(MAC_SAFARI)).toBe(true);
    expect(requiresVisibleNotification(ANDROID)).toBe(false);
    expect(shouldSuppressSystemNotification([win()], SELF, IPHONE)).toBe(false);
    expect(shouldSuppressSystemNotification([win()], SELF, MAC_SAFARI)).toBe(false);
  });
});

describe("which window a tap reuses (no second window)", () => {
  const w = (url: string, visibilityState = "hidden", focused = false) => ({ url, visibilityState, focused });
  test("prefers focused, then visible, then any same-origin window; ignores other origins", () => {
    expect(pickWindowIndexForClick([w(`${SELF}/a`), w(`${SELF}/b`, "visible", true)], SELF)).toBe(1);
    expect(pickWindowIndexForClick([w(`${SELF}/a`), w(`${SELF}/b`, "visible")], SELF)).toBe(1);
    expect(pickWindowIndexForClick([w("https://evil.example/"), w(`${SELF}/a`)], SELF)).toBe(1);
    expect(pickWindowIndexForClick([w("https://evil.example/")], SELF)).toBe(-1);
    expect(pickWindowIndexForClick([], SELF)).toBe(-1);
  });
});

describe("action buttons and build config", () => {
  test("actions only where the platform reports support (Android/desktop Chromium), capped at maxActions", () => {
    expect(chooseNotificationActions([], undefined)).toEqual([]);
    expect(chooseNotificationActions([], 0)).toEqual([]);
    expect(chooseNotificationActions([], 2).map((a) => a.action)).toEqual(["open", "dismiss"]);
    expect(chooseNotificationActions([], 1).map((a) => a.action)).toEqual(["open"]);
    expect(chooseNotificationActions([{ action: "open", title: "Listen" }], 2)).toEqual([{ action: "open", title: "Listen" }]);
  });
  test("the push-track URL is derived from the public project URL, https only, never hard-coded", () => {
    expect(pushTrackUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co/functions/v1/push-track");
    expect(pushTrackUrl("https://abc.supabase.co/")).toBe("https://abc.supabase.co/functions/v1/push-track");
    for (const bad of [undefined, null, "", "http://abc.supabase.co", "not a url", 7]) expect(pushTrackUrl(bad as unknown)).toBeNull();
  });
});
