/**
 * Grounds SKYNN AI's starter-analysis product recommendations in SkinLabs' own
 * reviewed product catalogue (`src/data/reviews.ts`) instead of generic category
 * descriptions — the same real review data `RoutineBuilder.tsx` already uses for
 * Glow VIP's routine builder, applied here to the free/starter formulator flow.
 *
 * Never fabricates a product: every pick is a product SkinLabs has actually
 * reviewed and scored. When nothing in the catalogue is a reasonable match, the
 * relevant slot is simply omitted and the caller falls back to a generic
 * product-type description.
 */
import { productReviews, overallScore, type ProductReview } from "@/data/reviews";
import type { FormulaConcern, FormulaSkinType } from "@/data/formulaResults";

/** Maps the formulator's derived skin type to the review catalogue's tag vocabulary. */
const SKIN_TYPE_TAGS: Record<FormulaSkinType, string[]> = {
  oily: ["Oily", "Acne-prone", "Congested", "All"],
  combination: ["Combination", "Normal-Resilient", "All"],
  normal: ["Normal", "Resilient", "All"],
  dry: ["Dry", "Very Dry", "Dehydrated", "All"],
};

const SENSITIVE_TAGS = ["Sensitive", "Reactive", "Compromised", "Irritated"];

/** Ingredient keywords that make a serum genuinely relevant to a concern + time of day. */
const CONCERN_ACTIVE_KEYWORDS: Record<FormulaConcern, { am: string[]; pm: string[] }> = {
  acne: { am: ["niacinamide"], pm: ["salicylic", "bha"] },
  brightening: { am: ["vitamin c", "ascorbic"], pm: ["azelaic", "arbutin", "tranexamic"] },
  aging: { am: ["vitamin c", "peptide", "ascorbic"], pm: ["retinol", "retinal", "retinoid", "bakuchiol"] },
  sensitivity: { am: ["centella", "cica", "panthenol", "ceramide"], pm: ["centella", "cica", "panthenol", "ceramide"] },
};

const tagOverlap = (tags: string[], wanted: string[]) => tags.some((t) => wanted.includes(t));
const hasKeyword = (ingredients: string[], keywords: string[]) =>
  ingredients.some((ing) => keywords.some((kw) => ing.toLowerCase().includes(kw)));

interface FindOptions {
  category: ProductReview["category"];
  skinType: FormulaSkinType;
  preferSensitive?: boolean;
  keywords?: string[];
  /** Deeper Monk Skin Tones (7–10) get a real, catalogue-backed nudge toward products
   *  the review set specifically tags "Deep Tones" for pigmentation/dark-mark concerns —
   *  never a fabricated claim, just weighting real tags that already exist in the data. */
  preferDeepTones?: boolean;
}

const findBestProduct = ({ category, skinType, preferSensitive, keywords, preferDeepTones }: FindOptions): ProductReview | null => {
  const wantedTags = preferSensitive ? [...SENSITIVE_TAGS, ...SKIN_TYPE_TAGS[skinType]] : SKIN_TYPE_TAGS[skinType];
  const candidates = productReviews.filter((p) => p.category === category && tagOverlap(p.skin_type_match, wantedTags));
  if (candidates.length === 0) return null;

  const withKeyword = keywords ? candidates.filter((p) => hasKeyword(p.key_ingredients, keywords)) : [];
  let pool = withKeyword.length > 0 ? withKeyword : candidates;

  if (preferDeepTones) {
    const deepToneMatch = pool.filter((p) => p.skin_type_match.includes("Deep Tones"));
    if (deepToneMatch.length > 0) pool = deepToneMatch;
  }

  return [...pool].sort((a, b) => overallScore(b) - overallScore(a) || b.score_climate - a.score_climate)[0];
};

export interface GroundedPick {
  slot: string;
  product: ProductReview;
}

export interface GroundedRoutine {
  am: GroundedPick[];
  pm: GroundedPick[];
}

/**
 * Picks real, SkinLabs-reviewed products for the AM and PM routines. `mstTone` (1–10,
 * optional, self-reported) only ever nudges toward catalogue tags that already exist
 * (e.g. "Deep Tones" for pigmentation-fading picks) — it never changes which skin type
 * or concern is being solved for.
 */
export const pickGroundedRoutine = (
  skinType: FormulaSkinType,
  concern: FormulaConcern,
  options: { sensitive?: boolean; mstTone?: number | null } = {},
): GroundedRoutine => {
  const { sensitive = false, mstTone = null } = options;
  const deepTones = typeof mstTone === "number" && mstTone >= 7 && (concern === "brightening" || concern === "acne");
  const kw = CONCERN_ACTIVE_KEYWORDS[concern];

  const cleanser = findBestProduct({ category: "Cleanser", skinType, preferSensitive: sensitive });
  const moisturiser = findBestProduct({ category: "Moisturiser", skinType, preferSensitive: sensitive });
  const sunscreen = findBestProduct({ category: "Sunscreen", skinType, preferSensitive: sensitive });
  const amSerum = findBestProduct({ category: "Serum", skinType, preferSensitive: sensitive, keywords: kw.am, preferDeepTones: deepTones });
  const pmSerum = findBestProduct({ category: "Serum", skinType, preferSensitive: sensitive, keywords: kw.pm, preferDeepTones: deepTones });

  const am: GroundedPick[] = [];
  if (cleanser) am.push({ slot: "Cleanser", product: cleanser });
  if (amSerum) am.push({ slot: "Serum", product: amSerum });
  if (moisturiser) am.push({ slot: "Moisturiser", product: moisturiser });
  if (sunscreen) am.push({ slot: "SPF", product: sunscreen });

  const pm: GroundedPick[] = [];
  if (cleanser) pm.push({ slot: "Cleanser", product: cleanser });
  if (pmSerum && pmSerum.id !== amSerum?.id) pm.push({ slot: "Treatment", product: pmSerum });
  if (moisturiser) pm.push({ slot: "Moisturiser", product: moisturiser });

  return { am, pm };
};

export const formatPick = (pick: GroundedPick) =>
  `${pick.product.brand} ${pick.product.product_name} (R${pick.product.local_price_zar} — ${pick.product.category}, SkinLabs score ${overallScore(pick.product)}/10)`;
