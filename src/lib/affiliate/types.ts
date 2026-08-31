/**
 * SkinLabs Affiliate Ad System — shared types.
 *
 * Generic by design: `partner` is a string, not a Shopify-only union, so a
 * second affiliate program can register a campaign without touching this
 * file or any component that renders `AffiliateAdSlot`.
 */

export type AffiliatePartner = "shopify" | (string & {});

/**
 * Placements are the contextual "slots" the ad system knows how to fill.
 * Only a subset needs an active campaign at any given time — see
 * `campaigns.ts` for which ones are switched on.
 */
export type AffiliatePlacement =
  | "brand-spotlight"
  | "brand-profile"
  | "marketplace"
  | "editorial"
  | "homepage";

export interface AffiliateCreativeAsset {
  /** Stable id used in analytics payloads, e.g. "shopify_970x250". */
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface AffiliateCreativeSet {
  desktop: AffiliateCreativeAsset;
  /** Falls back to `desktop` when omitted. */
  tablet?: AffiliateCreativeAsset;
  /** Falls back to `tablet` then `desktop` when omitted. */
  mobile?: AffiliateCreativeAsset;
}

export interface AffiliateFrequencyCap {
  /** Max times this campaign may render an impression within one browser session. */
  maxImpressionsPerSession: number;
}

export interface AffiliateCampaign {
  /** Unique campaign id, also used as the sessionStorage frequency-cap key. */
  id: string;
  partner: AffiliatePartner;
  placement: AffiliatePlacement;
  /** Master on/off switch. Inactive campaigns are never rendered. */
  active: boolean;
  /** Higher wins when multiple active campaigns target the same placement. */
  priority: number;
  /** ISO date strings. Campaign only renders when now() is within range (inclusive). */
  startDate?: string;
  endDate?: string;

  /** Unmodified affiliate/tracking destination URL supplied by the partner. */
  destinationUrl: string;
  /** Internal Sub ID used in SkinLabs' own analytics to report CTR by placement/creative. */
  subId: string;
  /**
   * Optional query param name to append `subId` under on the destination URL
   * (e.g. Impact's `subid1`). Left unset until confirmed with the partner's
   * affiliate program so we never guess at their tracking-link structure.
   */
  subIdParam?: string;

  eyebrow: string;
  heading: string;
  body?: string;
  ctaLabel: string;
  /** Small print under the CTA, e.g. commission disclosure. */
  disclosure?: string;

  creatives: AffiliateCreativeSet;
  frequencyCap?: AffiliateFrequencyCap;
}
