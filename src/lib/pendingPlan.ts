import type { PlanId } from "@/data/plans";

/**
 * Durable "pending plan intent" — carries a membership/trial selection made
 * on /pricing (or anywhere else) through the authentication step, so a
 * visitor who picks "Glow VIP -> Start Free Trial" never has to re-select
 * the plan after creating an account.
 *
 * This has to survive more than a React state variable does:
 *   - a page refresh mid-signup
 *   - a full-page OAuth redirect to Google and back (same tab)
 *   - (best-effort) an email-confirmation link opened in a new tab, via the
 *     query-string channel below
 *
 * IMPORTANT: this is a UX convenience only. It is never trusted as
 * authorization — the plan is re-validated server-side on activation
 * (start_free_trial() RPC for trials; the payfast-payment/paypal-payment edge functions,
 * which prices purely from the pricing_plans table, for paid checkout).
 * A tampered or invented plan id here just makes the RPC/edge function
 * reject the request, exactly as it would for a legitimate but stale one.
 */

const STORAGE_KEY = "skinlabs_pending_plan";
const URL_PREFIX = "pending_plan";
/** Discard anything older than this — a stale intent from a long-abandoned tab shouldn't fire later. */
const MAX_AGE_MS = 30 * 60 * 1000;

const VALID_PLAN_IDS: readonly PlanId[] = ["explorer", "glow_lite", "insider", "vip"];
const VALID_KINDS = ["trial", "subscribe"] as const;

export type PendingPlanKind = (typeof VALID_KINDS)[number];

export interface PendingPlanIntent {
  kind: PendingPlanKind;
  plan: PlanId;
  interval?: "monthly" | "annual";
  variantKey?: string;
  ts: number;
}

const isValidPlanId = (value: unknown): value is PlanId =>
  typeof value === "string" && (VALID_PLAN_IDS as readonly string[]).includes(value);

const isValidKind = (value: unknown): value is PendingPlanKind =>
  typeof value === "string" && (VALID_KINDS as readonly string[]).includes(value);

export const setPendingPlanIntent = (intent: Omit<PendingPlanIntent, "ts">) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...intent, ts: Date.now() }));
  } catch {
    // Private browsing / storage disabled — the in-page onAuthenticated callback still covers the same-tab case.
  }
};

export const clearPendingPlanIntent = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined" && window.history?.replaceState) {
    const url = new URL(window.location.href);
    let touched = false;
    for (const key of [`${URL_PREFIX}_kind`, `${URL_PREFIX}_id`, `${URL_PREFIX}_interval`, `${URL_PREFIX}_variant`]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        touched = true;
      }
    }
    if (touched) window.history.replaceState({}, "", url.toString());
  }
};

const readFromSessionStorage = (): PendingPlanIntent | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingPlanIntent>;
    if (!isValidKind(parsed.kind) || !isValidPlanId(parsed.plan) || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null;
    return {
      kind: parsed.kind,
      plan: parsed.plan,
      interval: parsed.interval === "annual" ? "annual" : "monthly",
      variantKey: typeof parsed.variantKey === "string" ? parsed.variantKey : "control",
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
};

/** Fallback channel for cross-tab flows (email confirmation links) — read once, then let the caller clear it. */
const readFromUrl = (): PendingPlanIntent | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const kind = params.get(`${URL_PREFIX}_kind`);
  const plan = params.get(`${URL_PREFIX}_id`);
  if (!isValidKind(kind) || !isValidPlanId(plan)) return null;
  return {
    kind,
    plan,
    interval: params.get(`${URL_PREFIX}_interval`) === "annual" ? "annual" : "monthly",
    variantKey: params.get(`${URL_PREFIX}_variant`) ?? "control",
    ts: Date.now(),
  };
};

export const getPendingPlanIntent = (): PendingPlanIntent | null => readFromSessionStorage() ?? readFromUrl();

/** Appends the pending intent to a redirect URL used for OAuth/email-confirmation so it survives a new tab/context. */
export const withPendingPlanParams = (redirectUrl: string, intent: PendingPlanIntent | null): string => {
  if (!intent) return redirectUrl;
  const url = new URL(redirectUrl);
  url.searchParams.set(`${URL_PREFIX}_kind`, intent.kind);
  url.searchParams.set(`${URL_PREFIX}_id`, intent.plan);
  url.searchParams.set(`${URL_PREFIX}_interval`, intent.interval ?? "monthly");
  url.searchParams.set(`${URL_PREFIX}_variant`, intent.variantKey ?? "control");
  return url.toString();
};
