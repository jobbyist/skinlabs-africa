/**
 * Lightweight context-aware internal linking: given a handful of keywords describing
 * the page you're on (an ingredient, a concern, a brand, a category, or even a full
 * sentence like a key takeaway), find the most relevant Knowledge Hub answers to link
 * to. Powers the "From the Knowledge Hub" module reused across product reviews,
 * Spotlight brand profiles, Shelf Showdown comparisons and Daily Skinny briefings so
 * every content type on the platform connects back to the evidence layer instead of
 * dead-ending.
 */
import { faqEntries, type FAQEntry } from "@/data/faq";
import { norm, SEARCH_STOPWORDS } from "@/lib/search-taxonomy";

/** Splits keyword strings (single terms like "Niacinamide" or full sentences like a
 *  key takeaway) into significant, deduplicated words worth matching on. */
const significantWords = (keywords: string[]): string[] => {
  const words = keywords
    .flatMap((keyword) => norm(keyword).split(/\s+/))
    .filter((word) => word.length > 2 && !SEARCH_STOPWORDS.has(word));
  return Array.from(new Set(words));
};

/** Returns the FAQ entries whose tags/question/category best match the given keywords,
 *  ranked by number of distinct word matches (ties broken by original order). */
export const relatedKnowledgeHubEntries = (keywords: string[], limit = 3): FAQEntry[] => {
  const words = significantWords(keywords);
  if (words.length === 0) return [];

  const scored = faqEntries.map((entry) => {
    const haystack = norm(`${entry.question} ${entry.tags.join(" ")} ${entry.category}`);
    const score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
};
