/**
 * SKYNN AI v2.1 funnel analytics — the one place SKYNN AI steps report to.
 *
 * Every event goes through the existing trackConversionEvent() pipeline (Vercel
 * Web Analytics + the first-party analytics_events table), so there's no second
 * analytics system. What this module adds is a strict whitelist: only the
 * non-sensitive keys below ever leave the browser. Questionnaire answers, the
 * Monk Skin Tone value, free text, photos, report content and reference
 * numbers are never sent — Vercel is a third party and analytics_events is
 * insert-open to anon.
 *
 * Funnel reconstruction (per mode = basic | advanced):
 *   skynn_viewed → skynn_started → skynn_consent_* → skynn_profile_* →
 *   skynn_photo_* → skynn_mst_* → skynn_assessment_started /
 *   skynn_questionnaire_progress → skynn_questionnaire_completed →
 *   skynn_{basic|advanced}_submission_* → skynn_results_viewed /
 *   skynn_advanced_pending → skynn_results_pdf_*
 */
import { trackConversionEvent, type ConversionEvent } from "@/lib/analytics-events";
import { SKYNN_FEATURE_VERSION } from "@/lib/skynn/terminology";

export const SKYNN_EVENTS = [
  // Discovery
  "skynn_viewed",
  "skynn_started",
  "skynn_mode_selected",
  // Consent
  "skynn_consent_viewed",
  "skynn_consent_accepted",
  "skynn_consent_declined",
  // Profile
  "skynn_profile_started",
  "skynn_profile_completed",
  // Photo (the photo itself never leaves the device)
  "skynn_photo_step_viewed",
  "skynn_photo_uploaded",
  "skynn_photo_skipped",
  "skynn_photo_failed",
  // Monk Skin Tone (whether one was chosen — never which)
  "skynn_mst_viewed",
  "skynn_mst_selected",
  "skynn_mst_skipped",
  // Questionnaire
  "skynn_assessment_started",
  "skynn_questionnaire_progress",
  "skynn_questionnaire_completed",
  // Basic AI Skin Analysis
  "skynn_basic_submission_started",
  "skynn_basic_submission_succeeded",
  "skynn_basic_submission_failed",
  "skynn_basic_limit_reached",
  // Advanced AI Dermatology Analysis
  "skynn_advanced_entitlement_checked",
  "skynn_analysis_pass_required",
  "skynn_analysis_pass_confirmed",
  "skynn_advanced_submission_started",
  "skynn_advanced_submission_succeeded",
  "skynn_advanced_submission_failed",
  "skynn_advanced_pending",
  "skynn_advanced_reference_created",
  // Started from the Basic AI Skin Analysis (how many answers were suggested — never which values)
  "skynn_advanced_prefill_applied",
  // Results
  "skynn_results_viewed",
  "skynn_results_pdf_generated",
  "skynn_results_pdf_downloaded",
  "skynn_results_completed",
  // Smart Routines (dashboard) and personalised picks
  "skynn_smart_routine_locked_viewed",
  "skynn_smart_routine_viewed",
  "skynn_smart_routine_generated",
  "skynn_smart_routine_rebuilt",
  "skynn_smart_routine_step_checked",
  "skynn_recommendation_viewed",
  "skynn_recommendation_clicked",
  // Errors
  "skynn_error",
] as const;

export type SkynnEvent = (typeof SKYNN_EVENTS)[number];
export type SkynnMode = "basic" | "advanced";

/** Safe error buckets — never a raw message (it could echo user input). */
export type SkynnErrorCategory =
  | "network"
  | "allowance_check"
  | "save_failed"
  | "limit_reached"
  | "profile_missing"
  | "pdf_failed"
  | "photo_invalid"
  | "not_eligible"
  | "submission_failed"
  | "unknown";

export interface SkynnEventProps {
  mode?: SkynnMode;
  step?: string;
  step_index?: number;
  progress_pct?: number;
  has_photo?: boolean;
  mst_selected?: boolean;
  error_category?: SkynnErrorCategory;
  source?: string;
  account_state?: "anonymous" | "free" | "member";
  processing_mode?: "fallback" | "production";
  eligible?: boolean;
  /** A small count (e.g. how many answers were suggested). Never an answer value. */
  count?: number;
  routine_source?: "rule_based" | "advanced_report";
}

const ALLOWED_KEYS: ReadonlyArray<keyof SkynnEventProps> = [
  "mode",
  "step",
  "step_index",
  "progress_pct",
  "has_photo",
  "mst_selected",
  "error_category",
  "source",
  "account_state",
  "processing_mode",
  "eligible",
  "count",
  "routine_source",
];

const SAFE_TOKEN = /^[a-z0-9_:/.-]{1,64}$/i;

/**
 * Drops every key that isn't whitelisted and every value that isn't a short
 * token, finite number or boolean. Exported for tests.
 */
export const sanitizeSkynnProps = (props: Record<string, unknown> = {}): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const key of ALLOWED_KEYS) {
    const value = props[key];
    if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "string" && SAFE_TOKEN.test(value)) out[key] = value;
  }
  return out;
};

export const trackSkynnEvent = (event: SkynnEvent, props: SkynnEventProps = {}) => {
  trackConversionEvent(event as ConversionEvent, {
    ...sanitizeSkynnProps(props as Record<string, unknown>),
    feature_version: SKYNN_FEATURE_VERSION,
  });
};

/** Questionnaire progress is reported at these milestones only (not per answer). */
export const PROGRESS_MILESTONES = [25, 50, 75] as const;
export const crossedMilestone = (prevPct: number, nextPct: number): number | null => {
  for (const m of PROGRESS_MILESTONES) if (prevPct < m && nextPct >= m) return m;
  return null;
};
