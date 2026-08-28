import { supabase } from "@/integrations/supabase/client";
import type { BillingInterval, PlanId } from "@/data/plans";

export type PaystackPlan = Extract<PlanId, "insider" | "vip">;

/**
 * Starts a Paystack checkout for a membership plan and redirects the browser.
 * After payment Paystack returns the user to /dashboard?payment=success, where
 * the dashboard waits for the signature-verified webhook to activate the plan.
 */
export const startPaystackCheckout = async (plan: PaystackPlan, interval: BillingInterval = "monthly") => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Please sign in to continue") };
  }

  const planKey = interval === "annual" ? (`${plan}_annual` as const) : plan;
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&plan=${plan}&interval=${interval}`;
  const { data, error } = await supabase.functions.invoke("paystack-payment", {
    body: { plan: planKey, callbackUrl },
  });

  if (error) return { error };
  const url = (data as { authorization_url?: string } | null)?.authorization_url;
  if (!url) return { error: new Error("Could not start checkout. Please try again.") };

  window.location.href = url;
  return { error: null };
};
