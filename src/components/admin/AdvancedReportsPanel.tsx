import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FileText, Loader2, RefreshCw, RotateCcw, Search, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import ScoresPanel from "@/components/advanced-assessment/ScoresPanel";
import { getAdminIntakePdfUrl } from "@/lib/assessment/client";
import {
  getAdvancedIntake,
  listAdvancedIntake,
  promoteAdvancedIntake,
  rejectAdvancedIntake,
  retryAdvancedIntake,
  type AdvancedReportAdminStatus,
  type IntakeDetail,
  type IntakeListRow,
} from "@/lib/assessment/adminClient";
import type { AssessmentQuestion } from "@/lib/assessment/types";

/**
 * Admin → SKYNN Reviews → Advanced Reports. Every Advanced Dermatology
 * Report submission, pre-approval intake (fallback) and production alike,
 * with search/filters, the full structured answers, delivery state of the
 * intake PDF / reports@ email, and the recovery actions (retry, reject +
 * refund, hand to production). All reads/writes are admin-checked RPCs;
 * the PDF opens through a 60-second signed URL, never a public link.
 */
const PAGE_SIZE = 25;
const ALL = "all";

const STATUS_LABEL: Record<AdvancedReportAdminStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  processing: "Processing",
  review_required: "Review required",
  approved: "Approved",
  released: "Released",
  rejected: "Rejected",
  failed: "Failed",
};

const DeliveryBadge = ({ status, kind }: { status: string | null; kind: "pdf" | "email" }) => {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const ok = (kind === "pdf" && status === "generated") || (kind === "email" && status === "sent");
  const bad = status === "failed";
  return (
    <Badge variant={bad ? "destructive" : ok ? "default" : "secondary"} className="capitalize">
      {status}
    </Badge>
  );
};

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "—";

