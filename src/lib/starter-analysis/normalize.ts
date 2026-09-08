/**
 * Turns the raw quiz answer map (+ the two new context/preference answers) into a
 * `NormalisedProfile`. Every field is derived from answers that already exist in
 * `src/data/quiz.ts` — nothing here asks the visitor anything new. This is the
 * single place that maps q1–q20 to structured meaning; Skin Story, the Priority
 * Engine and Routine Strategy all consume this output rather than reading raw
 * `answers[...]` themselves.
 */

import { CONCERN_BY_Q9_VALUE, type FormulaConcern, type FormulaSkinType } from "@/data/formulaResults";
import type {
  ActiveTolerance,
  BarrierTendency,
  ChangeContext,
  ConcernKey,
  GoalKey,
  MaintenanceOrientation,
  NormalisedProfile,
  RoutineComplexityPreference,
  RoutineMaturity,
  SensitivityTendency,
  SkinBehaviour,
} from "@/lib/starter-analysis/types";

/**
 * Maps the 4-way FormulaConcern taxonomy (from q9, shared with the live-AI path
 * and formulaResults.ts) onto the broader ConcernKey taxonomy used everywhere
 * else in Starter Analysis 2.0 (secondary concerns, the Priority Engine,
 * refinement). Kept in one place — skinStory.ts, priorityEngine.ts and
 * refinement.ts all previously reimplemented this ternary inline, which is how
 * refinement.ts's "never re-add the primary concern" guard ended up comparing
 * a ConcernKey against a raw FormulaConcern and silently never matching.
 */
export const formulaConcernToKey = (concern: FormulaConcern): ConcernKey => {
  switch (concern) {
    case "acne":
      return "breakouts";
    case "brightening":
      return "uneven_tone";
    case "aging":
      return "texture";
    default:
      return "sensitivity";
  }
};

export const deriveSkinType = (answers: Record<string, number>): FormulaSkinType => {
  const q1 = answers["q1"];
  if (q1 === 0) return "oily";
  if (q1 === 1) return "combination";
  if (q1 === 2) return "normal";
  if (q1 === 3) return "dry";
  return "normal";
};

/** q20's "budget/affordability" option (0) is the only reliable existing budget signal — reused, not duplicated. */
export const deriveBudgetConscious = (answers: Record<string, number>): boolean => answers["q20"] === 0;

/** q13 ("How consistent are you with skincare?") already asks a routine-complexity-shaped question. */
export const deriveRoutineComplexityFromQuiz = (answers: Record<string, number>): RoutineComplexityPreference => {
  const q13 = answers["q13"];
  if (q13 === 0) return "minimal";
  if (q13 === 3) return "flexible";
  return "moderate";
};

const SECONDARY_CONCERN_SOURCES: Array<{ questionId: string; key: ConcernKey; threshold: number }> = [
  { questionId: "q2", key: "visible_pores", threshold: 1 },
  { questionId: "q3", key: "breakouts", threshold: 1 },
  { questionId: "q4", key: "dryness", threshold: 1 },
  { questionId: "q7", key: "sensitivity", threshold: 1 },
  { questionId: "q8", key: "uneven_tone", threshold: 1 },
];

const deriveSecondaryConcerns = (answers: Record<string, number>, primary: FormulaConcern): ConcernKey[] => {
  const primaryKey = formulaConcernToKey(primary);
  const scored = SECONDARY_CONCERN_SOURCES.map(({ questionId, key, threshold }) => {
    const value = answers[questionId];
    if (value === undefined || value > threshold) return null;
    return { key, severity: 3 - value };
  }).filter((x): x is { key: ConcernKey; severity: number } => x !== null && x.key !== primaryKey);

  // q17: tight but still oily/shiny — a dehydrated-oily combination signal distinct from q4's plain dryness.
  const q17 = answers["q17"];
  if (q17 !== undefined && q17 <= 1 && primaryKey !== "dehydration") {
    scored.push({ key: "dehydration", severity: 3 - q17 });
  }
  // q19: compromised/stressed barrier, surfaced as its own concern when notably low.
  const q19 = answers["q19"];
  if (q19 !== undefined && q19 <= 1 && primaryKey !== "barrier_support") {
    scored.push({ key: "barrier_support", severity: 3 - q19 });
  }

  const seen = new Set<ConcernKey>();
  return scored
    .sort((a, b) => b.severity - a.severity)
    .filter((s) => (seen.has(s.key) ? false : (seen.add(s.key), true)))
    .slice(0, 2)
    .map((s) => s.key);
};

