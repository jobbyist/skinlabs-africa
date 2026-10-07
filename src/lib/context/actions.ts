/**
 * The action catalogue and the resolver that picks the primary and secondary
 * action for a surface. Deterministic and explainable (no model involved):
 *
 *   facts -> states -> eligible actions -> drop completed -> drop fatigued ->
 *   score -> primary + up to N secondary (one per feature, no shared destination)
 *
 * To add an action: add one entry to ACTIONS, decide its surfaces, give it a
 * `completed` rule if doing it once is enough, and add a test row. Don't
 * hand-roll "should I show this CTA?" logic in a component.
 */
import { isFatigued, type CtaLedger, type FatigueRule } from "./ledger";
import { daysSince, hasRoutine } from "./states";
import { deriveContextStates } from "./states";
import type {
  ActionFeature,
  ActionKind,
  ContextFacts,
  ContextResolution,
  ContextState,
  ResolvedAction,
  SuppressionReason,
  Surface,
} from "./types";

type Built = { label: string; reason: string; kind?: ActionKind; href?: string };

interface ActionDef {
  id: string;
  feature: ActionFeature;
  surfaces: Surface[];
  /** Copy that differs by surface (e.g. the homepage hero keeps its own wording). */
  surfaceLabels?: Partial<Record<Surface, string>>;
  /** Base rank, 0-100. Higher wins. */
  priority: number;
  fatigue?: FatigueRule;
  /** Clicking it counts as doing it (discovery actions): the ledger then marks it completed. */
  completeOnClick?: boolean;
  eligible: (f: ContextFacts, s: ReadonlySet<ContextState>) => boolean;
  /** Has the member already done what this asks? Then it is replaced, not repeated. */
  completed?: (f: ContextFacts, s: ReadonlySet<ContextState>) => boolean;
  build: (f: ContextFacts, s: ReadonlySet<ContextState>) => Built;
}

const SKYNN = "/skynn-ai";
const ADVANCED = "/skynn-ai/advanced";
const ROUTINE = "/dashboard?tab=routine";
const MY_SKIN = "/dashboard?tab=analysis";

const ALL_JOURNEY: Surface[] = ["dashboard", "home_hero", "analysis_results", "welcome"];
const FOLLOW_UPS: Surface[] = ["dashboard", "home_hero", "analysis_results", "empty_state", "welcome"];

const SEASON_LABEL = { summer: "summer", autumn: "autumn", winter: "winter", spring: "spring" } as const;

const analysisAgeDays = (f: ContextFacts) => daysSince(f.lastAnalysisAt, f.now);

/** Weeks, phrased for a reason line. */
const weeksAgo = (days: number) => (days < 14 ? "a couple of weeks" : `${Math.round(days / 7)} weeks`);

