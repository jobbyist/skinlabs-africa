import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePost } from "@/hooks/use-community";
import { BODY_MAX, TITLE_MAX, needsHandle, validatePostDraft, writeErrorMessage, type CommunityCategory, type FieldErrors } from "@/lib/community/rules";

const NO_TOPIC = "none";
const DRAFT_KEY = "skinlabs:community-draft";

const readDraft = (): { title: string; body: string; category: string } | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as { title: string; body: string; category: string }) : null;
  } catch {
    return null;
  }
};
const writeDraft = (value: { title: string; body: string; category: string } | null) => {
  try {
    if (value && (value.title || value.body)) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* private mode: the draft just isn't kept */
  }
};

interface ComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CommunityCategory[];
  defaultCategory?: string | null;
  ensureHandle: () => Promise<boolean>;
  /** Called with the new post id after it is published and already at the top of the feed. */
  onPublished: (id: string) => void;
}

/** Start a discussion. The draft survives an accidental close (this tab only) and clears on publish. */
const ComposeSheet = ({ open, onOpenChange, categories, defaultCategory, ensureHandle, onPublished }: ComposeSheetProps) => {
  const create = useCreatePost();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(NO_TOPIC);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const saved = readDraft();
    setTitle(saved?.title ?? "");
    setBody(saved?.body ?? "");
    setCategory(saved?.category ?? defaultCategory ?? NO_TOPIC);
    setErrors({});
    setFormError(null);
  }, [open, defaultCategory]);

  useEffect(() => {
    if (open) writeDraft({ title, body, category });
  }, [open, title, body, category]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validatePostDraft(title, body);
    setErrors(found);
    setFormError(null);
    if (found.title || found.body) return;
    if (!(await ensureHandle())) return;
    try {
      const post = await create.mutateAsync({ title, body, category: category === NO_TOPIC ? null : category });
      writeDraft(null);
      toast.success("Your discussion is live");
      onOpenChange(false);
      onPublished(post.id);
    } catch (e) {
      setFormError(needsHandle(e as Error) ? "Choose a public handle to post." : writeErrorMessage(e as Error, "We couldn't publish that. Your draft is still here — try again."));
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs>
      <DrawerContent className="mx-auto mt-0 flex max-h-[94dvh] flex-col md:max-w-2xl" aria-describedby={undefined}>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-xl">Start a discussion</DrawerTitle>
          <DrawerDescription>Ask a question or share what's worked. Be kind, and see a doctor for anything persistent.</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col" data-vaul-no-drag>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="community-title">Title</Label>
              <Input
                id="community-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="What would you like to talk about?"
                maxLength={TITLE_MAX}
                autoComplete="off"
                className="h-11 text-base"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "community-title-error" : undefined}
              />
              {errors.title && (
                <p id="community-title-error" role="alert" className="text-sm text-destructive">
                  {errors.title}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-topic">Topic (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="community-topic" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TOPIC}>No topic</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="community-body">Details</Label>
              <Textarea
                id="community-body"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                placeholder="Share your skin type, where you live and what you've tried. Don't include personal contact details."
                rows={7}
                maxLength={BODY_MAX}
                className="min-h-40 text-base"
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? "community-body-error" : "community-body-count"}
              />
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                {errors.body ? (
                  <p id="community-body-error" role="alert" className="text-sm text-destructive">
                    {errors.body}
                  </p>
                ) : (
                  <span />
                )}
                <span id="community-body-count" className="tabular-nums">
                  {body.length}/{BODY_MAX}
                </span>
              </div>
            </div>
            {formError && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-bg h-11 flex-[2] border-0 hover:opacity-90" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {create.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default ComposeSheet;
