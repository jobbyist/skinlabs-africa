import { useState } from "react";
import { Link } from "react-router-dom";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { getViewedStoryIds, markStoryViewed } from "@/lib/webStoriesEngagement";
import { cn } from "@/lib/utils";

const STORY_COUNT = 10;
const PLACEHOLDER_COVER = "/briefing-placeholder-cover.svg";

const truncateLabel = (title: string, max = 15) =>
  title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;

interface WebStoriesBarProps {
  /** Matches the fixed offset Header.tsx computes for the promo bar (top-0 / top-9). */
  top: "top-0" | "top-9";
}

/**
 * Instagram-style story rail of the latest Daily Skinny briefings, real
 * published content only (via useNewsArticles — never fabricated). Mobile
 * only (md:hidden), fixed directly above the main nav <header>; Header.tsx
 * renders a matching h-24 flow spacer so page content clears both this bar
 * and the header itself. See Header.tsx's own top-offset comment for how
 * this stacks with the (also fixed, also optional) promo announcement bar.
 */
const WebStoriesBar = ({ top }: WebStoriesBarProps) => {
  const { articles, loading } = useNewsArticles(STORY_COUNT);
  const [viewedIds, setViewedIds] = useState<string[]>(getViewedStoryIds);

  if (loading || articles.length === 0) return null;

  const handleOpen = (articleId: string) => setViewedIds(markStoryViewed(articleId));

  return (
    <nav
      aria-label="Skin briefing stories"
      className={cn(
        "scrollbar-hide fixed inset-x-0 z-[55] flex h-24 items-center gap-4 overflow-x-auto border-b border-border/60 bg-background/95 px-4 backdrop-blur-md md:hidden",
        top,
      )}
    >
      {articles.map((article) => {
        const viewed = viewedIds.includes(article.id);
        return (
          <Link
            key={article.id}
            to={`/briefings/${article.slug}`}
            onClick={() => handleOpen(article.id)}
            aria-label={`Story: ${article.title}`}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full p-[2px]",
                viewed ? "bg-border" : "gradient-border-anim",
              )}
              aria-hidden="true"
            >
              <span className="h-full w-full overflow-hidden rounded-full border-2 border-background bg-muted">
                <img
                  src={article.cover_image_url || PLACEHOLDER_COVER}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    if (event.currentTarget.src !== PLACEHOLDER_COVER && !event.currentTarget.src.endsWith(PLACEHOLDER_COVER)) {
                      event.currentTarget.src = PLACEHOLDER_COVER;
                    }
                  }}
                  className="h-full w-full object-cover"
                />
              </span>
            </span>
            <span
              className={cn(
                "max-w-[68px] truncate text-center text-[11px] leading-tight",
                viewed ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {truncateLabel(article.title)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default WebStoriesBar;
