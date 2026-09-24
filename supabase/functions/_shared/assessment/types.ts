/**
 * SKYNN AI Advanced Dermatology Assessment Engine — shared domain types.
 *
 * Deno-and-Bun-portable: no Deno-specific globals, no remote imports. This
 * lets the pure logic modules in this directory (safety.ts, evidence
 * selection helpers) be unit-tested directly with `bun test` from
 * src/lib/__tests__, the same way src/lib/conflictMatcher.ts is tested,
 * without duplicating the logic into a second copy under src/.
 */

/** Per-task Claude model routing keys — see modelConfig.ts for the table. */
export type AssessmentTask =
  | "report_generation"
  | "complex_reasoning"
  | "evidence_synthesis"
  | "safety_review"
  | "report_regeneration"
  | "routine_transformation"
  | "classification"
  | "chat"
  // SKYNN AI v2 multi-model pipeline (2026-09-23, framework §4): Haiku for
  // high-volume intake/safety triage, Sonnet for reasoning and writing,
  // Opus as the final compliance/QA gate.
  | "intake_normalisation"
  | "safety_triage"
  | "fairness_calibration"
  | "assessment_reasoning"
  | "report_writing"
  | "qa_review";

export type ConfidenceLevel = "high" | "moderate" | "limited";
export type SafetyUrgency = "routine" | "prompt" | "urgent";

export interface SafetyScreenResult {
  requiresProfessionalReview: boolean;
  urgency: SafetyUrgency;
  reasons: string[];
  userMessage: string;
}

/** Sanitised, minimal user context — never raw PII (see sanitize.ts). */
export interface SanitizedUserProfile {
  ageRange: "under_18" | "18_24" | "25_34" | "35_44" | "45_54" | "55_plus" | "unspecified";
  province: string | null;
  city: string | null;
  membershipTier: "explorer" | "glow_lite" | "insider" | "vip";
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

export interface RoutineContext {
  amSteps: string[];
  pmSteps: string[];
  activesInUse: string[];
}

export interface NormalizedAssessment {
  assessmentVersion: string;
  sections: Record<string, Record<string, unknown>>;
}

export interface SafetyContext {
  screen: SafetyScreenResult;
}

export interface AssessmentGenerationInput {
  assessmentVersion: string;
  userProfile: SanitizedUserProfile;
  assessment: NormalizedAssessment;
  safetyContext: SafetyContext;
  evidence: EvidenceReference[];
  routineContext?: RoutineContext;
}

export interface AdvancedDermatologyReport {
  summary: string;
  skinProfile: {
    skinType: string;
    keyTraits: string[];
  };
  observations: string[];
  primaryConcerns: Array<{
    concern: string;
    priority: number;
    rationale: string;
  }>;
  secondaryConcerns: string[];
  contributingFactors: Array<{
    factor: string;
    explanation: string;
  }>;
  routineAssessment: {
    strengths: string[];
    gaps: string[];
  };
  recommendations: Array<{
    area: string;
    recommendation: string;
    rationale: string;
  }>;
  ingredientGuidance: Array<{
    ingredientOrCategory: string;
    guidance: string;
  }>;
  routineStrategy: {
    amFocus: string;
    pmFocus: string;
    notes: string;
  };
  lifestyleContext: string[];
  whatToAvoid: string[];
  safetyFlags: SafetyScreenResult;
  evidence: EvidenceReference[];
  confidence: ConfidenceLevel;
  uncertainties: string[];
}

/**
 * What the provider itself returns — safetyFlags and evidence are always
 * overwritten by the edge function afterwards (the deterministic safety
 * screen, and the server-validated evidence set from validateCitedEvidence)
 * rather than trusted from the model, so the provider doesn't need to
 * produce them in final form. See AdvancedDermatologyReport for the
 * complete, persisted shape.
 */
export type RawAdvancedDermatologyReport = Omit<AdvancedDermatologyReport, "safetyFlags" | "evidence"> & {
  safetyFlags?: Partial<SafetyScreenResult>;
  evidence?: EvidenceReference[];
};

export interface AssessmentGenerationResult {
  report: RawAdvancedDermatologyReport;
  metadata: {
    model: string;
    promptVersion: string;
    engineVersion: string;
    generatedAt: string;
  };
}

export class AssessmentProviderError extends Error {
  constructor(
    message: string,
    public code: "not_configured" | "rate_limited" | "invalid_response" | "upstream_error" | "timeout",
  ) {
    super(message);
  }
}
