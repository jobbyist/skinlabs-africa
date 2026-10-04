import { readPushInputs, resolvePushCapability } from "@/lib/pwa/pushCapability";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  canShowIosInstructions,
  detectBrowser,
  detectPlatform,
  isInAppBrowser,
  isStandaloneMode,
  readCapabilityProbe,
  readDetectionEnv,
  type Browser,
  type Platform,
} from "@/lib/pwa/detection";
import { getInstallSnapshot, getServerInstallSnapshot, subscribeInstall } from "@/lib/pwa/install";

export interface PWAStatus {
  /** Running as an installed app, or an install was recorded on this browser. */
  isInstalled: boolean;
  /** Running right now in standalone/fullscreen/minimal-ui display mode. */
  isStandalone: boolean;
  /** An install flow exists for this visitor right now (native prompt captured, or iOS Safari). */
  isInstallable: boolean;
  /** The browser's own install dialog can be opened (Chromium `beforeinstallprompt`). */
  canPromptNatively: boolean;
  /** iOS/iPadOS Safari: install is the manual Share → Add to Home Screen flow. */
  needsIosInstructions: boolean;
  platform: Platform;
  browser: Browser;
  isInAppBrowser: boolean;
  supportsNotifications: boolean;
  supportsPush: boolean;
  /** Push exists on this device but only after the app is installed (iOS/iPadOS). */
  pushRequiresInstall: boolean;
  supportsBackgroundSync: boolean;
  supportsMediaSession: boolean;
  supportsShare: boolean;
  supportsBadge: boolean;
  supportsServiceWorker: boolean;
  /** Cache Storage + IndexedDB are both available (offline podcast downloads). */
  supportsOfflineStorage: boolean;
}

const DISPLAY_MODES = ["(display-mode: standalone)", "(display-mode: fullscreen)", "(display-mode: minimal-ui)"];

/**
 * One reactive view of "what kind of environment is this app running in".
 * Install state comes from display-mode / navigator.standalone / appinstalled,
 * capabilities from feature detection — not user-agent alone. Everything
 * defaults to "unsupported" during SSR/prerender, so it never changes markup
 * that crawlers see.
 */
export const usePWAStatus = (): PWAStatus => {
  const install = useSyncExternalStore(subscribeInstall, getInstallSnapshot, getServerInstallSnapshot);
  const [displayModeTick, setDisplayModeTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const lists = DISPLAY_MODES.map((q) => window.matchMedia(q));
    const bump = () => setDisplayModeTick((n) => n + 1);
    lists.forEach((l) => l.addEventListener?.("change", bump));
    return () => lists.forEach((l) => l.removeEventListener?.("change", bump));
  }, []);

  return useMemo<PWAStatus>(() => {
    const env = readDetectionEnv();
    const caps = readCapabilityProbe();
    const platform = detectPlatform(env);
    const standalone = isStandaloneMode(env);
    const pushCapability = resolvePushCapability(readPushInputs(null));
    const iosFlow = canShowIosInstructions(env);
    const installed = standalone || install.installedFlag;
    return {
      isInstalled: installed,
      isStandalone: standalone,
      isInstallable: !installed && (install.canPromptNatively || iosFlow),
      canPromptNatively: install.canPromptNatively && !installed,
      needsIosInstructions: iosFlow && !installed,
      platform,
      browser: detectBrowser(env),
      isInAppBrowser: isInAppBrowser(env.userAgent),
      supportsNotifications: caps.hasNotification,
      supportsPush: pushCapability !== "unsupported" && pushCapability !== "needs_install",
      pushRequiresInstall: pushCapability === "needs_install",
      supportsBackgroundSync: caps.hasSyncManager,
      supportsMediaSession: caps.hasMediaSession,
      supportsShare: caps.hasShare,
      supportsBadge: caps.hasBadge,
      supportsServiceWorker: caps.hasServiceWorker,
      supportsOfflineStorage: caps.hasCacheStorage && caps.hasIndexedDb,
    };
    // displayModeTick re-evaluates standalone when the display mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [install, displayModeTick]);
};
