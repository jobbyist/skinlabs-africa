import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceProducts, type MarketplaceProductRecord } from "./use-marketplace-products";

/** The current week's SkinLabs® Picks — latest `week_of` row set in marketplace_skinlabs_picks, resolved against real products. */
export function useSkinLabsPicks(limit = 4) {
  const { data: products } = useMarketplaceProducts();

  const picksQuery = useQuery({
    queryKey: ["marketplace-skinlabs-picks"],
    queryFn: async () => {
      const { data: latest } = await supabase
        .from("marketplace_skinlabs_picks")
        .select("week_of")
        .order("week_of", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latest) return [];
      const { data, error } = await supabase
        .from("marketplace_skinlabs_picks")
        .select("product_id, position")
        .eq("week_of", latest.week_of)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const picks: MarketplaceProductRecord[] = (picksQuery.data ?? [])
    .map((row) => products?.find((p) => p.id === row.product_id))
    .filter((p): p is MarketplaceProductRecord => Boolean(p))
    .slice(0, limit);

  // Before the picks-rotation function has ever run, fall back to the first
  // in-stock products so the section isn't empty — never fabricated data,
  // just an honest "nothing curated yet" default ordering.
  const fallback = picks.length === 0 ? (products ?? []).slice(0, limit) : [];

  return { picks: picks.length > 0 ? picks : fallback, isLoading: picksQuery.isLoading };
}
