/**
 * Skincare concern/ingredient understanding for site search.
 *
 * `ingredientVocabulary` and `skinTagVocabulary` are derived at runtime from the
 * live product catalogue (src/data/reviews.ts), not hand-maintained — add a new
 * product with new key_ingredients or skin_type_match tags and search understands
 * it immediately, with no changes needed here.
 *
 * `concernTaxonomy` is the one hand-curated piece: it maps everyday phrasing
 * ("hyperpigmentation", "best products for dry skin") onto the ingredient/skin-tag
 * vocabulary above so natural-language queries resolve to real product attributes
 * instead of requiring an exact keyword match.
 */
import { productReviews } from "@/data/reviews";

/** lowercase, strip diacritics/punctuation noise, collapse whitespace. */
export const norm = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Reduces an ingredient label like "Niacinamide 10%" or "Copper Tripeptide-1 (GHK-Cu)"
 *  to its searchable core: "niacinamide", "copper tripeptide-1". */
export const ingredientCore = (raw: string): string =>
  norm(raw.replace(/\([^)]*\)/g, " ").replace(/\d+(\.\d+)?%?/g, " "));

export const ingredientVocabulary: string[] = Array.from(
  new Set(productReviews.flatMap((r) => r.key_ingredients.map(ingredientCore)).filter(Boolean)),
);

export const skinTagVocabulary: string[] = Array.from(
  new Set(productReviews.flatMap((r) => r.skin_type_match.map((t) => norm(t)))),
);

/** Consumer phrasing that should resolve to one or more ingredient cores above,
 *  even when the phrase itself never appears verbatim in an ingredient name. */
const ingredientSynonyms: Record<string, string[]> = {
  "vitamin c": ["ascorbic acid"],
  "vitamin a": ["retinol", "retinaldehyde", "retinyl palmitate", "encapsulated retinoid"],
  retinoid: ["retinol", "retinaldehyde", "retinyl palmitate", "encapsulated retinoid"],
  retinoids: ["retinol", "retinaldehyde", "retinyl palmitate", "encapsulated retinoid"],
  aha: ["glycolic acid", "lactic acid", "mandelic acid", "aha bha complex"],
  bha: ["salicylic acid", "aha bha complex"],
  hyaluronic: ["hyaluronic acid", "sodium hyaluronate", "hyaluronic acid crosspolymer"],
};

/** Does `core` (a catalogue ingredient, already reduced by ingredientCore) satisfy
 *  a user's mention of `wanted` (also reduced/lowercased)? Handles the common case
 *  where the catalogue entry carries an extra qualifier word, e.g. a query for
 *  "hyaluronic acid" should match the catalogue core "hyaluronic acid crosspolymer". */
export const ingredientCoreMatches = (core: string, wanted: string): boolean => {
  if (!core || !wanted) return false;
  if (core === wanted || core.includes(wanted) || wanted.includes(core)) return true;
  const corePrimary = core.split(" ").slice(0, 2).join(" ");
  return corePrimary.length >= 5 && wanted.includes(corePrimary);
};

/** Ingredient cores directly implicated by a free-text query: literal mentions
 *  ("...contains hyaluronic acid") plus synonym expansion ("vitamin c" -> ascorbic acid). */
export const detectIngredientTargets = (query: string): string[] => {
  const q = norm(query);
  if (!q) return [];
  const targets = new Set<string>();
  for (const [syn, cores] of Object.entries(ingredientSynonyms)) {
    if (q.includes(syn)) cores.forEach((c) => targets.add(c));
  }
  for (const core of ingredientVocabulary) {
    if (core.length >= 5 && q.includes(core)) targets.add(core);
    else {
      const primary = core.split(" ").slice(0, 2).join(" ");
      if (primary.length >= 5 && q.includes(primary)) targets.add(core);
    }
  }
  return Array.from(targets);
};

export interface ConcernTag {
  id: string;
  /** Shown as the match reason badge. */
  label: string;
  /** Phrases that, when found in a query, activate this concern. */
  queryPhrases: string[];
  /** Ingredient cores (see ingredientCore) associated with this concern. */
  ingredientHints: string[];
  /** Catalogue skin_type_match tags (lowercased) associated with this concern. */
  skinTagHints: string[];
  /** Free-text hints matched against titles, descriptions, verdicts, topics. */
  textHints: string[];
}

