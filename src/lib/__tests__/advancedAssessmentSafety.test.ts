import { describe, expect, test } from "bun:test";
import { computeSafetyScreen } from "../../../supabase/functions/_shared/assessment/safety";

describe("computeSafetyScreen", () => {
  test("no red flags -> routine, no professional review required", () => {
    const result = computeSafetyScreen(["none_of_the_above"]);
    expect(result.requiresProfessionalReview).toBe(false);
    expect(result.urgency).toBe("routine");
    expect(result.reasons).toEqual([]);
  });

  test("empty/undefined input -> routine", () => {
    expect(computeSafetyScreen(undefined).urgency).toBe("routine");
    expect(computeSafetyScreen([]).requiresProfessionalReview).toBe(false);
  });

  test("a single prompt-level flag escalates to prompt urgency", () => {
    const result = computeSafetyScreen(["non_healing_sore_or_wound"]);
    expect(result.requiresProfessionalReview).toBe(true);
    expect(result.urgency).toBe("prompt");
    expect(result.reasons).toHaveLength(1);
  });

  test("a single urgent flag escalates to urgent urgency", () => {
    const result = computeSafetyScreen(["rapidly_changing_mole"]);
    expect(result.urgency).toBe("urgent");
    expect(result.requiresProfessionalReview).toBe(true);
  });

  test("mixed flags take the WORST urgency, never averaged or the first match", () => {
    const result = computeSafetyScreen(["non_healing_sore_or_wound", "rapidly_changing_mole", "sudden_severe_hair_loss"]);
    expect(result.urgency).toBe("urgent");
    expect(result.reasons).toHaveLength(3);
  });

  test("unrecognised flag values are ignored rather than escalated", () => {
    const result = computeSafetyScreen(["some_future_question_value_not_in_the_table"]);
    expect(result.requiresProfessionalReview).toBe(false);
    expect(result.urgency).toBe("routine");
  });

  test("never fabricates a diagnosis in the user-facing message", () => {
    const result = computeSafetyScreen(["rapidly_changing_mole"]);
    const forbidden = ["eczema", "rosacea", "psoriasis", "cancer", "melanoma"];
    for (const term of forbidden) {
      expect(result.userMessage.toLowerCase()).not.toContain(term);
      result.reasons.forEach((r) => expect(r.toLowerCase()).not.toContain(term));
    }
  });
});
