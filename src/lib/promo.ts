/**
 * Temporary free-access promo (2026-09-22 → 2026-11-01) — see CLAUDE.md for
 * full context. This end date is UI-copy/banner-visibility only; the
 * authoritative cutoff enforced server-side lives in
 * `pricing_settings.promo_free_trial_until` (read by the `start_free_trial()`
 * RPC). Keep this in sync with that column if the promo's end date ever
 * changes — there's no single source of truth linking the two, since the
 * banner needs a value before any network round trip completes.
 */
export const PROMO_ACTIVE = true;
export const PROMO_END_AT = "2026-11-01T00:00:00+02:00";
/** Bump this if the promo's terms change and a dismissed banner should reappear. */
export const PROMO_BANNER_ID = "free-access-promo-2026-11-01";

export const isPromoActive = (): boolean => PROMO_ACTIVE && Date.now() < new Date(PROMO_END_AT).getTime();

export const PROMO_END_DATE_LABEL = "1 November 2026";

/** The standard trial length that trial copy falls back to once the promo ends. */
export const STANDARD_TRIAL_DAYS = 7;

/*
 * Trial copy helpers. Every piece of user-facing trial wording goes through
 * these so the promo's extended-trial terminology switches back to the
 * standard N-day wording automatically once PROMO_END_AT passes, with no
 * code change needed. They are evaluated at render time, not module load, so
 * a tab left open over the cutoff picks up the new wording on its next render.
 */

/** Button label, e.g. "Free until 1 November 2026" / "Try free for 7 days". */
export const trialCtaLabel = (days: number = STANDARD_TRIAL_DAYS): string =>
  isPromoActive() ? `Free until ${PROMO_END_DATE_LABEL}` : `Try free for ${days} days`;

/** Noun phrase, e.g. "free trial until 1 November 2026" / "7-day free trial". */
export const trialNoun = (days: number = STANDARD_TRIAL_DAYS): string =>
  isPromoActive() ? `free trial until ${PROMO_END_DATE_LABEL}` : `${days}-day free trial`;

/** Length phrase, e.g. "until 1 November 2026" / "for 7 days". */
export const trialLength = (days: number = STANDARD_TRIAL_DAYS): string =>
  isPromoActive() ? `until ${PROMO_END_DATE_LABEL}` : `for ${days} days`;

/**
 * Rewrites standard trial wording inside plan copy that isn't authored in
 * code (DB-driven `pricing_plans` taglines/benefits and the static fallback
 * in src/data/plans.ts). A no-op once the promo has ended.
 */
export const withPromoTrialCopy = (text: string): string => {
  if (!isPromoActive()) return text;
  return text
    .replace(/Try free for (\d+) days/gi, (_, d) => trialCtaLabel(Number(d)))
    .replace(/(\d+)-day free trial/gi, (_, d) => trialNoun(Number(d)));
};
