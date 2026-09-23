import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AssessmentProgress from "./AssessmentProgress";
import QuestionRenderer from "./QuestionRenderer";
import type { AssessmentQuestion, AssessmentSection } from "@/lib/assessment/types";

interface AssessmentFlowProps {
  sections: AssessmentSection[];
  currentSectionId: string | null;
  responses: Record<string, unknown>;
  saving: boolean;
  submitting: boolean;
  onAnswer: (questionId: string, value: unknown) => void;
  onGoToSection: (sectionId: string) => void;
  onSubmit: () => void;
}

const questionApplies = (question: AssessmentQuestion, responses: Record<string, unknown>): boolean => {
  if (!question.showIf) return true;
  const dep = responses[question.showIf.questionId];
  return typeof dep === "string" && question.showIf.oneOf.includes(dep);
};

const isAnswered = (question: AssessmentQuestion, responses: Record<string, unknown>): boolean => {
  const value = responses[question.id];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
};

/** Discover → Prepare → Assess → Analyse → Reveal (section 27) — this
 *  component owns the "Assess" phase: one section per screen, a review
 *  step, then handoff to submit. */
const AssessmentFlow = ({ sections, currentSectionId, responses, saving, submitting, onAnswer, onGoToSection, onSubmit }: AssessmentFlowProps) => {
  const [showReview, setShowReview] = useState(false);
  const currentIndex = sections.findIndex((s) => s.id === currentSectionId);
  const currentSection = sections[currentIndex] ?? sections[0];
  const isLastSection = currentIndex === sections.length - 1;

  const applicableQuestions = useMemo(
    () => currentSection?.questions.filter((q) => questionApplies(q, responses)) ?? [],
    [currentSection, responses],
  );
  const requiredUnanswered = applicableQuestions.filter((q) => q.required && !isAnswered(q, responses));
  // POPIA: SKYNN AI can't process special personal information without
  // explicit consent, so a "decline" answer stops the flow here — before
  // any Analysis Pass could be spent (the submit RPC enforces this too).
  const consentDeclined = applicableQuestions.some((q) => q.id.startsWith("popia_") && responses[q.id] === "decline");
  const canAdvance = requiredUnanswered.length === 0 && !consentDeclined;

  if (!currentSection) return null;

  if (showReview) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-heading font-semibold mb-1">Your Assessment</h2>
          <p className="text-sm text-muted-foreground">Review your answers, then generate your report.</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {sections.map((section) => {
              const sectionAnswered = section.questions.filter((q) => questionApplies(q, responses) && isAnswered(q, responses)).length;
              const sectionApplicable = section.questions.filter((q) => questionApplies(q, responses)).length;
              return (
                <div key={section.id} className="flex items-center justify-between border-b last:border-0 py-2">
                  <span className="text-sm font-medium">{section.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {sectionAnswered}/{sectionApplicable} answered
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => setShowReview(false)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to answers
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="gap-2 flex-1 gradient-border-anim">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate my Advanced Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AssessmentProgress sections={sections} currentSectionId={currentSection.id} responses={responses} />

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-heading font-semibold">{currentSection.title}</h2>
          {currentSection.description && <p className="text-sm text-muted-foreground mt-1">{currentSection.description}</p>}
        </div>

        {applicableQuestions.map((question) => (
          <div key={question.id} className="space-y-3">
            <div>
              <p className="text-sm font-medium">{question.prompt}</p>
              {question.helperText && <p className="text-xs text-muted-foreground mt-1">{question.helperText}</p>}
            </div>
            <QuestionRenderer question={question} value={responses[question.id]} onChange={(v) => onAnswer(question.id, v)} />
          </div>
        ))}
      </div>

      {consentDeclined && (
        <p role="alert" className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          We can only create an Advanced AI Dermatology Report with your consent. You can change your answer above, or
          leave now — no Analysis Pass has been used.
        </p>
      )}

      <div className="flex items-center justify-between mt-10">
        <Button
          variant="ghost"
          disabled={currentIndex === 0}
          onClick={() => onGoToSection(sections[Math.max(0, currentIndex - 1)].id)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <span className="text-xs text-muted-foreground">{saving ? "Saving..." : ""}</span>
        {isLastSection ? (
          <Button disabled={!canAdvance} onClick={() => setShowReview(true)} className="gap-2">
            Review answers
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!canAdvance} onClick={() => onGoToSection(sections[currentIndex + 1].id)} className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentFlow;
