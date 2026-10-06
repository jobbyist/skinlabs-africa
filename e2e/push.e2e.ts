import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * The service worker's push + notificationclick handlers (src/sw/sw.ts), driven by dispatching real PushEvent /
 * NotificationEvent objects inside the worker. Chromium only; presents as a real browser because the PWA layer
 * switches itself off for automation (see pwa.e2e.ts).
 *
 * Headless Chromium reports notification permission as denied and has no notification surface, so the worker's
 * showNotification/getNotifications are replaced by an in-worker fake (`installNotificationFake`). The handlers'
 * own logic (payload parsing, suppression, tag replacement, click routing) runs unmodified; that a real OS shows
 * the notification is a manual device check (docs/notification-dispatcher.md).
 *
 *   npx vite build && npx playwright test e2e/push.e2e.ts
 */
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const DELIVERY = "33333333-3333-4333-8333-333333333333";

test.use({ userAgent: ANDROID_UA });

const setup = async (context: BrowserContext) => {
  await mockSupabase(context, { signedIn: true });
  await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await context.grantPermissions(["notifications"], { origin: "http://127.0.0.1:4173" });
};

type Sw = Awaited<ReturnType<typeof controlled>>;
const installNotificationFake = (sw: Sw) =>
  sw.evaluate(() => {
    type Fake = { title: string; body?: string; tag?: string; data?: unknown; close: () => void };
    const store: Fake[] = [];
    (globalThis as unknown as { __fakeNotifications: Fake[] }).__fakeNotifications = store;
    ServiceWorkerRegistration.prototype.showNotification = async function (title: string, options: NotificationOptions = {}) {
      const index = options.tag ? store.findIndex((n) => n.tag === options.tag) : -1;
      const fake: Fake = {
        title,
        body: options.body,
        tag: options.tag,
        data: options.data,
        close() {
          const i = store.indexOf(fake);
          if (i >= 0) store.splice(i, 1);
        },
      };
      if (index >= 0) store.splice(index, 1, fake); // same tag replaces
      else store.push(fake);
    };
    ServiceWorkerRegistration.prototype.getNotifications = async function () {
      return [...store] as unknown as Notification[];
    };
    // Events constructed by script have no lifetime observer, so Chromium's waitUntil throws and would abort the
    // handler at its first call. Real browser-dispatched events don't have this problem; collect the promises instead.
    const waits: Promise<unknown>[] = [];
    (globalThis as unknown as { __waits: Promise<unknown>[] }).__waits = waits;
    ExtendableEvent.prototype.waitUntil = function (promise: Promise<unknown>) {
      waits.push(Promise.resolve(promise).catch(() => undefined));
    };
  });

const controlled = async (page: Page, context: BrowserContext) => {
  await page.goto("/about");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15_000 }).toBe(true);
  await expect.poll(() => context.serviceWorkers().length).toBeGreaterThan(0);
  const sw = context.serviceWorkers()[0];
  await installNotificationFake(sw);
  return sw;
};

const deliverPush = (sw: Sw, data: string) => sw.evaluate((payload) => void self.dispatchEvent(new PushEvent("push", { data: payload })), data);
const shown = (sw: Sw) =>
  sw.evaluate(async () => (await self.registration.getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag, data: n.data as { url?: string; d?: string } })));
const clickFirst = (sw: Sw) =>
  sw.evaluate(async () => {
    const [n] = await self.registration.getNotifications();
    // NotificationEvent needs a real Notification; the handler only reads .notification and .action, so use an ExtendableEvent.
    const event = new ExtendableEvent("notificationclick");
    Object.defineProperty(event, "notification", { value: n });
    Object.defineProperty(event, "action", { value: "" });
    self.dispatchEvent(event);
  });
const clearNotifications = (sw: Sw) => sw.evaluate(async () => (await self.registration.getNotifications()).forEach((n) => n.close()));

const payload = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ title: "Your SkinLabs® report is ready", body: "Tap to read it securely in the app.", url: "/dashboard?tab=inbox", tag: "report_ready_advanced", category: "report_ready", d: DELIVERY, ...over });

