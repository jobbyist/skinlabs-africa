/**
 * Review pages that cover a product another review page already covers.
 *
 * The hand-written catalogue (src/data/reviews.ts) and the daily pipeline
 * (ai_generated_product_reviews) both reviewed the same OpenHaus products, and a
 * few pipeline runs produced the same product twice (the `-6415` style suffix).
 * That left two or three indexable URLs competing for one query, so search
 * engines split the signals or pick the weaker page.
 *
 * Map: duplicate review id -> the id that keeps the URL. Rules used:
 *  - the hand-written catalogue entry wins over a pipeline entry;
 *  - between two pipeline entries the first one published wins.
 *
 * Consumers: vercel.json (301 redirects, kept in sync by duplicateReviews.test.ts)
 * and both sitemap generators (duplicates are never listed).
 */
export const DUPLICATE_REVIEW_CANONICALS: Record<string, string> = {
  // Standard Beauty: pipeline duplicates of hand-written reviews
  "standard-beauty-salicylic-acid-face-wash": "sb-salicylic-face-wash",
  "standard-beauty-renew-your-dew-ceramide-butter": "sb-renew-dew-ceramide-butter",
  "standard-beauty-moisture-bomb": "sb-moisture-bomb",
  "standard-beauty-mild-face-wash": "sb-mild-face-wash",
  "standard-beauty-2-alpha-arbutin-serum": "sb-alpha-arbutin-2",
  // Lelive: pipeline duplicates of hand-written reviews
  "lelive-all-the-shade-marula-tinted-spf-30-moisturiser": "lelive-all-the-shade-spf30",
  "lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser": "lelive-cleaner-colada-oil-cleanser",
  "lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser-2503": "lelive-cleaner-colada-oil-cleanser",
  "lelive-rooibos-aloe-jelly-splash-cleanser": "lelive-jelly-splash-cleanser",
  "lelive-rooibos-aloe-jelly-splash-cleanser-6694": "lelive-jelly-splash-cleanser",
  "aigen-lelive-all-glow-d-up-vitamin-c-turmeric-hyaluronic-acid-brig": "lelive-all-glowd-up-serum",
  "lelive-save-our-skin-peach-aloe-aha-bha-exfoliator": "lelive-save-our-skin-exfoliating",
  "lelive-the-du-pont-shea-butter-lush-moisturiser": "lelive-dupont-shea-moisturiser",
  "aigen-lelive-cr-me-de-la-cream-african-mahogany-everyday-moisturis": "lelive-creme-de-la-cream",
  "lelive-eye-conic-peptide-coffee-arabica-eye-cream": "lelive-eye-conic-eye-cream",
  // Lelive: the pipeline reviewed the same product twice
  "lelive-body-glow-up-mini-edition-6415": "lelive-body-glow-up-mini-edition",
};

export const isDuplicateReview = (id: string): boolean => id in DUPLICATE_REVIEW_CANONICALS;
