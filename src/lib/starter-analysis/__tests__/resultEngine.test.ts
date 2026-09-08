import { describe, expect, test } from "bun:test";
import { assembleStarterAnalysisResult } from "../resultEngine";
import { validateScenario } from "../scenarioValidation";
import type { ChangeContext, PriorityPreference, SkinChangeStatus } from "../types";

const NO_CONTEXT: ChangeContext = { status: null, detail: null };

const fullAnswers = (overrides: Record<string, number> = {}): Record<string, number> => ({
  q1: 1, q2: 2, q3: 2, q4: 2, q5: 1, q6: 2, q7: 2, q8: 2, q9: 0, q10: 1,
  q11: 2, q12: 1, q13: 2, q14: 1, q15: 0, q16: 1, q17: 3, q18: 3, q19: 2, q20: 3,
  ...overrides,
});

const assemble = (overrides: Partial<Parameters<typeof assembleStarterAnalysisResult>[0]> = {}) =>
  assembleStarterAnalysisResult({
    analysisId: "test-id",
    answers: fullAnswers(),
    mstTone: null,
    hasPhoto: false,
    context: NO_CONTEXT,
    priorityPreference: null,
    revealProducts: true,
    ...overrides,
  });

describe("assembleStarterAnalysisResult — Section 30: no AI requirement", () => {
  test("produces a complete result synchronously, with no network/AI call involved", () => {
    // If this function ever awaited a fetch/AI call it would need to be async — it
    // isn't, which is itself evidence the Starter path has no external dependency.
    const result = assemble();
    expect(result.recommendationText.length).toBeGreaterThan(0);
    expect(result.skinStory.narrative.length).toBeGreaterThan(0);
    expect(result.priorities.items.length).toBeGreaterThan(0);
  });
});

describe("assembleStarterAnalysisResult — determinism", () => {
  test("identical input produces an identical result (excluding the generatedAt timestamp)", () => {
    const a = assemble();
    const b = assemble();
    const { generatedAt: _a, ...restA } = a;
    const { generatedAt: _b, ...restB } = b;
    expect(restA).toEqual(restB);
  });
});

describe("assembleStarterAnalysisResult — result versioning", () => {
  test("every result carries all four version stamps", () => {
    const result = assemble();
    expect(result.versions.resultVersion).toBeTruthy();
    expect(result.versions.scoringVersion).toBeTruthy();
    expect(result.versions.contentVersion).toBeTruthy();
    expect(result.versions.productMatchingVersion).toBeTruthy();
  });
});

describe("assembleStarterAnalysisResult — product grounding gate", () => {
  test("revealProducts=false withholds named products even when matches exist", () => {
    const locked = assemble({ revealProducts: false, answers: fullAnswers({ q1: 0, q9: 0 }) });
    const unlocked = assemble({ revealProducts: true, answers: fullAnswers({ q1: 0, q9: 0 }) });
    // matching still runs (fairness telemetry must stay accurate either way)
    expect(locked.groundedRoutine.matchStats.attempted).toBe(unlocked.groundedRoutine.matchStats.attempted);
    // but the rendered text never names a product when locked
    if (unlocked.groundedRoutine.matchStats.matched > 0) {
      expect(locked.recommendationText).not.toContain(unlocked.groundedRoutine.am[0]?.product.product_name ?? "___never___");
    }
  });
});

describe("assembleStarterAnalysisResult — scenario matrix (Section 27/33)", () => {
  const skinTypes = [0, 1, 2, 3];
  const concerns = [0, 1, 2, 3];
  const sensitivities = [0, 3]; // very reactive vs. resilient
  const changeStatuses: Array<SkinChangeStatus | null> = [
    null, "always_like_this", "started_recently", "worse_recently", "improved_recently",
    "comes_and_goes", "after_new_product", "after_stopping_product", "weather_seasonal", "unsure",
  ];
  const priorityPrefs: Array<PriorityPreference | null> = [null, "simplest", "best_value", "fastest", "gentlest", "comprehensive"];

  test("every skin type x concern x sensitivity x context x preference combination passes scenario validation", () => {
    let combinations = 0;
    for (const q1 of skinTypes) {
      for (const q9 of concerns) {
        for (const q6 of sensitivities) {
          for (const status of changeStatuses) {
            for (const priorityPreference of priorityPrefs) {
              combinations += 1;
              const result = assemble({
                answers: fullAnswers({ q1, q9, q6, q19: q6 }),
                context: { status, detail: null },
                priorityPreference,
              });
              const issues = validateScenario(result);
              expect(issues).toEqual([]);
            }
          }
        }
      }
    }
    // 4 skin types x 4 concerns x 2 sensitivities x 10 contexts x 6 preferences.
    expect(combinations).toBeGreaterThanOrEqual(80);
  });

  test("high sensitivity + compromised barrier never produces an assertive active schedule, across every concern", () => {
    for (const q9 of concerns) {
      const result = assemble({ answers: fullAnswers({ q9, q6: 0, q19: 0 }) });
      expect(result.routineStrategy.activeIntensity).not.toBe("assertive");
    }
  });

  test("an uncertain/mostly-unanswered profile still assembles a valid result", () => {
    const result = assemble({ answers: {} });
    expect(validateScenario(result)).toEqual([]);
    expect(result.completeness.overall).toBeLessThan(100);
  });
});

describe("assembleStarterAnalysisResult — refinement re-run (profileOverride/preferencesOverride)", () => {
  test("a profile/preferences override changes the result deterministically without needing new answers", () => {
    const original = assemble({ answers: fullAnswers({ q13: 3 }) }); // flexible complexity
    const refined = assemble({
      answers: fullAnswers({ q13: 3 }),
      profileOverride: original.profile,
      preferencesOverride: { ...original.preferences, complexity: "minimal" },
    });
    expect(original.routineStrategy.targetStepCount).toBeGreaterThan(refined.routineStrategy.targetStepCount);
  });
});
