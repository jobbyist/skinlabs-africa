import type { AssessmentSection } from "@/lib/assessment/types";
import { computeAssessmentCompleteness } from "@/lib/assessment/completeness";

interface AssessmentProgressProps {
  sections: AssessmentSection[];
  currentSectionId: string | null;
  responses: Record<string, unknown>;
}

/**
 * Named per-section progress rather than a generic "Question 7 of 30"
 * (section 29) — each bar fills as that section's own required questions
 * get answered, so the visitor can see which part of their profile is
 * still incomplete at a glance.
 */
const AssessmentProgress = ({ sections, currentSectionId, responses }: AssessmentProgressProps) => (
  <div className="space-y-3 mb-8">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your Skin Profile</p>
    <div className="space-y-2.5">
      {sections.map((section) => {
        const pct = computeAssessmentCompleteness([section], responses);
        const isCurrent = section.id === currentSectionId;
        return (
          <div key={section.id} className="flex items-center gap-3">
            <span className={"text-xs w-40 shrink-0 truncate " + (isCurrent ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {section.title}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className={"h-full rounded-full transition-all " + (pct >= 100 ? "bg-primary" : "gradient-bg-soft")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default AssessmentProgress;
