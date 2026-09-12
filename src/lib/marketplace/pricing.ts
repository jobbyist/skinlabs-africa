/**
 * OpenHaus marketplace pricing.
 *
 * Prices are the source (Faithful to Nature) price marked up 4%, then
 * charm-rounded UP to the nearest R__.99 — e.g. a raw markup of R103.42
 * becomes R103.99, never rounded down. This must stay in sync with the
 * Deno copy at supabase/functions/_shared/marketplace-pricing.ts (the two
 * runtimes can't share a module import).
 */

const MARKUP_RATE = 1.04;

export function computeMarkedUpPrice(sourcePriceZar: number): number {
  const raw = sourcePriceZar * MARKUP_RATE;
  return Math.ceil(raw) - 0.01;
}

export function formatZar(amount: number): string {
  return `R${amount.toFixed(2)}`;
}
