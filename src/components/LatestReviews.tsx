import { useMemo } from "react";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { overallScore } from "@/data/reviews";
import { pickLatestReviews } from "@/lib/latestReviews";
import { getCategoryImage } from "@/data/productImages";
import { useProductCoverImages } from "@/hooks/use-product-cover-images";
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";

const LatestReviews = () => {
  const { data: generated } = useGeneratedReviews();
  const { data: realCovers } = useProductCoverImages();
  const reviews = useMemo(() => pickLatestReviews(generated), [generated]);
  if (reviews.length === 0) return null;

  return (
    <section id="latest-reviews" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Product reviews</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">Latest product reviews</h2>
            <p className="text-muted-foreground">
              Fresh scores on efficacy, value, texture and how each product copes with South African heat, sun and dryness.
            </p>
          </div>
          <Link to="/reviews" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline">
            Browse all reviews
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((review, index) => {
            const realCover = realCovers?.get(review.id);
            const image = realCover ?? getCategoryImage(review.category);
            return (
              <m.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <Link
                  to={`/reviews/${review.id}`}
                  className="card-interactive group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card"
                  aria-label={`Full breakdown: ${review.brand} ${review.product_name}`}
                >
                  <div className="relative">
                    <img src={image.url} alt={image.alt} loading="lazy" width={400} height={176} className={realCover ? "h-44 w-full bg-white object-contain p-2" : "h-44 w-full object-cover"} referrerPolicy={realCover ? "no-referrer" : undefined} />
                    <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                      {review.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{review.brand}</p>
                        <h3 className="font-heading text-base font-bold leading-snug text-foreground">{review.product_name}</h3>
                      </div>
                      <div className="flex shrink-0 flex-col items-center rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
                        <span className="font-heading text-lg font-extrabold leading-none">{overallScore(review)}</span>
                        <span className="text-[10px] uppercase tracking-wide opacity-80">score</span>
                      </div>
                    </div>
                    <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{review.verdict}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      Full breakdown <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestReviews;
