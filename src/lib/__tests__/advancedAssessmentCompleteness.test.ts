import { describe, expect, test } from "bun:test";
import { computeAssessmentCompleteness } from "../assessment/completeness";
import type { AssessmentSection } from "../assessment/types";

const sections: AssessmentSection[] = [
  {
    id: "s1",
    title: "Section 1",
    questions: [
      { id: "q1", type: "single_select", required: true, prompt: "Q1", options: [{ value: "a", label: "A" }] },
      { id: "q2", type: "multi_select", required: true, prompt: "Q2", options: [{ value: "a", label: "A" }] },
      { id: "q3", type: "text", required: false, prompt: "Q3 (optional)" },
    ],
  },
  {
    id: "s2",
    title: "Section 2",
    questions: [
      { id: "q4", type: "text", required: true, prompt: "Q4" },
      {
        id: "q5",
        type: "text",
        required: true,
        prompt: "Follow-up, only if q1 = a",
        showIf: { questionId: "q1", oneOf: ["a"] },
      },
    ],
  },
];

describe("computeAssessmentCompleteness", () => {
  test("no responses -> 0%", () => {
    expect(computeAssessmentCompleteness(sections, {})).toBe(0);
  });

  test("optional questions never count toward the total", () => {
    // q1, q2, q4 required and answered; q5 not applicable (q1 !== a); q3 optional/unanswered.
    const responses = { q1: "b", q2: ["a"], q4: "answer" };
    expect(computeAssessmentCompleteness(sections, responses)).toBe(100);
  });

  test("a conditionally-required question only counts once its condition is met", () => {
    const withoutTrigger = { q1: "b", q2: ["a"], q4: "answer" };
    const withTrigger = { q1: "a", q2: ["a"], q4: "answer" };
    expect(computeAssessmentCompleteness(sections, withoutTrigger)).toBe(100);
    // q5 now applies and is unanswered -> 4 required of which 3 answered.
    expect(computeAssessmentCompleteness(sections, withTrigger)).toBe(75);
  });

  test("an empty array answer does not count as answered", () => {
    const responses = { q1: "b", q2: [], q4: "answer" };
    expect(computeAssessmentCompleteness(sections, responses)).toBeLessThan(100);
  });

  test("an empty/whitespace string answer does not count as answered", () => {
    const responses = { q1: "b", q2: ["a"], q4: "   " };
    expect(computeAssessmentCompleteness(sections, responses)).toBeLessThan(100);
  });

  test("a definition with no required questions is always 100%", () => {
    const allOptional: AssessmentSection[] = [{ id: "s", title: "S", questions: [{ id: "q", type: "text", required: false, prompt: "P" }] }];
    expect(computeAssessmentCompleteness(allOptional, {})).toBe(100);
  });
});
