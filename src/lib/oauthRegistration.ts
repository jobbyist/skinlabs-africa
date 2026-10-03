import { NEW_ACCOUNT_WINDOW_MS } from "@/lib/intentRouting";

/**
 * Google sign-ups never pass through AuthDialog's email sign-up path (the browser leaves for Google and comes back
 * signed in), so `signup_completed` — which TikTok receives as CompleteRegistration — never fired for them.
 * IntentResolver calls this on the first signed-in render after the redirect.
 *
 * Rules (pure, tested in oauthRegistration.test.ts):
 *  - Only an account whose FIRST provider is Google (`app_metadata.provider`). Email sign-ups already fire from
 *    AuthDialog, and a member who linked Google later keeps provider "email", so neither can double count.
 *  - Only a brand-new account (created inside NEW_ACCOUNT_WINDOW_MS), so a returning Google member never counts.
 *  - Once per account per browser (dedupe key below), so a reload or a second tab inside the window can't repeat it.
 */
export const OAUTH_REGISTRATION_KEY_PREFIX = "skinlabs_reg_tracked:";

export const shouldTrackOAuthRegistration = (input: {
  provider: unknown;
  createdAt: string | null | undefined;
  alreadyTracked: boolean;
  now?: number;
}): boolean => {
  if (input.alreadyTracked) return false;
  if (input.provider !== "google") return false;
  if (!input.createdAt) return false;
  const created = new Date(input.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const age = (input.now ?? Date.now()) - created;
  return age >= 0 && age < NEW_ACCOUNT_WINDOW_MS;
};

const keyFor = (userId: string) => `${OAUTH_REGISTRATION_KEY_PREFIX}${userId}`;

export const hasTrackedOAuthRegistration = (userId: string): boolean => {
  try {
    return window.localStorage.getItem(keyFor(userId)) === "1";
  } catch {
    return false;
  }
};

export const markOAuthRegistrationTracked = (userId: string): void => {
  try {
    window.localStorage.setItem(keyFor(userId), "1");
  } catch {
    /* blocked storage: worst case a reload inside the 10-minute window repeats the event once */
  }
};
