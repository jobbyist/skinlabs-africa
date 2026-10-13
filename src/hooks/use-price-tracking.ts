import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { indexStats, type PriceStat } from "@/lib/pricing/priceTracking";

/**
 * Aggregate 30-day price stats for one product's current public listings (RPC sa_price_stats_30d).
 * A failed read yields an empty map: no badge, never a guess.
 */
export function usePriceStats(productSlug: string | undefined) {
  return useQuery({
    queryKey: ["sa-price-stats", productSlug],
    enabled: !!productSlug,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Map<string, PriceStat>> => {
      const { data, error } = await supabase.rpc("sa_price_stats_30d" as never, { p_product_slug: productSlug } as never);
      if (error || !Array.isArray(data)) return new Map();
      return indexStats(
        (data as unknown as PriceStat[]).map((r) => ({
          ...r,
          low_30d: Number(r.low_30d),
          high_30d: Number(r.high_30d),
          observations: Number(r.observations),
        })),
      );
    },
  });
}

export interface PriceAlertRow {
  status: "active" | "triggered" | "off";
  target_price_zar: number;
  triggered_price_zar: number | null;
  triggered_retailer: string | null;
}

/** The signed-in member's alert for one product (own rows only, enforced by RLS). */
export function usePriceAlert(productSlug: string | undefined, userId: string | undefined) {
  const qc = useQueryClient();
  const key = ["price-alert", userId, productSlug];
  const query = useQuery({
    queryKey: key,
    enabled: !!productSlug && !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PriceAlertRow | null> => {
      const { data } = await supabase
        .from("price_alerts" as never)
        .select("status,target_price_zar,triggered_price_zar,triggered_retailer")
        .eq("product_slug", productSlug as never)
        .maybeSingle();
      const row = data as unknown as PriceAlertRow | null;
      if (!row || row.status === "off") return null;
      return { ...row, target_price_zar: Number(row.target_price_zar), triggered_price_zar: row.triggered_price_zar === null ? null : Number(row.triggered_price_zar) };
    },
  });
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: key }), [qc, key]);
  return { alert: query.data ?? null, loading: query.isLoading, refresh };
}
