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
