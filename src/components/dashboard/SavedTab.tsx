import { Link } from "react-router-dom";
import { Bookmark, Heart, Newspaper, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { newsArticles } from "@/data/newsroom";
import { useProductReviews } from "@/hooks/use-product-reviews";
import { useEngagementStore } from "@/stores/engagementStore";

/** Surfaces the member's saved/liked Newsroom articles and Reviews in one place. */
const SavedTab = () => {
  const { savedIds, likedIds } = useEngagementStore();
  const { data: productReviews = [] } = useProductReviews();

  const savedArticles = newsArticles.filter((a) => savedIds.includes(a.id));
  const likedArticles = newsArticles.filter((a) => likedIds.includes(a.id) && !savedIds.includes(a.id));
  const likedReviews = productReviews.filter((r) => likedIds.includes(r.id));

  const hasAnything = savedArticles.length > 0 || likedArticles.length > 0 || likedReviews.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" /> Saved &amp; Liked
          </CardTitle>
          <CardDescription>Articles and reviews you've saved or liked across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAnything ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Tap the bookmark on any{" "}
              <Link to="/newsroom" className="text-primary hover:underline">Daily Skinny</Link> briefing or the heart on
              any <Link to="/reviews" className="text-primary hover:underline">review</Link> to save it here.
            </p>
          ) : (
            <div className="space-y-6">
              {(savedArticles.length > 0 || likedArticles.length > 0) && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Newspaper className="h-4 w-4" /> The Daily Skinny
                  </h3>
                  <div className="space-y-2">
                    {[...savedArticles, ...likedArticles].map((article) => (
                      <Link
                        key={article.id}
                        to={`/newsroom/${article.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm hover:bg-accent"
                      >
                        <span className="text-foreground">{article.article_title}</span>
                        <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                          {savedIds.includes(article.id) && <Bookmark className="h-3.5 w-3.5 fill-current" />}
                          {likedIds.includes(article.id) && <Heart className="h-3.5 w-3.5 fill-current" />}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {likedReviews.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Star className="h-4 w-4" /> Reviews
                  </h3>
                  <div className="space-y-2">
                    {likedReviews.map((review) => (
                      <Link
                        key={review.id}
                        to={`/reviews/${review.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm hover:bg-accent"
                      >
                        <span className="text-foreground">{review.brand} — {review.product_name}</span>
                        <Heart className="h-3.5 w-3.5 shrink-0 fill-current text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedTab;
