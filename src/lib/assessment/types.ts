/**
 * SKYNN AI Advanced Dermatology Assessment Engine — frontend contract.
 *
 * Mirrors the shapes returned by the skynn-advanced-assessment edge function
 * (supabase/functions/skynn-advanced-assessment/index.ts) and the report
 * schema validated server-side (supabase/functions/_shared/assessment/
 * reportSchema.ts). Kept as a second, hand-written copy rather than a
 * shared import — Deno edge functions and the Vite app are separate build
 * targets in this repo (see e.g. marketplace pricing's documented "keep in
 * sync" duplication in CLAUDE.md) — so if the two ever need to diverge,
 * change the edge function's response shape and this file together.
 */

export type AssessmentAccessType = "analysis_pass" | "membership" | "none";
export type AssessmentRolloutStage = "disabled" | "internal" | "beta" | "public";

export interface AdvancedAssessmentAccess {
  eligible: boolean;
  accessType: AssessmentAccessType;
  membershipTier: string | null;
  passesAvailable: number;
  rolloutStage: AssessmentRolloutStage;
}

export type QuestionType = "single_select" | "multi_select" | "scale" | "frequency" | "text" | "product_list";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  required: boolean;
  prompt: string;
  helperText?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  minSelections?: number;
  maxSelections?: number;
  showIf?: { questionId: string; oneOf: string[] };
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentDefinitionSummary {
  version: string;
  title: string;
  sections: AssessmentSection[];
}

export type AssessmentSessionStatus =
  | "created" | "in_progress" | "review" | "submitted" | "processing"
  | "completed" | "abandoned" | "expired" | "failed" | "requires_review";

export interface AdvancedAssessmentSession {
  id: string;
  user_id: string;
  status: AssessmentSessionStatus;
  assessment_version: string;
  responses: Record<string, unknown>;
  current_section_id: string | null;
  completeness_pct: number;
  assessment_definition_id: string;
  failure_reason?: string | null;
}

export interface ProductListEntry {
  productId?: string;
  productName?: string;
  category?: string;
  frequency?: string;
  usageArea?: string;
  knownIngredients?: string[];
}

export type SafetyUrgency = "routine" | "prompt" | "urgent";

export interface SafetyScreenResult {
  requiresProfessionalReview: boolean;
  urgency: SafetyUrgency;
  reasons: string[];
  userMessage: string;
}

export interface EvidenceReference {
  id: string;
  title: string;
  publisher?: string | null;
  sourceType: string;
  url?: string | null;
  publicationDate?: string | null;
  relevance?: string;
}

export type ReportConfidence = "high" | "moderate" | "limited";
export type ReportGenerationStatus = "pending" | "completed" | "failed";

export interface AdvancedDermatologyReport {
  summary: string;
  skinProfile: { skinType: string; keyTraits: string[] };
  observations: string[];
  primaryConcerns: Array<{ concern: string; priority: number; rationale: string }>;
  secondaryConcerns: string[];
  contributingFactors: Array<{ factor: string; explanation: string }>;
  routineAssessment: { strengths: string[]; gaps: string[] };
  recommendations: Array<{ area: string; recommendation: string; rationale: string }>;
  ingredientGuidance: Array<{ ingredientOrCategory: string; guidance: string }>;
  routineStrategy: { amFocus: string; pmFocus: string; notes: string };
  lifestyleContext: string[];
  whatToAvoid: string[];
  safetyFlags: SafetyScreenResult;
  evidence: EvidenceReference[];
  confidence: ReportConfidence;
  uncertainties: string[];
}

export interface AdvancedAssessmentReportRow {
  id: string;
  session_id: string;
  generation_status: ReportGenerationStatus;
  error_message: string | null;
  report: AdvancedDermatologyReport | null;
  confidence: ReportConfidence | null;
  model: string | null;
  prompt_version: string | null;
  engine_version: string | null;
  generated_at: string | null;
  created_at: string;
}

/**
 * Smart Routines integration contract (section 35) — the shape a completed
 * Advanced Assessment report would hand off to populate/enrich the existing
 * Smart Routines feature (src/hooks/use-routine.ts). Defined now as the
 * agreed contract; no Smart Routines write path consumes it yet (would be a
 * second routine engine otherwise — out of scope for this foundation, see
 * CLAUDE.md).
 */
export interface AdvancedRoutineContext {
  skinProfile: AdvancedDermatologyReport["skinProfile"];
  concerns: AdvancedDermatologyReport["primaryConcerns"];
  ingredientPreferences: string[];
  ingredientAvoidances: string[];
  routineRecommendations: AdvancedDermatologyReport["recommendations"];
}

export function buildRoutineHandoffContext(report: AdvancedDermatologyReport): AdvancedRoutineContext {
  return {
    skinProfile: report.skinProfile,
    concerns: report.primaryConcerns,
    ingredientPreferences: report.ingredientGuidance.map((g) => g.ingredientOrCategory),
    ingredientAvoidances: report.whatToAvoid,
    routineRecommendations: report.recommendations,
  };
}
