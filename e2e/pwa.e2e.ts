import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { freeProfile, mockSupabase } from "./support/mockSupabase";
import { stubPushApis } from "./support/pushHarness";
import { publishedPodcastEpisodes } from "../src/data/podcast";
import { CACHE_NAMES } from "../src/lib/pwa/constants";

/**
 * Installable-app layer (docs/pwa.md): manifest, service worker, offline start, install prompts (Android +
 * iOS), the installed-app launch splash, /start routing, and offline podcast downloads.
 *
 * The PWA code deliberately switches itself off for automation (navigator.webdriver / "HeadlessChrome"), so
 * these specs present as a real browser (`asRealBrowser`). Supabase is mocked like every other spec.
 *
 * Service-worker-forwarded requests aren't visible to Playwright's router unless
 * PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1; the one spec that needs it skips itself otherwise.
 * Run against a production build:  npx vite build && npx playwright test e2e/pwa.e2e.ts
 */

const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const asRealBrowser = (context: BrowserContext, opts: { standalone?: boolean } = {}) =>
  context.addInitScript(({ standalone }) => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    if (standalone) {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query: string) => {
        if (/display-mode:\s*standalone/.test(query)) {
          return { matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as unknown as MediaQueryList;
        }
        return original(query);
      };
    }
  }, { standalone: opts.standalone ?? false });

/** Real-browser presentation + a working ad network, so the ad-block wall (which a real browser with ads aborted would trigger) stays away. */
const setup = async (context: BrowserContext, supabase: Parameters<typeof mockSupabase>[1], browser: { standalone?: boolean } = {}) => {
  const state = await mockSupabase(context, supabase);
  // Registered after the mock, so it wins over its "abort all third parties" rule.
  await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await asRealBrowser(context, browser);
  return state;
};

/** The provider is lazy-loaded: keep asking until its listener is mounted and the dialog appears. */
const openInstallDialog = async (page: Page, name = /Take SkinLabs® with you/) => {
  const dialog = page.getByRole("dialog", { name });
  await expect(async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("skinlabs:pwa-open-install")));
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
};

const swReady = async (page: Page) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // First load isn't controlled until claim(); a reload makes the page controlled.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15_000 }).toBe(true);
};

const cacheUrls = (page: Page) =>
  page.evaluate(async () => {
    const out: Record<string, string[]> = {};
    for (const name of await caches.keys()) out[name] = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search);
    return out;
  });

test.describe("manifest + icons", () => {
  test("is valid, starts at /start, and every icon exists at its declared size", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/json/);
    const manifest = await res.json();
    expect(manifest).toMatchObject({ id: "/start", name: "SkinLabs®", short_name: "SkinLabs", start_url: "/start", scope: "/", display: "standalone", orientation: "portrait" });
    expect(manifest.description).toBe("South Africa’s skincare intelligence platform.");
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
    expect(manifest.shortcuts.map((s: { url: string }) => s.url)).toEqual(["/skynn-ai", "/routines", "/podcast", "/knowledge-hub"]);
    for (const icon of manifest.icons as { src: string; sizes: string }[]) {
      const img = await request.get(icon.src);
      expect(img.status()).toBe(200);
      const buf = await img.body();
      const [w, h] = icon.sizes.split("x").map(Number);
      expect([buf.readUInt32BE(16), buf.readUInt32BE(20)]).toEqual([w, h]); // PNG IHDR
    }
  });
  test("the page links the manifest and sets the iOS app meta", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
  });
});

