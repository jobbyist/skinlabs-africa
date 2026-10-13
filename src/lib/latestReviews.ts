// Kept apart from homepageSelection.ts: this pulls in the review catalogue, which must stay out of the entry chunk.
import { productReviews, type ProductReview } from "@/data/reviews";

/** Newest first: pipeline reviews by publish date, topped up with the catalogue's "new" picks if fewer than `limit` exist. */
export const pickLatestReviews = (generated: ProductReview[] | undefined, limit = 3): ProductReview[] => {
  const dated = [...(generated ?? [])].sort(
    (a, b) => new Date(b.published_date ?? 0).getTime() - new Date(a.published_date ?? 0).getTime(),
  );
  if (dated.length >= limit) return dated.slice(0, limit);
  const fillers = productReviews.filter((r) => r.isNew && !dated.some((d) => d.id === r.id));
  return [...dated, ...fillers].slice(0, limit);
};
