import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useAdvancedAssessmentAccess } from "@/hooks/use-advanced-assessment";
import { listAdvancedAssessmentReports } from "@/lib/assessment/client";
import { getReportDisplayStatus, INTAKE_EXPECTED_DELIVERY, type AdvancedAssessmentReportSummary } from "@/lib/assessment/types";
import ReportReadyOptIn from "@/components/pwa/ReportReadyOptIn";
import { PendingBadge } from "@/components/advanced-assessment/IntakeConfirmation";
import DownloadSubmissionPdfButton from "@/components/advanced-assessment/DownloadSubmissionPdfButton";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { ADVANCED_NAME, ANALYSIS_PASS, BASIC_NAME, SKYNN_ADVANCED_ROUTE, analysisPassCount } from "@/lib/skynn/terminology";

interface AdvancedAssessmentCardProps {
  /** Kept for the caller's API. Membership alone never grants the Advanced AI Dermatology Analysis. */
  isMember?: boolean;
  /** Kept for the caller's API; the server's own pass count is used instead. */
  balance?: number | null;
  loading?: boolean;
}

/**
 * Dashboard presence for the Advanced AI Dermatology Analysis (SKYNN AI v2.1 —
 * beta). Eligibility and the Analysis Pass count come ONLY from the server-side
 * get_advanced_assessment_access() check, and every CTA goes to the single
 * Advanced flow at /skynn-ai/advanced — which handles sign-in, the Pass gate
 * and the purchase itself. (Before v2.1 this card had a second branch that
 * treated Insider/VIP membership as access and linked to /skynn-ai, where the
 * legacy live-AI path ran without a Pass. That path is retired.)
 *
 * A member with a queued pre-approval submission sees it here as
 * "Advanced AI Dermatology Analysis — Pending" with its reference.
 */
const AdvancedAssessmentCard = ({ loading: loadingProp = false }: AdvancedAssessmentCardProps) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const { access, loading: accessLoading } = useAdvancedAssessmentAccess();
  const paused = !access || access.rolloutStage === "disabled" || access.reportMode === "disabled";
  const balance = access?.passesAvailable ?? 0;
  const loading = loadingProp || accessLoading;
  const hasPasses = balance > 0;
  const eligible = Boolean(access?.eligible);
  const viewedRef = useRef(false);
  const [pending, setPending] = useState<AdvancedAssessmentReportSummary | null>(null);

  useEffect(() => {
    let active = true;
    listAdvancedAssessmentReports()
      .then(({ reports }) => {
        if (!active) return;
        setPending(reports.find((r) => getReportDisplayStatus(r) === "pending_intake") ?? null);
      })
      .catch(() => { /* card still works without it */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || viewedRef.current) return;
    viewedRef.current = true;
    trackConversionEvent("advanced_assessment_upsell_viewed", {
      funnelLocation: "dashboard",
      accessState: hasPasses ? "pass_holder" : "none",
    });
    trackSkynnEvent("skynn_advanced_entitlement_checked", { mode: "advanced", source: "dashboard", eligible });
  }, [loading, hasPasses, eligible]);

  const handleCta = () => {
    if (eligible) {
      trackConversionEvent("advanced_analysis_cta_clicked", { cta: "use_pass", funnelLocation: "dashboard" });
      trackSkynnEvent("skynn_mode_selected", { mode: "advanced", source: "dashboard" });
      return;
    }
    trackConversionEvent("advanced_assessment_upsell_clicked", { funnelLocation: "dashboard" });
    trackConversionEvent("analysis_pass_purchase_viewed", { source: "dashboard_advanced_assessment" });
    trackSkynnEvent("skynn_analysis_pass_required", { mode: "advanced", source: "dashboard" });
    setPurchaseOpen(true);
  };

  return (
    <>
      <Card className={eligible ? "border-primary/30" : undefined}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {eligible ? <Sparkles className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            <span><span className="gradient-text font-bold">SKYNN AI</span> — {ADVANCED_NAME}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending && (
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{ADVANCED_NAME}</span>
                <PendingBadge />
              </div>
              {pending.reference_number && <p className="font-mono text-xs text-muted-foreground">{pending.reference_number}</p>}
              <p className="text-xs text-muted-foreground">
                Your submission has been received and securely queued. It is not a completed report yet. Expected
                delivery: {INTAKE_EXPECTED_DELIVERY}. No action needed.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to={`${SKYNN_ADVANCED_ROUTE}?session=${pending.session_id}`} className="text-xs underline underline-offset-2">
                  View submission status
                </Link>
                <DownloadSubmissionPdfButton sessionId={pending.session_id} source="dashboard" variant="ghost" />
              </div>
              <ReportReadyOptIn />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            A longer, more detailed questionnaire than your {BASIC_NAME}. Each submission uses one {ANALYSIS_PASS}.
            {access?.reportMode === "fallback"
              ? " During this beta, submissions are received and queued with a reference number while the report workflow is finalised."
              : " Every report is checked by the SkinLabs team before it's released."}
          </p>
          {paused && !loading ? (
            <p className="text-xs text-muted-foreground">New submissions are paused at the moment — check back soon.</p>
          ) : eligible ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{analysisPassCount(balance)} available</Badge>
              <Button size="sm" className="gap-2" asChild onClick={handleCta}>
                <Link to={SKYNN_ADVANCED_ROUTE}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Start my {ADVANCED_NAME}
                </Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleCta} disabled={loading}>
              <Lock className="h-3.5 w-3.5" />
              Get an {ANALYSIS_PASS}
            </Button>
          )}
          <Link to={SKYNN_ADVANCED_ROUTE} className="block text-xs text-muted-foreground underline underline-offset-2">
            View my {ADVANCED_NAME} submissions
          </Link>
        </CardContent>
      </Card>
      <AnalysisPassPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </>
  );
};

export default AdvancedAssessmentCard;