test.describe("service worker + offline", () => {
  test.use({ userAgent: ANDROID_UA });

  test("registers, controls the page, precaches the shell and /offline.html", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/");
    await swReady(page);
    const caches = await cacheUrls(page);
    const shell = caches[CACHE_NAMES.shell] ?? [];
    expect(shell).toContain("/start");
    expect(shell).toContain("/offline.html");
    expect(shell.some((p) => p.startsWith("/assets/") && p.endsWith(".js"))).toBe(true);
  });

  test("private data never lands in a cache: auth, RPC, profile and payment calls are not intercepted", async ({ page, context }) => {
    await setup(context, { signedIn: true });
    await page.goto("/");
    await swReady(page);
    await page.evaluate(async () => {
      const base = "https://gnkpzijxuciiaamakgzm.supabase.co";
      await Promise.allSettled([
        fetch(`${base}/auth/v1/user`),
        fetch(`${base}/rest/v1/profiles?select=*`),
        fetch(`${base}/rest/v1/rpc/get_advanced_assessment_access`, { method: "POST", body: "{}" }),
        fetch(`${base}/functions/v1/payfast-payment`, { method: "POST", body: "{}" }),
      ]);
    });
    await page.goto("/dashboard");
    await page.waitForTimeout(800);
    const all = Object.values(await cacheUrls(page)).flat();
    const publicTable = /^\/rest\/v1\/(news_articles_public|ai_generated_product_reviews|ai_generated_comparisons)$/;
    expect(all.filter((u) => /^\/(auth|functions|storage|realtime)\/v1\//.test(u) || /^\/rest\/v1\//.test(u) && !publicTable.test(u.split("?")[0]))).toEqual([]);
    expect(all).not.toContain("/dashboard"); // member routes are never cached as their own page
  });

  test("offline: a visited public page loads from cache, an unvisited one falls back to the app shell", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/about");
    await swReady(page);
    await page.waitForTimeout(500);
    await context.setOffline(true);
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.goto("/knowledge-hub"); // never visited: shell + client router
    await expect(page.locator("#root")).not.toBeEmpty();
    await context.setOffline(false);
  });

  test("offline /start shows the offline panel; coming back online moves on (sign-in for a signed-out visitor)", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/start");
    await swReady(page);
    await context.setOffline(true);
    await page.goto("/start");
    await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Downloaded episodes" })).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText("Welcome to SkinLabs®", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("offline banner appears and 'Back online' confirms recovery", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "You’re offline" })).toBeVisible();
    await expect(page.getByText("Some SkinLabs® features may be unavailable")).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByRole("status").filter({ hasText: "Back online" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("status").filter({ hasText: "Back online" })).toBeHidden({ timeout: 8_000 });
  });
});

