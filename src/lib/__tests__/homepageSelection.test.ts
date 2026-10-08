import { describe, expect, test } from "bun:test";
import { pickRotatingEditorials, shuffled } from "@/lib/homepageSelection";
import { pickLatestReviews } from "@/lib/latestReviews";
import { featuredEditorials } from "@/data/editorials";
import { getCategoryImage } from "@/data/productImages";
import { productReviews, reviewCategories, type ProductReview } from "@/data/reviews";

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

describe("rotating Shelf Showdowns", () => {
  test("returns 3 distinct published showdowns and never mutates the source", () => {
    const before = featuredEditorials.map((e) => e.slug);
    const picked = pickRotatingEditorials(featuredEditorials);
    expect(picked).toHaveLength(3);
    expect(new Set(picked.map((e) => e.slug)).size).toBe(3);
    expect(picked.every((e) => !e.comingSoon)).toBe(true);
    expect(featuredEditorials.map((e) => e.slug)).toEqual(before);
  });
  test("different loads can produce different sets", () => {
    const sets = new Set(Array.from({ length: 20 }, (_, i) => pickRotatingEditorials(featuredEditorials, 3, seeded(i + 1)).map((e) => e.slug).join()));
    expect(sets.size).toBeGreaterThan(1);
  });
  test("shuffle keeps every item", () => {
    expect(shuffled([1, 2, 3, 4, 5], seeded(7)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("latest reviews", () => {
  const mk = (id: string, date: string): ProductReview => ({ ...productReviews[0], id, published_date: date, isNew: false });
  test("newest published first, 3 only", () => {
    const out = pickLatestReviews([mk("a", "2026-10-01"), mk("b", "2026-10-07"), mk("c", "2026-10-03"), mk("d", "2026-09-01")]);
    expect(out.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });
  test("tops up from the catalogue when fewer than 3 exist", () => {
    expect(pickLatestReviews([mk("a", "2026-10-01")])).toHaveLength(3);
    expect(pickLatestReviews(undefined).length).toBeGreaterThan(0);
  });
});

describe("category review images", () => {
  test("same category always gets the same photo; every category resolves", () => {
    for (const c of reviewCategories) expect(getCategoryImage(c).url).toBe(getCategoryImage(c).url);
    expect(getCategoryImage("Accessories").url).toContain("images.unsplash.com");
    expect(getCategoryImage("Serum").url).not.toBe(getCategoryImage("Cleanser").url);
  });
});

describe("homepage comparison card thumbnails", () => {
  // These Unsplash photos were removed upstream (HTTP 404 on 2026-10-08) and left blank cards on the homepage.
  const DEAD = ["1570194065650-d99fb4b38b17", "1596755094514-f87e34085b85", "1596755389378-c31d21fd2863", "1620916297397-a8b05e6567d4", "1620916569875-d4fa85f58255", "1631730486572-226b1e126018"];
  test("no featured editorial points at a known-dead photo and every card has a thumbnail with alt text", async () => {
    const { featuredEditorials } = await import("../../data/editorials");
    for (const e of featuredEditorials) {
      expect(e.thumbnailUrl.startsWith("https://")).toBe(true);
      expect(e.thumbnailAlt.length).toBeGreaterThan(10);
      for (const id of DEAD) expect(e.thumbnailUrl).not.toContain(id);
    }
  });
});
