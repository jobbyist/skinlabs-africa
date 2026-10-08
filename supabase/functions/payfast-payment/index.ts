// PayFast: one-off checkouts, the recurring "Keep my membership"
// subscription (ZAR), and the ITN handler for both.
//
// ITN (Instant Transaction Notification) security, per PayFast's documented
// process: (1) verify the MD5 signature over the fields in the order PayFast
// posted them, (2) POST that parameter string back to PayFast's own
// /eng/query/validate and require the literal response "VALID" — the check
// that can't be forged, since only PayFast's servers can answer it. PayFast
// also documents a source-IP allowlist; deliberately not implemented (the
// list changes and this function may sit behind infrastructure that hides
// the true source IP), so signature + validate are treated as sufficient.
//
// Signing rules (form = documented field order, ITN = received order, API =
// alphabetical) live in ../_shared/payments/payfast.ts. Before onboarding
// overhaul 06 this file sorted form fields alphabetically, which PayFast
// rejects, and sorted ITN fields too, so no real ITN could have verified.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCharge } from "../_shared/payments/resolveCharge.ts";
import { completePurchase } from "../_shared/payments/completePurchase.ts";
import { failPurchase } from "../_shared/payments/failPurchase.ts";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
import { LIVE_SUB_STATUSES, resolveSubscriptionStart } from "../_shared/payments/subscriptionStart.ts";
import {
  addBillingPeriod,
  formSignature,
  itnParamString,
  itnSignature,
  payfastApiRequest,
  payfastFrequency,
  payfastHost,
  payfastIsLive,
  safeEqual,
  sastDate,
  sastMidnightIso,
} from "../_shared/payments/payfast.ts";
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
  "https://id-preview--3a7fffe1-a651-4cb0-9824-839db53d00ae.lovable.app",
];

function safeCallback(url: unknown, fallback = "https://skinlabs.co.za/dashboard?payment=success"): string {
  if (typeof url !== "string") return fallback;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return fallback;
    const origin = `${u.protocol}//${u.host}`;
    const allowed = ALLOWED_CALLBACK_ORIGINS.includes(origin);
    return allowed ? url : fallback;
  } catch {
    return fallback;
  }
}

const withParam = (url: string, param: string) => (url.includes("?") ? `${url}&${param}` : `${url}?${param}`);

interface PayfastEnv {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  mode: string | undefined;
}

const readEnv = (): PayfastEnv => ({
  merchantId: Deno.env.get("PAYFAST_MERCHANT_ID") ?? "",
  merchantKey: Deno.env.get("PAYFAST_MERCHANT_KEY") ?? "",
  passphrase: Deno.env.get("PAYFAST_PASSPHRASE") ?? "",
  mode: Deno.env.get("PAYFAST_MODE"),
});

/** Recurring billing needs a passphrase (PayFast requires one for every subscription). */
const subscriptionsConfigured = (env: PayfastEnv) => Boolean(env.merchantId && env.merchantKey && env.passphrase.trim());

const amountsMatch = (a: number, b: number) => Math.abs(a - b) < 0.01;

// ---------------------------------------------------------------------------
// ITN
// ---------------------------------------------------------------------------

