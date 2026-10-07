import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, BookOpen, CalendarCheck2, Check, ChevronRight, CircleUserRound, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackConversionEvent } from "@/lib/analytics-events";
import ReminderOptIn from "@/components/pwa/ReminderOptIn";
import { checklistComplete, type ChecklistItem, type ChecklistItemId } from "@/lib/journey";

interface GettingStartedChecklistProps {
  items: ChecklistItem[];
  /** Switch dashboard tab (routine, security, …) in place. */
  onGoToTab: (tab: string) => void;
  onDismiss: () => Promise<boolean>;
  /** Needed for the inline reminders step. */
  userId?: string;
  /** Re-read the facts after an inline step (reminders) succeeds. */
  onChanged?: () => void;
  /** Destination of the dashboard's primary action; a step that leads there shows "Up next" instead of a second button. */
  primaryHref?: string | null;
}

const TARGETS: Record<ChecklistItemId, { tab?: string; href?: string; cta: string }> = {
  analysis: { href: "/skynn-ai", cta: "Start analysis" },
  routine: { tab: "routine", cta: "Build routine" },
  weather: { tab: "home", cta: "Choose city" },
  checkins: { tab: "routine", cta: "Check in" },
  reminders: { cta: "Set up" },
  content: { href: "/reviews", cta: "Browse reviews" },
  mfa: { tab: "security", cta: "Set up" },
};

const META: Record<ChecklistItemId, { description: string; icon: typeof Sparkles }> = {
  analysis: { description: "See your skin type, top concerns and the guidance built around them.", icon: Sparkles },
  routine: { description: "Turn your profile into a morning and evening routine you can actually follow.", icon: CircleUserRound },
  weather: { description: "Get daily skincare guidance tuned to the weather where you are.", icon: MapPin },
  checkins: { description: "A couple of check-ins is enough to start building a useful habit.", icon: CalendarCheck2 },
  reminders: { description: "A short nudge at your routine time, only on days you haven’t checked in yet.", icon: BellRing },
  content: { description: "Learn what ingredients and products can do for your skin before you buy.", icon: BookOpen },
  mfa: { description: "Add a second layer of protection to your SkinLabs account.", icon: ShieldCheck },
};

const GettingStartedChecklist = ({ items, onGoToTab, onDismiss, userId, onChanged, primaryHref }: GettingStartedChecklistProps) => {
  const [remindersOpen, setRemindersOpen] = useState(false);
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const complete = checklistComplete(items);

  // Getting Started exists only while it is useful: once every step is done it retires itself.
  const retired = useRef(false);
  useEffect(() => {
    if (!complete || retired.current) return;
    retired.current = true;
    void onDismiss().then((ok) => {
      if (ok) trackConversionEvent("checklist_dismissed", { reason: "completed" });
    });
  }, [complete, onDismiss]);

  const act = (item: ChecklistItem) => {
    trackConversionEvent("checklist_step_clicked", { step: item.id });
    if (item.id === "reminders") {
      setRemindersOpen(true);
      return;
    }
    if (item.id === "weather") {
      document.getElementById("skin-weather")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const target = TARGETS[item.id];
    if (target.tab) {
      onGoToTab(target.tab);
      // The section swaps in place, so bring it into view or the click looks like a no-op.
      window.setTimeout(() => {
        const el = document.getElementById(item.id === "routine" || item.id === "checkins" ? "routine-tracker" : "");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }, 150);
    }
  };

  const open = items.filter((item) => !item.done);
  if (complete) return null;

  const action = (item: ChecklistItem) => {
    const target = TARGETS[item.id];
    const href = target.href ?? (target.tab ? `/dashboard?tab=${target.tab}` : null);
    if (primaryHref && href === primaryHref) return <span className="text-xs font-medium text-muted-foreground">Up next</span>;
    if (target.href) {
      return (
        <Button asChild size="sm" variant="ghost" className="min-h-9 gap-1.5">
          <Link to={target.href} onClick={() => trackConversionEvent("checklist_step_clicked", { step: item.id })}>
            {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      );
    }
    return (
      <Button type="button" size="sm" variant="ghost" className="min-h-9 gap-1.5" onClick={() => act(item)}>
        {target.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    );
  };

  return (
    <Card id="getting-started" className="scroll-mt-28">
      <CardHeader className="flex-row items-baseline justify-between gap-3 space-y-0 p-5 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-base">Getting started</CardTitle>
        <span className="text-xs text-muted-foreground">{done} of {total} done</span>
      </CardHeader>

      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        {remindersOpen && userId && items.some((i) => i.id === "reminders" && !i.done) && (
          <div className="mb-3" onClickCapture={() => onChanged && window.setTimeout(onChanged, 1500)}>
            <ReminderOptIn surface="checklist" userId={userId} />
          </div>
        )}

        <ul className="divide-y divide-border" aria-label="Getting started steps">
          {open.map((item) => {
            const Icon = META[item.id].icon;
            return (
              <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{META[item.id].description}</p>
                  </div>
                </div>
                <div className="pl-7 sm:shrink-0 sm:pl-0">{action(item)}</div>
              </li>
            );
          })}
        </ul>

        {done > 0 && (
          <details className="mt-2 rounded-xl border border-border">
            <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {done} completed {done === 1 ? "step" : "steps"}
              </span>
            </summary>
            <ul className="space-y-2 border-t border-border px-4 py-3">
              {items.filter((item) => item.done).map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{item.label}</span>
                  <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default GettingStartedChecklist;
