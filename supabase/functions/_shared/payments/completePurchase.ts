import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Gateway, PurchaseType } from "./types.ts";

export interface CompletePurchaseInput {
  gateway: Gateway;
  userId: string;
  reference: string;
  purchaseType: PurchaseType;
  meta: Record<string, unknown>;
  /** What was actually charged, in whatever currency the gateway settled in. */
  paidAmount: number;
  currency: "ZAR" | "USD";
  /** ZAR price the charge was based on (pricing_plans/credit_packs are ZAR-native) — always recorded, regardless of settlement currency. */
  amountZar: number;
}

export interface CompletePurchaseResult {
  ok: boolean;
  needsReview: boolean;
  error?: unknown;
}

function describePurchase(purchaseType: PurchaseType, meta: Record<string, unknown>): string {
  if (purchaseType === "plan") {
    const base = `${meta.plan_id ?? "membership"} membership (${meta.interval ?? "monthly"})`;
    return meta.subscription_id ? `${base} — PayPal subscription` : base;
  }
  if (purchaseType === "credit_pack") {
    const credits = meta.credits;
    return `${credits ?? ""} AI analysis credit${credits === 1 ? "" : "s"}`.trim();
  }
  return "Founding Member";
}

/**
 * The single place a *verified* successful charge (from any gateway) turns
 * into a real entitlement — payment_transactions row, membership activation,
 * Analysis Pass credit grant, or founding-member slot claim. Extracted from
 * what used to be paystack-payment's webhook handler so PayFast and PayPal
 * can never drift on this logic (a discrepancy here means a customer paid
 * and didn't get what they paid for). Idempotent throughout: `reference`
 * uniquely keys payment_transactions and grant_ai_credits' own ledger, so a
 * redelivered webhook / a client retrying `capture` after a network blip
 * never double-grants.
 */
export async function completePurchase(
  admin: ReturnType<typeof createClient>,
  input: CompletePurchaseInput,
): Promise<CompletePurchaseResult> {
  const { gateway, userId, reference, purchaseType, meta, paidAmount, currency, amountZar } = input;

  const description = describePurchase(purchaseType, meta);
  const { error: txError } = await admin.from("payment_transactions").upsert(
    {
      user_id: userId,
      reference,
      purchase_type: purchaseType,
      description,
      amount_zar: amountZar,
      currency,
      amount_original: currency === "ZAR" ? null : paidAmount,
      gateway,
      status: "success",
      metadata: meta,
    },
    { onConflict: "reference", ignoreDuplicates: true },
  );
  if (txError) {
    // Not fatal on its own (it's a record of the charge, not the
    // entitlement grant) but worth surfacing loudly — a gap here means the
    // Billing tab and support both lose visibility into this charge.
    console.error(`${gateway} payment: failed to log payment_transactions row`, { userId, reference, txError });
  }

  let entitlementError: unknown = null;
  let entitlementNeedsReview = false;

  if (purchaseType === "plan") {
    const update: Record<string, unknown> = {
      subscription_status: meta.plan_id,
      billing_interval: meta.interval,
    };
    // A recurring renewal (PayPal subscription) keeps the original start
    // date; only the first paid charge on a plan starts the clock.
    const { data: current } = await admin
      .from("profiles")
      .select("subscription_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!meta.subscription_id || current?.subscription_status !== meta.plan_id) {
      update.subscription_started_at = new Date().toISOString();
    }
    const { error } = await admin.from("profiles").update(update).eq("user_id", userId);
    if (error) entitlementError = error;
  } else if (purchaseType === "credit_pack") {
    // p_reference is the idempotency key: grant_ai_credits() no-ops on a
    // redelivered webhook/retried capture for the same reference instead of
    // granting duplicate Analysis Passes.
    const { error } = await admin.rpc("grant_ai_credits", {
      p_user_id: userId,
      p_reason: `purchase:${meta.pack_id}`,
      p_credits: meta.credits,
      p_expires_after_days: meta.expires_after_days ?? null,
      p_reference: reference,
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
      // The offer sold out between checkout start and payment confirmation
      // — claim_founding_member_slot's atomic UPDATE already prevents
      // overselling the slot itself, but the paying customer still needs
      // *something* for a charge that already succeeded on the gateway's
      // side. Grant the plan the offer maps to as a regular paid
      // membership — no founding badge — and flag the transaction for a
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
      console.error(`${gateway} payment: founding member slot unavailable, granted plan without badge — needs manual price/refund review`, {
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
      console.error(`${gateway} payment: failed to flag transaction for review`, { userId, reference, error });
    }
  }

  if (entitlementError) {
    console.error(`${gateway} payment: entitlement grant failed`, { userId, purchaseType, reference, entitlementError });
    return { ok: false, needsReview: entitlementNeedsReview, error: entitlementError };
  }

  return { ok: true, needsReview: entitlementNeedsReview };
}
