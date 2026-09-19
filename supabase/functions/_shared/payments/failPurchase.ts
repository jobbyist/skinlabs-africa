import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Gateway, PurchaseType } from "./types.ts";

/**
 * Logs a charge that the gateway itself reported as failed/cancelled, so
 * the PAYMENT_FAILED email has something real to enqueue from and support
 * has visibility. Never grants an entitlement — mirrors completePurchase's
 * upsert shape but with status:'failed'.
 */
export async function failPurchase(
  admin: ReturnType<typeof createClient>,
  input: {
    gateway: Gateway;
    userId: string;
    reference: string;
    purchaseType: PurchaseType;
    meta: Record<string, unknown>;
    currency: "ZAR" | "USD";
  },
): Promise<void> {
  const { gateway, userId, reference, purchaseType, meta, currency } = input;
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
      amount_zar: Number(meta.expected_amount_zar ?? 0),
      currency,
      amount_original: null,
      gateway,
      status: "failed",
      metadata: meta,
    },
    { onConflict: "reference", ignoreDuplicates: true },
  );
  if (txError) {
    console.error(`${gateway} payment: failed to log failed-charge payment_transactions row`, { userId, reference, txError });
  }
}
