import { useMemo, useState } from "react";
import { Flag, Heart, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCommentLike, useCommunityComments, useContentActions, useCreateComment } from "@/hooks/use-community";
import { COMMENT_MAX, needsHandle, relativeTime, validateCommentDraft, writeErrorMessage, type CommunityComment, type CommunityPost } from "@/lib/community/rules";
import PostCard, { type PostActions } from "./PostCard";
import { AuthorAvatar, RoleBadge } from "./RoleBadge";
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

const CommentItem = ({
  comment,
  isStaff,
  onLike,
  onReport,
  onDelete,
  onRemove,
}: {
  comment: CommunityComment;
  isStaff: boolean;
  onLike: (c: CommunityComment) => void;
  onReport: (c: CommunityComment) => void;
  onDelete: (c: CommunityComment) => void;
  onRemove: (c: CommunityComment) => void;
}) => (
  <li className="flex gap-3">
    <AuthorAvatar name={comment.author_name} role={comment.author_role} size="sm" />
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
        <span className="max-w-[10rem] truncate font-semibold text-foreground">{comment.author_name}</span>
        <RoleBadge role={comment.author_role} />
        <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
          {relativeTime(comment.created_at)}
          {comment.edited_at ? " · edited" : ""}
        </time>
      </p>
      <p className="mt-0.5 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90">{comment.body}</p>
      <div className="-ml-2.5 mt-0.5 flex items-center">
        <Button
          variant="ghost"
          className={cn("h-11 min-w-11 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground", comment.liked_by_me && "text-foreground")}
          aria-pressed={comment.liked_by_me}
          aria-label={`${comment.liked_by_me ? "Unlike" : "Like"} this comment, ${comment.like_count} ${comment.like_count === 1 ? "like" : "likes"}`}
          onClick={() => onLike(comment)}
        >
          <Heart className={cn("size-4", comment.liked_by_me && "fill-current")} aria-hidden="true" />
          <span className="tabular-nums">{comment.like_count}</span>
        </Button>
        {comment.is_mine ? (
          <Button variant="ghost" className="h-11 rounded-full px-2.5 text-xs text-muted-foreground" onClick={() => onDelete(comment)} aria-label="Delete my comment">
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" className="h-11 rounded-full px-2.5 text-xs text-muted-foreground" onClick={() => onReport(comment)} aria-label="Report this comment">
            <Flag className="size-4" aria-hidden="true" />
          </Button>
        )}
        {isStaff && !comment.is_mine && (
          <Button variant="ghost" className="h-11 rounded-full px-2.5 text-xs text-destructive" onClick={() => onRemove(comment)}>
            Remove
          </Button>
        )}
      </div>
    </div>
  </li>
);

/** The discussion: post, comments and a composer, in a bottom sheet (full-height on phones, centred column on desktop). */
const ThreadSheet = ({ postId, post, loading, isStaff, onClose, ensureHandle, onReportComment, ...actions }: ThreadSheetProps) => {
  const open = Boolean(postId);
  const visible = Boolean(post && post.status === "published");
  const comments = useCommunityComments(postId, open && visible);
  const create = useCreateComment(postId ?? "");
  const likeComment = useCommentLike(postId ?? "");
  const content = useContentActions();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const list = useMemo(() => comments.data?.pages.flatMap((p) => p.comments) ?? [], [comments.data]);

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
      await create.mutateAsync(draft);
      setDraft("");
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
    <Drawer open={open} onOpenChange={(next) => !next && onClose()} repositionInputs>
      <DrawerContent className="mx-auto mt-0 flex max-h-[94dvh] min-h-[60dvh] flex-col md:max-w-2xl" aria-describedby={undefined}>
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
                <ul className="space-y-5">
                  {list.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      isStaff={isStaff}
                      onLike={likeComment}
                      onReport={onReportComment}
                      onDelete={(x) => void guarded(() => content.deleteComment(x.post_id, x.id), "Couldn't delete that comment.")}
                      onRemove={(x) => void guarded(() => content.removeComment(x.post_id, x.id), "Couldn't remove that comment.")}
                    />
                  ))}
                </ul>
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
          <form onSubmit={submit} className="border-t border-border bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3" data-vaul-no-drag>
            <label htmlFor="community-comment" className="sr-only">
              Add a comment
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id="community-comment"
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX))}
                placeholder="Add to the conversation…"
                rows={1}
                maxLength={COMMENT_MAX}
                enterKeyHint="send"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "community-comment-error" : undefined}
                className="max-h-32 min-h-11 resize-none rounded-2xl text-base"
              />
              <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full" disabled={create.isPending || draft.trim().length === 0} aria-label="Post comment">
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