const AdvancedReportsPanel = () => {
  const [rows, setRows] = useState<IntakeListRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [mode, setMode] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdvancedIntake({
        status: status === ALL ? null : (status as AdvancedReportAdminStatus),
        mode: mode === ALL ? null : (mode as "fallback" | "production"),
        search: appliedSearch,
        // Date inputs are local calendar days; `to` is inclusive of that day.
        from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
        to: to ? new Date(new Date(`${to}T00:00:00`).getTime() + 86_400_000).toISOString() : null,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(data ?? []);
    } catch (err) {
      toast.error((err as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, mode, appliedSearch, from, to, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = rows?.[0]?.total_count ?? 0;
  const resetPage = () => setOffset(0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_150px_150px_auto] items-end">
        <form
          className="space-y-1.5"
          onSubmit={(e) => { e.preventDefault(); resetPage(); setAppliedSearch(search); }}
        >
          <Label htmlFor="intake-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="intake-search"
              className="pl-8"
              placeholder="Reference, email or user ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => { resetPage(); setStatus(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as AdvancedReportAdminStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Mode</Label>
          <Select value={mode} onValueChange={(v) => { resetPage(); setMode(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All modes</SelectItem>
              <SelectItem value="fallback">Pre-approval intake</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intake-from">From</Label>
          <Input id="intake-from" type="date" value={from} onChange={(e) => { resetPage(); setFrom(e.target.value); }} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="intake-to">To</Label>
          <Input id="intake-to" type="date" value={to} onChange={(e) => { resetPage(); setTo(e.target.value); }} />
        </div>
        <Button variant="outline" onClick={() => { setAppliedSearch(search); void load(); }} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Pass</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !rows ? (
              <TableRow><TableCell colSpan={10}><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></TableCell></TableRow>
            ) : rows && rows.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-sm text-muted-foreground">No submissions match.</TableCell></TableRow>
            ) : (
              rows?.map((r) => (
                <TableRow
                  key={r.report_id}
                  className="cursor-pointer"
                  onClick={() => setSelected(r.report_id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(r.report_id); }}
                >
                  <TableCell className="font-mono text-xs whitespace-nowrap">{r.reference_number ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.user_email ?? r.user_id}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmt(r.submitted_at)}</TableCell>
                  <TableCell><Badge variant="secondary">{STATUS_LABEL[r.status] ?? r.status}</Badge></TableCell>
                  <TableCell className="text-xs">{r.processing_mode === "fallback" ? "Intake" : "Production"}</TableCell>
                  <TableCell className="text-xs">{r.definition_version ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.access_type === "analysis_pass" ? (r.pass_consumed ? "1 used" : "—") : r.access_type ?? "—"}</TableCell>
                  <TableCell><DeliveryBadge status={r.pdf_status} kind="pdf" /></TableCell>
                  <TableCell>
                    <DeliveryBadge status={r.internal_email_status} kind="email" />
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmt(r.updated_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}` : ""}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && <IntakeDetailView reportId={selected} onChanged={() => void load()} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function answerText(q: AssessmentQuestion, value: unknown): string {
  // Mirrors supabase/functions/_shared/assessment/intake/format.ts (separate
  // build target) — labels always come from the pinned definition.
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return "Not answered";
  const label = (v: unknown) => q.options?.find((o) => o.value === String(v))?.label ?? String(v);
  if (q.type === "multi_select") return (Array.isArray(value) ? value : [value]).map(label).join("; ");
  if (q.type === "product_list" && Array.isArray(value)) {
    return value
      .map((e) => (typeof e === "string" ? e : [e?.productName, e?.category, e?.frequency].filter(Boolean).join(" · ")))
      .filter(Boolean)
      .join("; ") || "Not answered";
  }
  if (q.type === "scale") return `${String(value)} / ${q.max ?? ""}`;
  return q.options?.length ? label(value) : String(value);
}

function visible(q: AssessmentQuestion, responses: Record<string, unknown>): boolean {
  if (!q.showIf) return true;
  const dep = responses[q.showIf.questionId];
  const vals = Array.isArray(dep) ? dep.map(String) : dep == null ? [] : [String(dep)];
  return vals.some((v) => q.showIf!.oneOf.includes(v));
}

const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0 text-sm">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right break-all">{v}</span>
  </div>
);

const IntakeDetailView = ({ reportId, onChanged }: { reportId: string; onChanged: () => void }) => {
  const [d, setD] = useState<IntakeDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setD(await getAdvancedIntake(reportId));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [reportId]);

  useEffect(() => {
    setD(null);
    void load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      await load();
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openPdf = async () => {
    setBusy("pdf");
    try {
      const { url } = await getAdminIntakePdfUrl(reportId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!d) return <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const isPendingIntake = d.processing_mode === "fallback" && d.intake_status === "pending";

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="font-mono">{d.reference_number ?? d.report_id}</SheetTitle>
        <SheetDescription>
          {d.processing_mode === "fallback" ? "Pre-approval intake" : "Production"} · {STATUS_LABEL[(d.intake_status ?? "processing") as AdvancedReportAdminStatus] ?? d.generation_status}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" disabled={!d.pdf.available || busy !== null} onClick={() => void openPdf()}>
          {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} View PDF
        </Button>
        {isPendingIntake && (
          <>
            <Button size="sm" variant="outline" className="gap-2" disabled={busy !== null}
              onClick={() => void run("retry", () => retryAdvancedIntake(reportId, "all"), "Queued for retry on the next worker tick")}>
              <RotateCcw className="h-3.5 w-3.5" /> Retry PDF + email
            </Button>
            <Button size="sm" variant="outline" className="gap-2" disabled={busy !== null || d.report_mode !== "production"}
              title={d.report_mode !== "production" ? "Available once report_mode is 'production'" : undefined}
              onClick={() => void run("promote", () => promoteAdvancedIntake([reportId]), "Handed to the production pipeline")}>
              <Send className="h-3.5 w-3.5" /> Send to production
            </Button>
          </>
        )}
      </div>

      <section>
        <p className="text-sm font-medium mb-1">Submission</p>
        <Row k="Account" v={d.user_email ?? "—"} />
        <Row k="User ID" v={<span className="font-mono text-xs">{d.user_id}</span>} />
        <Row k="Submitted" v={fmt(d.submitted_at)} />
        <Row k="Last updated" v={fmt(d.updated_at)} />
        <Row k="Access" v={d.access.access_type === "analysis_pass" ? `Analysis Pass${d.access.pass_consumed ? " (1 consumed)" : ""}` : d.access.access_type ?? "—"} />
        <Row k="Consent (special info / cross-border)" v={`${d.consent?.popia_special_info_consent ?? "—"} / ${d.consent?.popia_cross_border_consent ?? "—"}`} />
      </section>

      <section>
        <p className="text-sm font-medium mb-1">Versions</p>
        <Row k="Prompt set" v={d.versions.prompt_set ?? "—"} />
        <Row k="Questionnaire" v={d.versions.definition_version ?? "—"} />
        <Row k="Scoring rules" v={d.versions.scoring_version ?? "—"} />
        <Row k="Evidence catalogue" v={d.versions.evidence_version ?? "—"} />
      </section>

      {d.processing_mode === "fallback" && (
        <section>
          <p className="text-sm font-medium mb-1">Delivery</p>
          <Row k="Intake PDF" v={<DeliveryBadge status={d.pdf.status} kind="pdf" />} />
          {d.pdf.error && <Row k="PDF error" v={<span className="text-xs text-destructive">{d.pdf.error}</span>} />}
          <Row k={`Email to ${d.email.recipient ?? "reports@"}`} v={<DeliveryBadge status={d.email.status} kind="email" />} />
          <Row k="Email sent" v={fmt(d.email.sent_at)} />
          <Row k="Email attempts" v={String(d.email.attempts)} />
          {d.email.error && <Row k="Email error" v={<span className="text-xs text-destructive">{d.email.error}</span>} />}
        </section>
      )}

      {d.triage && (
        <section>
          <p className="text-sm font-medium mb-1">Red-flag floor (fixed rules)</p>
          <Row k="Result" v={<Badge variant={d.triage.triage === "clear" ? "secondary" : "destructive"}>{d.triage.triage}</Badge>} />
          {d.triage.categories.length > 0 && <Row k="Categories" v={d.triage.categories.join(", ")} />}
        </section>
      )}

      {d.scores && (
        <section className="space-y-2">
          <p className="text-sm font-medium">Deterministic scores (no AI)</p>
          <ScoresPanel scores={d.scores} />
        </section>
      )}

      <section className="space-y-3">
        <p className="text-sm font-medium">Questionnaire responses</p>
        {d.sections.map((s) => {
          const qs = s.questions.filter((q) => visible(q, d.responses));
          if (!qs.length) return null;
          return (
            <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
              {qs.map((q) => (
                <div key={q.id}>
                  <p className="text-xs text-muted-foreground">{q.prompt}</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{answerText(q, d.responses[q.id])}</p>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      {isPendingIntake && (
        <section className="space-y-2 rounded-lg border border-destructive/30 p-3">
          <p className="text-sm font-medium">Reject and refund</p>
          <p className="text-xs text-muted-foreground">Refunds the member&apos;s Analysis Pass and emails them that the request couldn&apos;t be taken forward.</p>
          <Textarea placeholder="Internal notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" variant="destructive" className="gap-2" disabled={busy !== null}
            onClick={() => void run("reject", () => rejectAdvancedIntake(reportId, notes || null), "Rejected and refunded")}>
            <XCircle className="h-3.5 w-3.5" /> Reject and refund
          </Button>
        </section>
      )}
    </div>
  );
};

export default AdvancedReportsPanel;
