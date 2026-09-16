import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Lock, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useAdvancedAssessmentAccess, useAdvancedAssessment } from "@/hooks/use-advanced-assessment";
import AssessmentFlow from "@/components/advanced-assessment/AssessmentFlow";
import ProcessingState from "@/components/advanced-assessment/ProcessingState";
import ReportView from "@/components/advanced-assessment/ReportView";
import { getAdvancedAssessmentReport } from "@/lib/assessment/client";
import type { AdvancedDermatologyReport } from "@/lib/assessment/types";

/**
 * SKYNN AI Advanced Dermatology Assessment — page shell.
 *
 * Deliberately NOT linked from Header/Footer/UserDashboard/
 * AdvancedAssessmentCard yet: the engine's feature flag
 * (skynn_advanced_assessment_config.rollout_stage) defaults to 'disabled'
 * and no dermatologist-approved system prompt has been supplied (see
 * CLAUDE.md), so surfacing this route in navigation before either of those
 * is true would make an unfinished feature look operational — the one
 * thing section 42 of the engine brief explicitly forbids. This page is
 * reachable by direct URL for internal QA once the flag moves to
 * 'internal'/'beta', and the access check below still enforces the flag
 * server-side regardless of how someone reaches the page.
 */
const AdvancedAssessmentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { access, loading: accessLoading, refresh: refreshAccess } = useAdvancedAssessmentAccess();
  const [authOpen, setAuthOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [started, setStarted] = useState(false);

  return (
    <>
      <Helmet>
        <title>Advanced Dermatology Assessment (SKYNN AI) | SkinLabs</title>
        {/* Not indexed while this engine is behind an internal/beta rollout flag. */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container mx-auto px-4">
          {authLoading || accessLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <SignInPrompt onSignIn={() => setAuthOpen(true)} />
          ) : !access?.eligible ? (
            <NotAvailable rolloutStage={access?.rolloutStage ?? "disabled"} onPurchase={() => setPurchaseOpen(true)} />
          ) : !started ? (
            <Landing accessType={access.accessType} passesAvailable={access.passesAvailable} onStart={() => setStarted(true)} />
          ) : (
            <AssessmentRunner onExit={() => { setStarted(false); void refreshAccess(); }} />
          )}
        </main>
        <Footer />
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => setAuthOpen(false)} />
      <AnalysisPassPurchaseModal open={purchaseOpen} onOpenChange={setPurchaseOpen} />
    </>
  );
};

const SignInPrompt = ({ onSignIn }: { onSignIn: () => void }) => (
  <div className="max-w-md mx-auto text-center py-24 space-y-4">
    <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
    <p className="text-lg font-heading font-semibold">Sign in to continue</p>
    <p className="text-sm text-muted-foreground">The Advanced Assessment is available to signed-in SkinLabs members.</p>
    <Button onClick={onSignIn}>Sign in</Button>
  </div>
);

const NotAvailable = ({ rolloutStage, onPurchase }: { rolloutStage: string; onPurchase: () => void }) => (
  <div className="max-w-md mx-auto text-center py-24 space-y-4">
    <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
    <p className="text-lg font-heading font-semibold">
      {rolloutStage === "disabled" ? "Not available yet" : "Explore access"}
    </p>
    <p className="text-sm text-muted-foreground">
      {rolloutStage === "disabled"
        ? "The Advanced Dermatology Assessment isn't switched on yet — check back soon."
        : "This assessment is included with Glow Insider and Glow VIP, or available with an Analysis Pass."}
    </p>
    {rolloutStage !== "disabled" && <Button onClick={onPurchase}>Get an Analysis Pass</Button>}
  </div>
);

const Landing = ({ accessType, passesAvailable, onStart }: { accessType: string; passesAvailable: number; onStart: () => void }) => (
  <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
    <Sparkles className="h-8 w-8 mx-auto text-primary" />
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide gradient-text">SKYNN AI</p>
      <h1 className="text-3xl font-heading font-semibold mt-1">Advanced Dermatology Assessment</h1>
    </div>
    <p className="text-muted-foreground">
      Go beyond your Starter Analysis. Build a deeper picture of your skin with a comprehensive assessment designed to
      understand your concerns, routine, skin behaviour and environmental context.
    </p>
    <p className="text-xs text-muted-foreground">
      {accessType === "membership" ? "Included with your membership" : `${passesAvailable} Analysis Pass${passesAvailable === 1 ? "" : "es"} available`}
    </p>
    <Button size="lg" onClick={onStart} className="gap-2 gradient-border-anim">
      <Sparkles className="h-4 w-4" />
      Start Advanced Assessment
    </Button>
  </div>
);

const AssessmentRunner = ({ onExit }: { onExit: () => void }) => {
  const { session, definition, responses, currentSectionId, saving, submitting, submission, error, setAnswer, goToSection, submit } =
    useAdvancedAssessment();
  const [report, setReport] = useState<AdvancedDermatologyReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (submission?.status !== "completed" || !session || report || reportError) return;
    let active = true;
    void getAdvancedAssessmentReport({ sessionId: session.id })
      .then((res) => { if (active) setReport(res.report.report); })
      .catch(() => { if (active) setReportError("Couldn't load your report — please refresh."); });
    return () => { active = false; };
  }, [submission?.status, session, report, reportError]);

  if (!session || !definition) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submitting || submission?.status === "processing") {
    return <ProcessingState />;
  }

  if (submission?.status === "failed" || error) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-4">
        <p className="text-lg font-heading font-semibold">We couldn&apos;t generate your report</p>
        <p className="text-sm text-muted-foreground">{error ?? "Please try again."}</p>
        <Button variant="outline" onClick={onExit}>
          Back
        </Button>
      </div>
    );
  }

  if (submission?.status === "completed" && report) {
    return <ReportView report={report} sessionId={session.id} />;
  }

  if (submission?.status === "completed" && reportError) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-4">
        <p className="text-sm text-muted-foreground">{reportError}</p>
        <Button variant="outline" onClick={onExit}>Back</Button>
      </div>
    );
  }

  if (submission?.status === "completed" && !report) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AssessmentFlow
      sections={definition.sections}
      currentSectionId={currentSectionId}
      responses={responses}
      saving={saving}
      submitting={submitting}
      onAnswer={setAnswer}
      onGoToSection={goToSection}
      onSubmit={submit}
    />
  );
};

export default AdvancedAssessmentPage;
