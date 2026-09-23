import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useAdvancedAssessmentAccess } from "@/hooks/use-advanced-assessment";

interface AdvancedAssessmentCardProps {
  /** Insider/VIP — the same "isMember" semantics used by AIFormulator.tsx (useMembership().isMember). */
  isMember?: boolean;
  balance?: number | null;
  loading?: boolean;
}

/**
 * Dashboard presence for the Advanced AI Dermatology Report — sits next to
 * "Your AM/PM Routine" in the Overview tab so the funnel (Starter Analysis →
 * Advanced AI Dermatology Report → Smart Routines) reads as one continuous
 * journey rather than a separate product. Reuses the existing Analysis Pass
 * balance (threaded down from UserDashboard.tsx, same source AnalysisPassesCard
 * reads — no second fetch) and membership state; the report itself still runs
 * through the existing SKYNN AI flow at /skynn-ai (or the dashboard's own
 * "Skin Analysis (SKYNN AI)" tab), never a duplicate product surface.
 *
 * SKYNN AI v2 (2026-09-23): when the v2 engine is live (rollout stage
 * 'pass_holders_review'), eligibility and pass balance come from the
 * server-side get_advanced_assessment_access() check and the CTA goes to
 * the human-reviewed report at /skynn-ai/advanced. The props are only a
 * fallback for when the v2 engine is switched off.
 */
const AdvancedAssessmentCard = ({ isMember: isMemberProp = false, balance: balanceProp = null, loading: loadingProp = false }: AdvancedAssessmentCardProps) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const { access, loading: accessLoading } = useAdvancedAssessmentAccess();
  const v2Live = !!access && access.rolloutStage !== "disabled";
  const isMember = v2Live ? false : isMemberProp;
  const balance = v2Live ? access.passesAvailable : balanceProp;
  const loading = loadingProp || accessLoading;
  const hasPasses = (balance ?? 0) > 0;
  const eligible = v2Live ? access.eligible : isMember || hasPasses;
  const startHref = v2Live ? "/skynn-ai/advanced" : "/skynn-ai";
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
            <span className="gradient-text font-bold">SKYNN AI</span> — Advanced AI Dermatology Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {eligible
              ? "Go deeper than your Starter Analysis with a comprehensive AI dermatology report built to understand your skin profile in greater detail."
              : "Unlock a deeper understanding of your skin with SKYNN AI — a more comprehensive AI dermatology report than the free Starter Analysis."}
            {v2Live && " Every report is checked by the SkinLabs team before it's released."}
          </p>
          {isMember ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Included with your membership</Badge>
              <Button size="sm" className="gap-2" asChild onClick={handleCta}>
                <Link to={startHref}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Start My Dermatology Report
                </Link>
              </Button>
            </div>
          ) : hasPasses ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{balance} Analysis Pass{balance === 1 ? "" : "es"} available</Badge>
              <Button size="sm" className="gap-2" asChild onClick={handleCta}>
                <Link to={startHref}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Start My Dermatology Report
                </Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleCta}>
              <Lock className="h-3.5 w-3.5" />
              Explore access
            </Button>
          )}
          {v2Live && (
            <Link to="/skynn-ai/advanced" className="block text-xs text-muted-foreground underline underline-offset-2">
              View my Advanced reports
            </Link>
          )}
        </CardContent>
      </Card>
      <AnalysisPassPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </>
  );
};

export default AdvancedAssessmentCard;
