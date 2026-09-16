/**
 * Client-side mirror of public.compute_assessment_completeness() (see
 * supabase/migrations/20260916164921_advanced_assessment_engine_core.sql)
 * — used only for the progress-bar UI so it updates instantly on each
 * answer without waiting for the autosave round-trip. Never the source of
 * truth for gating submission: the edge function always recomputes and
 * enforces completeness server-side before consuming a pass or generating a
 * report, exactly because a client-side number can't be trusted for that.
 * Keep this in sync with the SQL function if either changes.
 */
import type { AssessmentSection } from "./types";

export function computeAssessmentCompleteness(sections: AssessmentSection[], responses: Record<string, unknown>): number {
  let total = 0;
  let answered = 0;

  for (const section of sections) {
    for (const question of section.questions) {
      if (!question.required) continue;

      if (question.showIf) {
        const dependencyAnswer = responses[question.showIf.questionId];
        if (typeof dependencyAnswer !== "string" || !question.showIf.oneOf.includes(dependencyAnswer)) continue;
      }

      total += 1;
      const answer = responses[question.id];
      if (Array.isArray(answer)) {
        if (answer.length > 0) answered += 1;
      } else if (typeof answer === "string") {
        if (answer.trim().length > 0) answered += 1;
      } else if (answer !== undefined && answer !== null) {
        answered += 1;
      }
    }
  }

  if (total === 0) return 100;
  return Math.floor((answered / total) * 100);
}
