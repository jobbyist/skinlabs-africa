// PayFast checkout + ITN handler, rewritten against the current
// database-driven pricing architecture (pricing_plans/credit_packs/
// founding_member_offers via resolveCharge()) — the version this replaces
// predated that architecture entirely (hardcoded R99/R299 amounts, a
// standalone `preorders` table for a since-superseded physical-product
// line) and was never wired into any current frontend checkout flow.
//
// ITN (Instant Transaction Notification) security, per PayFast's own
// documented process: (1) verify the MD5 signature, (2) POST the received
// fields back to PayFast's own /eng/query/validate endpoint and require the
// literal response "VALID" — this is the check that actually can't be
// forged, since it requires PayFast's own server to confirm it sent this
// notification. PayFast also documents a source-IP allowlist check;
// deliberately not implemented here — that list changes over time and this
// function may run behind infrastructure that obscures the true source IP,
// so the signature + server-side validate call are treated as sufficient
// (this is what most production PayFast integrations rely on in practice).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { resolveCharge } from "../_shared/payments/resolveCharge.ts";
import { completePurchase } from "../_shared/payments/completePurchase.ts";
import { failPurchase } from "../_shared/payments/failPurchase.ts";
import { resolveAuthedUser } from "../_shared/payments/authedUser.ts";
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

function generateSignature(data: Record<string, string>, passPhrase: string): string {
  const params = Object.keys(data)
    .filter((key) => key !== "signature" && data[key] !== "" && data[key] !== undefined)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const signatureString = passPhrase
    ? `${params}&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, "+")}`
    : params;

  const dataBytes = new TextEncoder().encode(signatureString);
  const hashBuffer = new Uint8Array(crypto.subtle.digestSync("MD5", dataBytes));
  return Array.from(hashBuffer).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Defaults to PayFast's sandbox host — a real charge only ever reaches the
// live host once a human explicitly sets PAYFAST_MODE=live alongside real
// (non-test) merchant credentials. Same conservative-default philosophy as
// PAYPAL_ENV in the paypal-payment function.
function payfastHost(): string {
  return Deno.env.get("PAYFAST_MODE") === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID")!;
  const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY")!;
  const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const url = new URL(req.url);

    // ---- PayFast ITN (server-to-server, unauthenticated by design) ----
    if (url.searchParams.get("notify") === "true") {
      const raw = await req.text();
      const formData = new URLSearchParams(raw);
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      const receivedSignature = data.signature || "";
      if (!receivedSignature) {
        console.warn("payfast ITN: missing signature");
        return new Response("Invalid signature", { status: 400 });
      }
      const expectedSignature = generateSignature(data, passphrase);
      if (!safeEqual(receivedSignature.toLowerCase(), expectedSignature.toLowerCase())) {
        console.warn("payfast ITN: signature mismatch");
        return new Response("Invalid signature", { status: 400 });
      }

      // Step 2 of PayFast's documented ITN validation: confirm with
      // PayFast's own server that it actually sent this notification,
      // rather than trusting a signature alone (a signature only proves
      // *something* had the passphrase — the passphrase itself could leak
      // from a misconfigured client; the validate round-trip can't be
      // forged by anyone who isn't PayFast's own infrastructure).
      const validateResp = await fetch(`https://${payfastHost()}/eng/query/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: raw,
      });
      const validateText = (await validateResp.text()).trim();
      if (validateText !== "VALID") {
        console.warn("payfast ITN: server-side validate rejected notification", { validateText });
        return new Response("Invalid notification", { status: 400 });
      }

      const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const meta = JSON.parse(data.custom_str1 || "{}") as Record<string, unknown>;
      const userId = data.custom_str2 || (meta.user_id as string | undefined) || "";
      const purchaseType = meta.purchase_type as PurchaseType | undefined;
      const reference = data.pf_payment_id || data.m_payment_id || crypto.randomUUID();
      const paidZar = Number(data.amount_gross || "0");
      const expectedZar = Number(meta.expected_amount_zar ?? NaN);

      if (!userId || !purchaseType) {
        console.warn("payfast ITN: missing user/purchase metadata", { userId, purchaseType });
        return new Response("OK", { status: 200 });
      }

      if (data.payment_status === "COMPLETE") {
        if (!(Math.abs(paidZar - expectedZar) < 0.01)) {
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
        if (!result.ok) {
          // PayFast retries ITNs on a non-2xx response — a transient DB
          // error gets a real chance to self-heal on redelivery.
          return new Response("Entitlement grant failed", { status: 500, headers: corsHeaders });
        }
      } else if (data.payment_status === "FAILED") {
        await failPurchase(admin, { gateway: "payfast", userId, reference, purchaseType, meta, currency: "ZAR" });
      }

      return new Response("OK", { status: 200 });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // ---- Initiate a checkout (authenticated) ----
    const authed = await resolveAuthedUser(req, supabaseUrl);
    if (!authed) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const charge = await resolveCharge(admin, body);
    if (!charge.ok) {
      return new Response(JSON.stringify({ error: charge.error }), {
        status: charge.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullMeta = { user_id: authed.userId, ...charge.metadata };
    const fullMetaJson = JSON.stringify(fullMeta);
    if (fullMetaJson.length > 255) {
      // PayFast's custom_str fields are hard-capped at 255 characters each;
      // truncating the JSON here would hand the ITN handler unparseable
      // garbage later, silently losing the sale's entitlement. Every
      // current purchaseType's metadata comfortably fits — this only fires
      // if a future purchaseType adds a long free-text field, which needs
      // its own design (e.g. a server-side pending-checkout row keyed by
      // m_payment_id) rather than round-tripping through PayFast verbatim.
      console.error("payfast-payment: metadata too large for custom_str1", { length: fullMetaJson.length });
      return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const returnUrl = safeCallback(body.callbackUrl);
    const notifyUrl = `${supabaseUrl}/functions/v1/payfast-payment?notify=true`;
    const mPaymentId = `${charge.metadata.purchase_type}_${authed.userId}_${Date.now()}`;

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: returnUrl.includes("?") ? `${returnUrl}&payment=cancelled` : `${returnUrl}?payment=cancelled`,
      notify_url: notifyUrl,
      email_confirmation: "0",
      name_first: authed.email.split("@")[0]?.slice(0, 100) ?? "",
      email_address: authed.email,
      m_payment_id: mPaymentId,
      amount: charge.amountZar.toFixed(2),
      item_name: charge.name.slice(0, 100),
      // custom_str1/custom_str2 round-trip through PayFast unmodified and
      // come back verbatim on the ITN — this is how the ITN handler above
      // recovers user_id/purchase metadata without a separate DB lookup.
      custom_str1: JSON.stringify(fullMeta).slice(0, 255),
      custom_str2: authed.userId,
    };
    paymentData.signature = generateSignature(paymentData, passphrase);

    return new Response(
      JSON.stringify({
        paymentUrl: `https://${payfastHost()}/eng/process`,
        paymentData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("payfast-payment error:", error);
    return new Response(JSON.stringify({ error: "Payment processing failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
