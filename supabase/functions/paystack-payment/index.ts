import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

const PLANS: Record<string, { amountZar: number; name: string; status: string }> = {
  insider: { amountZar: 99, name: "Glow Insider membership", status: "insider" },
  vip: { amountZar: 299, name: "Glow VIP membership", status: "vip" },
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
    return ALLOWED_CALLBACK_ORIGINS.includes(`${u.protocol}//${u.host}`) ? url : fallback;
  } catch {
    return fallback;
  }
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const url = new URL(req.url);

    // ---- Paystack webhook ----
    if (url.searchParams.get("webhook") === "true") {
      const raw = await req.text();
      const signature = req.headers.get("x-paystack-signature") ?? "";
      if (!signature) return new Response("Missing signature", { status: 400 });

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"],
      );
      const expected = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
      if (!safeEqual(expected.toLowerCase(), signature.toLowerCase())) {
        console.warn("paystack webhook: signature mismatch");
        return new Response("Invalid signature", { status: 400 });
      }

      const event = JSON.parse(raw);
      if (event?.event === "charge.success") {
        const meta = event.data?.metadata ?? {};
        const userId = meta.user_id as string | undefined;
        const planId = (meta.plan as string | undefined) ?? "insider";
        const plan = PLANS[planId] ?? PLANS.insider;
        const paidZar = Number(event.data?.amount ?? 0) / 100;

        if (userId && Math.abs(paidZar - plan.amountZar) < 0.01) {
          const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
          await admin
            .from("profiles")
            .update({
              subscription_status: plan.status,
              subscription_started_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } else {
          console.warn("paystack webhook: metadata or amount mismatch", { planId, paidZar });
        }
      }

      return new Response("OK", { status: 200 });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // ---- Initialise a transaction (authenticated) ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string | undefined) ?? "";

    const body = await req.json().catch(() => ({}));
    const planId = typeof body.plan === "string" ? body.plan : "insider";
    const plan = PLANS[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(plan.amountZar * 100),
        currency: "ZAR",
        callback_url: safeCallback(body.callbackUrl),
        metadata: {
          user_id: userId,
          plan: planId,
          custom_fields: [{ display_name: "Plan", variable_name: "plan", value: plan.name }],
        },
      }),
    });

    const json = await res.json();
    if (!res.ok || !json?.status) {
      console.error("paystack init failed", json?.message);
      return new Response(JSON.stringify({ error: "Could not start checkout. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        authorization_url: json.data.authorization_url,
        reference: json.data.reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("paystack-payment error:", error);
    return new Response(JSON.stringify({ error: "Payment processing failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
