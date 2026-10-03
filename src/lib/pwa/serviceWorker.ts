/**
 * Service worker registration, update detection and the single guarded
 * "activate the new version + reload" path. Everything is best-effort: when
 * service workers are unavailable (old browsers, Firefox private mode,
 * automation) or registration fails, the site simply runs without one.
 *
 * Registration happens after `load` (+ idle) so it never competes with the
 * first render, and only in production builds — `vite dev` has no worker.
 */
import { SW_MESSAGES, STORAGE_KEYS } from "./constants";
import { isAutomation } from "./detection";
import { session } from "./storageUtil";
import { trackPwaEvent } from "./analytics";

export const SW_EVENTS = {
  flushQueue: "skinlabs:flush-queue",
  navigate: "skinlabs:navigate",
  pushSubscriptionChanged: "skinlabs:push-subscription-changed",
  pushReceived: "skinlabs:push-received",
} as const;

export interface UpdateSnapshot {
  /** A new worker is installed and waiting for the member to accept it. */
  updateReady: boolean;
}

let snapshot: UpdateSnapshot = { updateReady: false };
let registration: ServiceWorkerRegistration | null = null;
let reloadRequested = false;
let started = false;
const listeners = new Set<() => void>();

const emit = (next: Partial<UpdateSnapshot>) => {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
};

export const subscribeUpdates = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getUpdateSnapshot = (): UpdateSnapshot => snapshot;
export const getServerUpdateSnapshot = (): UpdateSnapshot => ({ updateReady: false });

export const isServiceWorkerSupported = (): boolean => typeof navigator !== "undefined" && "serviceWorker" in navigator;

/** Whether this page load registers a worker at all. */
export const shouldRegisterServiceWorker = (): boolean => {
  if (!isServiceWorkerSupported()) return false;
  if (import.meta.env.DEV) return false;
  if (isAutomation(navigator.userAgent, navigator.webdriver)) return false;
  return true;
};

const watchRegistration = (reg: ServiceWorkerRegistration) => {
  const markIfWaiting = () => {
    // A waiting worker with an active controller = an UPDATE (the very first install has no controller).
    if (reg.waiting && navigator.serviceWorker.controller) {
      if (!snapshot.updateReady) trackPwaEvent("pwa_update_available");
      emit({ updateReady: true });
    }
  };
  markIfWaiting();
  reg.addEventListener("updatefound", () => {
    const worker = reg.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") markIfWaiting();
    });
  });
};

const checkForUpdate = () => {
  registration?.update().catch(() => undefined);
};

/** Called when connectivity returns: look for a newer worker straight away. */
export const checkForServiceWorkerUpdate = checkForUpdate;

/** Reload exactly once per requested update, and never twice within 10 s (loop guard). */
const reloadOnce = () => {
  const last = Number(session.get(STORAGE_KEYS.swReloadGuard) ?? 0);
  if (Date.now() - last < 10_000) return;
  session.set(STORAGE_KEYS.swReloadGuard, String(Date.now()));
  session.set("skinlabs_sw_updated", "1");
  window.location.reload();
};

export const registerServiceWorker = () => {
  if (started || typeof window === "undefined") return;
  started = true;

  if (isServiceWorkerSupported()) {
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string; category?: string } | null;
      switch (data?.type) {
        case SW_MESSAGES.flushQueue:
          window.dispatchEvent(new Event(SW_EVENTS.flushQueue));
          break;
        case SW_MESSAGES.notificationClick:
          window.dispatchEvent(new CustomEvent(SW_EVENTS.navigate, { detail: { url: data.url } }));
          break;
        case "PUSH_SUBSCRIPTION_CHANGED":
          window.dispatchEvent(new Event(SW_EVENTS.pushSubscriptionChanged));
          break;
        case SW_MESSAGES.pushReceived:
          window.dispatchEvent(new CustomEvent(SW_EVENTS.pushReceived, { detail: { category: data.category } }));
          break;
      }
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadRequested) reloadOnce();
    });
  }

  if (!shouldRegisterServiceWorker()) return;

  if (session.get("skinlabs_sw_updated") === "1") {
    session.remove("skinlabs_sw_updated");
    trackPwaEvent("pwa_updated");
  }

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        watchRegistration(reg);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") checkForUpdate();
        });
        window.setInterval(checkForUpdate, 60 * 60 * 1000);
      })
      .catch((error) => {
        // The site works without a worker; keep the diagnostic for developers only.
        console.warn("[pwa] service worker registration failed:", error);
      });
  };

  const schedule = () => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(register, { timeout: 4000 });
    else window.setTimeout(register, 1500);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
};

/** Activates the waiting worker and reloads once it takes control. */
export const applyServiceWorkerUpdate = () => {
  const waiting = registration?.waiting;
  if (!waiting) {
    reloadOnce();
    return;
  }
  reloadRequested = true;
  waiting.postMessage({ type: SW_MESSAGES.skipWaiting });
  // If controllerchange never arrives (rare), reload anyway rather than leave the button hanging.
  window.setTimeout(reloadOnce, 4000);
};

/**
 * Resolves when the worker is controlling/ready, or immediately when there will
 * be none (unsupported, dev, automation), or after `timeoutMs`. Used by the
 * launch splash — it must never block the app.
 */
export const whenServiceWorkerSettled = (timeoutMs = 3500): Promise<"ready" | "unavailable" | "timeout"> => {
  if (!shouldRegisterServiceWorker()) return Promise.resolve("unavailable");
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve("timeout"), timeoutMs);
    navigator.serviceWorker.ready.then(
      () => {
        window.clearTimeout(timer);
        resolve("ready");
      },
      () => {
        window.clearTimeout(timer);
        resolve("unavailable");
      },
    );
  });
};

export const getRegistration = (): ServiceWorkerRegistration | null => registration;

/** The active registration even before our own register() resolved (e.g. on a warm start). */
export const getReadyRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) return null;
  try {
    return (await navigator.serviceWorker.getRegistration("/")) ?? null;
  } catch {
    return null;
  }
};
