import { TIER_LABELS, minimumTierFor, type FeatureKey } from "@/lib/entitlements";
import { trialCtaLabel } from "@/lib/promo";

/**
 * Pure rules behind useConversionAction() — which one CTA a gate shows for
 * the viewer's state. Unit tested in src/lib/__tests__/conversionAction.test.ts.
 */

export type ConversionKind = "signup" | "trial" | "subscribe";

export interface ConversionState {
  /** Auth or membership still resolving. */
  loading: boolean;
  isSignedIn: boolean;
  /** useMembership().tier — "explorer" for free and signed-out accounts. */
  tier: "explorer" | "glow_lite" | "insider" | "vip";
  isTrialing: boolean;
  trialUsed: boolean;
  /** Does the account already have the gated feature? */
  entitled: boolean;
  feature?: FeatureKey;
}

export interface ConversionDecision {
  kind: ConversionKind | null;
  label: string;
  sublabel: string | null;
  /** True when the viewer already has access — render no CTA. */
  entitled: boolean;
  /** True when no purchasable plan unlocks this yet (VIP-only while VIP is "coming soon"). */
  unavailable: boolean;
}

/** Glow VIP isn't purchasable or trial-able yet (pricing_plans.is_purchasable = false). */
const requiresUnavailableTier = (feature?: FeatureKey) => (feature ? minimumTierFor(feature) === "vip" : false);

export const resolveConversionAction = (s: ConversionState): ConversionDecision => {
  const none = (extra: Partial<ConversionDecision> = {}): ConversionDecision => ({
    kind: null,
    label: "",
    sublabel: null,
    entitled: false,
    unavailable: false,
    ...extra,
  });

  if (s.loading) return none();
  if (s.entitled) return none({ entitled: true });

  if (!s.isSignedIn) {
    return {
      kind: "signup",
      label: "Create free account",
      sublabel: "Free, no card needed. Then pick up right here.",
      entitled: false,
      unavailable: false,
    };
  }

  if (requiresUnavailableTier(s.feature)) {
    return none({ label: `${TIER_LABELS.vip} — coming soon`, unavailable: true });
  }

  // Only a genuinely free account may start a trial: start_free_trial()
  // overwrites subscription_status, which would clobber a paying Glow Lite
  // member's plan. Anyone else who isn't entitled is offered Glow Insider.
  if (s.tier === "explorer" && !s.isTrialing && !s.trialUsed) {
    return {
      kind: "trial",
      label: `Start free trial — ${trialCtaLabel()}`,
      sublabel: `${TIER_LABELS.insider}, no card required. Unlocks right here.`,
      entitled: false,
      unavailable: false,
    };
  }

  return {
    kind: "subscribe",
    label: "Subscribe",
    sublabel: s.tier === "glow_lite" ? `Upgrade to ${TIER_LABELS.insider}` : `Continue with ${TIER_LABELS.insider}`,
    entitled: false,
    unavailable: false,
  };
};
