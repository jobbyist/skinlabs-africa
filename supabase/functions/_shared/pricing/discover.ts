import { canonicalListingUrl, type RetailerSlug } from "./retailers.ts";
import { type MatchResult, type MatchTarget, scoreMatch } from "./match.ts";

export interface SearchResult {
  url: string;
  title?: string | null;
}

export interface Candidate {
  url: string;
  retailer: RetailerSlug;
  title: string;
  match: MatchResult;
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
  const pages: { url: string; title: string }[] = [];
  for (const r of results) {
    const canon = canonicalListingUrl(r.url);
    if (!canon || canon.retailer !== retailer || seen.has(canon.url)) continue;
    seen.add(canon.url);
    pages.push({ url: canon.url, title: (r.title ?? "").trim() });
  }

  // Pass 1: which sizes of this product exist at the retailer?
  const sizes = new Set<number>();
  for (const p of pages) {
    const first = scoreMatch(target, [p.title]);
    if (first.decision !== "rejected" && first.listingSizeMl) sizes.add(first.listingSizeMl);
  }

  // Pass 2: score each page knowing every size on offer.
  return pages
    .map((p) => ({ url: p.url, retailer, title: p.title, match: scoreMatch(target, [p.title], [...sizes]) }))
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
