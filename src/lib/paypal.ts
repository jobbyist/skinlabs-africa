import { supabase } from "@/integrations/supabase/client";

/**
 * Client for the paypal-payment edge function + PayPal JS SDK loader.
 *
 * Every price is resolved server-side from the ZAR list price (pricing_plans /
 * credit_packs / founding_member_offers) and converted to USD at a live rate —
 * PayPal doesn't support ZAR as a transaction currency. Nothing here ever
 * sends an amount.
 */

export type PaypalOrderPurchase =
  | { purchaseType: "credit_pack"; packId: string; variantKey?: string }
  | { purchaseType: "founding_member"; offerId: string };

export interface PaypalSubscriptionPurchase {
  purchaseType: "plan";
  planId: string;
  interval: "monthly" | "annual";
  variantKey?: string;
}

export type PaypalPurchase = PaypalOrderPurchase | PaypalSubscriptionPurchase;

export interface PaypalConfig {
  configured: boolean;
  clientId: string | null;
  env: "sandbox" | "live";
}

export interface PaypalQuote {
  amountZar: number;
  amountUsd: number;
  rate: number;
  rateSource: "live" | "cached";
  rateAsOf: string;
  subscription: { kind: "new_trial" | "existing_trial" | "immediate"; firstBillingAt: string | null } | null;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("paypal-payment", { body });
  if (error) {
    // supabase-js hides the JSON body of a non-2xx response behind error.context.
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

let configPromise: Promise<PaypalConfig> | null = null;

export const getPaypalConfig = (): Promise<PaypalConfig> => {
  if (!configPromise) {
    configPromise = invoke<PaypalConfig>({ action: "config" }).catch(() => {
      configPromise = null;
      return { configured: false, clientId: null, env: "sandbox" as const };
    });
  }
  return configPromise;
};

export const getPaypalQuote = (purchase: PaypalPurchase) => invoke<PaypalQuote>({ action: "quote", ...purchase });

export const createPaypalOrder = (purchase: PaypalOrderPurchase, callbackUrl: string) =>
  invoke<{ orderId: string; approveUrl: string | null }>({ action: "initialize", ...purchase, callbackUrl });

export const capturePaypalOrder = (orderId: string) =>
  invoke<{ ok: boolean; needsReview?: boolean; purchaseType?: string }>({ action: "capture", orderId });

export const createPaypalSubscription = (purchase: PaypalSubscriptionPurchase, callbackUrl: string) =>
  invoke<{
    subscriptionId: string;
    approveUrl: string | null;
    startKind: "new_trial" | "existing_trial" | "immediate";
    firstBillingAt: string | null;
  }>({ action: "create_subscription", ...purchase, callbackUrl });

export const activatePaypalSubscription = (subscriptionId: string) =>
  invoke<{
    ok: boolean;
    startKind: "new_trial" | "existing_trial" | "immediate";
    trialEndsAt: string | null;
    planId: string;
    interval: string;
  }>({ action: "activate_subscription", subscriptionId });

export const cancelPaypalSubscriptions = () => invoke<{ ok: boolean; cancelled: number }>({ action: "cancel_subscription" });

// ---------------------------------------------------------------------------
// JS SDK loader
// ---------------------------------------------------------------------------

/** Minimal typing for the parts of the PayPal JS SDK we use. */
export interface PaypalNamespace {
  Buttons: (options: Record<string, unknown>) => {
    isEligible: () => boolean;
    render: (container: HTMLElement) => Promise<void>;
    close?: () => Promise<void>;
  };
  FUNDING: Record<string, string>;
}

const sdkPromises = new Map<string, Promise<PaypalNamespace>>();

/**
 * Loads the PayPal JS SDK once per mode. One-off orders and subscriptions need
 * different SDK query params (intent=capture vs intent=subscription&vault=true),
 * so each gets its own script under its own global namespace.
 */
export const loadPaypalSdk = async (mode: "order" | "subscription"): Promise<PaypalNamespace> => {
  const cached = sdkPromises.get(mode);
  if (cached) return cached;

  const promise = (async () => {
    const config = await getPaypalConfig();
    if (!config.configured || !config.clientId) throw new Error("PayPal isn't available right now.");
    const namespace = mode === "order" ? "paypal_order" : "paypal_subscription";
    const params = new URLSearchParams({
      "client-id": config.clientId,
      currency: "USD",
      components: "buttons",
      "enable-funding": "card",
      "disable-funding": "paylater,venmo",
      ...(mode === "order" ? { intent: "capture" } : { intent: "subscription", vault: "true" }),
    });
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.async = true;
      script.dataset.namespace = namespace;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Couldn't load PayPal. Check your connection and try again."));
      document.head.appendChild(script);
    });
    const ns = (window as unknown as Record<string, PaypalNamespace | undefined>)[namespace];
    if (!ns) throw new Error("Couldn't load PayPal. Please try again.");
    return ns;
  })();

  sdkPromises.set(mode, promise);
  promise.catch(() => sdkPromises.delete(mode));
  return promise;
};

export const formatUsd = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const formatZar = (amount: number) =>
  `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const formatBillingDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
