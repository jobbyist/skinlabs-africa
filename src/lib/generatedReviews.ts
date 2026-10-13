import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductReview, RetailerListing } from "@/data/reviews";

/**
 * Reviews sourced and scored by the product-review pipeline (supabase/functions/product-review-sync), stored in
 * ai_generated_product_reviews rather than hand-added to src/data/reviews.ts so a new day's reviews don't need a code
 * deploy. Mapped to the exact ProductReview shape so every consumer can merge them in unmodified. Takes the client as
 * an argument so the browser hook and the SSR routes share one query and one mapping.
 */
export async function fetchGeneratedReviews(client: SupabaseClient): Promise<ProductReview[]> {
  // Loosely typed on purpose: the SSR and browser clients carry different generics.
  const { data, error } = await (client as SupabaseClient)
    .from("ai_generated_product_reviews")
    .select(
      "id, product_name, brand, local_price_zar, where_to_buy, category, skin_type_match, score_efficacy, score_value, score_texture, score_climate, verdict, key_ingredients, retailers, published_date, seo_intro, review_body, product_size, product_format, country_of_origin, am_pm_usage, skin_concerns, benefits, cautions, faq, seo_title, seo_description, key_ingredients_structured, related_ingredients_slugs, primary_image, related_reviews, related_knowledge_articles, community_rating, community_rating_count, is_sponsored, origin",
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
    published_date: row.published_date,
    seo_intro: row.seo_intro,
    review_body: row.review_body,
    product_size: row.product_size,
    product_format: row.product_format,
    country_of_origin: row.country_of_origin,
    am_pm_usage: row.am_pm_usage,
    skin_concerns: (row.skin_concerns as unknown as string[] | null) ?? [],
    benefits: (row.benefits as unknown as string[] | null) ?? [],
    cautions: (row.cautions as unknown as string[] | null) ?? [],
    faq: (row.faq as unknown as { question: string; answer: string }[] | null) ?? [],
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    key_ingredients_structured:
      (row.key_ingredients_structured as unknown as { name: string; slug: string | null; resolved: boolean }[] | null) ?? [],
    related_ingredients_slugs: (row.related_ingredients_slugs as unknown as string[] | null) ?? [],
    primary_image: row.primary_image,
    related_reviews: (row.related_reviews as unknown as { id: string; product_name: string; brand: string }[] | null) ?? [],
    related_knowledge_articles: (row.related_knowledge_articles as unknown as { title: string; url: string }[] | null) ?? [],
    community_rating: row.community_rating !== null && row.community_rating !== undefined ? Number(row.community_rating) : null,
    community_rating_count: row.community_rating_count ?? 0,
    is_sponsored: row.is_sponsored ?? false,
    origin: row.origin === "global_available_in_sa" ? "global_available_in_sa" : "south_africa",
  }));
}
