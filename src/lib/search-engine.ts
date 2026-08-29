/**
 * Query-aware relevance scoring for site search. Every corpus (products, comparison
 * articles, podcast episodes, briefings, spotlight brands, seasonal hubs, static pages)
 * feeds through one of the scorers below and comes back with a numeric score plus
 * human-readable `reasons` ("Niacinamide", "Pigmentation & dark spots") so results for
 * natural-language queries — "products that contain hyaluronic acid",
 * "best products for hyperpigmentation" — are ranked instead of merely filtered.
 */
import { overallScore, type ProductReview } from "@/data/reviews";
import {
  concernTaxonomy,
  detectConcerns,
  detectIngredientTargets,
  ingredientCore,
  ingredientCoreMatches,
  isBestIntent,
  norm,
  SEARCH_STOPWORDS,
} from "@/lib/search-taxonomy";

export interface ScoredMatch {
  score: number;
  /** De-duplicated, ordered explanation of why this item matched. */
  reasons: string[];
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const queryTokens = (query: string): string[] =>
  norm(query)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SEARCH_STOPWORDS.has(token));

/** Literal token match against a haystack: prefix/word-boundary/substring tiers,
 *  summed per token (OR semantics — natural-language filler words don't zero out a match). */
const literalScore = (tokens: string[], haystack: string): number => {
  let score = 0;
  for (const token of tokens) {
    if (haystack.startsWith(token)) score += 5;
    else if (new RegExp(`\\b${escapeRegExp(token)}`).test(haystack)) score += 3;
    else if (haystack.includes(token)) score += 2;
  }
  return score;
};

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason)) reasons.push(reason);
};

/** Product reviews: matches on name/brand/category/verdict, boosts on direct
 *  ingredient mentions and on concern → ingredient/skin-tag overlap, and (for
 *  "best products for X" queries) tie-breaks by the product's own review score. */
export const scoreProductReview = (query: string, review: ProductReview): ScoredMatch => {
  const q = norm(query);
  if (!q) return { score: 0, reasons: [] };

  const tokens = queryTokens(query);
  const reasons: string[] = [];
  let score = 0;

  const titleN = norm(`${review.brand} ${review.product_name}`);
  const haystack = norm(
    `${review.brand} ${review.product_name} ${review.category} ${review.verdict} ${review.key_ingredients.join(" ")} ${review.skin_type_match.join(" ")}`,
  );

  score += literalScore(tokens, titleN) * 1.5;
  score += literalScore(tokens, haystack) * 0.5;
  if (score > 0) addReason(reasons, `${review.brand} ${review.product_name}`.trim());

  const ingredientTargets = detectIngredientTargets(query);
  for (const ingredient of review.key_ingredients) {
    const core = ingredientCore(ingredient);
    if (ingredientTargets.some((target) => ingredientCoreMatches(core, target))) {
      score += 9;
      addReason(reasons, ingredient);
    }
  }

  const skinTagsN = review.skin_type_match.map((t) => norm(t));
  for (const concern of detectConcerns(query)) {
    const ingredientHit = review.key_ingredients.some((ingredient) =>
      concern.ingredientHints.some((hint) => ingredientCoreMatches(ingredientCore(ingredient), hint)),
    );
    const skinTagHit = skinTagsN.some((tag) => concern.skinTagHints.includes(tag));
    const textHit = concern.textHints.some((hint) => haystack.includes(hint));
    if (ingredientHit || skinTagHit || textHit) {
      score += (ingredientHit ? 5 : 0) + (skinTagHit ? 5 : 0) + (textHit ? 2 : 0);
      addReason(reasons, concern.label);
    }
  }

  if (score > 0 && isBestIntent(query)) {
    score += overallScore(review);
  }

  return { score, reasons: reasons.slice(0, 3) };
};

/** Generic scorer for text-first content (comparison articles, podcast episodes,
 *  briefings, spotlight brands, seasonal hubs, static pages): literal token match
 *  across title/secondary/tag text, plus a boost when a detected concern's
 *  free-text hints appear in that same content. */
export const scoreTextItem = (query: string, title: string, secondary = "", tags: string[] = []): ScoredMatch => {
  const q = norm(query);
  if (!q) return { score: 0, reasons: [] };

  const tokens = queryTokens(query);
  const titleN = norm(title);
  const haystack = norm(`${title} ${secondary} ${tags.join(" ")}`);

  let score = literalScore(tokens, titleN) * 1.5 + literalScore(tokens, haystack) * 0.5;
  const reasons: string[] = [];
  if (score > 0) addReason(reasons, title);

  for (const concern of detectConcerns(query)) {
    if (concern.textHints.some((hint) => haystack.includes(hint))) {
      score += 3;
      addReason(reasons, concern.label);
    }
  }

  return { score, reasons: reasons.slice(0, 3) };
};

/** True when the query contains anything the taxonomy or literal tokenizer can act on. */
export const isSearchableQuery = (query: string): boolean =>
  queryTokens(query).length > 0 || detectConcerns(query).length > 0 || detectIngredientTargets(query).length > 0;

export { concernTaxonomy };
