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
export type AssessmentRolloutStage = "disabled" | "internal" | "beta" | "pass_holders_review" | "public";

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
export type ReportReviewStatus = "awaiting_review" | "approved" | "rejected";
export type Triage = "clear" | "caution" | "escalate";

// ---------------------------------------------------------------------------
// SKYNN AI v2 report (2026-09-23). Mirrors FinalReportV2 in
// supabase/functions/_shared/assessment/pipeline/run.ts and the scoring
// result types in supabase/functions/_shared/assessment/scoring/ — keep in
// sync with those if either changes (separate build targets, see above).
// ---------------------------------------------------------------------------

export interface CitedSource {
  code: string;
  title: string;
  publisher: string | null;
  year: number | null;
  url: string | null;
  pmid: string | null;
  doi: string | null;
  source_type: string;
}

export interface AdvancedReportScores {
  version: string;
  baumannStyle: {
    code: string | null;
    axes: Record<string, { score: number; max: number; answered: number; letter: string; label: string }>;
    label: string;
  };
  acne: {
    present: boolean;
    gagsStyleTotal: number | null;
    gagsStyleBand: string | null;
    igaStyleGrade: number | null;
    igaStyleLabel: string | null;
    label: string;
  };
  glogauStyle: { type: string | null; label: string | null };
  melasmaTracker: { present: boolean; mmasiStyleScore: number | null; max: number; label: string };
  qolImpact: { score: number | null; band: string | null; label: string };
  mst: { tier: number | null; group: string | null; skinOfColourPriority: boolean; ironOxideSpfIndicated: boolean };
}

export interface ReportRoutineStep {
  step: string;
  product_type: string;
  guidance: string;
  citations: string[];
}

export interface AdvancedDermatologyReportV2 {
  schemaVersion: 2;
  engineVersion: string;
  summary: string;
  skinProfile: { headline: string; keyTraits: string[]; baumannStyleType: string | null };
  scores: AdvancedReportScores;
  triage: { level: Triage; categories: string[]; message: string | null };
  fairness: { mst_tier: number | null; tone_confidence: string; soc_priority_conditions: string[]; photoprotection_note: string };
  routineAm: ReportRoutineStep[];
  routinePm: ReportRoutineStep[];
  targetedActives: Array<{ active: string; for: string; how_to_introduce: string; citations: string[]; tone_confidence: string }>;
  lifestyle: Array<{ advice: string; citations: string[] }>;
  whatToAvoid: string[];
  disclaimers: string[];
  confidence: ReportConfidence;
  uncertainties: string[];
  evidence: CitedSource[];
  methodology: CitedSource[];
  markdown: string;
  emailSummary: string;
}

/** What get_my_advanced_assessment_report() returns — content fields are
 *  null until an admin has approved the report. */
export interface AdvancedAssessmentReportRow {
  id: string;
  session_id: string;
  created_at: string;
  generated_at: string | null;
  generation_status: ReportGenerationStatus;
  review_status: ReportReviewStatus | null;
  released_at: string | null;
  error_message: string | null;
  triage: Triage | null;
  confidence: ReportConfidence | null;
  report: AdvancedDermatologyReportV2 | null;
  rendered_markdown: string | null;
  engine_version: string | null;
  prompt_version: string | null;
}

export interface AdvancedAssessmentReportSummary {
  id: string;
  session_id: string;
  generation_status: ReportGenerationStatus;
  review_status: ReportReviewStatus | null;
  released_at: string | null;
  generated_at: string | null;
  created_at: string;
}

/**
 * Smart Routines integration contract (section 35) — the shape an approved
 * Advanced report would hand off to the Smart Routines feature
 * (src/hooks/use-routine.ts). Contract only; no write path consumes it yet.
 */
export interface AdvancedRoutineContext {
  baumannStyleType: string | null;
  routineAm: ReportRoutineStep[];
  routinePm: ReportRoutineStep[];
  ingredientPreferences: string[];
  ingredientAvoidances: string[];
}

export function buildRoutineHandoffContext(report: AdvancedDermatologyReportV2): AdvancedRoutineContext {
  return {
    baumannStyleType: report.skinProfile.baumannStyleType,
    routineAm: report.routineAm,
    routinePm: report.routinePm,
    ingredientPreferences: report.targetedActives.map((a) => a.active),
    ingredientAvoidances: report.whatToAvoid,
  };
}
