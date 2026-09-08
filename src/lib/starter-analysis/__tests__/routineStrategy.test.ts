import { describe, expect, test } from "bun:test";
import { buildRoutineStrategy } from "../routineStrategy";
import type { NormalisedProfile, RoutinePreferences } from "../types";

const profile = (overrides: Partial<NormalisedProfile> = {}): NormalisedProfile => ({
  skinType: "combination",
  primaryConcern: "acne",
  secondaryConcerns: [],
  sensitivityTendency: "low",
  barrierTendency: "supported",
  activeTolerance: "tolerant",
  routineMaturity: "experienced",
  skinBehaviour: "stable",
  maintenanceOrientation: "corrective",
  primaryGoal: "improve_appearance",
  secondaryGoal: null,
  mstTone: null,
  ...overrides,
});

const prefs = (overrides: Partial<RoutinePreferences> = {}): RoutinePreferences => ({
  complexity: "moderate",
  priority: null,
  budgetConscious: false,
  ...overrides,
});

describe("buildRoutineStrategy — complexity", () => {
  test("minimalist preference yields ~3 steps", () => {
    expect(buildRoutineStrategy(profile(), prefs({ complexity: "minimal" })).targetStepCount).toBe(3);
  });
  test("comprehensive/flexible preference yields ~7 steps", () => {
    expect(buildRoutineStrategy(profile(), prefs({ complexity: "flexible" })).targetStepCount).toBe(7);
  });
  test("'simplest' priority preference caps steps at 3 even with a flexible complexity", () => {
    const strategy = buildRoutineStrategy(profile(), prefs({ complexity: "flexible", priority: "simplest" }));
    expect(strategy.targetStepCount).toBeLessThanOrEqual(3);
  });
  test("'comprehensive' priority preference raises steps to at least 7 even with minimal complexity", () => {
    const strategy = buildRoutineStrategy(profile(), prefs({ complexity: "minimal", priority: "comprehensive" }));
    expect(strategy.targetStepCount).toBeGreaterThanOrEqual(7);
  });
});

describe("buildRoutineStrategy — safety ceiling", () => {
  test("high sensitivity clamps active intensity to gentle regardless of preference", () => {
    const strategy = buildRoutineStrategy(profile({ sensitivityTendency: "high", activeTolerance: "tolerant" }), prefs({ priority: "fastest" }));
    expect(strategy.activeIntensity).toBe("gentle");
  });
  test("barrier needing support clamps active intensity to gentle regardless of preference", () => {
    const strategy = buildRoutineStrategy(profile({ barrierTendency: "needs_support", activeTolerance: "tolerant" }), prefs({ priority: "fastest" }));
    expect(strategy.activeIntensity).toBe("gentle");
  });
  test("tolerant, experienced, low-sensitivity + 'fastest' can reach assertive", () => {
    const strategy = buildRoutineStrategy(profile({ activeTolerance: "tolerant", routineMaturity: "experienced" }), prefs({ priority: "fastest" }));
    expect(strategy.activeIntensity).toBe("assertive");
  });
  test("new-to-actives visitors never exceed gentle even with no other risk factors", () => {
    const strategy = buildRoutineStrategy(profile({ activeTolerance: "new" }), prefs({ priority: "fastest" }));
    expect(strategy.activeIntensity).toBe("gentle");
  });
  test("'gentlest' priority preference forces gentle intensity", () => {
    const strategy = buildRoutineStrategy(profile({ activeTolerance: "tolerant" }), prefs({ priority: "gentlest" }));
    expect(strategy.activeIntensity).toBe("gentle");
  });
});

describe("buildRoutineStrategy — budget", () => {
  test("budget-conscious preference yields a constrained stance", () => {
    expect(buildRoutineStrategy(profile(), prefs({ budgetConscious: true })).budgetStance).toBe("constrained");
  });
  test("'best_value' priority preference also yields a constrained stance", () => {
    expect(buildRoutineStrategy(profile(), prefs({ priority: "best_value" })).budgetStance).toBe("constrained");
  });
  test("no budget signal yields a flexible stance", () => {
    expect(buildRoutineStrategy(profile(), prefs()).budgetStance).toBe("flexible");
  });
});

test("versioned and deterministic", () => {
  const p = profile();
  const pr = prefs();
  const a = buildRoutineStrategy(p, pr);
  const b = buildRoutineStrategy(p, pr);
  expect(a).toEqual(b);
  expect(a.version).toBeTruthy();
});