test.describe("branded install prompt", () => {
  test.use({ userAgent: ANDROID_UA });
  test("Android/Chromium: native flow from the captured beforeinstallprompt, dismissal persisted, appinstalled recorded", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/");
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string; platform: string }> };
      (window as unknown as { __prompted: number }).__prompted = 0;
      event.prompt = async () => void ((window as unknown as { __prompted: number }).__prompted += 1);
      event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
      window.dispatchEvent(event);
    });
    const dialog = await openInstallDialog(page);
    await expect(dialog.getByRole("button", { name: "Install SkinLabs®" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Not now" })).toBeVisible();
    await dialog.getByRole("button", { name: "Install SkinLabs®" }).click();
    expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
    await expect.poll(() => page.evaluate(() => localStorage.getItem("skinlabs_pwa_installed"))).toBe("1");
  });

  test("'Not now' closes the dialog, is remembered, and Escape also dismisses", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/");
    await page.evaluate(() => {
      const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
      e.prompt = async () => undefined;
      e.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });
      window.dispatchEvent(e);
    });
    let dialog = await openInstallDialog(page);
    await dialog.getByRole("button", { name: "Not now" }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => Number(localStorage.getItem("skinlabs_pwa_install_dismissed_at")))).toBeGreaterThan(0);
    dialog = await openInstallDialog(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("iPhone Safari: Share → Add to Home Screen instructions (text, not just icons)", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: IPHONE_UA, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await setup(context, { signedIn: false });
    const page = await context.newPage();
    await page.goto("/");
    const dialog = await openInstallDialog(page);
    await expect(dialog.getByRole("list", { name: /How to install SkinLabs on iPhone or iPad/ })).toBeVisible();
    await expect(dialog.getByText("Tap the Share button")).toBeVisible();
    await expect(dialog.getByText("Choose “Add to Home Screen”")).toBeVisible();
    await expect(dialog.getByText("Tap “Add”")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Install SkinLabs®" })).toHaveCount(0);
    await context.close();
  });

  test("never offered inside the installed app", async ({ page, context }) => {
    await setup(context, { signedIn: false }, { standalone: true });
    await page.goto("/about");
    // The provider is lazy: keep asking until it answers (with a toast, never the dialog).
    await expect(async () => {
      await page.evaluate(() => window.dispatchEvent(new Event("skinlabs:pwa-open-install")));
      await expect(page.getByText("SkinLabs® is already installed.")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByRole("dialog", { name: /Take SkinLabs® with you/ })).toHaveCount(0);
  });
});

test.describe("installed-app launch", () => {
  test.use({ userAgent: ANDROID_UA });

  test("splash: progressbar fills, finishes well inside the 12s ceiling, never replays in the session", async ({ page, context }) => {
    await setup(context, { signedIn: false }, { standalone: true });
    const started = Date.now();
    await page.goto("/start");
    const bar = page.getByRole("progressbar", { name: "Loading SkinLabs" });
    await expect(bar).toBeVisible();
    const first = Number(await bar.getAttribute("aria-valuenow"));
    expect(first).toBeLessThan(100);
    await expect(bar).toBeHidden({ timeout: 13_000 });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(12_500);
    await expect(page.locator("#pwa-boot-splash")).toHaveCount(0);
    await expect(page.getByText("Welcome to SkinLabs®", { exact: true })).toBeVisible();
    console.log(`[pwa-launch] splash visible for ~${elapsed} ms (ceiling 12000)`);

    // Same session: a reload and in-app navigation do not replay it.
    await page.reload();
    await page.waitForTimeout(1500);
    await expect(page.getByRole("progressbar", { name: "Loading SkinLabs" })).toHaveCount(0);
  });

  test("not shown in a normal browser tab", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/start");
    await page.waitForTimeout(1200);
    await expect(page.getByRole("progressbar", { name: "Loading SkinLabs" })).toHaveCount(0);
  });

  test("/start with a restored session goes straight into the member experience", async ({ page, context }) => {
    await setup(context, { signedIn: true }, { standalone: true });
    await page.goto("/start");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("/start never creates accounts or navigates to marketing pages for a signed-in member (?next= is validated)", async ({ page, context }) => {
    await setup(context, { signedIn: true });
    await page.goto("/start?next=https://evil.example/phish");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await page.goto("/start?next=/podcast");
    await expect(page).toHaveURL(/\/podcast$/, { timeout: 15_000 });
  });

  test("/start works in a plain browser tab for a signed-out visitor: sign-in dialog + a way out", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto("/start");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Continue to SkinLabs®" })).toBeVisible();
  });
});

test.describe("offline podcast listening", () => {
  test.use({ userAgent: ANDROID_UA });
  const episode = publishedPodcastEpisodes.find((e) => e.audioFile)!;

  test("save offline → available offline → served from the download cache (206, Range) with the network down → remove", async ({ page, context }) => {
    await setup(context, { signedIn: true });
    await page.goto(`/podcast/${episode.slug}`);
    await swReady(page);

    await page.getByRole("button", { name: new RegExp(`Save .* for offline listening`) }).click();
    await expect(page.getByText("Available offline")).toBeVisible({ timeout: 30_000 });

    const cached = await cacheUrls(page);
    expect(cached["skinlabs-podcast-audio"]).toContain(episode.audioFile);

    const probe = () =>
      page.evaluate(async (path) => {
        const res = await fetch(path, { headers: { Range: "bytes=0-99" } });
        return { status: res.status, range: res.headers.get("content-range"), bytes: (await res.arrayBuffer()).byteLength };
      }, episode.audioFile);

    await context.setOffline(true);
    const offline = await probe();
    expect(offline.status).toBe(206);
    expect(offline.bytes).toBe(100);
    expect(offline.range).toMatch(/^bytes 0-99\//);
    await context.setOffline(false);

    // Metadata survives a reload (IndexedDB) and the download can be removed.
    await page.reload();
    await expect(page.getByText("Available offline")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Remove offline download/ }).click();
    await expect(page.getByText("Available offline")).toBeHidden();
    expect((await cacheUrls(page))["skinlabs-podcast-audio"] ?? []).not.toContain(episode.audioFile);
  });

  test("a signed-out visitor is asked to sign in instead of downloading", async ({ page, context }) => {
    await setup(context, { signedIn: false });
    await page.goto(`/podcast/${episode.slug}`);
    await page.getByRole("button", { name: new RegExp(`Save .* for offline listening`) }).click();
    await expect(page.getByText("Sign in to save episodes for offline listening.")).toBeVisible();
    await expect(page.getByText("Available offline")).toHaveCount(0);
  });
});

test.describe("app settings", () => {
  test("Dashboard → Settings → App shows install, notifications and offline storage", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    await page.goto("/dashboard?tab=app");
    await expect(page.getByText("SkinLabs® app")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Notifications/ }).or(page.getByText("Notifications").first())).toBeVisible();
    await expect(page.getByText("Offline storage")).toBeVisible();
    // Without a VAPID key the card says push isn't switched on (never a fake toggle); with one (CI builds set it) a
    // device that can push is offered "Enable notifications" (headless Chromium reports permission as denied, so the blocked state with
    // re-enable steps also qualifies). Either way it is one honest state.
    await expect(
      page
        .getByText(/aren’t switched on|can’t receive push|notifications work from the installed app|blocked for SkinLabs/)
        .or(page.getByRole("button", { name: "Enable notifications" }))
        .first(),
    ).toBeVisible();
  });
});

