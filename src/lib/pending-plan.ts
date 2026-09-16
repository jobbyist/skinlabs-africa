/**
 * Manages pending plan intent across the authentication flow.
 * 
 * When a user selects a membership plan before authenticating, this module
 * preserves their selection through:
 * - OAuth redirects (Google sign-in)
 * - Magic link email verification
 * - Page refreshes
 * - Email verification flows
 * 
 * The pending plan is stored in sessionStorage for UX continuity and is also
 * embedded in URL parameters for OAuth/magic link redirects. This is purely
 * for preserving user intent - the actual membership provisioning still happens
 * server-side via the start_free_trial() RPC, which validates the plan.
 * 
 * Security: The client-side pending plan is NEVER trusted for granting access.
 * It's only used to:
 * 1. Show appropriate UI during signup
 * 2. Pass the user's selection to the server for validation
 * 3. Direct the post-auth flow to the correct provisioning step
 */

const STORAGE_KEY = "skinlabs_pending_plan";
const STORAGE_EXPIRY_KEY = "skinlabs_pending_plan_expiry";
const EXPIRY_HOURS = 2;

export type PendingPlanId = "insider" | "glow_lite";

export interface PendingPlan {
  plan: PendingPlanId;
  timestamp: number;
}

export const setPendingPlan = (plan: PendingPlanId): void => {
  const pending: PendingPlan = { plan, timestamp: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  sessionStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000));
};

export const getPendingPlan = (): PendingPlanId | null => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const expiry = sessionStorage.getItem(STORAGE_EXPIRY_KEY);
  
  if (!stored || !expiry) return null;
  
  if (Date.now() > parseInt(expiry, 10)) {
    clearPendingPlan();
    return null;
  }
  
  try {
    const pending: PendingPlan = JSON.parse(stored);
    if (pending.plan === "insider" || pending.plan === "glow_lite") {
      return pending.plan;
    }
  } catch {
    // Invalid data, clear it
  }
  return null;
};

export const clearPendingPlan = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_EXPIRY_KEY);
};
