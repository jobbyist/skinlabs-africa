import { describe, expect, test } from "bun:test";
import { INSTALL_DISMISS_COOLDOWN_DAYS, INSTALL_MIN_DELAY_MS, INSTALL_MIN_PAGEVIEWS } from "../pwa/constants";
import { resolveInstallExperience, type InstallOfferContext } from "../pwa/install";

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const FIREFOX_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0";
const DAY = 24 * 60 * 60 * 1000;
const now = 1_800_000_000_000;

const ctx = (over: Partial<InstallOfferContext> = {}): InstallOfferContext => ({
  env: { userAgent: ANDROID },
  hasDeferredPrompt: true,
  installedFlag: false,
  dismissedAt: null,
  pageViews: INSTALL_MIN_PAGEVIEWS,
  msSinceLoad: INSTALL_MIN_DELAY_MS,
  pathname: "/reviews/some-serum",
  now,
  ...over,
});

describe("resolveInstallExperience", () => {
  test("Android/Chromium with a captured prompt → native dialog", () => {
    expect(resolveInstallExperience(ctx())).toBe("native");
  });
  test("iOS Safari with no install API → the Add to Home Screen steps", () => {
    expect(resolveInstallExperience(ctx({ env: { userAgent: IPHONE }, hasDeferredPrompt: false }))).toBe("ios");
  });
  test("a browser with no install flow (e.g. desktop Firefox) never gets a prompt", () => {
    expect(resolveInstallExperience(ctx({ env: { userAgent: FIREFOX_DESKTOP }, hasDeferredPrompt: false }))).toBeNull();
  });
  test("never inside the installed app, after an install, or in an embedded webview", () => {
    expect(resolveInstallExperience(ctx({ env: { userAgent: ANDROID, displayModeStandalone: true } }))).toBeNull();
    expect(resolveInstallExperience(ctx({ env: { userAgent: IPHONE, navigatorStandalone: true }, hasDeferredPrompt: false }))).toBeNull();
    expect(resolveInstallExperience(ctx({ installedFlag: true }))).toBeNull();
    expect(resolveInstallExperience(ctx({ env: { userAgent: "Mozilla/5.0 (iPhone) Instagram 330.0" }, hasDeferredPrompt: false }))).toBeNull();
  });
  test("waits for engagement: enough pages and enough time", () => {
    expect(resolveInstallExperience(ctx({ pageViews: INSTALL_MIN_PAGEVIEWS - 1 }))).toBeNull();
    expect(resolveInstallExperience(ctx({ msSinceLoad: INSTALL_MIN_DELAY_MS - 1 }))).toBeNull();
  });
  test("a dismissal keeps it away for the cooldown, then it may return", () => {
    expect(resolveInstallExperience(ctx({ dismissedAt: now - (INSTALL_DISMISS_COOLDOWN_DAYS - 1) * DAY }))).toBeNull();
    expect(resolveInstallExperience(ctx({ dismissedAt: now - (INSTALL_DISMISS_COOLDOWN_DAYS + 1) * DAY }))).toBe("native");
  });
  test("never interrupts pricing, onboarding, SKYNN AI, admin or the start page", () => {
    for (const pathname of ["/pricing", "/welcome", "/skynn-ai", "/skynn-ai/advanced", "/admin", "/start", "/reset-password"]) {
      expect(resolveInstallExperience(ctx({ pathname }))).toBeNull();
    }
    expect(resolveInstallExperience(ctx({ pathname: "/pricing-guide" }))).toBe("native");
  });
  test("an explicit 'Install app' button skips timing, cooldown and route rules but not capability", () => {
    expect(resolveInstallExperience(ctx({ explicit: true, pageViews: 0, msSinceLoad: 0, dismissedAt: now, pathname: "/pricing" }))).toBe("native");
    expect(resolveInstallExperience(ctx({ explicit: true, env: { userAgent: FIREFOX_DESKTOP }, hasDeferredPrompt: false }))).toBeNull();
    expect(resolveInstallExperience(ctx({ explicit: true, installedFlag: true }))).toBeNull();
  });
});
