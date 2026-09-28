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
  <li className="rounded-xl border border-border bg-background px-3 py-2.5">
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-medium text-foreground">{step.step}</p>
      {step.fromShelf && <Badge variant="secondary" className="text-[10px]">From your shelf</Badge>}
    </div>
    <p className="text-xs text-muted-foreground mt-0.5">
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
    <p className="text-xs text-foreground/80 mt-1.5">{step.guidance}</p>
    <p className="text-[11px] text-muted-foreground mt-1">Why: {step.why}.</p>
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
  const { access, saved, preview, stale, loading, building, error, build } = useSmartRoutine();
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
            Smart Routines come with the {ADVANCED_NAME}. Once you&apos;ve submitted yours, we build a morning and evening
            routine from your {BASIC_NAME} and Advanced answers, with products SkinLabs has reviewed, a weekly plan and
            notes for your climate and the season.
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
            Built from your {BASIC_NAME} and your {ADVANCED_NAME} answers
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
    <Card className="border-primary/30">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Your Smart Routine
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {saved?.source === "advanced_report" ? "From your approved Advanced report" : "Rule-based from your answers"}
          </Badge>
        </div>
        <CardDescription>
          {saved?.source === "advanced_report"
            ? `Steps from your ${ADVANCED_NAME} report, matched to products SkinLabs has reviewed.`
            : `Built from your ${BASIC_NAME} and ${ADVANCED_NAME} answers. It will update from your report once that's released.`}
        </CardDescription>
        {stale && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground flex-1 min-w-[12rem]">
              You have a newer analysis{saved?.source === "rule_based" && preview?.source === "advanced_report" ? " and your report is released" : ""}. Update your routine to use it.
            </p>
            <Button size="sm" variant="outline" onClick={() => void handleBuild()} disabled={building} className="gap-2">
              {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Update my routine
            </Button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Sun className="h-4 w-4 text-amber-500" /> Morning</p>
            <ol className="space-y-2">{routine.am.map((s) => <StepItem key={s.key} step={s} />)}</ol>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Moon className="h-4 w-4 text-indigo-500" /> Evening</p>
            <ol className="space-y-2">{routine.pm.map((s) => <StepItem key={s.key} step={s} />)}</ol>
          </div>
        </div>

        {routine.weekly.some((d) => d.pm.length > 2) && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CalendarDays className="h-4 w-4" /> Your week (evenings)</p>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {routine.weekly.map((d) => {
                const extras = d.pm.filter((x) => x !== "Cleanse" && x !== "Moisturise");
                return (
                  <div key={d.day} className="rounded-lg border border-border p-1.5">
                    <p className="text-[11px] font-medium">{d.day}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {extras.length ? extras.map((x) => (x.startsWith("Exfoliate") ? "Exfoliate" : x)).join(" + ") : "Basics"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {routine.notes.length > 0 && (
          <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
            {routine.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}

        {grounded && <ConflictMatcherPanel routine={grounded} />}
      </CardContent>
    </Card>
  );
};

export default SmartRoutinePanel;
