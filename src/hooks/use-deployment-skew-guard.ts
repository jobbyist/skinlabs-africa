import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const CHECK_INTERVAL_MS = 10 * 60_000;
const MIN_GAP_BETWEEN_CHECKS_MS = 60_000;
const ENTRY_SCRIPT_PATTERN = /src="(\/assets\/index-[^"]+\.js)"/;

const currentEntryScript = (): string | null =>
  document.querySelector<HTMLScriptElement>('script[type="module"][src^="/assets/index-"]')?.getAttribute("src") ?? null;

/**
 * Detects that a newer deployment went live while this tab was open (checked
 * when the tab becomes visible again, and every 10 minutes), then turns the
 * *next* in-app navigation into a full page load. That way a long-lived or
 * backgrounded tab never tries to lazy-load chunks that no longer exist,
 * and the user is never interrupted mid-page by a surprise reload.
 * No-op in dev, where there is no hashed entry script.
 */
export const useDeploymentSkewGuard = () => {
  const { pathname } = useLocation();
  const stale = useRef(false);
  const firstPath = useRef(true);

  useEffect(() => {
    const loadedEntry = currentEntryScript();
    if (!loadedEntry) return;
    let lastCheck = Date.now();

    const check = async () => {
      if (stale.current || Date.now() - lastCheck < MIN_GAP_BETWEEN_CHECKS_MS) return;
      lastCheck = Date.now();
      try {
        const response = await fetch("/", { cache: "no-store", headers: { Accept: "text/html" } });
        if (!response.ok) return;
        const latestEntry = (await response.text()).match(ENTRY_SCRIPT_PATTERN)?.[1];
        if (latestEntry && latestEntry !== loadedEntry) stale.current = true;
      } catch {
        // Offline or blocked — try again on the next trigger.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    // The router has already moved to the new URL, so reloading lands on it with fresh HTML.
    if (stale.current) window.location.reload();
  }, [pathname]);
};
