import { memo } from "react";
import { Clock, Flag, Heart, MessageCircle, MoreHorizontal, Pin, PinOff, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { relativeTime, type CommunityPost } from "@/lib/community/rules";
import { mediaUrl } from "@/lib/community/client";
import { AuthorAvatar, RoleBadge } from "./RoleBadge";

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

const ACTION = "h-11 min-w-11 gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground";

const PostCard = ({ post, isStaff, detail = false, ...actions }: PostCardProps) => {
  const label = `${post.author_name}${post.author_role !== "member" ? `, ${post.author_role}` : ""}`;
  return (
    <article
      aria-label={post.title}
      className={cn("rounded-3xl border border-border bg-card p-5 transition-colors", !detail && "hover:border-foreground/20", post.pinned && "border-foreground/25")}
    >
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
        <h2 className="mt-4 break-words font-heading text-xl font-semibold leading-snug tracking-tight text-foreground">{post.title}</h2>
      ) : (
        <h2 className="mt-4 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">
          <button
            type="button"
            onClick={() => actions.onOpen(post)}
            className="line-clamp-3 break-words rounded text-left [text-wrap:balance] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </button>
        </h2>
      )}
      <p className={cn("mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/85 [text-wrap:pretty]", !detail && "line-clamp-4")}>{post.body}</p>

      {post.image_path && (
        <a href={mediaUrl("community-media", post.image_path) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-2xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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

      <footer className="-mx-2 mt-3 flex items-center gap-1 border-t border-border/60 pt-2">
        <Button
          variant="ghost"
          className={cn(ACTION, post.liked_by_me && "text-foreground")}
          aria-pressed={post.liked_by_me}
          aria-label={`${post.liked_by_me ? "Unlike" : "Like"} this post, ${post.like_count} ${post.like_count === 1 ? "like" : "likes"}`}
          onClick={() => actions.onLike(post)}
        >
          <Heart className={cn("size-5 transition-transform", post.liked_by_me && "scale-110 fill-current")} aria-hidden="true" />
          <span className="tabular-nums">{post.like_count}</span>
          {post.liked_by_me && <span className="sr-only">Liked</span>}
        </Button>
        <Button
          variant="ghost"
          className={ACTION}
          aria-label={`${post.comment_count} ${post.comment_count === 1 ? "comment" : "comments"}${detail ? "" : ", open discussion"}`}
          onClick={() => actions.onOpen(post)}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span className="tabular-nums">{post.comment_count}</span>
        </Button>
        <Button variant="ghost" className={cn(ACTION, "ml-auto")} aria-label="Share this discussion" onClick={() => actions.onShare(post)}>
          <Share2 className="size-5" aria-hidden="true" />
          <span className="hidden min-[400px]:inline">Share</span>
        </Button>
      </footer>
    </article>
  );
};

export default memo(PostCard);
