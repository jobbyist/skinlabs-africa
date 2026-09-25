/**
 * startFreeTrial() (src/lib/trial.ts) maps the start_free_trial RPC's
 * "Free trial already used" to "You've already used your free trial on this
 * account." — both match here, so callers can offer Subscribe instead.
 */
export const isTrialAlreadyUsedError = (message: string | null | undefined): boolean =>
  /already used/i.test(message ?? "");
