import { describe, expect, test } from "bun:test";
import {
  FEEDBACK_SURVEY_CUTOFF_ISO,
  FEEDBACK_SURVEY_CUTOFF_MS,
  FEEDBACK_SURVEYS,
  getFeedbackSurvey,
} from "../feedback-surveys";

describe("mobile feedback surveys", () => {
  test("defines one contextual survey for each target surface", () => {
    expect(FEEDBACK_SURVEYS.map((survey) => survey.surface)).toEqual([
      "dashboard",
      "briefings",
      "reviews",
      "compare",
      "podcast",
      "spotlight",
    ]);
  });

  test("matches top-level surfaces and their content routes", () => {
    expect(getFeedbackSurvey("/briefings")?.id).toBe("briefings-mobile-v1");
    expect(getFeedbackSurvey("/briefings/example-story")?.surface).toBe("briefings");
    expect(getFeedbackSurvey("/reviews/product-name")?.surface).toBe("reviews");
    expect(getFeedbackSurvey("/compare")?.surface).toBe("compare");
    expect(getFeedbackSurvey("/podcast/episode-name")?.surface).toBe("podcast");
    expect(getFeedbackSurvey("/spotlight/brand-name")?.surface).toBe("spotlight");
    expect(getFeedbackSurvey("/dashboard")?.surface).toBe("dashboard");
    expect(getFeedbackSurvey("/ingredients")?.surface).toBeUndefined();
  });

  test("a hub page never asks about 'this briefing/episode/comparison'; an article page does", () => {
    for (const hub of ["/briefings", "/briefings/", "/compare", "/podcast"]) {
      expect(getFeedbackSurvey(hub)?.question).not.toMatch(/\bthis (briefing|comparison|episode)\b/i);
    }
    expect(getFeedbackSurvey("/briefings/a-story")?.question).toBe("How useful was this briefing?");
    expect(getFeedbackSurvey("/podcast/episode-1")?.question).toBe("How did this episode land for you?");
    // Same id either way, so "never the same survey twice" holds across hub and detail.
    expect(getFeedbackSurvey("/briefings")?.id).toBe(getFeedbackSurvey("/briefings/a-story")?.id);
  });

  test("every survey (and hub variant) is well formed", () => {
    for (const survey of FEEDBACK_SURVEYS) {
      for (const copy of [survey, survey.hub].filter(Boolean)) {
        expect(copy!.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(copy!.options.map((o) => o.value)).size).toBe(copy!.options.length);
        for (const o of copy!.options) {
          expect(o.value.length).toBeLessThanOrEqual(80); // table CHECK
          expect(o.label.length).toBeLessThanOrEqual(200);
        }
        expect(copy!.question.length).toBeLessThanOrEqual(300);
      }
    }
  });

  test("uses the 1 January 2027 South Africa cutoff", () => {
    expect(FEEDBACK_SURVEY_CUTOFF_ISO).toBe("2027-01-01T00:00:00+02:00");
    expect(new Date(FEEDBACK_SURVEY_CUTOFF_MS).toISOString()).toBe("2026-12-31T22:00:00.000Z");
  });
});
