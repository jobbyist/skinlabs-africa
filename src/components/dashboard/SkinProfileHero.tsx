import { ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { headlineForSavedAnalysis } from "@/lib/formulator/summary";
import { formatUnlockDate } from "@/lib/formulator/limits";
import type { SavedRecommendationRow } from "@/components/dashboard/SavedAnalysisCard";
import type { FormulatorAllowanceStatus } from "@/hooks/use-formulator-allowance";

interface SkinProfileHeroProps {
  latest: SavedRecommendationRow | null;
  loading: boolean;
  allowance: FormulatorAllowanceStatus | null;
  onViewFullAnalysis: () => void;
}

/**
 * The dashboard's skin-intelligence snapshot: the member's current skin profile
 * from their latest SKYNN AI analysis. Informational: starting or re-running an
 * analysis is the next-action card's job, so this has no competing CTA.
 */
const SkinProfileHero = ({ latest, loading, allowance, onViewFullAnalysis }: SkinProfileHeroProps) => {
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

  // No analysis yet: the dashboard's next-action card already asks for it. Nothing to snapshot.
  if (!latest) return null;

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

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Button onClick={onViewFullAnalysis} variant="outline" className="min-h-11 gap-2">
            View full analysis
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          {locked && (
            <p className="flex items-center gap-1.5 text-xs text-secondary-text">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {allowance?.nextUnlockAt
                ? `Next free analysis on ${formatUnlockDate(allowance.nextUnlockAt)}`
                : "Your next free analysis unlocks soon"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkinProfileHero;
