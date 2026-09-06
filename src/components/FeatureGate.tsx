import { useEffect, useRef, type ReactNode } from "react";
import GatedOverlay from "@/components/GatedOverlay";
import { useEntitlements } from "@/hooks/use-entitlements";
import { TIER_LABELS, minimumTierFor, type FeatureKey } from "@/lib/entitlements";
import { trackConversionEvent } from "@/lib/analytics-events";

interface FeatureGateProps {
  /** Which entitlement this content requires — see src/lib/entitlements.ts. */
  feature: FeatureKey;
  title?: string;
  message?: string;
  ctaLabel?: string;
  onSignIn?: () => void;
  children: ReactNode;
}

/**
 * The standard soft-gate for a single feature: blurs `children` behind an
 * upgrade prompt (via GatedOverlay) when the signed-in account's entitlements
 * don't cover `feature`, and copy/CTA are derived automatically from the
 * capability model instead of being hand-written per page. Fires an
 * `upgrade_prompt_view` conversion event the first time a visitor sees the
 * lock, so funnel drop-off at each feature can be measured later.
 *
 * Prefer this over composing GatedOverlay + a manual `locked` check directly
 * for any new gate — it keeps the "what unlocks what" decision in one place.
 * Existing gates with extra logic beyond a simple tier check (e.g. the AI
 * Formulator's rolling usage quota) can stay as they are; this component
 * doesn't model quotas, only static feature access.
 */
const FeatureGate = ({ feature, title, message, ctaLabel, onSignIn, children }: FeatureGateProps) => {
  const { can, loading, accountState } = useEntitlements();
  const locked = !loading && !can(feature);
  const firedRef = useRef(false);

  useEffect(() => {
    if (locked && !firedRef.current) {
      firedRef.current = true;
      trackConversionEvent("upgrade_prompt_view", { feature, accountState, style: "overlay" });
    }
  }, [locked, feature, accountState]);

  // Avoid a flash of the lock while membership is still resolving.
  if (loading) return <>{children}</>;

  const requiredTier = minimumTierFor(feature);
  const defaultTitle = requiredTier ? `${TIER_LABELS[requiredTier]} feature` : "Members only";
  const defaultMessage = requiredTier
    ? `Upgrade to ${TIER_LABELS[requiredTier]} to unlock this.`
    : "Upgrade your SkinLabs membership to see the rest.";

  return (
    <GatedOverlay
      locked={locked}
      title={title ?? defaultTitle}
      message={message ?? defaultMessage}
      ctaLabel={ctaLabel ?? "View membership plans"}
      onSignIn={onSignIn}
    >
      {children}
    </GatedOverlay>
  );
};

export default FeatureGate;
