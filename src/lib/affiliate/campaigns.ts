import shopifyDragDropDone from "@/assets/affiliates/shopify-drag-drop-done-970x250.png";
import shopifyFreeTrialWide from "@/assets/affiliates/shopify-free-trial-1456x180.png";
import type { AffiliateCampaign, AffiliatePartner, AffiliatePlacement } from "./types";

/**
 * SkinLabs Affiliate Ad System — campaign registry.
 *
 * This is the single source of truth for which affiliate creative appears
 * where. It follows the same "static, typed content module" pattern already
 * used for editorial content in this codebase (see `src/data/spotlight.ts`),
 * rather than introducing a new database table for something with only a
 * handful of rows today.
 *
 * To activate a new placement: flip `active: true` on the relevant campaign
 * below (or add a new one) — no component code changes required.
 *
 * NOTE on `destinationUrl`: this is the official Shopify affiliate link
 * exactly as supplied, left unmodified. `subIdParam` is intentionally unset
 * — see AGENT_NOTES / implementation summary for why, and how to turn it on
 * once confirmed with the Impact/Shopify affiliate dashboard.
 */

const SHOPIFY_AFFILIATE_URL = "https://shopify.pxf.io/c/5713213/3931185/13624";

const shopifyDragDropCreative = {
  id: "shopify_drag_drop_970x250",
  src: shopifyDragDropDone,
  width: 970,
  height: 250,
  alt: "Shopify — Drag. Drop. Done. Start your free trial.",
};

const shopifyFreeTrialCreative = {
  id: "shopify_free_trial_1456x180",
  src: shopifyFreeTrialWide,
  width: 1456,
  height: 180,
  alt: "Shopify — This free trial can change your life. Start for free, then pay $1/month for 3 months.",
};

export const AFFILIATE_CAMPAIGNS: AffiliateCampaign[] = [
  {
    id: "shopify-brand-spotlight",
    partner: "shopify",
    placement: "brand-spotlight",
    active: true,
    priority: 100,
    destinationUrl: SHOPIFY_AFFILIATE_URL,
    subId: "shopify_brand_spotlight",
    eyebrow: "Partner Offer",
    heading: "Thinking about launching your own skincare brand?",
    body: "Build your online store with Shopify.",
    ctaLabel: "Start your free trial",
    disclosure: "Affiliate link — SkinLabs may earn a commission at no extra cost to you.",
    creatives: {
      desktop: shopifyDragDropCreative,
      tablet: shopifyDragDropCreative,
      mobile: shopifyDragDropCreative,
    },
    frequencyCap: { maxImpressionsPerSession: 4 },
  },

  // --- Reserved for future rollout. Kept inactive until each surface has
  // been reviewed for UX fit, per "activate ONLY Brand Spotlight initially". ---
  {
    id: "shopify-brand-profile",
    partner: "shopify",
    placement: "brand-profile",
    active: false,
    priority: 90,
    destinationUrl: SHOPIFY_AFFILIATE_URL,
    subId: "shopify_brand_profile",
    eyebrow: "Partner Offer",
    heading: "Thinking about launching your own skincare brand?",
    body: "Build your online store with Shopify.",
    ctaLabel: "Start your free trial",
    disclosure: "Affiliate link — SkinLabs may earn a commission at no extra cost to you.",
    creatives: {
      desktop: shopifyDragDropCreative,
      tablet: shopifyDragDropCreative,
      mobile: shopifyDragDropCreative,
    },
    frequencyCap: { maxImpressionsPerSession: 4 },
  },
  {
    id: "shopify-marketplace",
    partner: "shopify",
    placement: "marketplace",
    active: false,
    priority: 80,
    destinationUrl: SHOPIFY_AFFILIATE_URL,
    subId: "shopify_marketplace",
    eyebrow: "Partner Offer",
    heading: "Selling skincare? Shopify powers stores like this one.",
    body: "Build your online store with Shopify.",
    ctaLabel: "Start your free trial",
    disclosure: "Affiliate link — SkinLabs may earn a commission at no extra cost to you.",
    creatives: {
      desktop: shopifyDragDropCreative,
      tablet: shopifyDragDropCreative,
      mobile: shopifyDragDropCreative,
    },
    frequencyCap: { maxImpressionsPerSession: 3 },
  },
  {
    id: "shopify-editorial",
    partner: "shopify",
    placement: "editorial",
    active: false,
    priority: 70,
    destinationUrl: SHOPIFY_AFFILIATE_URL,
    subId: "shopify_editorial",
    eyebrow: "Partner Offer",
    heading: "Thinking about launching your own skincare brand?",
    body: "Build your online store with Shopify.",
    ctaLabel: "Start your free trial",
    disclosure: "Affiliate link — SkinLabs may earn a commission at no extra cost to you.",
    creatives: {
      desktop: shopifyDragDropCreative,
      tablet: shopifyDragDropCreative,
      mobile: shopifyDragDropCreative,
    },
    frequencyCap: { maxImpressionsPerSession: 3 },
  },
  {
    id: "shopify-homepage",
    partner: "shopify",
    placement: "homepage",
    active: false,
    priority: 60,
    destinationUrl: SHOPIFY_AFFILIATE_URL,
    subId: "shopify_homepage",
    eyebrow: "Partner Offer",
    heading: "This free trial can change your life.",
    body: "Build your online store with Shopify.",
    ctaLabel: "Claim offer",
    disclosure: "Affiliate link — SkinLabs may earn a commission at no extra cost to you.",
    creatives: {
      desktop: shopifyFreeTrialCreative,
      tablet: shopifyFreeTrialCreative,
      mobile: shopifyDragDropCreative,
    },
    frequencyCap: { maxImpressionsPerSession: 2 },
  },
];

const isWithinCampaignWindow = (campaign: AffiliateCampaign, now: Date): boolean => {
  if (campaign.startDate && now < new Date(campaign.startDate)) return false;
  if (campaign.endDate && now > new Date(campaign.endDate)) return false;
  return true;
};

/**
 * Resolve the highest-priority active campaign for a given placement
 * (optionally scoped to a partner), or `null` if nothing should render.
 */
export const getActiveCampaign = (
  placement: AffiliatePlacement,
  partner?: AffiliatePartner,
): AffiliateCampaign | null => {
  const now = new Date();
  const candidates = AFFILIATE_CAMPAIGNS.filter(
    (campaign) =>
      campaign.placement === placement &&
      campaign.active &&
      (!partner || campaign.partner === partner) &&
      isWithinCampaignWindow(campaign, now),
  ).sort((a, b) => b.priority - a.priority);

  return candidates[0] ?? null;
};
