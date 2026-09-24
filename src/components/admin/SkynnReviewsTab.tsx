import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportMarkdown from "@/components/advanced-assessment/ReportMarkdown";
import ScoresPanel from "@/components/advanced-assessment/ScoresPanel";
import {
  getReviewDetail,
  listPromptSignoffs,
  listReviewQueue,
  recordPromptSignoff,
  submitReviewDecision,
  type PromptSignoff,
  type ReviewDetail,
  type ReviewQueueRow,
} from "@/lib/assessment/adminClient";
import type { ReportReviewStatus } from "@/lib/assessment/types";

/**
 * SKYNN AI v2 human review (framework §12: every report reviewed before a
 * member sees it during this beta). Shows the QA-approved report exactly as
 * the member would see it, alongside the automated QA/regulatory findings
 * and the member's own answers, and records an approve/reject decision.
 * Approval is refused server-side until the active prompt set has a
 * completed dermatologist sign-off record, which is captured here too.
 */
const SkynnReviewsTab = () => {
  const [status, setStatus] = useState<ReportReviewStatus>("awaiting_review");
  const [queue, setQueue] = useState<ReviewQueueRow[] | null>(null);
  const [signoffs, setSignoffs] = useState<PromptSignoff[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, s] = await Promise.all([listReviewQueue(status), listPromptSignoffs()]);
      setQueue(rows ?? []);
      setSignoffs(s ?? []);
    } catch (err) {
      toast.error((err as Error).message);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = signoffs.find((s) => s.is_active);

  return (
    <div className="space-y-6">
      <SignoffCard signoff={active ?? null} onSaved={load} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as ReportReviewStatus); setSelected(null); }}>
          <TabsList>
            <TabsTrigger value="awaiting_review">Awaiting review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {loading && !queue ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : queue && queue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here.</p>
          ) : (
            queue?.map((r) => (
              <button
                key={r.report_id}
                type="button"
                onClick={() => setSelected(r.report_id)}
                className={
                  "w-full rounded-xl border p-3 text-left transition-colors " +
                  (selected === r.report_id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.generated_at ?? r.created_at).toLocaleString("en-ZA")}
                  </span>
                  {r.triage && r.triage !== "clear" && <Badge variant="destructive">{r.triage}</Badge>}
                </div>
                <p className="text-sm mt-1">
                  MST {r.mst_tier ?? "—"} · {r.confidence ?? "—"} confidence · QA ×{r.qa_attempts}
                </p>
                {r.regulatory_flags?.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{r.regulatory_flags.length} regulatory keyword flag(s)</p>
                )}
              </button>
            ))
          )}
        </div>
        <div>{selected ? <ReviewPanel reportId={selected} signoffComplete={active?.status === "signed_off"} onDecided={() => { setSelected(null); void load(); }} /> : null}</div>
      </div>
    </div>
  );
};

