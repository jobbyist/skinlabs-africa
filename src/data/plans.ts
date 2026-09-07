/**
 * Static fallback plan data — used ONLY if the database-backed pricing
 * config (src/lib/pricing-config.ts, tables: pricing_plans, credit_packs,
 * founding_member_offers, pricing_settings) fails to load, so the pricing
 * page never renders completely blank. These are NOT the source of truth
 * for what anyone is actually charged — every checkout resolves its price
 * server-side from the database (see supabase/functions/paystack-payment),
 * never from these constants or anything the client sends.
 */

export type PlanId = "explorer" | "glow_lite" | "insider" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface MembershipPlan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  highlight?: boolean;
  trialEligible: boolean;
  trialDays?: number;
  moneyBackDays?: number;
  isPurchasable: boolean;
  ctaOverride?: string;
  cta: string;
  features: string[];
}

export const ANNUAL_MONTHS_FREE = 2;
export const MONEY_BACK_GUARANTEE_DAYS = 30;

/** Canonical free-tier quotas — keep in sync with src/lib/access-quotas.ts */
export const PODCAST_FREE_MONTHLY = 1;
export const COMPARE_FREE_MONTHLY = 2;
/** Signed-in Glow Explorer members get this many full Daily Skinny briefings per rolling 7 days. Signed-out visitors get none. */
export const DAILY_SKINNY_FREE_WEEKLY = 3;

export const membershipPlans: MembershipPlan[] = [
  {
    id: "explorer",
    name: "Glow Explorer",
    tagline: "See what your skin actually needs — free",
    priceMonthly: 0,
    priceAnnual: 0,
    trialEligible: false,
    isPurchasable: true,
    cta: "Start free",
    features: [
      "One full AI starter analysis to see your real skin profile",
      "Public reviews, scores and Shelf Showdowns",
      `${DAILY_SKINNY_FREE_WEEKLY} full Daily Skinny briefings per week`,
      `${COMPARE_FREE_MONTHLY} free product comparison articles per month`,
      "Public Spotlight rankings",
    ],
  },
  {
    id: "glow_lite",
    name: "Glow Lite",
    tagline: "For the skin-curious who aren't ready to commit",
    priceMonthly: 39,
    priceAnnual: 390,
    trialEligible: true,
    trialDays: 7,
    moneyBackDays: 30,
    isPurchasable: true,
    cta: "Start Glow Lite",
    features: [
      "Everything in Explorer",
      "Unlimited product comparisons and Spotlight profiles",
      "Priority access to new Daily Skinny briefings",
      "30-day money-back guarantee",
    ],
  },
  {
    id: "insider",
    name: "Glow Insider",
    tagline: "A skin routine that actually keeps up with you",
    priceMonthly: 99,
    priceAnnual: 990,
    highlight: true,
    trialEligible: true,
    trialDays: 7,
    moneyBackDays: 30,
    isPurchasable: true,
    cta: "Become an Insider",
    features: [
      "A live AI routine that re-analyses your skin every week",
      "Full podcast library and unlimited reviews",
      "Full Spotlight brand profiles and practitioner directory",
      "Member-only ingredient deep dives",
      "30-day money-back guarantee",
    ],
  },
  {
    id: "vip",
    name: "Glow VIP",
    tagline: "The most complete routine, with real practitioners",
    priceMonthly: 299,
    priceAnnual: 2990,
    trialEligible: false,
    moneyBackDays: 30,
    isPurchasable: false,
    ctaOverride: "Coming soon",
    cta: "Go VIP",
    features: [
      "Everything in Glow Insider",
      "Intelligent Routine Builder on every product review page",
      "Virtual derm consultations — launching soon",
      "Ad-free & offline browsing",
      "VIP badge",
    ],
  },
];

export const getPlan = (id: PlanId) => membershipPlans.find((plan) => plan.id === id);

export const planPrice = (plan: MembershipPlan, interval: BillingInterval) =>
  interval === "annual" ? plan.priceAnnual : plan.priceMonthly;

export const annualMonthlyEquivalent = (plan: MembershipPlan) =>
  plan.priceAnnual > 0 ? Math.round(plan.priceAnnual / 12) : 0;
