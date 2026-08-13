import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Bookmark, Clock, ExternalLink, Heart, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import GatedOverlay from "@/components/GatedOverlay";
import { Button } from "@/components/ui/button";
import { newsArticles } from "@/data/newsroom";
import { useEngagementStore } from "@/stores/engagementStore";
import { useMembership } from "@/hooks/use-membership";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NewsroomArticle = () => {
  const { slug } = useParams();
  const { isMember } = useMembership();
  const { likedIds, savedIds, toggleLike, toggleSave, viewedArticleIds, lastViewDate, recordArticleView } =
    useEngagementStore();

  const article = newsArticles.find((a) => a.id === slug);

  const today = new Date().toISOString().slice(0, 10);
  const viewedToday = lastViewDate === today ? viewedArticleIds : [];
  const freeQuotaUsed = !isMember && viewedToday.length >= 1;
  const locked = article ? !isMember && freeQuotaUsed && !viewedToday.includes(article.id) : false;

  useEffect(() => {
    if (!article) return;
    trackEvent("article_read", { article_id: article.id, locked });
    if (!locked) recordArticleView(article.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  if (!article) return <Navigate to="/newsroom" replace />;

  const otherArticles = newsArticles.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <>
      <SEO
        title={article.article_title}
        description={article.sa_breakdown.slice(0, 155)}
        canonical={`https://skinlabs.co.za/newsroom/${article.id}`}
        ogType="article"
        ogImage={article.cover_image_url}
        keywords={`${article.sa_context_tag}, skincare news South Africa, ${article.source_name}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: article.article_title,
          image: [article.cover_image_url],
          datePublished: article.publish_date,
          author: { "@type": "Organization", name: "SkinLabs — The Daily Skinny" },
          publisher: {
            "@type": "Organization",
            name: "SkinLabs",
            logo: { "@type": "ImageObject", url: "https://skinlabs.co.za/pwa-512.png" },
          },
          mainEntityOfPage: `https://skinlabs.co.za/newsroom/${article.id}`,
          description: article.sa_breakdown.slice(0, 200),
        }}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-24">
          <div className="container mx-auto max-w-3xl px-4">
            <Link to="/newsroom" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to The Daily Skinny
            </Link>

            <div className="mb-6 overflow-hidden rounded-3xl border border-border">
              <img src={article.cover_image_url} alt={article.article_title} className="aspect-[16/9] w-full object-cover" />
            </div>

            <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground">
              <MapPin className="h-3 w-3" /> {article.sa_context_tag}
            </span>
            <h1 className="mb-3 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {article.article_title}
            </h1>
            <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{article.source_name}</span>
              <span>·</span>
              <span>{article.publish_date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {article.reading_time}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => toggleLike(article.id)} aria-label="Like article" className="rounded-full p-2 hover:bg-accent">
                  <Heart className={cn("h-4 w-4", likedIds.includes(article.id) && "fill-primary text-primary")} />
                </button>
                <button onClick={() => toggleSave(article.id)} aria-label="Save article" className="rounded-full p-2 hover:bg-accent">
                  <Bookmark className={cn("h-4 w-4", savedIds.includes(article.id) && "fill-primary text-primary")} />
                </button>
              </div>
            </div>

            <GatedOverlay
              locked={locked}
              title="Daily free read used"
              message="Glow Insider members get unlimited access to every Daily Skinny briefing, plus the full SA breakdown."
            >
              <div className="space-y-6">
                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Key takeaways
                  </h2>
                  <ul className="space-y-2">
                    {article.key_takeaways.map((takeaway) => (
                      <li key={takeaway} className="flex gap-2 text-sm text-foreground">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    What this means for SA skin
                  </h2>
                  <p className="text-base leading-relaxed text-foreground">{article.sa_breakdown}</p>
                </div>
              </div>
            </GatedOverlay>

            <Button variant="outline" asChild className="mt-6 w-full gap-2 sm:w-auto">
              <a href={article.original_url} target="_blank" rel="noopener noreferrer">
                Read the original source
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            {otherArticles.length > 0 && (
              <div className="mt-16 border-t border-border pt-10">
                <h2 className="mb-6 font-heading text-xl font-bold text-foreground">More from The Daily Skinny</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {otherArticles.map((a) => (
                    <Link
                      key={a.id}
                      to={`/newsroom/${a.id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <img src={a.cover_image_url} alt={a.article_title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <span className="text-xs text-muted-foreground">{a.source_name}</span>
                        <h3 className="font-heading text-sm font-bold leading-snug text-foreground">{a.article_title}</h3>
                        <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
                          Read briefing <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsroomArticle;
