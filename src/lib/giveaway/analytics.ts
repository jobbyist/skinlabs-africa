/**
 * Giveaway funnel analytics — the one place the October 2026 giveaway reports to.
 *
 * Everything goes through the existing trackConversionEvent() pipeline (Vercel Web Analytics + first-party
 * `analytics_events`), which already merges the visitor's utm_* labels and per-session id (src/lib/attribution.ts)
 * and forwards the few mapped events to the TikTok Pixel + Events API with a shared event_id
 * (src/lib/tiktok/events.ts: giveaway_cta_click / giveaway_story_cta_click → ClickButton,
 * giveaway_assessment_completed → SubmitForm; the page's ViewContent comes from contentForPath()).
 *
 * Privacy: the payload is a strict whitelist of campaign constants and a CTA location token. No assessment
 * answers, skin profile, results, product picks or health information is ever read here, and none can be
 * passed in. source/medium are NOT hard-coded: they are whatever the visit's own UTM labels say.
 */
import { trackConversionEvent } from "@/lib/analytics-events";
import { GIVEAWAY_CAMPAIGN, GIVEAWAY_DEADLINE_DATE, GIVEAWAY_PATH } from "@/lib/giveaway/campaign";

export const GIVEAWAY_EVENTS = [
  "giveaway_page_view",
  "giveaway_cta_click",
  "giveaway_assessment_started",
  "giveaway_assessment_completed",
  "giveaway_story_cta_click",
  "giveaway_terms_viewed",
  "giveaway_entry_submitted",
] as const;
export type GiveawayEvent = (typeof GIVEAWAY_EVENTS)[number];

export type GiveawayCtaLocation = "hero" | "prizes" | "how_to_enter" | "mid_page" | "story" | "entry" | "final_cta" | "story_viewer";
export type GiveawayCtaKind = "primary" | "secondary" | "enter" | "share_story" | "story_assessment";

const CONTEXT_KEY = "skinlabs_giveaway_context";
const ONCE_PREFIX = "skinlabs_giveaway_once_";
const memoryOnce = new Set<string>();

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

/** Marks this browser session as having come through the giveaway (so the assessment can report back). */
export const markGiveawayContext = (): void => {
  try {
    storage()?.setItem(CONTEXT_KEY, "1");
  } catch {
    /* ignore */
  }
};

export const hasGiveawayContext = (): boolean => {
  try {
    return storage()?.getItem(CONTEXT_KEY) === "1";
  } catch {
    return false;
  }
};

/** True the first time per browser session for `key`; survives Strict Mode, re-renders and refreshes. */
const firstTimeThisSession = (key: string): boolean => {
  const store = storage();
  const k = `${ONCE_PREFIX}${key}`;
  try {
    if (store) {
      if (store.getItem(k)) return false;
      store.setItem(k, "1");
      return true;
    }
  } catch {
    /* fall through to memory */
  }
  if (memoryOnce.has(k)) return false;
  memoryOnce.add(k);
  return true;
};

type Payload = Record<string, string | number | boolean | undefined>;

/** The only keys that may ever leave in a giveaway event. */
const WHITELIST = new Set(["campaign", "landing_page", "campaign_deadline", "cta_location", "cta"]);

export const sanitizeGiveawayPayload = (extra: Record<string, unknown> = {}): Payload => {
  const out: Payload = { campaign: GIVEAWAY_CAMPAIGN, landing_page: GIVEAWAY_PATH, campaign_deadline: GIVEAWAY_DEADLINE_DATE };
  for (const [k, v] of Object.entries(extra)) {
    if (WHITELIST.has(k) && typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v)) out[k] = v;
  }
  return out;
};

export const trackGiveawayEvent = (event: GiveawayEvent, extra: Record<string, unknown> = {}): void => {
  trackConversionEvent(event, sanitizeGiveawayPayload(extra));
};

let lastViewAt = 0;
/** One page-view per real visit: a Strict Mode double effect or a quick re-render within 2 s is ignored. */
export const trackGiveawayPageView = (now: number = Date.now()): void => {
  if (now - lastViewAt < 2000) return;
  lastViewAt = now;
  markGiveawayContext();
  trackGiveawayEvent("giveaway_page_view");
};

export const trackGiveawayCta = (location: GiveawayCtaLocation, cta: GiveawayCtaKind): void => {
  markGiveawayContext();
  // "Story" CTAs = the web-story surfaces plus the Skin Story section's "Share Your Skin Story"; the rest are page CTAs.
  const isStory = location === "story" || location === "story_viewer" || cta === "share_story" || cta === "story_assessment";
  const event: GiveawayEvent = isStory ? "giveaway_story_cta_click" : "giveaway_cta_click";
  trackGiveawayEvent(event, { cta_location: location, cta });
};

/** Terms opened — once per session, however many sections are expanded. */
export const trackGiveawayTermsViewed = (): void => {
  if (firstTimeThisSession("terms_viewed")) trackGiveawayEvent("giveaway_terms_viewed");
};

/**
 * Called from the existing SKYNN AI flow at its existing start / result moments. Does nothing unless this session came
 * through the giveaway, and reports each stage once per session (a second analysis, a re-render or a refresh doesn't
 * inflate the funnel or the TikTok SubmitForm count).
 */
export const trackGiveawayAssessment = (stage: "started" | "completed"): void => {
  if (!hasGiveawayContext()) return;
  if (!firstTimeThisSession(`assessment_${stage}`)) return;
  trackGiveawayEvent(stage === "started" ? "giveaway_assessment_started" : "giveaway_assessment_completed");
};

export const trackGiveawayEntrySubmitted = (): void => {
  if (firstTimeThisSession("entry_submitted")) trackGiveawayEvent("giveaway_entry_submitted");
};
