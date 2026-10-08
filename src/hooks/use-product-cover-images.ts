import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductCoverImage {
  url: string;
  alt: string;
  creditName: string;
  creditUrl: string;
}

/**
 * Real product images (brand website / listed retailer) that a person approved in Admin > Data Quality.
 * Only `review_images` rows with source_kind = 'product' are included; stock photos are never returned here, so
 * callers fall back to their existing category image until an approved product image exists.
 */
export function useProductCoverImages() {
  return useQuery({
    queryKey: ["product-cover-images"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, ProductCoverImage>> => {
      const { data, error } = await supabase
        .from("review_images")
        .select("review_id, image_url, alt, credit_name, credit_url")
        .eq("source_kind" as never, "product" as never);
      if (error) throw error;
      const map = new Map<string, ProductCoverImage>();
      for (const r of (data ?? []) as unknown as { review_id: string; image_url: string; alt: string; credit_name: string; credit_url: string }[]) {
        map.set(r.review_id, { url: r.image_url, alt: r.alt, creditName: r.credit_name, creditUrl: r.credit_url });
      }
      return map;
    },
  });
}
