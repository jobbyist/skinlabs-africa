/**
 * Price snapshots that came with a review (the `retailers` column / static catalogue).
 * They are NOT live: they were captured once, and many static ones point at a retailer's
 * home page with no date. This decides what, if anything, may still be shown, and how:
 * only a retailer entry with a real product-page URL and a known review date, worded
 * "at review time", never "in stock" and never as today's price.
 */

export interface EditorialListing {
  retailer: string;
  price_zar: number;
  in_stock?: boolean;
  url?: string | null;
}

export interface ReviewTimeSnapshot {
  /** ISO date of the review the prices were captured for. */
  asOf: string;
  rows: { retailer: string; price_zar: number; url: string }[];
}

function isProductPageUrl(raw: string | null | undefined): raw is string {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return (u.protocol === "https:" || u.protocol === "http:") && u.pathname.replace(/\/+$/, "").length > 1;
  } catch {
    return false;
  }
}

export function reviewTimeSnapshot(listings: EditorialListing[] | null | undefined, reviewDate: string | null | undefined): ReviewTimeSnapshot | null {
  if (!listings?.length || !reviewDate || Number.isNaN(new Date(reviewDate).getTime())) return null;
  const rows = listings
    .filter((l) => Number.isFinite(l.price_zar) && l.price_zar > 0 && isProductPageUrl(l.url))
    .map((l) => ({ retailer: l.retailer, price_zar: l.price_zar, url: l.url as string }))
    .sort((a, b) => a.price_zar - b.price_zar);
  return rows.length ? { asOf: reviewDate, rows } : null;
}
