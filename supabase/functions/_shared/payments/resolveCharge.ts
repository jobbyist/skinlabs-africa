import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { PurchaseType, ResolveChargeResult } from "./types.ts";

/**
 * Every price a payment gateway function charges comes from the database,
 * resolved here server-side — never from a client-supplied amount. The
 * client only ever sends an identifier (planId/packId/offerId); this is
 * what makes pricing_plans/credit_packs/founding_member_offers the actual
 * single source of truth for money changing hands, not just display copy.
 *
 * Shared verbatim across gateways (originally lived only in the removed
 * paystack-payment function) so PayFast and PayPal can never drift on what
 * a given plan/pack/offer actually costs.
 */
export async function resolveCharge(
  admin: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
): Promise<ResolveChargeResult> {
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
