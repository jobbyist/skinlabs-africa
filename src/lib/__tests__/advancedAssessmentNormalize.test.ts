import { describe, expect, test } from "bun:test";
import { normalizeAssessment, extractRoutineContext, deriveEvidenceTopics } from "../../../supabase/functions/_shared/assessment/normalize";

const sections = [
  { id: "skin_basics", questions: [{ id: "skin_type" }, { id: "sensitivity_level" }] },
  { id: "current_routine", questions: [{ id: "am_steps" }, { id: "pm_steps" }, { id: "actives_in_use" }] },
];

describe("normalizeAssessment", () => {
  test("groups flat responses by their owning section", () => {
    const responses = { skin_type: "oily", am_steps: ["cleanser"] };
    const result = normalizeAssessment(sections, responses, "2026.1");
    expect(result.assessmentVersion).toBe("2026.1");
    expect(result.sections.skin_basics).toEqual({ skin_type: "oily" });
    expect(result.sections.current_routine).toEqual({ am_steps: ["cleanser"] });
  });

  test("omits a section entirely when none of its questions were answered", () => {
    const result = normalizeAssessment(sections, { skin_type: "oily" }, "2026.1");
    expect(result.sections.current_routine).toBeUndefined();
  });

  test("a question id not present in any section is silently dropped, never fabricated into a section", () => {
    const result = normalizeAssessment(sections, { unknown_question: "x" }, "2026.1");
    expect(Object.keys(result.sections)).toEqual([]);
  });
});

describe("extractRoutineContext", () => {
  test("extracts only string-array routine fields, ignoring malformed input", () => {
    const context = extractRoutineContext({ am_steps: ["cleanser", "spf"], pm_steps: "not-an-array", actives_in_use: ["retinoid"] });
    expect(context.amSteps).toEqual(["cleanser", "spf"]);
    expect(context.pmSteps).toEqual([]);
    expect(context.activesInUse).toEqual(["retinoid"]);
  });
});

describe("deriveEvidenceTopics", () => {
  test("combines concern/active/characteristic answers into one topic list", () => {
    const topics = deriveEvidenceTopics({
      primary_concerns: ["breakouts_acne"],
      actives_in_use: ["retinoid"],
      skin_characteristics: ["redness"],
    });
    expect(topics).toEqual(["breakouts_acne", "retinoid", "redness"]);
  });

  test("never invents a topic beyond what the respondent actually selected", () => {
    expect(deriveEvidenceTopics({})).toEqual([]);
  });
});
