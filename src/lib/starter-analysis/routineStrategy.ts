/**
 * Routine Reality Check → deterministic guardrails (Section 6/29). Converts
 * routine-complexity/priority preferences into concrete limits the result
 * assembly step must respect — step count target, active intensity ceiling,
 * budget stance. Safety rules here are hard floors: no preference (including
 * refinement feedback) can push active intensity past what sensitivity/barrier
 * status allows — see the `sensitivityTendency`/`barrierTendency` clamp below.
 */

import type {
  ActiveIntensity,
  NormalisedProfile,
  PriorityPreference,
  RoutineComplexityPreference,
  RoutinePreferences,
  RoutineStrategy,
} from "@/lib/starter-analysis/types";
import { ROUTINE_STRATEGY_VERSION } from "@/lib/starter-analysis/types";

const STEP_COUNT_BY_COMPLEXITY: Record<RoutineComplexityPreference, number> = {
  minimal: 3,
  moderate: 5,
  flexible: 7,
};

const INTENSITY_RANK: Record<ActiveIntensity, number> = { none: 0, gentle: 1, standard: 2, assertive: 3 };
const clampIntensity = (value: ActiveIntensity, max: ActiveIntensity): ActiveIntensity =>
  INTENSITY_RANK[value] > INTENSITY_RANK[max] ? max : value;

export const buildRoutineStrategy = (
  profile: NormalisedProfile,
  preferences: RoutinePreferences,
): RoutineStrategy => {
  let targetStepCount = STEP_COUNT_BY_COMPLEXITY[preferences.complexity];
  const priority: PriorityPreference | null = preferences.priority;
  if (priority === "simplest") targetStepCount = Math.min(targetStepCount, 3);
  if (priority === "comprehensive") targetStepCount = Math.max(targetStepCount, 7);

  // Safety ceiling: sensitive/compromised-barrier skin never goes past "gentle", no matter what the
  // visitor prefers or later requests via refinement — mirrors deriveExtraSignals' cautionNote logic.
  const safetyCeiling: ActiveIntensity =
    profile.sensitivityTendency === "high" || profile.barrierTendency === "needs_support" ? "gentle" : "assertive";

  let activeIntensity: ActiveIntensity;
  if (profile.activeTolerance === "new" || profile.activeTolerance === "unsure") {
    activeIntensity = "gentle";
  } else if (profile.activeTolerance === "cautious") {
    activeIntensity = "standard";
  } else {
    activeIntensity = "standard";
    if (priority === "fastest" && profile.routineMaturity === "experienced") activeIntensity = "assertive";
  }
  if (priority === "gentlest") activeIntensity = "gentle";
  activeIntensity = clampIntensity(activeIntensity, safetyCeiling);

  const budgetStance: RoutineStrategy["budgetStance"] =
    preferences.budgetConscious || priority === "best_value" ? "constrained" : "flexible";

  return {
    targetStepCount,
    activeIntensity,
    budgetStance,
    complexityPreference: preferences.complexity,
    priorityPreference: priority,
    version: ROUTINE_STRATEGY_VERSION,
  };
};
