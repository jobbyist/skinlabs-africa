import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionRenderer from "./QuestionRenderer";
import QuestionShell from "./QuestionShell";
import type { AssessmentQuestion, AssessmentSection } from "@/lib/assessment/types";
import {
  flattenApplicableQuestions,
  initialQuestionIndex,
  isAnswerValid,
  isAnswered,
  isConsentDecline,
  questionApplies,
} from "@/lib/assessment/questionFlow";

interface AssessmentFlowProps {
  sections: AssessmentSection[];
  currentSectionId: string | null;
  responses: Record<string, unknown>;
  saving: boolean;
  submitting: boolean;
  onAnswer: (questionId: string, value: unknown) => void;
  onGoToSection: (sectionId: string) => void;
  onSubmit: () => void;
  /** Back from the first question (returns to the intro). */
  onExit?: () => void;
  /** Pre-approval intake mode submits a request rather than generating a
   *  report, so the final step must say so. */
  intakeMode?: boolean;
  /** Questions suggested from the member's Basic AI Skin Analysis. */
  isPrefilled?: (questionId: string) => boolean;
  /** Shown once, above the first suggested answer, when the session started from a Basic analysis. */
  prefillNote?: string | null;
}

/** A tap on one of these answers moves on by itself. */
const autoAdvances = (question: AssessmentQuestion) =>
  question.id === "mst_tone" || question.type === "single_select" || question.type === "frequency";
const AUTO_ADVANCE_MS = 300;

/**
 * The "Assess" phase: one question per screen (applicable questions only,
 * across every section), then a review step and the hand-off to submit. The
 * section stays the server's resume point, so crossing a section boundary
 * calls `onGoToSection`.
 */
const AssessmentFlow = ({
  sections,
  currentSectionId,
  responses,
  saving,
  submitting,
  onAnswer,
  onGoToSection,
  onSubmit,
  onExit,
  intakeMode = false,
  isPrefilled,
  prefillNote,
}: AssessmentFlowProps) => {
  const steps = useMemo(() => flattenApplicableQuestions(sections, responses), [sections, responses]);
  const [currentId, setCurrentId] = useState<string | null>(
    () => steps[initialQuestionIndex(steps, currentSectionId, responses)]?.question.id ?? null,
  );
  const [showReview, setShowReview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const foundIndex = steps.findIndex((s) => s.question.id === currentId);
  const index = foundIndex < 0 ? 0 : foundIndex;
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const goTo = useCallback(
    (nextId: string, sectionId: string) => {
      clearTimer();
      setCurrentId(nextId);
      if (sectionId !== currentSectionId) onGoToSection(sectionId);
    },
    [currentSectionId, onGoToSection],
  );

  const goNext = () => {
    if (isLast) {
      clearTimer();
      setShowReview(true);
      return;
    }
    const next = steps[index + 1];
    goTo(next.question.id, next.sectionId);
  };

  const goBack = () => {
    if (index === 0) {
      clearTimer();
      onExit?.();
      return;
    }
    const prev = steps[index - 1];
    goTo(prev.question.id, prev.sectionId);
  };

  const answer = (question: AssessmentQuestion, value: unknown) => {
    clearTimer();
    onAnswer(question.id, value);
    if (!autoAdvances(question) || !isAnswerValid(question, value)) return;
    // The answer can reveal a follow-up question, so work out "next" from the new answers.
    const nextSteps = flattenApplicableQuestions(sections, { ...responses, [question.id]: value });
    const here = nextSteps.findIndex((s) => s.question.id === question.id);
    const next = nextSteps[here + 1];
    if (!next) return; // the last question waits for "Review answers"
    timer.current = setTimeout(() => goTo(next.question.id, next.sectionId), AUTO_ADVANCE_MS);
  };

  if (!step) return null;

  if (showReview) {
    const firstIncomplete = steps.find((s) => s.question.required && !isAnswerValid(s.question, responses[s.question.id]));
    return (
      <div className="mx-auto max-w-xl space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Almost done</p>
          <h2 className="mt-2 font-heading text-2xl font-bold">Your answers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {intakeMode ? "Check each section, then submit your request." : "Check each section, then generate your report."}
          </p>
        </div>
        <ul className="divide-y divide-border rounded-3xl border-2 border-border bg-card">
          {sections.map((section) => {
            const applicable = section.questions.filter((q) => questionApplies(q, responses));
            if (applicable.length === 0) return null;
            const answered = applicable.filter((q) => isAnswered(q, responses)).length;
            const first = applicable[0];
            return (
              <li key={section.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{section.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {answered}/{applicable.length} answered
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  aria-label={`Edit ${section.title}`}
                  onClick={() => {
                    setShowReview(false);
                    goTo(first.id, section.id);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </li>
            );
          })}
        </ul>
        {firstIncomplete && (
          <p role="alert" className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
            A required question still needs an answer.{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => {
                setShowReview(false);
                goTo(firstIncomplete.question.id, firstIncomplete.sectionId);
              }}
            >
              Go to it
            </button>
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => setShowReview(false)} className="h-12 gap-2 rounded-full">
            <ArrowLeft className="h-4 w-4" />
            Back to answers
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !!firstIncomplete}
            className="h-12 flex-1 gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 font-semibold text-white hover:from-blue-600 hover:to-sky-400"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {intakeMode ? "Submit my request" : "Generate my Advanced AI Dermatology Analysis report"}
          </Button>
        </div>
      </div>
    );
  }

  const { question } = step;
  const value = responses[question.id];
  const canAdvance = isAnswerValid(question, value);
  const declined = isConsentDecline(question, value);
  const firstPrefilledId = isPrefilled ? steps.find((s) => isPrefilled(s.question.id))?.question.id : undefined;

  return (
    <QuestionShell
      position={index + 1}
      total={steps.length}
      sectionTitle={step.sectionTitle}
      onBack={index === 0 && !onExit ? undefined : goBack}
      backLabel={index === 0 ? "Back to the introduction" : "Previous question"}
      saving={saving}
      stepKey={question.id}
      footer={
        <Button
          onClick={goNext}
          disabled={!canAdvance}
          className="h-14 w-full gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-sky-400 disabled:shadow-none"
        >
          {isLast ? "Review answers" : "Continue"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      }
    >
      {prefillNote && question.id === firstPrefilledId && (
        <p className="mb-5 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{prefillNote}</p>
      )}
      <h2 className="text-balance font-heading text-2xl font-semibold leading-tight sm:text-[1.75rem]">{question.prompt}</h2>
      {isPrefilled?.(question.id) && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          From your Basic AI Skin Analysis — check it still fits
        </p>
      )}
      {!question.required && <p className="mt-2 text-sm text-muted-foreground">Optional</p>}
      <div className="mt-7">
        <QuestionRenderer question={question} value={value} onChange={(v) => answer(question, v)} />
      </div>
      {question.helperText && <p className="mx-auto mt-6 max-w-md text-pretty text-center text-sm text-muted-foreground">{question.helperText}</p>}
      {declined && (
        <p role="alert" className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          We can only accept an Advanced AI Dermatology Analysis submission with your consent. You can change your answer above, or leave
          now — no Analysis Pass has been used.
        </p>
      )}
    </QuestionShell>
  );
};

export default AssessmentFlow;
