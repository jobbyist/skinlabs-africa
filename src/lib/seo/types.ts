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
  /** Absolute image URL. Omit if no real image resolved -- never fabricate one. */
  image?: string;
  /** Offer data from actual retailers. Omit entirely when there are no listings. */
  offers?: { lowPrice: number; highPrice: number; offerCount: number };
  
  /** Editorial Review Data - Always present, this is SkinLabs' professional assessment */
  editorialReview: {
    /** overallScore() out of 10 -- SkinLabs editorial score */
    ratingValue: number;
    /** The verdict text from the review */
    reviewBody: string;
    /** Optional: Date the review was published */
    datePublished?: string;
  };
  
  /** Community Rating Data - ONLY include if actual community ratings exist.
   * This is separate from editorial score per Schema.org best practices and
   * Google's guidelines. Never use editorial score as if it's community rating. */
  communityRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  
  /** Product details for enhanced structured data */
  description?: string;
  sku?: string;
  gtin?: string;
  /** Product size/volume, e.g., "50ml", "1.7 fl oz" */
  size?: string;
  /** Country of origin */
  countryOfOrigin?: string;
}

/**
 * FAQ structured data for a product review page.
 * Each Q&A should be genuinely about this specific product, not generic FAQs.
 */
export interface FAQJsonLdInput {
  /** Page canonical URL */
  canonicalUrl: string;
  /** Array of question/answer pairs */
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Enhanced product review that includes separate editorial and community data.
 * This replaces the problematic pattern of using editorial scores in AggregateRating.
 */
export interface EnhancedProductReviewJsonLdInput {
  canonicalUrl: string;
  productName: string;
  brand: string;
  category: string;
  image?: string;
  description?: string;
  offers?: { lowPrice: number; highPrice: number; offerCount: number };
  size?: string;
  countryOfOrigin?: string;
  
  /** SkinLabs editorial review (always present) */
  editorialScore: number;
  reviewBody: string;
  reviewDatePublished?: string;
  
  /** Community ratings (only if they exist) */
  communityRating?: number;
  communityReviewCount?: number;
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
