/**
 * Tiny external store around the CTA ledger so every component on a page sees
 * the same fatigue state (a dismissal in one card hides the action everywhere
 * at once). Browser-only; the pure rules live in ledger.ts.
 */
import { loadLedger, saveLedger, type CtaLedger } from "./ledger";

let currentUser: string | null = null;
let ledger: CtaLedger = {};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Switching accounts on a device swaps the ledger; nothing carries between users. */
export const bindLedgerToUser = (userId: string | null | undefined) => {
  const next = userId ?? null;
  if (next === currentUser) return;
  currentUser = next;
  ledger = loadLedger(next);
  emit();
};

export const getLedger = (): CtaLedger => ledger;

export const subscribeLedger = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const updateLedger = (fn: (l: CtaLedger) => CtaLedger) => {
  const next = fn(ledger);
  if (next === ledger) return;
  ledger = next;
  saveLedger(currentUser, ledger);
  emit();
};

