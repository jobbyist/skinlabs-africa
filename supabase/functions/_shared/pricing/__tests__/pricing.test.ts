import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  canonicalListingUrl,
  checkedLabel,
  evaluateObservation,
  isWithinVisitWindow,
  parseListing,
  parseRand,
  parseSizeMl,
  priceFreshness,
  RETAILER_POLICIES,
  rankSearchResults,
  confirmWithPage,
  scoreMatch,
} from "../index.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

describe("canonicalListingUrl", () => {
  test("strips tracking parameters and fragments, keeps only product pages", () => {
    expect(canonicalListingUrl("https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-30ml/p/401071?srsltid=AU7gw4Vi3tiI#x")).toEqual({
      retailer: "clicks",
      url: "https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-30ml/p/401071",
    });
    expect(canonicalListingUrl("https://www.dischem.co.za/niacinamide-10-zinc-1-the-ordinary-765?srsltid=abc")).toEqual({
      retailer: "dis-chem",
      url: "https://www.dischem.co.za/niacinamide-10-zinc-1-the-ordinary-765",
    });
    expect(canonicalListingUrl("https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID93202017/?x=1")).toEqual({
      retailer: "takealot",
      url: "https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID93202017",
    });
  });

  test("refuses category, brand, search and non-retailer pages", () => {
    for (const bad of [
      "https://clicks.co.za/the-ordinary/c/00044EAL",
      "https://www.dischem.co.za/featured-brands/beauty/the-ordinary",
      "https://www.dischem.co.za/group/the-ordinary-skin-care",
      "https://www.dischem.co.za/catalogsearch/result/?q=niacinamide",
      "https://www.takealot.com/all?qsearch=niacinamide",
      "http://clicks.co.za/x/p/1",
      "https://evil.example.com/x/p/401071",
      "https://clicks.co.za.evil.example.com/x/p/401071",
      "https://user:pw@clicks.co.za/x/p/1",
      "not a url",
    ]) {
      expect(canonicalListingUrl(bad), bad).toBeNull();
    }
  });
});

describe("visit windows", () => {
  test("Clicks may only be fetched 04:00-08:45 UTC; others any time", () => {
    const clicks = RETAILER_POLICIES.clicks;
    expect(isWithinVisitWindow(clicks, new Date("2026-10-03T03:59:00Z"))).toBe(false);
    expect(isWithinVisitWindow(clicks, new Date("2026-10-03T04:00:00Z"))).toBe(true);
    expect(isWithinVisitWindow(clicks, new Date("2026-10-03T08:45:00Z"))).toBe(true);
    expect(isWithinVisitWindow(clicks, new Date("2026-10-03T08:46:00Z"))).toBe(false);
    expect(clicks.minIntervalMs).toBeGreaterThanOrEqual(10_000);
    expect(isWithinVisitWindow(RETAILER_POLICIES.takealot, new Date("2026-10-03T23:00:00Z"))).toBe(true);
  });
});

describe("parseRand", () => {
  test("handles SA formats", () => {
    expect(parseRand("R 1 299.00")).toBe(1299);
    expect(parseRand("R130")).toBe(130);
    expect(parseRand("130.00")).toBe(130);
    expect(parseRand("1,299.50")).toBe(1299.5);
    expect(parseRand("1 299,00")).toBe(1299);
    expect(parseRand("1.299")).toBe(1299);
    expect(parseRand(120)).toBe(120);
  });
  test("rejects junk", () => {
    for (const bad of ["", "free", "R", "-5", "12abc", null, undefined, Number.NaN]) {
      expect(parseRand(bad as never), String(bad)).toBeNull();
    }
  });
});

