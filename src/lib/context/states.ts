import type { ContextFacts, ContextState } from "./types";

const DAY_MS = 86_400_000;

/** Whole days between an ISO timestamp and `now`; null when the timestamp is missing/invalid. */
export const daysSince = (iso: string | null, now: string): number | null => {
  if (!iso) return null;
  const then = Date.parse(iso);
  const at = Date.parse(now);
  if (Number.isNaN(then) || Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((at - then) / DAY_MS));
};

/** Thresholds live here so a rule and its test can't drift apart. */
export const CONTEXT_THRESHOLDS = {
  /** No server-visible activity for this many days → INACTIVE_USER. */
  inactiveDays: 14,
  /** Active within this many days (and engaging with content) → ACTIVE_EXPLORER. */
  activeDays: 7,
  contentReaderReads: 3,
  productResearcherViews: 3,
} as const;

/** Insider / VIP hold the Active Ingredient Conflict Matcher (entitlements.ts: routine.conflict_matcher). */
const hasConflictMatcher = (f: ContextFacts) => f.tier === "insider" || f.tier === "vip";

export const hasRoutine = (f: ContextFacts): boolean => f.journey.routineSteps >= 1 || f.smartRoutineSaved;

/**
 * Derives every contextual state that currently holds. Pure; the same facts
 * always give the same set. A member is usually in several at once (e.g.
 * INSIDER_MEMBER + BASIC_ANALYSIS_COMPLETED + ROUTINE_AVAILABLE).
 */
export const deriveContextStates = (f: ContextFacts): ReadonlySet<ContextState> => {
  const s = new Set<ContextState>();
  const j = f.journey;

  if (!j.signedIn) {
    s.add("VISITOR");
    // A finished-but-unsaved analysis is still real progress for CTA purposes.
    if (j.hasLocalAnalysis) s.add("BASIC_ANALYSIS_COMPLETED");
    else s.add("BASIC_ANALYSIS_NOT_STARTED");
    return s;
  }

  // Membership (exactly one).
  if (f.tier === "vip") s.add("VIP_MEMBER");
  else if (f.tier === "insider") s.add("INSIDER_MEMBER");
  else if (f.tier === "glow_lite") s.add("LITE_MEMBER");
  else s.add("FREE_MEMBER");
  if (j.isTrialing) s.add("TRIALING");
  if (!j.isTrialing && !j.isPaid && j.trialUsed) s.add("LAPSED");

  if (!f.onboardingCompleted) s.add("ONBOARDING");
  if (!f.profileComplete) s.add("PROFILE_INCOMPLETE");

  // SKYNN Basic.
  if (j.savedAnalyses >= 1) s.add("BASIC_ANALYSIS_COMPLETED");
  else s.add("BASIC_ANALYSIS_NOT_STARTED");

  // SKYNN Advanced.
  if (f.advancedStatus === "pending") s.add("ADVANCED_ANALYSIS_PENDING");
  else if (f.advancedStatus === "ready") s.add("ADVANCED_ANALYSIS_COMPLETED");
  else if (f.advancedOpen) s.add("ADVANCED_ANALYSIS_AVAILABLE");

  // Routine.
  if (f.smartRoutineAccess) s.add("ROUTINE_AVAILABLE");
  if (!hasRoutine(f)) s.add("ROUTINE_NOT_CREATED");
  else if (f.routineReviewDue) s.add("ROUTINE_REVIEW_DUE");
  if (hasRoutine(f) && hasConflictMatcher(f)) s.add("CONFLICT_CHECK_AVAILABLE");

  // Engagement.
  const quiet = daysSince(f.lastActiveAt, f.now);
  const engaged = j.contentReads + j.savedItems;
  if (j.contentReads >= CONTEXT_THRESHOLDS.contentReaderReads || j.savedItems >= CONTEXT_THRESHOLDS.contentReaderReads) {
    s.add("CONTENT_READER");
  }
  if (f.recentReviewViews >= CONTEXT_THRESHOLDS.productResearcherViews) s.add("PRODUCT_RESEARCHER");
  if (quiet !== null && quiet >= CONTEXT_THRESHOLDS.inactiveDays) s.add("INACTIVE_USER");
  if (engaged >= 1 && quiet !== null && quiet <= CONTEXT_THRESHOLDS.activeDays && (s.has("CONTENT_READER") || s.has("PRODUCT_RESEARCHER") || j.routineCheckins >= 1)) {
    s.add("ACTIVE_EXPLORER");
  }

  // Brand new: nothing done yet. Returning: has history and isn't brand new.
  const nothingYet = j.savedAnalyses === 0 && !hasRoutine(f) && j.contentReads === 0 && j.savedItems === 0 && j.routineCheckins === 0;
  if (nothingYet) s.add("NEW_USER");
  else s.add("RETURNING_USER");

  return s;
};

/** The single label the journey stage reads as, for analytics (`journey_state_changed`). Highest-signal state first. */
export const headlineState = (states: ReadonlySet<ContextState>): ContextState => {
  const order: ContextState[] = [
    "VISITOR",
    "ONBOARDING",
    "NEW_USER",
    "ADVANCED_ANALYSIS_PENDING",
    "ADVANCED_ANALYSIS_COMPLETED",
    "ROUTINE_REVIEW_DUE",
    "INACTIVE_USER",
    "ACTIVE_EXPLORER",
    "RETURNING_USER",
  ];
  return order.find((st) => states.has(st)) ?? "RETURNING_USER";
};
