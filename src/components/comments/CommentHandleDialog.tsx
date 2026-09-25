import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommentHandleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** From useCommentHandle(): resolves to an error message, or null once saved. */
  saveHandle: (handle: string) => Promise<string | null>;
  /** Called with the saved handle, e.g. to post the comment that was waiting on it. */
  onSaved: (handle: string) => void;
}

/**
 * Asked once, the first time a member comments: sign-up no longer collects a
 * username, so this is where they pick the public handle their comments show.
 */
const CommentHandleDialog = ({ open, onOpenChange, saveHandle, onSaved }: CommentHandleDialogProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const message = await saveHandle(value);
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onSaved(value.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Choose your comment handle</DialogTitle>
          <DialogDescription>
            This is the name other members see on your comments. You only need to do this once, and you can change it
            later in your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor="comment-handle">Handle</Label>
            <Input
              id="comment-handle"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="glowseeker"
              maxLength={20}
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby="comment-handle-hint"
            />
            <p id="comment-handle-hint" className="text-xs text-muted-foreground">
              3–20 letters, numbers or underscores.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={saving || !value.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save and post comment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentHandleDialog;
