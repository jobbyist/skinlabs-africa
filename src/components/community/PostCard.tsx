import { memo, useEffect, useRef, useState } from "react";
import { ArrowBigUp, Clock, Flag, MessageCircle, MoreHorizontal, Pin, PinOff, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relativeTime, type CommunityPost } from "@/lib/community/rules";
import { mediaUrl } from "@/lib/community/client";
import { AuthorAvatar, RoleBadge } from "./RoleBadge";
import Markdown from "@/lib/community/markdown";

export interface PostActions {
  onOpen: (post: CommunityPost) => void;
  onLike: (post: CommunityPost) => void;
  onShare: (post: CommunityPost) => void;
  onReport: (post: CommunityPost) => void;
  onDelete: (post: CommunityPost) => void;
  onRemove: (post: CommunityPost) => void;
  onPin: (post: CommunityPost) => void;
}

interface PostCardProps extends PostActions {
  post: CommunityPost;
  isStaff: boolean;
  /** Full thread view: show the whole body, no "open" affordances. */
  detail?: boolean;
}

const ACTION = "h-9 min-w-9 gap-1.5 rounded-full bg-muted/60 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground";

/** The count slides in when it changes (not on first paint), with tabular figures so the rail never shifts width. */
const VoteCount = ({ value, active }: { value: number; active: boolean }) => {
  const first = useRef(value);
  return (
    <span
      key={value}
      aria-hidden="true"
      className={cn(
        "text-xs font-bold tabular-nums transition-colors duration-200",
        active ? "text-primary" : "text-foreground",
        value !== first.current && "animate-in fade-in slide-in-from-bottom-1 duration-200",
      )}
    >
      {value}
    </span>
  );
};

/**
 * Left vote rail. The column stays w-11/w-12; the button fills it (44px wide, 44px tall) so the thumb target is generous
 * without widening the card. A light haptic pulse comes from the app's delegated `data-haptic` listener (touch only).
 */
const VoteRail = ({ post, onLike }: { post: CommunityPost; onLike: (post: CommunityPost) => void }) => {
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (!bounce) return;
    const t = window.setTimeout(() => setBounce(false), 400);
    return () => window.clearTimeout(t);
  }, [bounce]);
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-0 bg-muted/50 py-1.5 sm:w-12">
      <button
        type="button"
        data-haptic
        aria-pressed={post.liked_by_me}
        aria-label={`${post.liked_by_me ? "Remove upvote from" : "Upvote"} this post, ${post.like_count} ${post.like_count === 1 ? "upvote" : "upvotes"}`}
        onClick={() => {
          if (!post.liked_by_me) setBounce(true);
          onLike(post);
        }}
        className="group flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary sm:w-12"
      >
        <span className={cn("flex size-9 items-center justify-center rounded-full transition-colors duration-200 group-hover:bg-background group-active:bg-background", post.liked_by_me ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          <ArrowBigUp
            className={cn(
              "size-6 transition-[fill,color,transform] duration-200 ease-out group-active:scale-90",
              post.liked_by_me ? "fill-primary" : "fill-transparent",
              bounce && "animate-vote-bounce",
            )}
            aria-hidden="true"
          />
        </span>
      </button>
      <VoteCount value={post.like_count} active={post.liked_by_me} />
    </div>
  );
};

const PostCard = ({ post, isStaff, detail = false, ...actions }: PostCardProps) => {
  const label = `${post.author_name}${post.author_role !== "member" ? `, ${post.author_role}` : ""}`;
  return (
    <article
      aria-label={post.title}
      className={cn("flex overflow-hidden rounded-2xl border border-border bg-card transition-colors", !detail && "hover:border-foreground/30", post.pinned && "border-foreground/30")}
    >
      <VoteRail post={post} onLike={actions.onLike} />
      <div className="min-w-0 flex-1 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <AuthorAvatar name={post.author_name} role={post.author_role} avatarPath={post.author_avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground" title={label}>
              {post.author_name}
            </span>
            <RoleBadge role={post.author_role} />
          </div>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString("en-ZA")}>
              {relativeTime(post.created_at)}
            </time>
            {post.edited_at && <span>· edited</span>}
            {post.category_name && <span className="truncate">· {post.category_name}</span>}
            {post.pinned && (
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                · <Pin className="size-3" aria-hidden="true" /> Pinned
              </span>
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 size-11 shrink-0 rounded-full text-muted-foreground" aria-label={`More actions for “${post.title}”`}>
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!post.is_mine && (
              <DropdownMenuItem onSelect={() => actions.onReport(post)}>
                <Flag className="mr-2 size-4" aria-hidden="true" /> Report
              </DropdownMenuItem>
            )}
            {post.is_mine && (
              <DropdownMenuItem onSelect={() => actions.onDelete(post)}>
                <Trash2 className="mr-2 size-4" aria-hidden="true" /> Delete my post
              </DropdownMenuItem>
            )}
            {isStaff && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => actions.onPin(post)}>
                  {post.pinned ? <PinOff className="mr-2 size-4" aria-hidden="true" /> : <Pin className="mr-2 size-4" aria-hidden="true" />}
                  {post.pinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
                {!post.is_mine && (
                  <DropdownMenuItem onSelect={() => actions.onRemove(post)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 size-4" aria-hidden="true" /> Remove (moderator)
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {detail ? (
        <h2 className="mt-3 break-words font-heading text-xl font-semibold leading-snug tracking-tight text-foreground">{post.title}</h2>
      ) : (
        <h2 className="mt-3 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">
          <button
            type="button"
            onClick={() => actions.onOpen(post)}
            className="line-clamp-3 break-words rounded text-left [text-wrap:balance] hover:underline focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary"
          >
            {post.title}
          </button>
        </h2>
      )}
      <Markdown source={post.body} preview={!detail} className="mt-2" />

      {post.image_path && (
        <a href={mediaUrl("community-media", post.image_path) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary">
          <img
            src={mediaUrl("community-media", post.image_path) ?? undefined}
            alt={`Image shared with “${post.title}”`}
            width={post.image_w ?? undefined}
            height={post.image_h ?? undefined}
            loading="lazy"
            decoding="async"
            className="mx-auto max-h-[28rem] w-full object-contain"
          />
        </a>
      )}

      {post.status === "held" && (
        <p role="status" className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Awaiting moderator review. Only you and moderators can see this for now.
        </p>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          className={ACTION}
          aria-label={`${post.comment_count} ${post.comment_count === 1 ? "comment" : "comments"}${detail ? "" : ", open discussion"}`}
          onClick={() => actions.onOpen(post)}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          <span className="tabular-nums">{post.comment_count}</span>
          <span className="hidden min-[400px]:inline">{post.comment_count === 1 ? "comment" : "comments"}</span>
        </Button>
        <Button variant="ghost" className={ACTION} aria-label="Share this discussion" onClick={() => actions.onShare(post)}>
          <Share2 className="size-4" aria-hidden="true" />
          <span>Share</span>
        </Button>
      </footer>
      </div>
    </article>
  );
};

export default memo(PostCard);
