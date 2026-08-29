export type PlanId = "explorer" | "insider" | "vip";
export type BillingInterval = "monthly" | "annual";

export interface MembershipPlan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  highlight?: boolean;
  trialEligible: boolean;
  moneyBackDays?: number;
  cta: string;
  features: string[];
}

export const ANNUAL_MONTHS_FREE = 2;
export const MONEY_BACK_GUARANTEE_DAYS = 30;

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
      "Stream 1 free podcast episode per month",
      "2 free product comparison articles per month",
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
      "Unlimited product reviews & Shelf Showdowns",
      "Spotlight brand profiles",
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

export const planPrice = (plan: MembershipPlan, interval: BillingInterval) =>
  interval === "annual" ? plan.priceAnnual : plan.priceMonthly;

export const annualMonthlyEquivalent = (plan: MembershipPlan) =>
  plan.priceAnnual > 0 ? Math.round(plan.priceAnnual / 12) : 0;
