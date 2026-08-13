import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productReviews as staticProductReviews, type ProductReview, type RetailerListing } from "@/data/reviews";

/**
 * Reads the Review Engine from Supabase (products + retailer_listings) so
 * pricing/sentiment can be kept current going forward. Falls back to the
 * static seed data in src/data/reviews.ts if the tables don't exist yet
 * (migration not applied) or the query fails for any reason — the Reviews
 * pages never render empty because of this migration being pending.
 */
export const useProductReviews = () => {
  return useQuery({
    queryKey: ["product-reviews"],
    queryFn: async (): Promise<ProductReview[]> => {
      const [{ data: products, error: productsError }, { data: retailers, error: retailersError }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("retailer_listings").select("*"),
      ]);

      if (productsError || retailersError || !products || products.length === 0) {
        if (productsError) console.error("Failed to fetch products:", productsError);
        if (retailersError) console.error("Failed to fetch retailers:", retailersError);
        return staticProductReviews;
      }

      // Build a map for O(1) retailer lookups instead of O(n*m) filtering
      const retailersByProduct = new Map<string, typeof retailers>();
      (retailers ?? []).forEach((r) => {
        const existing = retailersByProduct.get(r.product_id) ?? [];
        existing.push(r);
        retailersByProduct.set(r.product_id, existing);
      });

      return products.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        brand: p.brand,
        local_price_zar: p.local_price_zar,
        where_to_buy: p.where_to_buy,
        category: p.category,
        skin_type_match: p.skin_type_match,
        score_efficacy: p.score_efficacy,
        score_value: p.score_value,
        score_texture: p.score_texture,
        score_climate: p.score_climate,
        verdict: p.verdict,
        full_review: p.full_review,
        key_ingredients: p.key_ingredients,
        isNew: p.is_new,
        retailers: (retailersByProduct.get(p.id) ?? []).map((r) => ({
          retailer: r.retailer as RetailerListing["retailer"],
          price_zar: r.price_zar,
          in_stock: r.in_stock,
          url: r.url,
        })),
      }));
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: staticProductReviews,
  });
};
