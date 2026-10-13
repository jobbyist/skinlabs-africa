import { describe, expect, test } from "bun:test";
import { isLowestIn30Days, parseTargetPrice, priceAlertErrorMessage, suggestTarget, type PriceStat } from "@/lib/pricing/priceTracking";

const NOW = new Date("2026-10-08T10:00:00Z");
const stat = (over: Partial<PriceStat> = {}): PriceStat => ({
  retailer_slug: "clicks", listing_url: "https://x", low_30d: 150, high_30d: 199, observations: 4,
  history_since: "2026-09-01T00:00:00Z", ...over,
});

describe("isLowestIn30Days", () => {
  test("badges a price at its 30-day low that was higher before", () => expect(isLowestIn30Days(stat(), 150, NOW)).toBe(true));
  test("no badge when the current price is above the low", () => expect(isLowestIn30Days(stat(), 170, NOW)).toBe(false));
  test("no badge when the price never moved", () => expect(isLowestIn30Days(stat({ low_30d: 150, high_30d: 150 }), 150, NOW)).toBe(false));
  test("no badge with a single observation or under a week of history", () => {
    expect(isLowestIn30Days(stat({ observations: 1 }), 150, NOW)).toBe(false);
    expect(isLowestIn30Days(stat({ history_since: "2026-10-05T00:00:00Z" }), 150, NOW)).toBe(false);
  });
  test("no stats, no badge", () => expect(isLowestIn30Days(undefined, 150, NOW)).toBe(false));
});

describe("parseTargetPrice", () => {
  test("accepts rand formats", () => {
    expect(parseTargetPrice("R 199")).toBe(199);
    expect(parseTargetPrice("199,50")).toBe(199.5);
    expect(parseTargetPrice("1 299")).toBe(1299);
  });
  test("rejects junk and out-of-range values", () => {
    for (const v of ["", "abc", "0", "-5", "50001", "12.345", "1e3"]) expect(parseTargetPrice(v)).toBeNull();
  });
});

describe("helpers", () => {
  test("suggestTarget is ~10% under the lowest, never for tiny or missing prices", () => {
    expect(suggestTarget(200)).toBe(180);
    expect(suggestTarget(null)).toBeNull();
    expect(suggestTarget(10)).toBeNull();
  });
  test("error messages", () => {
    expect(priceAlertErrorMessage("too_many_alerts")).toContain("25");
    expect(priceAlertErrorMessage(undefined)).toContain("try again");
  });
});
