import { supabase } from "@/integrations/supabase/client";
import type { BillingInterval, PlanId } from "@/data/plans";
import { trackConversionEvent } from "@/lib/analytics-events";

export type PaystackPlan = Exclude<PlanId, "explorer">;

interface CheckoutResult {
  error: Error | null;
}

const invokeCheckout = async (body: Record<string, unknown>): Promise<CheckoutResult> => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Please sign in to continue") };
  }

  const { data, error } = await supabase.functions.invoke("paystack-payment", { body });
  if (error) return { error };

  const payload = data as { authorization_url?: string; error?: string } | null;
  if (payload?.error) return { error: new Error(payload.error) };
  if (!payload?.authorization_url) return { error: new Error("Could not start checkout. Please try again.") };

  window.location.href = payload.authorization_url;
  return { error: null };
};

/**
 * Starts a Paystack checkout for a recurring membership plan and redirects
 * the browser. The price is resolved server-side from pricing_plans — this
 * only ever sends an identifier. After payment Paystack returns the user to
 * /dashboard?payment=success&purchase_type=plan, where the dashboard waits
 * for the signature-verified webhook to activate the plan.
 */
export const startPaystackCheckout = async (
  plan: PaystackPlan,
  interval: BillingInterval = "monthly",
  variantKey = "control",
): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=plan&plan=${plan}&interval=${interval}`;
  const result = await invokeCheckout({ purchaseType: "plan", planId: plan, interval, variantKey, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "plan", plan, interval });
  return result;
};

/** Starts a Paystack checkout for a one-time AI-analysis credit pack. */
export const startCreditPackCheckout = async (packId: string, variantKey = "control"): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=credit_pack&pack_id=${packId}`;
  const result = await invokeCheckout({ purchaseType: "credit_pack", packId, variantKey, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "credit_pack", packId });
  return result;
};

/** Starts a Paystack checkout for the one-time founding-member offer. */
export const startFoundingMemberCheckout = async (offerId: string): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=founding_member&offer_id=${offerId}`;
  const result = await invokeCheckout({ purchaseType: "founding_member", offerId, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "founding_member", offerId });
  return result;
};
