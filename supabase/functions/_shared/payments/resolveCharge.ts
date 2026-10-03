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

  // The Founding Member offer was withdrawn (2026-10-03): it can no longer be bought.
  if (purchaseType === "founding_member") {
    return { ok: false, error: "This offer is no longer available", status: 400 };
  }

  return { ok: false, error: "Invalid purchase type", status: 400 };
}
