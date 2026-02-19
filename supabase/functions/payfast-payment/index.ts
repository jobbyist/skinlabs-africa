import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSignature(data: Record<string, string>, passPhrase: string): string {
  const params = Object.keys(data)
    .filter((key) => data[key] !== "")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const signatureString = passPhrase ? `${params}&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, "+")}` : params;

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(signatureString);
  const hashBuffer = new Uint8Array(crypto.subtle.digestSync("MD5", dataBytes));
  return Array.from(hashBuffer).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID")!;
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY")!;
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE")!;

    if (req.method === "POST") {
      const body = await req.json();
      const { type, userId, email, name } = body;

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Determine payment details based on type
      let amount: string;
      let itemName: string;
      let itemDescription: string;
      let subscriptionType = 0; // 0 = once-off, 1 = subscription

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
        throw new Error("Invalid payment type");
      }

      const returnUrl = body.returnUrl || `${req.headers.get("origin")}/get-started?payment=success`;
      const cancelUrl = body.cancelUrl || `${req.headers.get("origin")}/get-started?payment=cancelled`;
      const notifyUrl = `${supabaseUrl}/functions/v1/payfast-payment?notify=true`;

      const paymentData: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: name || "",
        email_address: email || "",
        m_payment_id: `${type}_${userId}_${Date.now()}`,
        amount,
        item_name: itemName,
        item_description: itemDescription,
      };

      if (subscriptionType === 1) {
        paymentData.subscription_type = "1";
        paymentData.billing_date = new Date().toISOString().split("T")[0];
        paymentData.recurring_amount = amount;
        paymentData.frequency = "3"; // Monthly
        paymentData.cycles = "0"; // Indefinite
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

    // Handle PayFast ITN (Instant Transaction Notification)
    const url = new URL(req.url);
    if (url.searchParams.get("notify") === "true") {
      const formData = await req.formData();
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      const paymentStatus = data.payment_status;
      const mPaymentId = data.m_payment_id || "";
      const parts = mPaymentId.split("_");
      const type = parts[0];
      const userId = parts[1];

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
          await supabase
            .from("preorders")
            .insert({
              user_id: userId,
              product_type: "edible_pouches",
              amount: 299.00,
              status: "complete",
              payment_id: data.pf_payment_id || mPaymentId,
            });
        }
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
