/**
 * Shared types for the TanStack Start SSR SEO layer (src/lib/seo/*). Content-
 * type-agnostic -- Briefings is the first consumer, but nothing here assumes
 * anything about a specific table/schema. See
 * docs/architecture/tanstack-start-production-migration.md.
 */

export interface PageMeta {
  /** Search-facing title. Pass the full, final title -- callers append the
   * brand themselves via their own title-generator (e.g. seo-config.ts's
   * `articleTitle`), matching the existing convention. */
  title: string;
  /** Page-specific description, already clamped to ~160 chars. */
  description: string;
  /** Site-relative path, e.g. "/briefings/some-slug". */
  canonicalPath: string;
  ogType?: "website" | "article";
  /** Absolute or site-relative image URL. Falls back to DEFAULT_OG. */
  ogImage?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface ArticleJsonLdInput {
  canonicalUrl: string;
  headline: string;
  description: string;
  /** Absolute image URL(s). Omit entirely if there's no real cover image --
   * never fabricate one. */
  images?: string[];
  datePublished: string;
  dateModified: string;
  /** Real content section label, e.g. "The Daily Skinny". */
  articleSection?: string;
}

export interface ProductReviewJsonLdInput {
  canonicalUrl: string;
  productName: string;
  brand: string;
  category: string;
  /** Short product description (typically the verdict). */
  description?: string;
  /** Absolute image URL. Omit if no real image resolved -- never fabricate one. */
  image?: string;
  /** Omit entirely (not zero/null) when there are no real retailer listings --
   * some AI-generated reviews genuinely have none yet. Never synthesize a
   * price range from an empty list (Math.min/max of [] is +-Infinity, which
   * serializes to invalid `null` JSON-LD). */
  offers?: { lowPrice: number; highPrice: number; offerCount: number };
  /** overallScore() out of 10 -- same scale used everywhere else in the app. */
  ratingValue: number;
  /** REAL community ratings only (rows in `review_ratings`, 1-5 scale). When
   * count > 0 this becomes the page's single aggregateRating; otherwise none is
   * emitted. Never pass getMemberRatingStats() output here -- it is
   * hash-generated, and Google flags multiple/self-serving aggregate ratings. */
  communityRating?: { average: number; count: number };
  reviewBody: string;
  /**
   * When the page has membership-gated lab-breakdown content that remains in
   * the DOM (CSS-hidden for non-members), set this so Google understands the
   * paywall and does not treat it as cloaking. cssSelector must match a real
   * element on the page (e.g. ".paywalled-lab-breakdown").
   */
  paywallCssSelector?: string;
}

/** Input for enhancedProductReviewJsonLd() -- separates the editorial (0-10) Review
 *  from a real community (0-5) AggregateRating, per Google's product-review
 *  guidelines. See that function's own header comment in seo/jsonLd.ts. */
export interface EnhancedProductReviewJsonLdInput {
  canonicalUrl: string;
  productName: string;
  brand: string;
  category: string;
  description?: string;
  /** Absolute image URL. Omit if no real image resolved -- never fabricate one. */
  image?: string;
  /** Real product_size from the pipeline (e.g. "50ml") -- omit if not stated. */
  size?: string;
  /** Real country_of_origin from the pipeline -- omit if not stated. */
  countryOfOrigin?: string;
  /** Same Math.min/max-of-empty-array caution as ProductReviewJsonLdInput.offers. */
  offers?: { lowPrice: number; highPrice: number; offerCount: number };
  /** overallScore() out of 10. */
  editorialScore: number;
  reviewBody: string;
  reviewDatePublished?: string;
  /** Both required together -- see enhancedProductReviewJsonLd()'s own guard, which
   *  only emits aggregateRating when communityReviewCount > 0. */
  communityRating?: number;
  communityReviewCount?: number;
}

/** Input for faqJsonLd() -- only ever real, source-grounded question/answer pairs
 *  (e.g. the product-review pipeline's generateSupplementalFields() output). */
export interface FAQJsonLdInput {
  faqs: { question: string; answer: string }[];
}

export interface IngredientJsonLdInput {
  canonicalUrl: string;
  /** Display name -- common_name || inci_name, same precedence as the page itself. */
  name: string;
  /** Human-readable category label, e.g. "Humectant" -- via ingredientCategoryLabel(). */
  category: string;
  description: string;
}

/**
 * Deliberately narrower than ArticleJsonLdInput: SpotlightBrandProfile.tsx's
 * own inline JSON-LD (the shape this must match byte-for-byte) has never
 * carried datePublished/dateModified/image -- brand entries in
 * src/data/spotlight.ts have no real per-brand date or logo-URL field to
 * source them from, and CLAUDE.md's standing rule is never fabricate.
 * Revisit if spotlight.ts ever gains real per-brand timestamps.
 */
export interface SpotlightBrandJsonLdInput {
  canonicalUrl: string;
  headline: string;
  description: string;
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. */
  url: string;
}

/** The exact shape TanStack Router's `head()` expects back (confirmed by
 * reading node_modules/@tanstack/react-router/dist/esm/headContentUtils.js --
 * `scripts` entries are FLAT {type, children}, not {attrs, children}). */
export interface HeadTags {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string }>;
  scripts: Array<{ type: string; children: string }>;
}
