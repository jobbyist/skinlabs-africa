import { describe, expect, test } from "bun:test";
import {
  brandMatches,
  buildDiscoveredCandidates,
  candidatePromptText,
  countReviewsByBrand,
  detectPrices,
  groundedPrice,
  IMPORT_BRANDS,
  LOCAL_BRANDS,
  nextOrigin,
  pickBrands,
  planOrigins,
  priceMatchesPage,
  resolveDailyCap,
  seedFromString,
} from "../../../supabase/functions/_shared/pipelines/reviewDiscovery";

describe("daily cap", () => {
  test("defaults to 8 and stays inside the 5-10 band", () => {
    expect(resolveDailyCap(undefined)).toBe(8);
    expect(resolveDailyCap("")).toBe(8);
    expect(resolveDailyCap("2")).toBe(5);
    expect(resolveDailyCap("7")).toBe(7);
    expect(resolveDailyCap("40")).toBe(10);
  });
});

describe("60/40 local/import plan", () => {
  const share = (plan: string[]) => plan.filter((o) => o === "global_available_in_sa").length / plan.length;

  test("a full day of 8 lands on 5 local + 3 import", () => {
    const plan = planOrigins({ local: 0, imports: 0 }, 8);
    expect(plan.filter((o) => o === "south_africa").length).toBe(5);
    expect(plan.filter((o) => o === "global_available_in_sa").length).toBe(3);
  });

  test("every daily cap 5-10 stays within one review of 40% imports", () => {
    for (let n = 5; n <= 10; n++) {
      const imports = planOrigins({ local: 0, imports: 0 }, n).filter((o) => o === "global_available_in_sa").length;
      expect(Math.abs(imports - n * 0.4)).toBeLessThanOrEqual(0.6);
    }
  });

  test("a later run in the day continues the same mix", () => {
    const first = planOrigins({ local: 0, imports: 0 }, 3);
    const counts = {
      local: first.filter((o) => o === "south_africa").length,
      imports: first.filter((o) => o === "global_available_in_sa").length,
    };
    const rest = planOrigins(counts, 5);
    expect(share([...first, ...rest])).toBeCloseTo(0.375, 3);
  });

  test("catches up when imports are behind", () => {
    expect(nextOrigin({ local: 4, imports: 0 })).toBe("global_available_in_sa");
    expect(nextOrigin({ local: 0, imports: 3 })).toBe("south_africa");
  });
});

describe("brand pools", () => {
  test("cover the brands the editorial brief names", () => {
    const local = LOCAL_BRANDS.map((b) => b.name);
    for (const name of ["Sundae Skin", "Zero BS", "Silki", "Faithful to Nature", "SkinBliss", "SOiL", "Simply Bee", "Essentially Natural", "Sorbet Skin", "SKOON"]) {
      expect(local).toContain(name);
    }
    const imports = IMPORT_BRANDS.map((b) => b.name);
    expect(imports).toContain("Timeless Skin Care");
    expect(imports).toContain("Moroccanoil");
    expect(IMPORT_BRANDS.some((b) => /cosrx|joseon|anua/i.test(b.name))).toBe(true);
    expect(LOCAL_BRANDS.every((b) => b.origin === "south_africa")).toBe(true);
    expect(IMPORT_BRANDS.every((b) => b.origin === "global_available_in_sa")).toBe(true);
  });

  test("least-reviewed brands are searched first and the choice is reproducible", () => {
    const reviewed = countReviewsByBrand(["SKOON.", "Skoon", "Zero BS", "Silki"]);
    const picks = pickBrands("south_africa", reviewed, 5, seedFromString("run-1"));
    expect(picks).toHaveLength(5);
    expect(picks.map((b) => b.name)).not.toContain("SKOON");
    expect(pickBrands("south_africa", reviewed, 5, seedFromString("run-1"))).toEqual(picks);
  });

  test("spelling variants are the same brand", () => {
    expect(brandMatches("SKOON", "SKOON.")).toBe(true);
    expect(brandMatches("Geve Skincare", "Gève")).toBe(true);
    expect(brandMatches("Timeless Skin Care", "Timeless")).toBe(true);
    expect(brandMatches("Silki", "CeraVe")).toBe(false);
  });
});

