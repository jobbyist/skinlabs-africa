// Real product images for published reviews. Pure helpers used by the review-image-sync edge function:
//  * rankProductPages(): which retailer/brand PRODUCT pages (from a web search) are the right product;
//  * extractProductImages(): the page's own product image(s) from its HTML (og:image, twitter:image,
//    JSON-LD Product.image, link rel=image_src), absolute https URLs only.
// No model looks at an image or picks one: candidates are stored `pending` and a person approves each one
// in Admin > Data Quality before it replaces the stock photo on a review.
import { scoreMatch, type MatchTarget } from "./match.ts";
import { canonicalReviewListingUrl, type PriceSearchResult, type ReviewRetailerSlug } from "./reviewPrices.ts";

export interface ProductPage {
  url: string;
  retailer: ReviewRetailerSlug;
  title: string;
  confidence: number;
  decision: "matched" | "needs_review";
}

/** Brand page first, then the retailer pages, best name match first. */
export function rankProductPages(target: MatchTarget, results: PriceSearchResult[], brandDomains: string[] = [], max = 3): ProductPage[] {
  const seen = new Set<string>();
  const pages: ProductPage[] = [];
  for (const r of results) {
    const canon = canonicalReviewListingUrl(r.url, brandDomains);
    if (!canon || seen.has(canon.url)) continue;
    seen.add(canon.url);
    const title = (r.title ?? "").trim();
    const m = scoreMatch(target, [title].filter(Boolean));
    if (m.decision === "rejected") continue;
    pages.push({ url: canon.url, retailer: canon.retailer, title, confidence: m.confidence, decision: m.decision });
  }
  const kindRank = (p: ProductPage) => (p.retailer === "brand-direct" ? 0 : 1);
  return pages.sort((a, b) => kindRank(a) - kindRank(b) || Number(b.decision === "matched") - Number(a.decision === "matched") || b.confidence - a.confidence).slice(0, max);
}

// ---- HTML -> image URLs --------------------------------------------------------------------------

export interface ExtractedImage {
  url: string;
  /** Where on the page it came from, best source first. */
  via: "og:image" | "twitter:image" | "json-ld" | "image_src" | "page-img";
  alt: string | null;
}

const BAD_IMAGE = /(logo|favicon|sprite|placeholder|no[-_]?image|default[-_]?image|coming[-_]?soon|spinner|loading|blank|icon[-_.]|\/icons?\/|social[-_]?share|banner|header[-_]|payment|badge|\.svg(\?|$)|\.gif(\?|$)|data:)/i;

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? "").trim() : null;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&#47;/g, "/").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function resolveImageUrl(raw: string | null | undefined, pageUrl: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(decodeEntities(raw.trim()), pageUrl);
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:" || u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function isPlausibleProductImage(url: string): boolean {
  return !BAD_IMAGE.test(url);
}

function jsonLdImages(html: string): { url: string; alt: string | null }[] {
  const out: { url: string; alt: string | null }[] = [];
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    const o = node as Record<string, unknown>;
    const type = o["@type"];
    const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
    if (isProduct) {
      const img = o.image;
      const push = (v: unknown) => {
        if (typeof v === "string") out.push({ url: v, alt: typeof o.name === "string" ? o.name : null });
        else if (v && typeof v === "object" && typeof (v as { url?: unknown }).url === "string") out.push({ url: (v as { url: string }).url, alt: typeof o.name === "string" ? o.name : null });
      };
      if (Array.isArray(img)) img.forEach(push);
      else push(img);
    }
    if (o["@graph"]) visit(o["@graph"]);
  };
  while ((m = re.exec(html)) !== null) {
    try {
      visit(JSON.parse(m[1].trim()));
    } catch {
      /* malformed JSON-LD is common; skip it */
    }
  }
  return out;
}

/** Product image candidates from a product page's HTML, best first, deduplicated, max 3. */
export function extractProductImages(html: string, pageUrl: string): ExtractedImage[] {
  const found: ExtractedImage[] = [];
  const metaRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  let title: string | null = null;
  const t = /<meta\b[^>]*property\s*=\s*["']og:title["'][^>]*>/i.exec(html);
  if (t) title = attr(t[0], "content");
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0];
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (key === "og:image" || key === "og:image:secure_url" || key === "og:image:url") found.push({ url: attr(tag, "content") ?? "", via: "og:image", alt: title });
    else if (key === "twitter:image" || key === "twitter:image:src") found.push({ url: attr(tag, "content") ?? "", via: "twitter:image", alt: title });
  }
  for (const j of jsonLdImages(html)) found.push({ url: j.url, via: "json-ld", alt: j.alt ?? title });
  const link = /<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*>/i.exec(html);
  if (link) found.push({ url: attr(link[0], "href") ?? "", via: "image_src", alt: title });

  // Pages with no usable meta/JSON-LD (e.g. Clicks builds its structured data in a script): the page's own primary product <img>.
  if (found.length === 0 || !found.some((f) => resolveImageUrl(f.url, pageUrl))) {
    const imgRe = /<img\b[^>]*>/gi;
    let im: RegExpExecArray | null;
    while ((im = imgRe.exec(html)) !== null) {
      const tag = im[0];
      const hint = `${attr(tag, "class") ?? ""} ${attr(tag, "id") ?? ""} ${attr(tag, "itemprop") ?? ""}`;
      if (!/(productImagePrimary|primary[-_ ]?image|product[-_ ]?image|main[-_ ]?image|\bimage\b)/i.test(hint)) continue;
      const src = attr(tag, "src") ?? attr(tag, "data-src");
      if (!src) continue;
      const alt = attr(tag, "alt");
      found.push({ url: src, via: "page-img", alt: alt && !/not_available|placeholder/i.test(alt) ? alt : title });
      break;
    }
  }

  const seen = new Set<string>();
  const out: ExtractedImage[] = [];
  for (const f of found) {
    const abs = resolveImageUrl(f.url, pageUrl);
    if (!abs || !isPlausibleProductImage(abs)) continue;
    // Same picture served at several sizes counts once (strip Shopify/Woo size suffix + query).
    const key = abs.replace(/\?.*$/, "").replace(/_(\d+x\d*|\d*x\d+|small|medium|large|grande|master|pico|icon|thumb|compact)(?=\.\w+$)/i, "").replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...f, url: abs });
    if (out.length >= 3) break;
  }
  return out;
}

/** HEAD-style validation result: accept unknown sizes, reject non-images and tiny files. */
export function imageResponseOk(contentType: string | null, contentLength: number | null): boolean {
  if (contentType && !/^image\/(jpe?g|png|webp|avif)/i.test(contentType)) return false;
  if (contentLength !== null && contentLength < 8_000) return false;
  return true;
}

export const IMAGE_RECHECK_DAYS = 90;
export const IMAGE_EMPTY_RETRY_DAYS = 7;
