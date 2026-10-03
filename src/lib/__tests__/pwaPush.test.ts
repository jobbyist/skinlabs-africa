import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { categoryAllowed, isGoneStatus, parseSendRequest, safeCompare, sanitizePath } from "../../../supabase/functions/_shared/push/dispatch";

// --- fakes for the browser + backend -------------------------------------------------------------
const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
let session: { user: { id: string } } | null = { user: { id: "user-1" } };
let rpcError: { code?: string; message: string } | null = null;
let subscription: { endpoint: string; unsubscribed: boolean; toJSON(): unknown; unsubscribe(): Promise<boolean> } | null = null;
const tracked: string[] = [];

const fakeRegistration = {
  pushManager: {
    getSubscription: async () => subscription,
    subscribe: async () => {
      subscription = {
        endpoint: "https://push.example/send/abc123456789012345",
        unsubscribed: false,
        toJSON: () => ({ endpoint: "https://push.example/send/abc123456789012345", keys: { p256dh: "p256dh-key-0123456789ab", auth: "auth-key-0123" } }),
        async unsubscribe() {
          this.unsubscribed = true;
          subscription = null;
          return true;
        },
      };
      return subscription;
    },
  },
} as unknown as ServiceWorkerRegistration;

const store = new Map<string, string>();
const fakeLocalStorage = {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};

type Env = { permission?: NotificationPermission; push?: boolean; userAgent?: string; standalone?: boolean };
const g = globalThis as unknown as Record<string, unknown>;
const setEnv = ({ permission = "default", push = true, userAgent = "Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile", standalone = false }: Env = {}) => {
  g.navigator = { userAgent, platform: "Linux armv8l", maxTouchPoints: 5, serviceWorker: {}, standalone, onLine: true };
  const Notification: Record<string, unknown> = {
    permission,
    requestPermission: (cb?: (p: NotificationPermission) => void) => {
      const result = (Notification as { next: NotificationPermission }).next ?? "granted";
      Notification.permission = result;
      cb?.(result);
      return Promise.resolve(result);
    },
  };
  g.window = { localStorage: fakeLocalStorage, Notification, matchMedia: () => ({ matches: standalone }), ...(push ? { PushManager: function PushManager() {} } : {}) };
  g.Notification = Notification;
  g.document = { referrer: "" };
  return Notification;
};

process.env.VITE_VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const manager = await import("../pwa/notificationManager");
const { __setPwaEventSink } = await import("../pwa/analytics");

const originals = { navigator: g.navigator, window: g.window, document: g.document, Notification: g.Notification };
beforeAll(() => {
  __setPwaEventSink((event) => void tracked.push(event));
  manager.__setNotificationDepsForTests({
    rpc: async (fn, args) => (rpcCalls.push({ fn, args }), { error: rpcError }),
    getUserId: async () => session?.user.id ?? null,
    getRegistration: async () => fakeRegistration,
  });
});
afterAll(() => {
  __setPwaEventSink(null);
  manager.__setNotificationDepsForTests(null);
  Object.assign(g, originals);
  if (originals.navigator === undefined) delete g.navigator;
  if (originals.window === undefined) delete g.window;
  if (originals.document === undefined) delete g.document;
  if (originals.Notification === undefined) delete g.Notification;
});

beforeEach(() => {
  rpcCalls.length = 0;
  tracked.length = 0;
  rpcError = null;
  subscription = null;
  session = { user: { id: "user-1" } };
});

describe("notification permission is user-initiated and handled", () => {
  test("requestPermission wraps the API, reports the result and fires analytics", async () => {
    const n = setEnv();
    (n as { next: string }).next = "granted";
    expect(await manager.requestPermission()).toBe("granted");
    expect(tracked).toContain("push_permission_granted");
    (n as { next: string }).next = "denied";
    tracked.length = 0;
    expect(await manager.requestPermission()).toBe("denied");
    expect(tracked).toContain("push_permission_denied");
  });
  test("unsupported browsers report 'unsupported' instead of throwing", async () => {
    g.Notification = undefined;
    g.window = {};
    expect(manager.getPermissionState()).toBe("unsupported");
    expect(await manager.requestPermission()).toBe("unsupported");
  });
});

