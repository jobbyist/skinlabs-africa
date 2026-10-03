// Decides whether a retailer listing is the product we mean. A wrong match would
// put another product's price on our page, so this is deliberately strict:
//  - every word of the brand must appear (so "Skin Republic Niacinamide 10% + Zinc 1%"
//    never matches "The Ordinary Niacinamide 10% + Zinc 1%");
//  - the product-name words (incl. strengths like "10%") must be covered;
//  - a size mismatch (30ml vs 60ml) is a rejection, and when WE don't know the size
//    (no variant has one yet) an auto-match is only allowed if the listing is the only
//    size seen for that product, otherwise a human chooses.

export type MatchDecision = "matched" | "needs_review" | "rejected";

export interface MatchTarget {
  brand: string;
  name: string;
  /** Pack size in ml/g when known. */
  sizeMl?: number | null;
}

export interface MatchResult {
  decision: MatchDecision;
  confidence: number;
  /** Pack size parsed from the listing title, when present. */
  listingSizeMl: number | null;
  reasons: string[];
}

const STOP = new Set(["the", "a", "an", "and", "for", "with", "of", "by", "in", "to", "online", "buy", "serum"]);
// Words retailers add around the real product name.
const SITE_WORDS = new Set(["clicks", "dis", "chem", "dischem", "takealot", "com", "shop", "today", "get", "it", "tomorrow", "pharmacies"]);

function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Canonical size in ml (or g, treated the same) from text like "30ml", "1.5 L", "50 g". */
export function parseSizeMl(text: string): number | null {
  const t = fold(text);
  const m = /(\d+(?:[.,]\d+)?)\s*(ml|g|gr|gram|grams|kg|l|litre|liter|litres|liters)\b/.exec(t);
  if (!m) return null;
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = m[2];
  return unit === "kg" || unit === "l" || unit === "litre" || unit === "liter" || unit === "litres" || unit === "liters" ? value * 1000 : value;
}

export function tokens(text: string): string[] {
  let t = fold(text);
  t = t
    .replace(/(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)/g, "$1pct ")
    .replace(/\bplus\b/g, " + ")
    .replace(/&/g, " and ")
    // size tokens are compared separately
    .replace(/\d+(?:[.,]\d+)?\s*(?:ml|gr|grams?|g|kg|litres?|liters?|l)\b/g, " ")
    .replace(/[^a-z0-9+]+/g, " ");
  return t
    .split(" ")
    .filter((w) => w && !STOP.has(w) && !SITE_WORDS.has(w));
}

function brandTokens(brand: string): string[] {
  return tokens(brand);
}

function overlap(needles: string[], hay: Set<string>): number {
  if (needles.length === 0) return 0;
  return needles.filter((n) => hay.has(n)).length / needles.length;
}

/**
 * Scores one listing (any of its candidate titles) against the target.
 * `otherSizesSeen` = distinct sizes of the SAME product found at this retailer; when
 * the target size is unknown and there is more than one, the choice is a human's.
 */
export function scoreMatch(
  target: MatchTarget,
  listingTitles: string[],
  otherSizesSeen: number[] = [],
  /** How many plausible (non-rejected) listings the retailer showed for this product. */
  plausibleCount = 0,
): MatchResult {
  const reasons: string[] = [];
  const brand = brandTokens(target.brand);
  const targetNameTokens = tokens(target.name).filter((w) => !brand.includes(w) || tokens(target.name).length <= 2);

  let best: MatchResult = { decision: "rejected", confidence: 0, listingSizeMl: null, reasons: ["no usable listing title"] };
  for (const title of listingTitles) {
    const listingTokens = new Set(tokens(title));
    const listingSize = parseSizeMl(title);
    const r: string[] = [];

    const brandCoverage = overlap(brand, listingTokens);
    // The brand may legitimately be missing from a retailer title ("Niacinamide 10% + Zinc 1% | The Ordinary"
    // always names it; plain "Serum 30ml" would not), so a missing brand is a rejection, not a guess.
    if (brand.length > 0 && brandCoverage < 1) {
      r.push(`brand "${target.brand}" not in listing title`);
      const result: MatchResult = { decision: "rejected", confidence: 0, listingSizeMl: listingSize, reasons: r };
      if (best.reasons[0] === "no usable listing title") best = result;
      continue;
    }

    const nameCoverage = overlap(targetNameTokens, listingTokens);
    const known = new Set([...brand, ...targetNameTokens]);
    const extras = [...listingTokens].filter((w) => !known.has(w));
    const extraRatio = listingTokens.size === 0 ? 1 : extras.length / listingTokens.size;

    let sizeScore = 0.5;
    let sizeKnownMatch = false;
    if (target.sizeMl && listingSize) {
      if (Math.abs(target.sizeMl - listingSize) / target.sizeMl > 0.02) {
        r.push(`size mismatch: wanted ${target.sizeMl}, listing ${listingSize}`);
        const result: MatchResult = { decision: "rejected", confidence: 0, listingSizeMl: listingSize, reasons: r };
        if (result.confidence >= best.confidence && best.decision === "rejected") best = result;
        continue;
      }
      sizeScore = 1;
      sizeKnownMatch = true;
    } else if (!listingSize) {
      r.push("listing has no pack size");
    }

    const confidence = Math.round((0.6 * nameCoverage + 0.2 * sizeScore + 0.2 * (1 - Math.min(extraRatio, 1))) * 100) / 100;
    r.push(`name coverage ${(nameCoverage * 100).toFixed(0)}%`, `extra words ${(extraRatio * 100).toFixed(0)}%`);

    let decision: MatchDecision;
    if (nameCoverage < 0.6) {
      decision = "rejected";
      r.push("too few product-name words in listing");
    } else if (nameCoverage >= 0.8 && confidence >= 0.8) {
      decision = "matched";
      if (!sizeKnownMatch) {
        // We don't know the size we want: only auto-accept if this is the one size seen.
        const sizes = new Set([...otherSizesSeen, ...(listingSize ? [listingSize] : [])]);
        if (sizes.size > 1) {
          decision = "needs_review";
          r.push(`several sizes listed (${[...sizes].sort((a, b) => a - b).join(", ")}); a person must pick`);
        } else if (!listingSize) {
          // Retailers like Takealot don't put the pack size in the title. Only when this is the
          // single plausible listing and the name fits tightly is that good enough; otherwise a person decides.
          if (plausibleCount === 1 && nameCoverage >= 0.9 && extraRatio <= 0.35) {
            r.push("pack size not stated; only one plausible listing");
          } else {
            decision = "needs_review";
            r.push("pack size unknown on both sides");
          }
        }
      }
    } else {
      decision = "needs_review";
    }

    const result: MatchResult = { decision, confidence, listingSizeMl: listingSize, reasons: r };
    const rank = (d: MatchDecision) => (d === "matched" ? 2 : d === "needs_review" ? 1 : 0);
    if (rank(result.decision) > rank(best.decision) || (rank(result.decision) === rank(best.decision) && result.confidence > best.confidence)) best = result;
  }
  return best;
}
