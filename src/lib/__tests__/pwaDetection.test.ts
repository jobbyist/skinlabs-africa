import { describe, expect, test } from "bun:test";
import {
  canShowIosInstructions,
  detectBrowser,
  detectDeviceType,
  detectPlatform,
  detectPushSupport,
  getIosVersion,
  isAutomation,
  isInAppBrowser,
  isStandaloneMode,
  type CapabilityProbe,
  type DetectionEnv,
} from "../pwa/detection";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1",
  iphoneOld: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
  ipadOsDesktopUa: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  androidTabletChrome: "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0",
  samsung: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
  desktopChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  desktopEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  instagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0",
  tiktokAndroid: "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 TikTok/32.0",
};
const env = (userAgent: string, rest: Partial<DetectionEnv> = {}): DetectionEnv => ({ userAgent, ...rest });
const caps = (over: Partial<CapabilityProbe> = {}): CapabilityProbe => ({
  hasServiceWorker: true,
  hasNotification: true,
  hasPushManager: true,
  hasSyncManager: false,
  hasMediaSession: true,
  hasShare: true,
  hasBadge: false,
  hasCacheStorage: true,
  hasIndexedDb: true,
  hasStorageEstimate: true,
  ...over,
});

describe("platform + browser detection", () => {
  test("iPhone, iPad (incl. iPadOS posing as a Mac), Android and desktop", () => {
    expect(detectPlatform(env(UA.iphoneSafari))).toBe("ios");
    expect(detectPlatform(env(UA.ipadOsDesktopUa, { platform: "MacIntel", maxTouchPoints: 5 }))).toBe("ipados");
    expect(detectPlatform(env(UA.macSafari, { platform: "MacIntel", maxTouchPoints: 0 }))).toBe("macos");
    expect(detectPlatform(env(UA.androidChrome))).toBe("android");
    expect(detectPlatform(env(UA.desktopChrome))).toBe("windows");
  });
  test("browsers", () => {
    expect(detectBrowser(env(UA.iphoneSafari))).toBe("safari");
    expect(detectBrowser(env(UA.iphoneChrome))).toBe("chrome");
    expect(detectBrowser(env(UA.androidChrome))).toBe("chrome");
    expect(detectBrowser(env(UA.androidFirefox))).toBe("firefox");
    expect(detectBrowser(env(UA.samsung))).toBe("samsung");
    expect(detectBrowser(env(UA.desktopEdge))).toBe("edge");
    expect(detectBrowser(env(UA.macSafari))).toBe("safari");
  });
  test("device type: phone / tablet / desktop", () => {
    expect(detectDeviceType(env(UA.iphoneSafari))).toBe("phone");
    expect(detectDeviceType(env(UA.ipadOsDesktopUa, { platform: "MacIntel", maxTouchPoints: 5 }))).toBe("tablet");
    expect(detectDeviceType(env(UA.androidChrome))).toBe("phone");
    expect(detectDeviceType(env(UA.androidTabletChrome))).toBe("tablet");
    expect(detectDeviceType(env(UA.desktopChrome))).toBe("desktop");
    expect(detectDeviceType(env(""))).toBe("unknown");
  });
  test("in-app browsers are recognised", () => {
    expect(isInAppBrowser(UA.instagram)).toBe(true);
    expect(isInAppBrowser(UA.tiktokAndroid)).toBe(true);
    expect(isInAppBrowser(UA.androidChrome)).toBe(false);
    expect(isInAppBrowser(UA.iphoneSafari)).toBe(false);
  });
});

describe("standalone detection", () => {
  test("display-mode, iOS navigator.standalone and android-app referrers all count", () => {
    expect(isStandaloneMode(env(UA.androidChrome, { displayModeStandalone: true }))).toBe(true);
    expect(isStandaloneMode(env(UA.iphoneSafari, { navigatorStandalone: true }))).toBe(true);
    expect(isStandaloneMode(env(UA.androidChrome, { referrer: "android-app://za.co.skinlabs" }))).toBe(true);
  });
  test("a normal tab is not standalone, and navigator.standalone=false is not", () => {
    expect(isStandaloneMode(env(UA.iphoneSafari, { navigatorStandalone: false }))).toBe(false);
    expect(isStandaloneMode(env(UA.desktopChrome))).toBe(false);
  });
});

describe("iOS install instructions", () => {
  test("only iOS/iPadOS Safari, not installed, not an embedded webview", () => {
    expect(canShowIosInstructions(env(UA.iphoneSafari))).toBe(true);
    expect(canShowIosInstructions(env(UA.ipadOsDesktopUa, { platform: "MacIntel", maxTouchPoints: 5 }))).toBe(true);
    expect(canShowIosInstructions(env(UA.iphoneSafari, { navigatorStandalone: true }))).toBe(false);
    expect(canShowIosInstructions(env(UA.instagram))).toBe(false);
    expect(canShowIosInstructions(env(UA.iphoneChrome))).toBe(false);
    expect(canShowIosInstructions(env(UA.androidChrome))).toBe(false);
    expect(canShowIosInstructions(env(UA.macSafari, { platform: "MacIntel", maxTouchPoints: 0 }))).toBe(false);
  });
  test("iOS version parsing", () => {
    expect(getIosVersion(UA.iphoneSafari)).toBeCloseTo(17.04);
    expect(getIosVersion(UA.androidChrome)).toBeNull();
  });
});

describe("push support", () => {
  test("Android/desktop Chromium: supported when the APIs exist", () => {
    expect(detectPushSupport(env(UA.androidChrome), caps())).toEqual({ supported: true, requiresInstall: false });
    expect(detectPushSupport(env(UA.desktopChrome), caps({ hasPushManager: false }))).toEqual({ supported: false, requiresInstall: false });
  });
  test("iOS 16.4+: only inside the installed app; in Safari it 'requires install'", () => {
    expect(detectPushSupport(env(UA.iphoneSafari), caps({ hasPushManager: false }))).toEqual({ supported: false, requiresInstall: true });
    expect(detectPushSupport(env(UA.iphoneSafari, { navigatorStandalone: true }), caps())).toEqual({ supported: true, requiresInstall: false });
  });
  test("old iOS can never push; in-app browsers can't install", () => {
    expect(detectPushSupport(env(UA.iphoneOld, { navigatorStandalone: true }), caps())).toEqual({ supported: false, requiresInstall: false });
    expect(detectPushSupport(env(UA.instagram), caps({ hasPushManager: false }))).toEqual({ supported: false, requiresInstall: false });
  });
});

describe("automation", () => {
  test("crawlers, headless and webdriver never get PWA chrome", () => {
    expect(isAutomation("Mozilla/5.0 HeadlessChrome/124", false)).toBe(true);
    expect(isAutomation("Googlebot/2.1", false)).toBe(true);
    expect(isAutomation(UA.desktopChrome, true)).toBe(true);
    expect(isAutomation(UA.desktopChrome, false)).toBe(false);
  });
});
