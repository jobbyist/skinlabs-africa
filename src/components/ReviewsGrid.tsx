import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, Star } from "lucide-react";
import { overallScore } from "@/data/reviews";
import { useProductReviews } from "@/hooks/use-product-reviews";
import { useEngagementStore } from "@/stores/engagementStore";
import BrandMark from "@/components/BrandMark";
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
  
  const { likedIds, toggleLike } = useEngagementStore();
  const [category, setCategory] = useState("All");
  const { data: productReviews = [] } = useProductReviews();
  const reviewCategories = useMemo(
    () => Array.from(new Set(productReviews.map((review) => review.category))),
    [productReviews],
  );

  const filtered = useMemo(() => {
    const base = category === "All" ? productReviews : productReviews.filter((r) => r.category === category);
    return limit ? base.slice(0, limit) : base;
  }, [category, limit, productReviews]);

  return (
    <section id="reviews" className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Review engine</p>
          <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

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
          {filtered.map((review, index) => (
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
                  <BrandMark name={review.brand} type="brand" className="mb-1.5 h-6" />
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
                <Link
                  to={`/reviews/${review.id}`}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Full breakdown
                </Link>
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
      </div>
    </section>
  );
};

export default ReviewsGrid;
