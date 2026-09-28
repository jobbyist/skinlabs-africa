import { describe, expect, test } from "bun:test";
import { purchasableCapabilities } from "../entitlements";


describe("purchasableCapabilities", () => {
  test("VIP-only perks are never offered while VIP isn't purchasable", () => {
    const features = purchasableCapabilities(["glow_lite", "insider"]).map((c) => c.feature);
    expect(features).not.toContain("ai_analysis.routine_builder");
    expect(features).not.toContain("consult.priority_booking");
    expect(features).toContain("reviews.full_body");
    expect(features).not.toContain("ai_analysis.starter");
  });
  test("cheapest purchasable tier wins", () => {
    const byFeature = Object.fromEntries(purchasableCapabilities(["glow_lite", "insider"]).map((c) => [c.feature, c.cheapestTier]));
    expect(byFeature["practitioner_directory"]).toBe("glow_lite");
    expect(byFeature["routine.conflict_matcher"]).toBe("insider");
  });
  test("once VIP is purchasable its perks appear", () => {
    expect(purchasableCapabilities(["insider", "vip"]).map((c) => c.feature)).toContain("ai_analysis.routine_builder");
  });
  test("nothing purchasable → nothing offered", () => {
    expect(purchasableCapabilities([])).toEqual([]);
  });
});
