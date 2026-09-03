/**
 * Coordinates the full-screen entry gate (Preloader's "Unlock Premium
 * Skincare Intelligence" modal) with other first-visit UI — namely the
 * cookie consent banner — so they never compete for the visitor's
 * attention at the same time.
 */

const GATE_RESOLVED_EVENT = "skinlabs:entry-gate-resolved";
const GATE_KEY = "skinlabs-gate-shown";

/** True once the entry gate has been shown+dismissed, or will never show this session. */
export const isEntryGateResolved = (): boolean => {
  try {
    return sessionStorage.getItem(GATE_KEY) === "1";
  } catch {
    return true;
  }
};

export const markEntryGateResolved = () => {
  window.dispatchEvent(new Event(GATE_RESOLVED_EVENT));
};

/** Registers `callback` to run once the entry gate resolves; returns an unsubscribe function. */
export const onEntryGateResolved = (callback: () => void): (() => void) => {
  window.addEventListener(GATE_RESOLVED_EVENT, callback);
  return () => window.removeEventListener(GATE_RESOLVED_EVENT, callback);
};
