/**
 * Static fallback plan data — used ONLY if the database-backed pricing
 * config (src/lib/pricing-config.ts, tables: pricing_plans, credit_packs,
 * pricing_settings) fails to load, so the pricing
 * page never renders completely blank. These are NOT the source of truth
 * for what anyone is actually charged — every checkout resolves its price
 * server-side from the database (see supabase/functions/payfast-payment/paypal-payment),
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

// Offline fallback only — mirrors the live pricing_plans rows (see
// supabase/migrations/20260928160000_plan_benefits_match_code.sql). Keep in sync.
export const membershipPlans: MembershipPlan[] = [
  {
    id: "explorer",
    name: "Glow Explorer",
    tagline: "See what SkinLabs can do, free",
    priceMonthly: 0,
    priceAnnual: 0,
    trialEligible: false,
    isPurchasable: true,
    cta: "Start free",
    features: [
      "One free Basic AI Skin Analysis every 7 days to see your real skin profile",
      "Public reviews, scores and Spotlight rankings",
      `${DAILY_SKINNY_FREE_WEEKLY} full Daily Skinny briefings a week`,
      `${COMPARE_FREE_MONTHLY} Shelf Showdowns and 3 Spotlight brand profiles a month`,
      "Ingredient Combination Checker — free for a limited time",
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
      "Everything in Glow Explorer",
      "Unlimited Shelf Showdowns and Spotlight brand profiles",
      "Practitioner directory",
      "30-day money-back guarantee",
    ],
  },
  {
    id: "insider",
    name: "Glow Insider",
    tagline: "The full skincare intelligence toolkit",
    priceMonthly: 79,
    priceAnnual: 790,
    highlight: true,
    trialEligible: true,
    trialDays: 7,
    moneyBackDays: 30,
    isPurchasable: true,
    cta: "Become an Insider",
    features: [
      "Everything in Glow Lite",
      "Unlimited Basic AI Skin Analysis — re-analyse whenever your skin changes",
      "Intelligent Routine Builder on every review page",
      "Unlimited Daily Skinny briefings, full reviews and the full podcast library",
      "Active Ingredient Conflict Matcher for your SKYNN AI routine",
      "Ad-light browsing",
      "30-day money-back guarantee",
    ],
  },
  {
    id: "vip",
    name: "Glow VIP",
    tagline: "The most complete routine, with real practitioners",
    priceMonthly: 199,
    priceAnnual: 1990,
    trialEligible: false,
    moneyBackDays: 30,
    isPurchasable: false,
    ctaOverride: "Coming soon",
    cta: "Go VIP",
    features: [
      "Everything in Glow Insider",
      "Virtual derm consultations — launching soon",
      "Ad-free browsing",
    ],
  },
];

export const getPlan = (id: PlanId) => membershipPlans.find((plan) => plan.id === id);

export const planPrice = (plan: MembershipPlan, interval: BillingInterval) =>
  interval === "annual" ? plan.priceAnnual : plan.priceMonthly;

export const annualMonthlyEquivalent = (plan: MembershipPlan) =>
  plan.priceAnnual > 0 ? Math.round(plan.priceAnnual / 12) : 0;
