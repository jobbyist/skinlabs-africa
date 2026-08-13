import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Clock, Heart, MapPin } from "lucide-react";
import { newsArticles, type NewsArticle } from "@/data/newsroom";
import { useEngagementStore } from "@/stores/engagementStore";
import { useMembership } from "@/hooks/use-membership";
import { cn } from "@/lib/utils";

interface NewsroomFeedProps {
  limit?: number;
  heading?: string;
  description?: string;
}

const NewsroomFeed = ({
  limit,
  heading = "The Daily Skinny",
  description = "A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. One briefing is always free to read in full — every day, no account required.",
}: NewsroomFeedProps) => {
  const { isMember } = useMembership();
  const { likedIds, savedIds, toggleLike, toggleSave, viewedArticleIds, lastViewDate } = useEngagementStore();

  const today = new Date().toISOString().slice(0, 10);
  const viewedToday = lastViewDate === today ? viewedArticleIds : [];
  const freeQuotaUsed = !isMember && viewedToday.length >= 1;

  const articles = limit ? newsArticles.slice(0, limit) : newsArticles;

  const isLockedFor = (article: NewsArticle) =>
    !isMember && freeQuotaUsed && !viewedToday.includes(article.id);

  return (
    <section id="newsroom" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Daily briefing</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {!isMember && (
            <p className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
              {freeQuotaUsed ? "Free daily read used — back tomorrow, or go Insider for unlimited" : "1 free briefing today, in full"}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => {
            const locked = isLockedFor(article);
            return (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
                whileHover={{ y: -4 }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card"
              >
                <Link to={`/newsroom/${article.id}`} className="relative block aspect-[16/10] overflow-hidden text-left">
                  <img
                    src={article.cover_image_url}
                    alt={article.article_title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                    <MapPin className="h-3 w-3" /> {article.sa_context_tag}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source_name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.reading_time}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground">
                    <Link to={`/newsroom/${article.id}`} className="hover:underline">
                      {article.article_title}
                    </Link>
                  </h3>
                  <ul className="space-y-1.5">
                    {article.key_takeaways.slice(0, locked ? 1 : 3).map((takeaway) => (
                      <li key={takeaway} className="flex gap-2 text-sm text-muted-foreground">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <Link
                      to={`/newsroom/${article.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {locked ? "Unlock briefing" : "Read the SA breakdown"}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleLike(article.id)}
                        aria-label="Like article"
                        className="rounded-full p-2 hover:bg-accent"
                      >
                        <Heart
                          className={cn("h-4 w-4", likedIds.includes(article.id) && "fill-primary text-primary")}
                        />
                      </button>
                      <button
                        onClick={() => toggleSave(article.id)}
                        aria-label="Save article"
                        className="rounded-full p-2 hover:bg-accent"
                      >
                        <Bookmark
                          className={cn("h-4 w-4", savedIds.includes(article.id) && "fill-primary text-primary")}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewsroomFeed;
