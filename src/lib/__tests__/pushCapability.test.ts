import { describe, expect, test } from "bun:test";
import type { CapabilityProbe, DetectionEnv } from "../pwa/detection";
import { canAskForPermission, reenableInstructions, resolvePushCapability, type BrowserPermission, type PushInputs } from "../pwa/pushCapability";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneOld: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
  ipadSafari: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  instagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  desktopChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  desktopFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
};
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
const input = (ua: string, over: Partial<PushInputs> & { env?: Partial<DetectionEnv>; caps?: Partial<CapabilityProbe> } = {}): PushInputs => ({
  env: { userAgent: ua, ...over.env },
  caps: caps(over.caps),
  permission: over.permission ?? "default",
  hasBrowserSubscription: over.hasBrowserSubscription ?? false,
  serverDeviceActive: over.serverDeviceActive ?? false,
});
const resolve = (ua: string, over: Parameters<typeof input>[1] = {}) => resolvePushCapability(input(ua, over));

describe("push capability matrix", () => {
  test("iOS Safari TAB: needs_install, whatever the permission or the (missing) PushManager", () => {
    expect(resolve(UA.iphoneSafari, { caps: { hasPushManager: false } })).toBe("needs_install");
    expect(resolve(UA.ipadSafari, { caps: { hasPushManager: false } })).toBe("needs_install");
    expect(resolve(UA.iphoneSafari, { permission: "denied", caps: { hasPushManager: false } })).toBe("needs_install");
  });
  test("iOS standalone: ready, then denied / subscribed", () => {
    const standalone = { env: { navigatorStandalone: true } };
    expect(resolve(UA.iphoneSafari, standalone)).toBe("ready");
    expect(resolve(UA.iphoneSafari, { ...standalone, permission: "denied" })).toBe("denied");
    expect(resolve(UA.iphoneSafari, { ...standalone, permission: "granted", hasBrowserSubscription: true, serverDeviceActive: true })).toBe("subscribed");
  });
  test("iPadOS standalone via display-mode behaves like iOS standalone", () => {
    expect(resolve(UA.ipadSafari, { env: { displayModeStandalone: true } })).toBe("ready");
  });
  test("iOS older than 16.4 and in-app browsers are unsupported", () => {
    expect(resolve(UA.iphoneOld, { env: { navigatorStandalone: true } })).toBe("unsupported");
    expect(resolve(UA.instagram, { caps: { hasPushManager: false } })).toBe("unsupported");
  });
  test("Android Chrome", () => {
    expect(resolve(UA.androidChrome)).toBe("ready");
    expect(resolve(UA.androidChrome, { permission: "granted", hasBrowserSubscription: true, serverDeviceActive: true })).toBe("subscribed");
  });
  test("desktop Chrome, Firefox and Safari: ready (no install needed)", () => {
    for (const ua of [UA.desktopChrome, UA.desktopFirefox, UA.macSafari]) expect(resolve(ua)).toBe("ready");
  });
  test("no Push API: unsupported (never needs_install off iOS)", () => {
    expect(resolve(UA.desktopChrome, { caps: { hasPushManager: false } })).toBe("unsupported");
    expect(resolve(UA.desktopChrome, { caps: { hasNotification: false } })).toBe("unsupported");
    expect(resolve(UA.androidChrome, { caps: { hasServiceWorker: false } })).toBe("unsupported");
  });
  test("denied wins over everything that could otherwise be ready/subscribed", () => {
    expect(resolve(UA.desktopChrome, { permission: "denied" })).toBe("denied");
    expect(resolve(UA.desktopChrome, { permission: "denied", hasBrowserSubscription: true, serverDeviceActive: true })).toBe("denied");
  });
  test("subscribed needs permission AND a browser subscription AND server acknowledgement", () => {
    const base = { permission: "granted" as BrowserPermission };
    expect(resolve(UA.desktopChrome, { ...base, hasBrowserSubscription: true })).toBe("ready");
    expect(resolve(UA.desktopChrome, { ...base, serverDeviceActive: true })).toBe("ready");
    expect(resolve(UA.desktopChrome, { ...base })).toBe("ready");
  });
});

describe("asking for permission", () => {
  test("only when ready AND the browser still says default: never after a denial, never when subscribed", () => {
    expect(canAskForPermission("ready", "default")).toBe(true);
    expect(canAskForPermission("ready", "granted")).toBe(false);
    expect(canAskForPermission("denied", "denied")).toBe(false);
    expect(canAskForPermission("denied", "default")).toBe(false);
    expect(canAskForPermission("needs_install", "default")).toBe(false);
    expect(canAskForPermission("unsupported", "unsupported")).toBe(false);
    expect(canAskForPermission("subscribed", "granted")).toBe(false);
  });
});

describe("re-enable instructions follow the detected platform", () => {
  const steps = (ua: string) => reenableInstructions({ userAgent: ua }).steps.join(" ");
  test("iOS points at Settings", () => expect(steps(UA.iphoneSafari)).toMatch(/Settings app/));
  test("Android points at site/app permissions", () => expect(steps(UA.androidChrome)).toMatch(/Permissions/));
  test("Firefox, Safari (macOS) and Chromium each get their own steps", () => {
    expect(steps(UA.desktopFirefox)).toMatch(/Receive Notifications/);
    expect(steps(UA.macSafari)).toMatch(/Safari/);
    expect(steps(UA.desktopChrome)).toMatch(/lock or tune icon/);
  });
  test("every set has at least three steps and never tells the member to re-prompt", () => {
    for (const ua of Object.values(UA)) {
      const i = reenableInstructions({ userAgent: ua });
      expect(i.steps.length).toBeGreaterThanOrEqual(3);
      expect(i.steps.join(" ")).not.toMatch(/requestPermission/);
    }
  });
});

import { reminderClockTime, reminderLabel } from "../pwa/reminderTime";

describe("reminder time", () => {
  test("morning for am/both, evening for pm; labels are plain", () => {
    expect(reminderClockTime("am")).toBe("07:00");
    expect(reminderClockTime("both")).toBe("07:00");
    expect(reminderClockTime("pm")).toBe("19:30");
    expect(reminderLabel("07:00")).toBe("7:00 am");
    expect(reminderLabel("19:30")).toBe("7:30 pm");
    expect(reminderLabel(null)).toBe("your routine time");
  });
});
