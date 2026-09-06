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
  | "dashboard.professional_tools";

const LADDER_ORDER: LadderTier[] = ["anonymous", "free", "glow_lite", "insider", "vip"];

/** What each ladder tier unlocks, cumulative by design — keep additive as tiers go up. */
const LADDER_CAPABILITIES: Record<LadderTier, FeatureKey[]> = {
  anonymous: ["ai_analysis.starter"],
  free: ["ai_analysis.starter"],
  // Provisional — see file header. Not resolvable from real data yet.
  glow_lite: ["ai_analysis.starter", "comparisons.unlimited", "spotlight.full_profiles"],
  insider: [
    "ai_analysis.starter",
    "ai_analysis.live_weekly",
    "podcast.full_library",
    "reviews.full_body",
    "comparisons.unlimited",
    "spotlight.full_profiles",
    "practitioner_directory",
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
  ],
};

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
 * Raw `profiles.subscription_status` values that count as "paying" today.
 * Mirrors the backend's own source of truth, the `is_member()` Postgres
 * function (see supabase/migrations/20260816154034_*.sql) — keep the two in
 * sync. Use this instead of re-typing the literal list at each call site
 * (three call sites had drifted before this file existed: use-membership.ts,
 * UserDashboard.tsx's payment-activation poll, and AdminDashboard.tsx's
 * member count).
 */
export const PAID_SUBSCRIPTION_STATUSES = ["active", "insider", "vip", "premium"] as const;

export const isPaidSubscriptionStatus = (status: string | null | undefined): boolean =>
  (PAID_SUBSCRIPTION_STATUSES as readonly string[]).includes((status ?? "").toLowerCase());
