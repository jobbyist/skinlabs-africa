// Review-price extraction for the six retailers SkinLabs tracks per published review:
// Takealot, Dis-Chem, Clicks, Dermastore, SkinMiles and Faithful to Nature.
//
// Search results come from Parallel Search (default) or Nimble (fallback); this module is the
// pure part that turns those results into price CANDIDATES. Nothing here is public: every
// candidate lands as `pending` and a person approves it in Admin > SA Prices before it is shown.
// No model reads a price. A price is only taken from the text of a retailer PRODUCT page that
// the strict matcher (match.ts) accepts as the same product; anything ambiguous is dropped.
import { parseSizeMl, scoreMatch, type MatchTarget } from "./match.ts";

export type ReviewRetailerSlug = "takealot" | "dis-chem" | "clicks" | "dermastore" | "skinmiles" | "faithful-to-nature" | "brand-direct";

export interface ReviewRetailer {
  slug: ReviewRetailerSlug;
  name: string;
  /** Domain handed to the search engines as an allow-list entry. */
  domain: string;
  hosts: string[];
  /** Pathname of a single product page (never a category, brand or search page). */
  productPath: RegExp;
}

// Path prefixes that are never product pages on the single-segment shops.
const NON_PRODUCT_SEGMENT = /^(brands?|search|catalogsearch|catalog|category|categories|collections?|blog|blogs|pages?|cart|checkout|account|customer|shop|sale|new|skin-?care|skin|face|body|hair|sun|makeup|about|contact|help|stores?)$/i;

const singleSegmentProduct = (path: RegExp) => path;

export const REVIEW_RETAILERS: ReviewRetailer[] = [
  { slug: "takealot", name: "Takealot", domain: "takealot.com", hosts: ["takealot.com", "www.takealot.com"], productPath: /^\/[a-z0-9][a-z0-9-]*\/PLID\d+$/i },
  { slug: "dis-chem", name: "Dis-Chem", domain: "dischem.co.za", hosts: ["dischem.co.za", "www.dischem.co.za"], productPath: /^\/[a-z0-9][a-z0-9-]*-\d+$/ },
  { slug: "clicks", name: "Clicks", domain: "clicks.co.za", hosts: ["clicks.co.za", "www.clicks.co.za"], productPath: /^\/[^/]+\/p\/\d+$/ },
  { slug: "dermastore", name: "Dermastore", domain: "dermastore.co.za", hosts: ["dermastore.co.za", "www.dermastore.co.za"], productPath: singleSegmentProduct(/^\/[a-z0-9][a-z0-9-]+$/) },
  // skinmiles.com is the live shop (product pages are /product/<slug>); the .co.za host is kept for older stored listings.
  { slug: "skinmiles", name: "SkinMiles", domain: "skinmiles.com", hosts: ["skinmiles.com", "www.skinmiles.com", "skinmiles.co.za", "www.skinmiles.co.za"], productPath: /^\/(?:products?\/)?[a-z0-9][a-z0-9-]+(?:\.html)?$/ },
  {
    slug: "faithful-to-nature",
    name: "Faithful to Nature",
    domain: "faithful-to-nature.co.za",
    hosts: ["faithful-to-nature.co.za", "www.faithful-to-nature.co.za"],
    productPath: /^\/[a-z0-9][a-z0-9-]+(?:\.html)?$/,
  },
];

export const REVIEW_RETAILER_SLUGS = REVIEW_RETAILERS.map((r) => r.slug);

export interface CanonicalReviewUrl {
  retailer: ReviewRetailerSlug;
  url: string;
}

/** Product pages on a brand's own shop: /products/x (Shopify), /product/x (WooCommerce), /shop/x, or one slug. */
const BRAND_PRODUCT_PATH = /^\/(?:(?:collections\/[a-z0-9-]+\/)?products?|shop|store)\/[a-z0-9][a-z0-9-]*$|^\/[a-z0-9][a-z0-9-]{3,}$/i;
const BRAND_NON_PRODUCT = /^(collections?|cart|checkout|pages?|blogs?|policies|account|search|shop|store|products?|brands?|about|contact|faqs?|blog|login|register|stockists|wishlist)$/i;

/**
 * https, no query/fragment/userinfo, a known retailer host (or one of the brand's own domains),
 * and a path shaped like ONE product page.
 */
