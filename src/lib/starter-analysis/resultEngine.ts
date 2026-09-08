/**
 * Result Engine 2.0 (Section 9) — orchestrates the full deterministic pipeline:
 * answers -> normalised profile -> Skin Story -> priorities -> routine strategy
 * -> grounded product matching (reused) -> markdown assembly (reused/extended)
 * -> completeness (reused) -> scenario validation. No network/AI call anywhere
 * in this file — see AIFormulator.tsx's `runStarterAnalysis`, which is the only
 * caller, and Section 30's "no AI requirement" test in
 * src/lib/starter-analysis/__tests__/resultEngine.test.ts.
 */

import { QUESTIONS } from "@/data/quiz";
import { buildPredeterminedRecommendation, computeCompleteness } from "@/data/formulaResults";
import { pickGroundedRoutine } from "@/lib/skynnProductMatch";
import { buildNormalisedProfile, deriveBudgetConscious, deriveRoutineComplexityFromQuiz } from "@/lib/starter-analysis/normalize";
import { buildSkinStory } from "@/lib/starter-analysis/skinStory";
import { priorityLabel, rankPriorities } from "@/lib/starter-analysis/priorityEngine";
import { buildRoutineStrategy } from "@/lib/starter-analysis/routineStrategy";
import { warnOnValidationIssues } from "@/lib/starter-analysis/scenarioValidation";
import {
  CONTENT_VERSION,
  RESULT_VERSION,
  type ChangeContext,
  type NormalisedProfile,
  type PriorityPreference,
  type RefinementEvent,
  type RoutinePreferences,
  type StarterAnalysisResult,
} from "@/lib/starter-analysis/types";

const PRODUCT_MATCHING_VERSION = "1.0.0";

const CHANGE_STATUS_LABEL: Record<NonNullable<ChangeContext["status"]>, string> = {
  always_like_this: "Your skin has always been like this.",
  started_recently: "This started recently.",
  worse_recently: "This became worse recently.",
  improved_recently: "This improved recently.",
  comes_and_goes: "This comes and goes.",
  after_new_product: "This changed after starting a new product.",
  after_stopping_product: "This changed after stopping a product.",
  weather_seasonal: "This changed with the weather or season.",
  unsure: "You weren't sure what triggered this.",
};

const buildChangeSummary = (context: ChangeContext): string | null => {
  if (!context.status || context.status === "always_like_this" || context.status === "unsure") {
    return context.status ? CHANGE_STATUS_LABEL[context.status] : null;
  }
  const label = CHANGE_STATUS_LABEL[context.status];
  return context.detail ? `${label} You told us: "${context.detail}".` : label;
};

const ROUTINE_STRATEGY_COPY = {
  targetStepCount: (n: number) => `We've aimed for around ${n} routine steps to match what you told us you want.`,
  budgetConstrained: "We've favoured lower-cost, multi-purpose picks where a reviewed match exists.",
  activeIntensity: {
    none: "No actives right now — the focus is cleansing, moisturising and SPF.",
    gentle: "We've kept actives gentle and infrequent given your answers.",
    standard: "A standard active schedule fits your profile.",
    assertive: "Your profile supports a more assertive active schedule if you want faster results.",
  },
};

const buildRoutineStrategyNote = (strategy: StarterAnalysisResult["routineStrategy"]): string => {
  const parts = [
    ROUTINE_STRATEGY_COPY.targetStepCount(strategy.targetStepCount),
    ROUTINE_STRATEGY_COPY.activeIntensity[strategy.activeIntensity],
    strategy.budgetStance === "constrained" ? ROUTINE_STRATEGY_COPY.budgetConstrained : null,
  ];
  return parts.filter(Boolean).join(" ");
};

export interface AssembleStarterAnalysisInput {
  analysisId: string;
  answers: Record<string, number>;
  mstTone: number | null;
  hasPhoto: boolean;
  context: ChangeContext;
  priorityPreference: PriorityPreference | null;
  /** Gates named/priced product reveal — false for non-paid visitors (see AIFormulator.tsx). */
  revealProducts: boolean;
  refinementHistory?: RefinementEvent[];
  /** Refinement re-runs pass an already-adjusted profile/preferences instead of re-deriving from answers. */
  profileOverride?: NormalisedProfile;
  preferencesOverride?: RoutinePreferences;
}

export const assembleStarterAnalysisResult = (input: AssembleStarterAnalysisInput): StarterAnalysisResult => {
  const { answers, mstTone, hasPhoto, context, revealProducts } = input;

  const profile = input.profileOverride ?? buildNormalisedProfile({ answers, mstTone, context });
  const preferences: RoutinePreferences =
    input.preferencesOverride ?? {
      complexity: deriveRoutineComplexityFromQuiz(answers),
      priority: input.priorityPreference,
      budgetConscious: deriveBudgetConscious(answers),
    };

  const skinStory = buildSkinStory(profile, context);
  const priorities = rankPriorities(profile);
  const routineStrategy = buildRoutineStrategy(profile, preferences);

  const completeness = computeCompleteness({
    answeredCount: Object.keys(answers).length,
    totalQuestions: QUESTIONS.length,
    hasPhoto,
    hasMstTone: mstTone !== null,
  });

  const groundedRoutine = pickGroundedRoutine(profile.skinType, profile.primaryConcern, {
    sensitive: profile.sensitivityTendency !== "low",
    mstTone,
  });

  const recommendationText = buildPredeterminedRecommendation(profile.skinType, profile.primaryConcern, answers, {
    mstTone,
    groundedRoutine,
    revealProducts,
    skinStoryNarrative: skinStory.narrative,
    priorities: priorities.items.map((p) => ({ label: priorityLabel(p.key), level: p.level, reason: p.reason })),
    changeNote: buildChangeSummary(context),
    routineStrategyNote: buildRoutineStrategyNote(routineStrategy),
  });

  const result: StarterAnalysisResult = {
    analysisId: input.analysisId,
    generatedAt: new Date().toISOString(),
    skinType: profile.skinType,
    primaryConcern: profile.primaryConcern,
    profile,
    skinStory,
    priorities,
    routineStrategy,
    context,
    preferences,
    completeness,
    groundedRoutine,
    recommendationText,
    refinementHistory: input.refinementHistory ?? [],
    versions: {
      resultVersion: RESULT_VERSION,
      scoringVersion: priorities.scoringVersion,
      contentVersion: CONTENT_VERSION,
      productMatchingVersion: PRODUCT_MATCHING_VERSION,
    },
  };

  warnOnValidationIssues(result);
  return result;
};
