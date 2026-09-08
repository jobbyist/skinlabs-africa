import { useEffect, useRef, useState } from "react";
import { Gem, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { trackConversionEvent } from "@/lib/analytics-events";

interface AnalysisPassesCardProps {
  balance: number | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Dashboard "Analysis Passes" stat card (Section 4/5) — the customer-facing
 * surface for the existing AI-analysis credit ledger. Deliberately styled
 * like the other overview stat cards (Subscription, Pre-Orders, AI Reports)
 * rather than a fintech wallet — a gem icon, no currency chrome, matching
 * Section 12's "skin intelligence, not a balance" note. Balance/loading/
 * error are passed in from UserDashboard.tsx, which already owns this
 * fetch (available_ai_credits) for its payment-success polling — this
 * keeps a single source of truth instead of a second independent fetch.
 */
const AnalysisPassesCard = ({ balance, loading, error, onRetry }: AnalysisPassesCardProps) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const hasPasses = (balance ?? 0) > 0;
  const viewedFiredRef = useRef(false);

  useEffect(() => {
    if (!loading && balance !== null && !viewedFiredRef.current) {
      viewedFiredRef.current = true;
      trackConversionEvent("analysis_pass_balance_viewed", { balance, source: "dashboard" });
    }
  }, [loading, balance]);

  const openPurchase = () => {
    trackConversionEvent("analysis_pass_purchase_viewed", { source: "dashboard" });
    setPurchaseOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gem className="h-4 w-4 text-primary" />
            Analysis Passes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking your Analysis Pass balance…
            </p>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive">Couldn't load your balance.</p>
              <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{balance ?? 0} available</p>
              <p className="text-xs text-muted-foreground mb-3">
                {hasPasses
                  ? "Use a pass to unlock a deeper Advanced Skin Analysis."
                  : "Unlock deeper insights into your skin whenever you need them."}
              </p>
              <div className="flex flex-wrap gap-2">
                {hasPasses && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/skynn-ai">Use a Pass</a>
                  </Button>
                )}
                <Button size="sm" onClick={openPurchase}>
                  {hasPasses ? "Get More" : "Get Analysis Passes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <AnalysisPassPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </>
  );
};

export default AnalysisPassesCard;