describe("parseListing on real retailer markup", () => {
  test("Clicks: JSON-LD offer", () => {
    const r = parseListing("clicks", fixture("clicks-the-ordinary-niacinamide-30ml.html"))!;
    expect(r.priceZar).toBe(130);
    expect(r.inStock).toBe(true);
    expect(r.method).toBe("jsonld");
    expect(r.titles[0]).toBe("The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml");
  });

  test("Dis-Chem: itemprop meta tags", () => {
    const r = parseListing("dis-chem", fixture("dischem-the-ordinary-niacinamide-30ml.html"))!;
    expect(r.priceZar).toBe(120);
    expect(r.inStock).toBe(true);
    expect(r.method).toBe("meta");
    expect(r.titles).toContain("Niacinamide 10% + Zinc 1% | The Ordinary");
  });

  test("Takealot: reads the buy-box price, never a recommended-product price", () => {
    const html = fixture("takealot-the-ordinary-niacinamide-30ml.html");
    expect(html).toContain("R 179"); // the decoy is really on the page
    const r = parseListing("takealot", html)!;
    expect(r.priceZar).toBe(130);
    expect(r.method).toBe("buybox");
    expect(r.titles[0]).toBe("The Ordinary Niacinamide 10% + Zinc 1% 30ml");
  });

  test("returns null rather than guessing", () => {
    const pad = " ".repeat(300);
    expect(parseListing("takealot", `<html>${pad}<span class="currency">R 179</span></html>`)).toBeNull(); // no buy-box
    expect(parseListing("clicks", `<html>${pad}<script type="application/ld+json">{"@type":"Product","offers":{"priceCurrency":"USD","price":"9"}}</script></html>`)).toBeNull();
    expect(parseListing("clicks", `<html>${pad}<script type="application/ld+json">{not json</script></html>`)).toBeNull();
    expect(parseListing("dis-chem", `<html>${pad}<meta itemprop="price" content="0"><meta itemprop="priceCurrency" content="ZAR"></html>`)).toBeNull();
    expect(parseListing("dis-chem", `<html>${pad}<meta itemprop="price" content="9999999"><meta itemprop="priceCurrency" content="ZAR"></html>`)).toBeNull();
    expect(parseListing("clicks", "")).toBeNull();
    expect(parseListing("clicks", "<html>Just a moment...</html>")).toBeNull();
  });

  test("an out-of-stock offer is reported as such", () => {
    const html = fixture("clicks-the-ordinary-niacinamide-30ml.html").replace("InStock", "OutOfStock");
    expect(parseListing("clicks", html)!.inStock).toBe(false);
  });
});

describe("parseSizeMl", () => {
  test("normalises units", () => {
    expect(parseSizeMl("Serum 30ml")).toBe(30);
    expect(parseSizeMl("Serum 30 ML")).toBe(30);
    expect(parseSizeMl("Cream 1.5 L")).toBe(1500);
    expect(parseSizeMl("Balm 50g")).toBe(50);
    expect(parseSizeMl("Cleanser 0,5 litre")).toBe(500);
    expect(parseSizeMl("Niacinamide 10% + Zinc 1%")).toBeNull();
  });
});

