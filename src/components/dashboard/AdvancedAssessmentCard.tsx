import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { trackConversionEvent } from "@/lib/analytics-events";

interface AdvancedAssessmentCardProps {
  /** Insider/VIP — the same "isMember" semantics used by AIFormulator.tsx (useMembership().isMember). */
  isMember: boolean;
  balance: number | null;
  loading: boolean;
}

/**
 * Dashboard presence for the Advanced (AI Dermatology) Assessment — sits next to
 * "Your AM/PM Routine" in the Overview tab so the funnel (Starter Analysis →
 * Advanced Assessment → Smart Routines) reads as one continuous journey rather
 * than a separate product. Reuses the existing Analysis Pass balance
 * (threaded down from UserDashboard.tsx, same source AnalysisPassesCard reads —
 * no second fetch) and membership state; the actual assessment still runs
 * through the existing SKYNN AI flow at /skynn-ai (or the dashboard's own
 * "Skin Analysis (SKYNN AI)" tab), never a duplicate product surface.
 */
const AdvancedAssessmentCard = ({ isMember, balance, loading }: AdvancedAssessmentCardProps) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const hasPasses = (balance ?? 0) > 0;
  const eligible = isMember || hasPasses;
  const viewedRef = useRef(false);

  useEffect(() => {
    if (loading || viewedRef.current) return;
    viewedRef.current = true;
    trackConversionEvent("advanced_assessment_upsell_viewed", {
      funnelLocation: "dashboard",
      accessState: isMember ? "member" : hasPasses ? "pass_holder" : "none",
    });
  }, [loading, isMember, hasPasses]);

  const handleCta = () => {
    if (isMember) {
      trackConversionEvent("advanced_assessment_membership_cta_clicked", { funnelLocation: "dashboard" });
      return;
    }
    if (hasPasses) {
      trackConversionEvent("advanced_analysis_cta_clicked", { cta: "use_pass", funnelLocation: "dashboard" });
      return;
    }
    trackConversionEvent("advanced_assessment_upsell_clicked", { funnelLocation: "dashboard" });
    trackConversionEvent("analysis_pass_purchase_viewed", { source: "dashboard_advanced_assessment" });
    setPurchaseOpen(true);
  };

  return (
    <>
      <Card className={eligible ? "border-primary/30" : undefined}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {eligible ? <Sparkles className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            SKYNN AI — Advanced Dermatology Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {eligible
              ? "Go deeper than your Starter Analysis with a comprehensive assessment designed to understand your skin profile in greater detail."
              : "Unlock a deeper understanding of your skin with SKYNN AI — a more comprehensive assessment than the free Starter Analysis."}
          </p>
          {isMember ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Included with your membership</Badge>
              <Button size="sm" className="gap-2" asChild onClick={handleCta}>
                <Link to="/skynn-ai">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start Advanced Assessment
                </Link>
              </Button>
            </div>
          ) : hasPasses ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{balance} Analysis Pass{balance === 1 ? "" : "es"} available</Badge>
              <Button size="sm" className="gap-2" asChild onClick={handleCta}>
                <Link to="/skynn-ai">
                  <Sparkles className="h-3.5 w-3.5" />
                  Start Advanced Assessment
                </Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleCta}>
              <Lock className="h-3.5 w-3.5" />
              Explore access
            </Button>
          )}
        </CardContent>
      </Card>
      <AnalysisPassPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </>
  );
};

export default AdvancedAssessmentCard;
