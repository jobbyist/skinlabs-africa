import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { BillingInterval, PlanId } from "@/data/plans";

export type MembershipTier = "explorer" | "insider" | "vip";

interface ProfileMembershipRow {
  subscription_status: string | null;
  billing_interval: string | null;
  trial_plan: string | null;
  trial_ends_at: string | null;
  trial_used_at: string | null;
}

const resolveTier = (row: ProfileMembershipRow | null): { tier: MembershipTier; isTrialing: boolean } => {
  if (!row) return { tier: "explorer", isTrialing: false };
  const status = (row.subscription_status || "").toLowerCase();

  if (status === "trial" && row.trial_ends_at && new Date(row.trial_ends_at) > new Date()) {
    const trialTier = row.trial_plan === "vip" ? "vip" : "insider";
    return { tier: trialTier, isTrialing: true };
  }
  if (status === "vip") return { tier: "vip", isTrialing: false };
  if (status === "active" || status === "insider" || status === "premium") return { tier: "insider", isTrialing: false };
  return { tier: "explorer", isTrialing: false };
};

/**
 * Resolves the signed-in member's tier from their profile subscription status,
 * including an active free trial (treated as the trial's plan tier until it expires).
 * Signed-out visitors and free accounts resolve to "explorer".
 */
export const useMembership = () => {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<MembershipTier>("explorer");
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialPlan, setTrialPlan] = useState<PlanId | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        if (active) {
          setTier("explorer");
          setIsTrialing(false);
          setTrialPlan(null);
          setTrialEndsAt(null);
          setTrialUsed(false);
          setBillingInterval("monthly");
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, billing_interval, trial_plan, trial_ends_at, trial_used_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      const row = data as ProfileMembershipRow | null;
      const resolved = resolveTier(row);
      setTier(resolved.tier);
      setIsTrialing(resolved.isTrialing);
      setTrialPlan((row?.trial_plan as PlanId) ?? null);
      setTrialEndsAt(row?.trial_ends_at ?? null);
      setTrialUsed(Boolean(row?.trial_used_at));
      setBillingInterval((row?.billing_interval as BillingInterval) || "monthly");
      setLoading(false);
    };
    if (!authLoading) void load();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return {
    tier,
    loading: loading || authLoading,
    isSignedIn: Boolean(user),
    isMember: tier !== "explorer",
    isVip: tier === "vip",
    isTrialing,
    trialPlan,
    trialEndsAt,
    trialUsed,
    billingInterval,
  };
};
