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
  | "signup"
  | "quiz_complete"
  | "analysis_view"
  | "upgrade_prompt_view"
  | "upgrade_click"
  | "trial_start"
  | "checkout_start"
  | "payment_success"
  | "credit_purchase";

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