describe("scoreMatch with real search-result titles", () => {
  const ordinary = { brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1%" };

  test("the right product at each retailer matches when only one size is seen", () => {
    for (const title of [
      "Niacinamide 10% + Zinc 1% Serum 30ml - The Ordinary - Clicks",
      "The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml",
      "The Ordinary Niacinamide 10 Percent Plus Zinc 1 Percent 30ml",
      "The Ordinary Niacinamide 10% + Zinc 1% 30ml",
      "Niacinamide 10% + Zinc 1% | The Ordinary",
    ]) {
      const r = scoreMatch(ordinary, [title], []);
      // "| The Ordinary" has no size at all -> a person must confirm; the others match.
      expect(r.decision, title).toBe(title.includes("|") && !/\d+ ?ml/i.test(title) ? "needs_review" : "matched");
      expect(r.confidence, title).toBeGreaterThanOrEqual(0.8);
    }
  });

  test("look-alike products from other brands are rejected", () => {
    for (const title of [
      "Niacinamide 10% + Zinc 1% Serum 30ml - Skin Republic - Clicks",
      "Standard Beauty 1% Zinc & 10% Niacinamide Serum 30ml - Clicks",
      "10% Niacinamide & 1% Zinc Serum with Hyaluronic Acid | Standard Beauty",
      "Skin Functional 10 Niacinamide 2 Nag 1 Succinic Acid 1 Zinc Blemish Corrector 30ml",
    ]) {
      expect(scoreMatch(ordinary, [title]).decision, title).toBe("rejected");
    }
  });

  test("a known size must match", () => {
    const withSize = { ...ordinary, sizeMl: 30 };
    expect(scoreMatch(withSize, ["The Ordinary Niacinamide 10% + Zinc 1% Serum 60ml - Clicks"]).decision).toBe("rejected");
    expect(scoreMatch(withSize, ["The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml - Clicks"]).decision).toBe("matched");
  });

  test("an unknown size with several sizes on offer goes to a person, never auto-matched", () => {
    const r = scoreMatch(ordinary, ["The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml - Clicks"], [30, 60]);
    expect(r.decision).toBe("needs_review");
    expect(r.listingSizeMl).toBe(30);
    expect(r.reasons.join(" ")).toContain("several sizes");
  });

  test("strengths are part of the name: 5% is not 10%", () => {
    const r = scoreMatch(ordinary, ["The Ordinary Niacinamide 5% + Zinc 1% 30ml"]);
    expect(r.decision).not.toBe("matched");
  });

  test("a brand-only or unrelated listing is rejected", () => {
    expect(scoreMatch(ordinary, ["The Ordinary - Beauty - Brands A-Z | Dis-Chem"]).decision).toBe("rejected");
    expect(scoreMatch(ordinary, []).decision).toBe("rejected");
  });
});

describe("evaluateObservation", () => {
  const now = new Date("2026-10-03T06:00:00Z");
  const day = (n: number) => new Date(now.getTime() - n * 86_400_000);

  test("first, changed, unchanged, heartbeat", () => {
    expect(evaluateObservation(130, null, now)).toEqual({ action: "record", reason: "first" });
    expect(evaluateObservation(120, { priceZar: 130, recordedAt: day(1) }, now)).toEqual({ action: "record", reason: "changed" });
    expect(evaluateObservation(130, { priceZar: 130, recordedAt: day(2) }, now)).toEqual({ action: "skip", reason: "unchanged" });
    expect(evaluateObservation(130, { priceZar: 130, recordedAt: day(31) }, now)).toEqual({ action: "record", reason: "heartbeat" });
  });

  test("a huge swing needs the same reading twice", () => {
    const prior = { priceZar: 130, recordedAt: day(1) };
    expect(evaluateObservation(40, prior, now)).toEqual({ action: "hold", reason: "unconfirmed_swing" });
    expect(evaluateObservation(40, prior, now, 90)).toEqual({ action: "hold", reason: "unconfirmed_swing" });
    expect(evaluateObservation(40, prior, now, 40)).toEqual({ action: "record", reason: "confirmed_swing" });
  });

  test("absurd values are rejected", () => {
    for (const bad of [0, -3, 50_001, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(evaluateObservation(bad, null, now).action, String(bad)).toBe("reject");
    }
  });
});

describe("freshness", () => {
  const now = new Date("2026-10-03T10:00:00Z");
  test("buckets", () => {
    expect(priceFreshness(new Date("2026-10-02T10:00:00Z"), now)).toBe("fresh");
    expect(priceFreshness(new Date("2026-09-30T09:00:00Z"), now)).toBe("recent");
    expect(priceFreshness(new Date("2026-09-18T10:00:00Z"), now)).toBe("stale");
  });
  test("labels use South African calendar days", () => {
    expect(checkedLabel(new Date("2026-10-03T05:00:00Z"), now)).toBe("checked today");
    expect(checkedLabel(new Date("2026-10-02T22:30:00Z"), now)).toBe("checked today"); // 00:30 SAST on 3 Oct
    expect(checkedLabel(new Date("2026-10-02T20:00:00Z"), now)).toBe("checked yesterday"); // 22:00 SAST on 2 Oct
    expect(checkedLabel(new Date("2026-10-02T09:00:00Z"), now)).toBe("checked yesterday");
    expect(checkedLabel(new Date("2026-09-28T09:00:00Z"), now)).toBe("checked 5 days ago");
  });
});

describe("rankSearchResults (real Firecrawl search results)", () => {
  const target = { brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1%" };

  test("Clicks: keeps only the right brand's product pages, strips tracking, hands multi-size to a person", () => {
    const ranked = rankSearchResults(
      target,
      "clicks",
      [
        { url: "https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-30ml/p/401071?srsltid=AU7gw4Vi3tiIw", title: "Niacinamide 10% + Zinc 1% Serum 30ml - The Ordinary - Clicks" },
        { url: "https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-60ml/p/401073?srsltid=AU7gw4UF", title: "The Ordinary Niacinamide 10% + Zinc 1% Serum 60ml - Clicks" },
        { url: "https://clicks.co.za/skin-republic_niacinamide-10-+-zinc-1-serum-30ml/p/352340", title: "Niacinamide 10% + Zinc 1% Serum 30ml - Skin Republic - Clicks" },
        { url: "https://clicks.co.za/standard-beauty_1-zinc-and-10-niacinamide-serum-30ml/p/384523", title: "Standard Beauty 1% Zinc & 10% Niacinamide Serum 30ml - Clicks" },
        { url: "https://clicks.co.za/the-ordinary/c/00044EAL", title: "The Ordinary products online at Clicks" },
      ],
    );
    expect(ranked.map((c) => c.url)).toEqual([
      "https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-30ml/p/401071",
      "https://clicks.co.za/the-ordinary_niacinamide-10-+-zinc-1-serum-60ml/p/401073",
    ]);
    // Both sizes exist and we don't know which one we mean: neither is auto-matched.
    expect(ranked.every((c) => c.match.decision === "needs_review")).toBe(true);
  });

  test("Dis-Chem: category and brand pages are ignored; the single-size product matches", () => {
    const ranked = rankSearchResults(
      target,
      "dis-chem",
      [
        { url: "https://www.dischem.co.za/niacinamide-10-zinc-1-the-ordinary-765?srsltid=x", title: "The Ordinary Niacinamide 10 Percent Plus Zinc 1 Percent 30ml | Dis-Chem" },
        { url: "https://www.dischem.co.za/featured-brands/beauty/the-ordinary?srsltid=y", title: "The Ordinary - Beauty - Brands A-Z | Dis-Chem" },
        { url: "https://www.dischem.co.za/group/the-ordinary-skin-care", title: "The Ordinary Skin Care | Dis-Chem" },
        { url: "https://www.dischem.co.za/skin-functional-10-niacinamide-2-nag-1-succinic-acid-1-zinc-blemish-corrector-30ml-516", title: "Skin Functional 10 Niacinamide 2 Nag 1 Succinic Acid 1 Zinc Blemish Corrector 30ml" },
      ],
    );
    expect(ranked).toHaveLength(1);
    expect(ranked[0].url).toBe("https://www.dischem.co.za/niacinamide-10-zinc-1-the-ordinary-765");
    expect(ranked[0].match.decision).toBe("matched");
  });

  test("Takealot: other brands and off-topic products are dropped; two sellers of the same size both qualify", () => {
    const ranked = rankSearchResults(
      target,
      "takealot",
      [
        { url: "https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID93202017?srsltid=a", title: "The Ordinary Niacinamide 10% + Zinc 1% 30ml - Takealot.com" },
        { url: "https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID71169378?srsltid=b", title: "THE ORDINARY Niacinamide 10% + Zinc 1% - 30ml - Takealot.com" },
        { url: "https://www.takealot.com/10-niacinamide-1-zinc-serum-with-hyaluronic-acid-standard-beauty/PLID70902905", title: "10% Niacinamide & 1% Zinc Serum with Hyaluronic Acid - Takealot.com" },
        { url: "https://www.takealot.com/5-in-1-multipurpose-type-c-to-usb-hub-silver/PLID91575576", title: "5 in 1 Multipurpose Type-C To USB Hub-Silver - Takealot.com" },
      ],
    );
    expect(ranked.map((c) => c.url)).toEqual([
      "https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID93202017",
      "https://www.takealot.com/the-ordinary-niacinamide-10-zinc-1-30ml/PLID71169378",
    ]);
    expect(ranked.every((c) => c.match.decision === "matched")).toBe(true);
  });

  test("results from another retailer's host, duplicates and empty input yield nothing", () => {
    expect(rankSearchResults(target, "clicks", [{ url: "https://www.takealot.com/x/PLID1", title: "The Ordinary Niacinamide 10% + Zinc 1% 30ml" }])).toEqual([]);
    expect(rankSearchResults(target, "clicks", [])).toEqual([]);
    const dup = { url: "https://clicks.co.za/a/p/1?x=1", title: "The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml" };
    expect(rankSearchResults(target, "clicks", [dup, { ...dup, url: "https://clicks.co.za/a/p/1?x=2" }])).toHaveLength(1);
  });

  test("the page can only make a match stricter, never looser", () => {
    const search = { decision: "needs_review" as const, confidence: 0.8, listingSizeMl: 30, reasons: ["s"] };
    const pageOk = { decision: "matched" as const, confidence: 0.9, listingSizeMl: 30, reasons: ["p"] };
    const pageBad = { decision: "rejected" as const, confidence: 0, listingSizeMl: null, reasons: ["p"] };
    expect(confirmWithPage(search, pageOk).decision).toBe("needs_review");
    expect(confirmWithPage({ ...search, decision: "matched" }, pageBad).decision).toBe("rejected");
    expect(confirmWithPage({ ...search, decision: "matched" }, pageOk).decision).toBe("matched");
  });
});
