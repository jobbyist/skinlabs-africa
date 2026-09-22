import { BRAND, SITE_URL, DEFAULT_OG } from "@/lib/seo-config";
import type {
  ArticleJsonLdInput,
  BreadcrumbItem,
  EnhancedProductReviewJsonLdInput,
  FAQJsonLdInput,
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
 * Product + Review (+ optional paywall WebPage) JSON-LD matching the published
 * product-review schema template. Emits a single Product node with @id,
 * description, brand, review (incl. worstRating), and when paywallCssSelector
 * is set, a companion WebPage node with isAccessibleForFree: false + hasPart
 * so Googlebot does not treat CSS-hidden premium content as cloaking.
 * BreadcrumbList is emitted separately via breadcrumbJsonLd().
 */
export function productReviewJsonLd(input: ProductReviewJsonLdInput) {
  const product: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${input.canonicalUrl}#product`,
    name: input.productName,
    brand: { "@type": "Brand", name: input.brand },
    category: input.category,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
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
      author: { "@type": "Organization", name: BRAND },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(input.ratingValue),
        bestRating: "10",
        worstRating: "1",
      },
      reviewBody: input.reviewBody,
    },
  };

  // Editorial aggregate rating (0-10 scale)
  const editorialRating = {
    "@type": "AggregateRating",
    ratingValue: input.ratingValue,
    bestRating: 10,
    worstRating: 1,
    reviewCount: input.reviewCount,
  };

  // If member ratings are available, include them as a second aggregateRating
  // (1-5 scale, representing community voice)
  if (input.memberRating) {
    product.aggregateRating = [
      editorialRating,
      {
      "@type": "AggregateRating",
        ratingValue: input.memberRating.average,
        bestRating: 5,
      worstRating: 1,
        reviewCount: input.memberRating.count,
      },
    ];
  } else {
    product.aggregateRating = editorialRating;
  }

  if (!input.paywallCssSelector) {
    return { "@context": "https://schema.org", ...product };
  }

  // Paywalled lab breakdown remains in the DOM (CSS-hidden for non-members).
  // Declare it explicitly so crawlers do not interpret the hidden content as cloaking.
  const webPage = {
    "@type": "WebPage",
    "@id": `${input.canonicalUrl}#webpage`,
    url: input.canonicalUrl,
    isAccessibleForFree: false,
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: input.paywallCssSelector,
    },
    mainEntity: { "@id": `${input.canonicalUrl}#product` },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [product, webPage],
  };
}

/**
 * Enhanced Product Review JSON-LD following Schema.org and Google guidelines.
 *
 * Key improvements:
 * 1. Separates editorial Review from community AggregateRating
 * 2. Editorial review uses Organization author (SkinLabs)
 * 3. AggregateRating only included when community ratings exist
 * 4. Editorial score is 0-10, community is 0-5 (different scales clearly marked)
 * 5. Never fabricates data - all fields from real database content
 * 
 * Per Google's product review guidelines:
 * - Review must be from the reviewing organization (SkinLabs)
 * - AggregateRating should reflect actual customer/community ratings
 * - Never use editorial score as if it's aggregate customer rating
 */
export function enhancedProductReviewJsonLd(input: EnhancedProductReviewJsonLdInput) {
  const productData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${input.canonicalUrl}#product`,
    name: input.productName,
    brand: { "@type": "Brand", name: input.brand },
    category: input.category,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.size ? { size: input.size } : {}),
    ...(input.countryOfOrigin ? { countryOfOrigin: input.countryOfOrigin } : {}),
  };

  // Add offers if available
  if (input.offers) {
    productData.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "ZAR",
      lowPrice: input.offers.lowPrice,
      highPrice: input.offers.highPrice,
      offerCount: input.offers.offerCount,
    };
  }

  // Editorial review (always present)
  productData.review = {
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.editorialScore,
      bestRating: 10,
      worstRating: 1,
    },
    author: { "@type": "Organization", name: BRAND },
    reviewBody: input.reviewBody,
    ...(input.reviewDatePublished ? { datePublished: input.reviewDatePublished } : {}),
  };

  // Community rating (only if it exists)
  if (input.communityRating !== undefined && input.communityReviewCount !== undefined && input.communityReviewCount > 0) {
    productData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.communityRating,
      bestRating: 5, // Community uses 5-star scale
      worstRating: 1,
      reviewCount: input.communityReviewCount,
    };
  }

  return productData;
}

/**
 * FAQ JSON-LD for a product review page.
 * Only include this when genuine product-specific FAQs exist.
 */
export function faqJsonLd(input: FAQJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: input.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
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
