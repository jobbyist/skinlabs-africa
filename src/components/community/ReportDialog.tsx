import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reportContent } from "@/lib/community/client";
import { REPORT_REASONS, writeErrorMessage, type ReportReason } from "@/lib/community/rules";

export interface ReportTarget {
  kind: "post" | "comment";
  id: string;
}

const ReportDialog = ({ userId, target, onClose }: { userId: string; target: ReportTarget | null; onClose: () => void }) => {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setReason("spam");
      setDetails("");
    }
  }, [target]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target) return;
    setBusy(true);
    try {
      const result = await reportContent(userId, target.kind === "post" ? { post_id: target.id } : { comment_id: target.id }, reason, details);
      toast.success(result === "sent" ? "Thanks. A moderator will take a look." : "You've already reported this. A moderator will take a look.");
      onClose();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "Couldn't send your report. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="forum-ui max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Report this {target?.kind}</DialogTitle>
            <DialogDescription>Tell us what's wrong. Reports are private and reviewed by SkinLabs® moderators.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="gap-1">
            {REPORT_REASONS.map((r) => (
              <Label key={r.value} htmlFor={`report-${r.value}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 font-normal">
                <RadioGroupItem id={`report-${r.value}`} value={r.value} />
                {r.label}
              </Label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">More detail (optional)</Label>
            <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value.slice(0, 500))} rows={3} maxLength={500} className="text-base" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
