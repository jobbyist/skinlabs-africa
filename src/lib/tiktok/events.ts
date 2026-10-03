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
  | "SubmitForm"
  | "Search"
  | "AddPaymentInfo"
  | "Purchase";

const MAP: Partial<Record<string, TikTokEventName>> = {
  pricing_view: "ViewContent",
  marketplace_add_to_cart: "AddToCart",
  signup_completed: "CompleteRegistration",
  trial_started: "StartTrial",
  checkout_started: "InitiateCheckout",
  keep_membership_viewed: "InitiateCheckout",
  keep_membership_gateway_selected: "AddPaymentInfo",
  checkout_completed: "Purchase",
  credit_pack_purchased: "Purchase",
  // Search: the event only, never the words typed (health-adjacent queries are personal information).
  site_search_result_clicked: "Search",
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

export interface TikTokContent {
  content_id: string;
  content_type: "product" | "product_group";
  content_name: string;
}

const STATIC_PAGES: Record<string, TikTokContent> = {
  "/": { content_id: "home", content_type: "product_group", content_name: "Home" },
  "/skynn-ai": { content_id: "skynn-ai-basic", content_type: "product", content_name: "Basic AI Skin Analysis" },
  "/skynn-ai/advanced": { content_id: "skynn-ai-advanced", content_type: "product", content_name: "Advanced AI Dermatology Analysis" },
  "/pricing": { content_id: "membership-plans", content_type: "product_group", content_name: "Membership plans" },
  "/routines": { content_id: "smart-routines", content_type: "product", content_name: "Smart Routines" },
  "/reviews": { content_id: "reviews", content_type: "product_group", content_name: "Product reviews" },
  "/briefings": { content_id: "briefings", content_type: "product_group", content_name: "Daily Skinny briefings" },
  "/ingredients": { content_id: "ingredients", content_type: "product_group", content_name: "Ingredient directory" },
  "/compare": { content_id: "shelf-showdown", content_type: "product_group", content_name: "Shelf Showdown" },
  "/podcast": { content_id: "podcast", content_type: "product_group", content_name: "The Skin Deep podcast" },
  "/marketplace": { content_id: "openhaus", content_type: "product_group", content_name: "OpenHaus marketplace" },
};

const SLUG_PAGES: Array<[string, string, TikTokContent["content_type"]]> = [
  ["/reviews/", "review", "product"],
  ["/ingredients/", "ingredient", "product"],
  ["/briefings/", "briefing", "product"],
  ["/podcast/", "episode", "product"],
];

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/i;

/**
 * What a ViewContent event should describe for this URL path, or null when the page isn't a
 * "key event page" (dashboard, admin, auth, legal, welcome… are never reported).
 * Only the public slug is used; query strings never get here.
 */
export const contentForPath = (pathname: string): TikTokContent | null => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const fixed = STATIC_PAGES[path];
  if (fixed) return fixed;
  for (const [prefix, kind, type] of SLUG_PAGES) {
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length);
      if (SLUG_RE.test(slug)) return { content_id: `${kind}:${slug}`, content_type: type, content_name: slug.replace(/-/g, " ") };
    }
  }
  return null;
};
