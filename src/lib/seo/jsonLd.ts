import { BRAND, SITE_URL, DEFAULT_OG } from "@/lib/seo-config";
import type { ArticleJsonLdInput, BreadcrumbItem } from "./types";

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
