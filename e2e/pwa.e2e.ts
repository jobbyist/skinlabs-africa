import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";
import { publishedPodcastEpisodes } from "../src/data/podcast";

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
  await mockSupabase(context, supabase);
  // Registered after the mock, so it wins over its "abort all third parties" rule.
  await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await asRealBrowser(context, browser);
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
    const shell = caches["skinlabs-shell-v1"] ?? [];
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
    // Push isn't configured in this build (no VAPID key): the card says so rather than faking a toggle.
    await expect(page.getByText(/aren’t switched on|can’t receive push|install SkinLabs® to your Home Screen/)).toBeVisible();
  });
});
