import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import {
  hasCapability,
  minimumTierFor,
  resolveAccountState,
  TIER_LABELS,
  type AccountState,
  type FeatureKey,
  type LadderTier,
} from "@/lib/entitlements";

/**
 * The app-wide entitlement resolver. Layers capability resolution
 * (src/lib/entitlements.ts) on top of the existing auth/membership data
 * sources (useAuth, useMembership) rather than re-fetching anything —
 * useMembership stays the single Supabase query for a signed-in user's
 * profile/plan state; this hook only interprets that data against the
 * capability model.
 *
 * Use `can(feature)` for gating instead of comparing `tier`/`isVip` directly,
 * so a feature's required tier only ever needs to change in one place
 * (src/lib/entitlements.ts) rather than at every call site.
 */
export const useEntitlements = () => {
  const { user, loading: authLoading } = useAuth();
  const membership = useMembership();

  const ladderTier: LadderTier = useMemo(() => {
    if (!user) return "anonymous";
    // useMembership's MembershipTier is "explorer" | "insider" | "vip" — "free" is
    // this system's label for the same signed-in-but-unpaid state.
    return membership.tier === "explorer" ? "free" : membership.tier;
  }, [user, membership.tier]);

  const entitlementInput = {
    isSignedIn: Boolean(user),
    ladderTier,
    isFoundingMember: membership.isFoundingMember,
    isProfessional: membership.isProfessional,
  };

  const accountState: AccountState = resolveAccountState(entitlementInput);

  return {
    loading: authLoading || membership.loading,
    accountState,
    accountLabel: TIER_LABELS[accountState],
    ladderTier,
    isAnonymous: ladderTier === "anonymous",
    isFree: ladderTier === "free",
    isGlowLite: ladderTier === "glow_lite",
    isInsider: ladderTier === "insider",
    isVip: ladderTier === "vip",
    isFoundingMember: membership.isFoundingMember,
    isProfessional: membership.isProfessional,
    isMember: membership.isMember,
    isTrialing: membership.isTrialing,
    trialEndsAt: membership.trialEndsAt,
    /** Does this account unlock the given feature? Single source of truth — see entitlements.ts. */
    can: (feature: FeatureKey) => hasCapability(entitlementInput, feature),
    /** Lowest ladder tier that unlocks a feature — for "Upgrade to X" copy. */
    minimumTierFor,
    refresh: membership.refresh,
  };
};
