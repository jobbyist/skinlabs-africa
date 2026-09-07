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
  | "founding_member_purchased";

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
