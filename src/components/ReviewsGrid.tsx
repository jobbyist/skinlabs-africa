import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { overallScore, productReviews, reviewCategories } from "@/data/reviews";
import { useEngagementStore } from "@/stores/engagementStore";
import { matchScore } from "@/lib/search-index";
import { cn } from "@/lib/utils";


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
}

const ReviewsGrid = ({
  limit,
  heading = "Independent SA Product Reviews",
  description = "Every product scored on efficacy, value, texture and how it actually performs in South African heat, sun and dryness. No affiliate deals, no gifted samples.",
}: ReviewsGridProps) => {
  
  const [searchParams, setSearchParams] = useSearchParams();
  const { likedIds, toggleLike } = useEngagementStore();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [skinType, setSkinType] = useState("all");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const ITEMS_PER_PAGE = 10;

  const filtered = useMemo(() => {
    let base = category === "All" ? productReviews : productReviews.filter((r) => r.category === category);
    if (query.trim()) {
      base = base
        .map((review) => ({
          review,
          score: matchScore(query, `${review.brand} ${review.product_name}`, `${review.category} ${review.key_ingredients.join(" ")} ${review.verdict}`),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.review);
    }
    
    // Apply price filter
    if (priceRange !== "all") {
      if (priceRange === "under-200") {
        base = base.filter((r) => r.local_price_zar < 200);
      } else if (priceRange === "200-500") {
        base = base.filter((r) => r.local_price_zar >= 200 && r.local_price_zar <= 500);
      } else if (priceRange === "over-500") {
        base = base.filter((r) => r.local_price_zar > 500);
      }
    }
    
    // Apply skin type filter
    if (skinType !== "all") {
      base = base.filter((r) => r.skin_type_match.includes(skinType));
    }
    
    // Apply sorting
    if (sortBy === "price-low") {
      base = base.sort((a, b) => a.local_price_zar - b.local_price_zar);
    } else if (sortBy === "price-high") {
      base = base.sort((a, b) => b.local_price_zar - a.local_price_zar);
    } else if (sortBy === "rating") {
      base = base.sort((a, b) => overallScore(b) - overallScore(a));
    } else if (sortBy === "newest") {
      // Show new items first
      base = base.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
    
    return limit ? base.slice(0, limit) : base;
  }, [category, limit, query, priceRange, skinType, sortBy]);
  
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    if (limit) return filtered;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage, limit]);
  
  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="reviews" className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Review engine</p>
          <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {!limit && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, brand or ingredient"
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
                onClick={() => setCategory(item)}
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
          {paginatedReviews.map((review, index) => (
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

              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{review.verdict}</p>

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

        {paginatedReviews.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">No reviews match that search yet.</p>
        )}
        
        {!limit && totalPages > 1 && (
          <div className="mt-10">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink onClick={() => handlePageChange(page)} isActive={page === currentPage} className="cursor-pointer">
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsGrid;
