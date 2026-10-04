/**
 * Pure environment detection for the PWA layer. Everything takes an explicit
 * `DetectionEnv` so it can be unit tested for every platform without a DOM;
 * `readDetectionEnv()` builds the real one in the browser.
 *
 * User-agent sniffing is only used where there is no feature to probe (iOS
 * vs Android install flows, in-app browsers). Install state and capabilities
 * come from feature checks (display-mode, `navigator.standalone`,
 * `PushManager`, …).
 */

export type Platform = "ios" | "ipados" | "android" | "windows" | "macos" | "linux" | "chromeos" | "unknown";
export type Browser = "safari" | "chrome" | "edge" | "firefox" | "samsung" | "opera" | "other";

export interface DetectionEnv {
  userAgent: string;
  /** navigator.platform — only used to spot iPadOS, which reports itself as a Mac. */
  platform?: string;
  maxTouchPoints?: number;
  /** matchMedia('(display-mode: standalone)') or fullscreen/minimal-ui. */
  displayModeStandalone?: boolean;
  /** iOS-only `navigator.standalone`. */
  navigatorStandalone?: boolean;
  /** document.referrer — Android TWA/installed launches start with android-app://. */
  referrer?: string;
}

export const isIpadOs = (env: DetectionEnv): boolean =>
  (env.platform === "MacIntel" || /Macintosh/i.test(env.userAgent)) && (env.maxTouchPoints ?? 0) > 1;

export const detectPlatform = (env: DetectionEnv): Platform => {
  const ua = env.userAgent;
  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/iPad/i.test(ua) || isIpadOs(env)) return "ipados";
  if (/Android/i.test(ua)) return "android";
  if (/CrOS/i.test(ua)) return "chromeos";
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return "unknown";
};

export const isApplePlatform = (p: Platform): boolean => p === "ios" || p === "ipados";

/** Embedded webviews where "install" does not exist (Instagram, TikTok, Facebook, LinkedIn, …). */
export const isInAppBrowser = (ua: string): boolean =>
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|BytedanceWebview|musical_ly|LinkedInApp|Twitter|Pinterest|; wv\)/i.test(ua);

export const detectBrowser = (env: DetectionEnv): Browser => {
  const ua = env.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/EdgA|EdgiOS|Edg\//i.test(ua)) return "edge";
  if (/OPR\/|OPiOS|Opera/i.test(ua)) return "opera";
  if (/FxiOS|Firefox/i.test(ua)) return "firefox";
  if (/CriOS|Chrome\/|Chromium/i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return "safari";
  if (/AppleWebKit/i.test(ua) && isApplePlatform(detectPlatform(env))) return "safari";
  return "other";
};

/** True when the page is running as an installed app (any platform). */
export const isStandaloneMode = (env: DetectionEnv): boolean =>
  Boolean(env.displayModeStandalone) || env.navigatorStandalone === true || (env.referrer ?? "").startsWith("android-app://");

/** iOS/iPadOS major.minor, e.g. 16.4, from the UA ("OS 16_4"); null when unknown (iPadOS desktop UA). */
export const getIosVersion = (ua: string): number | null => {
  const m = /OS (\d+)[_.](\d+)/i.exec(ua);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 100;
};

/**
 * iOS can only install from Safari's Share menu (and, since 16.4, from other
 * browsers' share menus — but only Safari's flow is documented/stable enough
 * to give exact instructions for). Embedded webviews can't install at all.
 */
export const canShowIosInstructions = (env: DetectionEnv): boolean => {
  const platform = detectPlatform(env);
  if (!isApplePlatform(platform)) return false;
  if (isInAppBrowser(env.userAgent)) return false;
  if (isStandaloneMode(env)) return false;
  return detectBrowser(env) === "safari";
};

export interface CapabilityProbe {
  hasServiceWorker: boolean;
  hasNotification: boolean;
  hasPushManager: boolean;
  hasSyncManager: boolean;
  hasMediaSession: boolean;
  hasShare: boolean;
  hasBadge: boolean;
  hasCacheStorage: boolean;
  hasIndexedDb: boolean;
  hasStorageEstimate: boolean;
}

export const readCapabilityProbe = (): CapabilityProbe => {
  const w = typeof window === "undefined" ? undefined : window;
  const n = typeof navigator === "undefined" ? undefined : navigator;
  return {
    hasServiceWorker: Boolean(n && "serviceWorker" in n),
    hasNotification: Boolean(w && "Notification" in w),
    hasPushManager: Boolean(w && "PushManager" in w),
    hasSyncManager: Boolean(w && "SyncManager" in w),
    hasMediaSession: Boolean(n && "mediaSession" in n),
    hasShare: Boolean(n && typeof (n as Navigator).share === "function"),
    hasBadge: Boolean(n && "setAppBadge" in n),
    hasCacheStorage: Boolean(w && "caches" in w),
    hasIndexedDb: Boolean(w && "indexedDB" in w),
    hasStorageEstimate: Boolean(n && n.storage && typeof n.storage.estimate === "function"),
  };
};

export const readDetectionEnv = (): DetectionEnv => {
  if (typeof navigator === "undefined") return { userAgent: "" };
  const mq = (q: string) => {
    try {
      return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(q).matches;
    } catch {
      return false;
    }
  };
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    displayModeStandalone: mq("(display-mode: standalone)") || mq("(display-mode: fullscreen)") || mq("(display-mode: minimal-ui)"),
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone,
    referrer: typeof document === "undefined" ? "" : document.referrer,
  };
};

/** Automation / crawlers never get PWA chrome (splash, prompts, service worker). */
export const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|lighthouse|headlesschrome|prerender/i;

export const isAutomation = (userAgent: string, webdriver?: boolean): boolean => BOT_UA_PATTERN.test(userAgent) || webdriver === true;

export type DeviceType = "phone" | "tablet" | "desktop" | "unknown";

/** Coarse form factor for analytics. iPad/iPadOS and large Android devices (UA without "Mobile") are tablets. */
export const detectDeviceType = (env: DetectionEnv): DeviceType => {
  const platform = detectPlatform(env);
  switch (platform) {
    case "ios":
      return "phone";
    case "ipados":
      return "tablet";
    case "android":
      return /Mobile/i.test(env.userAgent) ? "phone" : "tablet";
    case "windows":
    case "macos":
    case "linux":
    case "chromeos":
      return "desktop";
    default:
      return "unknown";
  }
};
