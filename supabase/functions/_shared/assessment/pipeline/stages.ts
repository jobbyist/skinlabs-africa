/**
 * SKYNN AI v2 stage contracts (framework §3-§5).
 *
 *   intake   (Haiku)  raw answers      -> SkinIntake
 *   safety   (Haiku)  SkinIntake       -> triage
 *   fairness (Sonnet) intake + scores  -> tone calibration
 *   reasoner (Sonnet) everything + approved evidence -> SkinReport
 *   writer   (Sonnet) SkinReport       -> markdown + email summary
 *   qa       (Opus)   draft + report   -> approve / reject
 *
 * Each stage's system prompt lives only in assessment_prompt_versions
 * (service-role only, keyed by role). This file defines only the OUTPUT
 * contracts — the tool each model must call — never clinical methodology.
 */
import type { JsonSchema } from "./jsonSchema.ts";
import type { AssessmentTask } from "../modelConfig.ts";

export type StageRole = "intake" | "safety" | "fairness" | "reasoner" | "writer" | "qa";
export const STAGE_ORDER: StageRole[] = ["intake", "safety", "fairness", "reasoner", "writer", "qa"];

const str: JsonSchema = { type: "string" };
const strArr: JsonSchema = { type: "array", items: { type: "string" } };
const nullableStr: JsonSchema = { type: ["string", "null"] };

export const CONCERN_VOCAB = [
  "breakouts_acne", "oiliness", "dryness_dehydration", "redness_sensitivity", "uneven_tone_pigmentation",
  "fine_lines_aging", "texture_congestion", "dullness", "large_pores", "scarring_marks", "razor_bumps",
] as const;

export const INTAKE_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    skin_feel: { type: ["string", "null"], enum: ["dry", "oily", "combination", "normal", null] },
    sensitivity: { type: ["string", "null"], enum: ["low", "medium", "high", null] },
    concerns: { type: "array", items: { type: "string", enum: [...CONCERN_VOCAB] } },
    mst_self_reported: { type: ["integer", "null"], minimum: 1, maximum: 10 },
    pregnancy_status: { type: ["string", "null"] },
    current_actives: strArr,
    known_irritants: strArr,
    climate: nullableStr,
    sun_exposure: nullableStr,
    spf_habit: nullableStr,
    lifestyle_notes: strArr,
    goals: strArr,
    lesion_description: { type: ["string", "null"], description: "Verbatim-in-meaning summary of anything the user wrote about moles, spots, sores or lesions; null if nothing." },
    injection_flagged: { type: "boolean" },
  },
  required: [
    "skin_feel", "sensitivity", "concerns", "mst_self_reported", "pregnancy_status", "current_actives",
    "known_irritants", "climate", "sun_exposure", "spf_habit", "lifestyle_notes", "goals", "lesion_description",
    "injection_flagged",
  ],
};

export const SAFETY_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    triage: { type: "string", enum: ["clear", "caution", "escalate"] },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: ["suspected_malignancy", "possible_infection", "pregnancy_breastfeeding", "severe_systemic", "distress"],
      },
    },
    rationale: str,
    user_message_key: str,
  },
  required: ["triage", "categories", "rationale", "user_message_key"],
};

export const FAIRNESS_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    mst_tier: { type: ["integer", "null"], minimum: 1, maximum: 10 },
    tone_confidence: { type: "string", enum: ["high", "moderate", "low"] },
    soc_priority_conditions: strArr,
    photoprotection_note: str,
  },
  required: ["mst_tier", "tone_confidence", "soc_priority_conditions", "photoprotection_note"],
};

const citationIds: JsonSchema = {
  type: "array",
  items: { type: "string" },
  description: "Citation codes (e.g. C3) from the APPROVED EVIDENCE list only.",
};

const routineStep: JsonSchema = {
  type: "object",
  properties: {
    step: str,
    product_type: str,
    guidance: str,
    citations: citationIds,
  },
  required: ["step", "product_type", "guidance", "citations"],
};

