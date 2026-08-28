export type PlanId = "explorer" | "insider" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface MembershipPlan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in ZAR per month when billed monthly. */
  priceMonthly: number;
  /** Total price in ZAR per year when billed annually (already discounted). */
  priceAnnual: number;
  highlight?: boolean;
  trialEligible: boolean;
  /** Days a paid subscriber can cancel within for a full refund. Paid plans only. */
  moneyBackDays?: number;
  cta: string;
  features: string[];
}

/** Annual billing gives members this many months free versus paying monthly. */
export const ANNUAL_MONTHS_FREE = 2;

/** Refund window applied to every paid membership plan. */
export const MONEY_BACK_GUARANTEE_DAYS = 30;

/**
 * Single source of truth for membership pricing and feature copy.
 * Referenced by Pricing.tsx, About.tsx, SubscriptionPaywallModal.tsx and the
 * paystack-payment edge function's PLANS map — keep amounts in sync with that map.
 */
export const membershipPlans: MembershipPlan[] = [
  {
    id: "explorer",
    name: "Glow Explorer",
    tagline: "Start reading, start learning",
    priceMonthly: 0,
    priceAnnual: 0,
    trialEligible: false,
    cta: "Start free",
    features: [
      "1 full Newsroom briefing per week",
      "1 basic AI skin analysis per month",
      "Limited product review access (scores & verdicts)",
      "2-minute podcast episode previews",
    ],
  },
  {
    id: "insider",
    name: "Glow Insider",
    tagline: "The full skincare intelligence toolkit",
    priceMonthly: 99,
    priceAnnual: 990,
    highlight: true,
    trialEligible: true,
    moneyBackDays: 30,
    cta: "Become an Insider",
    features: [
      "Custom AI skincare routine",
      "1 standard AI skincare analysis per week",
      "Full podcast library and show notes",
      "Full product review breakdowns",
      "Member-only ingredient deep dives",
      "30-day money-back guarantee",
    ],
  },
  {
    id: "vip",
    name: "Glow VIP",
    tagline: "Add real practitioners to your routine",
    priceMonthly: 299,
    priceAnnual: 2990,
    trialEligible: false,
    moneyBackDays: 30,
    cta: "Go VIP",
    features: [
      "Everything in Glow Insider",
      "1 virtual derm consultation per month",
      "Priority booking with SA practitioners",
      "Personalised quarterly routine review",
      "Early access to new SkinLabs tools",
      "30-day money-back guarantee",
    ],
  },
];

export const getPlan = (id: PlanId) => membershipPlans.find((plan) => plan.id === id);

/** Price to charge for a plan at a given billing interval. */
export const planPrice = (plan: MembershipPlan, interval: BillingInterval) =>
  interval === "annual" ? plan.priceAnnual : plan.priceMonthly;

/** Effective monthly cost when paying annually, for "R{x}/mo billed yearly" copy. */
export const annualMonthlyEquivalent = (plan: MembershipPlan) =>
  plan.priceAnnual > 0 ? Math.round(plan.priceAnnual / 12) : 0;
