import { supabase } from "@/integrations/supabase/client";
import type { BillingInterval, PlanId } from "@/data/plans";
import { trackConversionEvent } from "@/lib/analytics-events";

export type PaymentGateway = "payfast" | "paypal";
export type PaymentPlan = Exclude<PlanId, "explorer">;

interface CheckoutResult {
  error: Error | null;
}

const FUNCTION_NAME: Record<PaymentGateway, string> = {
  payfast: "payfast-payment",
  paypal: "paypal-payment",
};

/** PayFast's checkout isn't a simple redirect URL — it's a signed form post. */
function submitPayfastForm(paymentUrl: string, paymentData: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";
  for (const [key, value] of Object.entries(paymentData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

const invokeCheckout = async (gateway: PaymentGateway, body: Record<string, unknown>): Promise<CheckoutResult> => {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: new Error("Please sign in to continue") };
  }

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME[gateway], { body });
  if (error) return { error };

  if (gateway === "payfast") {
    const payload = data as { paymentUrl?: string; paymentData?: Record<string, string>; error?: string } | null;
    if (payload?.error) return { error: new Error(payload.error) };
    if (!payload?.paymentUrl || !payload.paymentData) return { error: new Error("Could not start checkout. Please try again.") };
    submitPayfastForm(payload.paymentUrl, payload.paymentData);
    return { error: null };
  }

  const payload = data as { orderId?: string; approveUrl?: string; error?: string } | null;
  if (payload?.error) return { error: new Error(payload.error) };
  if (!payload?.orderId || !payload?.approveUrl) return { error: new Error("Could not start checkout. Please try again.") };
  // capturePendingPaypalOrder() (below) reads this back after PayPal
  // redirects the browser back to our return_url with ?token=<orderId>.
  sessionStorage.setItem("skinlabs_paypal_pending_order_id", payload.orderId);
  window.location.href = payload.approveUrl;
  return { error: null };
};

/**
 * Starts a checkout for a recurring membership plan and redirects/navigates
 * the browser. The price is resolved server-side from pricing_plans — this
 * only ever sends an identifier. After payment the customer returns to
 * /dashboard?payment=success&purchase_type=plan, where the dashboard waits
 * for the (webhook- or capture-) verified entitlement to activate the plan.
 */
export const startCheckout = async (
  gateway: PaymentGateway,
  plan: PaymentPlan,
  interval: BillingInterval = "monthly",
  variantKey = "control",
): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=plan&plan=${plan}&interval=${interval}`;
  const result = await invokeCheckout(gateway, { purchaseType: "plan", planId: plan, interval, variantKey, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "plan", plan, interval, gateway });
  return result;
};

/** Starts a checkout for a one-time AI-analysis credit pack. */
export const startCreditPackCheckout = async (
  gateway: PaymentGateway,
  packId: string,
  variantKey = "control",
): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=credit_pack&pack_id=${packId}`;
  const result = await invokeCheckout(gateway, { purchaseType: "credit_pack", packId, variantKey, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "credit_pack", packId, gateway });
  return result;
};

/** Starts a checkout for the one-time founding-member offer. */
export const startFoundingMemberCheckout = async (
  gateway: PaymentGateway,
  offerId: string,
): Promise<CheckoutResult> => {
  const callbackUrl = `${window.location.origin}/dashboard?payment=success&purchase_type=founding_member&offer_id=${offerId}`;
  const result = await invokeCheckout(gateway, { purchaseType: "founding_member", offerId, callbackUrl });
  if (!result.error) trackConversionEvent("checkout_started", { purchaseType: "founding_member", offerId, gateway });
  return result;
};

/**
 * PayPal (unlike PayFast/the old Paystack redirect flow) needs an explicit
 * server-side capture call after the customer approves and is redirected
 * back — call this once on mount wherever a checkout can return to (today,
 * only /dashboard). No-ops instantly if this page load isn't a PayPal
 * return (no matching pending order in sessionStorage).
 */
export const capturePendingPaypalOrder = async (): Promise<
  { captured: false } | { captured: true; ok: boolean; error?: string; needsReview?: boolean }
> => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const pendingOrderId = sessionStorage.getItem("skinlabs_paypal_pending_order_id");
  if (!token || !pendingOrderId || token !== pendingOrderId) {
    return { captured: false };
  }
  sessionStorage.removeItem("skinlabs_paypal_pending_order_id");

  const { data, error } = await supabase.functions.invoke("paypal-payment", {
    body: { action: "capture", orderId: token },
  });
  if (error) return { captured: true, ok: false, error: error.message };

  const payload = data as { ok?: boolean; error?: string; needsReview?: boolean } | null;
  if (payload?.error) return { captured: true, ok: false, error: payload.error };
  return { captured: true, ok: true, needsReview: payload?.needsReview };
};