const deriveSensitivityTendency = (answers: Record<string, number>): SensitivityTendency => {
  const reactivity = answers["q6"];
  const redness = answers["q7"];
  const worst = Math.min(reactivity ?? 3, redness ?? 3);
  if (worst <= 0) return "high";
  if (worst <= 1) return "moderate";
  return "low";
};

const deriveBarrierTendency = (answers: Record<string, number>): BarrierTendency => {
  const barrier = answers["q19"];
  if (barrier === undefined) return "uncertain";
  return barrier <= 1 ? "needs_support" : "supported";
};

const deriveActiveTolerance = (answers: Record<string, number>): ActiveTolerance => {
  const experience = answers["q15"];
  if (experience === 0) return "tolerant";
  if (experience === 1) return "cautious";
  if (experience === 2) return "new";
  return "unsure";
};

const deriveRoutineMaturity = (answers: Record<string, number>): RoutineMaturity => {
  const consistency = answers["q13"] ?? 1;
  const productCount = answers["q14"] ?? 1;
  const score = consistency + productCount;
  if (score <= 2) return "beginner";
  if (score >= 5) return "experienced";
  return "intermediate";
};

const deriveSkinBehaviour = (sensitivity: SensitivityTendency, context: ChangeContext): SkinBehaviour => {
  if (sensitivity === "high") return "reactive";
  const variableStatuses = new Set([
    "started_recently",
    "worse_recently",
    "improved_recently",
    "comes_and_goes",
    "after_new_product",
    "after_stopping_product",
    "weather_seasonal",
  ]);
  if (context.status && variableStatuses.has(context.status)) return "variable";
  return "stable";
};

const deriveMaintenanceOrientation = (
  secondaryConcerns: ConcernKey[],
  answers: Record<string, number>,
): MaintenanceOrientation => {
  const mildAcrossBoard = (answers["q3"] ?? 3) >= 2 && (answers["q4"] ?? 3) >= 2 && (answers["q8"] ?? 3) >= 2;
  if (secondaryConcerns.length === 0 && mildAcrossBoard) return "maintenance";
  if (secondaryConcerns.length >= 2) return "mixed";
  return "corrective";
};

const deriveGoals = (
  maintenanceOrientation: MaintenanceOrientation,
  barrierTendency: BarrierTendency,
  secondaryConcerns: ConcernKey[],
  complexity: RoutineComplexityPreference,
  answers: Record<string, number>,
): { primaryGoal: GoalKey; secondaryGoal: GoalKey | null } => {
  let primaryGoal: GoalKey = "improve_appearance";
  if (maintenanceOrientation === "maintenance") primaryGoal = "maintain_skin";
  else if (barrierTendency === "needs_support") primaryGoal = "support_barrier";

  let secondaryGoal: GoalKey | null = null;
  if (complexity === "minimal") secondaryGoal = "simplify_routine";
  else if (secondaryConcerns.length >= 2) secondaryGoal = "address_multiple_concerns";
  else if ((answers["q13"] ?? 2) <= 1) secondaryGoal = "improve_consistency";

  if (secondaryGoal === primaryGoal) secondaryGoal = null;
  return { primaryGoal, secondaryGoal };
};

export const buildNormalisedProfile = (params: {
  answers: Record<string, number>;
  mstTone: number | null;
  context: ChangeContext;
}): NormalisedProfile => {
  const { answers, mstTone, context } = params;
  const skinType = deriveSkinType(answers);
  const primaryConcern = CONCERN_BY_Q9_VALUE[answers["q9"]] ?? "sensitivity";
  const secondaryConcerns = deriveSecondaryConcerns(answers, primaryConcern);
  const sensitivityTendency = deriveSensitivityTendency(answers);
  const barrierTendency = deriveBarrierTendency(answers);
  const activeTolerance = deriveActiveTolerance(answers);
  const routineMaturity = deriveRoutineMaturity(answers);
  const skinBehaviour = deriveSkinBehaviour(sensitivityTendency, context);
  const maintenanceOrientation = deriveMaintenanceOrientation(secondaryConcerns, answers);
  const complexity = deriveRoutineComplexityFromQuiz(answers);
  const { primaryGoal, secondaryGoal } = deriveGoals(maintenanceOrientation, barrierTendency, secondaryConcerns, complexity, answers);

  return {
    skinType,
    primaryConcern,
    secondaryConcerns,
    sensitivityTendency,
    barrierTendency,
    activeTolerance,
    routineMaturity,
    skinBehaviour,
    maintenanceOrientation,
    primaryGoal,
    secondaryGoal,
    mstTone,
  };
};
