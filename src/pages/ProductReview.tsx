import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, MapPin, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GatedOverlay from "@/components/GatedOverlay";
import RoutineBuilder from "@/components/RoutineBuilder";
import AdSlot from "@/components/AdSlot";
import RelatedKnowledgeHub from "@/components/RelatedKnowledgeHub";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import skinlabsPromiseBadge from "@/assets/skinlabs-promise-badge.png";
import { useMembership } from "@/hooks/use-membership";
import {
  overallScore,
  productReviews,
  seededComments,
  seededRatings,
  getSeededAverageRating,
  getSeededLikeCount,
} from "@/data/reviews";
import { spotlightRanking } from "@/data/spotlight";
import { getProductImage } from "@/data/productImages";
import { seasonHubs, allSeasons } from "@/data/seasonals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommentRow {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
}

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${value * 10}%` }} />
    </div>
  </div>
);

const ProductReview = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { isMember, isVip } = useMembership();
  const review = useMemo(() => productReviews.find((item) => item.id === slug), [slug]);
  const productImage = useMemo(() => (review ? getProductImage(review.category, review.id) : null), [review]);

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
      setLikeCount(rows.length > 0 ? rows.filter((r) => r.liked).length : getSeededLikeCount(review.id));
      setAvgRating(rows.length > 0 ? rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rows.length : getSeededAverageRating(review.id));
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

  if (!review) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Review not found</h1>
          <p className="mt-2 text-muted-foreground">This product may have been removed from our review set.</p>
          <Button asChild className="mt-6">
            <Link to="/reviews">Back to all reviews</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const persist = async (nextRating: number, nextLiked: boolean) => {
    if (!user) {
      toast.error("Sign in to rate and like reviews.");
      return;
    }
    const { error } = await supabase.from("review_ratings").upsert(
      { user_id: user.id, review_id: review.id, rating: nextRating || 1, liked: nextLiked, updated_at: new Date().toISOString() },
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
  const displayComments = comments.length === 0 ? (seededComments[review.id] || []).map((c, i) => ({ ...c, id: `seeded-${i}` })) : comments;
  const relatedReviews = productReviews.filter((item) => item.category === review.category && item.id !== review.id).slice(0, 3);
  const spotlightEntry = spotlightRanking.find((entry) => entry.brand === review.brand);
  const seasonalFeature = allSeasons
    .map((season) => seasonHubs[season])
    .find((hub) => hub.productEdit.picks.some((pick) => pick.reviewId === review.id));
  const score = overallScore(review);
  const canonical = `https://skinlabs.co.za/reviews/${review.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: review.product_name,
        brand: { "@type": "Brand", name: review.brand },
        category: review.category,
        ...(productImage ? { image: productImage.url } : {}),
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "ZAR",
          lowPrice: Math.min(...review.retailers.map((r) => r.price_zar)),
          highPrice: Math.max(...review.retailers.map((r) => r.price_zar)),
          offerCount: review.retailers.length,
        },
        review: {
          "@type": "Review",
          reviewRating: { "@type": "Rating", ratingValue: score, bestRating: 10 },
          author: { "@type": "Organization", name: "SkinLabs" },
          reviewBody: review.verdict,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: score,
          bestRating: 10,
          reviewCount: Math.max(1, displayComments.length),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reviews", item: "https://skinlabs.co.za/reviews" },
          { "@type": "ListItem", position: 2, name: review.product_name, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${review.brand} ${review.product_name} Review — SA Score & Price`}
        description={`${review.product_name} by ${review.brand}, independently scored ${score}/10 for SA conditions. ${review.verdict.slice(0, 100)}`}
        canonical={canonical}
        ogType="article"
        {...(productImage ? { ogImage: productImage.url } : {})}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to="/reviews" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All reviews
          </Link>

          <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.brand} · {review.category}</p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{review.product_name}</h1>
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
              <span className="font-heading text-2xl font-extrabold leading-none">{score}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-80">/ 10</span>
            </div>
          </div>

          {productImage && (
            <figure className="mt-6">
              <img
                src={productImage.url}
                alt={`${review.category} product photography — ${productImage.alt}`}
                className="h-64 w-full rounded-3xl object-cover sm:h-80"
                loading="lazy"
              />
              <figcaption className="mt-2 text-xs text-muted-foreground">
                Representative {review.category.toLowerCase()} photography, not the exact product. Photo by{" "}
                <a href={productImage.creditUrl} target="_blank" rel="noreferrer noopener" className="underline">
                  {productImage.creditName}
                </a>{" "}
                on Unsplash.
              </figcaption>
            </figure>
          )}

          <p className="mt-6 text-lg leading-relaxed text-foreground">{review.verdict}</p>

          <div className="my-8">
            <AdSlot placement="product-review-top" />
          </div>

          <div className="mt-6 grid gap-2.5 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
            <ScoreBar label="Efficacy" value={review.score_efficacy} />
            <ScoreBar label="Value for money" value={review.score_value} />
            <ScoreBar label="Texture" value={review.score_texture} />
            <ScoreBar label="SA climate fit" value={review.score_climate} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} aria-label={`Rate ${value} stars`} onClick={() => persist(value, liked)} className="p-0.5">
                  <Star className={cn("h-5 w-5 transition-colors", value <= rating ? "fill-primary text-primary" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{avgRating ? `${avgRating.toFixed(1)}/5 from members` : "No member ratings yet"}</span>
            <button onClick={() => persist(rating, !liked)} className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent">
              <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
              {likeCount + (liked ? 1 : 0)} likes
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <img
              src={skinlabsPromiseBadge}
              alt="SkinLabs Promise — No Hype. Just Evidence."
              className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
              loading="lazy"
              width={80}
              height={80}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">The SkinLabs Promise</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                No hype, just evidence — this review is independently researched from publicly available
                information, ingredient analysis and editorial testing.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">Where to buy — SA price comparison</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              {sortedRetailers.map((entry, index) => (
                <a
                  key={entry.retailer}
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent", index > 0 && "border-t border-border")}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {entry.retailer}
                  </span>
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

          <RoutineBuilder anchor={review} isVip={isVip} />

          <RelatedKnowledgeHub keywords={[...review.key_ingredients, review.category, review.brand]} />

          <div className="my-8">
            <AdSlot placement="product-review-mid" />
          </div>

          {(spotlightEntry || seasonalFeature) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {spotlightEntry && (
                <Link
                  to={`/spotlight/${spotlightEntry.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary"
                >
                  This brand is on Spotlight →
                </Link>
              )}
              {seasonalFeature && (
                <Link
                  to={`/seasonals/${seasonalFeature.season}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary"
                >
                  Featured in {seasonalFeature.h1} →
                </Link>
              )}
            </div>
          )}

          <div className="mt-8">
            <GatedOverlay
              locked={!isMember}
              title="Unlock the full lab breakdown"
              message="Glow Insider unlocks the complete ingredient analysis, long-form verdict and skin-type match notes for every product we've reviewed."
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">The full breakdown</h2>
                <p className="text-sm leading-relaxed text-foreground">{fullReview ?? (isMember ? "Loading the full verdict…" : review.verdict)}</p>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Key ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {review.key_ingredients.map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{ingredient}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Best suited to</h3>
                  <p className="text-sm text-muted-foreground">{review.skin_type_match.join(", ")}</p>
                </div>
              </div>
            </GatedOverlay>
          </div>

          {!isMember && (
            <div className="mt-6 rounded-3xl border border-primary/30 bg-primary/5 p-6 text-center">
              <p className="font-heading text-lg font-bold text-foreground">Get every full breakdown, ingredient deep-dive included</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Glow Insider members read every product's full lab breakdown, not just the score. Try it free for 7 days — no card required.
              </p>
              <Button asChild className="mt-4">
                <Link to="/pricing">Start my 7-day free trial</Link>
              </Button>
            </div>
          )}

          <div className="mt-10 space-y-3">
            <h2 className="font-heading text-lg font-bold text-foreground">Member discussion</h2>
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
            ) : displayComments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet — be the first.</p>
            ) : (
              <ul className="space-y-3">
                {displayComments.map((comment) => (
                  <li key={comment.id} className="rounded-2xl border border-border bg-card p-4">
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

          {relatedReviews.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 font-heading text-lg font-bold text-foreground">More {review.category.toLowerCase()} reviews</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {relatedReviews.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                  >
                    <Link to={`/reviews/${item.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.brand}</p>
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Score: {overallScore(item)}/10</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="my-8">
          <AdSlot placement="product-review-bottom" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductReview;
