/**
 * Which price (if any) a review card or comparison may show: a LIVE one only.
 *   - OpenHaus: view `review_live_prices` (supplier page read by openhaus-price-sync, no Firecrawl)
 *   - Retailers: view `sa_retail_prices` (matched, recently checked listings)
 * Anything else is an editorial snapshot and is not shown as a price. Pure, so it can be tested.
 */

export interface LivePrice {
  priceZar: number;
  /** "OpenHaus", "Clicks", "Dis-Chem", … */
  source: string;
  checkedAt: string;
}

export interface LivePriceRow {
  id: string;
  price_zar: number | string;
  source: string;
  checked_at: string;
}

/** Cheapest live price per review/product id. */
export function indexLivePrices(rows: LivePriceRow[]): Map<string, LivePrice> {
  const out = new Map<string, LivePrice>();
  for (const r of rows) {
    const price = Number(r.price_zar);
    if (!r.id || !Number.isFinite(price) || price <= 0) continue;
    const cur = out.get(r.id);
    if (!cur || price < cur.priceZar) out.set(r.id, { priceZar: price, source: r.source, checkedAt: r.checked_at });
  }
  return out;
}

export type PriceBand = "all" | "under-200" | "200-500" | "over-500";

/** A product without a live price is never placed in a price band (we don't guess). */
export function inPriceBand(price: number | null, band: PriceBand | string): boolean {
  if (band === "all") return true;
  if (price === null) return false;
  if (band === "under-200") return price < 200;
  if (band === "200-500") return price >= 200 && price <= 500;
  if (band === "over-500") return price > 500;
  return true;
}

/** Sort comparator on live price; products with no live price go last either way. */
export function compareByLivePrice(a: number | null, b: number | null, direction: "asc" | "desc"): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}
