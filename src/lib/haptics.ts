/**
 * Haptic feedback: one featherweight pulse (`navigator.vibrate([15])`) on key touch points.
 * Supported on Android browsers; iOS Safari has no Vibration API, so it is a silent no-op there.
 * Never fires for reduced-motion visitors, automation, or members who switched it off (Settings → App).
 */
const STORAGE_KEY = "skinlabs:haptics";
export const HAPTIC_PULSE: number[] = [15];

/** Selectors for the delegated listener; anything else opts in with `data-haptic`. */
export const HAPTIC_SELECTOR = [
  "[data-haptic]",
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  'nav[aria-label="Primary"] a',
  'nav[aria-label="Primary"] button',
].join(",");

export const hapticsPreference = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

export const setHapticsPreference = (on: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable: the choice just doesn't persist */
  }
};

export const hapticsSupported = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const reducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fire one pulse. Returns whether a vibration was requested. */
export const haptic = (): boolean => {
  if (!hapticsSupported() || navigator.webdriver || reducedMotion() || !hapticsPreference()) return false;
  try {
    return navigator.vibrate(HAPTIC_PULSE);
  } catch {
    return false;
  }
};

/** One delegated listener for the whole app (main.tsx). Returns a cleanup for tests. */
export const installHaptics = (): (() => void) => {
  if (typeof document === "undefined" || !hapticsSupported()) return () => undefined;
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const el = (event.target as Element | null)?.closest?.(HAPTIC_SELECTOR) as HTMLElement | null;
    if (!el || el.matches(":disabled,[aria-disabled='true'],[data-haptic='off']")) return;
    haptic();
  };
  document.addEventListener("pointerup", onPointerUp, { capture: true, passive: true });
  return () => document.removeEventListener("pointerup", onPointerUp, true);
};
