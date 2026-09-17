/**
 * Turns a session's flat `responses` (question_id -> answer) plus its
 * pinned assessment_definition into the structured shapes the rest of the
 * pipeline needs: NormalizedAssessment (grouped by section, for the Claude
 * prompt), a RoutineContext (for both the prompt and the future Smart
 * Routines handoff), and the evidence topic tags used to select relevant
 * advanced_assessment_evidence rows. Pure and Deno/Bun-portable.
 */
import type { NormalizedAssessment, RoutineContext } from "./types.ts";

export interface DefinitionQuestion {
  id: string;
  [key: string]: unknown;
}
export interface DefinitionSection {
  id: string;
  questions: DefinitionQuestion[];
}

export function normalizeAssessment(
  sections: DefinitionSection[],
  responses: Record<string, unknown>,
  assessmentVersion: string,
): NormalizedAssessment {
  const grouped: Record<string, Record<string, unknown>> = {};
  for (const section of sections) {
    const sectionAnswers: Record<string, unknown> = {};
    for (const question of section.questions) {
      if (Object.prototype.hasOwnProperty.call(responses, question.id)) {
        sectionAnswers[question.id] = responses[question.id];
      }
    }
    if (Object.keys(sectionAnswers).length > 0) {
      grouped[section.id] = sectionAnswers;
    }
  }
  return { assessmentVersion, sections: grouped };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function extractRoutineContext(responses: Record<string, unknown>): RoutineContext {
  return {
    amSteps: asStringArray(responses["am_steps"]),
    pmSteps: asStringArray(responses["pm_steps"]),
    activesInUse: asStringArray(responses["actives_in_use"]),
  };
}

/** Topic tags used to select advanced_assessment_evidence rows — directly
 *  the respondent's own concern/active values, so a future evidence row
 *  just needs a matching topic_tags entry to become citable for that
 *  respondent. No inference beyond what they actually selected. */
export function deriveEvidenceTopics(responses: Record<string, unknown>): string[] {
  return [
    ...asStringArray(responses["primary_concerns"]),
    ...asStringArray(responses["actives_in_use"]),
    ...asStringArray(responses["skin_characteristics"]),
  ];
}
