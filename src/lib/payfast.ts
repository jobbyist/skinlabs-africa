import { supabase } from "@/integrations/supabase/client";

/**
 * Client for payfast-payment's recurring "Keep my membership" actions
 * (onboarding overhaul 06). One-off PayFast checkouts still go through
 * src/lib/payments.ts. Prices and dates are always resolved server-side.
 */

export type KeepStartKind = "new_trial" | "existing_trial" | "immediate";

export interface MembershipQuote {
  amountZar: number;
  planId: string;
  interval: "monthly" | "annual";
  startKind: KeepStartKind;
  /** YYYY-MM-DD (SAST) of the first charge; null = charged at checkout. */
  firstChargeDate: string | null;
  payfastAvailable: boolean;
}

export interface KeepMembershipRequest {
  planId: string;
  interval: "monthly" | "annual";
  variantKey?: string;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("payfast-payment", { body });
  if (error) {
    // supabase-js hides a non-2xx response's JSON body behind error.context.
    let message = "Payment processing failed. Please try again.";
    try {
      const ctx = (error as { context?: Response }).context;
      const payload = ctx ? await ctx.json() : null;
      if (payload?.error) message = payload.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  const payload = data as (T & { error?: string }) | null;
  if (!payload) throw new Error("Payment processing failed. Please try again.");
  if (payload.error) throw new Error(payload.error);
  return payload;
}

export const quoteMembership = (req: KeepMembershipRequest) =>
  invoke<MembershipQuote>({ action: "subscription_quote", ...req });

/** Signed form post to PayFast (card entry + 3-D Secure happen on PayFast). */
function submitPayfastForm(paymentUrl: string, paymentData: Record<string, string>) {
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

export const startPayfastMembership = async (req: KeepMembershipRequest) => {
  const origin = window.location.origin;
  const result = await invoke<{ paymentUrl: string; paymentData: Record<string, string> }>({
    action: "initialize_subscription",
    ...req,
    callbackUrl: `${origin}/dashboard?tab=billing&keep=done`,
    cancelUrl: `${origin}/dashboard?tab=billing&keep=cancelled`,
  });
  submitPayfastForm(result.paymentUrl, result.paymentData);
};

export const cancelPayfastSubscriptions = () => invoke<{ ok: boolean; cancelled: number }>({ action: "cancel_subscription" });

/** "1 November 2026" from a YYYY-MM-DD billing date (already a SAST calendar day). */
export const formatChargeDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
