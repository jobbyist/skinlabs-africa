import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductReview, RetailerListing } from "@/data/reviews";

/**
 * Reviews sourced and scored by the product-review pipeline (Firecrawl + Gemini, see
 * api/product-review-sync.ts), stored in ai_generated_product_reviews rather than
 * hand-added to src/data/reviews.ts so a new day's reviews don't need a code deploy.
 * Mapped to the exact ProductReview shape so every existing consumer (ReviewsGrid,
 * ProductReview detail page, SiteSearch, Spotlight) can merge them in unmodified.
 */
async function fetchGeneratedReviews(): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("ai_generated_product_reviews")
    .select(
      "id, product_name, brand, local_price_zar, where_to_buy, category, skin_type_match, score_efficacy, score_value, score_texture, score_climate, verdict, key_ingredients, retailers, published_date",
    )
    .order("published_date", { ascending: false });

  if (error) throw error;

  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return (data ?? []).map((row): ProductReview => ({
    id: row.id,
    product_name: row.product_name,
    brand: row.brand,
    local_price_zar: Number(row.local_price_zar),
    where_to_buy: row.where_to_buy,
    category: row.category,
    skin_type_match: row.skin_type_match ?? [],
    score_efficacy: Number(row.score_efficacy),
    score_value: Number(row.score_value),
    score_texture: Number(row.score_texture),
    score_climate: Number(row.score_climate),
    verdict: row.verdict,
    key_ingredients: row.key_ingredients ?? [],
    retailers: (row.retailers as unknown as RetailerListing[] | null) ?? [],
    isNew: new Date(row.published_date).getTime() >= cutoff,
  }));
}

/** All pipeline-generated reviews, mapped to ProductReview shape and ready to merge
 *  with the static productReviews catalogue (e.g. [...productReviews, ...data]). */
export function useGeneratedReviews() {
  return useQuery({
    queryKey: ["ai-generated-product-reviews"],
    queryFn: fetchGeneratedReviews,
    staleTime: 5 * 60 * 1000,
  });
}
