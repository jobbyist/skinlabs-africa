import { describe, expect, test } from "bun:test";
import { applyAdjustmentsToPreferences, applyAdjustmentsToProfile, computeRefinementAdjustments } from "../refinement";
import type { NormalisedProfile, RoutinePreferences } from "../types";

const profile: NormalisedProfile = {
  skinType: "combination",
  primaryConcern: "acne",
  secondaryConcerns: ["dryness", "uneven_tone"],
  sensitivityTendency: "low",
  barrierTendency: "supported",
  activeTolerance: "tolerant",
  routineMaturity: "intermediate",
  skinBehaviour: "stable",
  maintenanceOrientation: "corrective",
  primaryGoal: "improve_appearance",
  secondaryGoal: null,
  mstTone: null,
};

const preferences: RoutinePreferences = { complexity: "moderate", priority: null, budgetConscious: false };

describe("computeRefinementAdjustments", () => {
  test("too_many_products -> minimal complexity + simplest priority", () => {
    const adj = computeRefinementAdjustments("too_many_products");
    expect(adj.complexityOverride).toBe("minimal");
    expect(adj.priorityOverride).toBe("simplest");
  });
  test("too_few_products -> flexible complexity + comprehensive priority", () => {
    const adj = computeRefinementAdjustments("too_few_products");
    expect(adj.complexityOverride).toBe("flexible");
    expect(adj.priorityOverride).toBe("comprehensive");
  });
  test("too_focused_acne -> deprioritises breakouts", () => {
    expect(computeRefinementAdjustments("too_focused_acne").deprioritizeConcern).toBe("breakouts");
  });
  test("too_focused_pigmentation -> deprioritises uneven_tone", () => {
    expect(computeRefinementAdjustments("too_focused_pigmentation").deprioritizeConcern).toBe("uneven_tone");
  });
  test("too_gentle -> fastest priority", () => {
    expect(computeRefinementAdjustments("too_gentle").priorityOverride).toBe("fastest");
  });
  test("too_aggressive -> gentlest priority (safety ceiling handles the rest)", () => {
    expect(computeRefinementAdjustments("too_aggressive").priorityOverride).toBe("gentlest");
  });
  test("too_expensive -> budget override + best_value priority", () => {
    const adj = computeRefinementAdjustments("too_expensive");
    expect(adj.budgetOverride).toBe(true);
    expect(adj.priorityOverride).toBe("best_value");
  });
  test("too_complicated -> minimal complexity", () => {
    expect(computeRefinementAdjustments("too_complicated").complexityOverride).toBe("minimal");
  });
  test("doesnt_match_skin -> no deterministic override, only a guidance note", () => {
    const adj = computeRefinementAdjustments("doesnt_match_skin");
    expect(adj.complexityOverride).toBeUndefined();
    expect(adj.priorityOverride).toBeUndefined();
    expect(adj.note).toBeTruthy();
  });
  test("another_concern -> adds the selected concern, no-op without one", () => {
    expect(computeRefinementAdjustments("another_concern", "texture").addConcern).toBe("texture");
    expect(computeRefinementAdjustments("another_concern", null)).toEqual({});
  });
});

describe("applyAdjustmentsToPreferences / applyAdjustmentsToProfile", () => {
  test("overrides apply on top of existing preferences without mutating the original", () => {
    const next = applyAdjustmentsToPreferences(preferences, { complexityOverride: "minimal" });
    expect(next.complexity).toBe("minimal");
    expect(preferences.complexity).toBe("moderate"); // original untouched
  });

  test("deprioritizeConcern removes it from secondaryConcerns", () => {
    const next = applyAdjustmentsToProfile(profile, { deprioritizeConcern: "dryness" });
    expect(next.secondaryConcerns).not.toContain("dryness");
    expect(next.secondaryConcerns).toContain("uneven_tone");
  });

  test("addConcern prepends a new concern, capped at 2, never adding the primary", () => {
    const next = applyAdjustmentsToProfile(profile, { addConcern: "texture" });
    expect(next.secondaryConcerns[0]).toBe("texture");
    expect(next.secondaryConcerns.length).toBeLessThanOrEqual(2);

    const noOp = applyAdjustmentsToProfile(profile, { addConcern: "breakouts" }); // == primary concern's key
    expect(noOp.secondaryConcerns).toEqual(profile.secondaryConcerns);
  });

  test("no adjustments is a true no-op", () => {
    expect(applyAdjustmentsToProfile(profile, {})).toEqual(profile);
    expect(applyAdjustmentsToPreferences(preferences, {})).toEqual(preferences);
  });
});
