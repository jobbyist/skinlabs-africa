import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "@/lib/pwa/constants";
import { isAutomation, isStandaloneMode, readDetectionEnv } from "@/lib/pwa/detection";
import { computeLaunchProgress, shouldShowLaunchSplash, stepDisplayedProgress, type LaunchTask } from "@/lib/pwa/launchProgress";
import { whenServiceWorkerSettled } from "@/lib/pwa/serviceWorker";
import { session } from "@/lib/pwa/storageUtil";

const TASK_CAP_MS = 3_500;

const settleWithin = <T,>(promise: Promise<T> | undefined, ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    (promise ?? Promise.resolve()).then(
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      () => {
        window.clearTimeout(timer);
        resolve();
      },
    );
  });

interface Options {
  /** useAuth().loading — the Supabase session restore has settled when this is false. */
  authLoading: boolean;
  isSignedIn: boolean;
  logoSrc: string;
}

export interface LaunchSplash {
  /** This page load is an installed-app cold launch that plays the splash. */
  active: boolean;
  /** 0–100, smoothed. */
  progress: number;
  label: string;
  /** Progress reached 100% and the splash may fade out. */
  finished: boolean;
}

/** One-time decision: evaluated on first render and then frozen (a re-render must not restart the splash). */
const decideActive = (): boolean => {
  if (typeof window === "undefined") return false;
  const env = readDetectionEnv();
  return shouldShowLaunchSplash({
    standalone: isStandaloneMode(env),
    alreadyShownThisSession: session.get(STORAGE_KEYS.splashShown) === "1",
    automation: isAutomation(env.userAgent, navigator.webdriver),
  });
};

/**
 * Drives the installed-app launch splash (Preloader's "pwa" mode): real launch
 * tasks report completion, progress eases toward the weighted result, and a
 * time floor guarantees the splash ends by SPLASH_MAX_MS whatever happens.
 * See src/lib/pwa/launchProgress.ts for the model.
 */
export const useLaunchSplash = ({ authLoading, isSignedIn, logoSrc }: Options): LaunchSplash => {
  const [active] = useState(decideActive);
  const [done, setDone] = useState<ReadonlySet<LaunchTask>>(() => new Set());
  const [state, setState] = useState({ progress: 0, label: "Starting SkinLabs®", finished: false });
  const startedAt = useRef<number>(0);
  const displayed = useRef(0);
  const routeStarted = useRef(false);

  const markDone = useCallback((task: LaunchTask) => {
    setDone((prev) => (prev.has(task) ? prev : new Set(prev).add(task)));
  }, []);

  // Mark the launch as shown for this session right away so a remount/re-render never replays it.
  useEffect(() => {
    if (!active) return;
    session.set(STORAGE_KEYS.splashShown, "1");
    startedAt.current = performance.now();
    window.requestAnimationFrame(() => markDone("boot"));
    void whenServiceWorkerSettled(TASK_CAP_MS).then(() => markDone("serviceWorker"));

    const logo = new Image();
    logo.src = logoSrc;
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    void Promise.all([settleWithin(fonts, TASK_CAP_MS), settleWithin(logo.decode?.(), TASK_CAP_MS)]).then(() => markDone("resources"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (active && !authLoading) markDone("session");
  }, [active, authLoading, markDone]);

  // Route preparation: load the code for where this launch is heading (dashboard for members).
  useEffect(() => {
    if (!active || authLoading || routeStarted.current) return;
    routeStarted.current = true;
    const chunk = isSignedIn ? import("@/pages/UserDashboard") : import("@/pages/Start");
    void settleWithin(chunk, TASK_CAP_MS + 500).then(() => markDone("route"));
  }, [active, authLoading, isSignedIn, markDone]);

  // Animation loop: compute the weighted target, ease the displayed value toward it.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let lastPaint = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      const progress = computeLaunchProgress({ done, elapsedMs: elapsed });
      displayed.current = stepDisplayedProgress(displayed.current, progress.target, now - last, progress.finished);
      last = now;
      const reachedEnd = displayed.current >= 99.5;
      if (now - lastPaint > 33 || reachedEnd) {
        lastPaint = now;
        setState({
          progress: Math.round(displayed.current),
          label: progress.label,
          finished: progress.finished && reachedEnd,
        });
      }
      if (!(progress.finished && reachedEnd)) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active, done]);

  return { active, progress: state.progress, label: state.label, finished: state.finished };
};
