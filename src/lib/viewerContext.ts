/**
 * The user-aware / context-aware rules layer: which UI a given viewer should
 * see, based on login state, membership plan, trial state and ad-blocker
 * status. Pure (no React, no browser APIs) and unit tested
 * (src/lib/__tests__/viewerContext.test.ts). The React side is
 * `useViewerContext()` + `<ForViewer>` (src/hooks/use-viewer-context.tsx).
 *
 * This is presentation only, never authorization: RLS, the SECURITY DEFINER
 * RPCs and entitlements.ts's capability checks stay the real gates.
 */
import type { LadderTier } from "@/lib/entitlements";

export type AdBlockStatus = "unknown" | "blocked" | "clear";

/**
 * How many ads a viewer sees. Mirrors the live plan copy:
 *  - full  — visitors, Glow Explorer, Glow Lite (the ad-supported free tier)
 *  - light — Glow Insider (and founding members, who hold Insider): "Ad-light browsing"
 *  - none  — Glow VIP: "Ad-free browsing"
 */
export type AdPolicy = "full" | "light" | "none";

/**
 * `primary` units are the one-per-page placements an ad-light viewer still
 * sees; everything else is `secondary` (full policy only).
 */
export type AdPriority = "primary" | "secondary";

export interface ViewerFacts {
  /** Auth or membership still loading — don't commit to tier-specific UI yet. */
  loading: boolean;
  isSignedIn: boolean;
  ladderTier: LadderTier;
  isTrialing: boolean;
  isFoundingMember: boolean;
  adBlock: AdBlockStatus;
}

export const resolveAdPolicy = (facts: Pick<ViewerFacts, "ladderTier" | "isFoundingMember">): AdPolicy => {
  if (facts.ladderTier === "vip") return "none";
  if (facts.ladderTier === "insider" || facts.isFoundingMember) return "light";
  return "full";
};

export const shouldShowAd = (policy: AdPolicy | null, priority: AdPriority = "secondary"): boolean => {
  if (policy === null) return false; // still resolving: never flash an ad at a VIP
  if (policy === "none") return false;
  if (policy === "light") return priority === "primary";
  return true;
};

/**
 * Pages that stay reachable with an ad blocker on: how to fix it (pricing,
 * legal/policy pages, contact), account and billing management (a paying
 * member must always be able to reach Billing), auth flows and admin.
 */
export const AD_BLOCK_WALL_EXEMPT_PREFIXES = [
  "/pricing",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/refund-policy",
  "/community-guidelines",
  "/advertising-policy",
  "/editorial-policy",
  "/corrections-removals",
  "/contact",
  "/reset-password",
  "/dashboard",
  "/welcome",
  "/admin",
  "/marketplace/terms",
  "/marketplace/shipping-returns",
] as const;

export const isAdBlockWallExempt = (pathname: string): boolean =>
  AD_BLOCK_WALL_EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`));

/** Search/social crawlers and headless renderers never get the wall (they don't block ads; SEO must see content). */
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|lighthouse|headlesschrome|prerender/i;
export const isAutomatedAgent = (userAgent: string, webdriver: boolean): boolean => webdriver || BOT_UA.test(userAgent);

/**
 * The ad-block wall blocks content only for viewers who are shown ads as the
 * price of free access (ad policy `full`), once detection has positively
 * found a blocker, on a non-exempt page, for a real browser.
 */
export const shouldEnforceAdBlockWall = (args: {
  adPolicy: AdPolicy | null;
  adBlock: AdBlockStatus;
  pathname: string;
  isAutomated: boolean;
}): boolean =>
  args.adPolicy === "full" && args.adBlock === "blocked" && !args.isAutomated && !isAdBlockWallExempt(args.pathname);

/** Declarative audience rule for `<ForViewer when={…}>`. Every given key must match. */
export interface AudienceRule {
  signedIn?: boolean;
  /** Exact ladder tiers ("anonymous" | "free" | "glow_lite" | "insider" | "vip"). */
  tiers?: LadderTier[];
  /** Ladder tier at or above (e.g. "insider" = Insider + VIP). */
  minTier?: LadderTier;
  /** Ladder tier strictly below (e.g. "insider" = everyone who could still upgrade to Insider). */
  belowTier?: LadderTier;
  trialing?: boolean;
  adPolicy?: AdPolicy[];
  adBlock?: AdBlockStatus[];
}

const LADDER: LadderTier[] = ["anonymous", "free", "glow_lite", "insider", "vip"];
const rank = (tier: LadderTier) => LADDER.indexOf(tier);

/** `null` while the facts a rule depends on are still loading — render nothing rather than guess. */
export const matchesAudience = (facts: ViewerFacts, rule: AudienceRule): boolean | null => {
  const needsMembership =
    rule.tiers !== undefined ||
    rule.minTier !== undefined ||
    rule.belowTier !== undefined ||
    rule.trialing !== undefined ||
    rule.adPolicy !== undefined ||
    rule.signedIn !== undefined;
  if (facts.loading && needsMembership) return null;
  if (rule.signedIn !== undefined && facts.isSignedIn !== rule.signedIn) return false;
  if (rule.tiers && !rule.tiers.includes(facts.ladderTier)) return false;
  if (rule.minTier && rank(facts.ladderTier) < rank(rule.minTier)) return false;
  if (rule.belowTier && rank(facts.ladderTier) >= rank(rule.belowTier)) return false;
  if (rule.trialing !== undefined && facts.isTrialing !== rule.trialing) return false;
  if (rule.adPolicy && !rule.adPolicy.includes(resolveAdPolicy(facts))) return false;
  if (rule.adBlock && !rule.adBlock.includes(facts.adBlock)) return false;
  return true;
};
