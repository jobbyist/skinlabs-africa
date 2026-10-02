import { ArrowRight, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ChecklistItem, JourneyFacts, JourneyStage, NextBestAction } from "@/lib/journey";

interface JourneyMomentumCardProps {
  stage: JourneyStage;
  facts: JourneyFacts;
  checklist: ChecklistItem[];
  nextAction: NextBestAction;
  onAction: () => void;
  onSeeSteps: () => void;
  actionLoading?: boolean;
}

const STAGE_COPY: Record<JourneyStage, { eyebrow: string; title: string; body: string }> = {
  visitor: { eyebrow: "Your skin journey", title: "Start with what matters to your skin.", body: "A few useful steps are enough to make SkinLabs feel personal from day one." },
  analysed: { eyebrow: "Your skin journey", title: "Your results are ready to become useful.", body: "Save your profile, then turn it into a routine you can actually follow." },
  member: { eyebrow: "Your skin journey", title: "Let’s make SkinLabs yours.", body: "Finish the essentials, then use your free trial when you’re ready for more." },
  trialing: { eyebrow: "Your free trial", title: "Make your trial earn its place.", body: "Your best next move is the one that turns today’s insight into a daily habit." },
  activated: { eyebrow: "You’re getting value", title: "Your skin routine is clicking.", body: "You’ve started using SkinLabs. Keep the momentum going while your full access is active." },
  payment_on_file: { eyebrow: "You’re all set", title: "Your membership is ready to keep working for you.", body: "Stay consistent with your routine and use your skin profile as your home base." },
  paid: { eyebrow: "Your SkinLabs home", title: "Keep your skin journey moving.", body: "Your profile, routine and saved knowledge are all working together now." },
  lapsed: { eyebrow: "Welcome back", title: "Pick your skin journey back up.", body: "Your profile and routine are still here. Continue from where you left off." },
};

const JourneyMomentumCard = ({ stage, facts, checklist, nextAction, onAction, onSeeSteps, actionLoading = false }: JourneyMomentumCardProps) => {
  const done = checklist.filter((item) => item.done).length;
  const total = checklist.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const copy = STAGE_COPY[stage];

  const unlocked = [
    facts.savedAnalyses > 0 ? facts.savedAnalyses + " skin analysis" + (facts.savedAnalyses === 1 ? "" : "es") : null,
    facts.routineSteps > 0 ? facts.routineSteps + " routine step" + (facts.routineSteps === 1 ? "" : "s") : null,
    facts.savedItems > 0 ? facts.savedItems + " saved item" + (facts.savedItems === 1 ? "" : "s") : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-[var(--shadow)]">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.eyebrow}
              </span>
              <span className="text-xs text-muted-foreground">{done}/{total} complete</span>
            </div>

            <div className="mt-4 max-w-2xl">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary-text">{copy.body}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="min-h-11 gap-2" onClick={onAction} disabled={actionLoading}>
                {actionLoading ? "Getting things ready…" : nextAction.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" className="min-h-11 justify-start px-0 text-sm sm:px-3" onClick={onSeeSteps}>
                See your setup
              </Button>
            </div>

            {unlocked.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Your progress so far">
                {unlocked.map((label) => (
                  <span key={label} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-secondary-text">
                    <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-muted/35 p-6 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Setup progress</p>
              <span className="font-heading text-lg font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="mt-3 h-2" aria-label={done + " of " + total + " setup steps complete"} />
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">One useful step at a time</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  SkinLabs gets more helpful as you use it. You do not need to finish everything today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyMomentumCard;
