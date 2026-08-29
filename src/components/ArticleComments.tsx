import { MessageCircle } from "lucide-react";
import type { ArticleComment } from "@/data/articleComments";

interface ArticleCommentsProps {
  comments: ArticleComment[];
  /** Defaults to "Reader discussion". */
  heading?: string;
}

/**
 * Read-only reader/listener reaction list for editorial content that has no
 * live comment-posting backend (Spotlight, Seasonals, Podcast, Shelf
 * Showdown). Product reviews and Daily Skinny briefings support live,
 * member-posted comments elsewhere — this is seed content only.
 */
const ArticleComments = ({ comments, heading = "Reader discussion" }: ArticleCommentsProps) => {
  if (comments.length === 0) return null;

  return (
    <div className="mt-10 space-y-3">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        {heading}
      </h2>
      <ul className="space-y-3">
        {comments.map((comment, index) => (
          <li key={`${comment.display_name}-${index}`} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground">{comment.display_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString("en-ZA")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleComments;