test.describe("push event", () => {
  test("app not in view: a system notification with icon, tag, and data {url, d}; a repeat replaces instead of stacking", async ({ page, context }) => {
    await setup(context);
    const sw = await controlled(page, context);
    await page.goto("about:blank"); // no SkinLabs window is open any more
    await deliverPush(sw, payload());
    await expect.poll(() => shown(sw)).toHaveLength(1);
    const [n] = await shown(sw);
    expect(n).toMatchObject({ title: "Your SkinLabs® report is ready", tag: "report_ready_advanced", data: { url: "/dashboard?tab=inbox", d: DELIVERY } });
    await deliverPush(sw, payload({ body: "Updated body" }));
    await expect.poll(async () => (await shown(sw))[0]?.body).toBe("Updated body");
    expect(await shown(sw)).toHaveLength(1);
  });

  test("a malformed or empty payload still shows a generic SkinLabs® notification", async ({ page, context }) => {
    await setup(context);
    const sw = await controlled(page, context);
    await page.goto("about:blank");
    await deliverPush(sw, "this is not json");
    await expect.poll(() => shown(sw)).toHaveLength(1);
    expect((await shown(sw))[0]).toMatchObject({ title: "SkinLabs®", data: { url: "/start" } });
    await clearNotifications(sw);
    await deliverPush(sw, "");
    await expect.poll(() => shown(sw)).toHaveLength(1);
    expect((await shown(sw))[0].title).toBe("SkinLabs®");
  });

  test("a visible, focused SkinLabs window gets push-received instead of a system notification", async ({ page, context }) => {
    await setup(context);
    const sw = await controlled(page, context);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
    await page.bringToFront();
    await page.evaluate(() => {
      (window as unknown as { __pushEvents: string[] }).__pushEvents = [];
      window.addEventListener("skinlabs:push-received", () => (window as unknown as { __pushEvents: string[] }).__pushEvents.push("seen"));
    });
    await clearNotifications(sw);
    await deliverPush(sw, payload());
    await expect.poll(() => page.evaluate(() => (window as unknown as { __pushEvents: string[] }).__pushEvents.length)).toBe(1);
    expect(await shown(sw)).toHaveLength(0);
  });
});

test.describe("notification click", () => {
  test("focuses the existing window and routes inside it: no second window, no console errors", async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::ERR|googlesyndication|doubleclick|stories fetch failed/.test(m.text()) && errors.push(m.text()));
    await setup(context);
    const sw = await controlled(page, context);
    await page.goto("about:blank"); // app out of view: the push shows a system notification
    await deliverPush(sw, payload());
    await expect.poll(() => shown(sw)).toHaveLength(1);
    await page.goto("/about"); // member comes back to the app, then taps the notification
    const before = context.pages().length;
    await clickFirst(sw);
    await expect(page).toHaveURL(/\/dashboard\?tab=inbox/);
    expect(context.pages().length).toBe(before);
    expect(await shown(sw)).toHaveLength(0); // the tap closed it
    expect(errors).toEqual([]);
  });

  test("a hostile target (//host, backslash, absolute) opens the start page, never another origin", async ({ page, context }) => {
    await setup(context);
    const sw = await controlled(page, context);
    for (const url of ["//evil.example/phish", "/\\evil.example", "https://evil.example/x"]) {
      await page.goto("about:blank");
      await clearNotifications(sw);
      await deliverPush(sw, payload({ url }));
      await expect.poll(() => shown(sw)).toHaveLength(1);
      await page.goto("/about");
      await clickFirst(sw);
      await expect.poll(() => new URL(page.url()).origin).toBe("http://127.0.0.1:4173");
      await expect(page).toHaveURL(/\/start|\/dashboard/); // /start forwards on once the session is known
    }
  });

  test("with no window open, the tap opens one on the target route (clients.openWindow is recorded: headless refuses it without a gesture)", async ({ page, context }) => {
    await setup(context);
    const sw = await controlled(page, context);
    await sw.evaluate(() => {
      const opened: string[] = [];
      (globalThis as unknown as { __opened: string[] }).__opened = opened;
      (self.clients as unknown as { openWindow: (url: string) => Promise<null> }).openWindow = async (url: string) => (opened.push(url), null);
    });
    await page.goto("about:blank");
    await deliverPush(sw, payload({ url: "/podcast" }));
    await expect.poll(() => shown(sw)).toHaveLength(1);
    await clickFirst(sw);
    await expect.poll(() => sw.evaluate(() => (globalThis as unknown as { __opened: string[] }).__opened)).toEqual(["/podcast"]);
    expect(await shown(sw)).toHaveLength(0);
    // And a hostile target never reaches openWindow as anything but the start page.
    await deliverPush(sw, payload({ url: "//evil.example" }));
    await expect.poll(() => shown(sw)).toHaveLength(1);
    await clickFirst(sw);
    await expect.poll(() => sw.evaluate(() => (globalThis as unknown as { __opened: string[] }).__opened)).toEqual(["/podcast", "/start"]);
  });

  test("the tap beacon carries only the delivery id (checked when worker network events are exposed)", async ({ page, context }) => {
    test.skip(!process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS, "Service-worker requests are only visible to Playwright with PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1");
    await setup(context);
    const bodies: string[] = [];
    await context.route(/functions\/v1\/push-track/, async (route) => {
      bodies.push(route.request().postData() ?? "");
      await route.fulfill({ status: 200, body: "" });
    });
    const sw = await controlled(page, context);
    await page.goto("about:blank");
    await deliverPush(sw, payload());
    await expect.poll(() => shown(sw)).toHaveLength(1);
    await page.goto("/about");
    await clickFirst(sw);
    await expect.poll(() => bodies.length).toBe(1);
    expect(JSON.parse(bodies[0])).toEqual({ d: DELIVERY });
  });
});
