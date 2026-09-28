import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Check, CheckCircle2, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INTAKE_EXPECTED_DELIVERY } from "@/lib/assessment/types";

/**
 * Shown right after a request is received (report_mode = 'fallback').
 * Confirms RECEIPT only — the report itself is produced later through the
 * automated workflow, so nothing here reads like a result, a diagnosis or
 * a dermatologist review.
 */
const IntakeConfirmation = ({
  referenceNumber,
  onViewStatus,
}: {
  referenceNumber: string | null;
  onViewStatus: () => void;
}) => (
  <div className="max-w-xl mx-auto pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <Card className="shadow-md">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wide gradient-text">SKYNN AI</p>
          <h1 className="text-2xl font-heading font-semibold">Your Advanced AI Dermatology Analysis request has been received.</h1>
        </div>

        {referenceNumber && <ReferenceBlock referenceNumber={referenceNumber} />}

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your request is currently <span className="font-medium text-foreground">pending</span> while we complete the upgraded SKYNN AI dermatology review system and clinical approval.
          </p>
          <p>
            Your information has been securely recorded and is being prepared. You do not need to complete the
            assessment again.
          </p>
          <p className="flex items-center gap-2 text-foreground">
            <CalendarClock className="h-4 w-4 text-primary shrink-0" />
            Your report is expected to arrive in {INTAKE_EXPECTED_DELIVERY}.
          </p>
        </div>

        <IntakeDisclaimer />

        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" onClick={onViewStatus}>View Submission Status</Button>
          <Button className="flex-1" onClick={onViewStatus}>View Report Status</Button>
            <Link to="/skynn-ai">Return to SKYNN AI</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const ReferenceBlock = ({ referenceNumber }: { referenceNumber: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please note the reference down.");
    }
  };
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Reference</p>
        <p className="text-xs text-muted-foreground">Your tracking number</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => void copy()} aria-label="Copy reference number">
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export const IntakeDisclaimer = () => (
  <p className="flex gap-2 text-xs text-muted-foreground rounded-lg border border-border p-3">
    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
    <span>
      This confirms we&apos;ve received your submission. It isn&apos;t your report, a medical diagnosis or a dermatologist
      This confirms we&apos;ve received your request. It isn&apos;t your report, a medical diagnosis or a dermatologist
      released to you.
    </span>
  </p>
);

export const PendingBadge = () => (
  <Badge variant="secondary" className="gap-1.5">
    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
    Pending
  </Badge>
);

export default IntakeConfirmation;
