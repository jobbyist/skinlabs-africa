// OpenHaus marketplace pricing — Deno copy. Must stay in sync with
// src/lib/marketplace/pricing.ts (the two runtimes can't share a module).
// Source (Faithful to Nature) price * 1.04, charm-rounded UP to R__.99.

const MARKUP_RATE = 1.04;

export function computeMarkedUpPrice(sourcePriceZar: number): number {
  const raw = sourcePriceZar * MARKUP_RATE;
  return Math.ceil(raw) - 0.01;
}
