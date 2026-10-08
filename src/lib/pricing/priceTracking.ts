/**
 * Pure rules for price tracking on review pages: the "Lowest in 30 days" badge and target-price entry.
 * Presentation only; the database decides what is public (view sa_retail_prices) and what fires an alert.
 */

export interface PriceStat {
  retailer_slug: string;
  listing_url: string;
  low_30d: number;
  high_30d: number;
  /** Observations in the window, plus the price in force when it opened. */
  observations: number;
  /** When we first recorded a price for this listing. */
  history_since: string;
}

/** History must reach back this far before a "lowest" claim means anything. */
export const MIN_HISTORY_DAYS = 7;
const EPS = 0.005;

export const statKey = (retailerSlug: string, listingUrl: string): string => `${retailerSlug}|${listingUrl}`;

export function indexStats(stats: readonly PriceStat[]): Map<string, PriceStat> {
  return new Map(stats.map((s) => [statKey(s.retailer_slug, s.listing_url), s]));
}

/**
 * True only when the listing's current price is its lowest of the last 30 days AND the price really was higher at some
 * point in that window, with at least a week of recorded history. A price that never moved, or a listing we only just
 * started tracking, gets no badge (never an empty "lowest" claim).
 */
export function isLowestIn30Days(stat: PriceStat | undefined, currentPrice: number, now: Date = new Date()): boolean {
  if (!stat || !Number.isFinite(currentPrice)) return false;
  if (stat.observations < 2) return false;
  const since = Date.parse(stat.history_since);
  if (!Number.isFinite(since) || now.getTime() - since < MIN_HISTORY_DAYS * 86_400_000) return false;
  return currentPrice <= stat.low_30d + EPS && stat.high_30d > currentPrice + EPS;
}

/** Parses a rand amount typed by a member ("R 199", "199,50", "1 299"). Null when not a usable price (R1 to R50 000). */
export function parseTargetPrice(input: string): number | null {
  const cleaned = input.replace(/[Rr\s]/g, "").replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value >= 1 && value <= 50_000 ? value : null;
}

/** A friendly starting target: about 10% under the current lowest price, rounded down to whole rand. */
export function suggestTarget(currentLowest: number | null): number | null {
  if (!currentLowest || currentLowest < 20) return null;
  return Math.max(1, Math.floor(currentLowest * 0.9));
}

/** Server error codes from set_price_alert -> member-facing text. */
export function priceAlertErrorMessage(message: string | undefined): string {
  if (!message) return "We couldn't save your alert. Please try again.";
  if (message.includes("too_many_alerts")) return "You're tracking 25 products already. Turn one off to add another.";
  if (message.includes("invalid_target")) return "Enter a price between R1 and R50 000.";
  if (message.includes("unknown_product")) return "We can't track a price for this product yet.";
  if (message.includes("not_authenticated")) return "Sign in to track a price.";
  return "We couldn't save your alert. Please try again.";
}
