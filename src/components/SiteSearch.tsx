import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Beaker,
  Clock,
  FileText,
  HelpCircle,
  type LucideIcon,
  Mic,
  Newspaper,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Swords,
  X,
} from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";
import { useGeneratedComparisons } from "@/hooks/use-generated-comparisons";
import { productReviews } from "@/data/reviews";
import { comparisonArticles } from "@/data/comparisons";
import { podcastEpisodes } from "@/data/podcast";
import { spotlightRanking } from "@/data/spotlight";
import { allSeasons, seasonHubs } from "@/data/seasonals";
import { faqEntries } from "@/data/faq";
import { searchablePages } from "@/lib/search-index";
import { scoreProductReview, scoreTextItem } from "@/lib/search-engine";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { trackConversionEvent } from "@/lib/analytics-events";
import { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch, type SearchHistoryEntry } from "@/lib/searchHistory";

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

interface BrowseLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TOP_MATCHES_CAP = 6;
const GROUP_CAP = 6;

// Example prompts only — never presented as real trending/popularity data.
const SUGGESTED_SEARCHES = [
  "vitamin C serum",
  "niacinamide for oily skin",
  "SPF for melanin-rich skin",
  "hyperpigmentation routine",
  "retinol for beginners",
  "sensitive skin barrier repair",
  "SKYNN AI skin analysis",
  "salicylic acid vs benzoyl peroxide",
];

const BROWSE_LINKS: BrowseLink[] = [
  { label: "Briefings", href: "/briefings", icon: Newspaper },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Ingredients", href: "/ingredients", icon: Beaker },
  { label: "Spotlight", href: "/spotlight", icon: Award },
  { label: "Comparisons", href: "/compare", icon: Swords },
  { label: "Seasonals", href: "/seasonals", icon: Sun },
  { label: "Skin Analysis", href: "/skynn-ai", icon: Sparkles },
];

const FOLD_TRANSITION = { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const };
const FOLD_TRANSITION_REDUCED = { duration: 0.15, ease: "linear" as const };

