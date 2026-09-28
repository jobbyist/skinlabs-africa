/**
 * Duplicate / near-duplicate detection for the Daily Skinny briefings
 * pipeline (briefings-sync). Pure and dependency-free so the same code runs
 * in the Deno edge function and in `bun test`.
 *
 * Two failure modes this exists to stop (both seen live, Sept 2026):
 *  1. The SAME source page re-used on different days because Google's
 *     `srsltid` tracking parameter made every search hit a "new" URL
 *     (barbeauty.ca/hyperpigmentation → three "The Pigment Puzzle" briefings).
 *     → `canonicalSourceUrl()` strips tracking params before comparing.
 *  2. A different source page producing the same article ("That new flat
 *     spot on your arm/face …" two days apart).
 *     → `briefingSimilarity()` compares title + excerpt + takeaways.
 */

const TRACKING_PARAMS = /^(utm_[a-z]+|srsltid|gclid|fbclid|mc_[a-z]+|ref|ref_src|_ga|igshid|msclkid|yclid)$/i;

/** Lower-cased host without `www.`, path without trailing slash, tracking params and hash removed. */
export const canonicalSourceUrl = (raw: string | null | undefined): string => {
  if (!raw) return "";
  try {
    const url = new URL(raw.trim());
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAMS.test(key))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = params.length ? `?${params.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${path}${query}`;
  } catch {
    return raw.trim().toLowerCase();
  }
};

// Words that carry no topic signal in this corpus: English function words plus
// the pipeline's own boilerplate ("A South African Guide to …", "Daily Skinny").
const STOPWORDS = new Set(
  (
    "a an the and or but if of to in on at for from by with without into onto over under about as is are was were be been " +
    "it its this that these those your you our we us my me i they them their he she his her not no yes do does did just " +
    "more most less than then so very can will why how what when where which who whom here there all any every each " +
    "south african africa sa daily skinny guide playbook skin skincare routine really need needs new your s t"
  ).split(/\s+/),
);

/** Crude suffix stemmer — enough to fold plurals/-ing/-ation variants of skincare terms together. */
const stem = (word: string): string => {
  if (word.length <= 4) return word;
  for (const suffix of ["ations", "ation", "ings", "ing", "ies", "es", "s", "ed", "ly"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return suffix === "ies" ? `${word.slice(0, -3)}y` : word.slice(0, -suffix.length);
    }
  }
  return word;
};

export const topicTokens = (text: string | null | undefined): Set<string> => {
  const out = new Set<string>();
  for (const raw of (text ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
    out.add(stem(raw));
  }
  return out;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
};

/** Overlap coefficient: shared / smaller set — catches a short title fully contained in a longer one. */
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
};

export interface BriefingFingerprintInput {
  title: string;
  excerpt?: string | null;
  key_takeaways?: string[] | null;
  source_url?: string | null;
}

export interface BriefingFingerprint {
  title: Set<string>;
  body: Set<string>;
  /** Word bigrams of the excerpt (stopwords kept) — catches re-worded-by-one-noun copies. */
  excerpt: Set<string>;
}

const bigrams = (text: string | null | undefined): Set<string> => {
  const words = (text ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) out.add(`${words[i]} ${words[i + 1]}`);
  return out;
};

export const fingerprintBriefing = (b: BriefingFingerprintInput): BriefingFingerprint => ({
  title: topicTokens(b.title),
  body: topicTokens([b.title, b.excerpt ?? "", ...(b.key_takeaways ?? [])].join(" ")),
  excerpt: bigrams(b.excerpt),
});

export interface SimilarityResult {
  score: number;
  duplicate: boolean;
  reason: "similar_title" | "similar_content" | "similar_excerpt" | null;
}

/**
 * Topic similarity only. A shared source URL is deliberately NOT treated as a
 * duplicate here: hand-authored briefings legitimately cite the same review
 * paper for different topics. The pipeline enforces "never reuse a source
 * page" separately with `canonicalSourceUrl()`.
 */
/** Thresholds tuned against the live Sept 2026 corpus (see briefingSimilarity.test.ts). */
export const TITLE_OVERLAP_THRESHOLD = 0.6;
export const TITLE_JACCARD_THRESHOLD = 0.5;
export const CONTENT_JACCARD_THRESHOLD = 0.4;
export const EXCERPT_BIGRAM_THRESHOLD = 0.25;

export const briefingSimilarity = (a: BriefingFingerprint, b: BriefingFingerprint): SimilarityResult => {
  const titleJ = jaccard(a.title, b.title);
  const titleO = a.title.size >= 2 && b.title.size >= 2 ? overlap(a.title, b.title) : 0;
  const contentJ = jaccard(a.body, b.body);
  const score = Math.max(titleJ, contentJ);
  if (titleJ >= TITLE_JACCARD_THRESHOLD || (titleO >= TITLE_OVERLAP_THRESHOLD && contentJ >= CONTENT_JACCARD_THRESHOLD * 0.6)) {
    return { score, duplicate: true, reason: "similar_title" };
  }
  if (contentJ >= CONTENT_JACCARD_THRESHOLD) return { score, duplicate: true, reason: "similar_content" };
  if (jaccard(a.excerpt, b.excerpt) >= EXCERPT_BIGRAM_THRESHOLD) return { score, duplicate: true, reason: "similar_excerpt" };
  return { score, duplicate: false, reason: null };
};

/** First earlier briefing the candidate duplicates, if any. */
export const findDuplicate = <T extends BriefingFingerprintInput>(
  candidate: BriefingFingerprintInput,
  existing: readonly T[],
): { match: T; result: SimilarityResult } | null => {
  const fp = fingerprintBriefing(candidate);
  let best: { match: T; result: SimilarityResult } | null = null;
  for (const row of existing) {
    const result = briefingSimilarity(fp, fingerprintBriefing(row));
    if (result.duplicate && (!best || result.score > best.result.score)) best = { match: row, result };
  }
  return best;
};
