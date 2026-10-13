/**
 * Filter chips in the command palette (Cmd/Ctrl+K). Every predicate reads fields the item really has; where the data
 * is silent the item simply doesn't match (a "Fragrance-free" chip never guesses). Pure and tested.
 */
export type SearchFilterId = "all" | "ingredients" | "reviews-under-250" | "highveld-barrier" | "fragrance-free" | "podcast";

export interface SearchFilterDef {
  id: SearchFilterId;
  label: string;
}

export const SEARCH_FILTERS: SearchFilterDef[] = [
  { id: "all", label: "All" },
  { id: "ingredients", label: "Ingredients" },
  { id: "reviews-under-250", label: "Reviews under R250" },
  { id: "highveld-barrier", label: "Highveld Barrier" },
  { id: "fragrance-free", label: "Fragrance-Free" },
  { id: "podcast", label: "Podcast" },
];

/** Which result groups a chip may show. `all` shows everything. */
export const FILTER_GROUPS: Record<SearchFilterId, ReadonlySet<string> | null> = {
  all: null,
  ingredients: new Set(["ingredients"]),
  "reviews-under-250": new Set(["reviews"]),
  "highveld-barrier": new Set(["reviews", "marketplace", "news", "knowledgeHub", "ingredients"]),
  "fragrance-free": new Set(["reviews", "marketplace"]),
  podcast: new Set(["podcast"]),
};

export const groupAllowed = (filter: SearchFilterId, group: string): boolean => FILTER_GROUPS[filter]?.has(group) ?? true;

export const REVIEW_PRICE_CEILING_ZAR = 250;

const FRAGRANCE_FREE = /\b(fragrance[- ]free|unscented|no added fragrance|without (?:added )?fragrance|perfume[- ]free|fragrance[- ]less)\b/i;
const FRAGRANCE_NEGATED = /\b(not|isn'?t|is not|never)\s+(?:\w+\s+){0,2}(fragrance[- ]free|unscented)\b|\b(contains|added|with)\s+(?:\w+\s+){0,1}(fragrance|parfum|perfume)\b/i;
const BARRIER = /\b(barrier|ceramides?|squalane|panthenol|petrolatum|shea|colloidal oat|cholesterol|fatty acids?|occlusive|emollient|rich cream|nourishing)\b/i;
const DRY_CLIMATE = /\b(highveld|dry air|inland|winter|dry|dehydrat\w+|tight(?:ness)?|flak\w+)\b/i;

/** Text-only fragrance-free test: explicit claims only, and an explicit "contains fragrance" cancels it. */
export const isFragranceFreeText = (text: string): boolean => FRAGRANCE_FREE.test(text) && !FRAGRANCE_NEGATED.test(text);

export interface FilterableReview {
  local_price_zar: number;
  score_climate: number;
  skin_type_match: string[];
  key_ingredients: string[];
  verdict: string;
  category?: string;
  benefits?: string[];
  seo_intro?: string | null;
  review_body?: string | null;
}

const reviewText = (r: FilterableReview) => [r.verdict, r.seo_intro ?? "", r.review_body ?? "", ...(r.benefits ?? [])].join(" ");

export const reviewUnder250 = (r: FilterableReview): boolean => r.local_price_zar > 0 && r.local_price_zar < REVIEW_PRICE_CEILING_ZAR;
export const reviewFragranceFree = (r: FilterableReview): boolean => isFragranceFreeText(reviewText(r));
/** Barrier-supporting formula (ingredients or the review's own words) that suits dry air: strong climate score or dry skin match. */
export const reviewHighveldBarrier = (r: FilterableReview): boolean => {
  const barrier = BARRIER.test([...r.key_ingredients, reviewText(r)].join(" "));
  const dryFit = r.score_climate >= 7 || r.skin_type_match.some((s) => /dry|sensitive|dehydrat/i.test(s));
  return barrier && dryFit;
};

export const reviewMatchesFilter = (r: FilterableReview, filter: SearchFilterId): boolean => {
  switch (filter) {
    case "reviews-under-250": return reviewUnder250(r);
    case "highveld-barrier": return reviewHighveldBarrier(r);
    case "fragrance-free": return reviewFragranceFree(r);
    default: return true;
  }
};

/** For text-only corpora (briefings, FAQ, marketplace copy). */
export const textMatchesFilter = (text: string, filter: SearchFilterId): boolean => {
  switch (filter) {
    case "highveld-barrier": return BARRIER.test(text) && DRY_CLIMATE.test(text);
    case "fragrance-free": return isFragranceFreeText(text);
    default: return true;
  }
};
