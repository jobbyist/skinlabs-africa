import { describe, expect, test } from "bun:test";
import { SPLASH_MAX_MS, SPLASH_MIN_VISIBLE_MS, SPLASH_SOFT_MS } from "../pwa/constants";
import {
  LAUNCH_STAGES,
  TASK_TOTAL,
  computeLaunchProgress,
  shouldShowLaunchSplash,
  stepDisplayedProgress,
  timeFloor,
  type LaunchTask,
} from "../pwa/launchProgress";
import { resolveStartDestination, resolveStartState } from "../pwa/startRoute";

const all = new Set<LaunchTask>(LAUNCH_STAGES.map((s) => s.task));
const some = (...t: LaunchTask[]) => new Set<LaunchTask>(t);

describe("launch progress", () => {
  test("stage weights follow the spec: 20 / 25 / 20 / 15 / 15, with the last 5 points = ready", () => {
    expect(LAUNCH_STAGES.map((s) => s.weight)).toEqual([20, 25, 20, 15, 15]);
    expect(TASK_TOTAL).toBe(95);
  });
  test("progress is the weighted sum of tasks that really finished", () => {
    expect(computeLaunchProgress({ done: some("boot"), elapsedMs: 0 }).target).toBeGreaterThanOrEqual(20);
    expect(computeLaunchProgress({ done: some("boot"), elapsedMs: 0 }).target).toBeLessThan(45);
    const afterSession = computeLaunchProgress({ done: some("boot", "session"), elapsedMs: 100 });
    expect(afterSession.target).toBeGreaterThanOrEqual(45);
    expect(afterSession.label).toBe("Preparing offline mode");
  });
  test("never frozen: it creeps while a task is outstanding, but never reaches the next milestone on its own", () => {
    const early = computeLaunchProgress({ done: some("boot"), elapsedMs: 200 }).target;
    const later = computeLaunchProgress({ done: some("boot"), elapsedMs: 2500 }).target;
    expect(later).toBeGreaterThan(early);
    expect(computeLaunchProgress({ done: some("boot"), elapsedMs: 2900 }).target).toBeLessThan(45);
  });
  test("finishes EARLY when everything is ready (after the minimum visible time only)", () => {
    expect(computeLaunchProgress({ done: all, elapsedMs: 100 }).finished).toBe(false); // would flash
    const early = computeLaunchProgress({ done: all, elapsedMs: SPLASH_MIN_VISIBLE_MS });
    expect(early.finished).toBe(true);
    expect(early.reason).toBe("ready");
    expect(early.target).toBe(100);
  });
  test("a hung task cannot trap the user: the time floor climbs and the splash ends at the ceiling", () => {
    expect(timeFloor(1000)).toBe(0);
    expect(timeFloor(SPLASH_SOFT_MS)).toBeCloseTo(95);
    expect(timeFloor(SPLASH_MAX_MS)).toBe(100);
    const mid = computeLaunchProgress({ done: some("boot"), elapsedMs: 8000 });
    expect(mid.target).toBeGreaterThan(60);
    expect(mid.finished).toBe(false);
    const end = computeLaunchProgress({ done: some("boot"), elapsedMs: SPLASH_MAX_MS });
    expect(end.finished).toBe(true);
    expect(end.reason).toBe("timeout");
    expect(end.target).toBe(100);
  });
  test("the ceiling is 12s and the soft target 10s (the 'approximately 10–12 seconds maximum')", () => {
    expect(SPLASH_MAX_MS).toBe(12_000);
    expect(SPLASH_SOFT_MS).toBe(10_000);
  });
  test("displayed progress eases toward the target, never moves backwards, and snaps to the end", () => {
    expect(stepDisplayedProgress(50, 40, 16)).toBe(50);
    const next = stepDisplayedProgress(10, 60, 16);
    expect(next).toBeGreaterThan(10);
    expect(next).toBeLessThan(60);
    expect(stepDisplayedProgress(99.9, 100, 16)).toBe(100);
    let v = 0;
    for (let i = 0; i < 400; i++) v = stepDisplayedProgress(v, 100, 16);
    expect(v).toBe(100);
  });
});

describe("when the launch splash plays", () => {
  test("installed (standalone) cold launch only", () => {
    expect(shouldShowLaunchSplash({ standalone: true, alreadyShownThisSession: false, automation: false })).toBe(true);
    expect(shouldShowLaunchSplash({ standalone: false, alreadyShownThisSession: false, automation: false })).toBe(false);
  });
  test("not again in the same session (route changes, reloads, resume from background)", () => {
    expect(shouldShowLaunchSplash({ standalone: true, alreadyShownThisSession: true, automation: false })).toBe(false);
  });
  test("never for crawlers or automation", () => {
    expect(shouldShowLaunchSplash({ standalone: true, alreadyShownThisSession: false, automation: true })).toBe(false);
  });
});

describe("/start routing", () => {
  const base = { authLoading: false, hasUser: false, offline: false, timedOut: false };
  test("cold start: wait for the session to be restored", () => {
    expect(resolveStartState({ ...base, authLoading: true })).toBe("restoring");
  });
  test("restored session → member experience; no session → existing sign-in", () => {
    expect(resolveStartState({ ...base, hasUser: true })).toBe("member");
    expect(resolveStartState(base)).toBe("signin");
  });
  test("slow network: after the ceiling it stops waiting (and routes on if the session arrives)", () => {
    expect(resolveStartState({ ...base, authLoading: true, timedOut: true })).toBe("signin");
    expect(resolveStartState({ ...base, authLoading: true, timedOut: true, hasUser: true })).toBe("member");
  });
  test("offline start shows the offline panel, signed in or not", () => {
    expect(resolveStartState({ ...base, offline: true })).toBe("offline");
    expect(resolveStartState({ ...base, offline: true, hasUser: true })).toBe("offline");
    expect(resolveStartState({ ...base, offline: true, authLoading: true })).toBe("offline");
  });
  test("destination: dashboard by default; ?next= only when it is a safe same-origin path", () => {
    expect(resolveStartDestination("")).toBe("/dashboard");
    expect(resolveStartDestination("?next=/podcast/ep1")).toBe("/podcast/ep1");
    expect(resolveStartDestination("?next=https://evil.example")).toBe("/dashboard");
    expect(resolveStartDestination("?next=//evil.example")).toBe("/dashboard");
    expect(resolveStartDestination("?next=/start")).toBe("/dashboard");
  });
});
