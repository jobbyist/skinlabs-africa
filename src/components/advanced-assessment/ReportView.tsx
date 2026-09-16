import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdvancedDermatologyReport } from "@/lib/assessment/types";
import { logRoutineHandoffClicked } from "@/lib/assessment/client";

interface ReportViewProps {
  report: AdvancedDermatologyReport;
  sessionId: string;
}

const CONFIDENCE_COPY: Record<AdvancedDermatologyReport["confidence"], string> = {
  high: "High confidence — based on a thorough profile",
  moderate: "Moderate confidence — based on the information provided",
  limited: "Limited confidence — a few answers would sharpen this further",
};

/** Progressive reveal via accordion sections (section 34) — never a single
 *  wall of text. Safety guidance always renders first and un-collapsed when
 *  it applies, since that's the one section that shouldn't require a click
 *  to see. */
const ReportView = ({ report, sessionId }: ReportViewProps) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <div className="space-y-2">
      <Badge variant="secondary" className="gradient-bg-soft">
        {CONFIDENCE_COPY[report.confidence]}
      </Badge>
      <h1 className="text-2xl font-heading font-semibold">Your Advanced Dermatology Report</h1>
      <p className="text-muted-foreground">{report.summary}</p>
    </div>

    {report.safetyFlags.requiresProfessionalReview && (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">When to see a professional</p>
            <p className="text-sm text-muted-foreground mt-1">{report.safetyFlags.userMessage}</p>
          </div>
        </CardContent>
      </Card>
    )}

    <Accordion type="multiple" defaultValue={["profile", "concerns"]} className="w-full">
      <AccordionItem value="profile">
        <AccordionTrigger>Your Skin Profile</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <p className="text-sm font-medium">{report.skinProfile.skinType}</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {report.skinProfile.keyTraits.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="findings">
        <AccordionTrigger>What Stands Out</AccordionTrigger>
        <AccordionContent>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {report.observations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="concerns">
        <AccordionTrigger>Your Primary Concerns</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {report.primaryConcerns
            .sort((a, b) => a.priority - b.priority)
            .map((c) => (
              <div key={c.concern}>
                <p className="text-sm font-medium">{c.concern}</p>
                <p className="text-sm text-muted-foreground">{c.rationale}</p>
              </div>
            ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="factors">
        <AccordionTrigger>What&apos;s Likely Contributing</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {report.contributingFactors.map((f) => (
            <div key={f.factor}>
              <p className="text-sm font-medium">{f.factor}</p>
              <p className="text-sm text-muted-foreground">{f.explanation}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="routine">
        <AccordionTrigger>Routine Assessment</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Working well</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              {report.routineAssessment.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Gaps</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              {report.routineAssessment.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="ingredients">
        <AccordionTrigger>Ingredient Strategy</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {report.ingredientGuidance.map((g) => (
            <div key={g.ingredientOrCategory}>
              <p className="text-sm font-medium">{g.ingredientOrCategory}</p>
              <p className="text-sm text-muted-foreground">{g.guidance}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="direction">
        <AccordionTrigger>Recommended Routine Direction</AccordionTrigger>
        <AccordionContent className="space-y-2">
          <p className="text-sm"><span className="font-medium">AM focus:</span> {report.routineStrategy.amFocus}</p>
          <p className="text-sm"><span className="font-medium">PM focus:</span> {report.routineStrategy.pmFocus}</p>
          <p className="text-sm text-muted-foreground">{report.routineStrategy.notes}</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="avoid">
        <AccordionTrigger>What to Avoid</AccordionTrigger>
        <AccordionContent>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {report.whatToAvoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      {report.evidence.length > 0 && (
        <AccordionItem value="evidence">
          <AccordionTrigger>Evidence</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {report.evidence.map((e) => (
              <p key={e.id} className="text-xs text-muted-foreground">
                {e.title}
                {e.publisher ? ` — ${e.publisher}` : ""}
              </p>
            ))}
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>

    {report.uncertainties.length > 0 && (
      <p className="text-xs text-muted-foreground italic">
        Based on the information provided — a few things would sharpen this further: {report.uncertainties.join("; ")}.
      </p>
    )}

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

    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <Sparkles className="h-3.5 w-3.5" />
      This report is AI-generated cosmetic skincare guidance and does not replace a diagnosis from a doctor or dermatologist.
    </p>
  </div>
);

export default ReportView;
