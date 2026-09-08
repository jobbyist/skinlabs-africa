/**
 * Scenario Consistency Engine (Section 28). Every generated result is checked
 * against a small set of invariants before it reaches the visitor. This never
 * blocks the free path — a failed check is logged (dev only) and reported back
 * on the result for the test suite to assert against, since a broken Starter
 * Analysis should fail loudly in CI, not silently in production.
 */

import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";

/** Mirrors supabase/functions/skincare-ai/index.ts's scanComplianceFlags — the one rule that's checkable without fabricated ground truth. */
const FORBIDDEN_DIAGNOSIS_TERMS = ["eczema", "rosacea", "psoriasis", "fungal acne", "pcos"];

const REQUIRED_SECTIONS = ["## AM Routine", "## PM Routine", "## Weekly Actives Schedule", "## Ingredient Strategy"];

export const validateScenario = (result: StarterAnalysisResult): string[] => {
  const issues: string[] = [];
  const text = result.recommendationText;
  const lowerText = text.toLowerCase();

  for (const section of REQUIRED_SECTIONS) {
    if (!text.includes(section)) issues.push(`missing_section:${section}`);
  }

  for (const term of FORBIDDEN_DIAGNOSIS_TERMS) {
    if (lowerText.includes(term)) issues.push(`named_diagnosis:${term}`);
  }

  const priorityKeys = result.priorities.items.map((p) => p.key);
  if (new Set(priorityKeys).size !== priorityKeys.length) issues.push("duplicate_priority");

  const ranks = result.priorities.items.map((p) => p.rank);
  if (JSON.stringify(ranks) !== JSON.stringify([...ranks].sort((a, b) => a - b))) issues.push("priority_rank_out_of_order");

  const { matched, attempted } = result.groundedRoutine.matchStats;
  if (matched > attempted || matched < 0 || attempted < 0) issues.push("match_stats_invalid");

  if ((result.profile.sensitivityTendency === "high" || result.profile.barrierTendency === "needs_support") && result.routineStrategy.activeIntensity === "assertive") {
    issues.push("unsafe_active_intensity");
  }

  if (result.routineStrategy.targetStepCount < 2 || result.routineStrategy.targetStepCount > 10) {
    issues.push("routine_complexity_out_of_range");
  }

  return issues;
};

export const warnOnValidationIssues = (result: StarterAnalysisResult): void => {
  const issues = validateScenario(result);
  if (issues.length > 0 && typeof console !== "undefined") {
    console.warn("[starter-analysis] scenario validation issues:", issues);
  }
};