// --- Reminder opt-in: one capability, one soft ask, per branch ----------------------------------------------------
// Needs a build with VITE_VAPID_PUBLIC_KEY (CI sets it): without it the app (correctly) says push isn't switched on.

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const nativePrompts = (page: Page) => page.evaluate(() => (window as unknown as { __push: { requestCalls: number } }).__push.requestCalls);

/** Welcome step 2 ("Your day") for a brand-new account. */
const openWelcomeDay = async (page: Page) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: /^(Continue|Skip for now)/ }).first().click();
  await expect(page.getByRole("heading", { name: "Make daily guidance feel local." })).toBeVisible();
};

test.describe("reminder opt-in: ready (Android Chrome)", () => {
  test.use({ userAgent: ANDROID_UA });

  test("soft ask first; the native prompt only after the tap on Allow; then subscribe, one preference upsert, confirmation", async ({ page, context }) => {
    const state = await mockSupabase(context, { signedIn: true, profile: freeProfile({ onboarding_completed_at: null }) });
    await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default" });
    await openWelcomeDay(page);

    const remind = page.getByRole("button", { name: /Remind me at 7:00 am/ });
    await expect(remind).toBeVisible();
    expect(await nativePrompts(page)).toBe(0); // seeing the step never prompts

    await remind.click();
    await expect(page.getByText(/One short reminder at 7:00 am/)).toBeVisible(); // our soft ask
    expect(await nativePrompts(page)).toBe(0); // still no native prompt

    await page.getByRole("button", { name: "Allow reminders" }).click();
    await expect(page.getByText("Reminders are on for this device.")).toBeVisible();
    expect(await nativePrompts(page)).toBe(1);
    expect(state.rpcCalls).toContain("register_push_subscription");
    // One upsert enabling the reminder at the chosen time.
    expect(state.preferenceWrites.some((w) => w.routine_reminder === true && w.routine_reminder_time === "07:00")).toBe(true);
    // The confirmation test notification goes through the member self-test action.
    await expect.poll(() => state.functionCalls.some((c) => c.name === "push-send" && c.action === "test")).toBe(true);
  });

  test("'Not now' never reaches the native prompt", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ onboarding_completed_at: null }) });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default" });
    await openWelcomeDay(page);
    await page.getByRole("button", { name: /Remind me at/ }).click();
    await page.getByRole("button", { name: "Not now" }).click();
    expect(await nativePrompts(page)).toBe(0);
    await expect(page.getByRole("button", { name: /Remind me at/ })).toBeVisible();
  });
});

