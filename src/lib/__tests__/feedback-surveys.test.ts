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
    expect(getFeedbackSurvey("/ingredients")?.surface).toBeUndefined();
  });

  test("uses the 1 January 2027 South Africa cutoff", () => {
    expect(FEEDBACK_SURVEY_CUTOFF_ISO).toBe("2027-01-01T00:00:00+02:00");
    expect(new Date(FEEDBACK_SURVEY_CUTOFF_MS).toISOString()).toBe("2026-12-31T22:00:00.000Z");
  });
});
