import { Link } from "react-router-dom";
import { Check, ChevronRight, X } from "lucide-react";
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

/** Where each step's action goes. `tab` stays on the dashboard; `href` navigates. */
const TARGETS: Record<ChecklistItemId, { tab?: string; href?: string; cta: string }> = {
  analysis: { href: "/skynn-ai", cta: "Start" },
  routine: { tab: "routine", cta: "Add steps" },
  weather: { tab: "home", cta: "Choose city" },
  checkins: { tab: "routine", cta: "Check in" },
  content: { href: "/reviews", cta: "Browse reviews" },
  mfa: { tab: "security", cta: "Set up" },
  keep_membership: { cta: "Keep it" },
};

/**
 * Getting Started: six first-week habits plus, for an activated trialist with
 * no payment method, "Keep my membership". Completion comes from real data
 * (useJourney), never a local tick. Dismissible only once everything is done.
 */
const GettingStartedChecklist = ({ items, onGoToTab, onDismiss }: GettingStartedChecklistProps) => {
  const done = items.filter((i) => i.done).length;
  const complete = checklistComplete(items);

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
    else toast.error("Couldn't hide the checklist — try again.");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{complete ? "You're all set up" : "Getting started"}</CardTitle>
            <CardDescription>
              {complete ? "Nice work. Everything's in place." : `${done} of ${items.length} done — small habits that make SkinLabs work for your skin.`}
            </CardDescription>
          </div>
          {complete && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Hide the checklist" onClick={() => void dismiss()}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <Progress value={(done / items.length) * 100} className="mt-3 h-1.5" aria-label={`${done} of ${items.length} steps done`} />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const target = TARGETS[item.id];
            return (
              <li key={item.id} className="flex min-h-12 items-center gap-3 py-2">
                <span
                  className={
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border " +
                    (item.done ? "border-primary bg-primary text-primary-foreground" : "border-border")
                  }
                  aria-hidden="true"
                >
                  {item.done && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={"flex-1 text-sm " + (item.done ? "text-muted-foreground line-through" : "text-foreground")}>
                  {item.label}
                  <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                </span>
                {!item.done &&
                  (target.href ? (
                    <Button asChild variant="ghost" size="sm" className="h-9 gap-1 text-primary">
                      <Link to={target.href} onClick={() => trackConversionEvent("checklist_step_clicked", { step: item.id })}>
                        {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-9 gap-1 text-primary" onClick={() => act(item)}>
                      {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default GettingStartedChecklist;