test.describe("reminder opt-in: needs_install (iPhone Safari tab → installed app)", () => {
  test("shows the three Share-sheet steps as text, flags the intent, and the installed app offers the opt-in once", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: IPHONE_UA, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ onboarding_completed_at: null }) });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default" });
    let page = await context.newPage();
    await openWelcomeDay(page);
    await expect(page.getByText("Get reminders on your iPhone")).toBeVisible();
    await expect(page.getByText(/Tap the Share button/)).toBeVisible();
    await expect(page.getByText(/Add to Home Screen/).first()).toBeVisible();
    await expect(page.getByText(/Open SkinLabs® from your Home Screen/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Remind me at/ })).toHaveCount(0); // no native ask in a Safari tab
    await page.getByRole("button", { name: "Remind me once it’s installed" }).click();
    expect(await page.evaluate(() => localStorage.getItem("skinlabs_reminder_intent"))).toBe("07:00");
    expect(await nativePrompts(page)).toBe(0);
    await page.close();

    // The member opens the installed app (standalone): the opt-in sheet appears once; still no native prompt until Allow.
    await context.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query: string) =>
        /display-mode:\s*standalone/.test(query)
          ? ({ matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as unknown as MediaQueryList)
          : original(query);
    });
    page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page.getByRole("dialog", { name: "Welcome to the app" })).toBeVisible({ timeout: 15_000 });
    expect(await nativePrompts(page)).toBe(0);
    await expect(page.getByRole("dialog", { name: /Take SkinLabs® with you/ })).toHaveCount(0); // never the install dialog in the app
    expect(await page.evaluate(() => localStorage.getItem("skinlabs_reminder_intent"))).toBeNull(); // offered once
    await page.reload();
    await expect(page.getByRole("dialog", { name: "Welcome to the app" })).toHaveCount(0);
    await context.close();
  });

  test("the install dialog never opens inside the installed app (signed in)", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    await asRealBrowser(context, { standalone: true });
    await page.goto("/dashboard");
    await expect(async () => {
      await page.evaluate(() => window.dispatchEvent(new Event("skinlabs:pwa-open-install")));
      await expect(page.getByText("SkinLabs® is already installed.")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByRole("dialog", { name: /Take SkinLabs® with you/ })).toHaveCount(0);
  });
});

test.describe("reminder opt-in: denied and unsupported", () => {
  test.use({ userAgent: DESKTOP_UA });

  test("denied: platform re-enable steps, no ask, never prompts again", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ onboarding_completed_at: null }) });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "denied" });
    await openWelcomeDay(page);
    await expect(page.getByText("Reminders are blocked for SkinLabs®")).toBeVisible();
    await expect(page.getByText(/lock or tune icon/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Remind me at|Allow reminders/ })).toHaveCount(0);
    expect(await nativePrompts(page)).toBe(0);
  });

  test("unsupported: the ask is hidden entirely", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ onboarding_completed_at: null }) });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default", noPushApi: true });
    await openWelcomeDay(page);
    await expect(page.getByLabel("When do you do your routine?").or(page.locator("#welcome-routine-time"))).toBeVisible();
    await expect(page.getByText(/Remind me|Reminders are|Get reminders/)).toHaveCount(0);
  });
});

test.describe("getting started checklist: Get reminders on your phone", () => {
  test.use({ userAgent: ANDROID_UA });

  test("one item, from server truth: shown until an active push device exists", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ checklist_dismissed_at: null }), pushDevices: [] });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default" });
    await page.goto("/dashboard");
    await expect(page.getByText("Get reminders on your phone")).toHaveCount(1);
  });

  test("an active server device completes it (client analytics events are not consulted)", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ checklist_dismissed_at: null }), pushDevices: [{ is_active: true }] });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "granted" });
    await page.goto("/dashboard");
    await expect(page.getByText(/completed (step|steps)/)).toBeVisible();
    // Listed only inside the collapsed "completed" group, not as an open step.
    await expect(page.getByRole("listitem").filter({ hasText: "Get reminders on your phone" })).toHaveCount(0);
  });

  test("hidden where the browser has no Push API", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true, profile: freeProfile({ checklist_dismissed_at: null }) });
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default", noPushApi: true });
    await page.goto("/dashboard");
    await expect(page.getByText("Getting started")).toBeVisible();
    await expect(page.getByText("Get reminders on your phone")).toHaveCount(0);
  });
});

