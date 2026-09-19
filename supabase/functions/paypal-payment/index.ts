// PayPal checkout (Orders API v2) — new alongside the PayFast rewrite,
// replacing Paystack. PayPal has no ZAR-native settlement path this
// environment can confirm, so charges are placed in USD, converted from the
// ZAR list price via marketplace_fx_rates (same table OpenHaus already uses
// for multi-currency display).
//
// Flow: `initialize` creates a PayPal order and parks its metadata in
// payment_checkout_intents (PayPal's own custom_id field is capped at 127
// chars — too small for a JSON metadata blob) -> client redirects to
// PayPal's approve link -> PayPal redirects back with ?token=<order id> ->
// client calls `capture` -> this function captures the order server-side
// (never trusting a client-side "it worked") and grants the entitlement.
// A registered PayPal webhook (`?webhook=true`) is a crash-safety backstop:
// if this function dies after PayPal accepts the capture but before our own
// DB write completes, the independently-delivered webhook still lands and
// completePurchase() is idempotent on `reference`, so neither path can
// double-grant.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCharge } from "../_shared/payments/resolveCharge.ts";
import { completePurchase } from "../_shared/payments/completePurchase.ts";
import { failPurchase } from "../_shared/payments/failPurchase.ts";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
import { convertZarToUsd } from "../_shared/payments/fx.ts";
import type { PurchaseType } from "../_shared/payments/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CALLBACK_ORIGINS = [
  "https://skinlabs.co.za",
  "https://www.skinlabs.co.za",
  "https://skinlabsza.lovable.app",
];

function safeCallback(url: unknown): string {
  const fallback = "https://skinlabs.co.za/dashboard?payment=success";
  if (typeof url !== "string") return fallback;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return fallback;
    const origin = `${u.protocol}//${u.host}`;
    const allowed =
      ALLOWED_CALLBACK_ORIGINS.includes(origin) ||
      u.hostname.endsWith(".lovable.app") ||
      u.hostname.endsWith(".lovableproject.com");
    return allowed ? url : fallback;
  } catch {
    return fallback;
  }
}

