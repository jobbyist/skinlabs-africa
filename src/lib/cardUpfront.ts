/**
 * "Card upfront" trial experiment (onboarding overhaul 11). A browser
 * bucketed into this pricing variant is asked for a card or PayPal first
 * (KeepMembershipDialog: R0 tokenisation, first charge on the trial-end date)
 * instead of getting the one-tap no-card trial. The variant row
 * (pricing_experiment_variants.card_upfront) ships at traffic_weight 0 and
 * stays there until a human enables it — not before 1 November 2026, while
 * the promo promises "no card required".
 */
export const CARD_UPFRONT_VARIANT = "card_upfront";

export const isCardUpfrontVariant = (variantKey: string | null | undefined): boolean => variantKey === CARD_UPFRONT_VARIANT;