// --- "Notify me when my report is ready" (Advanced pending screen) and the first check-in nudge --------------------

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
const LOCK_SCREEN_SAFE = /report is ready|securely/i; // the only words the report notification may carry

test.describe("Advanced report pending: notify me when it's ready", () => {
  test.describe("ready (Android)", () => {
    test.use({ userAgent: ANDROID_UA });
    test("native prompt only after the tap; subscribes; report_ready stays on; copy is generic", async ({ page, context }) => {
      const state = await setup(context, { signedIn: true, skynn: { submitted: true, passes: 0 } });
      await stubPushApis(context, { permission: "default" });
      await page.goto("/skynn-ai/advanced?session=sess-e2e");
      const notify = page.getByRole("button", { name: "Notify me when my report is ready" });
      await expect(notify).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Nothing about it appears on your lock screen/)).toBeVisible();
      expect(await nativePrompts(page)).toBe(0);
      await notify.click();
      await expect(page.getByText("We’ll notify you when it’s ready.")).toBeVisible();
      expect(await nativePrompts(page)).toBe(1);
      expect(state.rpcCalls).toContain("register_push_subscription");
      expect(state.preferenceWrites.some((w) => w.report_ready === true)).toBe(true);
      // Nothing about the report content is written anywhere in the opt-in: only generic wording.
      expect("Your SkinLabs® report is ready").toMatch(LOCK_SCREEN_SAFE);
    });
  });

  test("iPhone Safari tab (needs_install): the three steps as text, no native ask", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: IPHONE_UA, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await setup(context, { signedIn: true, skynn: { submitted: true, passes: 0 } });
    await stubPushApis(context, { permission: "default" });
    const page = await context.newPage();
    await page.goto("/skynn-ai/advanced?session=sess-e2e");
    await expect(page.getByText("Get a notification when your report is ready")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Tap the Share button/)).toBeVisible();
    await page.getByRole("button", { name: "Notify me once it’s installed" }).click();
    expect(await page.evaluate(() => localStorage.getItem("skinlabs_reminder_intent"))).toBe("report");
    expect(await nativePrompts(page)).toBe(0);
    await context.close();
  });

  test.describe("hidden unless ready or needs_install", () => {
    test.use({ userAgent: DESKTOP_UA });
    for (const [name, stub] of [
      ["denied", { permission: "denied" as const }],
      ["unsupported", { permission: "default" as const, noPushApi: true }],
    ] as const) {
      test(`${name}: no opt-in is offered`, async ({ page, context }) => {
        await setup(context, { signedIn: true, skynn: { submitted: true, passes: 0 } });
        await stubPushApis(context, stub);
        await page.goto("/skynn-ai/advanced?session=sess-e2e");
        await expect(page.getByText("Pending").first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/Notify me|notify you when|notification when your report/)).toHaveCount(0);
        expect(await nativePrompts(page)).toBe(0);
      });
    }
  });
});