// Defaults to PayPal's sandbox API — a real charge only reaches the live
// host once a human explicitly sets PAYPAL_ENV=live alongside real (not
// sandbox) client credentials. Same conservative-default philosophy as
// PAYFAST_MODE in the payfast-payment function.
function paypalApiBase(): string {
  return Deno.env.get("PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
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
  return json.access_token as string;
}

async function verifyWebhookSignature(
  accessToken: string,
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) {
    console.error("paypal webhook: PAYPAL_WEBHOOK_ID not configured, rejecting webhook");
    return false;
  }
  const resp = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_time: headers.get("paypal-transmission-time"),
      cert_url: headers.get("paypal-cert-url"),
      auth_algo: headers.get("paypal-auth-algo"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  const json = await resp.json().catch(() => ({}));
  return resp.ok && json.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const url = new URL(req.url);

    // ---- PayPal webhook (crash-safety backstop, see file header) ----
    if (url.searchParams.get("webhook") === "true") {
      const raw = await req.text();
      const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const accessToken = await getAccessToken();

      const verified = await verifyWebhookSignature(accessToken, req.headers, raw);
      if (!verified) {
        console.warn("paypal webhook: signature verification failed");
        return new Response("Invalid signature", { status: 400 });
      }

      const event = JSON.parse(raw);
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const capture = event.resource;
        const orderId = capture?.supplementary_data?.related_ids?.order_id as string | undefined;
        if (!orderId) {
          console.warn("paypal webhook: capture event missing order_id");
          return new Response("OK", { status: 200 });
        }
        const { data: intent } = await admin
          .from("payment_checkout_intents")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (!intent) {
          // Already consumed by the synchronous capture path, or an order
          // this function didn't create — either way, nothing to do.
          return new Response("OK", { status: 200 });
        }
        const result = await completePurchase(admin, {
          gateway: "paypal",
          userId: intent.user_id,
          reference: capture.id as string,
          purchaseType: intent.purchase_type as PurchaseType,
          meta: intent.metadata as Record<string, unknown>,
          paidAmount: Number(capture?.amount?.value ?? intent.amount_charged),
          currency: "USD",
          amountZar: Number(intent.amount_zar),
        });
        if (result.ok) {
          await admin.from("payment_checkout_intents").update({ consumed_at: new Date().toISOString() }).eq("id", orderId);
        } else {
          return new Response("Entitlement grant failed", { status: 500, headers: corsHeaders });
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.DENIED") {
        const capture = event.resource;
        const orderId = capture?.supplementary_data?.related_ids?.order_id as string | undefined;
        if (orderId) {
          const { data: intent } = await admin.from("payment_checkout_intents").select("*").eq("id", orderId).maybeSingle();
          if (intent) {
            await failPurchase(admin, {
              gateway: "paypal",
              userId: intent.user_id,
              reference: (capture.id as string) ?? orderId,
              purchaseType: intent.purchase_type as PurchaseType,
              meta: { ...(intent.metadata as Record<string, unknown>), expected_amount_zar: intent.amount_zar },
              currency: "USD",
            });
          }
        }
      }

      return new Response("OK", { status: 200 });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const authed = await resolveAuthedUser(req, supabaseUrl);
    if (!authed) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const action = body.action === "capture" ? "capture" : "initialize";

    // ---- Capture a previously-created order ----
    if (action === "capture") {
      const orderId = typeof body.orderId === "string" ? body.orderId : "";
      const { data: intent } = await admin
        .from("payment_checkout_intents")
        .select("*")
        .eq("id", orderId)
        .eq("gateway", "paypal")
        .maybeSingle();
      if (!intent) {
        return new Response(JSON.stringify({ error: "Checkout not found or already completed" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // An order belongs to whoever created it — never let a different
      // signed-in user capture someone else's pending checkout.
      if (intent.user_id !== authed.userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessToken = await getAccessToken();
      const captureResp = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const captureJson = await captureResp.json();
      if (!captureResp.ok) {
        console.error("paypal capture failed", captureJson);
        return new Response(JSON.stringify({ error: "Payment could not be captured. Please try again." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = captureJson.status as string;
      const capture = captureJson.purchase_units?.[0]?.payments?.captures?.[0];

      if (status !== "COMPLETED" || !capture) {
        return new Response(JSON.stringify({ error: `Payment not completed (status: ${status})` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await completePurchase(admin, {
        gateway: "paypal",
        userId: authed.userId,
        reference: capture.id as string,
        purchaseType: intent.purchase_type as PurchaseType,
        meta: intent.metadata as Record<string, unknown>,
        paidAmount: Number(capture.amount?.value ?? intent.amount_charged),
        currency: "USD",
        amountZar: Number(intent.amount_zar),
      });
      await admin.from("payment_checkout_intents").update({ consumed_at: new Date().toISOString() }).eq("id", orderId);

      if (!result.ok) {
        return new Response(JSON.stringify({ error: "Payment succeeded but activating your purchase failed — contact support@skinlabs.co.za with this reference: " + capture.id }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, needsReview: result.needsReview }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Initialize a new order ----
    const charge = await resolveCharge(admin, body);
    if (!charge.ok) {
      return new Response(JSON.stringify({ error: charge.error }), {
        status: charge.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let amountUsd: number;
    try {
      amountUsd = await convertZarToUsd(admin, charge.amountZar);
    } catch (fxError) {
      console.error("paypal-payment: fx conversion failed", fxError);
      return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const returnUrl = safeCallback(body.callbackUrl);
    const cancelUrl = returnUrl.includes("?") ? `${returnUrl}&payment=cancelled` : `${returnUrl}?payment=cancelled`;

    const accessToken = await getAccessToken();
    const orderResp = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: authed.userId,
            description: charge.name.slice(0, 127),
            amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
          },
        ],
        application_context: {
          brand_name: "SkinLabs South Africa",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });
    const orderJson = await orderResp.json();
    if (!orderResp.ok || !orderJson.id) {
      console.error("paypal order creation failed", orderJson);
      return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: intentError } = await admin.from("payment_checkout_intents").insert({
      id: orderJson.id,
      gateway: "paypal",
      user_id: authed.userId,
      purchase_type: charge.metadata.purchase_type,
      metadata: { user_id: authed.userId, ...charge.metadata },
      amount_zar: charge.amountZar,
      amount_charged: amountUsd,
      currency: "USD",
    });
    if (intentError) {
      console.error("paypal-payment: failed to store checkout intent", intentError);
      return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const approveLink = (orderJson.links as Array<{ rel: string; href: string }>).find((l) => l.rel === "approve");
    return new Response(
      JSON.stringify({ orderId: orderJson.id, approveUrl: approveLink?.href }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("paypal-payment error:", error);
    return new Response(JSON.stringify({ error: "Payment processing failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
