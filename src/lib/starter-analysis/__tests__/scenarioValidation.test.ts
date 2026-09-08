import { describe, expect, test } from "bun:test";
import { validateScenario } from "../scenarioValidation";
import { assembleStarterAnalysisResult } from "../resultEngine";
import type { StarterAnalysisResult } from "../types";

const validResult = (): StarterAnalysisResult =>
  assembleStarterAnalysisResult({
    analysisId: "x",
    answers: { q1: 1, q9: 0, q6: 2, q19: 2 },
    mstTone: null,
    hasPhoto: false,
    context: { status: null, detail: null },
    priorityPreference: null,
    revealProducts: true,
  });

describe("validateScenario", () => {
  test("a normally-assembled result has no issues", () => {
    expect(validateScenario(validResult())).toEqual([]);
  });

  test("flags a missing required section", () => {
    const result = validResult();
    result.recommendationText = result.recommendationText.replace("## PM Routine", "## Deleted Section");
    expect(validateScenario(result)).toContain("missing_section:## PM Routine");
  });

  test("flags a named medical diagnosis leaking into the text", () => {
    const result = validResult();
    result.recommendationText += "\nThis looks like eczema.";
    expect(validateScenario(result).some((i) => i.startsWith("named_diagnosis:eczema"))).toBe(true);
  });

  test("flags duplicate priority keys", () => {
    const result = validResult();
    result.priorities.items = [...result.priorities.items, { ...result.priorities.items[0] }];
    expect(validateScenario(result)).toContain("duplicate_priority");
  });

  test("flags out-of-order ranks", () => {
    const result = validResult();
    if (result.priorities.items.length >= 2) {
      const [first, second, ...rest] = result.priorities.items;
      // Swap array positions while keeping each item's own rank number — the
      // rank sequence [second.rank, first.rank, ...] is no longer ascending.
      result.priorities.items = [second, first, ...rest];
      expect(validateScenario(result)).toContain("priority_rank_out_of_order");
    }
  });

  test("flags impossible match stats", () => {
    const result = validResult();
    result.groundedRoutine.matchStats = { matched: 5, attempted: 4 };
    expect(validateScenario(result)).toContain("match_stats_invalid");
  });

  test("flags an unsafe active intensity for a sensitive/compromised-barrier profile", () => {
    const result = validResult();
    result.profile.sensitivityTendency = "high";
    result.routineStrategy.activeIntensity = "assertive";
    expect(validateScenario(result)).toContain("unsafe_active_intensity");
  });

  test("flags a routine complexity outside the sane 2-10 step range", () => {
    const result = validResult();
    result.routineStrategy.targetStepCount = 25;
    expect(validateScenario(result)).toContain("routine_complexity_out_of_range");
  });
});
