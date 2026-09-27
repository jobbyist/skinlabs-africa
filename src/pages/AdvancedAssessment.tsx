import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, ClipboardCheck, Loader2, Lock, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthDialog from "@/components/AuthDialog";
import AnalysisPassPurchaseModal from "@/components/AnalysisPassPurchaseModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdvancedAssessmentAccess, useAdvancedAssessment } from "@/hooks/use-advanced-assessment";
import AssessmentFlow from "@/components/advanced-assessment/AssessmentFlow";
import ProcessingState from "@/components/advanced-assessment/ProcessingState";
import ReportView from "@/components/advanced-assessment/ReportView";
import IntakeConfirmation, { IntakeDisclaimer, PendingBadge, ReferenceBlock } from "@/components/advanced-assessment/IntakeConfirmation";
import DeleteSubmissionButton from "@/components/advanced-assessment/DeleteSubmissionButton";
import { getAdvancedAssessmentReport, listAdvancedAssessmentReports } from "@/lib/assessment/client";
import {
  getReportDisplayStatus,
  INTAKE_EXPECTED_DELIVERY,
  REPORT_STATUS_LABEL,
  type AdvancedAssessmentReportRow,
  type AdvancedAssessmentReportSummary,
  type AdvancedReportMode,
} from "@/lib/assessment/types";

/**
 * SKYNN AI — Advanced AI Dermatology Report (v2, 2026-09-23).
 *
 * Live for members holding an Analysis Pass (rollout_stage
 * 'pass_holders_review', enforced server-side by
 * get_advanced_assessment_access()). Every report is generated in the
 * background and HELD for a SkinLabs team review before release — content
 * is withheld by the database until an admin approves it, so this page only
 * ever shows the member statuses until then. `?session=<id>` (used by the
 * "your report is ready" email) opens a specific report's status/view.
 *
 * Pre-approval intake (2026-09-27): while report_mode = 'fallback' (read
 * from the server via get_advanced_assessment_access, never hardcoded
 * here), a submission is stored and queued instead of generated. The member
 * gets a reference number and an "Advanced Dermatology Report — Pending"
 * status, and the report follows later through the production workflow.
 */
const AdvancedAssessmentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { access, loading: accessLoading, refresh: refreshAccess } = useAdvancedAssessmentAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewSessionId = searchParams.get("session");
  const [authOpen, setAuthOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [confirmation, setConfirmation] = useState<{ sessionId: string; referenceNumber: string | null } | null>(null);
  const reportMode: AdvancedReportMode = access?.reportMode ?? "disabled";

  const openSession = useCallback(
    (id: string | null) => {
      setStarted(false);
      setSearchParams(id ? { session: id } : {});
    },
    [setSearchParams],
  );

  let body: ReactNode;
  if (authLoading || accessLoading) {
    body = (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  } else if (!user) {
    body = <SignInPrompt onSignIn={() => setAuthOpen(true)} />;
  } else if (confirmation) {
    body = (
      <IntakeConfirmation
        referenceNumber={confirmation.referenceNumber}
        onViewStatus={() => { const id = confirmation.sessionId; setConfirmation(null); openSession(id); }}
      />
    );
  } else if (viewSessionId) {
    body = <ReportStatusView sessionId={viewSessionId} onBack={() => { openSession(null); void refreshAccess(); }} />;
  } else if (started && access?.eligible) {
    body = (
      <AssessmentRunner
        reportMode={reportMode}
        onSubmitted={(id, sub) => {
          if (sub.processingMode === "fallback") {
            setStarted(false);
            setConfirmation({ sessionId: id, referenceNumber: sub.referenceNumber });
            void refreshAccess();
          } else {
            openSession(id);
          }
        }}
        onExit={() => { setStarted(false); void refreshAccess(); }}
      />
    );
  } else {
    body = (
      <div className="space-y-10">
        {access?.eligible ? (
          <Landing passesAvailable={access.passesAvailable} reportMode={reportMode} onStart={() => setStarted(true)} />
        ) : (
          <NotAvailable
            paused={(access?.rolloutStage ?? "disabled") === "disabled" || reportMode === "disabled"}
            onPurchase={() => setPurchaseOpen(true)}
          />
        )}
        <PastReports onOpen={openSession} />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Advanced AI Dermatology Report (SKYNN AI) | SkinLabs</title>
        {/* Member-only, personalised flow — nothing here for search engines. */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container mx-auto px-4">{body}</main>
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
    <p className="text-sm text-muted-foreground">The Advanced AI Dermatology Report is available to signed-in SkinLabs members.</p>
    <Button onClick={onSignIn}>Sign in</Button>
  </div>
);

const NotAvailable = ({ paused, onPurchase }: { paused: boolean; onPurchase: () => void }) => (
  <div className="max-w-md mx-auto text-center py-16 space-y-4">
    <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
    <p className="text-lg font-heading font-semibold">
      {paused ? "Not available right now" : "You'll need an Analysis Pass"}
    </p>
    <p className="text-sm text-muted-foreground">
      {paused
        ? "New Advanced AI Dermatology Report requests are paused at the moment — check back soon."
        : "During this reviewed beta, each Advanced AI Dermatology Report uses one Analysis Pass. If we can't release your report, the pass is refunded."}
    </p>
    {!paused && <Button onClick={onPurchase}>Get an Analysis Pass</Button>}
  </div>
);

const Landing = ({ passesAvailable, reportMode, onStart }: { passesAvailable: number; reportMode: AdvancedReportMode; onStart: () => void }) => (
  <div className="max-w-2xl mx-auto text-center pt-8 space-y-6">
    <Sparkles className="h-8 w-8 mx-auto text-primary" />
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide gradient-text">SKYNN AI (beta)</p>
      <h1 className="text-3xl font-heading font-semibold mt-1">Advanced AI Dermatology Report</h1>
    </div>
    <p className="text-muted-foreground">
      A deeper, evidence-referenced look at your skin: how it behaves, your breakouts, sun and pigment concerns, and how
      it affects your day — with guidance tailored to your skin tone and South African conditions.
    </p>
    <ul className="text-sm text-muted-foreground space-y-1.5 text-left max-w-md mx-auto">
      <li className="flex gap-2"><ClipboardCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> About 15 minutes of questions, saved as you go</li>
      <li className="flex gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> Checked by the SkinLabs team before you see it</li>
      <li className="flex gap-2"><Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> Cosmetic guidance — not a medical diagnosis</li>
    </ul>
    {reportMode === "fallback" && (
      <p className="flex gap-2 text-sm text-left max-w-md mx-auto rounded-xl border border-border bg-muted/40 p-3">
        <CalendarClock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>
          We&apos;re finishing the upgraded SKYNN AI review system and its clinical approval. Requests made now are securely
          queued and your report is expected in {INTAKE_EXPECTED_DELIVERY} — you won&apos;t need to answer the questions again.
        </span>
      </p>
    )}
    <p className="text-xs text-muted-foreground">
      Uses 1 of your {passesAvailable} Analysis Pass{passesAvailable === 1 ? "" : "es"} when you submit · refunded if we can&apos;t release your report
      {reportMode === "fallback" ? " or you withdraw your request" : ""}
    </p>
    <Button size="lg" onClick={onStart} className="gap-2 gradient-border-anim">
      <Sparkles className="h-4 w-4" />
      Start my assessment
    </Button>
  </div>
);

const PastReports = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const [reports, setReports] = useState<AdvancedAssessmentReportSummary[] | null>(null);
  useEffect(() => {
    let active = true;
    listAdvancedAssessmentReports()
      .then((r) => { if (active) setReports(r.reports); })
      .catch(() => { if (active) setReports([]); });
    return () => { active = false; };
  }, []);

  if (!reports || reports.length === 0) return null;
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <p className="font-medium text-sm">Your reports</p>
      {reports.map((r) => {
        const status = getReportDisplayStatus(r);
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onOpen(r.session_id)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-left hover:border-primary/40 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm">{new Date(r.submitted_at ?? r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
              {r.reference_number && <span className="block font-mono text-xs text-muted-foreground truncate">{r.reference_number}</span>}
            </span>
            {status === "pending_intake" ? <PendingBadge /> : <Badge variant={status === "ready" ? "default" : "secondary"}>{REPORT_STATUS_LABEL[status]}</Badge>}
          </button>
        );
      })}
    </div>
  );
};

const POLL_MS: Partial<Record<string, number>> = { preparing: 10_000, in_review: 60_000 };

const ReportStatusView = ({ sessionId, onBack }: { sessionId: string; onBack: () => void }) => {
  const [row, setRow] = useState<AdvancedAssessmentReportRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const { report } = await getAdvancedAssessmentReport({ sessionId });
        if (!active) return;
        setRow(report);
        setError(null);
        const status = getReportDisplayStatus(report);
        if (POLL_MS[status]) timer = setTimeout(load, POLL_MS[status]);
      } catch {
        if (active) setError("We couldn't find that report.");
      }
    };
    void load();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [sessionId]);

  const back = (
    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6">
      <ArrowLeft className="h-4 w-4" /> All reports
    </Button>
  );

  if (error) {
    return <div className="max-w-md mx-auto text-center py-16 space-y-4">{back}<p className="text-sm text-muted-foreground">{error}</p></div>;
  }
  if (!row) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  const status = getReportDisplayStatus(row);
  const released = status === "ready";
  const del = <DeleteSubmissionButton sessionId={row.session_id} released={released} onDeleted={onBack} />;

  if (status === "pending_intake") {
    return (
      <div className="max-w-xl mx-auto">
        {back}
        <IntakePendingView row={row} />
        <div className="mt-4 flex justify-center">{del}</div>
      </div>
    );
  }

  if (status === "preparing") return <div>{back}<ProcessingState /></div>;

  if (status === "failed" || status === "not_released") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        {back}
        <XCircle className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-lg font-heading font-semibold">We couldn&apos;t release this report</p>
        <p className="text-sm text-muted-foreground">
          {row.error_message ?? "Something went wrong. Your Analysis Pass has been refunded."}
        </p>
        {del}
      </div>
    );
  }

  if (released && row.report) {
    return (
      <div>
        {back}
        <ReportView report={row.report} sessionId={row.session_id} releasedAt={row.released_at} />
        <div className="mt-6 flex justify-center">{del}</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      {back}
      <ShieldCheck className="h-8 w-8 mx-auto text-primary" />
      <p className="text-lg font-heading font-semibold">Your report is with our review team</p>
      <p className="text-sm text-muted-foreground">
        SKYNN AI has finished your report. Before anyone sees it, a member of the SkinLabs team checks it for accuracy
        and safety. We&apos;ll email you as soon as it&apos;s released.
      </p>
      {del}
    </div>
  );
};

