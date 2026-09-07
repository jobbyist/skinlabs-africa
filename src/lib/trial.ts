import { supabase } from "@/integrations/supabase/client";
import { trackConversionEvent } from "@/lib/analytics-events";

/**
 * Starts a no-card free trial for the signed-in user via the
 * start_free_trial() RPC. Trial length and eligibility are resolved
 * server-side from pricing_plans (variant-aware, so trial duration is
 * A/B-testable) — this never hard-codes a number of days. The RPC enforces
 * one trial per account, ever, regardless of which plan it's for.
 */
export const startFreeTrial = async (plan: "insider" | "glow_lite", variantKey = "control") => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Please sign in to start your free trial") };
  }

  const { error } = await supabase.rpc("start_free_trial", { p_plan: plan, p_variant_key: variantKey });
  if (error) {
    if (error.message?.toLowerCase().includes("already used")) {
      return { error: new Error("You've already used your free trial on this account.") };
    }
    return { error: new Error("Could not start your trial. Please try again.") };
  }
  trackConversionEvent("trial_started", { plan });
  return { error: null };
};
