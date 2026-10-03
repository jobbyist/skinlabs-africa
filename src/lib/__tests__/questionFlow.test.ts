import { describe, expect, it } from "bun:test";
import { flattenApplicableQuestions, initialQuestionIndex, isAnswerValid } from "@/lib/assessment/questionFlow";
import type { AssessmentQuestion, AssessmentSection } from "@/lib/assessment/types";

const single = (id: string, extra: Partial<AssessmentQuestion> = {}): AssessmentQuestion => ({
  id,
  type: "single_select",
  required: true,
  prompt: id,
  options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "decline", label: "Decline" }],
  ...extra,
});

const sections: AssessmentSection[] = [
  { id: "consent", title: "Consent", questions: [single("popia_special"), single("popia_cross")] },
  {
    id: "breakouts",
    title: "Breakouts",
    questions: [single("has_breakouts"), single("breakout_severity", { showIf: { questionId: "has_breakouts", oneOf: ["yes"] } })],
  },
  { id: "goals", title: "Goals", questions: [{ id: "goals", type: "multi_select", required: true, prompt: "Goals", minSelections: 1, maxSelections: 2, options: [] }] },
];

describe("flattenApplicableQuestions", () => {
  it("orders questions across sections and hides showIf questions until they apply", () => {
    expect(flattenApplicableQuestions(sections, {}).map((s) => s.question.id)).toEqual(["popia_special", "popia_cross", "has_breakouts", "goals"]);
    expect(flattenApplicableQuestions(sections, { has_breakouts: "yes" }).map((s) => s.question.id)).toEqual([
      "popia_special",
      "popia_cross",
      "has_breakouts",
      "breakout_severity",
      "goals",
    ]);
  });

  it("carries the section for each step", () => {
    const steps = flattenApplicableQuestions(sections, {});
    expect(steps[2]).toMatchObject({ sectionId: "breakouts", sectionTitle: "Breakouts" });
  });
});

describe("isAnswerValid", () => {
  it("refuses a consent decline", () => {
    expect(isAnswerValid(single("popia_special"), "decline")).toBe(false);
    expect(isAnswerValid(single("popia_special"), "yes")).toBe(true);
  });

  it("requires an answer only for required questions", () => {
    expect(isAnswerValid(single("q"), undefined)).toBe(false);
    expect(isAnswerValid(single("q", { required: false }), undefined)).toBe(true);
  });

  it("enforces min and max selections", () => {
    const goals = sections[2].questions[0];
    expect(isAnswerValid(goals, [])).toBe(false);
    expect(isAnswerValid(goals, ["a"])).toBe(true);
    expect(isAnswerValid(goals, ["a", "b", "c"])).toBe(false);
  });
});

describe("initialQuestionIndex", () => {
  it("starts at the first question of a new session", () => {
    const steps = flattenApplicableQuestions(sections, {});
    expect(initialQuestionIndex(steps, null, {})).toBe(0);
    expect(initialQuestionIndex(steps, "consent", {})).toBe(0);
  });

  it("resumes at the first unanswered question of the saved section", () => {
    const responses = { popia_special: "yes", popia_cross: "yes", has_breakouts: "yes" };
    const steps = flattenApplicableQuestions(sections, responses);
    expect(steps[initialQuestionIndex(steps, "breakouts", responses)].question.id).toBe("breakout_severity");
  });

  it("falls back to the section's first question when it is complete", () => {
    const responses = { popia_special: "yes", popia_cross: "yes" };
    const steps = flattenApplicableQuestions(sections, responses);
    expect(initialQuestionIndex(steps, "consent", responses)).toBe(0);
    expect(initialQuestionIndex(steps, "unknown", responses)).toBe(0);
  });
});
