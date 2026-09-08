import { track } from "@vercel/analytics";

/**
 * Central conversion-event vocabulary for SkinLabs' free -> paid funnel.
 *
 * Fires through the same Vercel Web Analytics pipeline already mounted in
 * App.tsx (`<Analytics />`), so events land in one dashboard alongside
 * pageviews rather than introducing a second analytics tool — the same
 * pattern already used for affiliate-ad events in src/lib/affiliate/tracking.ts.
 * If a dedicated funnel-analytics backend (GA4, PostHog) is added later, only
 * the implementation of `trackConversionEvent` needs to change — every call
 * site stays the same.
 */
export type ConversionEvent =
  | "analysis_started"
  | "consent_completed"
  | "profile_completed"
  | "analysis_generated"
  | "analysis_viewed"
  | "results_saved"
  | "signup_started"
  | "signup_completed"
  | "upgrade_viewed"
  | "upgrade_click"
  | "pricing_view"
  | "plan_selected"
  | "trial_started"
  | "checkout_started"
  | "checkout_completed"
  | "subscription_started"
  | "subscription_cancelled"
  | "credit_pack_viewed"
  | "credit_pack_purchased"
  | "founding_member_viewed"
  | "founding_member_purchased"
  // Starter Analysis 2.0 — per-question funnel + refinement/conversion detail
  // not covered by the events above (see Section 24 of the implementation spec).
  | "starter_question_viewed"
  | "starter_question_answered"
  | "starter_question_skipped"
  | "starter_question_back"
  | "starter_result_refined"
  | "starter_feedback_submitted"
  | "starter_save_cta_viewed"
  | "starter_account_creation_failed"
  | "starter_account_link_completed"
  | "starter_account_link_failed"
  | "starter_dashboard_arrived"
  | "starter_continue_without_account"
  | "advanced_analysis_started"
  // Analysis Passes — genuinely new events only; purchase start/completion already
  // reuse "checkout_started"/"credit_pack_purchased" (fired by startCreditPackCheckout
  // and the dashboard's existing payment-success polling), and analysis completion
  // reuses "analysis_generated" — see CLAUDE.md-style reasoning in the PR description.
  | "advanced_analysis_cta_clicked"
  | "analysis_pass_purchase_viewed"
  | "analysis_pass_package_selected"
  | "analysis_pass_used"
  | "analysis_pass_balance_viewed";

type ConversionPayload = Record<string, string | number | boolean | undefined>;

export const trackConversionEvent = (event: ConversionEvent, payload: ConversionPayload = {}) => {
  try {
    track(event, {
      ...payload,
      path: typeof window !== "undefined" ? window.location.pathname : "",
    });
  } catch {
    // Never let analytics failures affect the feature they're instrumenting.
  }
};
