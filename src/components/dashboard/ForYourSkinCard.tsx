import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Moon, Sparkles, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartRoutine } from "@/hooks/use-smart-routine";
import { buildSmartRoutine } from "@/lib/smartRoutine/engine";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { ADVANCED_NAME, BASIC_NAME } from "@/lib/skynn/terminology";

/**
 * Dashboard Home, personalised from the member's own submissions (never from
 * analytics): today's Smart Routine when they have one, otherwise a few
 * reviewed products picked for their skin. Informational: building or checking
 * in on a routine is the next-action card's job. Renders nothing until there's
 * at least one saved analysis.
 */
const ForYourSkinCard = ({ onOpenRoutine }: { onOpenRoutine: () => void }) => {
  const { saved, profile, sources, loading } = useSmartRoutine({ withReport: false });
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
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <CardTitle className="min-w-0 flex items-start gap-2 text-base leading-snug"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span className="min-w-0 break-words">Today&apos;s Smart Routine</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6 sm:pt-0">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="min-w-0 flex items-start gap-2"><Sun className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span className="min-w-0 break-words leading-relaxed">{am.map((s) => s.step).join(" → ")}</span></div>
            <div className="min-w-0 flex items-start gap-2"><Moon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /><span className="min-w-0 break-words leading-relaxed">{pm.map((s) => s.step).join(" → ")}</span></div>
          </div>
          <button type="button" onClick={onOpenRoutine} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
            Open my routine <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
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
      </CardContent>
    </Card>
  );
};

export default ForYourSkinCard;
