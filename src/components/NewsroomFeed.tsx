import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Bookmark, Clock, ExternalLink, Heart, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GatedOverlay from "@/components/GatedOverlay";
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
  description = "A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. Also available as a premium digital magazine-format PDF download for Glow Insider and VIP members.",

}: NewsroomFeedProps) => {
  const { isMember } = useMembership();
  const { likedIds, savedIds, toggleLike, toggleSave, viewedArticleIds, lastViewDate, recordArticleView } =
    useEngagementStore();
  const [openArticle, setOpenArticle] = useState<NewsArticle | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const viewedToday = lastViewDate === today ? viewedArticleIds : [];
  const freeQuotaUsed = !isMember && viewedToday.length >= 1;

  const articles = limit ? newsArticles.slice(0, limit) : newsArticles;

  const isLockedFor = (article: NewsArticle) =>
    !isMember && freeQuotaUsed && !viewedToday.includes(article.id);

  const handleOpen = (article: NewsArticle) => {
    if (isLockedFor(article)) {
      setOpenArticle(article);
      return;
    }
    recordArticleView(article.id);
    setOpenArticle(article);
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
          {!isMember && (
            <p className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground">
              {freeQuotaUsed ? "Free daily read used" : "1 free briefing today"}
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
                <button onClick={() => handleOpen(article)} className="relative block aspect-[16/10] overflow-hidden text-left">
                  <img
                    src={article.cover_image_url}
                    alt={article.article_title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                    <MapPin className="h-3 w-3" /> {article.sa_context_tag}
                  </span>
                </button>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.source_name}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {article.reading_time}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground">
                    {article.article_title}
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
                    <button
                      onClick={() => handleOpen(article)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {locked ? "Unlock briefing" : "Read the SA breakdown"}
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
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

      <Dialog open={Boolean(openArticle)} onOpenChange={(open) => !open && setOpenArticle(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {openArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-left font-heading text-xl leading-snug">
                  {openArticle.article_title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                {openArticle.source_name} · {openArticle.publish_date} · {openArticle.reading_time}
              </p>

              <GatedOverlay
                locked={isLockedFor(openArticle)}
                title="Daily free read used"
                message="Glow Insider members get unlimited access to every Daily Skinny briefing, plus the full SA breakdown."
              >
                <div className="space-y-5 py-2">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Key takeaways
                    </h4>
                    <ul className="space-y-2">
                      {openArticle.key_takeaways.map((takeaway) => (
                        <li key={takeaway} className="flex gap-2 text-sm text-foreground">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      What this means for SA skin
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{openArticle.sa_breakdown}</p>
                  </div>
                </div>
              </GatedOverlay>

              <Button variant="outline" asChild className="w-full gap-2">
                <a href={openArticle.original_url} target="_blank" rel="noopener noreferrer">
                  Read the original source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NewsroomFeed;
