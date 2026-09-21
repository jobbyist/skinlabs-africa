/**
 * Shelf Showdown: SkinLabs comparison-article franchise under /reviews/versus.
 */
export type {
  ComparisonLink,
  ComparedProduct,
  ComparisonVerdict,
  ComparisonFaq,
  ComparisonArticle,
} from "./comparisons-types";

import { comparisonArticlesPart1 } from "./comparisons-part1";
import { comparisonArticlesPart2 } from "./comparisons-part2";
import { comparisonArticlesPart3 } from "./comparisons-part3";
import { comparisonArticlesPart4 } from "./comparisons-part4";

export const comparisonArticles = [
  ...comparisonArticlesPart1,
  ...comparisonArticlesPart2,
  ...comparisonArticlesPart3,
  ...comparisonArticlesPart4,
];

export const getComparison = (slug: string) =>
  comparisonArticles.find((article) => article.slug === slug);
