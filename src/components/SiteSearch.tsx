import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, FileText, Mic, Newspaper, Star, Sun, Swords } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { productReviews } from "@/data/reviews";
import { comparisonArticles } from "@/data/comparisons";
import { podcastEpisodes } from "@/data/podcast";
import { spotlightRanking } from "@/data/spotlight";
import { allSeasons, seasonHubs } from "@/data/seasonals";
import { searchablePages } from "@/lib/search-index";

interface SiteSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SiteSearch = ({ open, onOpenChange }: SiteSearchProps) => {
  const navigate = useNavigate();
  const { articles: briefings } = useNewsArticles(30);

  // Cmd/Ctrl+K opens search from anywhere on the site.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search reviews, briefings, podcast episodes, pages…" />
        <CommandList>
          <CommandEmpty>No results. Try a product, brand or ingredient name.</CommandEmpty>

          <CommandGroup heading="Shelf Showdown">
            {comparisonArticles.map((article) => (
              <CommandItem
                key={article.slug}
                value={`${article.title} ${article.saContext} ${article.productsCompared.map((p) => `${p.brand} ${p.name}`).join(" ")}`}
                onSelect={() => go(`/reviews/versus/${article.slug}`)}
              >
                <Swords />
                <span>{article.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Spotlight Brands">
            {spotlightRanking.map((entry) => (
              <CommandItem
                key={entry.slug}
                value={`${entry.brand} ${entry.editorial.positioningStatement} ${entry.editorial.knownFor}`}
                onSelect={() => go(`/spotlight/${entry.slug}`)}
              >
                <Award />
                <span>{entry.brand}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Seasonals">
            {allSeasons.map((season) => {
              const hub = seasonHubs[season];
              return (
                <CommandItem
                  key={season}
                  value={`${hub.h1} ${hub.tagline} ${hub.months}`}
                  onSelect={() => go(`/seasonals/${season}`)}
                >
                  <Sun />
                  <span>{hub.h1}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandGroup heading="Product Reviews">
            {productReviews.slice(0, 60).map((review) => (
              <CommandItem
                key={review.id}
                value={`${review.brand} ${review.product_name} ${review.category} ${review.key_ingredients.join(" ")}`}
                onSelect={() => go(`/reviews/${review.id}`)}
              >
                <Star />
                <span>{review.brand} — {review.product_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {briefings.length > 0 && (
            <CommandGroup heading="The Daily Skinny">
              {briefings.map((article) => (
                <CommandItem
                  key={article.id}
                  value={`${article.title} ${article.sa_context_tag} ${article.excerpt}`}
                  onSelect={() => go(`/newsroom/${article.slug}`)}
                >
                  <Newspaper />
                  <span>{article.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Podcast episodes">
            {podcastEpisodes.map((episode) => (
              <CommandItem
                key={episode.id}
                value={`${episode.title} ${episode.description} ${episode.topics.join(" ")}`}
                onSelect={() => go(`/podcast/${episode.slug}`)}
              >
                <Mic />
                <span>{episode.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Pages">
            {searchablePages.map((page) => (
              <CommandItem
                key={page.href}
                value={`${page.title} ${page.description} ${page.keywords ?? ""}`}
                onSelect={() => go(page.href)}
              >
                <FileText />
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
    </CommandDialog>
  );
};

export default SiteSearch;
