import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FlaskConical, Newspaper, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { productReviews } from "@/data/reviews";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { useMemberSources } from "@/hooks/use-smart-routine";
import { profileSignals, rankItems, rankReviews } from "@/lib/profileFeed";

/**
 * "For your profile": briefings, reviews and ingredients ranked against the
 * member's own SKYNN AI answers, each with the reason it was picked.
 * Renders nothing until there is a saved analysis to match against.
 */
const ForYourProfileFeed = () => {
  const { profile, loading } = useMemberSources({ withReport: false });
  const { articles } = useNewsArticles(40);
  const signals = useMemo(() => (profile ? profileSignals(profile) : []), [profile]);

  const briefings = useMemo(
    () => rankItems(articles, (a) => `${a.title} ${a.excerpt} ${a.key_takeaways.join(" ")} ${a.sa_context_tag}`, signals, 3),
    [articles, signals],
  );
  const reviews = useMemo(() => (profile ? rankReviews(productReviews, profile, signals, 3) : []), [profile, signals]);
  const ingredients = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((r) => r.item.key_ingredients.forEach((i) => counts.set(i.replace(/\s*[~\d].*%.*$/, "").trim(), (counts.get(i) ?? 0) + 1)));
    return [...counts.keys()].filter(Boolean).slice(0, 5);
  }, [reviews]);

  if (loading || !profile || signals.length === 0) return null;
  if (!briefings.length && !reviews.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> For your profile</CardTitle>
        <CardDescription>Matched to what you told SKYNN AI: {signals.slice(0, 3).map((s) => s.label).join(", ")}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {briefings.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Newspaper className="h-3.5 w-3.5" /> Briefings</p>
            <ul className="space-y-2">
              {briefings.map(({ item, reason }) => (
                <li key={item.id}>
                  <Link to={`/briefings/${item.slug}`} className="card-interactive block rounded-xl border border-border px-3 py-2">
                    <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Because of your {reason} · {item.reading_time}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {reviews.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Reviews</p>
            <ul className="space-y-2">
              {reviews.map(({ item, reason }) => (
                <li key={item.id}>
                  <Link to={`/reviews/${item.id}`} className="card-interactive flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.brand} {item.product_name}</p>
                      <p className="text-xs text-muted-foreground">For your {reason}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">R{item.local_price_zar}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {ingredients.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><FlaskConical className="h-3.5 w-3.5" /> Ingredients to read up on</p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((i) => (
                <Badge key={i} variant="outline" asChild>
                  <Link to={`/ingredients?q=${encodeURIComponent(i)}`}>{i}</Link>
                </Badge>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
};

export default ForYourProfileFeed;
