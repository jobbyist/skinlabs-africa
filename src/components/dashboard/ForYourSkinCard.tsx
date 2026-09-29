import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartRoutine } from "@/hooks/use-smart-routine";
import { buildSmartRoutine } from "@/lib/smartRoutine/engine";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { ADVANCED_NAME, BASIC_NAME, SKYNN_ADVANCED_ROUTE } from "@/lib/skynn/terminology";

/**
 * Dashboard Home, personalised from the member's own submissions (never from
 * analytics): today's Smart Routine when they have one, otherwise a few
 * reviewed products picked for their skin plus the route to a Smart Routine.
 * Renders nothing until there's at least one saved analysis.
 */
const ForYourSkinCard = ({ onOpenRoutine }: { onOpenRoutine: () => void }) => {
  const { access, saved, profile, sources, loading } = useSmartRoutine({ withReport: false });
  const viewed = useRef(false);

  const picks = useMemo(() => {
    if (!profile || saved) return [];
    const routine = buildSmartRoutine(profile);
    const seen = new Set<string>();
    return [...routine.am, ...routine.pm].filter((s) => {
      if (!s.productSlug || seen.has(s.productSlug)) return false;
      seen.add(s.productSlug);
      return true;
    }).slice(0, 3);
  }, [profile, saved]);

  const hasAny = Boolean(sources?.basic || sources?.advanced);

  useEffect(() => {
    if (loading || viewed.current || !hasAny) return;
    viewed.current = true;
    trackSkynnEvent("skynn_recommendation_viewed", { source: saved ? "home_smart_routine" : "home_picks", count: picks.length });
  }, [loading, hasAny, saved, picks.length]);

  if (loading || !hasAny) return null;

  if (saved) {
    const { am, pm } = saved.routine;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Today&apos;s Smart Routine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <p className="flex items-start gap-2"><Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{am.map((s) => s.step).join(" → ")}</p>
            <p className="flex items-start gap-2"><Moon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{pm.map((s) => s.step).join(" → ")}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={onOpenRoutine}>
            Check in <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Picked for your skin</CardTitle>
        <CardDescription>
          From SkinLabs&apos; reviews, matched to your {sources?.advanced ? `${BASIC_NAME} and ${ADVANCED_NAME} answers` : BASIC_NAME}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {picks.length > 0 ? (
          <ul className="space-y-2">
            {picks.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.productName}</p>
                  <p className="text-xs text-muted-foreground">{s.productType}</p>
                </div>
                <Link
                  to={`/reviews/${s.productSlug}`}
                  className="shrink-0 text-xs underline underline-offset-2"
                  onClick={() => trackSkynnEvent("skynn_recommendation_clicked", { source: "home_picks" })}
                >
                  Read review
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">We couldn&apos;t match a reviewed product to your answers yet.</p>
        )}
        {access ? (
          <Button size="sm" className="gap-2" onClick={onOpenRoutine}>
            <Sparkles className="h-3.5 w-3.5" /> Build my Smart Routine
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Want a full morning and evening routine with a weekly plan?{" "}
            <Link to={SKYNN_ADVANCED_ROUTE} className="underline underline-offset-2">Smart Routines come with the {ADVANCED_NAME}</Link>.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ForYourSkinCard;
