/**
 * Pure rules for discovering what product-review-sync reviews next (no I/O, unit-tested).
 *
 * The pipeline reviews 60% local South African brands and 40% imports (international brands sold in
 * South Africa, labelled "Import" on the site). Candidates are product pages found with Parallel
 * Search (default) / Nimble (fallback) on the trusted SA retailers or the brand's own shop; Firecrawl
 * reads a page in full when the search excerpt is too thin. Nothing here is a model call, and a
 * brand's name or price is never invented: a candidate needs a real product-page URL, the brand named
 * in the page text and a Rand price in the page text.
 */
import {
  canonicalReviewListingUrl,
  parseRandToken,
  REVIEW_RETAILERS,
  type ReviewRetailerSlug,
} from "../pricing/reviewPrices.ts";

export type Origin = "south_africa" | "global_available_in_sa";

export interface BrandSeed {
  name: string;
  origin: Origin;
  /** Brand's own shop, only where it is already known to the repo; other brand shops are recognised from search hits. */
  domains?: string[];
  /** A disclosed commercial placement (see the Timeless placements). */
  sponsored?: boolean;
}

/** 60% of daily reviews. Seeds are search starting points, never claims about a product. */
export const LOCAL_BRANDS: BrandSeed[] = [
  { name: "Sundae Skin", origin: "south_africa" },
  { name: "Zero BS", origin: "south_africa" },
  { name: "Silki", origin: "south_africa" },
  { name: "Faithful to Nature", origin: "south_africa" },
  { name: "SkinBliss", origin: "south_africa" },
  { name: "SOiL", origin: "south_africa" },
  { name: "Simply Bee", origin: "south_africa" },
  { name: "Essentially Natural", origin: "south_africa" },
  { name: "Sorbet Skin", origin: "south_africa" },
  { name: "SKOON", origin: "south_africa" },
  { name: "Geve Skincare", origin: "south_africa", domains: ["geveskincare.com"] },
  { name: "Orobaa", origin: "south_africa", domains: ["orobaa.africa"] },
  { name: "Kloom", origin: "south_africa", domains: ["kloom.co.za"] },
  { name: "Africology", origin: "south_africa" },
  { name: "Oh Lief", origin: "south_africa" },
  { name: "Lelive", origin: "south_africa" },
  { name: "Esse", origin: "south_africa" },
  { name: "Standard Beauty", origin: "south_africa" },
];

/** 40% of daily reviews ("Imports"). */
export const IMPORT_BRANDS: BrandSeed[] = [
  { name: "Timeless Skin Care", origin: "global_available_in_sa", domains: ["timelessha.com"], sponsored: true },
  { name: "Moroccanoil", origin: "global_available_in_sa" },
  { name: "COSRX", origin: "global_available_in_sa" },
  { name: "Beauty of Joseon", origin: "global_available_in_sa" },
  { name: "Anua", origin: "global_available_in_sa" },
  { name: "Round Lab", origin: "global_available_in_sa" },
  { name: "SKIN1004", origin: "global_available_in_sa" },
  { name: "Innisfree", origin: "global_available_in_sa" },
  { name: "CeraVe", origin: "global_available_in_sa" },
  { name: "La Roche-Posay", origin: "global_available_in_sa" },
  { name: "The Ordinary", origin: "global_available_in_sa" },
  { name: "Bioderma", origin: "global_available_in_sa" },
  { name: "Eucerin", origin: "global_available_in_sa" },
  { name: "Paula's Choice", origin: "global_available_in_sa" },
  { name: "Cetaphil", origin: "global_available_in_sa" },
  { name: "Neutrogena", origin: "global_available_in_sa" },
];

export const IMPORT_SHARE_TARGET = 0.4;
export const MIN_DAILY_REVIEWS = 5;
export const MAX_DAILY_REVIEWS = 10;
export const DEFAULT_DAILY_REVIEWS = 8;

/** Clamp an env override to the 5-10 band the editorial brief allows. */
export function resolveDailyCap(raw: string | undefined | null): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DAILY_REVIEWS;
  return Math.min(MAX_DAILY_REVIEWS, Math.max(MIN_DAILY_REVIEWS, n));
}

export interface OriginCounts {
  local: number;
  imports: number;
}

