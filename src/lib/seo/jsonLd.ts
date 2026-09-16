import { BRAND, SITE_URL, DEFAULT_OG } from "@/lib/seo-config";
import type {
  ArticleJsonLdInput,
  BreadcrumbItem,
  IngredientJsonLdInput,
  ProductReviewJsonLdInput,
  SpotlightBrandJsonLdInput,
} from "./types";

/**
 * Article JSON-LD, grounded only in fields the caller actually has -- never
 * fabricates a rating, author bio, or word count. `author`/`publisher` are
 * always the real SkinLabs® organization (this app has no per-article human
 * byline data today); revisit if that changes.
 */
export function articleJsonLd(input: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${input.canonicalUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.canonicalUrl },
    headline: input.headline,
    description: input.description,
    ...(input.images && input.images.length > 0 ? { image: input.images } : {}),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { "@type": "Organization", name: BRAND, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: DEFAULT_OG },
    },
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
  };
}

/**
 * Product + Review + AggregateRating JSON-LD, matching the shape
 * src/pages/ProductReview.tsx already emits inline (verified byte-equivalent
 * fields) -- extracted here so the SSR-migrated route and the existing
 * client-rendered page describe the same product identically. Emitted as
 * separate script tags via buildHeadTags() rather than the page's own
 * `@graph` wrapper; both are valid JSON-LD, and separate blocks match the
 * convention already established for Briefings (Article + BreadcrumbList
 * as two blocks). Every field here is real, computed data -- ratingValue is
 * the same overallScore() used throughout the app, reviewCount reflects
 * actual comment rows, never a fabricated count.
 */
export function productReviewJsonLd(input: ProductReviewJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${input.canonicalUrl}#product`,
    name: input.productName,
    brand: { "@type": "Brand", name: input.brand },
    category: input.category,
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.offers
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "ZAR",
            lowPrice: input.offers.lowPrice,
            highPrice: input.offers.highPrice,
            offerCount: input.offers.offerCount,
          },
        }
      : {}),
    review: {
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: input.ratingValue, bestRating: 10 },
      author: { "@type": "Organization", name: BRAND },
      reviewBody: input.reviewBody,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue,
      bestRating: 10,
      reviewCount: input.reviewCount,
    },
  };
}

/**
 * DefinedTerm JSON-LD for an ingredient detail page -- there's no dedicated
 * schema.org type for a cosmetic-ingredient reference entry, and DefinedTerm
 * (a term defined within some larger vocabulary/dataset) is the closest
 * accurate fit without overclaiming (e.g. Product, which this isn't).
 */
export function ingredientJsonLd(input: IngredientJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${input.canonicalUrl}#ingredient`,
    name: input.name,
    description: input.description,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${BRAND} Ingredients Intelligence`,
      url: `${SITE_URL}/ingredients`,
    },
    ...(input.category ? { termCode: input.category } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": input.canonicalUrl },
  };
}

/**
 * Matches SpotlightBrandProfile.tsx's existing inline Article block
 * (headline/description/author/publisher/mainEntityOfPage only -- see
 * SpotlightBrandJsonLdInput's own doc comment for why date/image fields
 * are deliberately absent here) so the SSR route and the client page
 * describe a brand profile identically.
 */
export function spotlightBrandJsonLd(input: SpotlightBrandJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${input.canonicalUrl}#article`,
    headline: input.headline,
    description: input.description,
    author: { "@type": "Organization", name: BRAND, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: DEFAULT_OG },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.canonicalUrl },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
