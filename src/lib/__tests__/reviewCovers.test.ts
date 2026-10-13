import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { comparisonArticles } from "@/data/comparisons";
import { comparisonCategory, withCategoryCover } from "@/lib/comparisonCover";
import { REVIEW_PLACEHOLDER_IMAGE, getCategoryImage } from "@/data/productImages";

describe("review placeholder", () => {
  test("is a branded local asset, not a stock photo", () => {
    expect(REVIEW_PLACEHOLDER_IMAGE.url).toBe("/images/review-placeholder.jpg");
    expect(REVIEW_PLACEHOLDER_IMAGE.url).not.toContain("unsplash");
    expect(existsSync(`public${REVIEW_PLACEHOLDER_IMAGE.url}`)).toBe(true);
  });
});

describe("comparison covers", () => {
  test("every published showdown carries its category's Unsplash cover", () => {
    expect(comparisonArticles.length).toBeGreaterThan(0);
    for (const a of comparisonArticles) {
      const photo = getCategoryImage(comparisonCategory(a));
      expect(a.thumbnail.url).toBe(photo.url);
      expect(a.thumbnail.url).toContain("images.unsplash.com");
      expect(a.thumbnail.creditUrl).toContain("unsplash.com");
    }
  });

  test("category comes from the title/context first, then the compared products", () => {
    const base = { title: "", saContext: "", productsCompared: [] as never[] };
    expect(comparisonCategory({ ...base, title: "Sunscreen showdown" })).toBe("Sunscreen");
    expect(comparisonCategory({ ...base, saContext: "Cleansers" })).toBe("Cleanser");
    expect(comparisonCategory({ ...base, productsCompared: [{ name: "Vitamin C Serum", brand: "x", priceZar: 1 }] })).toBe("Serum");
    expect(comparisonCategory(base)).toBe("");
  });

  test("withCategoryCover keeps everything but the thumbnail", () => {
    const a = comparisonArticles[0];
    const b = withCategoryCover({ ...a, thumbnail: { url: "x", alt: "y", creditName: "z", creditUrl: "w" } });
    expect(b.slug).toBe(a.slug);
    expect(b.thumbnail.url).toContain("unsplash");
  });
});