async function handleItn(req: Request, admin: Admin, env: PayfastEnv): Promise<Response> {
  const raw = await req.text();
  const data: Record<string, string> = {};
  new URLSearchParams(raw).forEach((value, key) => {
    data[key] = value;
  });

  const received = (data.signature || "").toLowerCase();
  if (!received || !safeEqual(received, itnSignature(raw, env.passphrase))) {
    console.warn("payfast ITN: signature mismatch");
    return new Response("Invalid signature", { status: 400 });
  }

  const validateResp = await fetch(`https://${payfastHost(env.mode)}/eng/query/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: itnParamString(raw),
  });
  const validateText = (await validateResp.text()).trim();
  if (validateText !== "VALID") {
    console.warn("payfast ITN: server-side validate rejected notification", { validateText });
    return new Response("Invalid notification", { status: 400 });
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(data.custom_str1 || "{}") as Record<string, unknown>;
  } catch {
    meta = {};
  }
  const userId = data.custom_str2 || (meta.user_id as string | undefined) || "";

  // A recurring membership: m_payment_id is our payment_subscriptions key.
  const { data: subRow } = data.m_payment_id
    ? await admin
        .from("payment_subscriptions")
        .select("*")
        .eq("gateway", "payfast")
        .eq("gateway_subscription_id", data.m_payment_id)
        .maybeSingle()
    : { data: null };
  if (subRow) return await handleSubscriptionItn(admin, data, subRow as Record<string, unknown>, userId);

  // ---- One-off purchase ----
  const purchaseType = meta.purchase_type as PurchaseType | undefined;
  const reference = data.pf_payment_id || data.m_payment_id || crypto.randomUUID();
  const paidZar = Number(data.amount_gross || "0");
  const expectedZar = Number(meta.expected_amount_zar ?? NaN);
  if (!userId || !purchaseType) {
    console.warn("payfast ITN: missing user/purchase metadata", { userId, purchaseType });
    return new Response("OK", { status: 200 });
  }
  if (data.payment_status === "COMPLETE") {
    if (!amountsMatch(paidZar, expectedZar)) {
      console.warn("payfast ITN: amount mismatch", { paidZar, expectedZar });
      return new Response("OK", { status: 200 });
    }
    const result = await completePurchase(admin, {
      gateway: "payfast",
      userId,
      reference,
      purchaseType,
      meta,
      paidAmount: paidZar,
      currency: "ZAR",
      amountZar: paidZar,
    });
    // PayFast retries an ITN on a non-2xx response, so a transient DB error self-heals.
    if (!result.ok) return new Response("Entitlement grant failed", { status: 500 });
  } else if (data.payment_status === "FAILED") {
    await failPurchase(admin, { gateway: "payfast", userId, reference, purchaseType, meta, currency: "ZAR" });
  }
  return new Response("OK", { status: 200 });
}

/**
 * Every ITN for a "Keep my membership" subscription. Idempotent throughout:
 * the token is only ever set once, the trial start is a compare-and-set on
 * trial_used_at, and each charge is keyed by pf_payment_id in
 * payment_transactions (completePurchase ignores duplicates).
 */
async function handleSubscriptionItn(
  admin: Admin,
  data: Record<string, string>,
  row: Record<string, unknown>,
  userId: string,
): Promise<Response> {
  const subscriptionId = row.gateway_subscription_id as string;
  if (userId && userId !== row.user_id) {
    console.warn("payfast ITN: subscription owner mismatch", { subscriptionId });
    return new Response("OK", { status: 200 });
  }
  const now = new Date().toISOString();
  const interval = row.billing_interval as "monthly" | "annual";
  const status = String(data.payment_status || "").toUpperCase();
  const paidZar = Number(data.amount_gross || "0");
  const meta = {
    purchase_type: "plan",
    plan_id: row.plan_id,
    interval,
    subscription_id: subscriptionId,
    expected_amount_zar: row.amount_zar,
  };
  const update = (patch: Record<string, unknown>) =>
    admin
      .from("payment_subscriptions")
      .update({ ...patch, updated_at: now })
      .eq("gateway_subscription_id", subscriptionId);

  if (status === "COMPLETE") {
    // Capture the token on the first ITN (the R0 card authorisation, or the
    // first charge for an account that has used its trial).
    if (data.token && !row.payfast_token) {
      // Compare-and-set, so a redelivered ITN racing the first can't overwrite it.
      await admin
        .from("payment_subscriptions")
        .update({ payfast_token: data.token, payer_email: data.email_address || row.payer_email || null, updated_at: now })
        .eq("gateway_subscription_id", subscriptionId)
        .is("payfast_token", null);
    }

    if (paidZar <= 0) {
      // R0 tokenisation: the card is on file, nothing was charged.
      if (row.status === "pending") {
        await update({ status: "trialing", next_billing_at: row.first_billing_at });
      }
      if (row.start_kind === "new_trial" && row.first_billing_at) {
        // Start the trial now that a card is on file. The trial_used_at IS NULL
        // filter makes this a compare-and-set: never two trials per account.
        await admin
          .from("profiles")
          .update({
            subscription_status: "trial",
            subscription_started_at: now,
            trial_plan: row.plan_id,
            trial_ends_at: row.first_billing_at,
            trial_started_at: now,
            trial_used_at: now,
            billing_interval: interval,
          })
          .eq("user_id", row.user_id as string)
          .is("trial_used_at", null);
      }
      return new Response("OK", { status: 200 });
    }

    // A real charge: the first one for an immediate start, or a recurring one.
    if (paidZar + 0.01 < Number(row.amount_zar)) {
      console.warn("payfast ITN: recurring charge below the subscribed amount", { subscriptionId, paidZar });
      return new Response("OK", { status: 200 });
    }
    const result = await completePurchase(admin, {
      gateway: "payfast",
      userId: row.user_id as string,
      reference: data.pf_payment_id || `${subscriptionId}:${now}`,
      purchaseType: "plan",
      meta,
      paidAmount: paidZar,
      currency: "ZAR",
      amountZar: Number(row.amount_zar),
    });
    if (!result.ok) return new Response("Entitlement grant failed", { status: 500 });

    // The charge landed on (or around) the scheduled date → schedule the next
    // period. An immediate start already stored next period's date → keep it.
    const today = sastDate(new Date());
    const scheduled = row.next_billing_at ? sastDate(row.next_billing_at as string) : today;
    const nextBilling = sastMidnightIso(scheduled > today ? scheduled : addBillingPeriod(scheduled, interval));
    await update({ status: "active", next_billing_at: nextBilling, current_period_end: nextBilling });
    return new Response("OK", { status: 200 });
  }

  if (status === "FAILED") {
    await failPurchase(admin, {
      gateway: "payfast",
      userId: row.user_id as string,
      reference: data.pf_payment_id || `${subscriptionId}:failed:${now}`,
      purchaseType: "plan",
      meta,
      currency: "ZAR",
    });
    await update({ status: "past_due" });
    return new Response("OK", { status: 200 });
  }

  if (status === "CANCELLED") {
    // Cancelled on PayFast's side (buyer, merchant dashboard, or after repeated
    // failures). Paid access continues to the end of the paid period;
    // expire_lapsed_subscriptions() ends it after that.
    if (!["cancelled", "expired"].includes(row.status as string)) {
      await update({
        status: "cancelled",
        cancelled_at: now,
        current_period_end: row.status === "active" ? (row.next_billing_at ?? now) : now,
      });
    }
    return new Response("OK", { status: 200 });
  }

  // Anything else (e.g. a subscription PayFast has locked after failed
  // payments) stops billing: treat it like PayPal's SUSPENDED.
  console.warn("payfast ITN: unhandled subscription status", { subscriptionId, status });
  if (status.includes("LOCK") || status.includes("SUSPEND")) {
    await update({ status: "suspended", current_period_end: now });
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

  const env = readEnv();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const url = new URL(req.url);
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (url.searchParams.get("notify") === "true") return await handleItn(req, admin, env);

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "initialize";

    // ---- Public: is PayFast recurring billing available? ----
    if (action === "config") {
      return json({ subscriptionsConfigured: subscriptionsConfigured(env), mode: payfastIsLive(env.mode) ? "live" : "sandbox" });
    }

    const authed = await resolveAuthedUser(req, supabaseUrl);
    if (!authed) return json({ error: "Unauthorized" }, 401);
    const variantKey = typeof body.variantKey === "string" ? body.variantKey : "control";

    // ---- "Keep my membership": what would be charged, and when ----
    if (action === "subscription_quote") {
      const charge = await resolveCharge(admin, { ...body, purchaseType: "plan" });
      if (!charge.ok) return json({ error: charge.error }, charge.status);
      const start = await resolveSubscriptionStart(admin, authed.userId, charge.metadata.plan_id as string, variantKey);
      if ("error" in start) return json({ error: start.error }, start.status);
      return json({
        amountZar: charge.amountZar,
        planId: charge.metadata.plan_id,
        interval: charge.metadata.interval,
        startKind: start.kind,
        // PayFast bills on a calendar day (SAST); null = charged at checkout.
        firstChargeDate: start.firstBillingAt ? sastDate(start.firstBillingAt) : null,
        payfastAvailable: subscriptionsConfigured(env),
      });
    }

    // ---- Start a recurring PayFast subscription ----
    if (action === "initialize_subscription") {
      if (!subscriptionsConfigured(env)) {
        return json({ error: "PayFast auto-renew isn't available right now. Please try PayPal." }, 503);
      }
      const charge = await resolveCharge(admin, { ...body, purchaseType: "plan" });
      if (!charge.ok) return json({ error: charge.error }, charge.status);
      const planId = charge.metadata.plan_id as string;
      const interval = charge.metadata.interval as "monthly" | "annual";
      const start = await resolveSubscriptionStart(admin, authed.userId, planId, variantKey);
      if ("error" in start) return json({ error: start.error }, start.status);

      // A trial (new or existing): tokenise the card at R0 through 3-D Secure
      // and schedule the first charge for the trial-end day. An account that
      // has used its trial pays the first period now and renews a period later —
      // PayFast's billing_date is "the date from which FUTURE payments are
      // made", so R0 + today would leave the first period unpaid.
      const trialStart = start.kind !== "immediate" && start.firstBillingAt;
      const today = sastDate(new Date());
      const billingDate = trialStart && start.firstBillingAt ? sastDate(start.firstBillingAt) : addBillingPeriod(today, interval);
      const initialAmount = trialStart ? 0 : charge.amountZar;

      const mPaymentId = `sub_${crypto.randomUUID()}`;
      const firstBillingAt = trialStart ? start.firstBillingAt : new Date().toISOString();
      const { error: rowError } = await admin.from("payment_subscriptions").insert({
        user_id: authed.userId,
        gateway: "payfast",
        gateway_subscription_id: mPaymentId,
        plan_id: planId,
        billing_interval: interval,
        status: "pending",
        start_kind: start.kind,
        first_billing_at: firstBillingAt,
        next_billing_at: trialStart ? start.firstBillingAt : sastMidnightIso(billingDate),
        amount_zar: charge.amountZar,
        amount_charged: charge.amountZar,
        currency: "ZAR",
        metadata: { variant_key: variantKey, env: payfastIsLive(env.mode) ? "live" : "sandbox", billing_date: billingDate },
      });
      if (rowError) {
        console.error("payfast-payment: failed to store subscription", rowError);
        return json({ error: "Could not start checkout. Please try again." }, 500);
      }

      const meta = {
        user_id: authed.userId,
        purchase_type: "plan",
        plan_id: planId,
        interval,
        subscription_id: mPaymentId,
        expected_amount_zar: charge.amountZar,
      };
      const returnUrl = safeCallback(body.callbackUrl, "https://skinlabs.co.za/dashboard?tab=billing&keep=done");
      const cancelUrl = safeCallback(body.cancelUrl, "https://skinlabs.co.za/dashboard?tab=billing&keep=cancelled");
      const paymentData: Record<string, string> = {
        merchant_id: env.merchantId,
        merchant_key: env.merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: `${supabaseUrl}/functions/v1/payfast-payment?notify=true`,
        name_first: authed.email.split("@")[0]?.slice(0, 100) ?? "",
        email_address: authed.email,
        m_payment_id: mPaymentId,
        amount: initialAmount.toFixed(2),
        item_name: charge.name.slice(0, 100),
        custom_str1: JSON.stringify(meta),
        custom_str2: authed.userId,
        email_confirmation: "0",
        subscription_type: "1",
        billing_date: billingDate,
        recurring_amount: charge.amountZar.toFixed(2),
        frequency: payfastFrequency(interval),
        cycles: "0",
      };
      if (paymentData.custom_str1.length > 255) {
        console.error("payfast-payment: subscription metadata too large", { length: paymentData.custom_str1.length });
        return json({ error: "Could not start checkout. Please try again." }, 500);
      }
      paymentData.signature = formSignature(paymentData, env.passphrase);
      return json({
        paymentUrl: `https://${payfastHost(env.mode)}/eng/process`,
        paymentData,
        subscriptionId: mPaymentId,
        startKind: start.kind,
        firstChargeDate: trialStart ? billingDate : today,
        amountZar: charge.amountZar,
      });
    }

    // ---- Stop the member's PayFast subscription(s) ----
    if (action === "cancel_subscription") {
      const { data: rows } = await admin
        .from("payment_subscriptions")
        .select("gateway_subscription_id, status, payfast_token")
        .eq("user_id", authed.userId)
        .eq("gateway", "payfast")
        .in("status", LIVE_SUB_STATUSES);
      for (const r of rows ?? []) {
        const token = r.payfast_token as string | null;
        if (token) {
          if (!subscriptionsConfigured(env)) {
            return json({ error: "We couldn't reach PayFast to cancel your subscription. Please try again." }, 503);
          }
          const config = { merchantId: env.merchantId, passphrase: env.passphrase, mode: env.mode };
          const res = await payfastApiRequest(config, "PUT", `/subscriptions/${encodeURIComponent(token)}/cancel`);
          if (!res.ok) {
            // Already cancelled on PayFast's side counts as done.
            const fetched = await payfastApiRequest(config, "GET", `/subscriptions/${encodeURIComponent(token)}/fetch`);
            const statusText = String(
              ((fetched.json.data as Record<string, unknown> | undefined)?.response as Record<string, unknown> | undefined)?.status_text ?? "",
            ).toUpperCase();
            if (statusText !== "CANCELLED") {
              console.error("payfast cancel failed", { status: res.status });
              return json({ error: "We couldn't cancel your PayFast subscription right now. Please try again." }, 502);
            }
          }
        }
        // A pending row never got a card on file, so there's nothing to stop at PayFast.
        const { error: cancelError } = await admin
          .from("payment_subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            current_period_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("gateway_subscription_id", r.gateway_subscription_id as string);
        if (cancelError) {
          // Billing already stopped at PayFast; the caller must not go on to
          // cancel_subscription() as if everything were recorded.
          console.error("payfast cancel: could not record cancellation", { subscription: r.gateway_subscription_id, cancelError });
          return json({ error: "We couldn't finish cancelling your subscription. Please try again." }, 500);
        }
      }
      return json({ ok: true, cancelled: (rows ?? []).length });
    }

    // ---- One-off checkout (Analysis Passes) ----
    if (action !== "initialize") return json({ error: "Unknown action" }, 400);
    if (!env.merchantId || !env.merchantKey) {
      return json({ error: "PayFast isn't available right now. Please choose another payment method." }, 503);
    }
    const charge = await resolveCharge(admin, body);
    if (!charge.ok) return json({ error: charge.error }, charge.status);

    const fullMetaJson = JSON.stringify({ user_id: authed.userId, ...charge.metadata });
    if (fullMetaJson.length > 255) {
      // custom_str fields are capped at 255 characters; truncated JSON would
      // lose the sale's entitlement at ITN time.
      console.error("payfast-payment: metadata too large for custom_str1", { length: fullMetaJson.length });
      return json({ error: "Could not start checkout. Please try again." }, 500);
    }
    const returnUrl = safeCallback(body.callbackUrl);
    const paymentData: Record<string, string> = {
      merchant_id: env.merchantId,
      merchant_key: env.merchantKey,
      return_url: returnUrl,
      cancel_url: withParam(returnUrl, "payment=cancelled"),
      notify_url: `${supabaseUrl}/functions/v1/payfast-payment?notify=true`,
      name_first: authed.email.split("@")[0]?.slice(0, 100) ?? "",
      email_address: authed.email,
      m_payment_id: `${charge.metadata.purchase_type}_${authed.userId}_${Date.now()}`,
      amount: charge.amountZar.toFixed(2),
      item_name: charge.name.slice(0, 100),
      // Round-trip verbatim on the ITN, so the handler recovers user/purchase without a lookup.
      custom_str1: fullMetaJson,
      custom_str2: authed.userId,
      email_confirmation: "0",
    };
    paymentData.signature = formSignature(paymentData, env.passphrase);
    return json({ paymentUrl: `https://${payfastHost(env.mode)}/eng/process`, paymentData });
  } catch (error) {
    console.error("payfast-payment error:", error);
    return json({ error: "Payment processing failed. Please try again." }, 500);
  }
});