export const concernTaxonomy: ConcernTag[] = [
  {
    id: "pigmentation",
    label: "Pigmentation & dark spots",
    queryPhrases: [
      "hyperpigmentation", "pigmentation", "dark spot", "dark spots", "dark mark", "dark marks",
      "uneven tone", "uneven skin tone", "even out", "brightening", "melasma", "sun spot", "sun spots",
      "discolouration", "discoloration", "post inflammatory", "pih",
    ],
    ingredientHints: ["arbutin", "alpha arbutin", "kojic acid", "tranexamic acid", "vitamin c", "ascorbic acid", "niacinamide", "licorice root extract", "ferulic acid", "brightening complex", "botanical brighteners"],
    skinTagHints: ["pigmentation", "pigmented", "melasma", "dark marks", "uneven", "sun-damaged", "photo-exposed", "deep tones", "scars"],
    textHints: ["pigment", "brighten", "dark spot", "even tone", "melasma", "discolour", "discolor"],
  },
  {
    id: "acne",
    label: "Acne & breakouts",
    queryPhrases: ["acne", "breakout", "breakouts", "pimple", "pimples", "blemish", "blemishes", "congestion", "congested", "blackhead", "whitehead", "spot prone", "spot-prone"],
    ingredientHints: ["salicylic acid", "zinc", "zinc salicylate", "zinc pca", "aha bha complex", "enzymes", "enzyme complex"],
    skinTagHints: ["acne-prone", "congested", "oily"],
    textHints: ["acne", "breakout", "blemish", "congestion", "blackhead", "pore"],
  },
  {
    id: "aging",
    label: "Anti-aging & firmness",
    queryPhrases: ["anti-aging", "anti aging", "anti-ageing", "anti ageing", "wrinkle", "wrinkles", "fine line", "fine lines", "firming", "firmness", "sagging", "elasticity", "collagen", "mature skin"],
    ingredientHints: ["retinol", "retinaldehyde", "retinyl palmitate", "encapsulated retinoid", "peptides", "argireline", "copper tripeptide", "coq10", "vitamin a"],
    skinTagHints: ["mature", "sensitive-mature"],
    textHints: ["wrinkle", "fine line", "firm", "elastic", "sagging", "anti-aging", "anti-ageing", "collagen"],
  },
  {
    id: "hydration",
    label: "Dryness & hydration",
    queryPhrases: ["dry skin", "dryness", "dehydrated", "dehydration", "hydration", "hydrating", "moisture", "moisturising", "moisturizing", "flaky", "thirsty skin"],
    ingredientHints: ["hyaluronic acid", "sodium hyaluronate", "hyaluronic acid crosspolymer", "glycerin", "squalane", "hemi-squalane", "ceramide", "ceramides", "ceramide np", "ceramide-p", "panthenol", "polyglutamic acid", "natural moisturizing factors", "nmf complex", "shea butter", "marula oil", "argan oil", "jojoba oil"],
    skinTagHints: ["dry", "very dry", "dehydrated", "dry body", "very dry body"],
    textHints: ["hydrat", "dry", "dehydrat", "moistur", "flaky", "thirsty"],
  },
  {
    id: "sensitivity",
    label: "Sensitivity & barrier repair",
    queryPhrases: ["sensitive skin", "sensitivity", "redness", "irritation", "irritated", "barrier repair", "rosacea", "eczema", "reactive skin", "calming", "soothing"],
    ingredientHints: ["centella asiatica", "panthenol", "ceramide", "oat bran extract", "calendula oil", "aloe vera", "aloe ferox", "soothing botanicals", "cucumber extract"],
    skinTagHints: ["sensitive", "reactive", "compromised", "eczema", "eczema-prone", "sensitive-mature"],
    textHints: ["sensitiv", "redness", "irritat", "barrier", "rosacea", "eczema", "calm", "sooth"],
  },
  {
    id: "sun-protection",
    label: "Sun protection",
    queryPhrases: ["sunscreen", "spf", "sun protection", "uv protection", "broad spectrum", "sunblock"],
    ingredientHints: ["zinc oxide", "broad-spectrum uv filters", "chemical uv filters", "uv filters", "photolyase enzymes"],
    skinTagHints: ["sun-damaged", "photo-exposed"],
    textHints: ["spf", "sunscreen", "sun protection", "uv"],
  },
  {
    id: "oiliness",
    label: "Oil control",
    queryPhrases: ["oily skin", "oil control", "shine", "shiny skin", "pores", "sebum", "mattify", "mattifying"],
    ingredientHints: ["niacinamide", "zinc pca", "salicylic acid"],
    skinTagHints: ["oily"],
    textHints: ["oily", "oil control", "shine", "mattify", "pores", "sebum"],
  },
  {
    id: "dullness",
    label: "Dullness & texture",
    queryPhrases: ["dull skin", "dullness", "glow", "radiance", "texture", "resurfacing", "smooth skin", "exfoliate", "exfoliation", "exfoliating"],
    ingredientHints: ["glycolic acid", "lactic acid", "mandelic acid", "fruit enzymes", "enzyme complex", "aha bha complex", "vitamin c"],
    skinTagHints: ["dull"],
    textHints: ["dull", "glow", "radian", "texture", "exfoliat", "resurfac"],
  },
  {
    id: "scarring",
    label: "Scars & stretch marks",
    queryPhrases: ["scar", "scars", "scarring", "stretch mark", "stretch marks"],
    ingredientHints: [],
    skinTagHints: ["scars", "stretch marks"],
    textHints: ["scar", "stretch mark"],
  },
];

/** Concern tags whose query phrases appear in the given free-text query. */
export const detectConcerns = (query: string): ConcernTag[] => {
  const q = norm(query);
  if (!q) return [];
  return concernTaxonomy.filter((concern) => concern.queryPhrases.some((phrase) => q.includes(phrase)));
};

/** "best/top/recommended" style intent, used to weight results by rating. */
export const isBestIntent = (query: string): boolean => /\b(best|top|highest[- ]rated|great|recommend(ed)?)\b/i.test(query);

/** Words too generic to carry search weight on their own (kept out of literal
 *  token scoring, but still available to the concern/ingredient detectors above). */
export const SEARCH_STOPWORDS = new Set([
  "a", "an", "the", "for", "of", "in", "on", "to", "that", "which", "what", "who", "are", "is",
  "can", "i", "use", "my", "with", "have", "has", "do", "does", "products", "product", "best",
  "top", "good", "great", "some", "any", "please", "recommend", "recommended", "contain",
  "contains", "containing", "and", "or", "me", "you", "your",
]);
