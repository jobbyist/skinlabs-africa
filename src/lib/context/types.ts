/**
 * The contextual model (see docs/contextual-ux.md). ONE plain-data snapshot of
 * what SkinLabs knows about the viewer (`ContextFacts`), from which pure
 * functions derive states, the next best action and navigation emphasis.
 * Nothing in src/lib/context touches React, Supabase or the browser, so every
 * rule is unit tested. Presentation only, never authorization: entitlements.ts
 * and the server stay the real gates.
 */
import type { LadderTier } from "@/lib/entitlements";
import type { JourneyFacts } from "@/lib/journey";

/** Lifecycle of the member's Advanced AI Dermatology Analysis submissions. */
export type AdvancedStatus =
  /** Nothing submitted (or every submission was refunded / not released). */
  | "none"
  /** Submitted, not yet released (pending intake, being prepared, in review). */
  | "pending"
  /** A released result exists. */
  | "ready";

export type Season = "summer" | "autumn" | "winter" | "spring";

export interface ContextFacts {
  /** Everything the journey model already knows (analysis counts, routine, trial, checklist facts…). */
  journey: JourneyFacts;
  /** Ladder tier for entitlement copy ("anonymous" when signed out). */
  tier: LadderTier;
  /** Whole SAST days left on a live trial, else null. */
  trialDaysLeft: number | null;
  /** Narrow is_profile_complete() gate (username, name, date of birth, skin type) — not "profile strength". */
  profileComplete: boolean;
  /** profiles.onboarding_completed_at is set. */
  onboardingCompleted: boolean;
  /** An unfinished Basic analysis draft exists in this browser. */
  analysisDraft: boolean;
  /** ISO timestamp of the newest delivered Basic analysis. */
  lastAnalysisAt: string | null;
  /** The member may save another Basic analysis right now (rolling-window allowance). null = unknown. */
  analysisAvailableNow: boolean | null;
  advancedStatus: AdvancedStatus;
  /** The member opened their released Advanced result at least once (local, per account). */
  advancedResultViewed: boolean;
  /** Analysis Passes the member holds (spent only by the Advanced analysis). */
  analysisPasses: number;
  /** The Advanced flow is open to pass holders (rollout_stage / report_mode not "disabled"). */
  advancedOpen: boolean;
  /** has_smart_routine_access(): a saved Basic analysis or a non-rejected Advanced submission. */
  smartRoutineAccess: boolean;
  smartRoutineSaved: boolean;
  /** A newer analysis/report exists since the Smart Routine was built (or the routine is old). */
  routineReviewDue: boolean;
  /** The member ticked at least one routine step today (SAST). */
  checkedInToday: boolean;
  /** ISO timestamp of the newest activity we can see server-side (check-in, analysis, content read). */
  lastActiveAt: string | null;
  /** Reviews opened in the last 14 days (local, counts only). */
  recentReviewViews: number;
  /** The latest briefing, if the member hasn't opened it yet. */
  unreadBriefing: { slug: string; title: string; isToday: boolean } | null;
  /** A briefing started today, to continue. */
  startedBriefing: { slug: string; title: string; isToday: boolean } | null;
  /** An episode started but not finished. */
  podcastInProgress: { slug: string; title: string } | null;
  /** The newest published episode, for "listen" when nothing is in progress. */
  latestEpisode: { slug: string; title: string } | null;
  season: Season;
  /** "now" as ISO, injected so rules are deterministic in tests. */
  now: string;
}

export const EMPTY_CONTEXT_FACTS = (journey: JourneyFacts, now = new Date().toISOString()): ContextFacts => ({
  journey,
  tier: "anonymous",
  trialDaysLeft: null,
  profileComplete: false,
  onboardingCompleted: false,
  analysisDraft: false,
  lastAnalysisAt: null,
  analysisAvailableNow: null,
  advancedStatus: "none",
  advancedResultViewed: false,
  analysisPasses: 0,
  advancedOpen: false,
  smartRoutineAccess: false,
  smartRoutineSaved: false,
  routineReviewDue: false,
  checkedInToday: false,
  lastActiveAt: null,
  recentReviewViews: 0,
  unreadBriefing: null,
  startedBriefing: null,
  podcastInProgress: null,
  latestEpisode: null,
  season: "summer",
  now,
});

/** Derived, never persisted. A member holds several at once. */
export type ContextState =
  | "VISITOR"
  | "NEW_USER"
  | "ONBOARDING"
  | "PROFILE_INCOMPLETE"
  | "BASIC_ANALYSIS_NOT_STARTED"
  | "BASIC_ANALYSIS_COMPLETED"
  | "ADVANCED_ANALYSIS_AVAILABLE"
  | "ADVANCED_ANALYSIS_PENDING"
  | "ADVANCED_ANALYSIS_COMPLETED"
  | "ROUTINE_AVAILABLE"
  | "ROUTINE_NOT_CREATED"
  | "ROUTINE_REVIEW_DUE"
  | "CONFLICT_CHECK_AVAILABLE"
  | "ACTIVE_EXPLORER"
  | "CONTENT_READER"
  | "PRODUCT_RESEARCHER"
  | "RETURNING_USER"
  | "INACTIVE_USER"
  | "FREE_MEMBER"
  | "LITE_MEMBER"
  | "INSIDER_MEMBER"
  | "VIP_MEMBER"
  | "TRIALING"
  | "LAPSED";

/** Where an action is being chosen for. Each action declares the surfaces it may appear on. */
export type Surface =
  | "dashboard"
  | "home_hero"
  | "analysis_results"
  | "routine"
  | "content_end"
  | "empty_state"
  | "welcome";

export type ActionKind =
  | "link"
  | "signup"
  | "start_trial"
  | "keep_membership"
  | "purchase_pass";

export interface ResolvedAction {
  id: string;
  label: string;
  /** One short line saying why this is being suggested ("Based on your routine…"). */
  reason: string;
  kind: ActionKind;
  href?: string;
  feature: ActionFeature;
  /** Analytics tag, passed to trackContextEvent. */
  analyticsEvent: string;
}

export type ActionFeature =
  | "skynn_basic"
  | "skynn_advanced"
  | "routine"
  | "ingredients"
  | "content"
  | "membership"
  | "profile"
  | "discovery";

export type SuppressionReason =
  | "completed"
  | "ineligible"
  | "surface"
  | "fatigued"
  | "dismissed"
  | "already_primary";

export interface ContextResolution {
  states: ReadonlySet<ContextState>;
  primary: ResolvedAction | null;
  secondary: ResolvedAction[];
  /** Why actions were left out — explainability and the cta_suppressed event. */
  suppressed: { id: string; reason: SuppressionReason }[];
}
