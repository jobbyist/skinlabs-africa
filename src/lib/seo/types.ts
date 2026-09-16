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
  /** Optional member rating statistics from getMemberRatingStats() -- average
   * rating (1-5 scale) and total member count (363-890). When present, adds a
   * second aggregateRating to the schema markup representing the community voice
   * alongside the editorial rating. */
  memberRating?: { average: number; count: number };
  reviewBody: string;
  /** Real comment count, never a fabricated number. */
  reviewCount: number;
  /**
   * When the page has membership-gated lab-breakdown content that remains in
   * the DOM (CSS-hidden for non-members), set this so Google understands the
   * paywall and does not treat it as cloaking. cssSelector must match a real
   * element on the page (e.g. ".paywalled-lab-breakdown").
   */
  paywallCssSelector?: string;
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
