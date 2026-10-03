/**
 * /welcome hands the member to SKYNN AI for step 1 ("Take the 2-minute
 * analysis"). This marker lets the analysis screen offer a way back and lets
 * /welcome resume at step 2 instead of restarting. Session-scoped, never
 * authorization.
 */
const KEY = "skinlabs_welcome_in_progress";

export const markWelcomeInProgress = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* noop */
  }
};

export const isWelcomeInProgress = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const clearWelcomeInProgress = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};
