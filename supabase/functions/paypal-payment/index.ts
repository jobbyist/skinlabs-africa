// PayPal checkout — one-off orders (Analysis Passes, Founding Member) via the
// Orders v2 API, and recurring memberships via the Subscriptions API.
//
// PayPal does not support ZAR as a transaction currency, so every charge is
// placed in USD, converted from the DB's ZAR list price at a real-time rate
// (see _shared/payments/fx.ts). Prices are always resolved server-side from
// pricing_plans / credit_packs / founding_member_offers — the client only
// ever sends identifiers.
//
// Actions (POST JSON `action`):
//   config               public — PayPal client id + env for the JS SDK buttons
//   quote                ZAR price, USD equivalent, live rate, and for plans
//                        when the first recurring charge would happen
//   initialize           create a one-off order (credit_pack / founding_member)
//   capture              capture an approved order and grant the entitlement
//   create_subscription  create a PayPal subscription for a paid plan
//   activate_subscription confirm an approved subscription and start the trial /
//                        record the first payment
//   cancel_subscription  cancel the member's live PayPal subscription(s)
//   (?webhook=true)      signed PayPal webhook — renewals, failures, cancellations
//
// Free trial + recurring billing: a subscription is created with a future
// start_time equal to the trial end — 7 days, or 1 November 2026 while the
// extended-trial promo (pricing_settings.promo_free_trial_until) runs, or the
// member's existing trial end if they are already trialling — so PayPal takes
// the first payment exactly when the trial ends and then every month/year.
// An account that has already used its trial is billed immediately.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCharge } from "../_shared/payments/resolveCharge.ts";
import { completePurchase } from "../_shared/payments/completePurchase.ts";
import { failPurchase } from "../_shared/payments/failPurchase.ts";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
import { getZarUsdQuote, zarToUsd } from "../_shared/payments/fx.ts";
import {
  ensureBillingPlan,
  paypalConfigured,
  paypalEnv,
  paypalFetch,
  verifyWebhookSignature,
} from "../_shared/payments/paypal.ts";
import type { PurchaseType } from "../_shared/payments/types.ts";

type Admin = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

const withParam = (url: string, param: string) => (url.includes("?") ? `${url}&${param}` : `${url}?${param}`);

// ---------------------------------------------------------------------------
// Subscription start date (trial) resolution
// ---------------------------------------------------------------------------

type StartKind = "new_trial" | "existing_trial" | "immediate";

interface SubscriptionStart {
  kind: StartKind;
  /** When PayPal takes the first payment; null = at approval. */
  firstBillingAt: string | null;
}

const PAID_STATUSES = new Set(["glow_lite", "insider", "vip", "active", "premium"]);
const LIVE_SUB_STATUSES = ["pending", "trialing", "active", "past_due"];

/**
 * Mirrors start_free_trial()'s eligibility and length rules (one trial per
 * account, plan must be trial_eligible, trial_days from pricing_plans,
 * extended to pricing_settings.promo_free_trial_until while that's later) so
 * a PayPal-backed trial and a no-card trial always end on the same date.
 */
async function resolveSubscriptionStart(
  admin: Admin,
  userId: string,
  planId: string,
  variantKey: string,
): Promise<SubscriptionStart | { error: string; status: number }> {
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, trial_ends_at, trial_used_at, founding_member")
    .eq("user_id", userId)
    .maybeSingle();
  const status = String(profile?.subscription_status ?? "").toLowerCase();

  const { data: liveSubs } = await admin
    .from("payment_subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"]);
  if (liveSubs && liveSubs.length > 0) {
    return { error: "You already have an active PayPal subscription. Manage it from your dashboard's Billing tab.", status: 409 };
  }
  if (profile?.founding_member) {
    return { error: "Your Founding Member access already includes this plan.", status: 409 };
  }

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at as string) : null;
  if (status === "trial" && trialEndsAt && trialEndsAt.getTime() > Date.now() + 5 * 60_000) {
    return { kind: "existing_trial", firstBillingAt: trialEndsAt.toISOString() };
  }

  if (!profile?.trial_used_at && !PAID_STATUSES.has(status)) {
    let { data: plan } = await admin
      .from("pricing_plans")
      .select("trial_days, trial_eligible")
      .eq("plan_id", planId)
      .eq("variant_key", variantKey)
      .maybeSingle();
    if (!plan) {
      ({ data: plan } = await admin
        .from("pricing_plans")
        .select("trial_days, trial_eligible")
        .eq("plan_id", planId)
        .eq("variant_key", "control")
        .maybeSingle());
    }
    const trialDays = Number(plan?.trial_days ?? 0);
    if (plan?.trial_eligible && trialDays > 0) {
      let { data: settings } = await admin
        .from("pricing_settings")
        .select("promo_free_trial_until")
        .eq("variant_key", variantKey)
        .maybeSingle();
      if (!settings) {
        ({ data: settings } = await admin
          .from("pricing_settings")
          .select("promo_free_trial_until")
          .eq("variant_key", "control")
          .maybeSingle());
      }
      let ends = Date.now() + trialDays * 86_400_000;
      const promoUntil = settings?.promo_free_trial_until ? new Date(settings.promo_free_trial_until as string).getTime() : 0;
      if (promoUntil > ends) ends = promoUntil;
      return { kind: "new_trial", firstBillingAt: new Date(ends).toISOString() };
    }
  }

  return { kind: "immediate", firstBillingAt: null };
}

