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
 * "glow_lite" is defined here for forward-compatibility with the pricing
 * recommendations in the SkinLabs growth-architecture audit (Sept 2026), but
 * has no live purchase path yet — useMembership() cannot currently resolve
 * it from `profiles.subscription_status`, so it will never appear from real
 * user data until that tier ships. Its capability set below is provisional
 * and should be confirmed by product before it's sold. The same caveat
 * applies to founding-member checkout and the professional/B2B tier: the
 * `founding_member` and `is_professional` profile columns exist (see
 * supabase/migrations/20260906180000_entitlement_foundations.sql) but no
 * live flow sets them to true yet.
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
    "podcast.full_library",
    "reviews.full_body",
    "comparisons.unlimited",
    "spotlight.full_profiles",
    "practitioner_directory",
    "routine.conflict_matcher",
    "assessment.advanced",
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
    "assessment.advanced",
  ],
};

/**
 * "assessment.advanced" (the SKYNN AI Advanced Dermatology Assessment
 * engine) is documented here for the same reason every other capability is —
 * a single source of truth for "what does Insider/VIP unlock" — but unlike
 * a pure ladder feature, Glow Explorer/Lite can ALSO reach it by spending an
 * Analysis Pass (the same pattern as the existing Advanced AI Dermatology
 * Report upsell, see AdvancedAssessmentCard.tsx). hasCapability()/can()
 * alone therefore under-reports real access for pass-holders — the
 * authoritative check is always the server-side
 * get_advanced_assessment_access() RPC (via useAdvancedAssessmentAccess()),
 * which combines both paths. Use this ladder entry only for "what tier
 * would unlock it for free" copy, never as the sole gate.
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
 * supabase/functions/paystack-payment.
 */
export const PAID_SUBSCRIPTION_STATUSES = ["active", "glow_lite", "insider", "vip", "premium"] as const;

export const isPaidSubscriptionStatus = (status: string | null | undefined): boolean =>
  (PAID_SUBSCRIPTION_STATUSES as readonly string[]).includes((status ?? "").toLowerCase());
