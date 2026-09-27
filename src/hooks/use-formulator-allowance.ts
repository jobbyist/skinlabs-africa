import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getPersistedPricingVariant, usePricingConfig } from "@/lib/pricing-config";
import type { MembershipTier } from "@/hooks/use-membership";

export interface FormulatorAllowanceStatus {
  tier: MembershipTier;
  unlimited: boolean;
  /** 0 or 1 today; null when unlimited. */
  freeRemaining: number | null;
  windowDays: number;
  lastFreeAnalysisAt: Date | null;
  /** Most recent saved analysis of any kind (free, pass or membership). */
  lastAnalysisAt: Date | null;
  nextUnlockAt: Date | null;
  passBalance: number;
  /** Free allowance spent AND no Analysis Pass to fall back on. */
  locked: boolean;
}

const toDate = (v: string | null | undefined) => (v ? new Date(v) : null);
const TIERS: MembershipTier[] = ["explorer", "glow_lite", "insider", "vip"];

export const formulatorAllowanceKey = (userId: string | undefined) => ["formulator-allowance", userId ?? "anon"] as const;

/**
 * The signed-in account's starter-analysis allowance, straight from the server
 * (get_formulator_allowance). UI only — save_starter_analysis() re-checks on save.
 * Returns `data: null` for signed-out visitors.
 */
export const useFormulatorAllowance = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: formulatorAllowanceKey(user?.id),
    enabled: !authLoading && Boolean(user),
    staleTime: 60 * 1000,
    queryFn: async (): Promise<FormulatorAllowanceStatus> => {
      const { data, error } = await supabase.rpc("get_formulator_allowance", {
        p_variant_key: getPersistedPricingVariant(),
      });
      if (error) throw new Error(error.message);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("No allowance returned");
      const unlimited = Boolean(row.unlimited);
      const freeRemaining = unlimited ? null : row.free_remaining ?? 0;
      return {
        tier: TIERS.includes(row.tier as MembershipTier) ? (row.tier as MembershipTier) : "explorer",
        unlimited,
        freeRemaining,
        windowDays: row.window_days,
        lastFreeAnalysisAt: toDate(row.last_free_analysis_at),
        lastAnalysisAt: toDate(row.last_analysis_at),
        nextUnlockAt: toDate(row.next_unlock_at),
        passBalance: row.pass_balance ?? 0,
        locked: !unlimited && freeRemaining === 0 && (row.pass_balance ?? 0) <= 0,
      };
    },
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: formulatorAllowanceKey(user?.id) }),
    [queryClient, user?.id],
  );

  return {
    data: user ? query.data ?? null : null,
    loading: authLoading || (Boolean(user) && query.isLoading),
    error: query.error as Error | null,
    refresh,
  };
};

/** Live Glow Insider monthly price from pricing_plans; null until loaded (never a stale hardcoded number). */
export const useInsiderMonthlyPrice = (): number | null => {
  const { data } = usePricingConfig();
  const insider = data?.plans.find((p) => p.plan_id === "insider");
  return insider ? Number(insider.price_monthly) : null;
};
