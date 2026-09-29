/**
 * Trial lifecycle (onboarding overhaul 09): which state a member's trial is
 * in, measured in SAST calendar days — the same windows the daily
 * trial_lifecycle_email_plan() SQL uses, so the dashboard banner and the email
 * a member receives always agree:
 *
 *   T-7            trial_week_left          (banner: 4–7 days left)
 *   T-3, card      trial_precharge_reminder (banner: 0–3 days left, card)
 *   T-3, no card   trial_last_chance        (banner: 0–3 days left, no card)
 *   ended          trial_ended / +5 days trial_winback (banner: ended)
 *
 * Pure and unit tested (src/lib/__tests__/trialLifecycle.test.ts).
 */

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // Africa/Johannesburg, no DST.
const DAY_MS = 86_400_000;

/** Calendar day number (days since epoch) of an instant in SAST. */
const sastDay = (at: Date | string | number): number =>
  Math.floor((new Date(at).getTime() + SAST_OFFSET_MS) / DAY_MS);

/** Whole SAST calendar days from `now` until `end` (negative once past). */
export const sastDaysUntil = (end: string, now: Date = new Date()): number => sastDay(end) - sastDay(now);

export type TrialBannerState = "trialing" | "week_left" | "precharge" | "last_chance" | "ended" | "none";

export interface TrialBannerInput {
  isTrialing: boolean;
  trialEndsAt: string | null;
  /** A live auto-renew subscription; null = still loading / unknown. */
  hasPaymentOnFile: boolean | null;
  trialUsed: boolean;
  /** On the free tier (not paying, not trialling). */
  isExplorer: boolean;
  now?: Date;
}

export const trialBannerState = (i: TrialBannerInput): TrialBannerState => {
  if (i.isTrialing && i.trialEndsAt) {
    const days = sastDaysUntil(i.trialEndsAt, i.now);
    if (days <= 3) {
      if (i.hasPaymentOnFile === null) return "trialing"; // don't guess charge copy
      return i.hasPaymentOnFile ? "precharge" : "last_chance";
    }
    if (days <= 7) return "week_left";
    return "trialing";
  }
  if (!i.isTrialing && i.trialUsed && i.isExplorer) return "ended";
  return "none";
};

/** "1 November 2026" in SAST. */
export const formatSastDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
