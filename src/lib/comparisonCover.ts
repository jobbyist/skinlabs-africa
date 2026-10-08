import { getComparisonCoverImage } from "@/data/productImages";
import type { ComparisonArticle } from "@/data/comparisons-types";

/**
 * Shelf Showdown covers are the category-specific Unsplash photo (same set the review categories use), chosen from
 * what the showdown compares, not a per-article upload. Pure and catalogue-free so the entry chunk stays light.
 * A showdown that spans several categories (or none we recognise) gets the generic skincare flat-lay.
 */
const RULES: [RegExp, string][] = [
  [/\b(sunscreen|spf|sun care|sun protection|sunblock)\b/i, "Sunscreen"],
  [/\beye\b/i, "Eye Cream"],
  [/\b(body|lotion|butter)\b/i, "Body"],
  [/\b(cleanser|cleansers|cleansing|face wash|foam|micellar)\b/i, "Cleanser"],
  [/\b(exfoliant|exfoliating|exfoliator|aha|bha|salicylic|glycolic|peel|toner)\b/i, "Exfoliant"],
  [/\b(mist|essence)\b/i, "Mist"],
  [/\b(moisturi[sz]er|moisturi[sz]ers|cream|barrier|hydrat\w*|ceramide)\b/i, "Moisturiser"],
  [/\b(serum|serums|vitamin c|niacinamide|retinol|retinoid|retinoids|pigmentation|brightening|actives?)\b/i, "Serum"],
];

export const comparisonCategory = (article: Pick<ComparisonArticle, "title" | "saContext" | "productsCompared">): string => {
  const sources = [`${article.title} ${article.saContext}`, article.productsCompared.map((p) => p.name).join(" ")];
  for (const text of sources) {
    for (const [pattern, category] of RULES) if (pattern.test(text)) return category;
  }
  return "";
};

export const withCategoryCover = <T extends ComparisonArticle>(article: T): T => {
  const category = comparisonCategory(article);
  const photo = getComparisonCoverImage(category);
  return { ...article, thumbnail: { url: photo.url, alt: photo.alt, creditName: photo.creditName, creditUrl: photo.creditUrl } };
};
