/**
 * Progress model for the installed-app launch splash (<Preloader /> in
 * "pwa" mode). Pure and unit tested.
 *
 * Progress is the weighted sum of REAL launch tasks, not a fixed timer:
 *
 *    0–20   boot                  first paint of the React app
 *   20–45   session               Supabase session restored (auth settled)
 *   45–65   serviceWorker         worker ready / confirmed unavailable
 *   65–80   resources             fonts + brand artwork ready
 *   80–95   route                 the destination route's code is loaded
 *   95–100  ready                 everything done → finish immediately
 *
 * Between tasks the bar creeps toward the next milestone so it never looks
 * frozen, and a time floor guarantees it reaches 100% by SPLASH_MAX_MS even if
 * a task hangs (slow network, expired-session refresh). If every task is done
 * early the splash finishes early — only SPLASH_MIN_VISIBLE_MS keeps it from
 * flashing.
 */
import { SPLASH_MAX_MS, SPLASH_MIN_VISIBLE_MS, SPLASH_SOFT_MS } from "./constants";

export type LaunchTask = "boot" | "session" | "serviceWorker" | "resources" | "route";

export interface LaunchStage {
  task: LaunchTask;
  /** Share of the bar this task is worth. */
  weight: number;
  label: string;
}

export const LAUNCH_STAGES: LaunchStage[] = [
  { task: "boot", weight: 20, label: "Starting SkinLabs®" },
  { task: "session", weight: 25, label: "Restoring your session" },
  { task: "serviceWorker", weight: 20, label: "Preparing offline mode" },
  { task: "resources", weight: 15, label: "Loading essentials" },
  { task: "route", weight: 15, label: "Getting your space ready" },
];

/** Sum of task weights = 95; the last 5 points are "ready". */
export const TASK_TOTAL = LAUNCH_STAGES.reduce((sum, s) => sum + s.weight, 0);

export interface LaunchState {
  done: ReadonlySet<LaunchTask>;
  elapsedMs: number;
}

export interface LaunchProgress {
  /** Where the bar should be heading (0–100). */
  target: number;
  label: string;
  /** The splash may leave now. */
  finished: boolean;
  reason: "ready" | "timeout" | null;
}

/** The time floor: slow ramp to 95% by SPLASH_SOFT_MS, then 100% at SPLASH_MAX_MS. */
export const timeFloor = (elapsedMs: number): number => {
  const rampStart = 3_000;
  if (elapsedMs <= rampStart) return 0;
  if (elapsedMs <= SPLASH_SOFT_MS) return (95 * (elapsedMs - rampStart)) / (SPLASH_SOFT_MS - rampStart);
  return Math.min(100, 95 + (5 * (elapsedMs - SPLASH_SOFT_MS)) / (SPLASH_MAX_MS - SPLASH_SOFT_MS));
};

/** Creep toward (never reaching) the next milestone while a task is outstanding. */
const creep = (elapsedMs: number, nextWeight: number): number => nextWeight * 0.85 * (1 - Math.exp(-elapsedMs / 2_500));

export const computeLaunchProgress = ({ done, elapsedMs }: LaunchState): LaunchProgress => {
  const base = LAUNCH_STAGES.filter((s) => done.has(s.task)).reduce((sum, s) => sum + s.weight, 0);
  const pending = LAUNCH_STAGES.find((s) => !done.has(s.task));
  const allDone = !pending;

  const timedOut = elapsedMs >= SPLASH_MAX_MS;
  const readyToLeave = allDone && elapsedMs >= SPLASH_MIN_VISIBLE_MS;

  const organic = allDone ? 100 : base + creep(elapsedMs, pending.weight);
  const target = timedOut ? 100 : Math.min(100, Math.max(organic, timeFloor(elapsedMs)));

  return {
    target,
    label: pending?.label ?? "Ready",
    finished: timedOut || readyToLeave,
    reason: timedOut ? "timeout" : readyToLeave ? "ready" : null,
  };
};

/**
 * One animation step: move `current` toward `target` with an ease-out that is
 * monotonic (never goes backwards) and fast enough to catch up when a task
 * completes. `dtMs` is the frame delta.
 */
export const stepDisplayedProgress = (current: number, target: number, dtMs: number, finishing = false): number => {
  if (target <= current) return current;
  const timeConstant = finishing ? 120 : 380;
  const next = current + (target - current) * (1 - Math.exp(-dtMs / timeConstant));
  // Snap the last fraction so "100%" is reached in finite time.
  return target - next < 0.2 ? target : next;
};

export interface LaunchSplashContext {
  standalone: boolean;
  alreadyShownThisSession: boolean;
  automation: boolean;
}

/**
 * The launch splash plays once per app launch: installed (standalone) only,
 * never for crawlers/automation, and not again on in-session navigation,
 * a reload, or resuming from the background (sessionStorage outlives those).
 */
export const shouldShowLaunchSplash = (ctx: LaunchSplashContext): boolean =>
  ctx.standalone && !ctx.alreadyShownThisSession && !ctx.automation;