export const REASONER_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string", minLength: 1 },
    skin_profile: {
      type: "object",
      properties: { headline: str, key_traits: strArr },
      required: ["headline", "key_traits"],
    },
    routine_am: { type: "array", items: routineStep },
    routine_pm: { type: "array", items: routineStep },
    targeted_actives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          active: str,
          for: str,
          how_to_introduce: str,
          citations: citationIds,
          tone_confidence: { type: "string", enum: ["high", "moderate", "lower_confidence_for_tone"] },
        },
        required: ["active", "for", "how_to_introduce", "citations", "tone_confidence"],
      },
    },
    lifestyle: {
      type: "array",
      items: {
        type: "object",
        properties: { advice: str, citations: citationIds },
        required: ["advice", "citations"],
      },
    },
    what_to_avoid: strArr,
    escalation: {
      type: "object",
      properties: { required: { type: "boolean" }, message: nullableStr },
      required: ["required", "message"],
    },
    disclaimers: strArr,
    confidence: { type: "string", enum: ["high", "moderate", "limited"] },
    uncertainties: strArr,
  },
  required: [
    "summary", "skin_profile", "routine_am", "routine_pm", "targeted_actives", "lifestyle", "what_to_avoid",
    "escalation", "disclaimers", "confidence", "uncertainties",
  ],
};

export const WRITER_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    markdown: { type: "string", minLength: 1 },
    email_summary: { type: "string", minLength: 1 },
  },
  required: ["markdown", "email_summary"],
};

export const QA_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    approved: { type: "boolean" },
    violations: strArr,
    redlines: strArr,
    final_report: str,
  },
  required: ["approved", "violations", "redlines", "final_report"],
};

export interface StageSpec {
  role: StageRole;
  task: AssessmentTask;
  toolName: string;
  toolDescription: string;
  schema: JsonSchema;
  maxTokens: number;
}

export const STAGES: Record<StageRole, StageSpec> = {
  intake: {
    role: "intake", task: "intake_normalisation", toolName: "submit_skin_intake",
    toolDescription: "Submit the normalised SkinIntake JSON object.", schema: INTAKE_SCHEMA, maxTokens: 4000,
  },
  safety: {
    role: "safety", task: "safety_triage", toolName: "submit_safety_triage",
    toolDescription: "Submit the red-flag triage classification.", schema: SAFETY_SCHEMA, maxTokens: 2000,
  },
  fairness: {
    role: "fairness", task: "fairness_calibration", toolName: "submit_fairness_calibration",
    toolDescription: "Submit the skin-tone fairness calibration.", schema: FAIRNESS_SCHEMA, maxTokens: 6000,
  },
  reasoner: {
    role: "reasoner", task: "assessment_reasoning", toolName: "submit_skin_report",
    toolDescription: "Submit the SkinReport JSON.", schema: REASONER_SCHEMA, maxTokens: 16000,
  },
  writer: {
    role: "writer", task: "report_writing", toolName: "submit_rendered_report",
    toolDescription: "Submit the Markdown report and the short email summary.", schema: WRITER_SCHEMA, maxTokens: 12000,
  },
  qa: {
    role: "qa", task: "qa_review", toolName: "submit_qa_review",
    toolDescription: "Submit the compliance and QA review decision.", schema: QA_SCHEMA, maxTokens: 16000,
  },
};

// ---------- Stage output types ----------
export interface SkinIntake {
  skin_feel: "dry" | "oily" | "combination" | "normal" | null;
  sensitivity: "low" | "medium" | "high" | null;
  concerns: string[];
  mst_self_reported: number | null;
  pregnancy_status: string | null;
  current_actives: string[];
  known_irritants: string[];
  climate: string | null;
  sun_exposure: string | null;
  spf_habit: string | null;
  lifestyle_notes: string[];
  goals: string[];
  lesion_description: string | null;
  injection_flagged: boolean;
}

export interface SafetyTriageOutput {
  triage: "clear" | "caution" | "escalate";
  categories: string[];
  rationale: string;
  user_message_key: string;
}

export interface FairnessOutput {
  mst_tier: number | null;
  tone_confidence: "high" | "moderate" | "low";
  soc_priority_conditions: string[];
  photoprotection_note: string;
}

export interface RoutineStep {
  step: string;
  product_type: string;
  guidance: string;
  citations: string[];
}

export interface SkinReportOutput {
  summary: string;
  skin_profile: { headline: string; key_traits: string[] };
  routine_am: RoutineStep[];
  routine_pm: RoutineStep[];
  targeted_actives: Array<{
    active: string;
    for: string;
    how_to_introduce: string;
    citations: string[];
    tone_confidence: "high" | "moderate" | "lower_confidence_for_tone";
  }>;
  lifestyle: Array<{ advice: string; citations: string[] }>;
  what_to_avoid: string[];
  escalation: { required: boolean; message: string | null };
  disclaimers: string[];
  confidence: "high" | "moderate" | "limited";
  uncertainties: string[];
}

export interface WriterOutput {
  markdown: string;
  email_summary: string;
}

export interface QaOutput {
  approved: boolean;
  violations: string[];
  redlines: string[];
  final_report: string;
}