describe("subscription lifecycle", () => {
  test("not supported / needs install / not signed in / permission not granted are explicit, never silent", async () => {
    setEnv({ push: false });
    expect(await manager.subscribe()).toEqual({ ok: false, reason: "unsupported" });

    setEnv({ push: false, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1" });
    expect(await manager.subscribe()).toEqual({ ok: false, reason: "needs_install" });

    setEnv({ permission: "default" });
    expect(await manager.subscribe()).toEqual({ ok: false, reason: "denied" });

    setEnv({ permission: "granted" });
    session = null;
    expect(await manager.subscribe()).toEqual({ ok: false, reason: "not_signed_in" });
    expect(rpcCalls).toHaveLength(0);
  });
  test("granted + signed in: subscribes, registers the device with the account (public keys only)", async () => {
    setEnv({ permission: "granted" });
    expect(await manager.subscribe()).toEqual({ ok: true });
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe("register_push_subscription");
    expect(rpcCalls[0].args.p_endpoint).toBe("https://push.example/send/abc123456789012345");
    expect(rpcCalls[0].args.p_platform).toBe("android");
    expect(JSON.stringify(rpcCalls[0].args)).not.toMatch(/private|VAPID_PRIVATE/i);
    expect(tracked).toContain("push_subscribed");
  });
  test("a duplicate subscribe re-registers the same device (idempotent), it does not create another browser subscription", async () => {
    setEnv({ permission: "granted" });
    await manager.subscribe();
    const first = subscription;
    await manager.subscribe();
    expect(subscription).toBe(first);
    expect(rpcCalls.filter((c) => c.fn === "register_push_subscription")).toHaveLength(2);
  });
  test("unsubscribe removes the browser subscription and the server row", async () => {
    setEnv({ permission: "granted" });
    await manager.subscribe();
    rpcCalls.length = 0;
    expect(await manager.unsubscribe()).toBe(true);
    expect(subscription).toBeNull();
    expect(rpcCalls.map((c) => c.fn)).toEqual(["unregister_push_subscription"]);
    expect(tracked).toContain("push_unsubscribed");
  });
  test("sync: revoked permission drops the server row; expired subscription is re-created; live one is re-registered", async () => {
    setEnv({ permission: "granted" });
    await manager.subscribe(); // marks this device as enabled for user-1
    rpcCalls.length = 0;

    setEnv({ permission: "denied" });
    await manager.syncSubscription("user-1");
    expect(rpcCalls.map((c) => c.fn)).toEqual(["unregister_push_subscription"]);

    // expired: permission still granted, browser lost the subscription, device was enabled → resubscribe
    setEnv({ permission: "granted" });
    subscription = null;
    await manager.subscribe();
    const live = subscription;
    subscription = null; // browser rotated/expired it
    rpcCalls.length = 0;
    await manager.syncSubscription("user-1");
    expect(rpcCalls.map((c) => c.fn)).toEqual(["register_push_subscription"]);
    expect(subscription).not.toBe(live);

    // live subscription: simply re-registered
    rpcCalls.length = 0;
    await manager.syncSubscription("user-1");
    expect(rpcCalls.map((c) => c.fn)).toEqual(["register_push_subscription"]);
  });
  test("sign-out detaches this device from the account but keeps the browser subscription", async () => {
    setEnv({ permission: "granted" });
    await manager.subscribe();
    rpcCalls.length = 0;
    await manager.detachDeviceForSignOut();
    expect(rpcCalls.map((c) => c.fn)).toEqual(["unregister_push_subscription"]);
    expect(subscription).not.toBeNull();
  });
});

describe("helpers", () => {
  test("VAPID key conversion is base64url → bytes", () => {
    const bytes = manager.urlBase64ToUint8Array("AQID-_8"); // 01 02 03 fb ff
    expect(Array.from(bytes)).toEqual([1, 2, 3, 0xfb, 0xff]);
  });
  test("preferences: safe defaults, marketing off, junk ignored", () => {
    expect(manager.normalizePreferences(null)).toEqual(manager.DEFAULT_PREFERENCES);
    expect(manager.DEFAULT_PREFERENCES.promotional).toBe(false);
    const merged = manager.normalizePreferences({ promotional: true, briefing: "yes" as unknown as boolean, podcast_episode: true });
    expect(merged.promotional).toBe(true);
    expect(merged.podcast_episode).toBe(true);
    expect(merged.briefing).toBe(false);
    expect(merged.account_update).toBe(true);
  });
});

describe("server-side send rules (push-send)", () => {
  test("a member with no preferences only gets essential messages; promotional needs an explicit opt-in", () => {
    expect(categoryAllowed(undefined, "account_update")).toBe(true);
    expect(categoryAllowed(undefined, "service")).toBe(true);
    expect(categoryAllowed(undefined, "podcast_episode")).toBe(false);
    expect(categoryAllowed(undefined, "promotional")).toBe(false);
    expect(categoryAllowed({ user_id: "u", promotional: false }, "promotional")).toBe(false);
    expect(categoryAllowed({ user_id: "u", promotional: true }, "promotional")).toBe(true);
    expect(categoryAllowed({ user_id: "u", podcast_episode: true }, "briefing")).toBe(false);
  });
  test("requests are validated and clipped; URLs forced same-origin", () => {
    expect(parseSendRequest({ category: "nope", title: "a", body: "b" })).toEqual({ ok: false, reason: "invalid_category" });
    expect(parseSendRequest({ category: "service", title: "", body: "b" })).toEqual({ ok: false, reason: "title_and_body_required" });
    expect(parseSendRequest({ category: "service", title: "a", body: "b", user_ids: ["not-a-uuid"] })).toEqual({ ok: false, reason: "invalid_user_ids" });
    const ok = parseSendRequest({ category: "briefing", title: "T".repeat(200), body: "B", url: "https://evil.example" });
    expect(ok.ok && ok.request.title.length).toBe(80);
    expect(ok.ok && ok.request.url).toBe("/start");
    expect(sanitizePath("/podcast/ep-1?x=1")).toBe("/podcast/ep-1?x=1");
    expect(sanitizePath("//evil")).toBe("/start");
    expect(isGoneStatus(410)).toBe(true);
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(500)).toBe(false);
  });
});

describe("service-role check is constant-time", () => {
  test("equal strings match; any difference, length mismatch or empty value does not", () => {
    expect(safeCompare("sb_service_role_secret", "sb_service_role_secret")).toBe(true);
    expect(safeCompare("sb_service_role_secret", "sb_service_role_secreT")).toBe(false);
    expect(safeCompare("sb_service_role_secret", "sb_service_role_secret2")).toBe(false);
    expect(safeCompare("short", "sb_service_role_secret")).toBe(false);
    expect(safeCompare("", "")).toBe(false);
    expect(safeCompare("", "x")).toBe(false);
    expect(safeCompare("ünïcode-κey", "ünïcode-κey")).toBe(true);
  });
});
