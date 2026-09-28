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

/** Central server-side switch (skynn_advanced_assessment_config.report_mode):
 *  what happens to a new submission. fallback = pre-approval intake (stored,
 *  queued, report delivered later); production = the v2 pipeline. */
export type AdvancedReportMode = "disabled" | "fallback" | "production";
export type ProcessingMode = "fallback" | "production";
export type IntakeStatus =
  | "submitted" | "pending" | "processing" | "review_required" | "approved" | "released" | "rejected" | "failed";

export interface AdvancedAssessmentAccess {
  eligible: boolean;
  accessType: AssessmentAccessType;
  membershipTier: string | null;
  passesAvailable: number;
  rolloutStage: AssessmentRolloutStage;
  reportMode: AdvancedReportMode;
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
  reference_number: string | null;
  processing_mode: ProcessingMode | null;
  intake_status: IntakeStatus | null;
  submitted_at: string | null;
}

export interface AdvancedAssessmentReportSummary {
  id: string;
  session_id: string;
  generation_status: ReportGenerationStatus;
  review_status: ReportReviewStatus | null;
  released_at: string | null;
  generated_at: string | null;
  created_at: string;
  reference_number: string | null;
  processing_mode: ProcessingMode | null;
  intake_status: IntakeStatus | null;
  submitted_at: string | null;
}

/** One member-facing status for any report row, whichever lifecycle it's on
 *  (pre-approval intake or the production pipeline). Every status label in
 *  the UI goes through this so the two lifecycles can't drift apart. */
export type ReportDisplayStatus = "pending_intake" | "preparing" | "in_review" | "ready" | "not_released" | "failed";

export function getReportDisplayStatus(r: {
  generation_status: ReportGenerationStatus;
  review_status: ReportReviewStatus | null;
  processing_mode?: ProcessingMode | null;
  intake_status?: IntakeStatus | null;
}): ReportDisplayStatus {
  if (r.processing_mode === "fallback") {
    if (r.intake_status === "rejected") return "not_released";
    if (r.intake_status === "failed") return "failed";
    return "pending_intake";
  }
  if (r.generation_status === "failed") return "failed";
  if (r.review_status === "rejected") return "not_released";
  if (r.review_status === "approved") return "ready";
  if (r.generation_status === "pending") return "preparing";
  return "in_review";
}

export const REPORT_STATUS_LABEL: Record<ReportDisplayStatus, string> = {
  pending_intake: "Pending",
  preparing: "Being prepared",
  in_review: "With our review team",
  ready: "Ready",
  not_released: "Not released · pass refunded",
  failed: "Couldn't be created · pass refunded",
};

/** Shown wherever a pre-approval submission is described. */
export const INTAKE_EXPECTED_DELIVERY = "approximately 3–4 weeks";

/**
 * Smart Routines integration contract (section 35) — the shape an approved
 * Advanced report would hand off to the Smart Routines feature
 * (src/hooks/use-routine.ts). Since v2.1 the Smart Routine engine
 * (src/lib/smartRoutine/engine.ts `fromReport()`) reads routineAm/routinePm
 * from an approved report directly and saves via save_smart_routine().
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
