import { track } from "@vercel/analytics";
import { supabase } from "@/integrations/supabase/client";
import { forwardConversionToTikTok } from "@/lib/tiktok/pixel";
import { readAttribution } from "@/lib/attribution";

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
  // Paid-traffic landing (utm_* / ttclid) — one per campaign per session, fired by <AttributionCapture />.
  | "campaign_landing"
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
  | "skynn_cta_clicked"
  | "adblock_wall_shown"
  | "adblock_wall_cleared"
  | "promo_modal_opened"
  | "promo_modal_cta_clicked"
  | "pricing_view"
  | "plan_selected"
  | "trial_started"
  | "checkout_started"
  | "checkout_completed"
  | "keep_membership_viewed"
  | "keep_membership_gateway_selected"
  | "keep_membership_completed"
  | "trial_card_upfront_shown"
  | "welcome_viewed"
  | "welcome_step_completed"
  | "welcome_finished"
  | "checklist_step_clicked"
  | "checklist_dismissed"
  | "subscription_started"
  | "subscription_cancelled"
  | "credit_pack_viewed"
  | "credit_pack_purchased"
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
  | "sa_price_link_clicked"
  // Weekly-digest double opt-in funnel (growth engine). Payloads: source only, never the email.
  | "newsletter_signup_submitted"
  | "newsletter_signup_failed"
  | "newsletter_confirmed"
  | "brand_request_submitted"
  // Photo journal (declared here because PhotoJournalTab fires them; main was missing these)
  | "photo_journal_frequency_changed"
  | "photo_journal_entry_added"
  | "photo_journal_entry_deleted"
  | "partner_enquiry_submitted"
  | "ingredient_checker_checked"
  | "consultation_booking_requested"
  | "site_search_result_clicked"
  | "content_vertical_clicked"
  // Homepage skin-weather notch. Payloads: city key / UV band only.
  | "weather_notch_opened"
  | "weather_notch_dismissed"
  | "weather_notch_city_changed"
  | "account_deactivated"
  | "account_deletion_requested"
  | "routine_checkin_completed"
  | "routine_saved"
  // Contextual mobile feedback survey lifecycle.
  | "feedback_survey_shown"
  | "feedback_survey_dismissed"
  | "feedback_survey_submitted"
  // Free-first SKYNN AI formulator + rolling free-analysis allowance (2026-09-24).
  | "formulator_started"
  | "formulator_completed_anonymous"
  | "signup_from_formulator"
  | "reanalysis_blocked"
  | "upgrade_clicked_from_formulator"
  // Installable app / PWA layer (src/lib/pwa). Payloads: platform / browser / source tokens and counts only.
  | "pwa_install_prompt_viewed"
  | "pwa_install_prompt_dismissed"
  | "pwa_install_accepted"
  | "pwa_install_declined"
  | "pwa_install_started"
  | "pwa_installed"
  | "pwa_launch"
  | "pwa_offline"
  | "pwa_online"
  | "pwa_update_available"
  | "pwa_updated"
  | "push_prompt_viewed"
  | "push_soft_ask_shown"
  | "push_soft_ask_accepted"
  | "push_permission_granted"
  | "push_permission_denied"
  | "push_subscribed"
  | "push_unsubscribed"
  | "podcast_download_started"
  | "podcast_download_completed"
  | "podcast_download_removed"
  | "podcast_offline_play"
  // SKYNN AI v2.1 funnel — fire through trackSkynnEvent() (src/lib/skynn/analytics.ts),
  // which whitelists the payload, never directly.
  | import("@/lib/skynn/analytics").SkynnEvent
  // October 2026 giveaway funnel — fire through src/lib/giveaway/analytics.ts (whitelisted payload), never directly.
  | import("@/lib/giveaway/analytics").GiveawayEvent;

type ConversionPayload = Record<string, string | number | boolean | undefined>;

export const trackConversionEvent = (event: ConversionEvent, payload: ConversionPayload = {}) => {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  // Campaign labels (utm_*, session id) ride along on our own analytics only. They are deliberately NOT
  // part of the payload handed to TikTok below. Explicit payload keys win over attribution keys.
  const attributed: ConversionPayload = { ...readAttribution(), ...payload };
  try {
    track(event, { ...attributed, path });
  } catch {
    // Never let analytics failures affect the feature they're instrumenting.
  }
  // TikTok Pixel + Events API: consent-gated and limited to a few standard events
  // (src/lib/tiktok/events.ts); a no-op for everyone who hasn't accepted advertising cookies.
  forwardConversionToTikTok(event, payload);
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
          payload: attributed,
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
