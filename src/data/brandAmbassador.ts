/**
 * Campaign facts for the SkinLabs® Brand Ambassador Programme 2026.
 * Single source of truth for dates, numbers and claims used across the
 * /brand-ambassadors landing page and application modal — never restate
 * these inline in a component, import from here so a date/number change
 * only happens in one place.
 */

export const BA_SPOTS = 25;
export const BA_TOP_PERFORMER_SPOTS = 10;
export const BA_MIN_FOLLOWERS = "5,000";
export const BA_MAX_FOLLOWERS = "50,000";
export const BA_COMMISSION_PERCENT = "20%";

export const BA_APPLICATIONS_OPEN = "1 September 2026";
export const BA_APPLICATIONS_CLOSE = "25 September 2026";
export const BA_PROGRAMME_START = "1 October 2026";
export const BA_PROGRAMME_END = "31 December 2026";
export const BA_PROGRAMME_LENGTH = "3 months";

/**
 * Machine-checkable boundaries for the dates above, in South African
 * Standard Time (UTC+2, no DST) so "closes 25 September" means the whole
 * of that day for South African applicants regardless of a visitor's or
 * server's own timezone. Keep these in sync with BA_APPLICATIONS_OPEN/
 * BA_APPLICATIONS_CLOSE above if the campaign dates ever change.
 */
export const BA_APPLICATIONS_OPEN_AT = "2026-09-01T00:00:00+02:00";
export const BA_APPLICATIONS_CLOSE_AT = "2026-09-25T23:59:59+02:00";

export type ApplicationWindowStatus = "before" | "open" | "after";

/** Whether the advertised application window is open right now. */
export function getApplicationWindowStatus(now: Date = new Date()): ApplicationWindowStatus {
  const t = now.getTime();
  if (t < new Date(BA_APPLICATIONS_OPEN_AT).getTime()) return "before";
  if (t > new Date(BA_APPLICATIONS_CLOSE_AT).getTime()) return "after";
  return "open";
}

export const BA_NON_GUARANTEE_NOTE =
  "Subject to official programme terms and conditions. Selection, referrals, commission, retainers, products, giveaways and any future 12-month partnership are never guaranteed.";

export const FOLLOWER_RANGE_OPTIONS = [
  { value: "5000-9999", label: "5,000–9,999" },
  { value: "10000-24999", label: "10,000–24,999" },
  { value: "25000-49999", label: "25,000–49,999" },
  { value: "50000", label: "50,000" },
] as const;

export const ENGAGEMENT_LEVEL_OPTIONS = [
  { value: "low", label: "Low (under 2%)" },
  { value: "medium", label: "Medium (2–5%)" },
  { value: "high", label: "High (5%+)" },
  { value: "not_sure", label: "Not sure" },
] as const;

export const CONTENT_FREQUENCY_OPTIONS = [
  { value: "1-2", label: "1–2 pieces/month" },
  { value: "3-4", label: "3–4 pieces/month" },
  { value: "5-plus", label: "5+ pieces/month" },
  { value: "depends", label: "Depends on campaign requirements" },
] as const;

export const PARTNERSHIP_INTEREST_OPTIONS = [
  { value: "skincare_content", label: "Skincare content creation" },
  { value: "affiliate_income", label: "Affiliate income" },
  { value: "long_term_partnership", label: "Long-term partnership" },
  { value: "skinlabs_products", label: "SkinLabs® products/initiatives" },
  { value: "sa_platform_growth", label: "South African platform growth" },
  { value: "future_12_month", label: "Potential future 12-month partnership" },
  { value: "all", label: "All of the above" },
] as const;

export interface BAFaqItem {
  q: string;
  a: string;
}

export const brandAmbassadorFaqs: BAFaqItem[] = [
  {
    q: "Who can apply?",
    a: `We're looking for 25 TikTok and Instagram creators with a South African audience, an authentic communication style and content relevant to skincare, beauty, wellness or lifestyle. Applications are open from ${BA_APPLICATIONS_OPEN} to ${BA_APPLICATIONS_CLOSE}.`,
  },
  {
    q: "Do TikTok and Instagram followers count separately?",
    a: "Yes. You need 5,000–50,000 followers on TikTok AND 5,000–50,000 followers on Instagram, assessed separately. Combined follower counts across both platforms cannot be used to satisfy eligibility.",
  },
  {
    q: "Why do you need audience analytics?",
    a: "We verify audience analytics for both platforms — things like follower count, audience location, age range, reach/views and engagement — so we can confirm authentic, relevant South African audiences. This can be a screenshot from your creator/analytics dashboard, or a link where that's easier. We never ask for your password or account credentials.",
  },
  {
    q: "How does the 20% commission work?",
    a: "Selected ambassadors earn 20% recurring monthly commission on successful referrals generated through their ambassador referral pathway, subject to the official programme terms. This is a commission structure, not a fixed income, salary or passive-income guarantee.",
  },
  {
    q: "What are the programme dates?",
    a: `The founding cohort's initial programme runs for ${BA_PROGRAMME_LENGTH}, from ${BA_PROGRAMME_START} to ${BA_PROGRAMME_END}. Applications are reviewed after the ${BA_APPLICATIONS_CLOSE} closing date, with 25 creators selected for the founding cohort.`,
  },
  {
    q: "Is there a follower or performance quota?",
    a: "Specific quotas and performance targets will be defined in the official programme terms shared with selected ambassadors. We don't publish an exact number here because it may be adjusted per category and campaign needs — but working toward clear targets is part of the programme.",
  },
  {
    q: "What is the 'top 10' pathway?",
    a: `Up to ${BA_TOP_PERFORMER_SPOTS} of the best-performing ambassadors who meet or exceed the applicable quota may be offered a separate 12-month partnership with additional benefits. This pathway, its quota, selection criteria and benefits are not guaranteed and are subject to separate official terms.`,
  },
  {
    q: "Is anything about this programme guaranteed?",
    a: "No. Submitting an application does not guarantee selection. Being selected for the initial 3-month programme does not guarantee an offer of a future 12-month partnership. We never fabricate or promise income, retainers, products, giveaways or placement.",
  },
  {
    q: "When do applications close?",
    a: `Applications close on ${BA_APPLICATIONS_CLOSE}. Only 25 creators will be selected for the founding cohort, and we recommend applying early.`,
  },
];