export function canonicalReviewListingUrl(raw: string, brandDomains: string[] = []): CanonicalReviewUrl | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const host = u.hostname.toLowerCase();
  const path = u.pathname.replace(/\/+$/, "");
  const retailer = REVIEW_RETAILERS.find((r) => r.hosts.includes(host));
  if (retailer) {
    if (!retailer.productPath.test(path)) return null;
    const first = path.split("/")[1] ?? "";
    if (retailer.slug !== "takealot" && retailer.slug !== "clicks" && NON_PRODUCT_SEGMENT.test(first.replace(/\.html$/, ""))) return null;
    return { retailer: retailer.slug, url: `https://${host}${path}` };
  }
  const bare = host.replace(/^www\./, "");
  if (brandDomains.some((d) => d.toLowerCase().replace(/^www\./, "") === bare)) {
    if (!BRAND_PRODUCT_PATH.test(path)) return null;
    const segs = path.split("/").filter(Boolean);
    if (segs.length === 1 && BRAND_NON_PRODUCT.test(segs[0])) return null;
    // Shopify serves one product under /collections/x/products/y; the product path is its identity.
    const canonicalPath = /\/products\/[^/]+$/.test(path) ? path.slice(path.lastIndexOf("/products/")) : path;
    return { retailer: "brand-direct", url: `https://${host}${canonicalPath}` };
  }
  return null;
}

// ---- price reading -------------------------------------------------------------------------------

