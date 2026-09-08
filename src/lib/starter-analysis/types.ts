/**
 * Shared types for Starter Analysis 2.0 — the deterministic interpretation layer
 * built on top of the existing SKYNN AI questionnaire (`src/data/quiz.ts`),
 * `computeCompleteness()` and `pickGroundedRoutine()`. Nothing here calls an AI
 * model; every value is derived from quiz answers + the two new contextual
 * questions (What Changed / Priority preference) via pure functions.
 */

import type { FormulaConcern, FormulaSkinType } from "@/data/formulaResults";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";
import type { CompletenessBreakdown } from "@/data/formulaResults";

export type SensitivityTendency = "low" | "moderate" | "high";
export type BarrierTendency = "supported" | "needs_support" | "uncertain";
export type ActiveTolerance = "tolerant" | "cautious" | "new" | "unsure";
export type RoutineMaturity = "beginner" | "intermediate" | "experienced";
export type SkinBehaviour = "stable" | "variable" | "reactive";
export type MaintenanceOrientation = "maintenance" | "corrective" | "mixed";

/** Broader concern taxonomy than the 4-way CONCERN_BY_Q9_VALUE split — used for secondary concerns and the priority engine. */
export type ConcernKey =
  | "breakouts"
  | "dryness"
  | "dehydration"
  | "uneven_tone"
  | "pigmentation"
  | "texture"
  | "oiliness"
  | "sensitivity"
  | "visible_pores"
  | "barrier_support"
  | "maintenance";

export type GoalKey =
  | "improve_appearance"
  | "simplify_routine"
  | "maintain_skin"
  | "support_barrier"
  | "improve_consistency"
  | "address_multiple_concerns";

/** "What is happening with your skin right now?" — src/data/starter-analysis/contextQuestions.ts */
export type SkinChangeStatus =
  | "always_like_this"
  | "started_recently"
  | "worse_recently"
  | "improved_recently"
  | "comes_and_goes"
  | "after_new_product"
  | "after_stopping_product"
  | "weather_seasonal"
  | "unsure";

export interface ChangeContext {
  status: SkinChangeStatus | null;
  /** Only populated when status is a trigger that has a follow-up (product/weather/recurring). */
  detail: string | null;
}

export type RoutineComplexityPreference = "minimal" | "moderate" | "flexible";
export type PriorityPreference = "simplest" | "best_value" | "fastest" | "gentlest" | "comprehensive";

export interface RoutinePreferences {
  /** Derived from q13 (routine consistency) unless the user overrides it via refinement. */
  complexity: RoutineComplexityPreference;
  /** New, dedicated question — not reliably inferable from the existing 20. */
  priority: PriorityPreference | null;
  /** Derived from q20 ("budget/affordability" vs other constraints). */
  budgetConscious: boolean;
}

/** The normalised, structured read of a visitor's answers — the input to every downstream module. */
export interface NormalisedProfile {
  skinType: FormulaSkinType;
  primaryConcern: FormulaConcern;
  secondaryConcerns: ConcernKey[];
  sensitivityTendency: SensitivityTendency;
  barrierTendency: BarrierTendency;
  activeTolerance: ActiveTolerance;
  routineMaturity: RoutineMaturity;
  skinBehaviour: SkinBehaviour;
  maintenanceOrientation: MaintenanceOrientation;
  primaryGoal: GoalKey;
  secondaryGoal: GoalKey | null;
  mstTone: number | null;
}

export const SKIN_STORY_VERSION = "1.0.0";

/** A reusable structured object, not hard-coded UI copy — rendered by SkinStoryCard and folded into the PDF/markdown result. */
export interface SkinStory {
  primaryConcern: ConcernKey;
  secondaryConcerns: ConcernKey[];
  skinBehaviour: SkinBehaviour;
  sensitivityTendency: SensitivityTendency;
  barrierTendency: BarrierTendency;
  activeTolerance: ActiveTolerance;
  routineMaturity: RoutineMaturity;
  primaryGoal: GoalKey;
  secondaryGoal: GoalKey | null;
  narrative: string;
  version: string;
}

export const PRIORITY_ENGINE_VERSION = "1.0.0";

export type PriorityLevel = "high" | "moderate" | "low";

export interface PriorityItem {
  key: ConcernKey;
  level: PriorityLevel;
  reason: string;
  rank: number;
}

export interface PriorityResult {
  items: PriorityItem[];
  scoringVersion: string;
}

export const ROUTINE_STRATEGY_VERSION = "1.0.0";

export type ActiveIntensity = "none" | "gentle" | "standard" | "assertive";

/** Deterministic guardrails the routine/refinement/PDF text must respect — see routineStrategy.ts. */
export interface RoutineStrategy {
  targetStepCount: number;
  activeIntensity: ActiveIntensity;
  budgetStance: "constrained" | "flexible";
  complexityPreference: RoutineComplexityPreference;
  priorityPreference: PriorityPreference | null;
  version: string;
}

export type RefinementAccuracy = "very_accurate" | "mostly_accurate" | "not_quite";

export type RefinementReason =
  | "too_many_products"
  | "too_few_products"
  | "too_focused_acne"
  | "too_focused_pigmentation"
  | "too_gentle"
  | "too_aggressive"
  | "too_expensive"
  | "too_complicated"
  | "doesnt_match_skin"
  | "another_concern";

export interface RefinementEvent {
  accuracy: RefinementAccuracy;
  reason: RefinementReason | null;
  otherConcern?: ConcernKey | null;
  appliedAt: string;
}

export const RESULT_VERSION = "2.0.0";
export const CONTENT_VERSION = "1.0.0";

export interface StarterAnalysisResult {
  analysisId: string;
  generatedAt: string;
  skinType: FormulaSkinType;
  primaryConcern: FormulaConcern;
  profile: NormalisedProfile;
  skinStory: SkinStory;
  priorities: PriorityResult;
  routineStrategy: RoutineStrategy;
  context: ChangeContext;
  preferences: RoutinePreferences;
  completeness: CompletenessBreakdown;
  groundedRoutine: GroundedRoutine;
  /** Full markdown-shaped text — same shape formatRecommendation()/generateSkincarePdf.ts already parse. */
  recommendationText: string;
  refinementHistory: RefinementEvent[];
  versions: {
    resultVersion: string;
    scoringVersion: string;
    contentVersion: string;
    productMatchingVersion: string;
  };
}
