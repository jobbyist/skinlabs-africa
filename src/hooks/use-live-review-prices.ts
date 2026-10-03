import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { indexLivePrices, type LivePrice, type LivePriceRow } from "@/lib/pricing/liveReviewPrices";

/**
 * Live prices for every review/product that has one (OpenHaus + matched retailer listings), keyed by review id.
 * Small (a few dozen rows). A failed read yields an empty map: callers show no price rather than an editorial one.
 */
export function useLiveReviewPrices() {
  return useQuery({
    queryKey: ["live-review-prices"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, LivePrice>> => {
      const [oh, retail] = await Promise.all([
        supabase.from("review_live_prices" as never).select("review_id,price_zar,checked_at,source_name"),
        supabase.from("sa_retail_prices" as never).select("product_slug,price_zar,checked_at,retailer_name"),
      ]);
      const rows: LivePriceRow[] = [
        ...(((oh.data ?? []) as unknown as { review_id: string; price_zar: number; checked_at: string; source_name: string }[]).map((r) => ({
          id: r.review_id,
          price_zar: r.price_zar,
          source: r.source_name,
          checked_at: r.checked_at,
        }))),
        ...(((retail.data ?? []) as unknown as { product_slug: string; price_zar: number; checked_at: string; retailer_name: string }[]).map((r) => ({
          id: r.product_slug,
          price_zar: r.price_zar,
          source: r.retailer_name,
          checked_at: r.checked_at,
        }))),
      ];
      return indexLivePrices(rows);
    },
  });
}
