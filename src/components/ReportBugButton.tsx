import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const SUPPORT_EMAIL = "support@skinlabs.co.za";

/**
 * Dashboard bug-reporting entry point. Routes through the same support inbox
 * already published on the Contact page rather than standing up a second,
 * separately-wired feedback backend — this opens the visitor's own mail
 * client with the report pre-filled, which actually sends (unlike the
 * unwired form on /contact) instead of only appearing to.
 */
const ReportBugButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Add a quick description of what went wrong first.");
      return;
    }

    const subject = "Bug report — SkinLabs dashboard";
    const body = [
      description.trim(),
      "",
      "---",
      `Account: ${user?.email ?? "not signed in"}`,
      `Page: ${window.location.href}`,
      `Reported: ${new Date().toISOString()}`,
      `Browser: ${navigator.userAgent}`,
    ].join("\n");

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Opening your email client to send the report to our support team.");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" /> Report a Bug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
          <DialogDescription>
            Tell us what happened and we'll take a look. This opens your email client, addressed to our support
            team, with your account and page details attached.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What were you doing, what did you expect, and what happened instead?"
          rows={5}
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Send report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportBugButton;