export const ACTIONS: ActionDef[] = [
  // ---- Getting to a first skin profile -----------------------------------------------------
  {
    id: "save_analysis",
    feature: "skynn_basic",
    surfaces: ALL_JOURNEY,
    priority: 100,
    fatigue: { essential: true },
    eligible: (f) => !f.journey.signedIn && f.journey.hasLocalAnalysis,
    build: () => ({ label: "Save your results, free", reason: "Your analysis is finished. An account keeps it.", kind: "signup" }),
  },
  {
    id: "resume_basic",
    feature: "skynn_basic",
    surfaces: ALL_JOURNEY,
    surfaceLabels: { home_hero: "Finish your free skin analysis" },
    priority: 95,
    fatigue: { essential: true },
    eligible: (f) => f.analysisDraft && f.journey.savedAnalyses === 0 && !f.journey.hasLocalAnalysis,
    build: () => ({ label: "Finish your skin analysis", reason: "You've already started. It takes about two minutes.", href: SKYNN }),
  },
  {
    id: "start_basic",
    feature: "skynn_basic",
    surfaces: ALL_JOURNEY,
    surfaceLabels: { home_hero: "Get Your Free Basic AI Skin Report" },
    priority: 90,
    fatigue: { essential: true },
    eligible: (f) => f.journey.savedAnalyses === 0 && !f.journey.hasLocalAnalysis,
    completed: (f) => f.journey.savedAnalyses >= 1 || f.journey.hasLocalAnalysis,
    build: () => ({
      label: "Take the 2-minute Basic AI Skin Analysis",
      reason: "Everything else in SkinLabs gets more useful once it knows your skin.",
      href: SKYNN,
    }),
  },

  // ---- Advanced AI Dermatology Analysis lifecycle ------------------------------------------
  {
    id: "advanced_review",
    feature: "skynn_advanced",
    surfaces: ["dashboard", "home_hero", "analysis_results"],
    priority: 92,
    fatigue: { essential: true },
    completeOnClick: true,
    eligible: (f) => f.advancedStatus === "ready",
    completed: (f) => f.advancedResultViewed,
    build: () => ({ label: "Review my skin intelligence", reason: "Your Advanced AI Dermatology Analysis has been released.", href: ADVANCED }),
  },
  {
    id: "advanced_status",
    feature: "skynn_advanced",
    surfaces: ["dashboard", "home_hero", "analysis_results"],
    priority: 85,
    fatigue: { maxDays: 3, windowDays: 14, dismissCooldownDays: 7 },
    eligible: (f) => f.advancedStatus === "pending",
    build: () => ({
      label: "View analysis status",
      reason: "Your Advanced AI Dermatology Analysis is with our team. Nothing more to do for now.",
      href: MY_SKIN,
    }),
  },
  {
    id: "advanced_start",
    feature: "skynn_advanced",
    surfaces: ["dashboard", "home_hero", "analysis_results"],
    priority: 62,
    fatigue: { maxDays: 4, windowDays: 21, dismissCooldownDays: 21 },
    eligible: (f) =>
      f.journey.savedAnalyses >= 1 && f.advancedOpen && f.advancedStatus === "none" && f.analysisPasses > 0,
    build: (f) => ({
      label: "Start your Advanced AI Dermatology Analysis",
      reason: `You have ${f.analysisPasses} Analysis Pass${f.analysisPasses === 1 ? "" : "es"} ready, and your Basic answers carry over.`,
      href: ADVANCED,
    }),
  },
  {
    id: "advanced_get_pass",
    feature: "skynn_advanced",
    surfaces: ["analysis_results", "dashboard"],
    priority: 30,
    fatigue: { maxDays: 2, windowDays: 21, dismissCooldownDays: 30 },
    eligible: (f) =>
      f.journey.savedAnalyses >= 1 && f.advancedOpen && f.advancedStatus === "none" && f.analysisPasses === 0,
    build: () => ({
      label: "Get an Analysis Pass",
      reason: "For a deeper, reviewed look at your skin. Membership never replaces a Pass.",
      kind: "purchase_pass",
      href: ADVANCED,
    }),
  },

  // ---- Routine ------------------------------------------------------------------------------
  {
    id: "build_routine",
    feature: "routine",
    surfaces: [...FOLLOW_UPS, "routine", "content_end"],
    priority: 88,
    fatigue: { essential: true },
    eligible: (f) => f.journey.signedIn && f.smartRoutineAccess && !hasRoutine(f),
    completed: (f) => hasRoutine(f),
    build: () => ({
      label: "Build my routine",
      reason: "Your skin profile is ready. Build a routine around it.",
      href: ROUTINE,
    }),
  },
  {
    id: "update_routine",
    feature: "routine",
    surfaces: [...FOLLOW_UPS, "routine", "content_end"],
    priority: 78,
    fatigue: { maxDays: 5, windowDays: 14, dismissCooldownDays: 7 },
    eligible: (f) => hasRoutine(f) && f.routineReviewDue,
    build: (f) => ({
      label: f.advancedStatus === "ready" ? "Update my routine from my results" : "Update my routine",
      reason: f.advancedStatus === "ready" ? "Your Advanced results can refine it." : "Based on your latest analysis, your routine can be refreshed.",
      href: ROUTINE,
    }),
  },
  {
    id: "check_in",
    feature: "routine",
    surfaces: ["dashboard", "home_hero", "routine"],
    priority: 72,
    fatigue: { essential: true },
    eligible: (f) => hasRoutine(f) && f.journey.routineSteps >= 1,
    completed: (f) => f.checkedInToday,
    build: (f) => ({
      label: "Check in on today's routine",
      reason: f.journey.routineCheckins > 0 ? "Consistency is what makes a routine work." : "Tick off today's steps. It takes seconds.",
      href: ROUTINE,
    }),
  },

  // ---- Membership (only where it genuinely applies) ----------------------------------------
  // Trial-ending / lapsed messaging ("Keep my membership") is owned by the dashboard's trial
  // banner (src/lib/trialLifecycle.ts), which knows the card state and first-charge date; it is
  // deliberately not duplicated here as a second competing CTA.
  {
    id: "start_trial",
    feature: "membership",
    surfaces: ["dashboard"],
    priority: 56,
    fatigue: { maxDays: 3, windowDays: 14, dismissCooldownDays: 14 },
    // Only a genuinely free account that has already got value from the free tier.
    eligible: (f) =>
      f.journey.signedIn && f.tier === "free" && !f.journey.trialUsed && !f.journey.isTrialing && f.journey.savedAnalyses >= 1,
    build: () => ({ label: "Start your free trial", reason: "Full access, no card needed.", kind: "start_trial" }),
  },
  {
    id: "routine_builder_pitch",
    feature: "routine",
    // A capability boundary, not a dashboard card: only where the Routine Builder is the subject.
    surfaces: ["routine", "empty_state"],
    priority: 40,
    fatigue: { maxDays: 3, windowDays: 14, dismissCooldownDays: 14 },
    eligible: (f) => f.journey.signedIn && (f.tier === "free" || f.tier === "glow_lite"),
    build: (f) =>
      f.tier === "glow_lite"
        ? { label: "Go deeper with the Intelligent Routine Builder", reason: "Included with Glow Insider.", href: `/pricing?returnTo=${encodeURIComponent(ROUTINE)}` }
        : !f.journey.trialUsed && !f.journey.isTrialing
          ? { label: "Unlock the Intelligent Routine Builder", reason: "Try it free, no card needed.", kind: "start_trial" }
          : { label: "Unlock the Intelligent Routine Builder", reason: "Included with Glow Insider.", href: `/pricing?returnTo=${encodeURIComponent(ROUTINE)}` },
  },

  // ---- Re-assessment -------------------------------------------------------------------------
  {
    id: "reanalyse",
    feature: "skynn_basic",
    surfaces: ["dashboard", "home_hero"],
    priority: 58,
    fatigue: { maxDays: 3, windowDays: 21, dismissCooldownDays: 21, clickCooldownDays: 14 },
    eligible: (f) => f.journey.savedAnalyses >= 1 && f.analysisAvailableNow === true && (analysisAgeDays(f) ?? 0) >= 28,
    build: (f) => ({
      label: "Re-check my skin",
      reason: `It's been ${weeksAgo(analysisAgeDays(f) ?? 28)} since your last analysis. Skin changes with the seasons.`,
      href: SKYNN,
    }),
  },

  // ---- Feature discovery (shown once it is relevant, never before) --------------------------
  {
    id: "ingredient_checker",
    feature: "ingredients",
    surfaces: ["dashboard", "routine", "content_end"],
    priority: 50,
    completeOnClick: true,
    fatigue: { maxDays: 3, windowDays: 21, dismissCooldownDays: 30 },
    eligible: (f, s) => hasRoutine(f) && !s.has("CONFLICT_CHECK_AVAILABLE"),
    build: () => ({
      label: "Check my ingredient combinations",
      reason: "Based on your routine, see which actives work together and which to space out.",
      href: "/ingredients/checker",
    }),
  },
  {
    id: "conflict_matcher",
    feature: "ingredients",
    surfaces: ["dashboard", "routine", "content_end"],
    priority: 52,
    completeOnClick: true,
    fatigue: { maxDays: 3, windowDays: 21, dismissCooldownDays: 30 },
    eligible: (_f, s) => s.has("CONFLICT_CHECK_AVAILABLE"),
    build: () => ({
      label: "Run the Conflict Matcher on my routine",
      reason: "It checks the products in your routine against each other.",
      href: MY_SKIN,
    }),
  },
  {
    id: "compare_products",
    feature: "discovery",
    surfaces: ["dashboard", "content_end"],
    priority: 44,
    completeOnClick: true,
    fatigue: { maxDays: 3, windowDays: 21, dismissCooldownDays: 30 },
    eligible: (_f, s) => s.has("PRODUCT_RESEARCHER"),
    build: () => ({ label: "Compare products side by side", reason: "You've been reading reviews. A Shelf Showdown puts two head to head.", href: "/compare" }),
  },
  {
    id: "seasonal_guide",
    feature: "discovery",
    surfaces: ["dashboard"],
    priority: 28,
    completeOnClick: true,
    fatigue: { maxDays: 2, windowDays: 30, dismissCooldownDays: 60 },
    eligible: (f) => f.journey.savedAnalyses >= 1 && hasRoutine(f),
    build: (f) => ({ label: `Adjust for ${SEASON_LABEL[f.season]}`, reason: `A ${SEASON_LABEL[f.season]} guide for South African skin.`, href: "/seasonals" }),
  },

  // ---- Content: pick up where you left off ---------------------------------------------------
  {
    id: "continue_podcast",
    feature: "content",
    // Not on content_end: the member is looking at the content, so "continue" would point at itself.
    surfaces: ["dashboard", "home_hero"],
    priority: 46,
    fatigue: { essential: true },
    eligible: (f) => Boolean(f.podcastInProgress),
    build: (f) => ({ label: "Continue listening", reason: f.podcastInProgress?.title ?? "", href: `/podcast/${f.podcastInProgress?.slug}` }),
  },
  {
    id: "continue_reading",
    feature: "content",
    surfaces: ["dashboard", "home_hero"],
    surfaceLabels: { home_hero: "Continue reading today's briefing" },
    priority: 47,
    fatigue: { essential: true },
    eligible: (f) => Boolean(f.startedBriefing),
    build: (f) => ({ label: "Continue reading", reason: f.startedBriefing?.title ?? "", href: `/briefings/${f.startedBriefing?.slug}` }),
  },
  {
    id: "read_briefing",
    feature: "content",
    surfaces: ["dashboard", "home_hero"],
    priority: 42,
    eligible: (f) => Boolean(f.unreadBriefing) && !f.startedBriefing,
    build: (f) => ({
      label: f.unreadBriefing?.isToday ? "Read today's briefing" : "Read the latest briefing",
      reason: f.unreadBriefing?.title ?? "",
      href: `/briefings/${f.unreadBriefing?.slug}`,
    }),
  },
  {
    id: "listen_latest",
    feature: "content",
    surfaces: ["home_hero"],
    priority: 40,
    eligible: (f) => Boolean(f.latestEpisode) && !f.podcastInProgress,
    build: (f) => ({ label: "Listen to the latest episode", reason: f.latestEpisode?.title ?? "", href: `/podcast/${f.latestEpisode?.slug}` }),
  },
];

