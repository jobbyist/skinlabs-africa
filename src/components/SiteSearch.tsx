import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, FileText, type LucideIcon, Mic, Newspaper, Sparkles, Star, Sun, Swords } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { productReviews } from "@/data/reviews";
import { comparisonArticles } from "@/data/comparisons";
import { podcastEpisodes } from "@/data/podcast";
import { spotlightRanking } from "@/data/spotlight";
import { allSeasons, seasonHubs } from "@/data/seasonals";
import { searchablePages } from "@/lib/search-index";
import { scoreProductReview, scoreTextItem } from "@/lib/search-engine";

interface SiteSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RankedResult {
  key: string;
  score: number;
  reasons: string[];
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
}

/** Debounces a fast-changing value so relevance scoring doesn't re-run on every keystroke. */
const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
};

const TOP_MATCHES_CAP = 6;
const GROUP_CAP = 6;

const SiteSearch = ({ open, onOpenChange }: SiteSearchProps) => {
  const navigate = useNavigate();
  const { articles: briefings } = useNewsArticles(30);
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 120);
  const hasQuery = query.trim().length > 0;

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

  useEffect(() => {
    if (!open) setRawQuery("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  // Every corpus, scored (real-time, in-browser — no round trip) via the ingredient/
  // concern-aware relevance engine so a query like "best products for hyperpigmentation"
  // or "products that contain hyaluronic acid" ranks results instead of just filtering them.
  const ranked = useMemo(() => {
    const comparisons: RankedResult[] = comparisonArticles.map((a) => {
      const match = scoreTextItem(query, a.title, a.saContext, a.productsCompared.flatMap((p) => [p.brand, p.name]));
      return { key: `cmp-${a.slug}`, score: match.score, reasons: match.reasons, icon: Swords, title: a.title, subtitle: "Shelf Showdown", href: `/reviews/versus/${a.slug}` };
    });

    const spotlight: RankedResult[] = spotlightRanking.map((entry) => {
      const match = scoreTextItem(query, entry.brand, `${entry.editorial.positioningStatement} ${entry.editorial.knownFor}`);
      return { key: `spot-${entry.slug}`, score: match.score, reasons: match.reasons, icon: Award, title: entry.brand, subtitle: "Spotlight brand", href: `/spotlight/${entry.slug}` };
    });

    const seasonals: RankedResult[] = allSeasons.map((season) => {
      const hub = seasonHubs[season];
      const match = scoreTextItem(query, hub.h1, `${hub.tagline} ${hub.months}`);
      return { key: `season-${season}`, score: match.score, reasons: match.reasons, icon: Sun, title: hub.h1, subtitle: "Seasonal", href: `/seasonals/${season}` };
    });

    const reviews: RankedResult[] = productReviews.map((review) => {
      const match = scoreProductReview(query, review);
      return {
        key: `rev-${review.id}`,
        score: match.score,
        reasons: match.reasons,
        icon: Star,
        title: `${review.brand} — ${review.product_name}`,
        subtitle: match.reasons.find((r) => r !== `${review.brand} ${review.product_name}`.trim()),
        href: `/reviews/${review.id}`,
      };
    });

    const news: RankedResult[] = briefings.map((article) => {
      const match = scoreTextItem(query, article.title, `${article.sa_context_tag} ${article.excerpt}`);
      return { key: `news-${article.id}`, score: match.score, reasons: match.reasons, icon: Newspaper, title: article.title, subtitle: "The Daily Skinny", href: `/newsroom/${article.slug}` };
    });

    const podcast: RankedResult[] = podcastEpisodes.map((episode) => {
      const match = scoreTextItem(query, episode.title, episode.description, episode.topics);
      return { key: `pod-${episode.id}`, score: match.score, reasons: match.reasons, icon: Mic, title: episode.title, subtitle: "The Skin Deep Podcast", href: `/podcast/${episode.slug}` };
    });

    const pages: RankedResult[] = searchablePages.map((page) => {
      const match = scoreTextItem(query, page.title, page.description, page.keywords?.split(" "));
      return { key: `page-${page.href}`, score: match.score, reasons: match.reasons, icon: FileText, title: page.title, subtitle: page.description, href: page.href };
    });

    return { comparisons, spotlight, seasonals, reviews, news, podcast, pages };
  }, [query, briefings]);

  const matched = (list: RankedResult[]) => list.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  const forDisplay = (list: RankedResult[], fallback: RankedResult[]) => (hasQuery ? matched(list).slice(0, GROUP_CAP) : fallback);

  const bestMatches = useMemo(() => {
    if (!hasQuery) return [];
    return [...ranked.comparisons, ...ranked.spotlight, ...ranked.seasonals, ...ranked.reviews, ...ranked.news, ...ranked.podcast, ...ranked.pages]
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_MATCHES_CAP);
  }, [ranked, hasQuery]);

  const noResults = hasQuery && bestMatches.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        value={rawQuery}
        onValueChange={setRawQuery}
        placeholder='Ask anything — "best products for hyperpigmentation", "contains hyaluronic acid"…'
      />
      <CommandList>
        {noResults && <CommandEmpty>No results. Try a product, brand, ingredient or skin concern.</CommandEmpty>}

        {bestMatches.length > 0 && (
          <CommandGroup heading="Best matches">
            {bestMatches.map((result) => (
              <CommandItem key={`best-${result.key}`} value={result.key} onSelect={() => go(result.href)}>
                <result.icon />
                <span className="flex-1 truncate">{result.title}</span>
                {result.reasons.length > 0 && (
                  <span className="ml-2 shrink-0 truncate text-xs text-muted-foreground">
                    {result.reasons.filter((r) => r !== result.title).slice(0, 2).join(" · ")}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Shelf Showdown">
          {forDisplay(ranked.comparisons, ranked.comparisons).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <Swords />
              <span>{result.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Spotlight Brands">
          {forDisplay(ranked.spotlight, ranked.spotlight).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <Award />
              <span>{result.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Seasonals">
          {forDisplay(ranked.seasonals, ranked.seasonals).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <Sun />
              <span>{result.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Product Reviews">
          {forDisplay(ranked.reviews, ranked.reviews.slice(0, 60)).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <Star />
              <span className="flex-1 truncate">{result.title}</span>
              {hasQuery && result.subtitle && (
                <span className="ml-2 flex shrink-0 items-center gap-1 truncate text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> {result.subtitle}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {ranked.news.length > 0 && (
          <CommandGroup heading="The Daily Skinny">
            {forDisplay(ranked.news, ranked.news).map((result) => (
              <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
                <Newspaper />
                <span>{result.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Podcast episodes">
          {forDisplay(ranked.podcast, ranked.podcast).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <Mic />
              <span>{result.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Pages">
          {forDisplay(ranked.pages, ranked.pages).map((result) => (
            <CommandItem key={result.key} value={result.key} onSelect={() => go(result.href)}>
              <FileText />
              <span>{result.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default SiteSearch;
