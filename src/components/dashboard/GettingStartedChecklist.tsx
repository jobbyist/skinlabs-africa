import { Link } from "react-router-dom";
import { BookOpen, CalendarCheck2, Check, ChevronRight, CircleUserRound, LockKeyhole, MapPin, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trackConversionEvent } from "@/lib/analytics-events";
import { openKeepMembership } from "@/lib/conversionDialogs";
import { checklistComplete, type ChecklistItem, type ChecklistItemId } from "@/lib/journey";

interface GettingStartedChecklistProps {
  items: ChecklistItem[];
  /** Switch dashboard tab (routine, security, …) in place. */
  onGoToTab: (tab: string) => void;
  onDismiss: () => Promise<boolean>;
}

const TARGETS: Record<ChecklistItemId, { tab?: string; href?: string; cta: string }> = {
  analysis: { href: "/skynn-ai", cta: "Start analysis" },
  routine: { tab: "routine", cta: "Build routine" },
  weather: { tab: "home", cta: "Choose city" },
  checkins: { tab: "routine", cta: "Check in" },
  content: { href: "/reviews", cta: "Browse reviews" },
  mfa: { tab: "security", cta: "Set up" },
  keep_membership: { cta: "Keep it" },
};

const META: Record<ChecklistItemId, { description: string; icon: typeof Sparkles }> = {
  analysis: { description: "See your skin type, top concerns and the guidance built around them.", icon: Sparkles },
  routine: { description: "Turn your profile into a morning and evening routine you can actually follow.", icon: CircleUserRound },
  weather: { description: "Get daily skincare guidance tuned to the weather where you are.", icon: MapPin },
  checkins: { description: "A couple of check-ins is enough to start building a useful habit.", icon: CalendarCheck2 },
  content: { description: "Learn what ingredients and products can do for your skin before you buy.", icon: BookOpen },
  mfa: { description: "Add a second layer of protection to your SkinLabs account.", icon: ShieldCheck },
  keep_membership: { description: "Keep the full experience going after your trial without losing your profile or routine.", icon: LockKeyhole },
};

const GettingStartedChecklist = ({ items, onGoToTab, onDismiss }: GettingStartedChecklistProps) => {
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const complete = checklistComplete(items);
  const firstIncomplete = items.find((item) => !item.done);

  const act = (item: ChecklistItem) => {
    trackConversionEvent("checklist_step_clicked", { step: item.id });
    if (item.id === "keep_membership") {
      openKeepMembership({ source: "checklist" });
      return;
    }
    if (item.id === "weather") {
      document.getElementById("skin-weather")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const target = TARGETS[item.id];
    if (target.tab) onGoToTab(target.tab);
  };

  const dismiss = async () => {
    const ok = await onDismiss();
    if (ok) trackConversionEvent("checklist_dismissed");
    else toast.error("Couldn’t hide the checklist — try again.");
  };

  const action = (item: ChecklistItem, prominent = false) => {
    const target = TARGETS[item.id];
    const className = prominent
      ? "min-h-10 gap-2"
      : "min-h-9 gap-1.5";
    if (target.href) {
      return (
        <Button asChild size={prominent ? "default" : "sm"} variant={prominent ? "default" : "ghost"} className={className}>
          <Link to={target.href} onClick={() => trackConversionEvent("checklist_step_clicked", { step: item.id })}>
            {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      );
    }
    return (
      <Button
        type="button"
        size={prominent ? "default" : "sm"}
        variant={prominent ? "default" : "ghost"}
        className={className}
        onClick={() => act(item)}
      >
        {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    );
  };

  return (
    <Card id="getting-started" className="scroll-mt-28 overflow-hidden border-border/80 shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-border/70 bg-gradient-to-br from-background to-muted/35 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                First steps
              </span>
              <span className="text-xs text-muted-foreground">{done} of {total} complete</span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl">{complete ? "You’re all set up" : "Getting started"}</CardTitle>
                <CardDescription className="mt-1 max-w-xl text-sm leading-relaxed">
                  {complete ? "Nice work. Your core SkinLabs setup is in place." : "A few small moves make SkinLabs much more useful. Start with one and come back when you’re ready for the next."}
                </CardDescription>
              </div>
              {complete && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Hide the checklist" onClick={() => void dismiss()}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
          <div className="min-w-[180px] sm:pt-1">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="font-heading text-sm text-foreground">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
            </div>
            <Progress value={total > 0 ? (done / total) * 100 : 0} className="mt-2 h-2" aria-label={done + " of " + total + " setup steps complete"} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {!complete && firstIncomplete && (
          <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                {(() => { const Icon = META[firstIncomplete.id].icon; return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-[var(--shadow-xs)]"><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>; })()}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Next up</p>
                  <p className="mt-1 font-medium text-foreground">{firstIncomplete.label}</p>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-secondary-text">{META[firstIncomplete.id].description}</p>
                </div>
              </div>
              <div className="shrink-0">{action(firstIncomplete, true)}</div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2" role="list" aria-label="Getting started steps">
          {items.filter((item) => !item.done).map((item) => {
            const Icon = META[item.id].icon;
            const featured = item.id === firstIncomplete?.id;
            return (
              <div key={item.id} role="listitem" className={"flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between " + (featured ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-background")}>
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/45 text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{META[item.id].description}</p>
                  </div>
                </div>
                <div className="sm:shrink-0">{featured ? null : action(item)}</div>
              </div>
            );
          })}
        </div>

        {done > 0 && (
          <details className="mt-5 rounded-2xl border border-border bg-background">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {done} completed {done === 1 ? "step" : "steps"}
              </span>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <ul className="space-y-3">
                {items.filter((item) => item.done).map((item) => {
                  const Icon = META[item.id].icon;
                  return (
                    <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                      <span>{item.label}</span>
                      <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default GettingStartedChecklist;
