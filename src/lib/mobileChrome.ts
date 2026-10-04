/**
 * Mobile chrome rules (onboarding overhaul 10). The story rail is 96px of fixed
 * chrome above the header on phones; on task-focused pages (choosing a plan,
 * first-run onboarding, the SKYNN AI flow, the dashboard) it competes with the
 * one thing the visitor came to do, so it's hidden there along with its spacer.
 */
const NO_STORY_RAIL_PREFIXES = ["/pricing", "/welcome", "/skynn-ai", "/dashboard", "/giveaways"];

export const showStoryRail = (pathname: string): boolean =>
  !NO_STORY_RAIL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
