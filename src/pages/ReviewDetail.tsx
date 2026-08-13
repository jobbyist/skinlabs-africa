import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import GatedOverlay from "@/components/GatedOverlay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { overallScore } from "@/data/reviews";
import { useProductReviews } from "@/hooks/use-product-reviews";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";

interface CommentRow {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
}

const ReviewDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { isMember } = useMembership();
  const { data: productReviews = [] } = useProductReviews();
  const review = productReviews.find((r) => r.id === slug);

  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (review) trackEvent("review_viewed", { review_id: review.id, brand: review.brand });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id]);

  if (!review) return <Navigate to="/reviews" replace />;

  const persist = async (nextRating: number, nextLiked: boolean) => {
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
    if (!body.trim()) return;
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

  const sortedRetailers = [...review.retailers].sort((a, b) => a.price_zar - b.price_zar);
  const score = overallScore(review);

  return (
    <>
      <SEO
        title={`${review.brand} ${review.product_name} Review — SA Pricing & Verdict`}
        description={review.verdict}
        canonical={`https://skinlabs.co.za/reviews/${review.id}`}
        ogType="article"
        keywords={`${review.product_name} review, ${review.brand} South Africa, ${review.category} review`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${review.brand} ${review.product_name}`,
          brand: { "@type": "Brand", name: review.brand },
          category: review.category,
          description: review.verdict,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: score,
            bestRating: 10,
            reviewCount: Math.max(1, likeCount),
          },
          offers: sortedRetailers.map((r) => ({
            "@type": "Offer",
            price: r.price_zar,
            priceCurrency: "ZAR",
            availability: r.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: r.url,
            seller: { "@type": "Organization", name: r.retailer },
          })),
        }}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-24">
          <div className="container mx-auto max-w-3xl px-4">
            <Link to="/reviews" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Reviews
            </Link>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <BrandMark name={review.brand} type="brand" className="mb-2 h-8" />
                <h1 className="font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  {review.product_name}
                </h1>
              </div>
              <div className="flex shrink-0 flex-col items-center rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                <span className="font-heading text-2xl font-extrabold leading-none">{score}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-80">score</span>
              </div>
            </div>

            <p className="mb-6 text-base leading-relaxed text-muted-foreground">{review.verdict}</p>

            {/* Community signals */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} aria-label={`Rate ${value} stars`} onClick={() => persist(value, liked)} className="p-0.5">
                    <Star className={cn("h-5 w-5 transition-colors", value <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
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
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Where to buy — SA price comparison</h2>
              <div className="overflow-hidden rounded-2xl border border-border">
                {sortedRetailers.map((entry, index) => (
                  <a
                    key={entry.retailer}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent", index > 0 && "border-t border-border")}
                  >
                    <BrandMark name={entry.retailer} type="retailer" className="h-5" />
                    <span className="flex items-center gap-3">
                      <span className={cn("text-xs", entry.in_stock ? "text-primary" : "text-muted-foreground line-through")}>
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
                <p className="text-base leading-relaxed text-foreground">{review.full_review}</p>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Key ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {review.key_ingredients.map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Best suited to</h3>
                  <p className="text-sm text-muted-foreground">{review.skin_type_match.join(", ")}</p>
                </div>
              </div>
            </GatedOverlay>

            {/* Comments */}
            <div className="mt-8 space-y-3 border-t border-border pt-8">
              <h2 className="text-sm font-semibold text-foreground">Member discussion</h2>
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
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ReviewDetail;