describe("price reading", () => {
  test("reads Rand prices from the buy box first", () => {
    expect(detectPrices("Vitamin C Serum R 399.00 Special Price R 359.10 You may also like R 1 299")).toEqual([399, 359.1, 1299]);
    expect(detectPrices("no price here")).toEqual([]);
  });

  test("the page's price wins when the model's disagrees", () => {
    expect(priceMatchesPage(205, [199])).toBe(true);
    expect(groundedPrice(205, [199])).toBe(205);
    expect(groundedPrice(450, [199, 259])).toBe(199);
    expect(groundedPrice(450, [])).toBe(450);
  });
});

describe("candidate filtering", () => {
  const brand = LOCAL_BRANDS.find((b) => b.name === "SKOON")!;
  const priced = "SKOON. Clean Slate Cleanser 100ml R 189.00 Add to cart. A gentle gel cleanser for everyday use, made in South Africa.";

  test("keeps single product pages that name the brand and carry a price", () => {
    const out = buildDiscoveredCandidates(
      brand,
      [
        { url: "https://www.clicks.co.za/skoon-clean-slate-cleanser-100ml/p/123456?srsltid=abc", title: "SKOON Clean Slate Cleanser", text: priced },
        { url: "https://www.takealot.com/skoon-clean-slate-cleanser/PLID90000001", title: "SKOON cleanser", text: priced },
      ],
      new Set(),
    );
    expect(out.map((c) => c.retailerName)).toEqual(["Clicks", "Takealot"]);
    expect(out[0].url).toBe("https://www.clicks.co.za/skoon-clean-slate-cleanser-100ml/p/123456");
    expect(out[0].prices[0]).toBe(189);
  });

  test("drops category pages, other brands, unpriced pages, unknown hosts and pages already reviewed", () => {
    const seen = new Set(["https://www.clicks.co.za/skoon-seen/p/111"]);
    const out = buildDiscoveredCandidates(
      brand,
      [
        { url: "https://www.clicks.co.za/skin-care/c/OH1", title: "SKOON", text: priced },
        { url: "https://www.clicks.co.za/other-serum/p/222", title: "CeraVe Serum", text: "CeraVe Serum R 250" },
        { url: "https://www.clicks.co.za/skoon-no-price/p/333", title: "SKOON", text: "SKOON gentle cleanser, no price shown" },
        { url: "https://random-blog.example/skoon-review", title: "SKOON", text: priced },
        { url: "https://www.clicks.co.za/skoon-seen/p/111", title: "SKOON", text: priced },
      ],
      seen,
    );
    expect(out).toEqual([]);
  });

  test("recognises the brand's own shop from the hits and the prompt text states the origin", () => {
    const sundae = LOCAL_BRANDS.find((b) => b.name === "Sundae Skin")!;
    const out = buildDiscoveredCandidates(
      sundae,
      [{ url: "https://sundaeskin.co.za/products/glow-serum", title: "Sundae Skin Glow Serum", text: "Sundae Skin Glow Serum R 320 Add to cart" }],
      new Set(),
    );
    expect(out).toHaveLength(1);
    expect(out[0].retailer).toBe("brand-direct");
    expect(candidatePromptText(out[0])).toContain("local South African brand");

    const moroccanoil = IMPORT_BRANDS.find((b) => b.name === "Moroccanoil")!;
    const imp = buildDiscoveredCandidates(
      moroccanoil,
      [{ url: "https://www.dischem.co.za/moroccanoil-treatment-100ml-12345", title: "Moroccanoil Treatment", text: "Moroccanoil Treatment 100ml R 899.00" }],
      new Set(),
    );
    expect(candidatePromptText(imp[0])).toContain("Import (an international brand sold in South Africa)");
  });
});
