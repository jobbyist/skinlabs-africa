import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpDown, ArrowUpRight, Clock, Eye, Filter, Heart, Loader2, MapPin, Search, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNewsArticles, useSaContextTags, type NewsArticleSummary } from "@/hooks/use-news-articles";
import { scoreTextItem } from "@/lib/search-engine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import { usePageParam } from "@/hooks/use-page-param";
import AdSlot from "@/components/AdSlot";
import AdSlotAutorelaxed from "@/components/AdSlotAutorelaxed";
import { useUnsplashImage } from "@/hooks/use-unsplash-image";
import { getLikedBriefingIds, toggleLikedBriefing } from "@/lib/briefing-engagement";

const PEXELS_FALLBACK_COVER = "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=1200";

const NEWSROOM_PAGE_SIZE = 5;
type SortOption = "newest" | "oldest" | "popular" | "reading";

interface NewsroomFeedProps {
  limit?: number;
  heading?: string;
  description?: string;
  searchable?: boolean;
  showExploreLink?: boolean;
  paginate?: boolean;
}

const BriefingCover = ({ article }: { article: NewsArticleSummary }) => {
  const query = `${article.sa_context_tag || "skincare"} ${article.title.split(" ").slice(0, 4).join(" ")} south africa skin`;
  const { image, loading } = useUnsplashImage(query, article.cover_image_url || "/briefing-placeholder-cover.svg");
  const src = article.cover_image_url || image?.url || PEXELS_FALLBACK_COVER;
  const alt = article.cover_image_alt || image?.alt || article.title;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        if (event.currentTarget.src !== PEXELS_FALLBACK_COVER) event.currentTarget.src = PEXELS_FALLBACK_COVER;
      }}
      className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${loading && !article.cover_image_url ? "opacity-70" : ""}`}
    />
  );
};

const NewsroomFeed = ({
  limit,
  heading = "The Daily Skinny",
  description = "Discover short-form editorial content, skincare education, product insights, trends, routines, tips and commentary from top sources globally, curated for SA.",
  searchable = false,
  showExploreLink = false,
  paginate = false,
}: NewsroomFeedProps) => {
  const [page, setPage] = usePageParam("page");
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>(() => {
    const s = searchParams.get("sort");
    return s === "oldest" || s === "popular" || s === "reading" ? s : "newest";
  });
  const [regionFilter, setRegionFilter] = useState(() => searchParams.get("region") ?? "all");
  const { tags: allRegionTags } = useSaContextTags();
  const { articles: fetchedArticles, loading, totalCount } = useNewsArticles(
    paginate
      ? { page, pageSize: NEWSROOM_PAGE_SIZE, region: regionFilter !== "all" ? regionFilter : null }
      : limit,
  );
  const totalPages = paginate ? Math.max(1, Math.ceil(totalCount / NEWSROOM_PAGE_SIZE)) : 1;
  const HeadingTag = paginate ? "h1" : "h2";
  const [likedIds, setLikedIds] = useState<string[]>(getLikedBriefingIds);

  useEffect(() => {
    if (!paginate) return;
    const next = new URLSearchParams(searchParams);
    if (query.trim()) next.set("q", query.trim()); else next.delete("q");
    if (sort !== "newest") next.set("sort", sort); else next.delete("sort");
    if (regionFilter !== "all") next.set("region", regionFilter); else next.delete("region");
    if (page > 1) next.set("page", String(page));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, regionFilter, paginate]);

  // Global SA context tags from the full published catalogue (not just this page).
  const regions = allRegionTags;

  const articles = useMemo(() => {
    let list = [...fetchedArticles];
    if ((searchable || paginate) && query.trim()) {
      list = list
        .map((article) => ({
          article,
          score: scoreTextItem(query, article.title, `${article.sa_context_tag} ${article.excerpt} ${article.source_name}`).score,
        }))
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((e) => e.article);
    }
    switch (sort) {
      case "oldest":
        list.sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime());
        break;
      case "popular":
        list.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
        break;
      case "reading":
        list.sort((a, b) => {
          const ra = parseInt(String(a.reading_time).replace(/\D/g, ""), 10) || 0;
          const rb = parseInt(String(b.reading_time).replace(/\D/g, ""), 10) || 0;
          return ra - rb;
        });
        break;
      default:
        list.sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
    }
    return list;
  }, [fetchedArticles, query, searchable, paginate, sort]);

  const handleLike = (article: NewsArticleSummary) => {
    setLikedIds(toggleLikedBriefing(article.id));
    toast.success(likedIds.includes(article.id) ? "Like removed" : "Briefing liked");
  };

  const clearFilters = () => {
    setQuery("");
    setSort("newest");
    setRegionFilter("all");
    if (paginate) setPage(1);
  };
  const hasActiveFilters = query.trim() !== "" || sort !== "newest" || regionFilter !== "all";
  const showToolbar = searchable || paginate;

  return (
    <section id="newsroom" className="bg-background py-10" aria-labelledby="daily-skinny-heading">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Daily briefing</p>
            <HeadingTag id="daily-skinny-heading" className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              {heading}
            </HeadingTag>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {showExploreLink && (
            <Link to="/briefings" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline">
              Explore all briefings <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {showToolbar && (
          <div className="mb-8 space-y-3 rounded-2xl border border-border bg-card/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search briefings by topic, region or keyword…"
                  className="pl-9"
                  aria-label="Search briefings"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="briefing-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="h-10 appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground"
                    aria-label="Sort briefings"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="popular">Most viewed</option>
                    <option value="reading">Shortest read</option>
                  </select>
                </div>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="briefing-region"
                    value={regionFilter}
                    onChange={(e) => {
                      setRegionFilter(e.target.value);
                      if (paginate) setPage(1);
                    }}
                    className="h-10 max-w-[200px] appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground"
                    aria-label="Filter by SA context"
                  >
                    <option value="all">All SA contexts</option>
                    {regions.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {loading ? "Loading briefings…" : `${articles.length} briefing${articles.length === 1 ? "" : "s"}${hasActiveFilters ? " matching filters" : ""}`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {query.trim() || regionFilter !== "all"
              ? "No briefings match those filters. Try clearing search or region."
              : "The next briefing publishes at 6am SAST. Check back shortly."}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <Fragment key={article.id}>
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="gradient-border-anim group flex flex-col overflow-hidden rounded-3xl border border-transparent bg-card"
                  itemScope
                  itemType="https://schema.org/NewsArticle"
                >
                  <Link to={`/briefings/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                    <BriefingCover article={article} />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                      <MapPin className="h-3 w-3" /> {article.sa_context_tag}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span itemProp="publisher">{article.source_name}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {article.reading_time}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {article.view_count.toLocaleString()}</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold leading-snug text-foreground" itemProp="headline">
                      <Link to={`/briefings/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="text-sm text-muted-foreground" itemProp="description">{article.excerpt}</p>
                    <ul className="space-y-1.5">
                      {article.key_takeaways.slice(0, 3).map((takeaway) => (
                        <li key={takeaway} className="flex gap-2 text-sm text-muted-foreground">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <Link to={`/briefings/${article.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        Read the breakdown <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleLike(article)} aria-label="Like article" className="rounded-full p-2 hover:bg-accent">
                          <Heart className={cn("h-4 w-4", likedIds.includes(article.id) && "fill-primary text-primary")} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
                {(index + 1) % 3 === 0 && index < articles.length - 1 ? (
                  <div className="col-span-full my-2">
                    {(index + 1) % 6 === 0 ? (
                      <AdSlotAutorelaxed placement={`briefings-feed-${index}`} compact />
                    ) : (
                      <AdSlot placement={`briefings-feed-${index}`} compact />
                    )}
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        )}

        {paginate && !loading && articles.length > 0 && (
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} className="mt-10" />
        )}
      </div>
    </section>
  );
};

export default NewsroomFeed;
