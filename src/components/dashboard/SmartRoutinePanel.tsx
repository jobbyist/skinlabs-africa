import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Loader2, Lock, Moon, RefreshCw, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConflictMatcherPanel from "@/components/dashboard/ConflictMatcherPanel";
import { productReviews } from "@/data/reviews";
import { useSmartRoutine } from "@/hooks/use-smart-routine";
import type { SmartStep } from "@/lib/smartRoutine/engine";
import type { GroundedRoutine } from "@/lib/skynnProductMatch";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { ADVANCED_NAME, BASIC_NAME, SKYNN_ADVANCED_ROUTE } from "@/lib/skynn/terminology";

const StepItem = ({ step }: { step: SmartStep }) => (
  <li className="min-w-0 rounded-2xl border border-border bg-background p-3 sm:p-3.5">
    <div className="flex min-w-0 flex-wrap items-start gap-2">
      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-foreground">{step.step}</p>
      {step.fromShelf && <Badge variant="secondary" className="text-[10px]">From your shelf</Badge>}
    </div>
    <p className="mt-1 min-w-0 break-words text-xs leading-snug text-muted-foreground">
      {step.productSlug && step.productName ? (
        <Link
          to={`/reviews/${step.productSlug}`}
          className="underline underline-offset-2"
          onClick={() => trackSkynnEvent("skynn_recommendation_clicked", { source: "smart_routine" })}
        >
          {step.productName}
        </Link>
      ) : (
        step.productType
      )}
    </p>
    <p className="mt-2 break-words text-xs leading-relaxed text-foreground/80">{step.guidance}</p>
    <p className="mt-2 break-words text-[11px] leading-snug text-muted-foreground">Why: {step.why}.</p>
  </li>
);

/** Rebuilds a GroundedRoutine from the saved steps so the Conflict Matcher can check it. */
const toGrounded = (am: SmartStep[], pm: SmartStep[]): GroundedRoutine | null => {
  const toPicks = (steps: SmartStep[]) =>
    steps.flatMap((s) => {
      const product = s.productSlug ? productReviews.find((p) => p.id === s.productSlug) : undefined;
      return product ? [{ slot: s.step, product }] : [];
    });
  const routine = { am: toPicks(am), pm: toPicks(pm), matchStats: { matched: 0, attempted: 0 } };
  return routine.am.length + routine.pm.length > 0 ? routine : null;
};

/**
 * Smart Routines, inside My Skin › Routine. An extension of the Advanced AI
 * Dermatology Analysis: unlocked once the member has submitted one, built
 * from their Basic + Advanced answers (rule-based) and replaced by the
 * approved report's own steps when that's released. Saving puts the steps in
 * the tracker below so check-ins and streaks work as before.
 */
const SmartRoutinePanel = ({ onSaved }: { onSaved?: () => void }) => {
  const { access, saved, preview, stale, sources, loading, building, error, build } = useSmartRoutine();
  const viewed = useRef(false);

  useEffect(() => {
    if (loading || viewed.current || access === null) return;
    viewed.current = true;
    trackSkynnEvent(access ? "skynn_smart_routine_viewed" : "skynn_smart_routine_locked_viewed", {
      source: "dashboard",
      ...(saved ? { routine_source: saved.source } : {}),
    });
  }, [loading, access, saved]);

  const routine = saved?.routine ?? null;
  const grounded = useMemo(() => (routine ? toGrounded(routine.am, routine.pm) : null), [routine]);

  const handleBuild = async () => {
    const ok = await build();
    if (ok) {
      toast.success("Your Smart Routine is saved. Tick off each step below.");
      onSaved?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!access) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" /> Smart Routine
          </CardTitle>
          <CardDescription>
            Smart Routines are free with your {BASIC_NAME}. Save one and we build a morning and evening routine from
            your answers, with products SkinLabs has reviewed, a weekly plan and notes for your climate and the season.
            An optional {ADVANCED_NAME} adds the products you own and ingredients you avoid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" className="gap-2">
            <Link to={SKYNN_ADVANCED_ROUTE}>
              <Sparkles className="h-3.5 w-3.5" /> Start my {ADVANCED_NAME}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!routine) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Your Smart Routine is ready to build
          </CardTitle>
          <CardDescription>
            Built from your {BASIC_NAME}{sources?.advanced ? ` and your ${ADVANCED_NAME} answers` : ""}
            {preview ? ` — ${preview.am.length} morning and ${preview.pm.length} evening steps` : ""}. It replaces the
            starter steps below; anything you added yourself stays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => void handleBuild()} disabled={building || !preview} className="gap-2">
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Build my Smart Routine
          </Button>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <CardTitle className="min-w-0 flex items-start gap-2 text-base leading-snug">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">Your Smart Routine</span>
          </CardTitle>
          <Badge variant="outline" className="max-w-full justify-self-start whitespace-normal text-left text-[10px] leading-tight sm:justify-self-end">
            {saved?.source === "advanced_report" ? "From your approved Advanced report" : "Rule-based from your answers"}
          </Badge>
        </div>
        <CardDescription className="max-w-2xl leading-relaxed">
          {saved?.source === "advanced_report"
            ? `Steps from your ${ADVANCED_NAME} report, matched to products SkinLabs has reviewed.`
            : `Built from your ${BASIC_NAME} and ${ADVANCED_NAME} answers. It will update from your report once that's released.`}
        </CardDescription>
        {stale && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 break-words text-xs leading-relaxed text-muted-foreground">
              You have a newer analysis{saved?.source === "rule_based" && preview?.source === "advanced_report" ? " and your report is released" : ""}. Update your routine to use it.
            </p>
            <Button size="sm" variant="outline" onClick={() => void handleBuild()} disabled={building} className="w-full shrink-0 gap-2 sm:w-auto">
              {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Update my routine
            </Button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2 md:gap-4">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Sun className="h-4 w-4 shrink-0 text-amber-500" /> Morning</p>
            <ol className="space-y-2.5">{routine.am.map((s) => <StepItem key={s.key} step={s} />)}</ol>
          </div>
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Moon className="h-4 w-4 shrink-0 text-indigo-500" /> Evening</p>
            <ol className="space-y-2.5">{routine.pm.map((s) => <StepItem key={s.key} step={s} />)}</ol>
          </div>
        </div>

        {routine.weekly.some((d) => d.pm.length > 2) && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CalendarDays className="h-4 w-4" /> Your week (evenings)</p>
            <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-4 md:grid-cols-7">
              {routine.weekly.map((d) => {
                const extras = d.pm.filter((x) => x !== "Cleanse" && x !== "Moisturise");
                return (
                  <div key={d.day} className="flex min-h-16 min-w-0 flex-col rounded-xl border border-border p-2 sm:p-2.5">
                    <p className="text-xs font-semibold leading-tight">{d.day}</p>
                    <p className="mt-1 min-w-0 break-words text-[11px] leading-snug text-muted-foreground">
                      {extras.length ? extras.map((x) => (x.startsWith("Exfoliate") ? "Exfoliate" : x)).join(" + ") : "Basics"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {routine.notes.length > 0 && (
          <ul className="space-y-2 break-words pl-4 text-xs leading-relaxed text-muted-foreground list-disc">
            {routine.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}

        {grounded && <ConflictMatcherPanel routine={grounded} />}
      </CardContent>
    </Card>
  );
};

export default SmartRoutinePanel;