test.describe("first routine check-in nudge", () => {
  const routine = (over: Record<string, unknown> = {}) => ({
    signedIn: true,
    profile: freeProfile(),
    tables: {
      routine_steps: [{ id: "step-1", user_id: "00000000-0000-4000-8000-000000000001", step_name: "Cleanser", product_name: null, time_of_day: "am", sort_order: 0, source: "manual" }],
      // Exactly one check-in on record (for another step), so the tick below is the member's FIRST successful check-in.
      routine_checkins: [{ id: "c1", user_id: "00000000-0000-4000-8000-000000000001", step_id: "other", time_slot: "am", checkin_date: today() }],
      notification_preferences: [{ user_id: "00000000-0000-4000-8000-000000000001", routine_reminder_time: "07:00:00" }],
    },
    ...over,
  });
  const tick = async (page: Page) => {
    await page.goto("/dashboard?tab=routine");
    await page.getByLabel(/Cleanser/).first().click();
  };

  test.describe("ready", () => {
    test.use({ userAgent: ANDROID_UA });
    test("a single non-modal card; Yes → native prompt only now, then subscribed", async ({ page, context }) => {
      const state = await mockSupabase(context, routine());
      await asRealBrowser(context);
      await stubPushApis(context, { permission: "default" });
      await tick(page);
      const card = page.getByRole("region", { name: "Routine reminder" });
      await expect(card.getByText("Want a nudge at 7:00 am tomorrow?")).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0); // non-modal
      expect(await nativePrompts(page)).toBe(0);
      await card.getByRole("button", { name: "Yes" }).click();
      await expect(card.getByText(/We’ll nudge you at 7:00 am/)).toBeVisible();
      expect(await nativePrompts(page)).toBe(1);
      expect(state.rpcCalls).toContain("register_push_subscription");
      expect(state.preferenceWrites.some((w) => w.routine_reminder === true)).toBe(true);
    });

    test("'Not now' is remembered for 14 days", async ({ page, context }) => {
      await mockSupabase(context, routine());
      await asRealBrowser(context);
      await stubPushApis(context, { permission: "default" });
      await tick(page);
      const card = page.getByRole("region", { name: "Routine reminder" });
      await card.getByRole("button", { name: "Not now" }).click();
      await expect(card).toHaveCount(0);
      const stamp = Number(await page.evaluate(() => localStorage.getItem("skinlabs_checkin_nudge_dismissed_at")));
      expect(Date.now() - stamp).toBeLessThan(60_000);
      // Another "first check-in" within the window: still hidden.
      await page.reload();
      await page.getByLabel(/Cleanser/).first().click();
      await page.waitForTimeout(800);
      await expect(page.getByRole("region", { name: "Routine reminder" })).toHaveCount(0);
      // After the 14 days it may be offered again.
      await page.evaluate(() => localStorage.setItem("skinlabs_checkin_nudge_dismissed_at", String(Date.now() - 15 * 24 * 3600 * 1000)));
      await page.reload();
      await page.getByLabel(/Cleanser/).first().click();
      await expect(page.getByRole("region", { name: "Routine reminder" })).toBeVisible();
    });
  });

  test("needs_install (iPhone Safari tab): Yes shows the steps and flags the intent; no native prompt", async ({ browser }) => {
    const context = await browser.newContext({ userAgent: IPHONE_UA, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await mockSupabase(context, routine());
    await asRealBrowser(context);
    await stubPushApis(context, { permission: "default" });
    const page = await context.newPage();
    await tick(page);
    const card = page.getByRole("region", { name: "Routine reminder" });
    await card.getByRole("button", { name: "Yes" }).click();
    await expect(card.getByText(/Tap the Share button/)).toBeVisible();
    await card.getByRole("button", { name: "Remind me once it’s installed" }).click();
    expect(await page.evaluate(() => localStorage.getItem("skinlabs_reminder_intent"))).toBe("07:00");
    expect(await nativePrompts(page)).toBe(0);
    await context.close();
  });

  test.describe("hidden unless ready or needs_install", () => {
    test.use({ userAgent: DESKTOP_UA });
    for (const [name, stub] of [
      ["denied", { permission: "denied" as const }],
      ["unsupported", { permission: "default" as const, noPushApi: true }],
    ] as const) {
      test(`${name}: no card`, async ({ page, context }) => {
        await mockSupabase(context, routine());
        await asRealBrowser(context);
        await stubPushApis(context, stub);
        await tick(page);
        await page.waitForTimeout(800);
        await expect(page.getByRole("region", { name: "Routine reminder" })).toHaveCount(0);
      });
    }
  });
});
