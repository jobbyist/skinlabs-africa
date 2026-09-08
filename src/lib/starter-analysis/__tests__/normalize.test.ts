import { describe, expect, test } from "bun:test";
import { buildNormalisedProfile, deriveBudgetConscious, deriveRoutineComplexityFromQuiz, deriveSkinType } from "../normalize";
import type { ChangeContext } from "../types";

const NO_CONTEXT: ChangeContext = { status: null, detail: null };

const baseAnswers = (): Record<string, number> => ({
  q1: 2, q2: 3, q3: 3, q4: 3, q5: 1, q6: 3, q7: 3, q8: 3, q9: 3, q10: 1,
  q11: 2, q12: 1, q13: 1, q14: 1, q15: 2, q16: 3, q17: 3, q18: 3, q19: 3, q20: 3,
});

describe("deriveSkinType", () => {
  test.each([
    [0, "oily"], [1, "combination"], [2, "normal"], [3, "dry"],
  ] as const)("q1=%p -> %p", (q1, expected) => {
    expect(deriveSkinType({ q1 } as Record<string, number>)).toBe(expected);
  });
  test("defaults to normal when unanswered", () => {
    expect(deriveSkinType({})).toBe("normal");
  });
});

describe("deriveBudgetConscious / deriveRoutineComplexityFromQuiz", () => {
  test("q20=0 (budget) is budget conscious", () => {
    expect(deriveBudgetConscious({ q20: 0 })).toBe(true);
    expect(deriveBudgetConscious({ q20: 1 })).toBe(false);
  });
  test("q13 maps to routine complexity preference", () => {
    expect(deriveRoutineComplexityFromQuiz({ q13: 0 })).toBe("minimal");
    expect(deriveRoutineComplexityFromQuiz({ q13: 1 })).toBe("moderate");
    expect(deriveRoutineComplexityFromQuiz({ q13: 2 })).toBe("moderate");
    expect(deriveRoutineComplexityFromQuiz({ q13: 3 })).toBe("flexible");
  });
});

describe("buildNormalisedProfile", () => {
  test("all four skin types resolve correctly", () => {
    for (const [q1, expected] of [[0, "oily"], [1, "combination"], [2, "normal"], [3, "dry"]] as const) {
      const profile = buildNormalisedProfile({ answers: { ...baseAnswers(), q1 }, mstTone: null, context: NO_CONTEXT });
      expect(profile.skinType).toBe(expected);
    }
  });

  test("all four primary concerns resolve from q9", () => {
    for (const [q9, expected] of [[0, "acne"], [1, "brightening"], [2, "aging"], [3, "sensitivity"]] as const) {
      const profile = buildNormalisedProfile({ answers: { ...baseAnswers(), q9 }, mstTone: null, context: NO_CONTEXT });
      expect(profile.primaryConcern).toBe(expected);
    }
  });

  test("high reactivity + low barrier => high sensitivity, needs_support barrier", () => {
    const profile = buildNormalisedProfile({
      answers: { ...baseAnswers(), q6: 0, q7: 0, q19: 0 },
      mstTone: null,
      context: NO_CONTEXT,
    });
    expect(profile.sensitivityTendency).toBe("high");
    expect(profile.barrierTendency).toBe("needs_support");
  });

  test("resilient, non-reactive answers => low sensitivity, supported barrier", () => {
    const profile = buildNormalisedProfile({ answers: baseAnswers(), mstTone: null, context: NO_CONTEXT });
    expect(profile.sensitivityTendency).toBe("low");
    expect(profile.barrierTendency).toBe("supported");
  });

  test("barrier tendency is uncertain when q19 unanswered", () => {
    const answers = { ...baseAnswers() };
    delete answers.q19;
    const profile = buildNormalisedProfile({ answers, mstTone: null, context: NO_CONTEXT });
    expect(profile.barrierTendency).toBe("uncertain");
  });

  test("multiple secondary concerns surface, capped at 2, never duplicating the primary", () => {
    const profile = buildNormalisedProfile({
      answers: { ...baseAnswers(), q9: 0, q2: 0, q3: 0, q4: 0, q7: 0, q8: 0 },
      mstTone: null,
      context: NO_CONTEXT,
    });
    expect(profile.primaryConcern).toBe("acne");
    expect(profile.secondaryConcerns.length).toBeLessThanOrEqual(2);
    expect(profile.secondaryConcerns).not.toContain("breakouts"); // breakouts == acne's key, must not duplicate
  });

  test("an entirely uncertain/minimal-answer profile still resolves without throwing", () => {
    expect(() => buildNormalisedProfile({ answers: {}, mstTone: null, context: NO_CONTEXT })).not.toThrow();
    const profile = buildNormalisedProfile({ answers: {}, mstTone: null, context: NO_CONTEXT });
    expect(profile.skinType).toBe("normal");
    expect(profile.barrierTendency).toBe("uncertain");
  });

  test("routine maturity reflects consistency + product count", () => {
    const beginner = buildNormalisedProfile({ answers: { ...baseAnswers(), q13: 0, q14: 0 }, mstTone: null, context: NO_CONTEXT });
    const experienced = buildNormalisedProfile({ answers: { ...baseAnswers(), q13: 3, q14: 3 }, mstTone: null, context: NO_CONTEXT });
    expect(beginner.routineMaturity).toBe("beginner");
    expect(experienced.routineMaturity).toBe("experienced");
  });

  test("is deterministic — same input produces the same output", () => {
    const answers = baseAnswers();
    const a = buildNormalisedProfile({ answers, mstTone: 5, context: NO_CONTEXT });
    const b = buildNormalisedProfile({ answers, mstTone: 5, context: NO_CONTEXT });
    expect(a).toEqual(b);
  });
});
