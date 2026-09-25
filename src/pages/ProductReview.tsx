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
import AuthDialog from "@/components/AuthDialog";
import RoutineBuilder from "@/components/RoutineBuilder";
import AdSlot from "@/components/AdSlot";
import AdSlotAutorelaxed from "@/components/AdSlotAutorelaxed";
import FaithfulToNature from "@/components/FaithfulToNature";
import RelatedKnowledgeHub from "@/components/RelatedKnowledgeHub";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SkinLabsPromiseBadge } from "@/components/SkinLabsPromiseBadge";
import { QuickVerdict } from "@/components/product-review/QuickVerdict";
import { AtAGlanceCard } from "@/components/product-review/AtAGlanceCard";
import { productReviewTitle, productReviewDescription, SITE_URL } from "@/lib/seo-config";
import { enhancedProductReviewJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { findMarketplaceMatch, type MarketplaceMatch } from "@/lib/marketplaceCrossLink";
import { useIngredientBreakdown } from "@/hooks/use-ingredient-breakdown";
import EvidenceBadge from "@/components/ingredients/EvidenceBadge";
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
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";
import { useReviewImages } from "@/hooks/use-review-images";
import { seasonHubs, allSeasons } from "@/data/seasonals";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trialLength, trialNoun } from "@/lib/promo";
import { currentReturnTo, setPendingIntent } from "@/lib/pendingIntent";

interface CommentRow {
  id: string;
  display_name: string | null;
  body: string;
  created_at: string;
}