const SignoffCard = ({ signoff, onSaved }: { signoff: PromptSignoff | null; onSaved: () => void }) => {
  const [name, setName] = useState("");
  const [hpcsa, setHpcsa] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  if (!signoff) return null;
  if (signoff.status === "signed_off") {
    return (
      <Card className="border-emerald-500/30">
        <CardContent className="pt-6 flex gap-3 text-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <p>
            Prompt set <span className="font-mono">{signoff.prompt_set}</span> (question library {signoff.definition_version}) signed off by{" "}
            {signoff.dermatologist_name} ({signoff.hpcsa_number}) on {signoff.approved_on}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await recordPromptSignoff({ promptSet: signoff.prompt_set, name, hpcsa, approvedOn: date, notes: null });
      toast.success("Sign-off recorded");
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Dermatologist sign-off not recorded
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Reports from prompt set <span className="font-mono">{signoff.prompt_set}</span> can be reviewed but not released until the
          approving dermatologist&apos;s details are recorded (SKYNN AI v2 go-live checklist).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="signoff-name">Dermatologist full name</Label>
            <Input id="signoff-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signoff-hpcsa">HPCSA registration no.</Label>
            <Input id="signoff-hpcsa" placeholder="MP0123456" value={hpcsa} onChange={(e) => setHpcsa(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signoff-date">Approval date</Label>
            <Input id="signoff-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => void save()} disabled={saving || !name || !hpcsa || !date} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Record sign-off
        </Button>
      </CardContent>
    </Card>
  );
};

const ReviewPanel = ({ reportId, signoffComplete, onDecided }: { reportId: string; signoffComplete: boolean; onDecided: () => void }) => {
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    let active = true;
    setDetail(null);
    getReviewDetail(reportId)
      .then((d) => { if (active) setDetail(d); })
      .catch((err) => toast.error((err as Error).message));
    return () => { active = false; };
  }, [reportId]);

  const decide = async (decision: "approve" | "reject") => {
    setBusy(decision);
    try {
      const res = await submitReviewDecision(reportId, decision, notes.trim() || null);
      toast.success(decision === "approve" ? "Report released to the member" : `Report rejected${res.refunded ? " · pass refunded" : ""}`);
      onDecided();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!detail) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  const review = detail.report?.review;
  const pending = detail.review_status === "awaiting_review";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={detail.triage === "clear" ? "secondary" : "destructive"}>Triage: {detail.triage}</Badge>
            <Badge variant="outline">MST {detail.mst_tier ?? "—"}</Badge>
            <Badge variant="outline">{detail.prompt_set}</Badge>
            {review?.injectionFlagged && <Badge variant="destructive">Prompt-injection attempt flagged</Badge>}
          </div>
          {detail.models && (
            <p className="text-xs text-muted-foreground">
              Models: {Object.entries(detail.models).map(([k, v]) => `${k} ${v}`).join(" · ")}
            </p>
          )}
          {review && (
            <div className="space-y-1 pt-2">
              <p className="font-medium">Automated checks</p>
              <p className="text-xs text-muted-foreground">QA passes: {review.qaAttempts}</p>
              {review.qaViolations.length > 0 && <FindingList title="QA violations (last pass)" items={review.qaViolations} />}
              {review.regulatoryFlags.length > 0 && <FindingList title="Regulatory keyword matches — check in context" items={review.regulatoryFlags} />}
              {review.strippedCitations.length > 0 && <FindingList title="Citations removed (not in approved evidence)" items={review.strippedCitations} />}
            </div>
          )}
        </CardContent>
      </Card>

      {detail.scores && <ScoresPanel scores={detail.scores} compact />}

      {detail.report?.triage?.message && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm whitespace-pre-line">{detail.report.triage.message}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {detail.rendered_markdown ? <ReportMarkdown markdown={detail.rendered_markdown} /> : <p className="text-sm">No report body.</p>}
          {detail.report?.evidence && detail.report.evidence.length > 0 && (
            <ol className="mt-6 space-y-1 border-t border-border pt-4">
              {detail.report.evidence.map((s) => (
                <li key={s.code} id={`cite-${s.code}`} className="text-xs text-muted-foreground">
                  [{s.code}] {s.title}{s.pmid ? ` · PMID ${s.pmid}` : ""}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <button type="button" className="text-sm font-medium underline underline-offset-2" onClick={() => setShowAnswers((v) => !v)}>
            {showAnswers ? "Hide" : "Show"} the member&apos;s answers
          </button>
          {showAnswers && (
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted/40 p-3 text-xs whitespace-pre-wrap">
              {JSON.stringify(detail.responses, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {pending ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label htmlFor="review-notes">Reviewer notes (internal)</Label>
            <Textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            {!signoffComplete && (
              <p className="text-xs text-amber-600">Release is blocked until the dermatologist sign-off above is recorded.</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void decide("approve")} disabled={!!busy || !signoffComplete} className="gap-2">
                {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve & release
              </Button>
              <Button variant="outline" onClick={() => void decide("reject")} disabled={!!busy} className="gap-2">
                {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject & refund pass
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          {detail.review_status === "approved" ? "Approved" : "Rejected"} {detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleString("en-ZA") : ""}
          {detail.review_notes ? ` — ${detail.review_notes}` : ""}
        </p>
      )}
    </div>
  );
};

const FindingList = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <p className="text-xs font-medium text-amber-700 dark:text-amber-500">{title}</p>
    <ul className="list-disc pl-5 text-xs text-muted-foreground">
      {items.map((i) => <li key={i}>{i}</li>)}
    </ul>
  </div>
);

export default SkynnReviewsTab;