/** "Advanced Dermatology Report — Pending": a stored, queued pre-approval
 *  submission. Receipt only — no report content exists yet. */
const IntakePendingView = ({ row }: { row: AdvancedAssessmentReportRow }) => (
  <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-heading font-semibold">Advanced Dermatology Report</p>
      <PendingBadge />
    </div>
    {row.reference_number && <ReferenceBlock referenceNumber={row.reference_number} />}
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Submitted</dt>
        <dd>{new Date(row.submitted_at ?? row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Expected delivery</dt>
        <dd>{INTAKE_EXPECTED_DELIVERY}</dd>
      </div>
    </dl>
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>Your submission has been received and securely queued. No action is needed from you.</p>
      <p>
        We&apos;re completing the upgraded SKYNN AI dermatology review system and clinical approval process. Your report
        will be prepared from the answers you&apos;ve already given, and we&apos;ll email you as soon as it&apos;s ready to read here.
      </p>
    </div>
    <IntakeDisclaimer />
  </div>
);

const AssessmentRunner = ({
  reportMode,
  onSubmitted,
  onExit,
}: {
  reportMode: AdvancedReportMode;
  onSubmitted: (sessionId: string, submission: { referenceNumber: string | null; processingMode: string | null }) => void;
  onExit: () => void;
}) => {
  const { session, definition, responses, currentSectionId, saving, submitting, submission, error, setAnswer, goToSection, submit } =
    useAdvancedAssessment();

  useEffect(() => {
    if (submission && session) onSubmitted(session.id, submission);
  }, [submission, session, onSubmitted]);

  if (error && !submission) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-4">
        <p className="text-lg font-heading font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onExit}>Back</Button>
      </div>
    );
  }

  if (!session || !definition) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submitting) {
    if (reportMode === "fallback") {
      return (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Securely submitting your answers…</p>
        </div>
      );
    }
    return <ProcessingState />;
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
      intakeMode={reportMode === "fallback"}
    />
  );
};

export default AdvancedAssessmentPage;
