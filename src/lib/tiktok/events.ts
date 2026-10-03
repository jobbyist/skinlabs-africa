import type { ConversionEvent } from "@/lib/analytics-events";

/**
 * SkinLabs conversion event → TikTok standard event. Pure and unit tested.
 *
 * Deliberately short: only moments that mean something to TikTok's ad
 * optimisation. Everything else (per-question quiz steps, dashboard clicks,
 * admin events…) stays in Vercel Analytics / analytics_events and is never sent.
 * No skin-analysis content, answers or health details are ever part of a payload.
 */
export type TikTokEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "CompletePayment"
  | "CompleteRegistration"
  | "StartTrial"
  | "Subscribe"
  | "SubmitForm";

const MAP: Partial<Record<string, TikTokEventName>> = {
  pricing_view: "ViewContent",
  marketplace_add_to_cart: "AddToCart",
  signup_completed: "CompleteRegistration",
  trial_started: "StartTrial",
  checkout_started: "InitiateCheckout",
  keep_membership_viewed: "InitiateCheckout",
  checkout_completed: "CompletePayment",
  credit_pack_purchased: "CompletePayment",
  subscription_started: "Subscribe",
  keep_membership_completed: "Subscribe",
  newsletter_confirmed: "SubmitForm",
  partner_enquiry_submitted: "SubmitForm",
  brand_request_submitted: "SubmitForm",
};

export const tiktokEventFor = (event: ConversionEvent | string): TikTokEventName | null => MAP[event] ?? null;

/** Fresh id shared by the browser pixel call and the server call, so TikTok de-duplicates them. */
export const newEventId = (): string => {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return `sl_${c.randomUUID()}`;
  return `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
};

/** ttclid from a landing URL (`?ttclid=…`); only a conservative token shape is accepted. */
export const parseTtclid = (search: string): string | null => {
  try {
    const v = new URLSearchParams(search).get("ttclid");
    return v && /^[A-Za-z0-9_.~-]{1,300}$/.test(v) ? v : null;
  } catch {
    return null;
  }
};
