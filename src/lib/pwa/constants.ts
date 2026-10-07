/**
 * Shared PWA constants. Imported by both the page bundle and the service
 * worker (src/sw/sw.ts), so keep this file free of DOM/React imports.
 */

/** The installed app's entry point (manifest start_url). */
export const PWA_START_PATH = "/start";

/** Offline fallback document, precached by the service worker (public/offline.html). */
export const OFFLINE_FALLBACK_PATH = "/offline.html";

/**
 * Bump CACHE_VERSION when the service worker's caching logic changes in a way
 * that makes old entries wrong. Obsolete `skinlabs-*` caches are removed on
 * activate. The podcast audio cache is NOT versioned: it holds downloads the
 * member chose to keep, so it must survive every service-worker update.
 */
export const CACHE_VERSION = "v2"; // v2: purges cached bare-SSR content pages (deep-link fix)
export const CACHE_PREFIX = "skinlabs-";
export const CACHE_NAMES = {
  assets: `${CACHE_PREFIX}assets-${CACHE_VERSION}`,
  pages: `${CACHE_PREFIX}pages-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
  publicData: `${CACHE_PREFIX}public-data-${CACHE_VERSION}`,
  shell: `${CACHE_PREFIX}shell-${CACHE_VERSION}`,
} as const;
export const AUDIO_CACHE_NAME = `${CACHE_PREFIX}podcast-audio`;

/** Per-cache entry ceilings (oldest entries are trimmed first). */
export const CACHE_LIMITS = {
  assets: 150,
  pages: 40,
  images: 120,
  publicData: 60,
} as const;

/** Public editorial data older than this is not served from cache (7 days). */
export const PUBLIC_DATA_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** A navigation/data request that has not answered in this long falls back to a cached copy. */
export const NETWORK_TIMEOUT_MS = 4_000;

/** Messages exchanged between the page and the service worker. */
export const SW_MESSAGES = {
  skipWaiting: "SKIP_WAITING",
  getVersion: "GET_VERSION",
  flushQueue: "FLUSH_QUEUE",
  notificationClick: "NOTIFICATION_CLICK",
  pushReceived: "push-received",
} as const;

/** Background Sync tag the service worker listens for (Chromium only). */
export const BACKGROUND_SYNC_TAG = "skinlabs-flush-queue";

// --- Storage keys (localStorage unless noted) -------------------------------

export const STORAGE_KEYS = {
  installed: "skinlabs_pwa_installed",
  installDismissedAt: "skinlabs_pwa_install_dismissed_at",
  installPageViews: "skinlabs_pwa_pageviews", // sessionStorage
  notifyPromptDismissedAt: "skinlabs_push_prompt_dismissed_at",
  checkinNudgeDismissedAt: "skinlabs_checkin_nudge_dismissed_at",
  splashShown: "skinlabs-pwa-splash-shown", // sessionStorage
  swReloadGuard: "skinlabs_sw_reload_at", // sessionStorage
  lastLaunchPing: "skinlabs_pwa_launch_ping", // sessionStorage
} as const;

// --- UX tuning ---------------------------------------------------------------

/** "Not now" on the first-check-in nudge stays away this long. */
export const CHECKIN_NUDGE_COOLDOWN_DAYS = 14;

/** After a dismissal, the install prompt stays away for this long. */
export const INSTALL_DISMISS_COOLDOWN_DAYS = 14;
/** After "Maybe later", the notification prompt stays away for this long. */
export const NOTIFY_PROMPT_COOLDOWN_DAYS = 30;
/** Pages a visitor must have seen in the session before the install prompt may appear. */
export const INSTALL_MIN_PAGEVIEWS = 2;
/** …and the prompt waits at least this long after the app loaded. */
export const INSTALL_MIN_DELAY_MS = 20_000;

/** Launch splash: smooth progress, hard ceiling. Real readiness finishes it earlier. */
export const SPLASH_SOFT_MS = 10_000;
export const SPLASH_MAX_MS = 12_000;
export const SPLASH_MIN_VISIBLE_MS = 900;

/** Routes where the install prompt must never interrupt the visitor. */
export const INSTALL_PROMPT_EXCLUDED_PREFIXES = [
  "/start",
  "/welcome",
  "/pricing",
  "/admin",
  "/reset-password",
  "/skynn-ai",
  "/newsletter/confirm",
];

/** Where SKYNN playback progress is kept in IndexedDB / the account. */
export const PWA_DB_NAME = "skinlabs-pwa";
export const PWA_DB_VERSION = 1;
