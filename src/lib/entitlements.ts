/**
 * SkinLabs entitlement system — the single source of truth for what each
 * account state can access.
 *
 * Every feature gate in the app (FeatureGate, UpgradePrompt, and any
 * page-level check) should resolve through `hasCapability`/`minimumTierFor`
 * rather than re-implementing its own tier comparison, so frontend gating
 * can never silently drift from the plan definitions in src/data/plans.ts
 * or the backend's own source of truth (the `is_member()` Postgres function
 * and RLS policies in supabase/migrations).
 *
 * Two independent axes make up an account's full state:
 *
 *   Ladder tier (mutually exclusive, increasing access):
 *     anonymous -> free -> glow_lite -> insider -> vip
 *
 *   Orthogonal flags (layer on top of whichever ladder tier is active):
 *     foundingMember, isProfessional
 *
 * "glow_lite" is a live, purchasable tier (pricing_plans.glow_lite, with a
 * trial path). useMembership() resolves it from `profiles.subscription_status
 * = 'glow_lite'` for a paid member and from `trial_plan = 'glow_lite'` for a
 * trialist. Founding-member checkout is live too (completePurchase.ts sets
 * `founding_member`). The professional/B2B tier is not: `is_professional`
 * exists (see supabase/migrations/20260906180000_entitlement_foundations.sql)
 * but no live flow sets it to true yet.
 */

export type LadderTier = "anonymous" | "free" | "glow_lite" | "insider" | "vip";

/** The single label used when only one state can be shown at a time (badges, nav). */
export type AccountState =
  | "anonymous"
  | "free"
  | "glow_lite"
  | "insider"
  | "vip"
  | "founding_member"
  | "professional";

export type FeatureKey =
  | "ai_analysis.starter"
  | "ai_analysis.live_weekly"
  | "ai_analysis.routine_builder"
  | "podcast.full_library"
  | "reviews.full_body"
  | "comparisons.unlimited"
  | "spotlight.full_profiles"
  | "practitioner_directory"
  | "consult.priority_booking"
  | "dashboard.professional_tools"
  | "routine.conflict_matcher"
  | "assessment.advanced";

const LADDER_ORDER: LadderTier[] = ["anonymous", "free", "glow_lite", "insider", "vip"];

/** What each ladder tier unlocks, cumulative by design — keep additive as tiers go up. */
const LADDER_CAPABILITIES: Record<LadderTier, FeatureKey[]> = {
  anonymous: ["ai_analysis.starter"],
  free: ["ai_analysis.starter"],
  // Provisional — see file header. Not resolvable from real data yet.
  glow_lite: ["ai_analysis.starter", "comparisons.unlimited", "spotlight.full_profiles", "practitioner_directory"],
  insider: [
    "ai_analysis.starter",
    "ai_analysis.live_weekly",
    "ai_analysis.routine_builder",
    "podcast.full_library",
    "reviews.full_body",
    "comparisons.unlimited",
    "spotlight.full_profiles",
    "practitioner_directory",
    "routine.conflict_matcher",
  ],
  vip: [
    "ai_analysis.starter",
    "ai_analysis.live_weekly",
    "ai_analysis.routine_builder",
    "podcast.full_library",
    "reviews.full_body",
    "comparisons.unlimited",
    "spotlight.full_profiles",
    "practitioner_directory",
    "consult.priority_booking",
    "routine.conflict_matcher",
  ],
};

/**
 * "assessment.advanced" (the SKYNN AI Advanced AI Dermatology Analysis) is a
 * FeatureKey but is deliberately in NO ladder tier: since SKYNN AI v2.1 it
 * needs an Analysis Pass on every plan (rollout_stage 'pass_holders_review';
 * membership alone never qualifies). The only real gate is the server-side
 * get_advanced_assessment_access() RPC via useAdvancedAssessmentAccess() —
 * never can()/hasCapability().
 *
 * "ai_analysis.live_weekly" is the historical key for what is now "unlimited
 * Basic AI Skin Analysis re-analysis" (Insider / VIP; Explorer and Glow Lite
 * get one per rolling 7 days). The key name is kept for compatibility — the
 * legacy weekly live-AI report it originally described was retired in v2.1.
 */

