/**
 * Pure routing rules for <IntentResolver /> — kept out of the component so
 * they're unit-testable (src/lib/__tests__/intentRouting.test.ts).
 */

/** An account counts as brand new for this long after auth.users.created_at. */
export const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Where a brand-new account with no pending intent lands after sign-up.
 * TODO(onboarding overhaul 07): switch to "/welcome" once that route exists.
 */
export const WELCOME_PATH = "/dashboard";

/** Where a newly started trial lands (useStartTrial). Follows WELCOME_PATH, so it becomes /welcome?trial=started when prompt 07 adds that route. */
export const TRIAL_STARTED_PATH = `${WELCOME_PATH}?trial=started`;

export const isNewAccount = (
  createdAt: string | null | undefined,
  onboardingCompletedAt: string | null | undefined,
  now: number = Date.now(),
): boolean => {
  if (onboardingCompletedAt) return false;
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created >= 0 && now - created < NEW_ACCOUNT_WINDOW_MS;
};

/**
 * Pages a new account must never be pulled away from: where they already
 * are the destination, or where they're in the middle of something else.
 */
const NO_WELCOME_REDIRECT_PREFIXES = ["/dashboard", "/welcome", "/reset-password", "/admin", "/skynn-ai"];

export const shouldRedirectNewAccount = (pathname: string): boolean =>
  !NO_WELCOME_REDIRECT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * After a resumed trial starts: go back to the page the visitor came from
 * (e.g. the review that's now unlocked), unless that was just the pricing
 * page or home, in which case the dashboard's trial-welcome flow is the
 * useful next step.
 */
export const trialDestination = (returnTo: string): string => {
  const path = returnTo.split(/[?#]/)[0];
  return path === "/" || path === "/pricing" ? TRIAL_STARTED_PATH : returnTo;
};
