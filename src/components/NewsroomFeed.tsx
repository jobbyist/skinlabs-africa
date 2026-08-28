import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Clock, Eye, Heart, Loader2, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useEngagementStore } from "@/stores/engagementStore";
import { useNewsArticles, type NewsArticleSummary } from "@/hooks/use-news-articles";
import { matchScore } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NewsroomFeedProps {
  limit?: number;
  heading?: string;
  description?: string;
  searchable?: boolean;
}

const NewsroomFeed = ({
  limit,
  heading = "The Daily Skinny",
  description = "Discover short-form editorial content, skincare education, product insights, trends, routines, tips and commentary from top sources globally, curated for SA.",
  searchable = false,
}: NewsroomFeedProps) => {
  const { user } = useAuth();
  const { articles: fetchedArticles, loading } = useNewsArticles(limit);
  const { likedIds, savedIds, toggleLike, toggleSave } = useEngagementStore();
  const [remoteLiked, setRemoteLiked] = useState<string[]>([]);
  const [remoteSaved, setRemoteSaved] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const articles = useMemo(() => {
    if (!searchable || !query.trim()) return fetchedArticles;
    return fetchedArticles
      .map((article) => ({
        article,
        score: matchScore(query, article.title, `${article.sa_context_tag} ${article.excerpt} ${article.source_name}`),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.article);
  }, [fetchedArticles, query, searchable]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setRemoteLiked([]);
        setRemoteSaved([]);
        return;
      }
      const { data } = await supabase
        .from("news_article_engagement")
        .select("article_id, kind")
        .eq("user_id", user.id);
      if (!active) return;
      setRemoteLiked((data ?? []).filter((r) => r.kind === "like").map((r) => r.article_id));
      setRemoteSaved((data ?? []).filter((r) => r.kind === "save").map((r) => r.article_id));
    };
    void load();
    return () => {
      active = false;
    };
  }, [user]);

  const isLiked = (id: string) => (user ? remoteLiked.includes(id) : likedIds.includes(id));
  const isSaved = (id: string) => (user ? remoteSaved.includes(id) : savedIds.includes(id));

  const handleEngagement = async (article: NewsArticleSummary, kind: "like" | "save") => {
    if (!user) {
      if (kind === "like") {
        toggleLike(article.id);
      } else {
        toggleSave(article.id);
      }
      toast.message("Sign in to sync your saved briefings across devices.");
      return;
    }
    const current = kind === "like" ? remoteLiked : remoteSaved;
    const setter = kind === "like" ? setRemoteLiked : setRemoteSaved;
    const active = current.includes(article.id);
    setter(active ? current.filter((x) => x !== article.id) : [...current, article.id]);

    if (active) {
      await supabase
        .from("news_article_engagement")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", article.id)
        .eq("kind", kind);
    } else {
      await supabase
        .from("news_article_engagement")
        .insert({ user_id: user.id, article_id: article.id, kind });
    }
  };

  return (
    <section id="newsroom" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Daily briefing</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {searchable && (
          <div className="relative mb-8 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search briefings"
              className="pl-9"
              aria-label="Search briefings"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {searchable && query.trim() ? "No briefings match that search yet." : "The next briefing publishes at 6am SAST. Check back shortly."}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
                whileHover={{ y: -4 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card"
              >
                <Link to={`/newsroom/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                  {article.cover_image_url && (
                    <img
                      src={article.cover_image_url}
                      alt={article.cover_image_alt || article.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                    <MapPin className="h-3 w-3" /> {article.sa_context_tag}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source_name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.reading_time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {article.view_count.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground">
                    <Link to={`/newsroom/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  <ul className="space-y-1.5">
                    {article.key_takeaways.slice(0, 3).map((takeaway) => (
                      <li key={takeaway} className="flex gap-2 text-sm text-muted-foreground">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <Link
                      to={`/newsroom/${article.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Read the SA breakdown
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEngagement(article, "like")}
                        aria-label="Like article"
                        className="rounded-full p-2 hover:bg-accent"
                      >
                        <Heart className={cn("h-4 w-4", isLiked(article.id) && "fill-primary text-primary")} />
                      </button>
                      <button
                        onClick={() => handleEngagement(article, "save")}
                        aria-label="Save article"
                        className="rounded-full p-2 hover:bg-accent"
                      >
                        <Bookmark className={cn("h-4 w-4", isSaved(article.id) && "fill-primary text-primary")} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsroomFeed;
