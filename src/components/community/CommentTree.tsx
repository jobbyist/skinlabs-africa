import { Flag, Heart, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_INDENT_DEPTH, collapsedSummary, isOriginalPoster, type CommentNode } from "@/lib/community/commentTree";
import Markdown from "@/lib/community/markdown";
import { relativeTime, type CommunityComment, type CommunityPost } from "@/lib/community/rules";
import { AuthorAvatar, RoleBadge } from "./RoleBadge";

export interface CommentActions {
  onLike: (c: CommunityComment) => void;
  onReply: (c: CommunityComment) => void;
  onReport: (c: CommunityComment) => void;
  onDelete: (c: CommunityComment) => void;
  onRemove: (c: CommunityComment) => void;
}

interface CommentTreeProps extends CommentActions {
  nodes: CommentNode[];
  post: Pick<CommunityPost, "is_mine" | "author_name" | "author_role">;
  isStaff: boolean;
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
  /** Name of the parent when this list is rendered below the indent limit (shown as "replying to"). */
  replyingTo?: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary";

/** One level of the thread; recurses for replies. Tapping a comment's header or its guide line collapses everything beneath it. */
const CommentTree = ({ nodes, replyingTo, ...ctx }: CommentTreeProps) => (
  <ul className="space-y-4">
    {nodes.map((node) => (
      <CommentRow key={node.comment.id} node={node} replyingTo={replyingTo} {...ctx} />
    ))}
  </ul>
);

const CommentRow = ({ node, replyingTo, ...ctx }: Omit<CommentTreeProps, "nodes"> & { node: CommentNode }) => {
  const { comment, children, descendants } = node;
  const { post, isStaff, collapsed, onToggle, onLike, onReply, onReport, onDelete, onRemove } = ctx;
  const isCollapsed = collapsed.has(comment.id);
  const op = isOriginalPoster(post, comment);
  // Past the indent limit replies stay in the same column instead of squeezing the text.
  const indent = node.depth < MAX_INDENT_DEPTH;

  if (isCollapsed) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(comment.id)}
          aria-expanded={false}
          className={cn("flex min-h-11 w-full items-center gap-2 rounded-xl px-1 text-left text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground", FOCUS)}
        >
          <span aria-hidden="true" className="font-mono text-xs font-semibold">[ + ]</span>
          <span className="min-w-0 truncate">{collapsedSummary(comment.author_name, descendants)}</span>
          {op && <OpPill />}
        </button>
      </li>
    );
  }

  return (
    <li>
      <div className="flex gap-3">
        <AuthorAvatar name={comment.author_name} role={comment.author_role} avatarPath={comment.author_avatar} size="sm" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggle(comment.id)}
            aria-expanded
            aria-label={`Collapse ${comment.author_name}'s comment${descendants ? ` and ${descendants} ${descendants === 1 ? "reply" : "replies"}` : ""}`}
            className={cn("-my-1 flex w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md py-1 text-left text-sm", FOCUS)}
          >
            <span className="max-w-[10rem] truncate font-semibold text-foreground">{comment.author_name}</span>
            <RoleBadge role={comment.author_role} />
            {op && <OpPill />}
            <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
              {relativeTime(comment.created_at)}
              {comment.edited_at ? " · edited" : ""}
            </time>
          </button>
          {replyingTo && <p className="text-xs text-muted-foreground">Replying to {replyingTo}</p>}
          <Markdown source={comment.body} className="mt-0.5 text-foreground/90" />
          <div className="-ml-2.5 mt-0.5 flex flex-wrap items-center">
            <Button
              variant="ghost"
              data-haptic
              className={cn("h-11 min-w-11 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground", FOCUS, comment.liked_by_me && "text-foreground")}
              aria-pressed={comment.liked_by_me}
              aria-label={`${comment.liked_by_me ? "Unlike" : "Like"} this comment, ${comment.like_count} ${comment.like_count === 1 ? "like" : "likes"}`}
              onClick={() => onLike(comment)}
            >
              <Heart className={cn("size-4 transition-[fill] duration-200", comment.liked_by_me ? "fill-primary" : "fill-transparent")} aria-hidden="true" />
              <span className="tabular-nums">{comment.like_count}</span>
            </Button>
            <Button variant="ghost" className={cn("h-11 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground", FOCUS)} onClick={() => onReply(comment)} aria-label={`Reply to ${comment.author_name}`}>
              <MessageCircle className="size-4" aria-hidden="true" /> Reply
            </Button>
            {comment.is_mine ? (
              <Button variant="ghost" className={cn("h-11 rounded-full px-2.5 text-xs text-muted-foreground", FOCUS)} onClick={() => onDelete(comment)} aria-label="Delete my comment">
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="ghost" className={cn("h-11 rounded-full px-2.5 text-xs text-muted-foreground", FOCUS)} onClick={() => onReport(comment)} aria-label="Report this comment">
                <Flag className="size-4" aria-hidden="true" />
              </Button>
            )}
            {isStaff && !comment.is_mine && (
              <Button variant="ghost" className={cn("h-11 rounded-full px-2.5 text-xs text-destructive", FOCUS)} onClick={() => onRemove(comment)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {children.length > 0 &&
        (indent ? (
          // The guide line sits under the avatar's centre. Its button is a 24px-wide strip over the line; hovering it lights the line.
          <div className="relative ml-4 mt-1 pl-4">
            <button
              type="button"
              onClick={() => onToggle(comment.id)}
              aria-label={`Collapse the ${descendants} ${descendants === 1 ? "reply" : "replies"} to ${comment.author_name}`}
              className="peer absolute inset-y-0 -left-3 z-[1] w-6 rounded-full focus-visible:outline-none"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 border-l-2 border-border/60 transition-colors peer-hover:border-primary peer-focus-visible:border-primary" />
            <CommentTree nodes={children} {...ctx} />
          </div>
        ) : (
          <div className="mt-4">
            <CommentTree nodes={children} replyingTo={comment.author_name} {...ctx} />
          </div>
        ))}
    </li>
  );
};

const OpPill = () => (
  <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-primary-foreground" title="Original poster" aria-label="Original poster">
    OP
  </span>
);

export default CommentTree;
