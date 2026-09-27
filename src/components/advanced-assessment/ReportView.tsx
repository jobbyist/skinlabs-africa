import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdvancedDermatologyReportV2, CitedSource } from "@/lib/assessment/types";
import { logRoutineHandoffClicked } from "@/lib/assessment/client";
import ReportMarkdown from "./ReportMarkdown";
import ScoresPanel from "./ScoresPanel";

interface ReportViewProps {
  report: AdvancedDermatologyReportV2;
  sessionId: string;
  releasedAt?: string | null;
}

const CONFIDENCE_COPY: Record<AdvancedDermatologyReportV2["confidence"], string> = {
  high: "High confidence — based on a thorough profile",
  moderate: "Moderate confidence — based on the information provided",
  limited: "Limited confidence — a few answers would sharpen this further",
};

function sourceLine(s: CitedSource): string {
  return [s.title, s.publisher, s.year].filter(Boolean).join(" · ");
}

/**
 * SKYNN AI v2 report. The body is the QA-approved, human-reviewed Markdown
 * (exactly what the SkinLabs reviewer approved); scores are the
 * deterministic, clearly-labelled self-reported measures; sources are the
 * server's own evidence records, never the model's restatement of them.
 * Any safety escalation renders first and can't be collapsed.
 */
const ReportView = ({ report, sessionId, releasedAt }: ReportViewProps) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gradient-bg-soft">{CONFIDENCE_COPY[report.confidence]}</Badge>
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="h-3 w-3" /> Reviewed by SkinLabs{releasedAt ? ` · ${new Date(releasedAt).toLocaleDateString("en-ZA")}` : ""}
        </Badge>
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide gradient-text">SKYNN AI</p>
      <h1 className="text-2xl font-heading font-semibold">Your Advanced AI Dermatology Report</h1>
      <p className="text-muted-foreground">{report.summary}</p>
    </div>

    {report.triage.level !== "clear" && report.triage.message && (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Please read this first</p>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{report.triage.message}</p>
          </div>
        </CardContent>
      </Card>
    )}

    <ScoresPanel scores={report.scores} />

    <Card>
      <CardContent className="pt-6">
        <ReportMarkdown markdown={report.markdown} />
      </CardContent>
    </Card>

    <Accordion type="multiple" className="w-full">
      {report.evidence.length > 0 && (
        <AccordionItem value="sources">
          <AccordionTrigger>
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Sources for this report</span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-2">
              {report.evidence.map((s) => (
                <li key={s.code} id={`cite-${s.code}`} className="text-xs text-muted-foreground scroll-mt-28">
                  <span className="font-semibold text-foreground mr-1">[{s.code}]</span>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {sourceLine(s)}
                    </a>
                  ) : (
                    sourceLine(s)
                  )}
                  {s.pmid && <span> · PMID {s.pmid}</span>}
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      )}
      {report.methodology.length > 0 && (
        <AccordionItem value="method">
          <AccordionTrigger>How SKYNN AI scores your answers</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Your scores are calculated by fixed rules from your own answers — the same answers always give the same
              scores. They use SkinLabs&apos; own questions, modelled on the structure of these published methods, and are
              not clinical gradings.
            </p>
            <ol className="space-y-2">
              {report.methodology.map((s) => (
                <li key={s.code} className="text-xs text-muted-foreground">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {sourceLine(s)}
                    </a>
                  ) : (
                    sourceLine(s)
                  )}
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>

    <Card className="gradient-border-anim border-transparent">
      <CardContent className="pt-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm">Turn this into your Smart Routine</p>
          <p className="text-xs text-muted-foreground">Carry these recommendations into your daily routine tracker.</p>
        </div>
        <Button asChild size="sm" className="gap-2 shrink-0" onClick={() => void logRoutineHandoffClicked(sessionId)}>
          <Link to="/dashboard?tab=routine">
            Go to Smart Routines
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>

    <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
      {report.disclaimers.map((d) => (
        <p key={d} className="text-xs text-muted-foreground">{d}</p>
      ))}
    </div>
  </div>
);

export default ReportView;
