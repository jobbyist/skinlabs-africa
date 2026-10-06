import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReminderOptIn from "./ReminderOptIn";
import ReportReadyOptIn from "./ReportReadyOptIn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  clockTime?: string;
  /** "report": the member asked to be notified when their report is ready (instead of a routine reminder). */
  purpose?: "routine" | "report";
}

/**
 * Shown once, the first time the member opens the INSTALLED app after asking for reminders from an iPhone Safari tab
 * (they flagged the intent on Welcome / the checklist). It only wraps the same soft ask; the native permission dialog
 * still waits for the member to tap "Allow reminders".
 */
const ReminderIntentSheet = ({ open, onOpenChange, userId, clockTime, purpose = "routine" }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-4 rounded-2xl p-6">
      <DialogHeader className="text-left">
        <DialogTitle className="font-heading text-xl">Welcome to the app</DialogTitle>
        <DialogDescription>{purpose === "report" ? "You asked to be notified when your report is ready. Turn that on for this device." : "You asked for routine reminders. Turn them on for this device."}</DialogDescription>
      </DialogHeader>
      {purpose === "report" ? <ReportReadyOptIn /> : <ReminderOptIn surface="welcome" userId={userId} clockTime={clockTime} />}
      <Button variant="ghost" onClick={() => onOpenChange(false)}>Not now</Button>
    </DialogContent>
  </Dialog>
);

export default ReminderIntentSheet;
