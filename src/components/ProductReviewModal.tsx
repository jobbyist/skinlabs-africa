import { useEffect, useState } from "react";
import { Heart, Loader2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GatedOverlay from "@/components/GatedOverlay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProductReview } from "@/data/reviews";

interface CommentRow {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
}

interface ProductReviewModalProps {
  review: ProductReview | null;
  onOpenChange: (open: boolean) => void;
}

const ProductReviewModal = ({ review, onOpenChange }: ProductReviewModalProps) => {
  const { user } = useAuth();
  const { isMember } = useMembership();
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullReview, setFullReview] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!review || !isMember) {
      setFullReview(null);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("review_details")
        .select("full_review")
        .eq("review_id", review.id)
        .maybeSingle();
      if (active) setFullReview(data?.full_review ?? null);
    })();
    return () => {
      active = false;
    };
  }, [review, isMember]);

  useEffect(() => {
    if (!review) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const [{ data: ratings }, { data: commentRows }] = await Promise.all([
        supabase.from("review_ratings").select("user_id, rating, liked").eq("review_id", review.id),
        supabase
          .from("review_comments")
          .select("id, display_name, body, created_at")
          .eq("review_id", review.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (!active) return;
      const rows = ratings ?? [];
      setLikeCount(rows.filter((r) => r.liked).length);
      setAvgRating(rows.length ? rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rows.length : null);
      const mine = user ? rows.find((r) => r.user_id === user.id) : undefined;
      setRating(mine?.rating ?? 0);
      setLiked(Boolean(mine?.liked));
      setComments(commentRows ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [review, user]);

  const persist = async (nextRating: number, nextLiked: boolean) => {
    if (!review) return;
    if (!user) {
      toast.error("Sign in to rate and like reviews.");
      return;
    }
    const { error } = await supabase.from("review_ratings").upsert(
      {
        user_id: user.id,
        review_id: review.id,
        rating: nextRating || 1,
        liked: nextLiked,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,review_id" },
    );
    if (error) {
      toast.error("Could not save your feedback.");
      return;
    }
    setRating(nextRating || 1);
    setLiked(nextLiked);
  };

  const postComment = async () => {
    if (!review || !body.trim()) return;
    if (!user) {
      toast.error("Sign in to join the discussion.");
      return;
    }
    setPosting(true);
    const { data, error } = await supabase
      .from("review_comments")
      .insert({
        user_id: user.id,
        review_id: review.id,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Member",
        body: body.trim(),
      })
      .select("id, display_name, body, created_at")
      .single();
    setPosting(false);
    if (error || !data) {
      toast.error("Could not post your comment.");
      return;
    }
    setComments((prev) => [data, ...prev]);
    setBody("");
    toast.success("Comment posted");
  };

  const sortedRetailers = review ? [...review.retailers].sort((a, b) => a.price_zar - b.price_zar) : [];

  return (
    <Dialog open={Boolean(review)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {review && (
          <>
            <DialogHeader>
              <DialogTitle className="text-left font-heading">
                {review.brand} — {review.product_name}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">{review.verdict}</p>

            {/* Community signals */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    aria-label={`Rate ${value} stars`}
                    onClick={() => persist(value, liked)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        value <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {avgRating ? `${avgRating.toFixed(1)}/5 from members` : "No member ratings yet"}
              </span>
              <button
                onClick={() => persist(rating, !liked)}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
                {likeCount + (liked ? 1 : 0)} likes
              </button>
            </div>

            {/* Store availability & price comparison */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Where to buy — SA price comparison</h4>
              <div className="overflow-hidden rounded-2xl border border-border">
                {sortedRetailers.map((entry, index) => (
                  <a
                    key={entry.retailer}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent",
                      index > 0 && "border-t border-border",
                    )}
                  >
                    <span className="font-medium text-foreground">{entry.retailer}</span>
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-xs",
                          entry.in_stock ? "text-primary" : "text-muted-foreground line-through",
                        )}
                      >
                        {entry.in_stock ? "In stock" : "Out of stock"}
                      </span>
                      <span className="font-semibold text-foreground">R{entry.price_zar}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <GatedOverlay
              locked={!isMember}
              title="Full review is member-only"
              message="Glow Insider unlocks the complete ingredient analysis, long-form verdict and skin-type match notes."
            >
              <div className="space-y-4 py-2">
                <p className="text-sm leading-relaxed text-foreground">{review.full_review}</p>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Key ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {review.key_ingredients.map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Best suited to</h4>
                  <p className="text-sm text-muted-foreground">{review.skin_type_match.join(", ")}</p>
                </div>
              </div>
            </GatedOverlay>

            {/* Comments */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Member discussion</h4>
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={user ? "Share your experience with this product…" : "Sign in to join the discussion"}
                maxLength={2000}
                rows={3}
              />
              <Button size="sm" onClick={postComment} disabled={posting || !body.trim()}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post comment"}
              </Button>

              {loading ? (
                <p className="text-xs text-muted-foreground">Loading discussion…</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No comments yet — be the first.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded-2xl border border-border bg-card p-3">
                      <p className="text-xs font-semibold text-foreground">{comment.display_name || "Member"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString("en-ZA")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductReviewModal;
