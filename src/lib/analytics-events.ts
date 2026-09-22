import { track } from "@vercel/analytics";
import { supabase } from "@/integrations/supabase/client";

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
  | "analysis_pass_balance_viewed"
  // Smart Routines — landing page and conversion funnel events
  | "smart_routines_page_view"
  | "smart_routines_cta_clicked"
  | "smart_routines_demo_interaction"
  | "smart_routines_faq_opened"
  | "smart_routines_accessed"
  | "smart_routines_generated"
  // SKYNN "See how it works" video modal + Advanced Assessment upsell moments —
  // genuinely new events only. Assessment start/access-denied/pass-selection
  // already reuse "advanced_analysis_started"/"advanced_analysis_cta_clicked"/
  // "analysis_pass_package_selected" fired at their existing call sites.
  | "skynn_video_opened"
  | "skynn_video_completed"
  | "advanced_assessment_upsell_viewed"
  | "advanced_assessment_upsell_clicked"
  | "advanced_assessment_access_denied"
  | "advanced_assessment_membership_cta_clicked"
  // Auth + membership onboarding funnel (AuthDialog, Pricing, /reset-password, /admin)
  | "membership_plan_selected"
  | "auth_started"
  | "signin_completed"
  | "password_reset_started"
  | "password_reset_completed"
  | "trial_activation_started"
  | "trial_activation_failed"
  | "dashboard_entered"
  | "admin_login_success"
  | "admin_login_failure"
  // OpenHaus marketplace + podcast — previously uninstrumented entirely.
  | "marketplace_add_to_cart"
  | "podcast_played"
  | "podcast_liked"
  | "podcast_shared"
  // Broader site-wide gap-fill (2026-09-22) — key actions across the app
  // that had no analytics instrumentation at all before this pass.
  | "newsletter_subscribed"
  | "brand_request_submitted"
  | "partner_enquiry_submitted"
  | "ingredient_checker_checked"
  | "consultation_booking_requested"
  | "site_search_result_clicked"
  | "account_deactivated"
  | "account_deletion_requested"
  | "routine_checkin_completed";

type ConversionPayload = Record<string, string | number | boolean | undefined>;

export const trackConversionEvent = (event: ConversionEvent, payload: ConversionPayload = {}) => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  try {
    track(event, { ...payload, path });
  } catch {
    // Never let analytics failures affect the feature they're instrumenting.
  }
  // Best-effort server-side mirror (see supabase/migrations/20260921120000_
  // analytics_events_core.sql) so the admin dashboard's Analytics tab has a
  // queryable/segmentable record independent of Vercel's own API — never
  // awaited, never allowed to throw into the caller. getSession() reads the
  // already-cached local session rather than making a network call, so this
  // stays cheap even though it's async.
  try {
    void supabase.auth
      .getSession()
      .then(({ data }) =>
        supabase.from("analytics_events").insert({
          event_name: event,
          payload,
          path,
          user_id: data.session?.user.id ?? null,
        }),
      )
      .then(({ error }) => {
        if (error) console.warn("analytics_events insert failed:", error.message);
      });
  } catch {
    // Never let analytics failures affect the feature they're instrumenting.
  }
};
