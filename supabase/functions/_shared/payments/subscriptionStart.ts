// When a recurring membership's first charge happens — shared by
// paypal-payment and payfast-payment so the two gateways can never quote a
// member different dates. Moved here from paypal-payment (onboarding
// overhaul 06); the rules are unchanged.
//
// Keep in sync with start_free_trial() (SQL): one trial per account, the
// plan must be trial_eligible, trial_days from pricing_plans, extended to
// pricing_settings.promo_free_trial_until while that's later.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Admin = ReturnType<typeof createClient>;

export type StartKind = "new_trial" | "existing_trial" | "immediate";

export interface SubscriptionStart {
  kind: StartKind;
  /** When the first recurring charge happens; null = at checkout. */
  firstBillingAt: string | null;
}

const PAID_STATUSES = new Set(["glow_lite", "insider", "vip", "active", "premium"]);

/** Subscription rows that still bill (or are about to): cancel flows act on these. */
export const LIVE_SUB_STATUSES = ["pending", "trialing", "active", "past_due"];

export async function resolveSubscriptionStart(
  admin: Admin,
  userId: string,
  planId: string,
  variantKey: string,
): Promise<SubscriptionStart | { error: string; status: number }> {
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, trial_ends_at, trial_used_at, founding_member")
    .eq("user_id", userId)
    .maybeSingle();
  const status = String(profile?.subscription_status ?? "").toLowerCase();

  const { data: liveSubs } = await admin
    .from("payment_subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"]);
  if (liveSubs && liveSubs.length > 0) {
    return { error: "Auto-renew is already on for your membership. Manage it from your dashboard's Billing tab.", status: 409 };
  }
  if (profile?.founding_member) {
    return { error: "Your Founding Member access already includes this plan.", status: 409 };
  }

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at as string) : null;
  if (status === "trial" && trialEndsAt && trialEndsAt.getTime() > Date.now() + 5 * 60_000) {
    return { kind: "existing_trial", firstBillingAt: trialEndsAt.toISOString() };
  }

  if (!profile?.trial_used_at && !PAID_STATUSES.has(status)) {
    let { data: plan } = await admin
      .from("pricing_plans")
      .select("trial_days, trial_eligible")
      .eq("plan_id", planId)
      .eq("variant_key", variantKey)
      .maybeSingle();
    if (!plan) {
      ({ data: plan } = await admin
        .from("pricing_plans")
        .select("trial_days, trial_eligible")
        .eq("plan_id", planId)
        .eq("variant_key", "control")
        .maybeSingle());
    }
    const trialDays = Number(plan?.trial_days ?? 0);
    if (plan?.trial_eligible && trialDays > 0) {
      let { data: settings } = await admin
        .from("pricing_settings")
        .select("promo_free_trial_until")
        .eq("variant_key", variantKey)
        .maybeSingle();
      if (!settings) {
        ({ data: settings } = await admin
          .from("pricing_settings")
          .select("promo_free_trial_until")
          .eq("variant_key", "control")
          .maybeSingle());
      }
      let ends = Date.now() + trialDays * 86_400_000;
      const promoUntil = settings?.promo_free_trial_until ? new Date(settings.promo_free_trial_until as string).getTime() : 0;
      if (promoUntil > ends) ends = promoUntil;
      return { kind: "new_trial", firstBillingAt: new Date(ends).toISOString() };
    }
  }

  return { kind: "immediate", firstBillingAt: null };
}
