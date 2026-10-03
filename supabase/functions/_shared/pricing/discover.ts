import { canonicalListingUrl, type RetailerSlug } from "./retailers.ts";
import { type MatchResult, type MatchTarget, scoreMatch } from "./match.ts";

export interface SearchResult {
  url: string;
  title?: string | null;
  /** The search engine's snippet of the retailer page; retailers often put the brand here only ("… | Standard Beauty."). */
  description?: string | null;
}

export interface Candidate {
  url: string;
  retailer: RetailerSlug;
  title: string;
  /** Strings the match was scored on (title, and title + brand tag from the snippet). */
  evidence: string[];
  match: MatchResult;
}

/** "… Hyaluronic Acid |Standard Beauty. Eligible for Cash on Delivery" -> "Standard Beauty". */
export function brandTagFromSnippet(description: string | null | undefined): string | null {
  if (!description) return null;
  const m = /\|\s*([^.|]{2,60})\./.exec(description);
  return m ? m[1].trim() : null;
}

const rank = (r: MatchResult) => (r.decision === "matched" ? 2 : r.decision === "needs_review" ? 1 : 0);

/**
 * Turns raw web-search results into ranked product-page candidates for one retailer.
 * Anything that isn't a plain product page of that retailer is dropped first (category,
 * brand and search pages, other hosts), tracking parameters are stripped, and the same
 * page is never listed twice. Sizes seen across the plausible results are fed back into
 * scoring so a product sold in several sizes is handed to a person, never auto-picked.
 */
export function rankSearchResults(target: MatchTarget, retailer: RetailerSlug, results: SearchResult[], max = 4): Candidate[] {
  const seen = new Set<string>();
  const pages: { url: string; title: string; evidence: string[] }[] = [];
  for (const r of results) {
    const canon = canonicalListingUrl(r.url);
    if (!canon || canon.retailer !== retailer) continue;
    // Takealot serves one product under several URL slugs; the PLID is its identity.
    const key = retailer === "takealot" ? (/PLID\d+/i.exec(canon.url)?.[0].toUpperCase() ?? canon.url) : canon.url;
    if (seen.has(key)) continue;
    seen.add(key);
    const title = (r.title ?? "").trim();
    const tag = brandTagFromSnippet(r.description);
    pages.push({ url: canon.url, title, evidence: tag && title ? [title, `${title} | ${tag}`] : [title] });
  }

  // Pass 1: which sizes of this product exist at the retailer, and how many listings are plausible?
  const sizes = new Set<number>();
  let plausible = 0;
  for (const p of pages) {
    const first = scoreMatch(target, p.evidence);
    if (first.decision !== "rejected") {
      plausible++;
      if (first.listingSizeMl) sizes.add(first.listingSizeMl);
    }
  }

  // Pass 2: score each page knowing every size on offer and how many plausible listings there are.
  return pages
    .map((p) => ({ url: p.url, retailer, title: p.title, evidence: p.evidence, match: scoreMatch(target, p.evidence, [...sizes], plausible) }))
    .filter((c) => c.match.decision !== "rejected")
    .sort((a, b) => rank(b.match) - rank(a.match) || b.match.confidence - a.match.confidence)
    .slice(0, max);
}

/**
 * After the page itself has been read, its own titles decide. A match is only kept if the
 * page confirms what the search result promised: if the search said "matched" but the page
 * says otherwise, the stricter answer wins.
 */
export function confirmWithPage(search: MatchResult, page: MatchResult): MatchResult {
  const order = (r: MatchResult) => rank(r);
  return order(page) <= order(search) ? page : { ...page, decision: search.decision, reasons: [...page.reasons, "search result was less certain"] };
}
