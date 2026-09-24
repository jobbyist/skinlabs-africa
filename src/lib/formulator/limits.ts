/**
 * SKYNN AI Formulator — starter-analysis limits per tier.
 *
 * FORMULATOR_LIMITS is the one place to read (and change) the limits in code.
 * The server enforces the same numbers in save_starter_analysis()
 * (supabase/migrations/20260924100000_formulator_rolling_allowance.sql), where
 * the free allowance and window come from `pricing_settings`
 * (free_ai_analysis_allowance / free_analysis_window_days) so they stay
 * DB-driven like the rest of pricing. A unit test parses that migration's
 * defaults to keep the two in step — change both together.
 *
 * Everything here is for UI only (what to show, whether to show the locked
 * state). The server is the only thing that decides whether a save is allowed.
 */
import type { MembershipTier } from "@/hooks/use-membership";

export interface FormulatorLimit {
  unlimited: boolean;
  /** Free starter analyses per window. Ignored when unlimited. */
  freeAnalyses: number;
  /** Rolling window length in days, counted from the last free analysis. Ignored when unlimited. */
  windowDays: number;
}

export const FORMULATOR_LIMITS: Record<MembershipTier, FormulatorLimit> = {
  explorer: { unlimited: false, freeAnalyses: 1, windowDays: 30 },
  glow_lite: { unlimited: false, freeAnalyses: 1, windowDays: 30 },
  insider: { unlimited: true, freeAnalyses: 0, windowDays: 0 },
  vip: { unlimited: true, freeAnalyses: 0, windowDays: 0 },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface FormulatorAllowance {
  unlimited: boolean;
  /** Free analyses left in the current window — 0 or 1 today; null when unlimited. */
  freeRemaining: number | null;
  freeTotal: number | null;
  windowDays: number | null;
  lastFreeAnalysisAt: Date | null;
  /** When the next free analysis becomes available; null if one is available now (or unlimited). */
  nextUnlockAt: Date | null;
  /** True when a free/Lite user has no free analysis left right now. */
  locked: boolean;
}

/**
 * Rolling window: counted from the last *free* analysis, not the calendar month.
 * Boundary is inclusive — exactly `windowDays` after the last one unlocks.
 * (Spending a purchased Analysis Pass never moves the window, so buying a pass
 * doesn't push someone's next free analysis further away.)
 */
export const computeFormulatorAllowance = (
  tier: MembershipTier,
  lastFreeAnalysisAt: Date | string | null,
  now: Date = new Date(),
  limits: Record<MembershipTier, FormulatorLimit> = FORMULATOR_LIMITS,
): FormulatorAllowance => {
  const limit = limits[tier] ?? limits.explorer;
  const last = lastFreeAnalysisAt ? new Date(lastFreeAnalysisAt) : null;
  const validLast = last && !Number.isNaN(last.getTime()) ? last : null;

  if (limit.unlimited) {
    return {
      unlimited: true,
      freeRemaining: null,
      freeTotal: null,
      windowDays: null,
      lastFreeAnalysisAt: validLast,
      nextUnlockAt: null,
      locked: false,
    };
  }

  const unlockAt = validLast ? new Date(validLast.getTime() + limit.windowDays * DAY_MS) : null;
  const available = limit.freeAnalyses > 0 && (!unlockAt || now.getTime() >= unlockAt.getTime());
  return {
    unlimited: false,
    freeRemaining: available ? limit.freeAnalyses : 0,
    freeTotal: limit.freeAnalyses,
    windowDays: limit.windowDays,
    lastFreeAnalysisAt: validLast,
    nextUnlockAt: available ? null : unlockAt,
    locked: !available,
  };
};

/** Fraction of the current window that has elapsed (0–1), for the credits progress bar. */
export const windowProgress = (allowance: FormulatorAllowance, now: Date = new Date()): number => {
  if (allowance.unlimited || !allowance.locked || !allowance.nextUnlockAt || !allowance.windowDays) return 1;
  const total = allowance.windowDays * DAY_MS;
  const remaining = allowance.nextUnlockAt.getTime() - now.getTime();
  return Math.min(1, Math.max(0, 1 - remaining / total));
};

/** "24 October 2026" in SAST, the way every other SkinLabs date reads. */
export const formatUnlockDate = (date: Date): string =>
  date.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });

/** Server error raised by save_starter_analysis() when the allowance is spent. */
export const FORMULATOR_LIMIT_ERROR = "formulator_limit_reached";

export const isFormulatorLimitError = (error: { message?: string; hint?: string } | null | undefined): boolean =>
  Boolean(error && (error.message === FORMULATOR_LIMIT_ERROR || error.hint === FORMULATOR_LIMIT_ERROR));
