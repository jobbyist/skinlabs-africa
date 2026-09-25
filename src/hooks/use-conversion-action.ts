import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useStartTrial } from "@/hooks/use-start-trial";
import { trackConversionEvent } from "@/lib/analytics-events";
import { resolveConversionAction, type ConversionKind } from "@/lib/conversionAction";
import { openMembershipCheckout, openSignupDialog } from "@/lib/conversionDialogs";
import { TIER_LABELS, hasCapability, type FeatureKey, type LadderTier } from "@/lib/entitlements";
import { currentReturnTo, setPendingIntent } from "@/lib/pendingIntent";
import { getPersistedPricingVariant } from "@/lib/pricing-config";

export interface ConversionAction {
  label: string;
  sublabel: string | null;
  kind: ConversionKind | null;
  /** Viewer already has access: render no CTA. */
  entitled: boolean;
  /** Nothing purchasable unlocks this yet — show `label` as a disabled status, not a button. */
  unavailable: boolean;
  /** Auth/membership still resolving, or a trial is starting. */
  busy: boolean;
  run: () => void;
}

/**
 * The one CTA every gate shows, chosen from the viewer's state
 * (src/lib/conversionAction.ts has the rules):
 *   anonymous            → "Create free account" (records an `unlock` intent
 *                          for this page, opens sign-up; IntentResolver
 *                          brings them back here)
 *   free, trial unused   → "Start free trial — …" (no-card Glow Insider trial
 *                          via useStartTrial, stays here, content unlocks)
 *   trial used / paid    → "Subscribe" (membership checkout dialog)
 *   entitled             → kind null, `entitled: true`
 * Every run() fires `upgrade_click` with { source, kind, feature }.
 * Needs <ConversionDialogs /> mounted (App.tsx; SSR routes mount their own).
 */
export const useConversionAction = (feature: FeatureKey | undefined, source: string): ConversionAction => {
  const { user, loading: authLoading } = useAuth();
  const membership = useMembership();
  const { start, loading: trialStarting } = useStartTrial();

  const loading = authLoading || membership.loading;
  // Same rule as useEntitlements().can(), from this hook's one membership read.
  const ladderTier: LadderTier = !user ? "anonymous" : membership.tier === "explorer" ? "free" : membership.tier;
  const entitled = feature
    ? hasCapability(
        {
          isSignedIn: Boolean(user),
          ladderTier,
          isFoundingMember: membership.isFoundingMember,
          isProfessional: membership.isProfessional,
        },
        feature,
      )
    : membership.isMember;

  const decision = resolveConversionAction({
    loading,
    isSignedIn: Boolean(user),
    tier: membership.tier,
    isTrialing: membership.isTrialing,
    trialUsed: membership.trialUsed,
    entitled,
    feature,
  });

  const run = useCallback(() => {
    if (!decision.kind) return;
    trackConversionEvent("upgrade_click", { source, kind: decision.kind, feature });
    if (decision.kind === "signup") {
      setPendingIntent({ action: "unlock", returnTo: currentReturnTo() });
      openSignupDialog();
    } else if (decision.kind === "trial") {
      void start({ plan: "insider", source });
    } else {
      openMembershipCheckout({
        plan: { planId: "insider", name: TIER_LABELS.insider, interval: "monthly" },
        variantKey: getPersistedPricingVariant(),
      });
    }
  }, [decision.kind, feature, source, start]);

  return {
    label: decision.label,
    sublabel: decision.sublabel,
    kind: decision.kind,
    entitled: decision.entitled,
    unavailable: decision.unavailable,
    busy: loading || trialStarting,
    run,
  };
};
