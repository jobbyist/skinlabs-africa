/**
 * Interactive Result Refinement (Section 8). A visitor's feedback is a closed
 * chip selection, never free text — this maps each reason to a concrete,
 * deterministic adjustment that `resultEngine.ts` re-runs the pipeline with.
 * Nothing here can bypass the safety ceiling enforced in routineStrategy.ts
 * (e.g. "too gentle" cannot push a sensitive profile past "gentle" intensity).
 */

import { formulaConcernToKey } from "@/lib/starter-analysis/normalize";
import type {
  ConcernKey,
  NormalisedProfile,
  PriorityPreference,
  RefinementReason,
  RoutineComplexityPreference,
  RoutinePreferences,
} from "@/lib/starter-analysis/types";

export interface RefinementAdjustments {
  complexityOverride?: RoutineComplexityPreference;
  priorityOverride?: PriorityPreference;
  budgetOverride?: boolean;
  deprioritizeConcern?: ConcernKey;
  addConcern?: ConcernKey;
  note?: string;
}

export const computeRefinementAdjustments = (
  reason: RefinementReason,
  otherConcern?: ConcernKey | null,
): RefinementAdjustments => {
  switch (reason) {
    case "too_many_products":
      return { complexityOverride: "minimal", priorityOverride: "simplest" };
    case "too_few_products":
      return { complexityOverride: "flexible", priorityOverride: "comprehensive" };
    case "too_focused_acne":
      return { deprioritizeConcern: "breakouts" };
    case "too_focused_pigmentation":
      return { deprioritizeConcern: "uneven_tone" };
    case "too_gentle":
      return { priorityOverride: "fastest" };
    case "too_aggressive":
      return { priorityOverride: "gentlest" };
    case "too_expensive":
      return { budgetOverride: true, priorityOverride: "best_value" };
    case "too_complicated":
      return { complexityOverride: "minimal" };
    case "doesnt_match_skin":
      return { note: "This can happen if the photo/MST step was skipped or a couple of answers didn't quite fit — you can always retake the assessment, or try the Advanced SKYNN AI analysis for a result built from your exact photo." };
    case "another_concern":
      return otherConcern ? { addConcern: otherConcern } : {};
    default:
      return {};
  }
};

export const applyAdjustmentsToPreferences = (
  preferences: RoutinePreferences,
  adjustments: RefinementAdjustments,
): RoutinePreferences => ({
  complexity: adjustments.complexityOverride ?? preferences.complexity,
  priority: adjustments.priorityOverride ?? preferences.priority,
  budgetConscious: adjustments.budgetOverride ?? preferences.budgetConscious,
});

export const applyAdjustmentsToProfile = (
  profile: NormalisedProfile,
  adjustments: RefinementAdjustments,
): NormalisedProfile => {
  let secondaryConcerns = profile.secondaryConcerns;
  if (adjustments.deprioritizeConcern) {
    secondaryConcerns = secondaryConcerns.filter((c) => c !== adjustments.deprioritizeConcern);
  }
  if (adjustments.addConcern && !secondaryConcerns.includes(adjustments.addConcern) && adjustments.addConcern !== formulaConcernToKey(profile.primaryConcern)) {
    secondaryConcerns = [adjustments.addConcern, ...secondaryConcerns].slice(0, 2);
  }
  return { ...profile, secondaryConcerns };
};
