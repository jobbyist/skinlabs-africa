/**
 * The member journey (onboarding overhaul 08): one pure model of where an
 * account is in the free → trial → paid funnel, and the single most useful
 * next step for it. Pure and unit tested (src/lib/__tests__/journey.test.ts);
 * src/hooks/use-journey.ts gathers the facts from existing hooks and tables.
 * Never authorization — entitlements stay in entitlements.ts / the server.
 */

export type JourneyStage =
  | "visitor" // signed out, no SKYNN AI result yet
  | "analysed" // signed out with a finished SKYNN AI result in this browser
  | "member" // free account (Glow Explorer) that hasn't used its trial
  | "trialing" // on a free trial, not activated yet, no card on file
  | "activated" // trialling and using it (see isActivated), no card on file
  | "payment_on_file" // trialling with auto-renew set up (PayFast/PayPal)
  | "paid" // a paying membership
  | "lapsed"; // trial used or membership ended, back on the free tier

export interface JourneyFacts {
  signedIn: boolean;
  /** A SKYNN AI result finished in this browser but not yet on an account. */
  hasLocalAnalysis: boolean;
  /** Delivered analyses saved to the account. */
  savedAnalyses: number;
  /** Steps in the member's routine tracker. */
  routineSteps: number;
  /** Routine check-ins, all time. */
  routineCheckins: number;
  /** Saved items (briefings saved to the account). */
  savedItems: number;
  isTrialing: boolean;
  trialUsed: boolean;
  /** A paying tier (Glow Lite / Insider / VIP), not a trial. */
  isPaid: boolean;
  /** A live PayFast/PayPal subscription (pending, trialing, active or past_due). */
  hasPaymentOnFile: boolean;
  weatherCitySet: boolean;
  /** At least one full review or podcast episode read/played while signed in. */
  contentReads: number;
  mfaEnabled: boolean;
  /** This device can get reminders now, or after installing (false: the push API doesn't exist here). */
  reminderPushAvailable: boolean;
  /** SERVER truth: the member has an active push device (list_my_push_devices), never analytics_events. */
  reminderDeviceActive: boolean;
  /** The current device is an iPhone/iPad, where push only works from the installed app. */
  reminderIosDevice: boolean;
  /** SERVER truth: profiles.app_installed_at is set (first standalone launch). */
  appInstalled: boolean;
}

export const EMPTY_FACTS: JourneyFacts = {
  signedIn: false,
  hasLocalAnalysis: false,
  savedAnalyses: 0,
  routineSteps: 0,
  routineCheckins: 0,
  savedItems: 0,
  isTrialing: false,
  trialUsed: false,
  isPaid: false,
  hasPaymentOnFile: false,
  weatherCitySet: false,
  contentReads: 0,
  mfaEnabled: false,
  reminderPushAvailable: false,
  reminderDeviceActive: false,
  reminderIosDevice: false,
  appInstalled: false,
};

/** Activation = any of: a second saved analysis, a saved routine, 3 routine check-ins, or 3 saved items. */
export const isActivated = (f: JourneyFacts): boolean =>
  f.savedAnalyses >= 2 || f.routineSteps >= 1 || f.routineCheckins >= 3 || f.savedItems >= 3;

export const resolveJourneyStage = (f: JourneyFacts): JourneyStage => {
  if (!f.signedIn) return f.hasLocalAnalysis ? "analysed" : "visitor";
  if (f.isTrialing) {
    if (f.hasPaymentOnFile) return "payment_on_file";
    return isActivated(f) ? "activated" : "trialing";
  }
  if (f.isPaid) return "paid";
  if (f.trialUsed) return "lapsed";
  return "member";
};

export type NextActionKind = "link" | "signup" | "start_trial" | "keep_membership";

export interface NextBestAction {
  id: string;
  label: string;
  kind: NextActionKind;
  /** For kind "link". */
  href?: string;
}

const ANALYSIS: NextBestAction = { id: "analysis", label: "Take the 2-minute skin analysis", kind: "link", href: "/skynn-ai" };
const ROUTINE: NextBestAction = { id: "routine", label: "Save your routine", kind: "link", href: "/dashboard?tab=routine" };
const CHECK_IN: NextBestAction = { id: "check_in", label: "Check in on today's routine", kind: "link", href: "/dashboard?tab=routine" };

/** The one thing worth doing next. Deliberately a single action, never a list. */
export const nextBestAction = (stage: JourneyStage, f: JourneyFacts): NextBestAction => {
  switch (stage) {
    case "visitor":
      return ANALYSIS;
    case "analysed":
      return { id: "save_analysis", label: "Save your results — free", kind: "signup" };
    case "member":
      if (f.savedAnalyses === 0) return ANALYSIS;
      return { id: "start_trial", label: "Start your free trial", kind: "start_trial" };
    case "trialing":
      if (f.savedAnalyses === 0) return ANALYSIS;
      return f.routineSteps === 0 ? ROUTINE : CHECK_IN;
    case "activated":
      return { id: "keep_membership", label: "Keep my membership", kind: "keep_membership" };
    case "payment_on_file":
    case "paid":
      return f.routineSteps === 0 ? ROUTINE : CHECK_IN;
    case "lapsed":
      return { id: "resubscribe", label: "Keep your membership", kind: "keep_membership" };
  }
};

export type ChecklistItemId = "analysis" | "routine" | "weather" | "checkins" | "reminders" | "content" | "mfa" | "keep_membership";

export interface ChecklistItem {
  id: ChecklistItemId;
  label: string;
  done: boolean;
}

/**
 * "Get reminders on your phone": install + push on iOS, push alone elsewhere. Completed from server facts only
 * (an active push device, plus app_installed_at on iOS), so it is idempotent and can't be faked client-side.
 */
export const remindersDone = (f: JourneyFacts): boolean => f.reminderDeviceActive && (!f.reminderIosDevice || f.appInstalled);

/**
 * The Getting Started checklist, completion read from real data. "Keep my
 * membership" is added only for an activated trialist without a payment method.
 */
export const gettingStartedChecklist = (f: JourneyFacts): ChecklistItem[] => {
  const items: ChecklistItem[] = [
    { id: "analysis", label: "Do your skin analysis", done: f.savedAnalyses >= 1 },
    { id: "routine", label: "Save your routine", done: f.routineSteps >= 1 },
    { id: "weather", label: "Set your Skin Weather city", done: f.weatherCitySet },
    { id: "checkins", label: "Check in on your routine twice", done: f.routineCheckins >= 2 },
    { id: "reminders", label: "Get reminders on your phone", done: remindersDone(f) },
    { id: "content", label: "Read one full review or episode", done: f.contentReads >= 1 },
    { id: "mfa", label: "Secure your account with two-step verification", done: f.mfaEnabled },
  ].filter(
    // Full reviews and episodes are a membership perk: a free account can't open one, so the step
    // would be impossible and the checklist could never finish (or be hidden).
    (item) => item.id !== "content" || item.done || f.isTrialing || f.isPaid,
  ).filter(
    // Exactly one reminders step, and only where it could ever be completed (the push API exists, or it is already done).
    (item) => item.id !== "reminders" || item.done || f.reminderPushAvailable,
  ) as ChecklistItem[];
  if (resolveJourneyStage(f) === "activated") {
    items.push({ id: "keep_membership", label: "Keep my membership", done: false });
  }
  return items;
};

export const checklistComplete = (items: ChecklistItem[]): boolean => items.every((i) => i.done);
