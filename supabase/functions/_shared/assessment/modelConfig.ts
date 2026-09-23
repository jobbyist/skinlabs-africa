/**
 * Per-task Claude model routing for the SKYNN Advanced Assessment engine
 * (2026-09-17) — a deliberate product decision to size the model to the
 * task rather than run everything on one default:
 *
 *   - Advanced Dermatology Report generation, and everything folded into
 *     that same single call today (complex assessment reasoning, evidence
 *     synthesis over the ALLOWED EVIDENCE list, safety/clinical-boundary
 *     language) — Opus 5, the highest-stakes and highest-reasoning task
 *     this engine performs.
 *   - Report regeneration — Opus 5, same bar as first generation (no real
 *     call site yet; see the note on ClaudeAssessmentProvider).
 *   - Routine/simple transformations (e.g. turning a completed report into
 *     routine steps) — Sonnet 5.
 *   - Lightweight classification — Haiku 4.5.
 *   - Simple UI/chat interactions — Sonnet 5 by default, Haiku 4.5 for the
 *     cheapest/simplest of those surfaces; callers that want Haiku pass
 *     "classification" or set SKYNN_ADVANCED_MODEL explicitly.
 *
 * Only "report_generation" has a real call site today — generateReport()
 * in claudeProvider.ts, invoked once per assessment submission. The rest
 * are wired here so a future call site (an explicit regenerate action, a
 * classification pre-pass, a chat surface) picks up the right model by
 * construction instead of inheriting whatever the last engineer left in a
 * single default constant.
 */

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

const TASK_MODELS: Record<AssessmentTask, string> = {
  report_generation: "claude-opus-5",
  complex_reasoning: "claude-opus-5",
  evidence_synthesis: "claude-opus-5",
  safety_review: "claude-opus-5",
  report_regeneration: "claude-opus-5",
  routine_transformation: "claude-sonnet-5",
  classification: "claude-haiku-4-5",
  chat: "claude-sonnet-5",
  intake_normalisation: "claude-haiku-4-5",
  safety_triage: "claude-haiku-4-5",
  fairness_calibration: "claude-sonnet-5",
  assessment_reasoning: "claude-sonnet-5",
  report_writing: "claude-sonnet-5",
  qa_review: "claude-opus-5",
};

/**
 * SKYNN_ADVANCED_MODEL remains a global operator override for every task
 * (e.g. pinning everything to one model during an incident, or testing a
 * new model before it's promoted into TASK_MODELS above) — the per-task
 * defaults only apply when it's unset.
 */
export function resolveModelForTask(task: AssessmentTask): string {
  return Deno.env.get("SKYNN_ADVANCED_MODEL") || TASK_MODELS[task];
}
