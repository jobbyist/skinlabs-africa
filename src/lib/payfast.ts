import { getSiteOrigin } from "@/lib/siteOrigin";
import { supabase } from "@/integrations/supabase/client";
import { PAYFAST_ENABLED } from "@/lib/payments";

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

/** Validated: a malformed response becomes an error the dialog can show, never a render crash. */
export const quoteMembership = async (req: KeepMembershipRequest): Promise<MembershipQuote> => {
  const q = await invoke<Partial<MembershipQuote>>({ action: "subscription_quote", ...req });
  if (typeof q.amountZar !== "number" || !Number.isFinite(q.amountZar) || !q.startKind) {
    throw new Error("We couldn't load your price. Please try again.");
  }
  return {
    amountZar: q.amountZar,
    planId: String(q.planId ?? req.planId),
    interval: q.interval === "annual" ? "annual" : "monthly",
    startKind: q.startKind,
    firstChargeDate: typeof q.firstChargeDate === "string" ? q.firstChargeDate : null,
    payfastAvailable: Boolean(q.payfastAvailable),
  };
};

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
  if (!PAYFAST_ENABLED) throw new Error("PayFast is temporarily unavailable. Please use PayPal or a debit/credit card.");
  const origin = getSiteOrigin();
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
