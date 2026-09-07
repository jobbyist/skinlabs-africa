import { supabase } from "@/integrations/supabase/client";

/**
 * Starts a 7-day, no-card free trial for the signed-in user via the
 * start_free_trial() RPC. Grants full access to Glow Insider immediately —
 * no payment gateway is involved, and the RPC enforces one trial per account,
 * ever. Glow VIP has no trial; it relies on the 30-day money-back guarantee
 * applied to all paid plans instead.
 */
export const startFreeTrial = async (plan: "insider") => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Please sign in to start your free trial") };
  }

  const { error } = await supabase.rpc("start_free_trial", { p_plan: plan });
  if (error) {
    if (error.message?.toLowerCase().includes("already used")) {
      return { error: new Error("You've already used your free trial on this account.") };
    }
    return { error: new Error("Could not start your trial. Please try again.") };
  }
  return { error: null };
};