const ProductReview = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { isMember, isVip } = useMembership();
  const { data: generatedReviews } = useGeneratedReviews();
  const allReviews = useMemo(
    () => (generatedReviews?.length ? [...generatedReviews, ...productReviews] : productReviews),
    [generatedReviews],
  );
  const review = useMemo(() => allReviews.find((item) => item.id === slug), [allReviews, slug]);
  const { getImage: getReviewImage } = useReviewImages();
  const productImage = useMemo(
    () => (review ? getReviewImage(review.id, review.category, review.brand) : null),
    [review, getReviewImage],
  );
  const { data: ingredientBreakdown } = useIngredientBreakdown(review?.key_ingredients ?? []);

  const [rating, setRating] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  // Real `review_ratings` rows only (avgRating above may be a seeded display value).
  const [realRatingStats, setRealRatingStats] = useState<{ average: number; count: number } | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullReview, setFullReview] = useState<string | null>(null);
  const [marketplaceMatch, setMarketplaceMatch] = useState<MarketplaceMatch | null>(null);

  useEffect(() => {
    let active = true;
    if (!review) {
      setMarketplaceMatch(null);
      return;
    }
    void (async () => {
      const match = await findMarketplaceMatch(review.brand, review.product_name);
      if (active) setMarketplaceMatch(match);
    })();
    return () => {
      active = false;
    };
  }, [review]);

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
      const rated = rows.map((r) => r.rating).filter((n): n is number => typeof n === "number" && n >= 1 && n <= 5);
      setRealRatingStats(rated.length > 0 ? { average: rated.reduce((a, b) => a + b, 0) / rated.length, count: rated.length } : null);
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
  const relatedReviews = allReviews.filter((item) => item.category === review.category && item.id !== review.id).slice(0, 3);
  const spotlightEntry = spotlightRanking.find((entry) => entry.brand === review.brand);
  const seasonalFeature = allSeasons
    .map((season) => seasonHubs[season])
    .find((hub) => hub.productEdit.picks.some((pick) => pick.reviewId === review.id));
  const score = overallScore(review);
  const canonical = `${SITE_URL}/reviews/${review.id}`;

  // Generate enhanced JSON-LD with proper separation of editorial (0-10) and community (0-5) ratings
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      enhancedProductReviewJsonLd({
        canonicalUrl: canonical,
        productName: review.product_name,
        brand: review.brand,
        category: review.category,
        ...(productImage ? { image: productImage.url } : {}),
        ...(review.retailers.length > 0
          ? {
              offers: {
                lowPrice: Math.min(...review.retailers.map((r) => r.price_zar)),
                highPrice: Math.max(...review.retailers.map((r) => r.price_zar)),
                offerCount: review.retailers.length,
              },
            }
          : {}),
        editorialScore: score,
        // Prefer the pipeline's expanded review_body (grounded second Gemini call, see
        // supabase/functions/product-review-sync/index.ts's generateSupplementalFields())
        // when the pipeline has populated it -- falls back to the short verdict for the
        // static catalogue and for any AI review not yet backfilled.
        reviewBody: review.review_body ?? review.verdict,
        // Single aggregateRating from REAL review_ratings rows only -- never the
        // seeded display average, and counted by ratings (not comments).
        ...(realRatingStats
          ? {
              communityRating: realRatingStats.average,
              communityReviewCount: realRatingStats.count,
            }
          : {}),
      }),
      breadcrumbJsonLd([
        { name: "Reviews", url: `${SITE_URL}/reviews` },
        { name: review.product_name, url: canonical },
      ]),
      ...(review.faq && review.faq.length > 0 ? [faqJsonLd({ faqs: review.faq })] : []),
    ],
  };

  // Prefer the pipeline's stored seo_title/seo_description (the identical formula,
  // computed server-side at publish/backfill time -- see
  // supabase/functions/product-review-sync/index.ts's computeSeoTitleDescription())
  // so a crawler reading the row directly (or the SSR route) sees the same title/
  // description without needing this client computation. Falls back to computing it
  // here for the static catalogue and for any AI review not yet backfilled.
  const seoTitle = review.seo_title ?? productReviewTitle(review.product_name, review.brand);
  const seoDescription =
    review.seo_description ??
    productReviewDescription(review.product_name, review.brand, {
      score,
      keyIngredients: review.key_ingredients.slice(0, 2),
      skinTypes: review.skin_type_match.slice(0, 2),
    });

  // Locked review → sign up / pricing, then straight back here afterwards
  // (<IntentResolver /> resumes the `unlock` intent; /pricing carries returnTo
  // into a trial/subscribe intent).
  const pricingHref = `/pricing?returnTo=${encodeURIComponent(currentReturnTo())}`;
  const signUpAndReturn = () => {
    setPendingIntent({ action: "unlock", returnTo: currentReturnTo() });
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
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

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.brand} · {review.category}</p>
            {review.is_sponsored && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Sponsored</Badge>
            )}
          </div>
          <h1 className="mt-1 font-heading text-3xl font-bold text-foreground md:text-4xl">{review.product_name}</h1>
          {review.is_sponsored && (
            <p className="mt-1 text-xs text-muted-foreground">
              This review discloses a sponsored placement — SkinLabs earns a margin when you buy this product via OpenHaus Marketplace or a disclosed brand partner.
            </p>
          )}
          {review.seo_intro && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{review.seo_intro}</p>}

          {productImage && (
            <figure className="mt-6">
              <img
                src={productImage.url}
                alt={`${review.category} product photography — ${productImage.alt}`}
                className="h-64 w-full rounded-3xl object-cover sm:h-80"
                loading="lazy"
              />
              {productImage.creditUrl !== "#" && (
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  Representative {review.category.toLowerCase()} photography, not the exact product. Photo by{" "}
                  <a href={productImage.creditUrl} target="_blank" rel="noreferrer noopener" className="underline">
                    {productImage.creditName}
                  </a>{" "}
                  on Unsplash.
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-6">
            <QuickVerdict
              verdict={review.verdict}
              overallScore={score}
              scoreBreakdown={{
                efficacy: review.score_efficacy,
                value: review.score_value,
                texture: review.score_texture,
                climate: review.score_climate,
              }}
            />
          </div>

          <div className="mt-6">
            <AtAGlanceCard
              brand={review.brand}
              productName={review.product_name}
              category={review.category}
              priceZAR={Math.min(...review.retailers.map((r) => r.price_zar))}
              whereAvailable={review.retailers.map((r) => r.retailer).join(", ")}
              size={review.product_size ?? undefined}
              countryOfOrigin={review.country_of_origin ?? undefined}
              amPmUsage={review.am_pm_usage ?? undefined}
            />
          </div>

          {(review.review_body || (review.skin_concerns && review.skin_concerns.length > 0) || (review.benefits && review.benefits.length > 0) || (review.cautions && review.cautions.length > 0)) && (
            <div className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-bold text-foreground">Editorial deep dive</h2>
              {review.review_body && <p className="text-sm leading-relaxed text-foreground">{review.review_body}</p>}

              {review.skin_concerns && review.skin_concerns.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {review.skin_concerns.map((concern) => (
                    <Badge key={concern} variant="secondary">{concern}</Badge>
                  ))}
                </div>
              )}

              {((review.benefits && review.benefits.length > 0) || (review.cautions && review.cautions.length > 0)) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {review.benefits && review.benefits.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Benefits</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {review.benefits.map((benefit) => (
                          <li key={benefit}>• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cautions && review.cautions.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Cautions</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {review.cautions.map((caution) => (
                          <li key={caution}>• {caution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {review.faq && review.faq.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
                {review.faq.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

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

          <SkinLabsPromiseBadge className="mt-6" />

          <AdSlot placement="product-review-top" compact />

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

          {marketplaceMatch && (
            <Link
              to={`/marketplace/product/${marketplaceMatch.slug}`}
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm hover:border-primary"
            >
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Sponsored
                </span>
                Also available on OpenHaus
              </span>
              <span className="text-xs text-muted-foreground">Shop now →</span>
            </Link>
          )}

          {/* Partner banner sits after the routine builder, not straight after
              "Where to buy" + the OpenHaus link, so commercial units never cluster. */}
          <RoutineBuilder anchor={review} isVip={isVip} />

          <FaithfulToNature placement="product-review-shop" />

          <RelatedKnowledgeHub keywords={[...review.key_ingredients, review.category, review.brand]} />

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
              ctaHref={pricingHref}
              onSignIn={user ? undefined : signUpAndReturn}
              signInLabel="Sign up / Log in"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-bold text-foreground">The full breakdown</h2>
                <p className="text-sm leading-relaxed text-foreground">{fullReview ?? (isMember ? "Loading the full verdict…" : review.verdict)}</p>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Ingredient breakdown</h3>
                  <div className="space-y-2">
                    {(ingredientBreakdown ?? review.key_ingredients.map((name) => ({ name, resolved: null, description: null, functionSummary: null, evidenceLevel: null }))).map((entry) => (
                      <div key={entry.name} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.resolved ? (
                            <Link
                              to={`/ingredients/${entry.resolved.slug}`}
                              className="text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
                            >
                              {entry.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-foreground">{entry.name}</span>
                          )}
                          {entry.resolved && <EvidenceBadge level={entry.evidenceLevel} />}
                        </div>
                        {entry.functionSummary || entry.description ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.functionSummary ?? entry.description}</p>
                        ) : (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            {entry.resolved ? "Detailed profile in progress — check back soon." : "Detailed ingredient profile coming soon."}
                          </p>
                        )}
                      </div>
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
                Glow Insider members read every product's full lab breakdown, not just the score. Try it free {trialLength()} — no card required.
              </p>
              <Button asChild className="mt-4">
                <Link to={pricingHref}>Start my {trialNoun()}</Link>
              </Button>
            </div>
          )}

          <AdSlotAutorelaxed placement="product-review-discussion" compact />

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
      </main>
      <Footer />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signup" />
    </div>
  );
};

export default ProductReview;
