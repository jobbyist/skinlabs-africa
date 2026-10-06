/**
 * Boot-time PWA wiring, called once from main.tsx before React renders. It must
 * stay tiny: it only attaches listeners and schedules work. All UI (install
 * prompt, offline banner, update toast, notification prompt, storage manager)
 * is lazy-loaded by components/pwa/PWAProvider.tsx.
 */
import { STORAGE_KEYS } from "./constants";
import { isAutomation, isStandaloneMode, readDetectionEnv } from "./detection";
import { initInstall } from "./install";
import { initNetwork } from "./network";
import { registerServiceWorker } from "./serviceWorker";
import { local, session } from "./storageUtil";
import { trackPwaEvent } from "./analytics";

export const initPwa = () => {
  if (typeof window === "undefined") return;
  const env = readDetectionEnv();
  if (isAutomation(env.userAgent, navigator.webdriver)) return;

  initNetwork();
  initInstall();
  registerServiceWorker();

  if (isStandaloneMode(env)) {
    document.documentElement.classList.add("is-standalone");
    // iOS/iPadOS never fire `appinstalled`, and an installed iOS app has storage separate from Safari, so
    // its FIRST launch is the install signal there. Where appinstalled did fire (Chromium) the shared
    // localStorage flag is already set, so this never double counts.
    if (local.get(STORAGE_KEYS.installed) !== "1") {
      local.set(STORAGE_KEYS.installed, "1");
      trackPwaEvent("pwa_installed", { source: "first_launch" });
    }
    // One launch event per app launch (sessionStorage outlives background/resume, not a cold start).
    if (!session.get(STORAGE_KEYS.lastLaunchPing)) {
      session.set(STORAGE_KEYS.lastLaunchPing, "1");
      trackPwaEvent("pwa_launch");
    }
  }
};
