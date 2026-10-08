import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePost } from "@/hooks/use-community";
import { removeMedia, uploadMedia, type PostImage } from "@/lib/community/client";
import { insertAtSelection } from "@/lib/community/emoji";
import { ImageError, prepareCommunityImage, type PreparedImage } from "@/lib/community/image";
import { BODY_MAX, TITLE_MAX, needsHandle, validatePostDraft, writeErrorMessage, type CommunityCategory, type FieldErrors } from "@/lib/community/rules";
import EmojiPicker from "./EmojiPicker";

const NO_TOPIC = "none";
const DRAFT_KEY = "skinlabs:community-draft";
/** Anything submitted faster than this after opening the sheet, with a long body, is a script, not a person. */
const MIN_FILL_MS = 1500;

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

interface Attachment {
  prepared: PreparedImage;
  previewUrl: string;
}

interface ComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CommunityCategory[];
  defaultCategory?: string | null;
  ensureHandle: () => Promise<boolean>;
  /** Called with the new post id after it is published and already at the top of the feed. */
  onPublished: (id: string, held: boolean) => void;
}

/** Start a discussion: text, emojis, one photo or GIF. The draft survives an accidental close (this tab only) and clears on publish. */
const ComposeSheet = ({ open, onOpenChange, categories, defaultCategory, ensureHandle, onPublished }: ComposeSheetProps) => {
  const { user } = useAuth();
  const create = useCreatePost();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(NO_TOPIC);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const openedAt = useRef(0);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const gifInput = useRef<HTMLInputElement | null>(null);

  const clearAttachment = () =>
    setAttachment((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });

  useEffect(() => {
    if (!open) return;
    const saved = readDraft();
    setTitle(saved?.title ?? "");
    setBody(saved?.body ?? "");
    setCategory(saved?.category ?? defaultCategory ?? NO_TOPIC);
    setErrors({});
    setFormError(null);
    setHoneypot("");
    openedAt.current = Date.now();
  }, [open, defaultCategory]);

  useEffect(() => {
    if (!open) clearAttachment();
  }, [open]);

  useEffect(() => {
    if (open) writeDraft({ title, body, category });
  }, [open, title, body, category]);

  const addEmoji = (emoji: string) => {
    const el = bodyRef.current;
    const next = insertAtSelection(body, emoji, el?.selectionStart ?? null, el?.selectionEnd ?? null, BODY_MAX);
    setBody(next.text);
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true });
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFormError(null);
    setProcessing(true);
    try {
      const prepared = await prepareCommunityImage(file);
      clearAttachment();
      setAttachment({ prepared, previewUrl: URL.createObjectURL(prepared.blob) });
      if (prepared.note) toast.message(prepared.note);
    } catch (e) {
      setFormError(e instanceof ImageError ? e.message : "We couldn't process that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (publishing) return;
    const found = validatePostDraft(title, body);
    setErrors(found);
    setFormError(null);
    if (found.title || found.body) return;
    // Bots fill hidden fields and submit instantly. Pretend it worked; send nothing.
    if (honeypot || (Date.now() - openedAt.current < MIN_FILL_MS && body.length > 200)) {
      toast.success("Your discussion is live");
      onOpenChange(false);
      return;
    }
    if (!user || !(await ensureHandle())) return;
    setPublishing(true);
    let uploaded: string | null = null;
    try {
      let image: PostImage | null = null;
      if (attachment) {
        uploaded = await uploadMedia("community-media", user.id, attachment.prepared);
        image = { path: uploaded, width: attachment.prepared.width, height: attachment.prepared.height };
      }
      const post = await create.mutateAsync({ title, body, category: category === NO_TOPIC ? null : category, image });
      writeDraft(null);
      const held = post.status === "held";
      toast.success(held ? "Thanks. A moderator will review your post before it appears." : "Your discussion is live");
      onOpenChange(false);
      onPublished(post.id, held);
    } catch (e) {
      if (uploaded) removeMedia("community-media", [uploaded]);
      setFormError(needsHandle(e as Error) ? "Choose a public handle to post." : writeErrorMessage(e as Error, "We couldn't publish that. Your draft is still here — try again."));
    } finally {
      setPublishing(false);
    }
  };

  const busy = publishing || processing;

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
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                placeholder="Share your skin type, where you live and what you've tried. Don't include personal contact details."
                rows={6}
                maxLength={BODY_MAX}
                className="min-h-36 text-base"
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? "community-body-error" : "community-body-count"}
              />
              <div className="-ml-2 flex items-center gap-1">
                <EmojiPicker onPick={addEmoji} disabled={busy} />
                <Button type="button" variant="ghost" className="h-11 gap-1.5 rounded-full px-3 text-sm text-muted-foreground" disabled={busy || Boolean(attachment)} onClick={() => photoInput.current?.click()}>
                  <ImagePlus className="size-5" aria-hidden="true" /> Photo
                </Button>
                <Button type="button" variant="ghost" className="h-11 rounded-full px-3 text-sm font-semibold tracking-wide text-muted-foreground" disabled={busy || Boolean(attachment)} onClick={() => gifInput.current?.click()} aria-label="Add a GIF">
                  GIF
                </Button>
                <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Choose a photo" onChange={onFile} />
                <input ref={gifInput} type="file" accept="image/gif" className="sr-only" tabIndex={-1} aria-label="Choose a GIF" onChange={onFile} />
                <span id="community-body-count" className="ml-auto pr-2 text-xs tabular-nums text-muted-foreground">
                  {body.length}/{BODY_MAX}
                </span>
              </div>
              {errors.body && (
                <p id="community-body-error" role="alert" className="text-sm text-destructive">
                  {errors.body}
                </p>
              )}
            </div>

            {processing && (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Optimising your image…
              </p>
            )}
            {attachment && (
              <figure className="relative overflow-hidden rounded-2xl border border-border bg-muted">
                <img src={attachment.previewUrl} alt="Preview of your attached image" width={attachment.prepared.width} height={attachment.prepared.height} className="max-h-64 w-full object-contain" />
                <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2 size-10 rounded-full shadow" onClick={clearAttachment} aria-label="Remove image" disabled={publishing}>
                  <X className="size-5" aria-hidden="true" />
                </Button>
                {attachment.prepared.note && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{attachment.prepared.note}</figcaption>}
              </figure>
            )}

            {/* Honeypot: invisible to people and assistive tech, irresistible to form-filling bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="community-website">Website</label>
              <input id="community-website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {formError && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => onOpenChange(false)} disabled={publishing}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-bg h-11 flex-[2] border-0 hover:opacity-90" disabled={busy}>
              {publishing ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default ComposeSheet;
