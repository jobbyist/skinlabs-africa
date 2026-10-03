import type { RetailerSlug } from "./retailers.ts";

// Deterministic extraction of the CURRENT selling price from a retailer product
// page's raw HTML. No model is involved: each retailer exposes the price in a
// stable place (Clicks: schema.org JSON-LD offer; Dis-Chem: itemprop/product meta
// tags; Takealot: the buy-box block only). Anything ambiguous returns null, so a
// wrong number is never recorded.

export const MIN_PRICE_ZAR = 1;
export const MAX_PRICE_ZAR = 50_000;

export interface ParsedListing {
  /** Candidate titles for matching (page title, headline), cleaned. */
  titles: string[];
  priceZar: number;
  /** true/false when the page says so, null when it doesn't. */
  inStock: boolean | null;
  method: "jsonld" | "meta" | "buybox";
}

/** "R 1 299.00", "1,299.50", "130.00", "1 299,00" -> number, or null. */
export function parseRand(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = raw.replace(/\u00a0/g, " ").replace(/^R\s*/i, "").replace(/\s+/g, "").trim();
  if (!/^[0-9][0-9.,]*$/.test(s)) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // The later separator is the decimal point; the other is a thousands separator.
    const decimal = lastDot > lastComma ? "." : ",";
    s = decimal === "." ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (lastComma >= 0) {
    s = /,\d{2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot >= 0 && /\.\d{3}$/.test(s) && s.indexOf(".") === lastDot) {
    // "1.299" is a thousands separator, not 1.299 rand.
    s = s.replace(".", "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function plausible(price: number | null): price is number {
  return price !== null && price >= MIN_PRICE_ZAR && price <= MAX_PRICE_ZAR;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function clean(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function pageTitle(html: string, suffixes: RegExp): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return null;
  const t = clean(m[1]).replace(suffixes, "").trim();
  return t || null;
}

function headline(html: string): string | null {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (!m) return null;
  const t = clean(m[1]);
  return t || null;
}

function availability(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  if (/InStock|LimitedAvailability/i.test(value)) return true;
  if (/OutOfStock|SoldOut|Discontinued/i.test(value)) return false;
  return null;
}

function metaContent(html: string, attr: "itemprop" | "property" | "name", key: string): string | null {
  const re = new RegExp(`<meta[^>]*\\b${attr}="${key.replace(/[:.]/g, "\\$&")}"[^>]*>`, "i");
  const tag = re.exec(html)?.[0];
  if (!tag) return null;
  const content = /\bcontent="([^"]*)"/i.exec(tag)?.[1];
  return content === undefined ? null : decodeEntities(content);
}

function parseClicks(html: string): ParsedListing | null {
  const blocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      continue;
    }
    const items = Array.isArray(json) ? json : [json];
    for (const item of items as Record<string, unknown>[]) {
      const type = item?.["@type"];
      if (!(type === "Product" || (Array.isArray(type) && type.includes("Product")))) continue;
      const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
      const offer = offers as Record<string, unknown> | undefined;
      if (!offer || offer.priceCurrency !== "ZAR") continue;
      const price = parseRand(offer.price as string | number);
      if (!plausible(price)) continue;
      const titles = [pageTitle(html, /\s*[-|]\s*Clicks\s*$/i), headline(html), typeof item.description === "string" ? clean(item.description) : null]
        .filter((t): t is string => !!t);
      // Clicks' JSON-LD name is just the brand; the page title carries the product name.
      return { titles, priceZar: price, inStock: availability(offer.availability), method: "jsonld" };
    }
  }
  return null;
}

function parseDisChem(html: string): ParsedListing | null {
  const currency = metaContent(html, "itemprop", "priceCurrency") ?? metaContent(html, "property", "product:price:currency");
  if (currency !== "ZAR") return null;
  const raw = metaContent(html, "itemprop", "price") ?? metaContent(html, "property", "product:price:amount");
  const price = parseRand(raw);
  if (!plausible(price)) return null;
  const titles = [pageTitle(html, /\s*\|\s*Dis-?Chem\s*$/i), headline(html)].filter((t): t is string => !!t);
  return { titles, priceZar: price, inStock: availability(metaContent(html, "itemprop", "availability")), method: "meta" };
}

function parseTakealot(html: string): ParsedListing | null {
  // Only the buy-box price counts: the page also lists prices for recommended products.
  const start = html.search(/class="[^"]*price-buybox[^"]*"/);
  if (start < 0) return null;
  const window = html.slice(start, start + 800);
  const m = /class="[^"]*\bcurrency\b[^"]*"[^>]*>\s*R\s*([0-9][0-9\s\u00a0,.]*)</i.exec(window);
  const price = parseRand(m?.[1] ?? null);
  if (!plausible(price)) return null;
  const titles = [headline(html), pageTitle(html, /\s*\|.*$/)].filter((t): t is string => !!t);
  return { titles, priceZar: price, inStock: null, method: "buybox" };
}

export function parseListing(retailer: RetailerSlug, html: string): ParsedListing | null {
  if (!html || html.length < 200) return null;
  switch (retailer) {
    case "clicks":
      return parseClicks(html);
    case "dis-chem":
      return parseDisChem(html);
    case "takealot":
      return parseTakealot(html);
  }
}
