import { afterAll, beforeAll, describe, expect, test } from "bun:test";

/**
 * Drives the real service worker (src/sw/sw.ts) against a fake ServiceWorkerGlobalScope and checks what a tapped
 * notification does: the exact URL opens, in one window, never via the home page.
 */
type Handler = (event: Record<string, unknown>) => void;
const handlers: Record<string, Handler> = {};
const opened: string[] = [];
const posted: Array<{ message: Record<string, unknown> }> = [];
const navigated: string[] = [];
let windows: Array<Record<string, unknown>> = [];
let ackMode: "ack" | "silent" = "ack";
let navigateThrows = false;

const makeClient = (url: string) => ({
  url,
  visibilityState: "visible",
  focused: true,
  focus: async function () {
    return this;
  },
  postMessage(message: Record<string, unknown>, transfer?: MessagePort[]) {
    posted.push({ message });
    if (ackMode === "ack") transfer?.[0]?.postMessage({ ok: true });
  },
  navigate: async (u: string) => {
    if (navigateThrows) throw new Error("not controlled");
    navigated.push(u);
    return null;
  },
});

const originalSelf = (globalThis as { self?: unknown }).self;
const ORIGIN = "https://skinlabs.co.za";

beforeAll(async () => {
  (globalThis as { self?: unknown }).self = {
    location: { origin: ORIGIN },
    navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130" },
    addEventListener: (type: string, fn: Handler) => {
      handlers[type] = fn;
    },
    clients: {
      matchAll: async () => windows,
      openWindow: async (u: string) => {
        opened.push(u);
        return null;
      },
      claim: async () => undefined,
    },
    registration: { showNotification: async () => undefined },
    skipWaiting: async () => undefined,
  };
  await import("../../sw/sw");
});
afterAll(() => {
  (globalThis as { self?: unknown }).self = originalSelf;
});

const tap = async (url: unknown, action = "") => {
  opened.length = 0;
  posted.length = 0;
  navigated.length = 0;
  const waits: Promise<unknown>[] = [];
  handlers.notificationclick({
    action,
    notification: { close() {}, data: { url } },
    waitUntil: (p: Promise<unknown>) => waits.push(p),
  });
  await Promise.all(waits);
};

describe("notification tap -> deep link", () => {
  test("cold start (no window): opens the exact article URL, not the home or start page", async () => {
    windows = [];
    await tap("/briefings/some-article-slug");
    expect(opened).toEqual(["/briefings/some-article-slug"]);
  });

  test("app already open: focuses it and asks the page to route; no second window, no reload", async () => {
    windows = [makeClient(`${ORIGIN}/dashboard`)];
    ackMode = "ack";
    await tap("/reviews/sb-moisture-bomb");
    expect(posted).toHaveLength(1);
    expect(posted[0].message).toEqual({ type: "NOTIFICATION_CLICK", url: "/reviews/sb-moisture-bomb" });
    expect(opened).toEqual([]);
    expect(navigated).toEqual([]);
  });

  test("a window that never acknowledges (old page, frozen tab) is navigated directly to the URL", async () => {
    windows = [makeClient(`${ORIGIN}/briefings/older-article`)];
    ackMode = "silent";
    navigateThrows = false;
    await tap("/podcast/ep-1");
    expect(navigated).toEqual(["/podcast/ep-1"]);
    expect(opened).toEqual([]);
  });

  test("if the window cannot be navigated, a new window opens the URL", async () => {
    windows = [makeClient(`${ORIGIN}/`)];
    ackMode = "silent";
    navigateThrows = true;
    await tap("/spotlight/some-brand");
    expect(opened).toEqual(["/spotlight/some-brand"]);
  });

  test("an absolute URL on our own origin is normalised to a path", async () => {
    windows = [];
    await tap("https://skinlabs.co.za/briefings/some-article-slug/?utm_source=push");
    expect(opened).toEqual(["/briefings/some-article-slug?utm_source=push"]);
  });

  test("external, protocol-relative and malformed targets never leave the site (start page fallback)", async () => {
    windows = [];
    for (const bad of ["https://evil.example/phish", "//evil.example", "javascript:alert(1)", "/\\evil.example", undefined, 42]) {
      await tap(bad);
      expect(opened).toEqual(["/start"]);
    }
  });

  test("the Dismiss action opens nothing", async () => {
    windows = [];
    await tap("/briefings/x", "dismiss");
    expect(opened).toEqual([]);
  });
});
