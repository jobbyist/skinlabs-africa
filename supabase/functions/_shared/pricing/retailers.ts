// Retailer rules for the SA price pipeline. Derived from each site's robots.txt
// (read 2026-10-03) so the crawler stays inside what the retailers allow:
//  - Clicks: product pages allowed; asks for a 10 s crawl delay and visits only
//    between 04:00 and 08:45 UTC (`Crawl-delay: 10`, `Visit-time: 0400-0845`).
//  - Dis-Chem: product pages allowed for generic crawlers; anything with a query
//    string (`Disallow: /*?*`) is not, and named AI crawlers are blocked, so URLs are
//    stored without query strings or tracking parameters.
//  - Takealot: product (PLID) pages allowed; sort/filter/search query URLs are not.
// Re-check robots.txt when adding a retailer or if fetching starts failing.

export type RetailerSlug = "clicks" | "dis-chem" | "takealot";

export interface RetailerPolicy {
  /** Product pages are readable with a plain, polite HTTP request (no Firecrawl, no credits). Never set for a retailer that serves a bot challenge. */
  directFetch?: boolean;
  slug: RetailerSlug;
  name: string;
  hosts: string[];
  /** Matches the URL pathname of a single product page (never a category/search page). */
  productPath: RegExp;
  /** Minimum gap between two requests to this retailer. */
  minIntervalMs: number;
  /** UTC minutes-of-day [start, end] during which fetching is allowed; absent = any time. */
  utcWindow?: { startMinute: number; endMinute: number };
  /** `site:` host used for discovery searches. */
  searchHost: string;
}

export const RETAILER_POLICIES: Record<RetailerSlug, RetailerPolicy> = {
  clicks: {
    slug: "clicks",
    name: "Clicks",
    hosts: ["clicks.co.za", "www.clicks.co.za"],
    productPath: /^\/[^/]+\/p\/\d+$/,
    minIntervalMs: 10_000,
    utcWindow: { startMinute: 4 * 60, endMinute: 8 * 60 + 45 },
    searchHost: "clicks.co.za",
    directFetch: true,
  },
  "dis-chem": {
    slug: "dis-chem",
    name: "Dis-Chem",
    hosts: ["dischem.co.za", "www.dischem.co.za"],
    // e.g. /niacinamide-10-zinc-1-the-ordinary-765 (slug ending in the product id)
    productPath: /^\/[a-z0-9][a-z0-9-]*-\d+$/,
    minIntervalMs: 5_000,
    searchHost: "dischem.co.za",
  },
  takealot: {
    slug: "takealot",
    name: "Takealot",
    hosts: ["takealot.com", "www.takealot.com"],
    productPath: /^\/[a-z0-9][a-z0-9-]*\/PLID\d+$/i,
    minIntervalMs: 5_000,
    searchHost: "takealot.com",
  },
};

export function isRetailerSlug(value: string): value is RetailerSlug {
  return value in RETAILER_POLICIES;
}

export interface CanonicalListingUrl {
  retailer: RetailerSlug;
  url: string;
}

/**
 * Returns the canonical product URL (https, no query string or fragment) and the
 * retailer it belongs to, or null for anything that is not a plain product page:
 * other hosts, category/search pages, non-https, userinfo, odd ports.
 */
export function canonicalListingUrl(raw: string): CanonicalListingUrl | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const host = u.hostname.toLowerCase();
  for (const policy of Object.values(RETAILER_POLICIES)) {
    if (!policy.hosts.includes(host)) continue;
    const path = u.pathname.replace(/\/+$/, "");
    if (!policy.productPath.test(path)) return null;
    // Takealot: a trailing /product-information style suffix is not part of the product URL.
    return { retailer: policy.slug, url: `https://${host}${path}` };
  }
  return null;
}

/** Whether the retailer's published visiting window (if any) allows a request at `now`. */
export function isWithinVisitWindow(policy: RetailerPolicy, now: Date): boolean {
  if (!policy.utcWindow) return true;
  const minute = now.getUTCHours() * 60 + now.getUTCMinutes();
  return minute >= policy.utcWindow.startMinute && minute <= policy.utcWindow.endMinute;
}

/**
 * Retailers deliberately switched off. Takealot is paused (owner decision, 2026-10-03) to stay inside
 * Firecrawl's free allowance; its listings keep their data but are neither discovered nor refreshed.
 * Remove a slug here (and re-add its cron jobs) to resume.
 */
export const DISABLED_RETAILERS: RetailerSlug[] = ["takealot"];

export function isRetailerEnabled(slug: RetailerSlug): boolean {
  return !DISABLED_RETAILERS.includes(slug);
}
