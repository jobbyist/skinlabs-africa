import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminModeration, type SanctionKind } from "@/lib/community/client";
import { writeErrorMessage } from "@/lib/community/rules";

export type SanctionTarget = { kind: "member"; userId: string; label: string } | { kind: "content"; type: "post" | "comment"; id: string; label: string };

const DURATIONS: { value: string; label: string; hours: number | null }[] = [
  { value: "24", label: "24 hours", hours: 24 },
  { value: "168", label: "7 days", hours: 168 },
  { value: "720", label: "30 days", hours: 720 },
  { value: "forever", label: "Until lifted", hours: null },
];

/** Mute or suspend a member from the Community Forum. Server-side rules (staff can't be sanctioned, a reason is required) are authoritative. */
const SanctionDialog = ({ target, onClose, onDone }: { target: SanctionTarget | null; onClose: () => void; onDone: () => void }) => {
  const [kind, setKind] = useState<SanctionKind>("mute");
  const [duration, setDuration] = useState("168");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!target) return;
    const hours = DURATIONS.find((d) => d.value === duration)?.hours ?? null;
    setBusy(true);
    try {
      if (target.kind === "member") await AdminModeration.sanction(target.userId, kind, hours, reason.trim());
      else await AdminModeration.sanctionAuthor(target.type, target.id, kind, hours, reason.trim());
      toast.success(kind === "mute" ? "Member muted" : "Member suspended");
      setReason("");
      onDone();
      onClose();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "That didn't work."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restrict {target?.label ?? "member"}</DialogTitle>
          <DialogDescription>
            A mute stops posting and commenting but allows reading and reacting. A suspension also blocks reacting and hides the forum. The member sees the type and end date, not your reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sanction-kind">Action</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as SanctionKind)}>
                <SelectTrigger id="sanction-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mute">Mute</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sanction-duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="sanction-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sanction-reason">Reason (kept in the audit trail)</Label>
            <Textarea id="sanction-reason" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 300))} rows={3} placeholder="e.g. Repeated unsafe product advice after a warning" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={() => void submit()} disabled={busy || reason.trim().length < 3}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
            {kind === "mute" ? "Mute member" : "Suspend member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SanctionDialog;
