import { useId } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Lock, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { headlineForSavedAnalysis } from "@/lib/formulator/summary";
import { formatUnlockDate } from "@/lib/formulator/limits";
import { trackConversionEvent } from "@/lib/analytics-events";
import type { SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import type { FormulatorAllowanceStatus } from "@/hooks/use-formulator-allowance";

interface SkinProfileHeroProps {
  latest: SavedRecommendationRow | null;
  loading: boolean;
  allowance: FormulatorAllowanceStatus | null;
  onViewFullAnalysis: () => void;
}

/**
 * The dashboard's lead card: the member's current skin profile from their
 * latest SKYNN AI analysis, or — with no analysis yet — a CTA to start one.
 */
const SkinProfileHero = ({ latest, loading, allowance, onViewFullAnalysis }: SkinProfileHeroProps) => {
  const lockedReasonId = useId();

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 sm:p-8 space-y-4" aria-busy="true" aria-label="Loading your skin profile">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </CardContent>
      </Card>
    );
  }

  if (!latest) {
    return (
      <Card className="h-full bg-brand-ink text-brand-ink-foreground border-transparent">
        <CardContent className="p-6 sm:p-8 flex h-full flex-col justify-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">SKYNN AI skin analysis</p>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold">Get your skin profile</h2>
          <p className="max-w-lg text-sm text-brand-ink-foreground/80">
            Answer a few questions about your skin and get your skin type, top concerns and a routine built around
            them. It takes about five minutes and it's free.
          </p>
          <div>
            <Button asChild size="lg" className="min-h-11 gap-2 bg-brand-ink-foreground text-brand-ink hover:bg-brand-ink-foreground/90">
              <Link to="/skynn-ai">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Start your free analysis
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const headline = headlineForSavedAnalysis(latest);
  const locked = Boolean(allowance?.locked);

  return (
    <Card className="h-full">
      <CardContent className="p-6 sm:p-8 flex h-full flex-col gap-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
            Your skin profile · {new Date(latest.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
            {headline.skinTypeLabel}
            {headline.skinTypeLabel !== "Your skin profile" && <span className="sr-only"> skin</span>}
          </h2>
        </div>

        {headline.concerns.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Your top concerns">
            {headline.concerns.map((concern) => (
              <li key={concern} className="rounded-full bg-brand-cream px-3 py-1.5 text-sm font-medium text-brand-cream-foreground">
                {concern}
              </li>
            ))}
          </ul>
        )}

        <p className="max-w-xl text-sm text-secondary-text">{headline.guidance}</p>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onViewFullAnalysis} className="min-h-11 gap-2">
            View full analysis
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          {locked ? (
            <>
              <Button
                type="button"
                variant="outline"
                aria-disabled="true"
                aria-describedby={lockedReasonId}
                onClick={(e) => {
                  e.preventDefault();
                  trackConversionEvent("reanalysis_blocked", { source: "dashboard" });
                }}
                className="min-h-11 gap-2 cursor-not-allowed opacity-60 active:scale-100"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Re-analyse
                <span className="sr-only">(locked)</span>
              </Button>
              <p id={lockedReasonId} className="text-xs text-secondary-text">
                {allowance?.nextUnlockAt
                  ? `Next free analysis on ${formatUnlockDate(allowance.nextUnlockAt)}`
                  : "Your next free analysis unlocks soon"}
              </p>
            </>
          ) : (
            <Button asChild variant="outline" className="min-h-11 gap-2">
              <Link to="/skynn-ai">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Re-analyse
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkinProfileHero;
