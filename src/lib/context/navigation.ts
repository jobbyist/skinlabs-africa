import { deriveContextStates } from "./states";
import type { ContextFacts } from "./types";

/**
 * Context-aware emphasis for the mobile bottom navigation. Nothing is removed
 * from the site: the header menu always carries every destination. This only
 * chooses which five destinations get a permanent slot.
 *
 *  - default (visitors, members with no skin profile yet): the public content
 *    tabs, which is what first-time traffic wants.
 *  - a member with a skin profile: Home · My Skin · Routine · Explore · Account.
 *    "Explore" opens the menu's Explore grid (news, stream, reviews, compare…).
 */
export type NavTabId = "home" | "news" | "stream" | "reviews" | "compare" | "my_skin" | "routine" | "explore" | "community" | "account";

export interface NavTab {
  id: NavTabId;
  label: string;
  /** Link destination; absent for "explore", which opens the menu. */
  href?: string;
  /** Does this tab count as current for the pathname (+ search)? Data, so it stays testable. */
  matchPrefixes: string[];
  /** Match exactly (home). */
  exact?: boolean;
  /** For the dashboard tabs: the ?tab= leaf values that belong to it. */
  dashboardSections?: string[];
}

const TAB: Record<NavTabId, NavTab> = {
  home: { id: "home", label: "Home", href: "/", matchPrefixes: ["/"], exact: true },
  news: { id: "news", label: "News", href: "/briefings", matchPrefixes: ["/briefings", "/newsroom"] },
  stream: { id: "stream", label: "Stream", href: "/podcast", matchPrefixes: ["/podcast", "/stream"] },
  reviews: { id: "reviews", label: "Reviews", href: "/reviews", matchPrefixes: ["/reviews"] },
  compare: { id: "compare", label: "Compare", href: "/compare", matchPrefixes: ["/compare"] },
  my_skin: { id: "my_skin", label: "My Skin", href: "/dashboard?tab=analysis", matchPrefixes: ["/skynn-ai"], dashboardSections: ["analysis", "journey"] },
  routine: { id: "routine", label: "Routine", href: "/dashboard?tab=routine", matchPrefixes: ["/routines"], dashboardSections: ["routine"] },
  explore: {
    id: "explore",
    label: "Explore",
    matchPrefixes: ["/briefings", "/podcast", "/reviews", "/compare", "/ingredients", "/spotlight", "/seasonals", "/knowledge-hub", "/newsroom", "/stream"],
  },
  community: { id: "community", label: "Forum", href: "/community-forum", matchPrefixes: ["/community-forum"] },
  account: { id: "account", label: "Account", href: "/dashboard", matchPrefixes: [], dashboardSections: ["home", "saved", "inbox", "profile", "billing", "security", "app", "account"] },
};

export const DEFAULT_NAV: NavTab[] = [TAB.home, TAB.news, TAB.stream, TAB.reviews, TAB.compare];
export const PROFILE_NAV: NavTab[] = [TAB.home, TAB.my_skin, TAB.routine, TAB.explore, TAB.account];

export const contextualNavigation = (f: ContextFacts): NavTab[] => {
  const s = deriveContextStates(f);
  const base = f.journey.signedIn && s.has("BASIC_ANALYSIS_COMPLETED") ? PROFILE_NAV : DEFAULT_NAV;
  // The community is members-only, so it only gets a slot once signed in: before the Account tab for members with a
  // skin profile, at the end of the content tabs otherwise (the bottom nav appends Profile after those).
  if (!f.journey.signedIn) return base;
  return base === PROFILE_NAV ? [...base.slice(0, -1), TAB.community, TAB.account] : [...base, TAB.community];
};

export const isNavTabActive = (tab: NavTab, pathname: string, dashboardSection: string | null): boolean => {
  if (tab.dashboardSections) {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return tab.dashboardSections.includes(dashboardSection ?? "home");
    return tab.matchPrefixes.some((p) => pathname.startsWith(p));
  }
  if (tab.exact) return tab.matchPrefixes.includes(pathname);
  return tab.matchPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};
