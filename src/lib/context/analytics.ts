/**
 * Contextual-UX analytics. Same pipeline as everything else (trackConversionEvent),
 * with a strict payload whitelist: action ids, surfaces, feature and state TOKENS and
 * small counts only. No skin data, no content titles, no ids of people.
 */
import { trackConversionEvent, type ConversionEvent } from "@/lib/analytics-events";

export const CONTEXT_EVENTS = [
  "context_resolved",
  "journey_state_changed",
  "dashboard_primary_action_shown",
  "dashboard_primary_action_clicked",
  "contextual_cta_shown",
  "contextual_cta_clicked",
  "contextual_cta_dismissed",
  "contextual_cta_suppressed",
  "cta_repetition_suppressed",
  "feature_discovery_shown",
  "feature_discovery_clicked",
  "recommendation_shown",
  "recommendation_clicked",
  "onboarding_completed",
] as const;

export type ContextEvent = (typeof CONTEXT_EVENTS)[number];

export interface ContextEventProps {
  action?: string;
  surface?: string;
  feature?: string;
  state?: string;
  previous_state?: string;
  reason?: string;
  tier?: string;
  count?: number;
}

const ALLOWED: ReadonlyArray<keyof ContextEventProps> = ["action", "surface", "feature", "state", "previous_state", "reason", "tier", "count"];
const SAFE_TOKEN = /^[a-z0-9_:/.-]{1,64}$/i;

/** Drops every key that isn't whitelisted and every value that isn't a short token or a finite number. */
export const sanitizeContextProps = (props: Record<string, unknown> = {}): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  for (const key of ALLOWED) {
    const v = props[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = Math.round(v);
    else if (typeof v === "string" && SAFE_TOKEN.test(v)) out[key] = v;
  }
  return out;
};

export const trackContextEvent = (event: ContextEvent, props: ContextEventProps = {}) => {
  trackConversionEvent(event as ConversionEvent, sanitizeContextProps(props as Record<string, unknown>));
};
