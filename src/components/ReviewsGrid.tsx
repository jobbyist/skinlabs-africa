import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { overallScore, productReviews, reviewCategories } from "@/data/reviews";
import { useEngagementStore } from "@/stores/engagementStore";
import { scoreProductReview } from "@/lib/search-engine";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        whileInView={{ width: `${value * 10}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  </div>
);

interface ReviewsGridProps {
  limit?: number;
  heading?: string;
  description?: string;
  /** When true (default on full /reviews page), enable SEO pagination at 6 per page */
  paginate?: boolean;
}

const ReviewsGrid = ({
  limit,
  heading = "Independent SA product scores",
  description = "Every product scored on efficacy, value, texture and how it actually performs in South African heat, sun and dryness. No affiliate deals, no gifted samples.",
  paginate = false,
}: ReviewsGridProps) => {
  const { likedIds, toggleLike } = useEngagementStore();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [skinType, setSkinType] = useState("all");
  const params = useParams<{ page?: string }>();
  const navigate = useNavigate();

  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const filtered = useMemo(() => {
    // .filter() always returns a fresh array — important since sortBy below sorts in
    // place, and productReviews is a shared module-level array read elsewhere in the app.
    let base = productReviews.filter((r) => category === "All" || r.category === category);
    
    // Apply price range filter
    if (priceRange !== "all") {
      base = base.filter((r) => {
        const price = r.local_price_zar;
        if (priceRange === "under-200") return price < 200;
        if (priceRange === "200-500") return price >= 200 && price <= 500;
        if (priceRange === "over-500") return price > 500;
        return true;
      });
    }
    
    // Apply skin type filter
    if (skinType !== "all") {
      base = base.filter((r) => r.skin_type_match.includes(skinType));
    }

    // Apply sorting
    if (sortBy === "newest") {
      base = base.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === "rating") {
      base = base.sort((a, b) => overallScore(b) - overallScore(a));
    } else if (sortBy === "price-low") {
      base = base.sort((a, b) => a.local_price_zar - b.local_price_zar);
    } else if (sortBy === "price-high") {
      base = base.sort((a, b) => b.local_price_zar - a.local_price_zar);
    }

    // Natural-language search — "contains hyaluronic acid", "best for hyperpigmentation" —
    // resolves via the ingredient/concern-aware relevance engine, overriding manual sort.
    if (query.trim()) {
      base = base
        .map((review) => ({ review, match: scoreProductReview(query, review) }))
        .filter((entry) => entry.match.score > 0)
        .sort((a, b) => b.match.score - a.match.score)
        .map((entry) => entry.review);
    }
    if (limit) return base.slice(0, limit);
    return base;
  }, [category, limit, query, priceRange, skinType, sortBy]);

  const matchReasons = useMemo(() => {
    if (!query.trim()) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const review of filtered) {
      const title = `${review.brand} ${review.product_name}`.trim();
      map.set(
        review.id,
        scoreProductReview(query, review).reasons.filter((reason) => reason !== title),
      );
    }
    return map;
  }, [filtered, query]);

  const paginatedReviews = filtered;

  const totalPages = paginate && !limit ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) : 1;
  const page = Math.min(currentPage, totalPages);
  const pageItems =
    paginate && !limit ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  const goToPage = (p: number) => {
    if (p <= 1) navigate("/reviews");
    else navigate(`/reviews/page/${p}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="reviews" className="bg-secondary/30 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Reviews</p>
          {paginate ? (
            <h1 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h1>
          ) : (
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
          )}
          <p className="text-muted-foreground">{description}</p>
        </div>

        {!limit && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Try "contains niacinamide" or "best for hyperpigmentation"'
              className="pl-9"
              aria-label="Search product reviews"
            />
          </div>
        )}

        {!limit && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Price Range</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-200">Under R200</SelectItem>
                    <SelectItem value="200-500">R200 - R500</SelectItem>
                    <SelectItem value="over-500">Over R500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Skin Type</label>
                <Select value={skinType} onValueChange={setSkinType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All skin types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skin Types</SelectItem>
                    <SelectItem value="Oily">Oily</SelectItem>
                    <SelectItem value="Dry">Dry</SelectItem>
                    <SelectItem value="Combination">Combination</SelectItem>
                    <SelectItem value="Sensitive">Sensitive</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Mature">Mature</SelectItem>
                    <SelectItem value="Acne-prone">Acne-prone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">Showing {paginatedReviews.length} of {filtered.length} reviews</p>
              </div>
            </div>
          </>
        )}
        
        {!limit && (
          <div className="mb-8 flex flex-wrap gap-2">
            {["All", ...reviewCategories].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  if (paginate) goToPage(1);
                }}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  category === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-3xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.brand}</p>
                  <h3 className="font-heading text-lg font-bold leading-snug text-foreground">
                    {review.product_name}
                  </h3>
                </div>
                <div className="flex shrink-0 flex-col items-center rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
                  <span className="font-heading text-lg font-extrabold leading-none">{overallScore(review)}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">score</span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">R{review.local_price_zar}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {review.where_to_buy}
                </span>
                {review.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                    <Star className="h-3 w-3" /> New
                  </span>
                )}
              </div>

              <div className="mb-5 space-y-2.5">
                <ScoreBar label="Efficacy" value={review.score_efficacy} />
                <ScoreBar label="Value for money" value={review.score_value} />
                <ScoreBar label="Texture" value={review.score_texture} />
                <ScoreBar label="SA climate fit" value={review.score_climate} />
              </div>

              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{review.verdict}</p>

              {query.trim() && (matchReasons.get(review.id)?.length ?? 0) > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {matchReasons.get(review.id)!.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/reviews/${review.id}`}>Full breakdown</Link>
                </Button>
                <button
                  onClick={() => toggleLike(review.id)}
                  aria-label="Like review"
                  className="rounded-full p-2 hover:bg-accent"
                >
                  <Heart className={cn("h-4 w-4", likedIds.includes(review.id) && "fill-primary text-primary")} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {pageItems.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">No reviews match that search yet.</p>
        )}

        {paginate && !limit && totalPages > 1 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Reviews pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(p)}
                aria-current={p === page ? "page" : undefined}
                className="min-w-9"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </div>
    </section>
  );
};

export default ReviewsGrid;