const SiteSearch = ({ open, onOpenChange }: SiteSearchProps) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { articles: briefings } = useNewsArticles(30);
  const { data: marketplaceProducts } = useMarketplaceProducts();
  const { data: generatedReviews } = useGeneratedReviews();
  const allReviews = useMemo(
    () => (generatedReviews?.length ? [...generatedReviews, ...productReviews] : productReviews),
    [generatedReviews],
  );
  const { data: generatedComparisons } = useGeneratedComparisons();
  const allComparisonArticles = useMemo(
    () => (generatedComparisons?.length ? [...generatedComparisons, ...comparisonArticles] : comparisonArticles),
    [generatedComparisons],
  );
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 120);
  const hasQuery = query.trim().length > 0;
  const [recentSearches, setRecentSearches] = useState<SearchHistoryEntry[]>(getRecentSearches);

  // Cmd/Ctrl+K opens search from anywhere on the site; Escape closes it; Tab
  // wraps within the drawer (a lightweight manual focus trap — this drawer
  // renders as a plain fixed panel rather than a Radix Dialog, so none of
  // that comes for free).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      inputRef.current?.focus();
    } else {
      setRawQuery("");
    }
  }, [open]);

  const go = (href: string) => {
    if (hasQuery) {
      trackConversionEvent("site_search_result_clicked", { query: query.trim().slice(0, 100), href });
      setRecentSearches(addRecentSearch(query.trim()));
    }
    onOpenChange(false);
    navigate(href);
  };

  const applyTerm = (term: string) => {
    setRawQuery(term);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (term: string) => {
    setRecentSearches(removeRecentSearch(term));
  };

  const handleClearRecent = () => {
    setRecentSearches(clearRecentSearches());
  };

  // Every corpus, scored (real-time, in-browser — no round trip) via the ingredient/
  // concern-aware relevance engine so a query like "best products for hyperpigmentation"
  // or "products that contain hyaluronic acid" ranks results instead of just filtering them.
  const ranked = useMemo(() => {
    const comparisons: RankedResult[] = allComparisonArticles.map((a) => {
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

    const reviews: RankedResult[] = allReviews.map((review) => {
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
      return { key: `news-${article.id}`, score: match.score, reasons: match.reasons, icon: Newspaper, title: article.title, subtitle: "The Daily Skinny", href: `/briefings/${article.slug}` };
    });

    const podcast: RankedResult[] = podcastEpisodes.map((episode) => {
      const match = scoreTextItem(
        query,
        episode.title,
        `${episode.description} ${episode.showNotes.join(" ")} ${episode.transcript.map((line) => line.text).join(" ")}`,
        episode.topics,
      );
      return { key: `pod-${episode.id}`, score: match.score, reasons: match.reasons, icon: Mic, title: episode.title, subtitle: "The Skin Deep Podcast", href: `/podcast/${episode.slug}` };
    });

    const pages: RankedResult[] = searchablePages.map((page) => {
      const match = scoreTextItem(query, page.title, page.description, page.keywords?.split(" "));
      return { key: `page-${page.href}`, score: match.score, reasons: match.reasons, icon: FileText, title: page.title, subtitle: page.description, href: page.href };
    });

    const knowledgeHub: RankedResult[] = faqEntries.map((entry) => {
      const match = scoreTextItem(query, entry.question, entry.answer, entry.tags);
      return {
        key: `faq-${entry.id}`,
        score: match.score,
        reasons: match.reasons,
        icon: HelpCircle,
        title: entry.question,
        subtitle: "Knowledge Hub",
        href: `/knowledge-hub/${entry.slug}`,
      };
    });

    const marketplace: RankedResult[] = (marketplaceProducts ?? []).map((product) => {
      const match = scoreTextItem(
        query,
        `${product.brand.name} ${product.name}`,
        product.description,
        [product.category, ...product.concern, ...product.values, ...product.keyActives],
      );
      return {
        key: `mkt-${product.id}`,
        score: match.score,
        reasons: match.reasons,
        icon: ShoppingBag,
        title: `${product.brand.name} — ${product.name}`,
        subtitle: "OpenHaus Marketplace",
        href: `/marketplace/product/${product.slug}`,
      };
    });

    return { comparisons, spotlight, seasonals, reviews, news, podcast, pages, knowledgeHub, marketplace };
  }, [query, briefings, marketplaceProducts, allReviews, allComparisonArticles]);

  const matched = (list: RankedResult[]) => list.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  const forDisplay = (list: RankedResult[]) => matched(list).slice(0, GROUP_CAP);

  const bestMatches = useMemo(() => {
    if (!hasQuery) return [];
    return [...ranked.comparisons, ...ranked.spotlight, ...ranked.seasonals, ...ranked.reviews, ...ranked.marketplace, ...ranked.news, ...ranked.podcast, ...ranked.pages, ...ranked.knowledgeHub]
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_MATCHES_CAP);
  }, [ranked, hasQuery]);

  const noResults = hasQuery && bestMatches.length === 0;

  const resultGroups = hasQuery
    ? [
        { heading: "Shelf Showdown", icon: Swords, items: forDisplay(ranked.comparisons) },
        { heading: "Spotlight Brands", icon: Award, items: forDisplay(ranked.spotlight) },
        { heading: "Seasonals", icon: Sun, items: forDisplay(ranked.seasonals) },
        { heading: "Product Reviews", icon: Star, items: forDisplay(ranked.reviews) },
        { heading: "OpenHaus Marketplace", icon: ShoppingBag, items: forDisplay(ranked.marketplace) },
        { heading: "The Daily Skinny", icon: Newspaper, items: forDisplay(ranked.news) },
        { heading: "Podcast Episodes", icon: Mic, items: forDisplay(ranked.podcast) },
        { heading: "Pages", icon: FileText, items: forDisplay(ranked.pages) },
        { heading: "Knowledge Hub", icon: HelpCircle, items: forDisplay(ranked.knowledgeHub) },
      ].filter((group) => group.items.length > 0)
    : [];

  const transition = shouldReduceMotion ? FOLD_TRANSITION_REDUCED : FOLD_TRANSITION;
  const collapsed = { clipPath: "inset(0 0 100% 0)" };
  const revealed = { clipPath: "inset(0 0 0% 0)" };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="site-search-drawer"
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search SkinLabs"
          className="fixed inset-0 z-[75] flex flex-col overflow-hidden bg-background"
          initial={shouldReduceMotion ? { opacity: 0 } : collapsed}
          animate={shouldReduceMotion ? { opacity: 1 } : revealed}
          exit={shouldReduceMotion ? { opacity: 0 } : collapsed}
          transition={transition}
        >
          <Command shouldFilter={false} className="flex h-full w-full flex-col overflow-hidden rounded-none bg-transparent">
            {/* Header row — large, prominent search field + clear/close affordances. */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md sm:px-8 sm:py-5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <CommandPrimitive.Input
                ref={inputRef}
                value={rawQuery}
                onValueChange={setRawQuery}
                placeholder='Ask anything — "best products for hyperpigmentation", "contains hyaluronic acid"…'
                className="h-9 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/60 sm:text-lg"
              />
              {rawQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setRawQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search input"
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close search"
                className="ml-1 shrink-0 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CommandList className="max-h-none flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto w-full max-w-2xl">
                {!hasQuery ? (
                  <>
                    {recentSearches.length > 0 && (
                      <>
                        <CommandGroup
                          heading={
                            <div className="flex items-center justify-between">
                              <span>Recent searches</span>
                              <button
                                type="button"
                                onClick={handleClearRecent}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium normal-case tracking-normal text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                <X className="h-3 w-3" /> Clear
                              </button>
                            </div>
                          }
                          className="[&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:w-full [&_[cmdk-group-heading]]:px-0"
                        >
                          <div className="flex flex-col gap-1">
                            {recentSearches.map((entry) => (
                              <CommandItem
                                key={`recent-${entry.query}`}
                                value={`recent-${entry.query}`}
                                onSelect={() => applyTerm(entry.query)}
                                className="group cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm"
                              >
                                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="min-w-0 flex-1 truncate text-foreground">{entry.query}</span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRemoveRecent(entry.query);
                                  }}
                                  aria-label={`Remove "${entry.query}" from recent searches`}
                                  className="shrink-0 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </CommandItem>
                            ))}
                          </div>
                        </CommandGroup>
                        <p className="mb-6 mt-1.5 px-1 text-[11px] text-muted-foreground">
                          Saved on this device only, for 90 days.
                        </p>
                        <CommandSeparator className="mb-6" />
                      </>
                    )}

                    <CommandGroup heading="Try searching for" className="[&_[cmdk-group-heading]]:mb-3 [&_[cmdk-group-heading]]:px-0">
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_SEARCHES.map((term) => (
                          <CommandItem
                            key={`suggested-${term}`}
                            value={`suggested-${term}`}
                            onSelect={() => applyTerm(term)}
                            className="w-auto cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground data-[selected=true]:border-primary/40"
                          >
                            <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            {term}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>

                    <CommandSeparator className="my-6" />

                    <CommandGroup heading="Browse" className="[&_[cmdk-group-heading]]:mb-3 [&_[cmdk-group-heading]]:px-0">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {BROWSE_LINKS.map((link) => (
                          <CommandItem
                            key={`browse-${link.href}`}
                            value={`browse-${link.href}`}
                            onSelect={() => go(link.href)}
                            className="cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card py-5 text-center text-sm font-medium text-foreground data-[selected=true]:border-primary/40"
                          >
                            <link.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                            {link.label}
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  </>
                ) : (
                  <>
                    {noResults && (
                      <CommandEmpty className="flex flex-col items-center gap-3 py-16 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium text-foreground">No results for "{query.trim()}"</span>
                        <span className="max-w-xs text-sm text-muted-foreground">
                          Try a product, brand, ingredient or skin concern instead.
                        </span>
                      </CommandEmpty>
                    )}

                    {bestMatches.length > 0 && (
                      <>
                        <CommandGroup
                          heading="Best matches"
                          className="gradient-bg-soft -mx-1 mb-6 rounded-2xl p-2 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2"
                        >
                          <div className="flex flex-col gap-1">
                            {bestMatches.map((result) => (
                              <CommandItem
                                key={`best-${result.key}`}
                                value={`best-${result.key}`}
                                onSelect={() => go(result.href)}
                                className="cursor-pointer gap-3 rounded-xl px-3 py-3"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
                                  <result.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                                  {result.reasons.filter((r) => r !== result.title).length > 0 && (
                                    <p className="truncate text-xs text-muted-foreground">
                                      {result.reasons.filter((r) => r !== result.title).slice(0, 2).join(" · ")}
                                    </p>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </div>
                        </CommandGroup>
                        {resultGroups.length > 0 && <CommandSeparator className="mb-6" />}
                      </>
                    )}

                    {resultGroups.map((group, index) => (
                      <div key={group.heading}>
                        <CommandGroup heading={group.heading} className="mb-2 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-0">
                          <div className="flex flex-col gap-1">
                            {group.items.map((result) => (
                              <CommandItem
                                key={result.key}
                                value={result.key}
                                onSelect={() => go(result.href)}
                                className="cursor-pointer gap-3 rounded-xl px-3 py-2.5"
                              >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                  <group.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{result.title}</span>
                                {result.subtitle && (
                                  <span className="ml-2 hidden shrink-0 items-center gap-1 truncate text-xs text-muted-foreground sm:flex sm:max-w-[35%]">
                                    {result.subtitle}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </div>
                        </CommandGroup>
                        {index < resultGroups.length - 1 && <CommandSeparator className="mb-4 mt-2" />}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CommandList>

            <div className="hidden shrink-0 items-center justify-end gap-3 border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground sm:flex">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> Close
              </span>
            </div>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SiteSearch;