export interface ResolveOptions {
  surface: Surface;
  ledger?: CtaLedger;
  /** Secondary actions to return (default 2). */
  secondaryLimit?: number;
}

const toResolved = (def: ActionDef, f: ContextFacts, s: ReadonlySet<ContextState>, surface: Surface): ResolvedAction => {
  const b = def.build(f, s);
  return {
    id: def.id,
    label: def.surfaceLabels?.[surface] ?? b.label,
    reason: b.reason,
    kind: b.kind ?? "link",
    href: b.href,
    feature: def.feature,
    analyticsEvent: def.id,
  };
};

/** Resolve the actions for one surface. Pure: same facts + ledger + surface give the same answer. */
export const resolveContext = (f: ContextFacts, opts: ResolveOptions): ContextResolution => {
  const states = deriveContextStates(f);
  const ledger = opts.ledger ?? {};
  const suppressed: { id: string; reason: SuppressionReason }[] = [];
  const candidates: { def: ActionDef; score: number }[] = [];

  for (const def of ACTIONS) {
    if (!def.surfaces.includes(opts.surface)) continue;
    const entry = ledger[def.id];
    const done = (def.completed?.(f, states) ?? false) || (def.completeOnClick === true && Boolean(entry?.completedAt));
    if (done) {
      suppressed.push({ id: def.id, reason: "completed" });
      continue;
    }
    if (!def.eligible(f, states)) continue;
    const tired = isFatigued(entry, def.fatigue, f.now);
    if (tired) {
      suppressed.push({ id: def.id, reason: tired });
      continue;
    }
    candidates.push({ def, score: def.priority });
  }

  candidates.sort((a, b) => b.score - a.score || a.def.id.localeCompare(b.def.id));

  const resolved = candidates.map((c) => toResolved(c.def, f, states, opts.surface));
  const primary = resolved[0] ?? null;
  const secondary: ResolvedAction[] = [];
  const limit = opts.secondaryLimit ?? 2;
  for (const r of resolved.slice(1)) {
    if (secondary.length >= limit) break;
    // One per feature, and never a second route to a destination already offered.
    const clash = [primary, ...secondary].some((x) => x && (x.feature === r.feature || (x.href && r.href && x.href === r.href)));
    if (clash) {
      suppressed.push({ id: r.id, reason: "already_primary" });
      continue;
    }
    secondary.push(r);
  }

  return { states, primary, secondary, suppressed };
};
