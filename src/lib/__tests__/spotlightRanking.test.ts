import { describe, expect, test } from "bun:test";
import { productReviews, type ProductReview } from "@/data/reviews";
import { brandKey, computeSpotlightRanking, findSpotlightBrandFor, getSpotlightBrand } from "@/data/spotlight";

const generated = (over: Partial<ProductReview> & Pick<ProductReview, "id" | "brand">): ProductReview => ({
  product_name: `Product ${over.id}`,
  local_price_zar: 200,
  where_to_buy: "Online",
  category: "Serum",
  skin_type_match: [],
  score_efficacy: 8,
  score_value: 8,
  score_texture: 8,
  score_climate: 8,
  verdict: "A well-formulated serum that suits humid coastal conditions.",
  key_ingredients: [],
  retailers: [],
  isNew: false,
  published_date: "2026-10-01",
  ...over,
} as ProductReview);

describe("brandKey", () => {
  test("folds case, accents, punctuation and a trailing skincare", () => {
    expect(brandKey("SKOON.")).toBe(brandKey("Skoon"));
    expect(brandKey("Gève Skincare")).toBe(brandKey("Geve"));
    expect(brandKey("Timeless Skin Care")).toBe("timeless");
    expect(brandKey("Lelive.")).toBe("lelive");
  });
});

describe("computeSpotlightRanking with generated reviews", () => {
  const merged = computeSpotlightRanking([
    ...productReviews,
    generated({ id: "g1", brand: "Timeless Skin Care" }),
    generated({ id: "g2", brand: "Timeless Skin Care", is_sponsored: true }),
    generated({ id: "g3", brand: "Gève Skincare" }),
    generated({ id: "g4", brand: "Geve" }),
    generated({ id: "g5", brand: "Lonely Brand" }),
    generated({ id: "g6", brand: "SKOON." }),
  ]);

  test("a brand with two published reviews is Ranked, even with no editorial overlay", () => {
    const timeless = merged.find((e) => e.brand === "Timeless Skin Care");
    expect(timeless?.tier).toBe("ranked");
    expect(timeless?.productCount).toBe(2);
    expect(timeless?.rank).not.toBeNull();
  });

  test("spelling variants merge into one entry", () => {
    expect(merged.filter((e) => brandKey(e.brand) === "geve")).toHaveLength(1);
    expect(merged.find((e) => brandKey(e.brand) === "geve")?.productCount).toBe(2);
    const skoon = merged.filter((e) => brandKey(e.brand) === "skoon");
    expect(skoon).toHaveLength(1);
    expect(skoon[0].brand).toBe("Skoon");
  });

  test("a single review lands in New on the Radar", () => {
    const lonely = merged.find((e) => e.brand === "Lonely Brand");
    expect(lonely?.tier).toBe("new-on-the-radar");
    expect(lonely?.rank).toBeNull();
  });

  test("derived profiles use only review facts and disclose sponsorship", () => {
    const timeless = merged.find((e) => e.brand === "Timeless Skin Care")!;
    expect(timeless.editorial.officialWebsite).toBeUndefined();
    expect(timeless.editorial.brandStory).toBeUndefined();
    expect(timeless.editorial.skinlabsTake).toContain("Product g1");
    expect(timeless.editorial.evidenceLimitation).toContain("Sponsored");
    expect(timeless.slug).toBe("timeless-skin-care");
  });

  test("hand-written prose follows the live review count", () => {
    const sb = merged.find((e) => e.brand === "Standard Beauty")!;
    expect(sb.editorial.whyTheyMadeTheList).not.toContain("{count}");
    expect(sb.editorial.whyTheyMadeTheList).toContain(`${sb.productCount} reviewed products`);
  });

  test("lookups resolve by slug and by any spelling of the brand", () => {
    expect(getSpotlightBrand("timeless-skin-care", merged)?.brand).toBe("Timeless Skin Care");
    expect(findSpotlightBrandFor("SKOON.", merged)?.brand).toBe("Skoon");
  });

  test("ranked entries are ordered by score and ranks are consecutive", () => {
    const ranked = merged.filter((e) => e.tier === "ranked");
    ranked.forEach((e, i) => expect(e.rank).toBe(i + 1));
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].avgOverallScore).toBeGreaterThanOrEqual(ranked[i].avgOverallScore);
  });
});

describe("static catalogue only", () => {
  test("still ranks every brand with two or more reviews and never leaves a placeholder token", () => {
    const all = computeSpotlightRanking();
    for (const e of all) {
      expect(e.editorial.skinlabsTake).not.toContain("{count}");
      expect(e.editorial.whyTheyMadeTheList).not.toContain("{count}");
      expect(e.tier).toBe(e.productCount >= 2 ? "ranked" : "new-on-the-radar");
    }
  });
});
