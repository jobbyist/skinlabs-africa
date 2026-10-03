import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SaRetailPrice } from "@/lib/pricing/saRetailPrices";

/**
 * Live, matched, recently checked South African retail prices for one product
 * (view `sa_retail_prices`). Empty when nothing has been verified: callers render
 * nothing rather than a placeholder price.
 */
export function useSaRetailPrices(productSlug: string | undefined) {
  return useQuery({
    queryKey: ["sa-retail-prices", productSlug],
    enabled: !!productSlug,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<SaRetailPrice[]> => {
      const { data, error } = await supabase
        .from("sa_retail_prices" as never)
        .select("product_slug,retailer_slug,retailer_name,listing_url,listing_title,listing_size_ml,price_zar,in_stock,price_since,checked_at")
        .eq("product_slug", productSlug as never);
      if (error) throw error;
      return ((data ?? []) as unknown as SaRetailPrice[]).map((r) => ({ ...r, price_zar: Number(r.price_zar), listing_size_ml: r.listing_size_ml === null ? null : Number(r.listing_size_ml) }));
    },
  });
}
