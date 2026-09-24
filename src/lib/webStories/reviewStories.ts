import { overallScore, type ProductReview } from "@/data/reviews";
import { getProductImage } from "@/data/productImages";
import { getBrandBanner } from "@/lib/brand-banners";
import { clipText, MAX_BODY_CHARS, MAX_HEADLINE_CHARS, type Story, type StoryPage } from "./stories";

const PAGE_MS = 5500;
const PLACEHOLDER_COVER = "/briefing-placeholder-cover.svg";

export type ReviewImageMap = Record<string, { url: string; alt: string }>;

/**
 * Same priority as useReviewImages (brand banner → review_images row →
 * pipeline primary_image → category pool) minus the live Pexels lookup, so a
 * rail of ~200 review stories never fires ~200 image-API requests.
 */
export const resolveReviewStoryImage = (review: ProductReview, reviewImages: ReviewImageMap): { url: string; alt: string } => {
  const banner = getBrandBanner(review.brand);
  if (banner) return { url: banner, alt: `${review.brand} brand banner` };
  const fromDb = reviewImages[review.id];
  if (fromDb) return fromDb;
  if (review.primary_image) return { url: review.primary_image, alt: `${review.brand} ${review.product_name}` };
  const fromPool = getProductImage(review.category, review.id);
  if (fromPool) return { url: fromPool.url, alt: fromPool.alt };
  return { url: PLACEHOLDER_COVER, alt: `${review.brand} ${review.product_name}` };
};

/** A review as a 2–3 page story, using only the review's own published fields. */
export const storyFromReview = (review: ProductReview, image: { url: string; alt: string }, publishAt = ""): Story => {
  const name = `${review.brand} ${review.product_name}`;
  const page = (headline: string, body: string | null): StoryPage => ({
    mediaType: "image",
    mediaUrl: image.url,
    mediaAlt: image.alt,
    posterUrl: null,
    headline: clipText(headline, MAX_HEADLINE_CHARS),
    body: body ? clipText(body, MAX_BODY_CHARS) : null,
    durationMs: PAGE_MS,
  });
  const scores = `Efficacy ${review.score_efficacy}/10 · Value ${review.score_value}/10 · Texture ${review.score_texture}/10 · SA climate fit ${review.score_climate}/10`;
  const price = review.local_price_zar > 0 ? ` · R${review.local_price_zar}` : "";
  const ingredients = review.key_ingredients.length ? `Key ingredients: ${review.key_ingredients.join(", ")}.` : "";
  const skinTypes = review.skin_type_match.length ? ` Suits ${review.skin_type_match.join(", ").toLowerCase()} skin.` : "";

  return {
    key: `review-${review.id}`,
    source: "review",
    slug: review.id,
    title: name,
    kind: "review",
    coverImageUrl: image.url,
    coverImageAlt: image.alt,
    ctaLabel: "Read the full review",
    ctaUrl: `/reviews/${review.id}`,
    // Disclosed sponsored reviews stay disclosed in story form too.
    isSponsored: Boolean(review.is_sponsored),
    sponsorName: review.is_sponsored ? review.brand : null,
    railPosition: null,
    publishAt,
    pages: [
      page(name, review.verdict),
      page(`SkinLabs score: ${overallScore(review)}/10`, `${scores}${price}`),
      ...(ingredients || skinTypes ? [page("What's inside", `${ingredients}${skinTypes}`.trim())] : []),
    ],
  };
};
