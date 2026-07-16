import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_RETURN_ORIGINS = [
  "https://skinlabs.co.za",
  "https://www.skinlabs.co.za",
  "https://openhaus.skinlabs.co.za",
  "https://skinlabsza.lovable.app",
  "https://skinlabs-openhaus.lovable.app",
];

function isSafeReturnUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return ALLOWED_RETURN_ORIGINS.includes(`${u.protocol}//${u.host}`);
  } catch {
    return false;
  }
}

function generateSignature(data: Record<string, string>, passPhrase: string): string {
  const params = Object.keys(data)
    .filter((key) => data[key] !== "")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const signatureString = passPhrase
    ? `${params}&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, "+")}`
    : params;

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(signatureString);
  const hashBuffer = new Uint8Array(crypto.subtle.digestSync("MD5", dataBytes));
  return Array.from(hashBuffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const EXPECTED_AMOUNTS: Record<string, number> = {
  subscription: 99.0,
  preorder: 299.0,
};

const DEFAULT_RETURN = "https://skinlabs.co.za/get-started?payment=success";
const DEFAULT_CANCEL = "https://skinlabs.co.za/get-started?payment=cancelled";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID")!;
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY")!;
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE")!;

    // Handle PayFast ITN
    const url = new URL(req.url);
    if (url.searchParams.get("notify") === "true") {
      const formData = await req.formData();
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      const receivedSignature = data.signature || "";
      if (!receivedSignature) {
        console.warn("ITN: missing signature");
        return new Response("Invalid signature", { status: 400 });
      }

      const { signature: _ignored, ...verifyFields } = data;
      const expectedSignature = generateSignature(verifyFields, passphrase);

      if (!safeEqual(receivedSignature.toLowerCase(), expectedSignature.toLowerCase())) {
        console.warn("ITN: signature mismatch");
        return new Response("Invalid signature", { status: 400 });
      }

      const mPaymentId = data.m_payment_id || "";
      const parts = mPaymentId.split("_");
      const type = parts[0];
      const userId = parts[1];

      const expectedAmount = EXPECTED_AMOUNTS[type];
      const receivedAmount = parseFloat(data.amount_gross || "0");

      if (!expectedAmount || Math.abs(receivedAmount - expectedAmount) > 0.01) {
        console.warn("ITN: amount mismatch", { type, expectedAmount, receivedAmount });
        return new Response("Invalid amount", { status: 400 });
      }

      const paymentStatus = data.payment_status;
      if (paymentStatus === "COMPLETE" && userId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        if (type === "subscription") {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_started_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } else if (type === "preorder") {
          await supabase.from("preorders").insert({
            user_id: userId,
            product_type: "edible_pouches",
            amount: 299.0,
            status: "complete",
            payment_id: data.pf_payment_id || mPaymentId,
          });
        }
      }

      return new Response("OK", { status: 200 });
    }

    if (req.method === "POST") {
      // --- AUTH: require JWT and derive userId server-side ---
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authedUserId = claimsData.claims.sub as string;
      const authedEmail = (claimsData.claims.email as string | undefined) ?? "";

      const body = await req.json();
      const { type, name } = body;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

      let amount: string;
      let itemName: string;
      let itemDescription: string;
      let subscriptionType = 0;

      if (type === "subscription") {
        amount = "99.00";
        itemName = "SkinLabs Premium Subscription";
        itemDescription = "Monthly premium SkinLabs account - R99/month";
        subscriptionType = 1;
      } else if (type === "preorder") {
        amount = "299.00";
        itemName = "Edible Skincare Pouches Bundle Pre-Order";
        itemDescription = "Pre-order bundle - All variants of Edible Skincare Pouches";
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid payment type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const returnUrl = isSafeReturnUrl(body.returnUrl) ? body.returnUrl : DEFAULT_RETURN;
      const cancelUrl = isSafeReturnUrl(body.cancelUrl) ? body.cancelUrl : DEFAULT_CANCEL;
      const notifyUrl = `${supabaseUrl}/functions/v1/payfast-payment?notify=true`;

      const safeName = typeof name === "string" ? name.slice(0, 100) : "";

      const paymentData: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: safeName,
        email_address: authedEmail,
        m_payment_id: `${type}_${authedUserId}_${Date.now()}`,
        amount,
        item_name: itemName,
        item_description: itemDescription,
      };

      if (subscriptionType === 1) {
        paymentData.subscription_type = "1";
        paymentData.billing_date = new Date().toISOString().split("T")[0];
        paymentData.recurring_amount = amount;
        paymentData.frequency = "3";
        paymentData.cycles = "0";
      }

      const signature = generateSignature(paymentData, passphrase);
      paymentData.signature = signature;

      return new Response(
        JSON.stringify({
          paymentUrl: "https://www.payfast.co.za/eng/process",
          paymentData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("payfast-payment error:", error);
    return new Response(
      JSON.stringify({ error: "Payment processing failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
