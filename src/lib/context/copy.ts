import { daysSince, deriveContextStates, headlineState } from "./states";
import type { ContextFacts, ResolvedAction } from "./types";

/** SAST hour (0-23) for an ISO instant. */
const sastHour = (iso: string) => new Date(Date.parse(iso) + 2 * 3_600_000).getUTCHours();

const timeOfDay = (iso: string) => {
  const h = sastHour(iso);
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export interface Greeting {
  title: string;
  /** One calm line telling the member where they are. */
  body: string;
}

/** The dashboard greeting. Copy states facts about the member's own account, never "we noticed you…". */
export const contextualGreeting = (f: ContextFacts, firstName: string | null): Greeting => {
  const s = deriveContextStates(f);
  const name = firstName ? `, ${firstName}` : "";
  const state = headlineState(s);
  switch (state) {
    case "ONBOARDING":
    case "NEW_USER":
      return { title: `Welcome${name}`, body: "Start with a two-minute skin analysis. Everything else builds on it." };
    case "ADVANCED_ANALYSIS_PENDING":
      return { title: `${timeOfDay(f.now)}${name}`, body: "Your Advanced AI Dermatology Analysis is with our team." };
    case "ADVANCED_ANALYSIS_COMPLETED":
      return { title: `${timeOfDay(f.now)}${name}`, body: "Your Advanced results are in. Here's what to do with them." };
    case "ROUTINE_REVIEW_DUE":
      return { title: `${timeOfDay(f.now)}${name}`, body: "Your skin profile has moved on. Your routine can too." };
    case "INACTIVE_USER": {
      const days = daysSince(f.lastActiveAt, f.now);
      return { title: `Welcome back${name}`, body: days ? `It's been ${days} days. Here's where you left off.` : "Here's where you left off." };
    }
    default:
      return { title: `${timeOfDay(f.now)}${name}`, body: "Your skin profile, routine and what to do next." };
  }
};

export type EmptyStateKind = "routine" | "saved_products" | "saved_content" | "journey" | "analysis";

export interface EmptyStateCopy {
  title: string;
  body: string;
  action: ResolvedAction | null;
}

const link = (id: string, label: string, href: string, reason: string, feature: ResolvedAction["feature"]): ResolvedAction => ({
  id,
  label,
  href,
  reason,
  kind: "link",
  feature,
  analyticsEvent: id,
});

/**
 * Empty states point at the logical next step for THIS member rather than
 * repeating navigation ("No routines yet."). Actions are the same ids the
 * action catalogue uses, so analytics line up.
 */
export const emptyStateCopy = (kind: EmptyStateKind, f: ContextFacts): EmptyStateCopy => {
  const hasProfile = f.journey.savedAnalyses >= 1 || f.journey.hasLocalAnalysis;
  switch (kind) {
    case "routine": {
      if (!hasProfile) {
        return {
          title: "A routine starts with your skin profile",
          body: "Take the two-minute analysis and your routine is built around the result.",
          action: link("start_basic", "Take the Basic AI Skin Analysis", "/skynn-ai", "Your routine is built from it.", "skynn_basic"),
        };
      }
      return {
        title: "Your skin profile is ready. Build a routine around it.",
        body: "We'll lay out your mornings and evenings from your analysis. You can change any step.",
        action: link("build_routine", "Build my routine", "/dashboard?tab=routine", "Your skin profile is ready.", "routine"),
      };
    }
    case "saved_products":
      return {
        title: "Start building your shelf from products you've researched",
        body: "Save a product from a review and it appears here, ready to compare.",
        action: link("explore_reviews", "Explore reviews", "/reviews", "Saved products live here.", "content"),
      };
    case "saved_content":
      return {
        title: "Nothing saved yet",
        body: "Save a briefing to read later and it will wait for you here.",
        action: link("explore_briefings", "Read today's briefing", "/briefings", "Saved briefings live here.", "content"),
      };
    case "journey":
      return hasProfile
        ? {
            title: "Your journey builds as you check in",
            body: "Log a few routine check-ins and photos and your progress shows up here.",
            action: link("check_in", "Check in on today's routine", "/dashboard?tab=routine", "Progress comes from check-ins.", "routine"),
          }
        : {
            title: "Your journey begins with a skin analysis",
            body: "Once SKYNN AI knows your skin, progress has something to be measured against.",
            action: link("start_basic", "Take the Basic AI Skin Analysis", "/skynn-ai", "It takes about two minutes.", "skynn_basic"),
          };
    case "analysis":
      return {
        title: "No analysis yet",
        body: "The Basic AI Skin Analysis is free and takes about two minutes.",
        action: link("start_basic", "Take the Basic AI Skin Analysis", "/skynn-ai", "Free, no card needed.", "skynn_basic"),
      };
  }
};
