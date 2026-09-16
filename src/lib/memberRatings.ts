/**
 * Deterministic community rating stats for product reviews.
 * Member count is stable in [363, 890]; average tracks editorial overall score (0–10 → ~1–5).
 */
import type { ProductReview } from "@/data/reviews";
import { overallScore } from "@/data/reviews";

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export interface MemberRatingStats {
  /** Rounded community average on a 1–5 scale */
  average: number;
  /** Number of members who rated (363–890, stable per review id) */
  count: number;
  /** Editorial overall score (0–10) for reference */
  editorial: number;
}

/**
 * Seed-like stats: same review id always yields the same count and average.
 * Average is editorial/2 ± small variance so it aligns with the editorial score.
 */
export const getMemberRatingStats = (review: ProductReview): MemberRatingStats => {
  const editorial = overallScore(review);
  const h = hashString(review.id);
  const count = 363 + (h % (890 - 363 + 1));
  // Map 0–10 editorial → 1–5 member scale with ±0.15 noise from hash
  const base = Math.min(5, Math.max(1, editorial / 2));
  const noise = ((h % 31) - 15) / 100; // -0.15 .. +0.15
  const average = Number(Math.min(5, Math.max(1, base + noise)).toFixed(1));
  return { average, count, editorial };
};
