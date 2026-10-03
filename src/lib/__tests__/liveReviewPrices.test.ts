import { describe, expect, test } from "bun:test";
import { compareByLivePrice, indexLivePrices, inPriceBand } from "../pricing/liveReviewPrices";

describe("live review prices", () => {
  test("keeps the cheapest live price per id and ignores junk", () => {
    const m = indexLivePrices([
      { id: "a", price_zar: "203.99", source: "OpenHaus", checked_at: "2026-10-03T04:00:00Z" },
      { id: "a", price_zar: 180, source: "Clicks", checked_at: "2026-10-03T05:00:00Z" },
      { id: "b", price_zar: 0, source: "x", checked_at: "2026-10-03T05:00:00Z" },
      { id: "", price_zar: 10, source: "x", checked_at: "2026-10-03T05:00:00Z" },
    ]);
    expect(m.get("a")).toEqual({ priceZar: 180, source: "Clicks", checkedAt: "2026-10-03T05:00:00Z" });
    expect(m.has("b")).toBe(false);
    expect(m.size).toBe(1);
  });
  test("price bands never include a product with no live price", () => {
    expect(inPriceBand(null, "all")).toBe(true);
    expect(inPriceBand(null, "under-200")).toBe(false);
    expect(inPriceBand(199.99, "under-200")).toBe(true);
    expect(inPriceBand(200, "200-500")).toBe(true);
    expect(inPriceBand(501, "over-500")).toBe(true);
  });
  test("sorting puts unknown prices last in both directions", () => {
    const items = [null, 300, 100, null, 200];
    expect([...items].sort((a, b) => compareByLivePrice(a, b, "asc"))).toEqual([100, 200, 300, null, null]);
    expect([...items].sort((a, b) => compareByLivePrice(a, b, "desc"))).toEqual([300, 200, 100, null, null]);
  });
});
