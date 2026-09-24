import { Link } from "react-router-dom";
import { Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatUnlockDate, FORMULATOR_LIMITS } from "@/lib/formulator/limits";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useInsiderMonthlyPrice, type FormulatorAllowanceStatus } from "@/hooks/use-formulator-allowance";

interface AnalysisCreditsCardProps {
  allowance: FormulatorAllowanceStatus | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Free starter analyses left in the current rolling window, for Explorer/Lite;
 * "Unlimited" for Insider/VIP. Numbers come from get_formulator_allowance(),
 * never computed client-side from stale state.
 */
const AnalysisCreditsCard = ({ allowance, loading, error, onRetry }: AnalysisCreditsCardProps) => {
  const price = useInsiderMonthlyPrice();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Analysis credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading your analysis credits">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : error || !allowance ? (
          <div className="space-y-2">
            <p className="text-sm text-secondary-text">Couldn't load your analysis credits.</p>
            <Button variant="outline" size="sm" className="min-h-11" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : allowance.unlimited ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-2xl font-heading font-bold text-foreground">
              <InfinityIcon className="h-6 w-6" aria-hidden="true" />
              Unlimited
            </p>
            <p className="text-sm text-secondary-text">Re-analyse as often as your skin changes.</p>
            {allowance.lastAnalysisAt && (
              <p className="text-xs text-secondary-text">Last analysis: {formatUnlockDate(allowance.lastAnalysisAt)}</p>
            )}
          </div>
        ) : (
          <FreeAllowance allowance={allowance} price={price} />
        )}
      </CardContent>
    </Card>
  );
};

const FreeAllowance = ({ allowance, price }: { allowance: FormulatorAllowanceStatus; price: number | null }) => {
  const total = FORMULATOR_LIMITS[allowance.tier]?.freeAnalyses || 1;
  const remaining = allowance.freeRemaining ?? 0;
  // Bar shows how far through the current window you are (full = free analysis available).
  const progress =
    remaining > 0 || !allowance.nextUnlockAt
      ? 100
      : Math.round(
          Math.min(1, Math.max(0, 1 - (allowance.nextUnlockAt.getTime() - Date.now()) / (allowance.windowDays * DAY_MS))) * 100,
        );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-2xl font-heading font-bold text-foreground">
          {remaining} <span className="text-base font-medium text-secondary-text">of {total} free</span>
        </p>
        <p className="text-xs text-secondary-text">Free analyses left this period</p>
      </div>
      <Progress
        value={progress}
        className="h-2"
        aria-label={remaining > 0 ? "Free analysis available" : `${progress}% of the way to your next free analysis`}
      />
      <dl className="grid gap-1 text-xs text-secondary-text">
        <div className="flex justify-between gap-2">
          <dt>Last analysis</dt>
          <dd className="font-medium text-foreground">
            {allowance.lastAnalysisAt ? formatUnlockDate(allowance.lastAnalysisAt) : "None yet"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Next free analysis</dt>
          <dd className="font-medium text-foreground">
            {remaining > 0 || !allowance.nextUnlockAt ? "Available now" : formatUnlockDate(allowance.nextUnlockAt)}
          </dd>
        </div>
        {allowance.passBalance > 0 && (
          <div className="flex justify-between gap-2">
            <dt>Analysis Passes</dt>
            <dd className="font-medium text-foreground">{allowance.passBalance}</dd>
          </div>
        )}
      </dl>
      <Link
        to="/pricing"
        onClick={() => trackConversionEvent("upgrade_clicked_from_formulator", { source: "dashboard_credits" })}
        className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-brand-gold decoration-2 underline-offset-4 hover:decoration-foreground"
      >
        Unlimited re-analysis with Glow Insider{price !== null ? ` · R${price}/mo` : ""}
      </Link>
    </div>
  );
};

export default AnalysisCreditsCard;
