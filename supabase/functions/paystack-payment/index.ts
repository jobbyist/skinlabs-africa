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

/**
 * Fully refunds a Paystack charge. Used when a payment succeeds for a
 * resource that turned out to be unavailable by the time the webhook fires
 * (e.g. a founding member offer that sold out mid-checkout) — so the charge
 * doesn't sit there needing a human to notice and refund it manually.
 */
async function refundPaystackCharge(
  secretKey: string,
  transactionReference: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: transactionReference }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.status) {
      return { ok: false, error: json?.message ?? `Paystack refund request failed (${res.status})` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
        const reference = event.data?.reference as string | undefined;

        if (!userId || !purchaseType || !reference || !(Math.abs(paidZar - expectedZar) < 0.01)) {
          console.warn("paystack webhook: metadata or amount mismatch", { purchaseType, paidZar, expectedZar, reference });
          return new Response("OK", { status: 200 });
        }

        const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        // Paystack retries a webhook delivery whenever it doesn't get a 2xx response
        // (which now includes every failure branch below), and can occasionally
        // redeliver an already-processed event regardless. Returning 500 on a DB
        // failure — instead of swallowing it and always answering "OK" — is what
        // makes a transient failure self-heal instead of silently leaving a paid
        // user without what they paid for, but it only works safely for a step
        // that is not itself dangerous to repeat. "plan" is a plain UPDATE
        // (idempotent by nature). "credit_pack" and "founding_member" are not —
        // each grants by inserting/incrementing — so both explicitly check whether
        // this exact payment reference already granted before doing so again.
        if (purchaseType === "plan") {
          const { error: planError } = await admin
            .from("profiles")
            .update({
              subscription_status: meta.plan_id,
              subscription_started_at: new Date().toISOString(),
              billing_interval: meta.interval,
            })
            .eq("user_id", userId);
          if (planError) {
            console.error("paystack webhook: failed to grant plan, will retry", { reference, userId, planId: meta.plan_id, error: planError });
            return new Response("Failed to grant plan", { status: 500 });
          }
        } else if (purchaseType === "credit_pack") {
          const creditReason = `purchase:${meta.pack_id}:${reference}`;
          const { data: existingGrant, error: existingGrantError } = await admin
            .from("ai_credit_transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("reason", creditReason)
            .maybeSingle();
          if (existingGrantError) {
            console.error("paystack webhook: failed to check existing credit grant, will retry", { reference, userId, error: existingGrantError });
            return new Response("Failed to verify credit grant state", { status: 500 });
          }
          if (!existingGrant) {
            const { error: creditError } = await admin.rpc("grant_ai_credits", {
              p_user_id: userId,
              p_reason: creditReason,
              p_credits: meta.credits,
              p_expires_after_days: meta.expires_after_days ?? null,
            });
            if (creditError) {
              console.error("paystack webhook: failed to grant credits, will retry", { reference, userId, packId: meta.pack_id, error: creditError });
              return new Response("Failed to grant credits", { status: 500 });
            }
          }
        } else if (purchaseType === "founding_member") {
          // Has this exact payment already claimed a slot? (Distinct from the
          // "sold out" case below — this is "did a previous, only-partially-
          // successful delivery of this same webhook already take a slot".)
          const { data: existingClaim, error: existingClaimError } = await admin
            .from("founding_member_claims")
            .select("reference")
            .eq("reference", reference)
            .maybeSingle();
          if (existingClaimError) {
            console.error("paystack webhook: failed to check founding member claim state, will retry", { reference, userId, error: existingClaimError });
            return new Response("Failed to verify claim state", { status: 500 });
          }

          let slotClaimed = Boolean(existingClaim);
          if (!existingClaim) {
            // Atomic, race-safe against every other concurrent checkout for this
            // offer (see claim_founding_member_slot in the pricing_architecture
            // migration) — this is what actually resolves the race between
            // "slots were available when checkout started" and "are they still
            // available now that payment has succeeded".
            const { data: rpcClaimed, error: claimError } = await admin.rpc("claim_founding_member_slot", {
              p_offer_id: meta.offer_id,
            });
            if (claimError) {
              console.error("paystack webhook: claim_founding_member_slot failed, will retry", { reference, userId, offerId: meta.offer_id, error: claimError });
              return new Response("Failed to claim slot", { status: 500 });
            }
            slotClaimed = Boolean(rpcClaimed);
            if (slotClaimed) {
              const { error: recordClaimError } = await admin
                .from("founding_member_claims")
                .insert({ reference, offer_id: meta.offer_id, user_id: userId });
              if (recordClaimError) {
                // The slot itself is already claimed either way; failing the whole
                // webhook over this bookkeeping write would risk a real double-claim
                // if this event gets redelivered before the grant below completes.
                // Surface it loudly instead so it can be reconciled by hand.
                console.error("paystack webhook: claimed a founding member slot but failed to record it — check for double-claims", {
                  reference,
                  userId,
                  offerId: meta.offer_id,
                  error: recordClaimError,
                });
              }
            }
          }

          if (slotClaimed) {
            const { error: profileError } = await admin
              .from("profiles")
              .update({
                founding_member: true,
                subscription_status: meta.grants_plan ?? "insider",
                subscription_started_at: new Date().toISOString(),
                billing_interval: "annual",
              })
              .eq("user_id", userId);
            if (profileError) {
              // Safe to retry: founding_member_claims already has this reference,
              // so a redelivery skips straight back to this (idempotent) UPDATE
              // instead of re-claiming a second slot.
              console.error("paystack webhook: slot claimed but profile grant failed, will retry", { reference, userId, error: profileError });
              return new Response("Failed to grant founding member status", { status: 500 });
            }
          } else {
            // The offer sold out between checkout start and payment confirmation.
            // The charge already succeeded on Paystack's side — refund it
            // automatically instead of leaving that for someone to notice.
            const refund = await refundPaystackCharge(secretKey, reference);
            if (!refund.ok) {
              console.error("paystack webhook: founding member slot unavailable AND automatic refund failed — manual refund required", {
                userId,
                offerId: meta.offer_id,
                reference,
                refundError: refund.error,
              });
            } else {
              console.warn("paystack webhook: founding member slot unavailable, payment refunded automatically", {
                userId,
                offerId: meta.offer_id,
                reference,
              });
            }
          }
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
