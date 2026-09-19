// Shared types for the payment-gateway edge functions (payfast-payment,
// paypal-payment). Mirrors the pattern of supabase/functions/_shared/email/:
// provider-agnostic logic lives here once, each gateway's index.ts only
// handles that gateway's own API shape/signature scheme.

export type PurchaseType = "plan" | "credit_pack" | "founding_member";

export type Gateway = "payfast" | "paypal";

export interface ResolvedCharge {
  amountZar: number;
  name: string;
  metadata: Record<string, unknown>;
}

export type ResolveChargeResult =
  | ({ ok: true } & ResolvedCharge)
  | { ok: false; error: string; status: number };
