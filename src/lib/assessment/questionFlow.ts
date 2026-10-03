import type { AssessmentQuestion, AssessmentSection } from "./types";

/**
 * One-question-per-screen navigation for the Advanced AI Dermatology Analysis.
 * Pure (tested in src/lib/__tests__/questionFlow.test.ts). The section stays the
 * server's resume unit (`current_section_id`); the question position inside it
 * is UI state derived from the answers.
 */
export interface FlowStep {
  sectionId: string;
  sectionTitle: string;
  sectionDescription?: string;
  question: AssessmentQuestion;
}

export const questionApplies = (question: AssessmentQuestion, responses: Record<string, unknown>): boolean => {
  if (!question.showIf) return true;
  const dep = responses[question.showIf.questionId];
  return typeof dep === "string" && question.showIf.oneOf.includes(dep);
};

export const isAnswered = (question: AssessmentQuestion, responses: Record<string, unknown>): boolean => {
  const value = responses[question.id];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
};

/** POPIA: a "decline" on any consent question stops the flow before a Pass can be spent. */
export const isConsentDecline = (question: AssessmentQuestion, value: unknown): boolean =>
  question.id.startsWith("popia_") && value === "decline";

/** Every question that applies under the current answers, in definition order. */
export const flattenApplicableQuestions = (sections: AssessmentSection[], responses: Record<string, unknown>): FlowStep[] =>
  sections.flatMap((section) =>
    section.questions
      .filter((q) => questionApplies(q, responses))
      .map((question) => ({ sectionId: section.id, sectionTitle: section.title, sectionDescription: section.description, question })),
  );

/** Whether the visitor may move past this question. */
export const isAnswerValid = (question: AssessmentQuestion, value: unknown): boolean => {
  if (isConsentDecline(question, value)) return false;
  if (question.type === "multi_select" && Array.isArray(value) && value.length > 0) {
    if (question.minSelections && value.length < question.minSelections) return false;
    if (question.maxSelections && value.length > question.maxSelections) return false;
  }
  if (!question.required) return true;
  return isAnswered(question, { [question.id]: value });
};

/**
 * Where to land when the flow opens: the first unanswered required question of
 * the saved section (or of the whole flow when no section is saved), falling
 * back to that section's first question.
 */
export const initialQuestionIndex = (steps: FlowStep[], currentSectionId: string | null, responses: Record<string, unknown>): number => {
  if (steps.length === 0) return 0;
  const sectionStart = currentSectionId ? steps.findIndex((s) => s.sectionId === currentSectionId) : 0;
  const start = sectionStart < 0 ? 0 : sectionStart;
  for (let i = start; i < steps.length; i++) {
    if (currentSectionId && steps[i].sectionId !== currentSectionId) break;
    const q = steps[i].question;
    if (!isAnswerValid(q, responses[q.id]) || (q.required && !isAnswered(q, responses))) return i;
  }
  return start;
};

/** Sections whose introduction must sit above every one of their questions. */
const ALWAYS_INTRODUCED_SECTIONS = new Set(["consent", "safety_screening"]);

/**
 * Whether a question screen shows its section's own title and description
 * (verbatim from the definition): on the first question of every section, and
 * on every consent and safety question, so neither is ever asked without it.
 */
export const showsSectionIntro = (steps: FlowStep[], index: number): boolean => {
  const step = steps[index];
  if (!step) return false;
  if (ALWAYS_INTRODUCED_SECTIONS.has(step.sectionId) || step.question.id.startsWith("popia_")) return true;
  return index === 0 || steps[index - 1].sectionId !== step.sectionId;
};
