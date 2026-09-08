import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
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

type PurchaseType = "plan" | "credit_pack" | "founding_member";

/**
 * Every price this function charges comes from the database, resolved here
 * server-side — never from a client-supplied amount. The client only ever
 * sends an identifier (planId/packId/offerId); this is what makes the
 * pricing_plans/credit_packs/founding_member_offers tables the actual single
 * source of truth for money changing hands, not just for display copy.
 */
async function resolveCharge(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
): Promise<
  | { ok: true; amountZar: number; name: string; metadata: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const purchaseType = (body.purchaseType as PurchaseType) ?? "plan";
  const variantKey = typeof body.variantKey === "string" ? body.variantKey : "control";

  if (purchaseType === "plan") {
    const planId = typeof body.planId === "string" ? body.planId : "insider";
    const interval = body.interval === "annual" ? "annual" : "monthly";

    let { data: plan } = await admin
      .from("pricing_plans")
      .select("plan_id, price_monthly, price_annual, is_purchasable, name")
      .eq("plan_id", planId)
      .eq("variant_key", variantKey)
      .maybeSingle();
    if (!plan) {
      ({ data: plan } = await admin
        .from("pricing_plans")
        .select("plan_id, price_monthly, price_annual, is_purchasable, name")
        .eq("plan_id", planId)
        .eq("variant_key", "control")
        .maybeSingle());
    }
    if (!plan || planId === "explorer") {
      return { ok: false, error: "Invalid plan", status: 400 };
    }
    if (!plan.is_purchasable) {
      return { ok: false, error: "This plan isn't available for purchase yet", status: 400 };
    }
    const amountZar = Number(interval === "annual" ? plan.price_annual : plan.price_monthly);
    if (!(amountZar > 0)) {
      return { ok: false, error: "Invalid plan", status: 400 };
    }
    return {
      ok: true,
      amountZar,
      name: `${plan.name} membership (${interval})`,
      metadata: { purchase_type: "plan", plan_id: planId, interval, expected_amount_zar: amountZar },
    };
  }

  if (purchaseType === "credit_pack") {
    const packId = typeof body.packId === "string" ? body.packId : "";
    let { data: pack } = await admin
      .from("credit_packs")
      .select("pack_id, name, price, credits, expires_after_days, is_active")
      .eq("pack_id", packId)
      .eq("variant_key", variantKey)
      .maybeSingle();
    if (!pack) {
      ({ data: pack } = await admin
        .from("credit_packs")
        .select("pack_id, name, price, credits, expires_after_days, is_active")
        .eq("pack_id", packId)
        .eq("variant_key", "control")
        .maybeSingle());
    }
    if (!pack || !pack.is_active) {
      return { ok: false, error: "Invalid credit pack", status: 400 };
    }
    return {
      ok: true,
      amountZar: Number(pack.price),
      name: pack.name,
      metadata: {
        purchase_type: "credit_pack",
        pack_id: packId,
        credits: pack.credits,
        expires_after_days: pack.expires_after_days,
        expected_amount_zar: Number(pack.price),
      },
    };
  }

  if (purchaseType === "founding_member") {
    const offerId = typeof body.offerId === "string" ? body.offerId : "";
    const { data: offer } = await admin
      .from("founding_member_offers")
      .select("id, name, price, member_cap, redeemed_count, grants_plan, is_active, starts_at, ends_at")
      .eq("id", offerId)
      .maybeSingle();
    if (!offer || !offer.is_active) {
      return { ok: false, error: "This offer is no longer available", status: 400 };
    }
    if (offer.ends_at && new Date(offer.ends_at as string) < new Date()) {
      return { ok: false, error: "This offer has ended", status: 400 };
    }
    if ((offer.redeemed_count as number) >= (offer.member_cap as number)) {
      return { ok: false, error: "All founding member spots have been claimed", status: 400 };
    }
    return {
      ok: true,
      amountZar: Number(offer.price),
      name: offer.name as string,
      metadata: {
        purchase_type: "founding_member",
        offer_id: offer.id,
        grants_plan: offer.grants_plan,
        expected_amount_zar: Number(offer.price),
      },
    };
  }

  return { ok: false, error: "Invalid purchase type", status: 400 };
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
        const paidZar = Number(event.data?.amount ?? 0) / 100;
        const expectedZar = Number(meta.expected_amount_zar ?? NaN);
        const purchaseType = meta.purchase_type as PurchaseType | undefined;

        if (!userId || !purchaseType || !(Math.abs(paidZar - expectedZar) < 0.01)) {
          console.warn("paystack webhook: metadata or amount mismatch", { purchaseType, paidZar, expectedZar });
          return new Response("OK", { status: 200 });
        }

        const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const reference = (event.data?.reference as string | undefined) ?? crypto.randomUUID();

        // Every DB write below is checked: a silent failure here means a
        // customer paid but their plan/credits never landed, so any error
        // makes this handler return 5xx instead of "OK" — Paystack retries
        // webhooks on non-2xx responses, giving a transient DB error (as
        // opposed to a logic error) a real chance to self-heal on retry.
        let entitlementError: unknown = null;
        let entitlementNeedsReview = false;

        // Log every verified charge for the dashboard's Billing tab (transaction
        // history + downloadable invoices) — real data only, never fabricated.
        // ON CONFLICT guards against Paystack's at-least-once webhook retries.
        const description =
          purchaseType === "plan"
            ? `${meta.plan_id ?? "membership"} membership (${meta.interval ?? "monthly"})`
            : purchaseType === "credit_pack"
              ? `${meta.credits ?? ""} AI analysis credit${meta.credits === 1 ? "" : "s"}`.trim()
              : "Founding Member";
        const { error: txError } = await admin.from("payment_transactions").upsert(
          {
            user_id: userId,
            reference,
            purchase_type: purchaseType,
            description,
            amount_zar: paidZar,
            status: "success",
            metadata: meta,
          },
          { onConflict: "reference", ignoreDuplicates: true },
        );
        if (txError) {
          // Not fatal on its own (it's a record of the charge, not the
          // entitlement grant) but worth surfacing loudly — a gap here means
          // the Billing tab and support both lose visibility into this charge.
          console.error("paystack webhook: failed to log payment_transactions row", { userId, reference, txError });
        }

        if (purchaseType === "plan") {
          const { error } = await admin
            .from("profiles")
            .update({
              subscription_status: meta.plan_id,
              subscription_started_at: new Date().toISOString(),
              billing_interval: meta.interval,
            })
            .eq("user_id", userId);
          if (error) entitlementError = error;
        } else if (purchaseType === "credit_pack") {
          const { error } = await admin.rpc("grant_ai_credits", {
            p_user_id: userId,
            p_reason: `purchase:${meta.pack_id}`,
            p_credits: meta.credits,
            p_expires_after_days: meta.expires_after_days ?? null,
          });
          if (error) entitlementError = error;
        } else if (purchaseType === "founding_member") {
          const { data: claimed, error: claimError } = await admin.rpc("claim_founding_member_slot", {
            p_offer_id: meta.offer_id,
          });
          if (claimError) {
            entitlementError = claimError;
          } else if (claimed) {
            const { error } = await admin
              .from("profiles")
              .update({
                founding_member: true,
                subscription_status: meta.grants_plan ?? "insider",
                subscription_started_at: new Date().toISOString(),
                billing_interval: "annual",
              })
              .eq("user_id", userId);
            if (error) entitlementError = error;
          } else {
            // The offer sold out between checkout start and payment
            // confirmation — claim_founding_member_slot's atomic UPDATE
            // already prevents overselling the slot itself, but the paying
            // customer still needs *something* for a charge that already
            // succeeded on Paystack's side. Rather than leave them with
            // nothing (the previously-unhandled case), grant the plan the
            // offer maps to as a regular paid membership — no founding
            // badge, but an active account — and flag the transaction for a
            // human to reconcile the price difference/refund.
            entitlementNeedsReview = true;
            const { error } = await admin
              .from("profiles")
              .update({
                subscription_status: meta.grants_plan ?? "insider",
                subscription_started_at: new Date().toISOString(),
                billing_interval: "annual",
              })
              .eq("user_id", userId);
            if (error) entitlementError = error;
            console.error("paystack webhook: founding member slot unavailable, granted plan without badge — needs manual price/refund review", {
              userId,
              offerId: meta.offer_id,
              reference,
            });
          }
        }

        if (entitlementNeedsReview && !entitlementError) {
          const { error } = await admin
            .from("payment_transactions")
            .update({ status: "needs_review", metadata: { ...meta, founding_member_slot_unavailable: true } })
            .eq("reference", reference);
          if (error) {
            console.error("paystack webhook: failed to flag transaction for review", { userId, reference, error });
          }
        }

        if (entitlementError) {
          console.error("paystack webhook: entitlement grant failed", { userId, purchaseType, reference, entitlementError });
          return new Response("Entitlement grant failed", { status: 500, headers: corsHeaders });
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
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const charge = await resolveCharge(admin, body);
    if (!charge.ok) {
      return new Response(JSON.stringify({ error: charge.error }), {
        status: charge.status,
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
        amount: Math.round(charge.amountZar * 100),
        currency: "ZAR",
        callback_url: safeCallback(body.callbackUrl),
        metadata: {
          user_id: userId,
          ...charge.metadata,
          custom_fields: [{ display_name: "Item", variable_name: "item", value: charge.name }],
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