const RAND = /\bR\s?(\d{1,3}(?:[ \u00a0,]\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?!\d)/g;

export function parseRandToken(token: string): number | null {
  const n = Number(token.replace(/[ \u00a0,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export interface ReadPrice {
  /** The listed (regular) price. */
  priceZar: number;
  /** A promotional / "Special Price" figure shown next to it, when lower. */
  specialPriceZar: number | null;
  inStock: boolean | null;
  /** More than one unrelated price in the product block: the figure is a best guess and a person must check it. */
  ambiguous: boolean;
}

const MIN_PRICE = 1;
const MAX_PRICE = 50_000;

/**
 * Reads the product's own price from the START of a product-page excerpt (the buy box comes before
 * "related products"). "R 399.00 Special Price R 359.10" -> listed 399, special 359.10.
 */
export function readPriceFromExcerpt(text: string): ReadPrice | null {
  const head = text.slice(0, 700);
  const found: { value: number; index: number }[] = [];
  RAND.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RAND.exec(head)) !== null) {
    const value = parseRandToken(m[1]);
    if (value !== null && value >= MIN_PRICE && value <= MAX_PRICE) found.push({ value, index: m.index });
  }
  if (found.length === 0) return null;
  const first = found[0];

  // A "Special/Sale/Now" price directly after the first figure belongs to the same product.
  let special: number | null = null;
  const second = found[1];
  if (second && second.value < first.value) {
    const between = head.slice(first.index, second.index).toLowerCase();
    if (/(special|sale|now|promo|save|discount|was)/.test(between) && second.index - first.index < 80) special = second.value;
  }
  const distinct = new Set(found.map((f) => f.value));
  if (special !== null) distinct.delete(special);
  // Repeats of the same price (title + gallery + buy box) are normal; a different price is not.
  const ambiguous = distinct.size > 1;

  const lower = head.toLowerCase();
  const inStock = /out of stock|sold out|currently unavailable|notify me when/.test(lower)
    ? false
    : /in stock|add to (cart|basket|bag)|available for (click|collect)|add to trolley/.test(text.slice(0, 1200).toLowerCase())
      ? true
      : null;

  return { priceZar: first.value, specialPriceZar: special, inStock, ambiguous };
}

// ---- candidates ---------------------------------------------------------------------------------

export interface PriceSearchResult {
  url: string;
  title?: string | null;
  /** Page excerpts (Parallel) or snippet/content (Nimble). */
  text: string;
}

export interface ReviewPriceCandidate {
  retailer: ReviewRetailerSlug;
  url: string;
  title: string;
  priceZar: number;
  specialPriceZar: number | null;
  inStock: boolean | null;
  sizeMl: number | null;
  confidence: number;
  /** needs_attention = a person should look twice (ambiguous price, unknown size, weak name match). */
  needsAttention: boolean;
  reasons: string[];
  evidence: string;
}

const MAX_PER_RETAILER = 2;

/**
 * For each retailer: the product pages that (a) are real product URLs, (b) pass the strict matcher and
 * (c) show a readable price. At most two per retailer (two pack sizes); a person picks.
 */
export function buildReviewPriceCandidates(target: MatchTarget, results: PriceSearchResult[], brandDomains: string[] = []): ReviewPriceCandidate[] {
  const seen = new Set<string>();
  const pages: { retailer: ReviewRetailerSlug; url: string; title: string; text: string }[] = [];
  for (const r of results) {
    const canon = canonicalReviewListingUrl(r.url, brandDomains);
    if (!canon) continue;
    const key = canon.retailer === "takealot" ? (/PLID\d+/i.exec(canon.url)?.[0].toUpperCase() ?? canon.url) : canon.url;
    if (seen.has(key)) continue;
    seen.add(key);
    pages.push({ retailer: canon.retailer, url: canon.url, title: (r.title ?? "").trim(), text: r.text ?? "" });
  }

  const out: ReviewPriceCandidate[] = [];
  for (const slug of [...REVIEW_RETAILER_SLUGS, "brand-direct" as ReviewRetailerSlug]) {
    const mine = pages.filter((p) => p.retailer === slug);
    // Sizes on offer at this retailer feed the matcher so an unsized target with several sizes goes to a person.
    const scored = mine.map((p) => {
      const titles = [p.title, firstLine(p.text)].filter(Boolean);
      return { p, titles, first: scoreMatch(target, titles) };
    });
    const sizes = scored.filter((s) => s.first.decision !== "rejected" && s.first.listingSizeMl).map((s) => s.first.listingSizeMl as number);
    const plausible = scored.filter((s) => s.first.decision !== "rejected").length;

    const cands: ReviewPriceCandidate[] = [];
    for (const s of scored) {
      const match = scoreMatch(target, s.titles, [...new Set(sizes)], plausible);
      if (match.decision === "rejected") continue;
      const price = readPriceFromExcerpt(s.p.text);
      if (!price) continue;
      const sizeMl = match.listingSizeMl ?? parseSizeMl(s.p.title) ?? null;
      const reasons = [...match.reasons];
      if (price.ambiguous) reasons.push("several different prices in the page excerpt");
      if (price.specialPriceZar !== null) reasons.push(`special price R${price.specialPriceZar} next to list price R${price.priceZar}`);
      cands.push({
        retailer: slug,
        url: s.p.url,
        title: s.p.title || firstLine(s.p.text),
        priceZar: price.priceZar,
        specialPriceZar: price.specialPriceZar,
        inStock: price.inStock,
        sizeMl,
        confidence: match.confidence,
        needsAttention: price.ambiguous || match.decision !== "matched" || sizeMl === null,
        reasons,
        evidence: s.p.text.replace(/\s+/g, " ").slice(0, 300),
      });
    }
    cands.sort((a, b) => Number(a.needsAttention) - Number(b.needsAttention) || b.confidence - a.confidence);
    out.push(...cands.slice(0, MAX_PER_RETAILER));
  }
  return out;
}

function firstLine(text: string): string {
  return (text.split(/\n/).map((l) => l.trim()).find((l) => l.length > 3) ?? "").slice(0, 160);
}

/** One query per retailer so a single search call covers all six shops. */
export function buildSearchQueries(target: MatchTarget): string[] {
  const name = `${target.brand} ${target.name}`.replace(/\s+/g, " ").trim();
  return REVIEW_RETAILERS.map((r) => `${name} ${r.domain}`);
}

export function searchObjective(target: MatchTarget): string {
  return `Find the current South African rand price of "${target.brand} ${target.name}" on the product pages of Takealot, Dis-Chem, Clicks, Dermastore, SkinMiles and Faithful to Nature. Prefer individual product pages over category pages.`;
}

// ---- schedule rules -----------------------------------------------------------------------------

/** Prices older than this are hidden from the public site (view sa_retail_prices) and re-verified. */
export const PRICE_MAX_AGE_DAYS = 30;
/** Targets are re-checked a little before the 30-day limit so a price never lapses between checks. */
export const RECHECK_AFTER_DAYS = 25;
/** A product with no listing found is retried sooner. */
export const EMPTY_RETRY_DAYS = 7;

export function nextCheckAt(now: Date, foundAny: boolean): Date {
  return new Date(now.getTime() + (foundAny ? RECHECK_AFTER_DAYS : EMPTY_RETRY_DAYS) * 86_400_000);
}

/** An already-approved listing may refresh its price automatically only for a modest move; bigger swings go back to a person. */
export const AUTO_REFRESH_MAX_SWING = 0.5;
export function canAutoRefresh(prior: number, next: number): boolean {
  if (!(prior > 0) || !(next > 0)) return false;
  return Math.abs(next - prior) / prior <= AUTO_REFRESH_MAX_SWING;
}
