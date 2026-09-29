import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AssessmentApiError, deleteAdvancedAssessmentSubmission } from "@/lib/assessment/client";

/**
 * Lets a member delete (withdraw) their own Advanced Report submission —
 * the "delete it from your dashboard at any time" promise made in the POPIA
 * consent question. Removes the answers, the report and any stored intake
 * PDF; an unreleased submission's Analysis Pass is refunded server-side.
 */
const DeleteSubmissionButton = ({
  sessionId,
  released,
  onDeleted,
}: {
  sessionId: string;
  released: boolean;
  onDeleted: () => void;
}) => {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      const { refunded } = await deleteAdvancedAssessmentSubmission(sessionId);
      toast.success(refunded ? "Deleted. Your Analysis Pass has been refunded." : "Your submission has been deleted.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof AssessmentApiError ? err.message : "Couldn't delete your submission. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Trash2 className="h-3.5 w-3.5" />
          {released ? "Delete this report" : "Withdraw and delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{released ? "Delete this report?" : "Withdraw and delete your submission?"}</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your answers{released ? " and your report" : ""} from SkinLabs. It can&apos;t be undone.
            {!released && " Your Analysis Pass will be refunded so you can use it again."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); void confirm(); }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSubmissionButton;
