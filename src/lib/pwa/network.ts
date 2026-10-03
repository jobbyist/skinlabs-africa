/**
 * Network status as the app should treat it. `navigator.onLine` only says
 * whether a network interface exists, so real request failures are the source
 * of truth: any caller (React Query's cache, the podcast downloader, a probe
 * after the `online` event) reports success/failure here and the store
 * combines them.
 */
export interface NetworkSnapshot {
  /** navigator.onLine. */
  online: boolean;
  /** False after a real request failed with a network error and nothing has succeeded since. */
  reachable: boolean;
}

let snapshot: NetworkSnapshot = { online: true, reachable: true };
let initialised = false;
const listeners = new Set<() => void>();
const backOnlineHandlers = new Set<() => void>();

const set = (next: Partial<NetworkSnapshot>) => {
  const merged = { ...snapshot, ...next };
  if (merged.online === snapshot.online && merged.reachable === snapshot.reachable) return;
  const wasOffline = isEffectivelyOffline(snapshot);
  snapshot = merged;
  listeners.forEach((l) => l());
  if (wasOffline && !isEffectivelyOffline(snapshot)) backOnlineHandlers.forEach((h) => h());
};

export const isEffectivelyOffline = (s: NetworkSnapshot): boolean => !s.online || !s.reachable;

export const subscribeNetwork = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getNetworkSnapshot = (): NetworkSnapshot => snapshot;
export const getServerNetworkSnapshot = (): NetworkSnapshot => ({ online: true, reachable: true });

/** Runs `handler` each time connectivity returns (offline → online). */
export const onBackOnline = (handler: () => void): (() => void) => {
  backOnlineHandlers.add(handler);
  return () => backOnlineHandlers.delete(handler);
};

const NETWORK_ERROR_PATTERN = /failed to fetch|networkerror|network request failed|load failed|network error|err_internet_disconnected|the internet connection appears to be offline/i;

/** True for the errors browsers throw when a request never reached a server. */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  if (error instanceof DOMException && error.name === "AbortError") return false;
  const message = error instanceof Error ? `${error.name} ${error.message}` : String((error as { message?: string })?.message ?? error);
  return NETWORK_ERROR_PATTERN.test(message);
};

let confirmTimer: ReturnType<typeof setTimeout> | null = null;
let recoveryTimer: ReturnType<typeof setInterval> | null = null;

const markUnreachable = () => {
  set({ reachable: false });
  // Keep checking until our own origin answers again: nothing else is guaranteed to flip it back.
  if (!recoveryTimer && typeof window !== "undefined") {
    recoveryTimer = setInterval(() => {
      void probeReachability().then((ok) => {
        if (ok && recoveryTimer) {
          clearInterval(recoveryTimer);
          recoveryTimer = null;
        }
      });
    }, 10_000);
  }
};

/**
 * A request failed with a network error. One failed request is NOT proof the app is offline (an ad host, a
 * third-party API or a single flaky call can fail while everything else works), so unless the browser itself
 * says it is offline, this only schedules a reachability probe against our own origin; the store flips to
 * "unreachable" only if that probe fails too.
 */
export const reportNetworkFailure = (error?: unknown) => {
  if (error !== undefined && !isNetworkError(error)) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    markUnreachable();
    return;
  }
  if (confirmTimer || typeof window === "undefined") return;
  confirmTimer = setTimeout(() => {
    confirmTimer = null;
    void probeReachability();
  }, 400);
};
export const reportNetworkSuccess = () => {
  if (snapshot.reachable) return;
  set({ reachable: true });
  if (recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = null;
  }
};

/** Cheap reachability check against our own origin (never cached by the service worker). */
export const probeReachability = async (timeoutMs = 5_000): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`/manifest.webmanifest?ping=${Date.now()}`, { method: "HEAD", cache: "no-store", signal: controller.signal });
    const ok = res.ok || res.status < 500;
    if (ok) reportNetworkSuccess();
    else markUnreachable();
    return ok;
  } catch {
    markUnreachable();
    return false;
  } finally {
    clearTimeout(timer);
  }
};

export const initNetwork = () => {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  snapshot = { online: navigator.onLine !== false, reachable: true };
  window.addEventListener("offline", () => set({ online: false }));
  window.addEventListener("online", () => {
    // "online" only means an interface is up: confirm the app's origin is reachable before announcing recovery.
    set({ online: true });
    void probeReachability();
  });
  listeners.forEach((l) => l());
};

/** Test hook: clear timers and return the store to its initial online state. */
export const __resetNetworkForTests = () => {
  if (confirmTimer) clearTimeout(confirmTimer);
  if (recoveryTimer) clearInterval(recoveryTimer);
  confirmTimer = null;
  recoveryTimer = null;
  snapshot = { online: true, reachable: true };
};