/** Granted regardless of ladder tier — the professional/B2B axis is orthogonal to it. */
const PROFESSIONAL_ONLY_CAPABILITIES: FeatureKey[] = ["dashboard.professional_tools"];

export const TIER_LABELS: Record<AccountState, string> = {
  anonymous: "Visitor",
  free: "Glow Explorer",
  glow_lite: "Glow Lite",
  insider: "Glow Insider",
  vip: "Glow VIP",
  founding_member: "Founding Member",
  professional: "SkinLabs Professional",
};

export interface EntitlementInput {
  isSignedIn: boolean;
  ladderTier: LadderTier;
  isFoundingMember?: boolean;
  isProfessional?: boolean;
}

/** Resolves the single most-specific label for UI that can only show one state at a time. */
export const resolveAccountState = (input: EntitlementInput): AccountState => {
  if (input.isProfessional) return "professional";
  if (input.isFoundingMember) return "founding_member";
  return input.ladderTier;
};

export const hasCapability = (input: EntitlementInput, feature: FeatureKey): boolean => {
  if (input.isProfessional && PROFESSIONAL_ONLY_CAPABILITIES.includes(feature)) return true;
  return LADDER_CAPABILITIES[input.ladderTier]?.includes(feature) ?? false;
};

/** Lowest ladder tier that unlocks a feature — for building "Upgrade to X" copy. */
export const minimumTierFor = (feature: FeatureKey): LadderTier | null => {
  for (const tier of LADDER_ORDER) {
    if (LADDER_CAPABILITIES[tier]?.includes(feature)) return tier;
  }
  return null;
};

/**
 * Raw `profiles.subscription_status` values that count as "a paying
 * customer, on any tier" — used for revenue-facing checks (did this checkout
 * succeed? how many paying accounts exist?), not for content access.
 *
 * This is deliberately broader than the database's `is_member()` function
 * and useMembership()'s `isMember` flag, both of which mean "Insider tier or
 * above" for gating the content perks that predate Glow Lite. Glow Lite is a
 * real paying tier with its own narrower benefit set, so it belongs here
 * (checkout/billing) but not in those two "Insider+" checks. Keep this list
 * in sync with the status literals actually written by
 * supabase/functions/payfast-payment or paypal-payment.
 */
export const PAID_SUBSCRIPTION_STATUSES = ["active", "glow_lite", "insider", "vip", "premium"] as const;

export const isPaidSubscriptionStatus = (status: string | null | undefined): boolean =>
  (PAID_SUBSCRIPTION_STATUSES as readonly string[]).includes((status ?? "").toLowerCase());

/**
 * Capabilities a visitor can actually buy today: the union of what each
 * PURCHASABLE ladder tier unlocks (pricing_plans.is_purchasable), so an upsell
 * never advertises a perk that only a "Coming soon" tier (VIP, today) has.
 * `cheapestTier` is the lowest purchasable tier that includes it.
 */
export const purchasableCapabilities = (
  purchasablePlanIds: readonly string[],
): { feature: FeatureKey; cheapestTier: LadderTier }[] => {
  const tiers = LADDER_ORDER.filter((t) => t !== "anonymous" && t !== "free" && purchasablePlanIds.includes(t));
  const out = new Map<FeatureKey, LadderTier>();
  for (const tier of tiers) {
    for (const feature of LADDER_CAPABILITIES[tier]) {
      if (feature === "ai_analysis.starter") continue; // free for everyone
      if (!out.has(feature)) out.set(feature, tier);
    }
  }
  return Array.from(out, ([feature, cheapestTier]) => ({ feature, cheapestTier }));
};
