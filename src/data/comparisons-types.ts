/**
 * Shelf Showdown: SkinLabs' comparison-article franchise, published under /reviews
 * per the Brand Voice and Editorial Publishing Standards. Each entry is an original,
 * editorially independent head-to-head — never a ranked "winner," always a "better
 * for X" breakdown so the reader can match the product to their own skin.
 */

export interface ComparisonLink {
  label: string;
  url: string;
}

export interface ComparedProduct {
  name: string;
  brand: string;
  priceZar: number;
  /** Slug into productReviews, when SkinLabs has a full standalone review for this product. */
  reviewSlug?: string;
  officialProductUrl?: string;
  officialBrandUrl: string;
  retailer?: ComparisonLink;
}

export interface ComparisonVerdict {
  label: string;
  text: string;
}

export interface ComparisonFaq {
  question: string;
  answer: string;
}

export interface ComparisonArticle {
  slug: string;
  title: string;
  dek: string;
  saContext: string;
  publishDate: string;
  modifiedDate: string;
  readingTime: string;
  featured?: boolean;
  thumbnail: {
    url: string;
    alt: string;
    creditName: string;
    creditUrl: string;
  };
  productsCompared: ComparedProduct[];
  /** Markdown body — headings, paragraphs, tables. Rendered with react-markdown + remark-gfm. */
  bodyMarkdown: string;
  verdicts: ComparisonVerdict[];
  keyTakeaways: string[];
  /** Optional on-page FAQ block, rendered as h2/h3 and emitted as FAQPage JSON-LD for AI/Google answer surfaces. */
  faqs?: ComparisonFaq[];
  seoTitle: string;
  seoDescription: string;
}
