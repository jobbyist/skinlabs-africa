import { describe, expect, test } from "bun:test";
import { buildReviewPriceCandidates, canAutoRefresh, canonicalReviewListingUrl, nextCheckAt, readPriceFromExcerpt, REVIEW_RETAILER_SLUGS } from "../reviewPrices.ts";

const target = { brand: "CeraVe", name: "Moisturising Cream", sizeMl: 454 };

// Real excerpts returned by Parallel Search on 2026-10-08.
const dischem = "Skip to the end of the images gallery\nMain Image\nCERAVE\nCerave Moisturising Cream 454g\nR 399.00 Special Price R 359.10\nBenefit Points: 36000\nQty\nAdd to Cart\nAvailable for Click & Collect";
const dermastore = "Skip to content\nBody / CeraVe\nCeraVe Moisturising Cream 454g\n★ ★ ★ ★ ★ Rated 0 out of 5\nR 400.00\nA barrier-restoring cream\nIn stock\nAdd to cart\nCeraVe Hydrating Cleanser 236ml\nR 255.00";

describe("readPriceFromExcerpt", () => {
  test("list price + special price", () => {
    const p = readPriceFromExcerpt(dischem)!;
    expect(p.priceZar).toBe(399);
    expect(p.specialPriceZar).toBe(359.1);
    expect(p.ambiguous).toBe(false);
    expect(p.inStock).toBe(true);
  });
  test("ignores related products further down", () => {
    const p = readPriceFromExcerpt(dermastore)!;
    expect(p.priceZar).toBe(400);
    expect(p.inStock).toBe(true);
  });
  test("thousands separators and out of stock", () => {
    const p = readPriceFromExcerpt("Serum R 1 299.00 Out of stock")!;
    expect(p.priceZar).toBe(1299);
    expect(p.inStock).toBe(false);
  });
  test("two different prices are flagged ambiguous", () => {
    expect(readPriceFromExcerpt("Cream R 399.00 and R 450.00")!.ambiguous).toBe(true);
  });
  test("no price, absurd price", () => {
    expect(readPriceFromExcerpt("no money here")).toBeNull();
    expect(readPriceFromExcerpt("R 999999")).toBeNull();
  });
});

describe("canonicalReviewListingUrl", () => {
  test("accepts product pages and strips tracking", () => {
    expect(canonicalReviewListingUrl("https://www.dischem.co.za/cerave-moisturising-cream-454g-365?srsltid=x")?.url).toBe("https://www.dischem.co.za/cerave-moisturising-cream-454g-365");
    expect(canonicalReviewListingUrl("https://dermastore.co.za/cerave-moisturising-cream-454g")?.retailer).toBe("dermastore");
    expect(canonicalReviewListingUrl("https://www.clicks.co.za/cerave_moisturising-cream-454g/p/360501")?.retailer).toBe("clicks");
  });
  test("rejects category, brand, other hosts, http", () => {
    expect(canonicalReviewListingUrl("https://clicks.co.za/cerave/c/00029H99")).toBeNull();
    expect(canonicalReviewListingUrl("https://www.dischem.co.za/featured-brands/beauty/cerave")).toBeNull();
    expect(canonicalReviewListingUrl("https://www.faithful-to-nature.co.za/brands")).toBeNull();
    expect(canonicalReviewListingUrl("https://example.com/cerave-1")).toBeNull();
    expect(canonicalReviewListingUrl("http://dermastore.co.za/cerave-moisturising-cream-454g")).toBeNull();
  });
});

describe("buildReviewPriceCandidates", () => {
  const results = [
    { url: "https://www.dischem.co.za/cerave-moisturising-cream-454g-365", title: "Cerave Moisturising Cream 454Ml | Dis-Chem", text: dischem },
    { url: "https://dermastore.co.za/cerave-moisturising-cream-454g", title: "CeraVe Moisturising Cream 454g | Buy Online in South Africa", text: dermastore },
    { url: "https://www.dischem.co.za/featured-brands/beauty/cerave", title: "CeraVe - Beauty | Dis-Chem", text: "R 399.00" },
    { url: "https://dermastore.co.za/cerave-moisturising-cream-340g", title: "CeraVe Moisturising Cream 340g", text: "CeraVe Moisturising Cream 340g R 300.00 In stock" },
    { url: "https://www.pricecheck.co.za/search?search=cerave", title: "cerave", text: "R 359.00" },
  ];
  test("matches the right size, drops the wrong size, categories and aggregators", () => {
    const c = buildReviewPriceCandidates(target, results);
    expect(c.map((x) => `${x.retailer}:${x.priceZar}`).sort()).toEqual(["dermastore:400", "dis-chem:399"]);
    expect(c.find((x) => x.retailer === "dis-chem")!.specialPriceZar).toBe(359.1);
  });
  test("a different brand never matches", () => {
    expect(buildReviewPriceCandidates({ brand: "Skin Republic", name: "Moisturising Cream" }, results)).toEqual([]);
  });
});

describe("schedule rules", () => {
  test("six retailers", () => expect(REVIEW_RETAILER_SLUGS).toHaveLength(6));
  test("re-check before the 30 day display limit; empties retry sooner", () => {
    const now = new Date("2026-10-08T00:00:00Z");
    expect(nextCheckAt(now, true).toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(nextCheckAt(now, false).toISOString()).toBe("2026-10-15T00:00:00.000Z");
  });
  test("auto refresh only for modest moves", () => {
    expect(canAutoRefresh(100, 120)).toBe(true);
    expect(canAutoRefresh(100, 200)).toBe(false);
  });
});
