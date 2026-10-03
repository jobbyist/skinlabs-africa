import { MAX_PRICE_ZAR, MIN_PRICE_ZAR } from "./parse.ts";

// Guards between "the page said R x" and "we record R x".

/** A price must move by more than this fraction before we ask for a second reading. */
export const SWING_FRACTION = 0.5;
/** Unchanged prices are re-recorded at most this often (so history stays small but alive). */
export const HEARTBEAT_DAYS = 30;
/** Shown to visitors only while the observation is at most this old. */
export const MAX_DISPLAY_AGE_DAYS = 14;

export type ObservationAction =
  | { action: "record"; reason: "first" | "changed" | "heartbeat" | "confirmed_swing" }
  | { action: "skip"; reason: "unchanged" }
  | { action: "hold"; reason: "unconfirmed_swing" }
  | { action: "reject"; reason: "out_of_range" };

export interface PriorObservation {
  priceZar: number;
  recordedAt: Date;
}

/**
 * Decide what to do with a freshly parsed price.
 * `pendingSwingZar` = the same out-of-pattern price seen on the previous run; two
 * identical readings in a row confirm a big move (a real sale/price change), one doesn't.
 */
export function evaluateObservation(next: number, prior: PriorObservation | null, now: Date, pendingSwingZar: number | null = null): ObservationAction {
  if (!Number.isFinite(next) || next < MIN_PRICE_ZAR || next > MAX_PRICE_ZAR) return { action: "reject", reason: "out_of_range" };
  if (!prior) return { action: "record", reason: "first" };

  const change = Math.abs(next - prior.priceZar) / prior.priceZar;
  if (change === 0) {
    const ageDays = (now.getTime() - prior.recordedAt.getTime()) / 86_400_000;
    return ageDays >= HEARTBEAT_DAYS ? { action: "record", reason: "heartbeat" } : { action: "skip", reason: "unchanged" };
  }
  if (change > SWING_FRACTION) {
    return pendingSwingZar !== null && Math.abs(pendingSwingZar - next) < 0.005
      ? { action: "record", reason: "confirmed_swing" }
      : { action: "hold", reason: "unconfirmed_swing" };
  }
  return { action: "record", reason: "changed" };
}

export type Freshness = "fresh" | "recent" | "stale";

/** fresh <= 3 days, recent <= 14 days, otherwise stale (never shown). */
export function priceFreshness(observedAt: Date, now: Date): Freshness {
  const days = (now.getTime() - observedAt.getTime()) / 86_400_000;
  if (days <= 3) return "fresh";
  if (days <= MAX_DISPLAY_AGE_DAYS) return "recent";
  return "stale";
}

/** "checked today", "checked yesterday", "checked 5 days ago" in South African calendar days. */
export function checkedLabel(observedAt: Date, now: Date): string {
  const sast = (d: Date) => new Date(d.getTime() + 2 * 3_600_000);
  const day = (d: Date) => Math.floor(sast(d).getTime() / 86_400_000);
  const diff = Math.max(0, day(now) - day(observedAt));
  if (diff === 0) return "checked today";
  if (diff === 1) return "checked yesterday";
  return `checked ${diff} days ago`;
}
