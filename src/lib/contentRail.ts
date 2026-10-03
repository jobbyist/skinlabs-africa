/**
 * The mobile "jump to a content vertical" pill strip: its items, where it may
 * appear, and how it is ordered. Pure so the rules are unit tested.
 *
 * Presentation only, never authorization. Every destination is a public route.
 */

export type ContentRailKind =
  | "ai_skin_analysis"
  | "daily_skinny"
  | "seasonal_guides"
  | "shelf_showdown"
  | "business_solutions"
  | "practice_suite"
  | "verified_reviews"
  | "brand_spotlight"
  | "ingredient_dossier"
  | "skin_deep_podcast";

export interface ContentRailItem {
  kind: ContentRailKind;
  label: string;
  href: string;
}

export const CONTENT_RAIL_ITEMS: readonly ContentRailItem[] = [
  { kind: "ai_skin_analysis", label: "AI Skin Analysis", href: "/skynn-ai" },
  { kind: "daily_skinny", label: "The Daily Skinny", href: "/briefings" },
  { kind: "seasonal_guides", label: "Seasonal Guides", href: "/seasonals" },
  { kind: "shelf_showdown", label: "Shelf Showdown", href: "/compare" },
  { kind: "business_solutions", label: "Business Solutions", href: "/business" },
  { kind: "practice_suite", label: "Practice Suite", href: "/practice-suite" },
  { kind: "verified_reviews", label: "Verified Reviews", href: "/reviews" },
  { kind: "brand_spotlight", label: "Brand Spotlight", href: "/spotlight" },
  { kind: "ingredient_dossier", label: "Ingredient Dossier", href: "/ingredients" },
  { kind: "skin_deep_podcast", label: "The Skin Deep Podcast", href: "/podcast" },
];

/**
 * "Key pages": the home page and each vertical's own hub. Detail pages (one
 * article, one review) and task flows (SKYNN AI, pricing, dashboard) stay clear
 * so the strip never competes with reading or with the one thing being done.
 */
const KEY_PAGES: ReadonlySet<string> = new Set([
  "/",
  ...CONTENT_RAIL_ITEMS.filter((item) => item.kind !== "ai_skin_analysis").map((item) => item.href),
]);

const normalise = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

export const isContentRailPage = (pathname: string): boolean => KEY_PAGES.has(normalise(pathname));

/** The rail is members-only: it needs a signed-in viewer on a key page. */
export const shouldShowContentRail = (pathname: string, signedIn: boolean): boolean =>
  signedIn && isContentRailPage(pathname);

export const isContentRailItemActive = (pathname: string, item: ContentRailItem): boolean => {
  const path = normalise(pathname);
  return path === item.href || path.startsWith(`${item.href}/`);
};

/** Fisher–Yates; `random` is injectable for tests. Never mutates its input. */
export const shuffled = <T>(items: readonly T[], random: () => number = Math.random): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

let pageLoadOrder: ContentRailItem[] | null = null;

/**
 * One random order per page load: module state survives in-app navigation (the
 * strip must not reshuffle under the visitor's thumb on every route change) and
 * resets on a real reload.
 */
export const contentRailOrderForThisPageLoad = (random: () => number = Math.random): ContentRailItem[] => {
  if (!pageLoadOrder) pageLoadOrder = shuffled(CONTENT_RAIL_ITEMS, random);
  return pageLoadOrder;
};

/** Test hook: forget the cached order. */
export const resetContentRailOrder = () => {
  pageLoadOrder = null;
};