/** The origin whose addition leaves the day's mix closest to 60/40. Ties go to local. */
export function nextOrigin(counts: OriginCounts): Origin {
  const total = counts.local + counts.imports + 1;
  const ifLocal = Math.abs(counts.imports / total - IMPORT_SHARE_TARGET);
  const ifImport = Math.abs((counts.imports + 1) / total - IMPORT_SHARE_TARGET);
  return ifImport < ifLocal ? "global_available_in_sa" : "south_africa";
}

/** The origins of the next `slots` reviews, given what was already published today. */
export function planOrigins(already: OriginCounts, slots: number): Origin[] {
  const counts = { ...already };
  const plan: Origin[] = [];
  for (let i = 0; i < slots; i++) {
    const origin = nextOrigin(counts);
    plan.push(origin);
    if (origin === "south_africa") counts.local += 1;
    else counts.imports += 1;
  }
  return plan;
}

/** Lower-case letters and digits only, for comparing brand spellings ("SKOON." == "Skoon", "Gève" == "Geve"). */
export function brandKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Does the brand a model returned belong to the brand we searched for? Either spelling may be the longer one. */
export function brandMatches(seedName: string, returnedBrand: string): boolean {
  const a = brandKey(seedName);
  const b = brandKey(returnedBrand);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/** Small deterministic PRNG (mulberry32) so a run's brand rotation is reproducible from its id. */
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Brands to search this run: the least-reviewed first (so the catalogue spreads across brands rather
 * than piling onto one), ties shuffled by the run seed.
 */
export function pickBrands(origin: Origin, reviewedByBrand: Map<string, number>, count: number, seed: number): BrandSeed[] {
  const pool = origin === "south_africa" ? LOCAL_BRANDS : IMPORT_BRANDS;
  const random = rng(seed);
  return pool
    .map((brand) => ({ brand, reviewed: reviewedByBrand.get(brandKey(brand.name)) ?? 0, jitter: random() }))
    .sort((x, y) => x.reviewed - y.reviewed || x.jitter - y.jitter)
    .slice(0, Math.max(0, count))
    .map((x) => x.brand);
}

/** Tally reviewed brands by brandKey so spelling variants share one count. */
export function countReviewsByBrand(brands: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const b of brands) {
    const key = brandKey(b);
    if (key) out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

export function discoveryObjective(brand: BrandSeed): string {
  return (
    `Find individual skincare PRODUCT pages (a single product with a Rand price, not a category, brand or search page) for the brand "${brand.name}" ` +
    `sold in South Africa. Prefer the brand's own online shop and these South African retailers: Faithful to Nature, Clicks, Dis-Chem, Takealot, ` +
    `Dermastore, SkinMiles, BeautyOnTapp. Face skincare only: cleansers, serums, moisturisers, sunscreens, exfoliants, eye creams, mists, body skincare.`
  );
}

export function discoveryQueries(brand: BrandSeed): string[] {
  const n = brand.name;
  return [
    `${n} skincare South Africa buy online price rand`,
    `${n} serum moisturiser cleanser sunscreen clicks.co.za OR dischem.co.za OR takealot.com`,
    `${n} faithful-to-nature.co.za OR dermastore.co.za OR skinmiles.co.za OR beautyontapp.co.za`,
  ];
}

export interface RawHit {
  url: string;
  title?: string | null;
  text: string;
}

export interface DiscoveredCandidate {
  brand: BrandSeed;
  url: string;
  retailer: ReviewRetailerSlug;
  /** Display name for where_to_buy / retailers[]. */
  retailerName: string;
  title: string;
  text: string;
  /** Rand prices read from the page text (first = the product's own price). Empty when none was found. */
  prices: number[];
}

const RAND_TOKEN = /\bR\s?(\d{1,3}(?:[ \u00a0,]\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?!\d)/g;

/** Distinct plausible Rand prices in the first part of a page (buy box first, related products after). */
export function detectPrices(text: string, limit = 4): number[] {
  const found: number[] = [];
  RAND_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  const head = text.slice(0, 2500);
  while ((m = RAND_TOKEN.exec(head)) !== null) {
    const value = parseRandToken(m[1]);
    if (value !== null && value >= 20 && value <= 20000 && !found.includes(value)) found.push(value);
    if (found.length >= limit) break;
  }
  return found;
}

const RETAILER_NAME: Record<ReviewRetailerSlug, string> = {
  takealot: "Takealot",
  "dis-chem": "Dis-Chem",
  clicks: "Clicks",
  dermastore: "Dermastore",
  skinmiles: "SkinMiles",
  "faithful-to-nature": "Faithful to Nature",
  "brand-direct": "Brand Direct",
};

/**
 * Brand, category and "shop by" pages pass the URL shape check on single-slug shops (Faithful to Nature serves
 * /skinbliss-brand and /simply-bee). Reject a slug that is the brand itself or a brand/range page, and any page that
 * lists many different prices (a grid of products, not one product).
 */
export function looksLikeListing(url: string, brand: BrandSeed, text: string): boolean {
  let slug = "";
  try {
    slug = new URL(url).pathname.split("/").filter(Boolean).pop()?.replace(/\.html$/, "") ?? "";
  } catch {
    return true;
  }
  const slugKey = brandKey(slug);
  const brandK = brandKey(brand.name);
  if (slugKey === brandK || slugKey === `${brandK}brand` || /(^|-)(brands?|range|collections?|category|categories)(-|$)/.test(slug)) return true;
  const grid = new Set<number>();
  RAND_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  const head = text.slice(0, 6000);
  while ((m = RAND_TOKEN.exec(head)) !== null) {
    const v = parseRandToken(m[1]);
    if (v !== null) grid.add(v);
  }
  return grid.size >= 12;
}

/** Hosts in the hits that look like this brand's own shop ("sundaeskin.co.za" for "Sundae Skin"). */
export function brandDomainsFromHits(brand: BrandSeed, hits: RawHit[]): string[] {
  const key = brandKey(brand.name);
  const out = new Set<string>((brand.domains ?? []).map((d) => d.toLowerCase()));
  for (const hit of hits) {
    let host: string;
    try {
      host = new URL(hit.url).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      continue;
    }
    if (REVIEW_RETAILERS.some((r) => r.hosts.includes(host) || r.hosts.includes(`www.${host}`))) continue;
    const label = brandKey(host.split(".")[0] ?? "");
    if (label.length >= 4 && (key.includes(label) || label.includes(key))) out.add(host);
  }
  return [...out];
}

/**
 * Hits -> candidates a model may be shown. A hit survives only if it is ONE product page on a trusted
 * retailer or the brand's own shop, names the brand, and carries a Rand price. Duplicates (by URL)
 * and URLs we already reviewed are dropped.
 */
export function buildDiscoveredCandidates(brand: BrandSeed, hits: RawHit[], seenUrls: ReadonlySet<string>): DiscoveredCandidate[] {
  const brandDomains = brandDomainsFromHits(brand, hits);
  const key = brandKey(brand.name);
  const out: DiscoveredCandidate[] = [];
  const taken = new Set<string>();
  for (const hit of hits) {
    const canon = canonicalReviewListingUrl(hit.url, brandDomains);
    if (!canon || taken.has(canon.url) || seenUrls.has(canon.url)) continue;
    const title = (hit.title ?? "").trim();
    if (!brandKey(`${title} ${hit.text.slice(0, 600)} ${canon.url}`).includes(key)) continue;
    if (looksLikeListing(canon.url, brand, hit.text)) continue;
    const prices = detectPrices(hit.text);
    if (prices.length === 0) continue;
    taken.add(canon.url);
    out.push({ brand, url: canon.url, retailer: canon.retailer, retailerName: RETAILER_NAME[canon.retailer], title: title || canon.url, text: hit.text, prices });
  }
  return out;
}

/** Is the model's price the page's price? Within 10% of any detected price. */
export function priceMatchesPage(modelPrice: number, detected: number[]): boolean {
  if (detected.length === 0) return true;
  return detected.some((p) => Math.abs(modelPrice - p) / p <= 0.1);
}

/** Prompt text handed to the model for a discovered page. */
export function candidatePromptText(c: DiscoveredCandidate): string {
  const originLine =
    c.brand.origin === "global_available_in_sa"
      ? "Brand origin: Import (an international brand sold in South Africa)"
      : "Brand origin: local South African brand";
  return [
    `Source page title: ${c.title}`,
    `Source URL: ${c.url}`,
    `Sold by: ${c.retailerName}`,
    `Searched brand: ${c.brand.name}`,
    originLine,
    `Rand prices read from the page: ${c.prices.map((p) => `R${p}`).join(", ")}`,
    "",
    c.text.slice(0, 14000),
  ].join("\n");
}

/** Does this excerpt need a full-page read (Firecrawl) before it is worth a model call? */
export function needsFullPage(text: string): boolean {
  return text.length < 1200;
}
