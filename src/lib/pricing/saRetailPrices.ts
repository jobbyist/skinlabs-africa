/**
 * Presentation rules for live South African retail prices (view `sa_retail_prices`,
 * written by the retailer-price-sync edge function). Pure, so it can be tested.
 * Never authorization; the database only serves matched, recently checked listings.
 */

export interface SaRetailPrice {
  product_slug: string;
  retailer_slug: string;
  retailer_name: string;
  listing_url: string;
  listing_title: string | null;
  listing_size_ml: number | null;
  price_zar: number;
  in_stock: boolean | null;
  price_since: string;
  checked_at: string;
}

/** R1 299 / R130 / R129.50 — whole rand without decimals, spaces for thousands (SA style). */
export function formatRand(value: number): string {
  const hasCents = Math.abs(value - Math.round(value)) > 0.004;
  const fixed = hasCents ? value.toFixed(2) : String(Math.round(value));
  const [whole, cents] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R${grouped}${cents ? `.${cents}` : ""}`;
}

/** Same rule as supabase/functions/_shared/pricing/sanity.ts (parity-tested): SAST calendar days. */
export function checkedLabel(observedAt: Date, now: Date): string {
  const sast = (d: Date) => new Date(d.getTime() + 2 * 3_600_000);
  const day = (d: Date) => Math.floor(sast(d).getTime() / 86_400_000);
  const diff = Math.max(0, day(now) - day(observedAt));
  if (diff === 0) return "checked today";
  if (diff === 1) return "checked yesterday";
  return `checked ${diff} days ago`;
}

export function formatSize(ml: number | null): string | null {
  if (!ml || ml <= 0) return null;
  return ml >= 1000 && ml % 1000 === 0 ? `${ml / 1000}L` : `${Number.isInteger(ml) ? ml : ml.toFixed(1)}ml`;
}

export interface PriceGroup {
  /** Pack size in ml, or null when the listings don't state one. */
  sizeMl: number | null;
  rows: SaRetailPrice[];
}

/**
 * Prices are only comparable within one pack size, so rows are grouped by size
 * (smallest first, unknown size last) and sorted cheapest-first inside each group.
 */
export function groupPrices(rows: SaRetailPrice[]): PriceGroup[] {
  const bySize = new Map<number | null, SaRetailPrice[]>();
  for (const r of rows) {
    const key = r.listing_size_ml && r.listing_size_ml > 0 ? r.listing_size_ml : null;
    bySize.set(key, [...(bySize.get(key) ?? []), r]);
  }
  return [...bySize.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([sizeMl, group]) => ({
      sizeMl,
      rows: [...group].sort((x, y) => x.price_zar - y.price_zar || x.retailer_name.localeCompare(y.retailer_name)),
    }));
}

/** Only an explicit "out of stock" is stated; an unknown stock state is simply not mentioned. */
export function stockLabel(inStock: boolean | null): string | null {
  return inStock === false ? "Out of stock" : null;
}
