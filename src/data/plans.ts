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

/** Canonical free-tier quotas — keep in sync with src/lib/access-quotas.ts */
export const PODCAST_FREE_MONTHLY = 1;
export const COMPARE_FREE_MONTHLY = 2;
/** Every visitor — signed out, or signed in on Glow Explorer — gets this many full Daily Skinny briefings per rolling 7 days. */
export const DAILY_SKINNY_FREE_WEEKLY = 3;

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
      `${DAILY_SKINNY_FREE_WEEKLY} full Daily Skinny briefings per week — no account required`,
      "1 basic AI skin analysis per month",
      "Limited product review access (scores & verdicts)",
      `Stream ${PODCAST_FREE_MONTHLY} free podcast episode per month`,
      `${COMPARE_FREE_MONTHLY} free product comparison articles per month`,
      "Public Spotlight ranking (profiles locked)",
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
      "Full Spotlight brand profiles",
      "Practitioner directory access",
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
      "Intelligent Routine Builder on every product review page",
      "1 virtual derm consultation per month",
      "Priority booking with SA practitioners",
      "Personalised quarterly routine review",
      "Early access to new SkinLabs tools",
      "Ad-free & Offline Browsing",
      "Native Mobile App functionality",
      "Marketplace Loyalty Rewards",
      "VIP Badge Next To Your Username In Discussion Forums & Comments",
      "30-day money-back guarantee",
    ],
  },
];

export const getPlan = (id: PlanId) => membershipPlans.find((plan) => plan.id === id);

export const planPrice = (plan: MembershipPlan, interval: BillingInterval) =>
  interval === "annual" ? plan.priceAnnual : plan.priceMonthly;

export const annualMonthlyEquivalent = (plan: MembershipPlan) =>
  plan.priceAnnual > 0 ? Math.round(plan.priceAnnual / 12) : 0;
