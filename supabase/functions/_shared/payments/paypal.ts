import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Thin PayPal REST helpers shared by paypal-payment. Defaults to PayPal's
// sandbox API — a real charge only reaches the live host once a human sets
// PAYPAL_ENV=live alongside live (not sandbox) client credentials. Same
// conservative-default philosophy as PAYFAST_MODE in payfast-payment.

export type PaypalEnv = "sandbox" | "live";

export function paypalEnv(): PaypalEnv {
  return Deno.env.get("PAYPAL_ENV") === "live" ? "live" : "sandbox";
}

export function paypalApiBase(): string {
  return paypalEnv() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function paypalConfigured(): boolean {
  return Boolean(Deno.env.get("PAYPAL_CLIENT_ID") && Deno.env.get("PAYPAL_CLIENT_SECRET"));
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");
  const resp = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) {
    throw new Error(`PayPal OAuth token request failed: ${JSON.stringify(json)}`);
  }
  cachedToken = { value: json.access_token as string, expiresAt: Date.now() + Number(json.expires_in ?? 300) * 1000 };
  return cachedToken.value;
}

/** Authenticated JSON call to the PayPal REST API. Returns the parsed body (or {} for 204). */
export async function paypalFetch(
  path: string,
  init: { method?: string; body?: unknown; requestId?: string } = {},
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  // PayPal-Request-Id makes create calls idempotent on PayPal's side.
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;
  const resp = await fetch(`${paypalApiBase()}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await resp.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { ok: resp.ok, status: resp.status, json };
}

export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) {
    console.error("paypal webhook: PAYPAL_WEBHOOK_ID not configured, rejecting webhook");
    return false;
  }
  const { ok, json } = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_time: headers.get("paypal-transmission-time"),
      cert_url: headers.get("paypal-cert-url"),
      auth_algo: headers.get("paypal-auth-algo"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    },
  });
  return ok && json.verification_status === "SUCCESS";
}

const PRODUCT_ID_KEY = "__product__";

/**
 * Returns the PayPal billing-plan id for a SkinLabs plan + interval, creating
 * the catalog product and billing plan on first use (cached in
 * paypal_billing_plans, per PayPal environment) — so no manual setup in the
 * PayPal dashboard is needed. The plan's own price is only a baseline: every
 * subscription overrides it with the live ZAR→USD conversion at signup time
 * (see createSubscription in paypal-payment), so a stale baseline never
 * reaches a customer.
 */
export async function ensureBillingPlan(
  admin: ReturnType<typeof createClient>,
  input: { planId: string; interval: "monthly" | "annual"; planName: string; baselineUsd: number },
): Promise<string> {
  const env = paypalEnv();
  const { data: existing } = await admin
    .from("paypal_billing_plans")
    .select("paypal_plan_id")
    .eq("env", env)
    .eq("plan_id", input.planId)
    .eq("billing_interval", input.interval)
    .maybeSingle();
  if (existing?.paypal_plan_id) return existing.paypal_plan_id as string;

  // One catalog product for all SkinLabs memberships.
  let productId: string | null = null;
  const { data: productRow } = await admin
    .from("paypal_billing_plans")
    .select("paypal_product_id")
    .eq("env", env)
    .eq("plan_id", PRODUCT_ID_KEY)
    .maybeSingle();
  productId = (productRow?.paypal_product_id as string | undefined) ?? null;
  if (!productId) {
    const product = await paypalFetch("/v1/catalogs/products", {
      method: "POST",
      requestId: `skinlabs-membership-product-${env}`,
      body: {
        name: "SkinLabs Membership",
        description: "SkinLabs South Africa skincare intelligence membership",
        type: "SERVICE",
        category: "SOFTWARE",
        home_url: "https://skinlabs.co.za",
      },
    });
    if (!product.ok || !product.json.id) {
      throw new Error(`PayPal product creation failed: ${JSON.stringify(product.json)}`);
    }
    productId = product.json.id as string;
    await admin.from("paypal_billing_plans").upsert(
      { env, plan_id: PRODUCT_ID_KEY, billing_interval: "monthly", paypal_product_id: productId, paypal_plan_id: null },
      { onConflict: "env,plan_id,billing_interval" },
    );
  }

  const plan = await paypalFetch("/v1/billing/plans", {
    method: "POST",
    requestId: `skinlabs-plan-${env}-${input.planId}-${input.interval}`,
    body: {
      product_id: productId,
      name: `${input.planName} (${input.interval === "annual" ? "Annual" : "Monthly"})`.slice(0, 127),
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: input.interval === "annual" ? "YEAR" : "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: input.baselineUsd.toFixed(2), currency_code: "USD" } },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CANCEL",
        payment_failure_threshold: 3,
      },
    },
  });
  if (!plan.ok || !plan.json.id) {
    throw new Error(`PayPal billing plan creation failed: ${JSON.stringify(plan.json)}`);
  }
  const paypalPlanId = plan.json.id as string;
  await admin.from("paypal_billing_plans").upsert(
    { env, plan_id: input.planId, billing_interval: input.interval, paypal_product_id: productId, paypal_plan_id: paypalPlanId },
    { onConflict: "env,plan_id,billing_interval" },
  );
  return paypalPlanId;
}