// ---------------------------------------------------------------------------
// Subscription state helpers
// ---------------------------------------------------------------------------

const SUB_STATUS_FROM_PAYPAL: Record<string, string> = {
  APPROVAL_PENDING: "pending",
  APPROVED: "trialing",
  ACTIVE: "trialing",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

async function getPaypalSubscription(subscriptionId: string) {
  return await paypalFetch(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

/**
 * Records every completed payment PayPal has taken on a subscription and
 * grants/renews the plan for each (idempotent on the PayPal transaction id,
 * which is the same id the PAYMENT.SALE.COMPLETED webhook carries). Returns
 * how many completed payments exist.
 */
async function syncSubscriptionPayments(admin: Admin, row: Record<string, unknown>): Promise<number> {
  const start = new Date(new Date(row.created_at as string).getTime() - 86_400_000).toISOString();
  const end = new Date(Date.now() + 60_000).toISOString();
  const { ok, json: body } = await paypalFetch(
    `/v1/billing/subscriptions/${encodeURIComponent(row.gateway_subscription_id as string)}/transactions?start_time=${start}&end_time=${end}`,
  );
  if (!ok) {
    console.warn("paypal: could not list subscription transactions", body);
    return 0;
  }
  const txs = ((body.transactions as Array<Record<string, unknown>>) ?? []).filter((t) => t.status === "COMPLETED");
  for (const tx of txs) {
    const gross = (tx.amount_with_breakdown as Record<string, Record<string, string>> | undefined)?.gross_amount;
    await completePurchase(admin, {
      gateway: "paypal",
      userId: row.user_id as string,
      reference: tx.id as string,
      purchaseType: "plan",
      meta: {
        purchase_type: "plan",
        plan_id: row.plan_id,
        interval: row.billing_interval,
        subscription_id: row.gateway_subscription_id,
        expected_amount_zar: row.amount_zar,
      },
      paidAmount: Number(gross?.value ?? row.amount_charged),
      currency: "USD",
      amountZar: Number(row.amount_zar),
    });
  }
  return txs.length;
}

async function refreshSubscriptionRow(admin: Admin, subscriptionId: string, patch: Record<string, unknown> = {}) {
  const { ok, json: sub } = await getPaypalSubscription(subscriptionId);
  const update: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (ok) {
    const billing = sub.billing_info as Record<string, unknown> | undefined;
    if (billing?.next_billing_time) {
      update.next_billing_at = billing.next_billing_time;
      update.current_period_end = billing.next_billing_time;
    }
    const subscriber = sub.subscriber as Record<string, unknown> | undefined;
    if (subscriber?.email_address) update.payer_email = subscriber.email_address;
  }
  await admin.from("payment_subscriptions").update(update).eq("gateway_subscription_id", subscriptionId);
  return ok ? sub : null;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

async function handleWebhook(req: Request, admin: Admin): Promise<Response> {
  const raw = await req.text();
  const verified = await verifyWebhookSignature(req.headers, raw);
  if (!verified) {
    console.warn("paypal webhook: signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(raw);
  const type = event.event_type as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resource = (event.resource ?? {}) as Record<string, any>;

  // ---- One-off orders ----
  if (type === "PAYMENT.CAPTURE.COMPLETED" || type === "PAYMENT.CAPTURE.DENIED") {
    const orderId = resource?.supplementary_data?.related_ids?.order_id as string | undefined;
    if (!orderId) return new Response("OK", { status: 200 });
    const { data: intent } = await admin.from("payment_checkout_intents").select("*").eq("id", orderId).maybeSingle();
    // Already consumed by the synchronous capture path, or not ours.
    if (!intent || intent.consumed_at) return new Response("OK", { status: 200 });

    if (type === "PAYMENT.CAPTURE.COMPLETED") {
      const result = await completePurchase(admin, {
        gateway: "paypal",
        userId: intent.user_id,
        reference: resource.id as string,
        purchaseType: intent.purchase_type as PurchaseType,
        meta: intent.metadata as Record<string, unknown>,
        paidAmount: Number(resource?.amount?.value ?? intent.amount_charged),
        currency: "USD",
        amountZar: Number(intent.amount_zar),
      });
      if (!result.ok) return new Response("Entitlement grant failed", { status: 500 });
      await admin.from("payment_checkout_intents").update({ consumed_at: new Date().toISOString() }).eq("id", orderId);
    } else {
      await failPurchase(admin, {
        gateway: "paypal",
        userId: intent.user_id,
        reference: (resource.id as string) ?? orderId,
        purchaseType: intent.purchase_type as PurchaseType,
        meta: { ...(intent.metadata as Record<string, unknown>), expected_amount_zar: intent.amount_zar },
        currency: "USD",
      });
    }
    return new Response("OK", { status: 200 });
  }

  // ---- Subscriptions ----
  const subscriptionId =
    type === "PAYMENT.SALE.COMPLETED" || type === "PAYMENT.SALE.DENIED"
      ? (resource.billing_agreement_id as string | undefined)
      : type.startsWith("BILLING.SUBSCRIPTION.")
        ? (resource.id as string | undefined)
        : undefined;
  if (!subscriptionId) return new Response("OK", { status: 200 });

  const { data: row } = await admin
    .from("payment_subscriptions")
    .select("*")
    .eq("gateway_subscription_id", subscriptionId)
    .maybeSingle();
  if (!row) return new Response("OK", { status: 200 });

  const meta = {
    purchase_type: "plan",
    plan_id: row.plan_id,
    interval: row.billing_interval,
    subscription_id: subscriptionId,
    expected_amount_zar: row.amount_zar,
  };

  if (type === "PAYMENT.SALE.COMPLETED") {
    const result = await completePurchase(admin, {
      gateway: "paypal",
      userId: row.user_id,
      reference: resource.id as string,
      purchaseType: "plan",
      meta,
      paidAmount: Number(resource?.amount?.total ?? row.amount_charged),
      currency: "USD",
      amountZar: Number(row.amount_zar),
    });
    if (!result.ok) return new Response("Entitlement grant failed", { status: 500 });
    await refreshSubscriptionRow(admin, subscriptionId, { status: "active" });
  } else if (type === "PAYMENT.SALE.DENIED" || type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
    await failPurchase(admin, {
      gateway: "paypal",
      userId: row.user_id,
      reference: (type === "PAYMENT.SALE.DENIED" ? (resource.id as string) : `${subscriptionId}:failed:${event.id}`),
      purchaseType: "plan",
      meta,
      currency: "USD",
    });
    await admin
      .from("payment_subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("gateway_subscription_id", subscriptionId);
  } else if (type === "BILLING.SUBSCRIPTION.ACTIVATED" || type === "BILLING.SUBSCRIPTION.UPDATED" || type === "BILLING.SUBSCRIPTION.RE-ACTIVATED") {
    await refreshSubscriptionRow(admin, subscriptionId, row.status === "pending" ? { status: "trialing" } : {});
  } else if (type === "BILLING.SUBSCRIPTION.CANCELLED" || type === "BILLING.SUBSCRIPTION.EXPIRED") {
    // Cancelled from the customer's PayPal account (in-app cancellations are
    // already recorded): access continues until the end of the period they
    // paid for; expire_lapsed_subscriptions() ends it after that.
    if (!["cancelled", "expired"].includes(row.status)) {
      await admin
        .from("payment_subscriptions")
        .update({
          status: type === "BILLING.SUBSCRIPTION.EXPIRED" ? "expired" : "cancelled",
          cancelled_at: new Date().toISOString(),
          current_period_end: row.status === "active" ? (row.next_billing_at ?? new Date().toISOString()) : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("gateway_subscription_id", subscriptionId);
    }
  } else if (type === "BILLING.SUBSCRIPTION.SUSPENDED") {
    // PayPal gave up after repeated failed payments.
    await admin
      .from("payment_subscriptions")
      .update({ status: "suspended", current_period_end: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("gateway_subscription_id", subscriptionId);
  }

  return new Response("OK", { status: 200 });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const url = new URL(req.url);
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (url.searchParams.get("webhook") === "true") {
      return await handleWebhook(req, admin);
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "initialize";

    // ---- Public: JS SDK configuration (the client id is public by design) ----
    if (action === "config") {
      return json({
        configured: paypalConfigured(),
        clientId: paypalConfigured() ? Deno.env.get("PAYPAL_CLIENT_ID") : null,
        env: paypalEnv(),
      });
    }

    if (!paypalConfigured()) {
      return json({ error: "PayPal isn't available right now. Please choose another payment method." }, 503);
    }

    const authed = await resolveAuthedUser(req, supabaseUrl);
    if (!authed) return json({ error: "Unauthorized" }, 401);

    const variantKey = typeof body.variantKey === "string" ? body.variantKey : "control";

    // ---- Quote: ZAR price, live USD equivalent, first billing date ----
    if (action === "quote") {
      const charge = await resolveCharge(admin, body);
      if (!charge.ok) return json({ error: charge.error }, charge.status);
      const fx = await getZarUsdQuote(admin);
      let subscription: SubscriptionStart | null = null;
      if (charge.metadata.purchase_type === "plan") {
        const start = await resolveSubscriptionStart(admin, authed.userId, charge.metadata.plan_id as string, variantKey);
        if ("error" in start) return json({ error: start.error }, start.status);
        subscription = start;
      }
      return json({
        amountZar: charge.amountZar,
        amountUsd: zarToUsd(charge.amountZar, fx),
        rate: fx.rate,
        rateSource: fx.source,
        rateAsOf: fx.asOf,
        subscription,
      });
    }

    // ---- Capture a previously-created order ----
    if (action === "capture") {
      const orderId = typeof body.orderId === "string" ? body.orderId : "";
      const { data: intent } = await admin
        .from("payment_checkout_intents")
        .select("*")
        .eq("id", orderId)
        .eq("gateway", "paypal")
        .maybeSingle();
      if (!intent) return json({ error: "Checkout not found or already completed" }, 404);
      // An order belongs to whoever created it — never let a different
      // signed-in user capture someone else's pending checkout.
      if (intent.user_id !== authed.userId) return json({ error: "Unauthorized" }, 403);
      if (intent.consumed_at) return json({ ok: true, needsReview: false });

      const captured = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: "POST",
        requestId: `capture-${orderId}`,
      });
      if (!captured.ok) {
        console.error("paypal capture failed", captured.json);
        const issue = ((captured.json.details as Array<Record<string, string>>) ?? [])[0]?.issue;
        if (issue === "INSTRUMENT_DECLINED") {
          return json({ error: "Your card or PayPal funding source was declined. Please try another card or payment method.", retryable: true }, 402);
        }
        return json({ error: "Payment could not be captured. Please try again." }, 502);
      }

      const status = captured.json.status as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const capture = (captured.json.purchase_units as Array<any>)?.[0]?.payments?.captures?.[0];
      if (status !== "COMPLETED" || !capture) {
        return json({ error: `Payment not completed (status: ${status})` }, 400);
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
        return json({ error: "Payment succeeded but activating your purchase failed — contact support@skinlabs.co.za with this reference: " + capture.id }, 500);
      }
      return json({ ok: true, needsReview: result.needsReview, purchaseType: intent.purchase_type });
    }

    // ---- Create a recurring subscription for a paid plan ----
    if (action === "create_subscription") {
      const charge = await resolveCharge(admin, { ...body, purchaseType: "plan" });
      if (!charge.ok) return json({ error: charge.error }, charge.status);
      const planId = charge.metadata.plan_id as string;
      const interval = charge.metadata.interval as "monthly" | "annual";

      const start = await resolveSubscriptionStart(admin, authed.userId, planId, variantKey);
      if ("error" in start) return json({ error: start.error }, start.status);

      let fx;
      try {
        fx = await getZarUsdQuote(admin);
      } catch (fxError) {
        console.error("paypal-payment: fx conversion failed", fxError);
        return json({ error: "Could not start checkout. Please try again." }, 502);
      }
      const amountUsd = zarToUsd(charge.amountZar, fx);
      const paypalPlanId = await ensureBillingPlan(admin, {
        planId,
        interval,
        planName: charge.name.replace(/ membership \(.*\)$/, ""),
        baselineUsd: amountUsd,
      });

      const returnUrl = safeCallback(body.callbackUrl);
      const created = await paypalFetch("/v1/billing/subscriptions", {
        method: "POST",
        body: {
          plan_id: paypalPlanId,
          ...(start.firstBillingAt ? { start_time: start.firstBillingAt } : {}),
          custom_id: authed.userId,
          // Lock this subscriber's USD price to today's live conversion of the ZAR list price.
          plan: {
            billing_cycles: [
              { sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: { value: amountUsd.toFixed(2), currency_code: "USD" } } },
            ],
          },
          ...(authed.email ? { subscriber: { email_address: authed.email } } : {}),
          application_context: {
            brand_name: "SkinLabs South Africa",
            locale: "en-ZA",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: returnUrl,
            cancel_url: withParam(returnUrl, "payment=cancelled"),
          },
        },
      });
      if (!created.ok || !created.json.id) {
        console.error("paypal subscription creation failed", created.json);
        return json({ error: "Could not start checkout. Please try again." }, 502);
      }
      const subscriptionId = created.json.id as string;

      const { error: rowError } = await admin.from("payment_subscriptions").insert({
        user_id: authed.userId,
        gateway: "paypal",
        gateway_subscription_id: subscriptionId,
        plan_id: planId,
        billing_interval: interval,
        status: "pending",
        start_kind: start.kind,
        first_billing_at: start.firstBillingAt,
        amount_zar: charge.amountZar,
        amount_charged: amountUsd,
        currency: "USD",
        fx_rate: fx.rate,
        fx_rate_source: fx.source,
        fx_rate_as_of: fx.asOf,
        metadata: { variant_key: variantKey, paypal_plan_id: paypalPlanId, env: paypalEnv() },
      });
      if (rowError) {
        console.error("paypal-payment: failed to store subscription", rowError);
        return json({ error: "Could not start checkout. Please try again." }, 500);
      }

      const approve = ((created.json.links as Array<{ rel: string; href: string }>) ?? []).find((l) => l.rel === "approve");
      return json({
        subscriptionId,
        approveUrl: approve?.href ?? null,
        startKind: start.kind,
        firstBillingAt: start.firstBillingAt,
        amountZar: charge.amountZar,
        amountUsd,
      });
    }

    // ---- Confirm an approved subscription ----
    if (action === "activate_subscription") {
      const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
      const { data: row } = await admin
        .from("payment_subscriptions")
        .select("*")
        .eq("gateway_subscription_id", subscriptionId)
        .maybeSingle();
      if (!row) return json({ error: "Subscription not found" }, 404);
      if (row.user_id !== authed.userId) return json({ error: "Unauthorized" }, 403);

      const { ok, json: sub } = await getPaypalSubscription(subscriptionId);
      if (!ok) return json({ error: "Could not confirm your PayPal subscription. Please try again." }, 502);
      const paypalStatus = sub.status as string;
      if (paypalStatus !== "ACTIVE" && paypalStatus !== "APPROVED") {
        return json({ error: `Your PayPal subscription isn't active (status: ${paypalStatus}).` }, 400);
      }

      const nextStatus = row.status === "pending" ? SUB_STATUS_FROM_PAYPAL[paypalStatus] : row.status;
      await refreshSubscriptionRow(admin, subscriptionId, { status: nextStatus });

      let trialEndsAt: string | null = null;
      if (row.start_kind === "new_trial" && row.first_billing_at) {
        // Start the trial now that a payment method is on file. The
        // `trial_used_at IS NULL` filter makes this an atomic compare-and-set,
        // so one account can never get two trials — even by approving two
        // subscriptions concurrently.
        await admin
          .from("profiles")
          .update({
            subscription_status: "trial",
            subscription_started_at: new Date().toISOString(),
            trial_plan: row.plan_id,
            trial_ends_at: row.first_billing_at,
            trial_used_at: new Date().toISOString(),
            billing_interval: row.billing_interval,
          })
          .eq("user_id", authed.userId)
          .is("trial_used_at", null);
        trialEndsAt = row.first_billing_at;
      } else if (row.start_kind === "existing_trial") {
        trialEndsAt = row.first_billing_at;
      } else {
        // Billed at approval — record/grant the first payment if PayPal has
        // already taken it (the webhook covers it otherwise).
        const paid = await syncSubscriptionPayments(admin, row);
        if (paid > 0) {
          await admin
            .from("payment_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("gateway_subscription_id", subscriptionId);
        }
      }

      return json({ ok: true, startKind: row.start_kind, trialEndsAt, planId: row.plan_id, interval: row.billing_interval });
    }

    // ---- Cancel the member's live PayPal subscription(s) ----
    if (action === "cancel_subscription") {
      const { data: rows } = await admin
        .from("payment_subscriptions")
        .select("gateway_subscription_id, status")
        .eq("user_id", authed.userId)
        .eq("gateway", "paypal")
        .in("status", LIVE_SUB_STATUSES);
      for (const r of rows ?? []) {
        const id = r.gateway_subscription_id as string;
        if (r.status !== "pending") {
          const res = await paypalFetch(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, {
            method: "POST",
            body: { reason: typeof body.reason === "string" && body.reason ? body.reason.slice(0, 120) : "Cancelled by member from SkinLabs dashboard" },
          });
          // 422 = PayPal already considers it inactive — nothing left to stop.
          if (!res.ok && res.status !== 422) {
            console.error("paypal cancel failed", id, res.json);
            return json({ error: "We couldn't cancel your PayPal subscription right now. Please try again." }, 502);
          }
        }
        await admin
          .from("payment_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            current_period_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("gateway_subscription_id", id);
      }
      return json({ ok: true, cancelled: (rows ?? []).length });
    }

    // ---- Initialize a new one-off order ----
    if (action !== "initialize") return json({ error: "Unknown action" }, 400);

    if ((body.purchaseType ?? "plan") === "plan") {
      // Memberships are recurring PayPal subscriptions, never one-off orders.
      return json({ error: "Membership plans are billed as a PayPal subscription." }, 400);
    }

    const charge = await resolveCharge(admin, body);
    if (!charge.ok) return json({ error: charge.error }, charge.status);

    let amountUsd: number;
    let fx;
    try {
      fx = await getZarUsdQuote(admin);
      amountUsd = zarToUsd(charge.amountZar, fx);
    } catch (fxError) {
      console.error("paypal-payment: fx conversion failed", fxError);
      return json({ error: "Could not start checkout. Please try again." }, 502);
    }

    const returnUrl = safeCallback(body.callbackUrl);
    const order = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: authed.userId,
            description: charge.name.slice(0, 127),
            amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
          },
        ],
        // application_context (not payment_source.paypal) so the same order
        // works with every JS SDK funding button — PayPal balance AND the
        // guest "Debit or Credit Card" button — as well as the redirect flow.
        application_context: {
          brand_name: "SkinLabs South Africa",
          locale: "en-ZA",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          landing_page: "NO_PREFERENCE",
          return_url: returnUrl,
          cancel_url: withParam(returnUrl, "payment=cancelled"),
        },
      },
    });
    if (!order.ok || !order.json.id) {
      console.error("paypal order creation failed", order.json);
      return json({ error: "Could not start checkout. Please try again." }, 502);
    }
    const orderId = order.json.id as string;

    const { error: intentError } = await admin.from("payment_checkout_intents").insert({
      id: orderId,
      gateway: "paypal",
      user_id: authed.userId,
      purchase_type: charge.metadata.purchase_type,
      metadata: { user_id: authed.userId, ...charge.metadata, fx_rate: fx.rate, fx_rate_source: fx.source, fx_rate_as_of: fx.asOf },
      amount_zar: charge.amountZar,
      amount_charged: amountUsd,
      currency: "USD",
    });
    if (intentError) {
      console.error("paypal-payment: failed to store checkout intent", intentError);
      return json({ error: "Could not start checkout. Please try again." }, 500);
    }

    const links = (order.json.links as Array<{ rel: string; href: string }>) ?? [];
    const approveLink = links.find((l) => l.rel === "approve" || l.rel === "payer-action");
    return json({ orderId, approveUrl: approveLink?.href ?? null, amountZar: charge.amountZar, amountUsd });
  } catch (error) {
    console.error("paypal-payment error:", error);
    return json({ error: "Payment processing failed. Please try again." }, 500);
  }
});
