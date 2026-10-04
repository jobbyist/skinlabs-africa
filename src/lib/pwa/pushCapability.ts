/**
 * THE push capability decision. Every surface that asks "can/should this device get push?" (Settings → App,
 * the permission prompt, welcome, the Getting Started checklist, report-ready banners, the PWA status hook)
 * goes through `resolvePushCapability()` and nothing else: no other file in src/ reads Notification.permission
 * or probes PushManager to decide this.
 *
 * Pure (explicit inputs) so it is unit tested for every platform; `readPushInputs()` reads the real browser.
 *
 *   "unsupported"   no Push API here (or iOS < 16.4, or an in-app webview)
 *   "needs_install" iOS/iPadOS Safari TAB: web push only works from an installed Home Screen app (iOS 16.4+)
 *   "denied"        Notification.permission === "denied": we never ask again, we show re-enable steps
 *   "subscribed"    permission granted, a browser subscription exists AND the server acknowledged this endpoint
 *   "ready"         Notification + PushManager available (iOS: installed/standalone) and not subscribed yet
 */
import {
  canShowIosInstructions,
  detectBrowser,
  detectPlatform,
  getIosVersion,
  isApplePlatform,
  isInAppBrowser,
  isStandaloneMode,
  readCapabilityProbe,
  readDetectionEnv,
  type Browser,
  type CapabilityProbe,
  type DetectionEnv,
  type Platform,
} from "./detection";
import { local } from "./storageUtil";

export const PUSH_STATE_CHANGED_EVENT = "skinlabs:push-state-changed";

export type PushCapability = "ready" | "needs_install" | "denied" | "unsupported" | "subscribed";
export type BrowserPermission = "default" | "granted" | "denied" | "unsupported";

export interface PushInputs {
  env: DetectionEnv;
  caps: CapabilityProbe;
  permission: BrowserPermission;
  /** A PushSubscription exists in the browser for this device. */
  hasBrowserSubscription: boolean;
  /** register_push_subscription() succeeded for THIS endpoint (re-confirmed on every standalone launch). */
  serverDeviceActive: boolean;
}

export const resolvePushCapability = (input: PushInputs): PushCapability => {
  const { env, caps, permission } = input;
  const platform = detectPlatform(env);
  const apple = isApplePlatform(platform);

  if (apple) {
    if (isInAppBrowser(env.userAgent)) return "unsupported";
    const version = getIosVersion(env.userAgent);
    if (version !== null && version < 16.4) return "unsupported";
    // A Safari tab has no PushManager at all: the answer is "install first", whatever permission says.
    if (!isStandaloneMode(env)) return "needs_install";
  }

  const apiPresent = caps.hasServiceWorker && caps.hasNotification && caps.hasPushManager;
  if (!apiPresent) return "unsupported";
  if (permission === "denied") return "denied";
  if (permission === "granted" && input.hasBrowserSubscription && input.serverDeviceActive) return "subscribed";
  return "ready";
};

/** May we show our own soft-ask → browser dialog? Never after a denial, only when the platform can push. */
export const canAskForPermission = (capability: PushCapability, permission: BrowserPermission): boolean =>
  capability === "ready" && permission === "default";

export interface ReenableInstructions {
  title: string;
  steps: string[];
}

/** Platform-specific steps to undo a block. We never re-prompt: the browser won't show the dialog again anyway. */
export const reenableInstructions = (env: DetectionEnv): ReenableInstructions => {
  const platform: Platform = detectPlatform(env);
  const browser: Browser = detectBrowser(env);
  if (platform === "ios" || platform === "ipados") {
    return {
      title: "Turn notifications back on",
      steps: ["Open the Settings app.", "Scroll down and tap SkinLabs® (or Notifications, then SkinLabs®).", "Turn on Allow Notifications.", "Come back to SkinLabs® and turn notifications on here."],
    };
  }
  if (platform === "android") {
    return {
      title: "Turn notifications back on",
      steps:
        browser === "chrome" || browser === "samsung" || browser === "edge"
          ? ["Tap the lock or tune icon next to the address bar (or press and hold the SkinLabs® app icon → App info).", "Open Permissions → Notifications.", "Choose Allow.", "Reload SkinLabs® and turn notifications on here."]
          : ["Open your browser’s site settings for SkinLabs®.", "Set Notifications to Allow.", "Reload SkinLabs® and turn notifications on here."],
    };
  }
  if (browser === "firefox") {
    return { title: "Turn notifications back on", steps: ["Click the lock icon in the address bar.", "Next to Receive Notifications, remove the block (click ×).", "Reload SkinLabs® and turn notifications on here."] };
  }
  if (browser === "safari") {
    return { title: "Turn notifications back on", steps: ["In Safari, choose Settings → Websites → Notifications.", "Find skinlabs.co.za and set it to Allow.", "Reload SkinLabs® and turn notifications on here."] };
  }
  return {
    title: "Turn notifications back on",
    steps: ["Click the lock or tune icon at the left of the address bar.", "Set Notifications to Allow.", "Reload SkinLabs® and turn notifications on here."],
  };
};

/** The three Share-sheet steps, as text (not just icons). One copy for every surface that needs an install first. */
export const IOS_HOME_SCREEN_STEPS = [
  "Tap the Share button (the square with an arrow) in Safari’s toolbar.",
  "Scroll down and tap “Add to Home Screen”, then tap Add.",
  "Open SkinLabs® from your Home Screen. We’ll ask about notifications there.",
] as const;

/** Whether the iOS "Add to Home Screen" instructions apply (used with "needs_install"). */
export const needsIosInstallSteps = (env: DetectionEnv): boolean => canShowIosInstructions(env);

// --- real-browser reads ---------------------------------------------------------------------------

export const readBrowserPermission = (): BrowserPermission => {
  if (typeof Notification === "undefined") return "unsupported";
  const p = Notification.permission;
  return p === "granted" || p === "denied" ? p : "default";
};

/** Record that the server acknowledged this endpoint (set by notificationManager after register_push_subscription succeeds). */
const REGISTERED_KEY = "skinlabs_push_registered_endpoint";
const hash = (s: string): string => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
};
export const markEndpointRegistered = (endpoint: string | null) => {
  if (endpoint) local.set(REGISTERED_KEY, hash(endpoint));
  else local.remove(REGISTERED_KEY);
};
export const isEndpointRegistered = (endpoint: string | null | undefined): boolean =>
  Boolean(endpoint) && local.get(REGISTERED_KEY) === hash(endpoint as string);

export const readPushInputs = (subscription: { endpoint: string } | null): PushInputs => ({
  env: readDetectionEnv(),
  caps: readCapabilityProbe(),
  permission: readBrowserPermission(),
  hasBrowserSubscription: subscription !== null,
  serverDeviceActive: isEndpointRegistered(subscription?.endpoint),
});

/** Synchronous answer without a subscription lookup (enough to gate UI that does not need "subscribed"). */
export const getPushCapabilityNow = (): PushCapability => resolvePushCapability(readPushInputs(null));
