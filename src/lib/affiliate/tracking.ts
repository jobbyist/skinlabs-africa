import { track } from "@vercel/analytics";
import type { AffiliateCampaign } from "./types";

/**
 * SkinLabs Affiliate Ad System — analytics + frequency-cap helpers.
 *
 * Integrates with the analytics already mounted in App.tsx (`<Analytics />`
 * from `@vercel/analytics/react`) rather than introducing a second
 * analytics pipeline. `track()` fires a custom Web Analytics event that
 * shows up alongside pageviews on the same dashboard.
 *
 * Event names are partner-agnostic (`affiliate_ad_*`) with `partner` as a
 * payload field, so a second affiliate program never needs new event names
 * or a code change here — only a new campaign entry.
 */

type AffiliateEventPayload = {
  partner: string;
  placement: string;
  creative: string;
  subId: string;
  /** Page path the ad rendered on, for CTR-by-context reporting. */
  context: string;
};

const buildPayload = (campaign: AffiliateCampaign, creativeId: string): AffiliateEventPayload => ({
  partner: campaign.partner,
  placement: campaign.placement,
  creative: creativeId,
  subId: campaign.subId,
  context: typeof window !== "undefined" ? window.location.pathname : "",
});

export const trackAffiliateImpression = (campaign: AffiliateCampaign, creativeId: string) => {
  try {
    track("affiliate_ad_impression", buildPayload(campaign, creativeId));
  } catch {
    // Never let analytics failures affect the ad or the page.
  }
};

export const trackAffiliateClick = (campaign: AffiliateCampaign, creativeId: string) => {
  try {
    track("affiliate_ad_click", buildPayload(campaign, creativeId));
  } catch {
    // Never let analytics failures affect the ad or the page.
  }
};

/**
 * Builds the outbound href for a campaign. The destination URL is used
 * exactly as supplied by the partner — we only append a Sub ID query param
 * when `subIdParam` has been explicitly configured (confirmed against the
 * partner's own affiliate/tracking-link documentation), so we never risk
 * silently breaking attribution with a guessed parameter name.
 */
export const buildAffiliateHref = (campaign: AffiliateCampaign): string => {
  if (!campaign.subIdParam) return campaign.destinationUrl;
  try {
    const url = new URL(campaign.destinationUrl);
    url.searchParams.set(campaign.subIdParam, campaign.subId);
    return url.toString();
  } catch {
    return campaign.destinationUrl;
  }
};

const FREQUENCY_CAP_KEY = "skinlabs-affiliate-impressions";

type FrequencyMap = Record<string, number>;

const readFrequencyMap = (): FrequencyMap => {
  try {
    return JSON.parse(sessionStorage.getItem(FREQUENCY_CAP_KEY) || "{}");
  } catch {
    return {};
  }
};

/** Session-only (sessionStorage), no PII, no cross-session or cross-device tracking. */
export const hasReachedFrequencyCap = (campaign: AffiliateCampaign): boolean => {
  if (!campaign.frequencyCap) return false;
  try {
    const map = readFrequencyMap();
    return (map[campaign.id] ?? 0) >= campaign.frequencyCap.maxImpressionsPerSession;
  } catch {
    return false;
  }
};

export const recordFrequencyCapImpression = (campaign: AffiliateCampaign) => {
  if (!campaign.frequencyCap) return;
  try {
    const map = readFrequencyMap();
    map[campaign.id] = (map[campaign.id] ?? 0) + 1;
    sessionStorage.setItem(FREQUENCY_CAP_KEY, JSON.stringify(map));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — degrade to "no cap enforced".
  }
};
