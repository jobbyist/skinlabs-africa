import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useCommentLike, useCommunityComments, useContentActions, useCreateComment } from "@/hooks/use-community";
import { COMMENT_MAX, needsHandle, validateCommentDraft, writeErrorMessage, type CommunityComment, type CommunityPost } from "@/lib/community/rules";
import { buildCommentTree } from "@/lib/community/commentTree";
import { useKeyboardSheet } from "@/hooks/use-keyboard-sheet";
import CommentTree from "./CommentTree";
import PostCard, { type PostActions } from "./PostCard";
import EmojiPicker from "./EmojiPicker";
import { insertAtSelection } from "@/lib/community/emoji";
import { CommentsSkeleton, FeedError, PostUnavailable } from "./ForumStates";

interface ThreadSheetProps extends Omit<PostActions, "onOpen"> {
  postId: string | null;
  post: CommunityPost | null | undefined;
  loading: boolean;
  isStaff: boolean;
  onClose: () => void;
  /** Resolves true when the member has (or just chose) a public handle. */
  ensureHandle: () => Promise<boolean>;
  onReportComment: (comment: CommunityComment) => void;
}

/** The discussion: post, comments and a composer, in a bottom sheet (full-height on phones, centred column on desktop). */
const ThreadSheet = ({ postId, post, loading, isStaff, onClose, ensureHandle, onReportComment, ...actions }: ThreadSheetProps) => {
  const open = Boolean(postId);
  const visible = Boolean(post && post.status === "published");
  const comments = useCommunityComments(postId, open && visible);
  const create = useCreateComment(postId ?? "");
  const likeComment = useCommentLike(postId ?? "");
  const content = useContentActions();
  const [draft, setDraft] = useState("");
  const composer = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = useMemo(() => comments.data?.pages.flatMap((p) => p.comments) ?? [], [comments.data]);
  const tree = useMemo(() => buildCommentTree(list), [list]);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  // Float the sheet (and its composer bar) directly above the software keyboard.
  const sheet = useKeyboardSheet(open);
  const ownsKeyboard = typeof window !== "undefined" && Boolean(window.visualViewport);

  useEffect(() => {
    setCollapsed(new Set());
    setReplyTo(null);
  }, [postId]);

  const toggleCollapsed = useCallback(
    (id: string) =>
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );
  const startReply = useCallback((comment: CommunityComment) => {
    setReplyTo(comment);
    requestAnimationFrame(() => composer.current?.focus());
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = validateCommentDraft(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    if (!(await ensureHandle())) return;
    try {
      const result = await create.mutateAsync({ body: draft, parentId: replyTo?.id ?? null });
      setDraft("");
      if (replyTo) {
        // Make sure the reply is visible: open the thread it landed in.
        const parent = replyTo.id;
        setCollapsed((prev) => (prev.has(parent) ? new Set([...prev].filter((x) => x !== parent)) : prev));
        setReplyTo(null);
      }
      if (result === null) toast.message("Thanks. A moderator will review your comment before it appears.");
    } catch (e) {
      // The handle may have been cleared server-side; the message tells the member what to do.
      setError(needsHandle(e as Error) ? "Choose a public handle to comment." : writeErrorMessage(e as Error, "Your comment didn't post. Check your connection and try again."));
    }
  };

  const guarded = async (fn: () => Promise<void>, failure: string) => {
    try {
      await fn();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, failure));
    }
  };

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()} repositionInputs={!ownsKeyboard}>
      <DrawerContent
        className="forum-ui mx-auto mt-0 flex max-h-[94dvh] min-h-[60dvh] flex-col md:max-w-2xl"
        style={{ bottom: sheet.bottom || undefined, maxHeight: sheet.maxHeight ?? undefined, minHeight: sheet.keyboardOpen ? 0 : undefined }}
        aria-describedby={undefined}
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>Discussion</DrawerTitle>
          <DrawerDescription>Discussion and comments</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-2" data-vaul-no-drag>
          {loading ? (
            <CommentsSkeleton />
          ) : !post || post.status !== "published" ? (
            <PostUnavailable onAction={onClose} />
          ) : (
            <>
              <PostCard post={post} isStaff={isStaff} detail onOpen={() => undefined} {...actions} />
              <h3 className="eyebrow mb-3 mt-6">
                {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
              </h3>
              {comments.isLoading ? (
                <CommentsSkeleton />
              ) : comments.isError ? (
                <FeedError message="Comments didn't load." onAction={() => void comments.refetch()} />
              ) : list.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No comments yet. Share what's worked for you.
                </p>
              ) : (
                <CommentTree
                  nodes={tree}
                  post={post}
                  isStaff={isStaff}
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                  onLike={likeComment}
                  onReply={startReply}
                  onReport={onReportComment}
                  onDelete={(x) => void guarded(() => content.deleteComment(x.post_id, x.id), "Couldn't delete that comment.")}
                  onRemove={(x) => void guarded(() => content.removeComment(x.post_id, x.id), "Couldn't remove that comment.")}
                />
              )}
              {comments.hasNextPage && (
                <Button variant="ghost" className="mt-3 w-full" onClick={() => void comments.fetchNextPage()} disabled={comments.isFetchingNextPage}>
                  {comments.isFetchingNextPage ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}
                  Load more comments
                </Button>
              )}
            </>
          )}
        </div>

        {visible && (
          <form
            onSubmit={submit}
            className={cn("border-t border-border bg-background px-4 pt-3", sheet.keyboardOpen ? "pb-3" : "pb-[calc(env(safe-area-inset-bottom)+0.75rem)]")}
            data-vaul-no-drag
          >
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                <span className="min-w-0 flex-1 truncate">
                  Replying to <span className="font-semibold text-foreground">{replyTo.author_name}</span>
                </span>
                <Button type="button" variant="ghost" size="icon" className="-mr-2 size-11 shrink-0 rounded-full" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
            <label htmlFor="community-comment" className="sr-only">
              {replyTo ? `Reply to ${replyTo.author_name}` : "Add a comment"}
            </label>
            <div className="flex items-end gap-1">
              <EmojiPicker
                className="shrink-0"
                onPick={(emoji) => {
                  const el = composer.current;
                  const next = insertAtSelection(draft, emoji, el?.selectionStart ?? null, el?.selectionEnd ?? null, COMMENT_MAX);
                  setDraft(next.text);
                  requestAnimationFrame(() => el?.setSelectionRange(next.caret, next.caret));
                }}
              />
              <Textarea
                id="community-comment"
                ref={composer}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX))}
                placeholder={replyTo ? `Reply to ${replyTo.author_name}…` : "Add to the conversation…"}
                rows={1}
                maxLength={COMMENT_MAX}
                enterKeyHint="send"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "community-comment-error" : undefined}
                className="max-h-32 min-h-11 resize-none rounded-2xl text-base"
              />
              <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={create.isPending || draft.trim().length === 0} aria-label={replyTo ? "Post reply" : "Post comment"}>
                {create.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
              </Button>
            </div>
            {error && (
              <p id="community-comment-error" role="alert" className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ThreadSheet;
