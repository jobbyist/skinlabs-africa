import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { enhancedProductReviewJsonLd, productReviewJsonLd } from "../seo/jsonLd";

// Pins the fix for Google Search Console's "Review has multiple aggregate
// ratings" (in "review" / in "aggregateRating") errors, 2026-09-25.

const base = {
  canonicalUrl: "https://skinlabs.co.za/reviews/x",
  productName: "Test Cream",
  brand: "Test Brand",
  category: "Moisturiser",
  ratingValue: 8.8,
  reviewBody: "Grounded verdict.",
};

const productNode = (out: Record<string, unknown>) =>
  (Array.isArray(out["@graph"]) ? (out["@graph"] as Record<string, unknown>[])[0] : out) as Record<string, unknown>;

describe("productReviewJsonLd", () => {
  it("emits no aggregateRating without real community ratings", () => {
    const product = productNode(productReviewJsonLd(base));
    expect(product.aggregateRating).toBeUndefined();
    // The editorial verdict is a single Review, not an aggregate.
    expect(Array.isArray(product.review)).toBe(false);
    expect((product.review as Record<string, unknown>)["@type"]).toBe("Review");
  });

  it("emits exactly one aggregateRating object when real ratings exist", () => {
    const product = productNode(productReviewJsonLd({ ...base, communityRating: { average: 4.333, count: 3 } }));
    expect(Array.isArray(product.aggregateRating)).toBe(false);
    expect(product.aggregateRating).toMatchObject({ "@type": "AggregateRating", ratingValue: 4.3, bestRating: 5, ratingCount: 3 });
  });

  it("ignores a zero-count community rating", () => {
    const product = productNode(productReviewJsonLd({ ...base, communityRating: { average: 4, count: 0 } }));
    expect(product.aggregateRating).toBeUndefined();
  });

  it("keeps a single aggregateRating in the paywalled @graph shape", () => {
    const out = productReviewJsonLd({ ...base, communityRating: { average: 4, count: 2 }, paywallCssSelector: ".x" });
    const product = productNode(out);
    expect(Array.isArray(product.aggregateRating)).toBe(false);
    const graph = out["@graph"] as Record<string, unknown>[];
    expect(graph.filter((n) => n["@type"] === "Product")).toHaveLength(1);
  });
});

describe("enhancedProductReviewJsonLd", () => {
  const input = { ...base, editorialScore: 8.8 };
  it("emits no aggregateRating without community ratings", () => {
    expect(enhancedProductReviewJsonLd(input).aggregateRating).toBeUndefined();
  });
  it("emits one aggregateRating when community ratings exist", () => {
    const out = enhancedProductReviewJsonLd({ ...input, communityRating: 4.5, communityReviewCount: 2 });
    expect(Array.isArray(out.aggregateRating)).toBe(false);
    expect(out.aggregateRating).toMatchObject({ ratingValue: 4.5, ratingCount: 2 });
  });
});

describe("review pages never feed generated member stats into structured data", () => {
  const root = join(import.meta.dir, "..", "..");
  for (const file of ["routes/reviews.$slug.tsx", "pages/ProductReview.tsx", "components/SitewideSEO.tsx"]) {
    it(`${file} does not use getMemberRatingStats`, () => {
      expect(readFileSync(join(root, file), "utf8")).not.toContain("getMemberRatingStats");
    });
  }
  it("SitewideSEO emits no Product JSON-LD (the review page owns it)", () => {
    expect(readFileSync(join(root, "components/SitewideSEO.tsx"), "utf8")).not.toContain('"@type": "Product"');
  });
});

describe("language markup", () => {
  it("SEO.tsx uses the ISO 639-1 code, not the word 'English'", () => {
    const seo = readFileSync(join(import.meta.dir, "..", "..", "components", "SEO.tsx"), "utf8");
    expect(seo).not.toMatch(/content="English"/i);
    expect(seo).toContain('<meta name="language" content="en" />');
  });
});
