import type { PlanId } from "@/data/plans";

/**
 * Durable "pending intent": what a visitor was trying to do when they hit the
 * sign-in wall, carried through authentication so it can be resumed afterwards
 * by <IntentResolver /> (src/components/IntentResolver.tsx).
 *
 *   trial         start a free trial of `plan`
 *   subscribe     open membership checkout for `plan`/`interval`
 *   save_analysis go back to `returnTo` (SKYNN AI attaches the local result there)
 *   unlock        go back to `returnTo` (e.g. the locked review they came from)
 *
 * It has to outlive React state: a page refresh mid-signup, a full-page Google
 * OAuth redirect (same tab, via sessionStorage), and — best effort — an
 * email-confirmation link opened in another tab (via the URL-param channel,
 * see withPendingIntentParams()).
 *
 * IMPORTANT: this is a UX convenience only and never authorization. Plans are
 * re-validated server-side (start_free_trial(), paypal-payment/payfast-payment
 * price purely from pricing_plans). A tampered intent can only make those
 * reject the request, or send the visitor to a same-origin path.
 */

export type PendingIntentAction = "trial" | "subscribe" | "save_analysis" | "unlock";
export type PendingIntentInterval = "monthly" | "annual";

export interface PendingIntent {
  action: PendingIntentAction;
  plan?: PlanId;
  interval?: PendingIntentInterval;
  variantKey?: string;
  /** Same-origin relative path (with optional query/hash) to resume on. */
  returnTo: string;
  ts: number;
}

export type NewPendingIntent = Omit<PendingIntent, "ts">;

const STORAGE_KEY = "skinlabs_pending_intent";
/** Pre-overhaul key from src/lib/pendingPlan.ts — cleared alongside the new one. */
const LEGACY_STORAGE_KEY = "skinlabs_pending_plan";
const URL_PREFIX = "pi";
const URL_KEYS = ["action", "plan", "interval", "variant", "return", "ts"].map((k) => `${URL_PREFIX}_${k}`);
const LEGACY_URL_KEYS = ["kind", "id", "interval", "variant"].map((k) => `pending_plan_${k}`);

/** Discard anything older than this — a stale intent from a long-abandoned tab shouldn't fire later. */
export const PENDING_INTENT_MAX_AGE_MS = 30 * 60 * 1000;
/** Clock-skew allowance for a `ts` slightly in the future; anything further ahead is treated as tampered. */
const MAX_FUTURE_SKEW_MS = 60 * 1000;
const MAX_RETURN_TO_LENGTH = 512;

const ACTIONS: readonly PendingIntentAction[] = ["trial", "subscribe", "save_analysis", "unlock"];
/** Plans an intent may name. Explorer is free — there is nothing to trial or buy. */
const INTENT_PLANS: readonly PlanId[] = ["glow_lite", "insider", "vip"];
const VARIANT_KEY_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const PLACEHOLDER_ORIGIN = "https://intent.invalid";

/**
 * True only for a same-origin relative path: starts with a single "/", no
 * protocol-relative ("//host") or backslash tricks, no control characters, and
 * resolving it against a placeholder origin never leaves that origin.
 */
export const isSafeReturnTo = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_RETURN_TO_LENGTH) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  // Backslashes are normalised to "/" by browsers ("/\evil.com" → "//evil.com").
  if (value.includes("\\")) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    return new URL(value, PLACEHOLDER_ORIGIN).origin === PLACEHOLDER_ORIGIN;
  } catch {
    return false;
  }
};

const isAction = (value: unknown): value is PendingIntentAction =>
  typeof value === "string" && (ACTIONS as readonly string[]).includes(value);

const isIntentPlan = (value: unknown): value is PlanId =>
  typeof value === "string" && (INTENT_PLANS as readonly string[]).includes(value);

/**
 * Validates an untrusted, already-decoded object (from sessionStorage or the
 * URL). Returns null for anything malformed, tampered, expired or from the
 * future — never a partially-trusted intent.
 */
export const parsePendingIntent = (raw: unknown, now: number = Date.now()): PendingIntent | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  if (!isAction(r.action)) return null;
  if (!isSafeReturnTo(r.returnTo)) return null;

  const ts = typeof r.ts === "number" ? r.ts : typeof r.ts === "string" && /^\d{1,15}$/.test(r.ts) ? Number(r.ts) : NaN;
  if (!Number.isFinite(ts)) return null;
  if (ts > now + MAX_FUTURE_SKEW_MS) return null;
  if (now - ts > PENDING_INTENT_MAX_AGE_MS) return null;

  const needsPlan = r.action === "trial" || r.action === "subscribe";
  if (needsPlan && !isIntentPlan(r.plan)) return null;
  if (!needsPlan && r.plan !== undefined && r.plan !== null && !isIntentPlan(r.plan)) return null;

  if (r.interval !== undefined && r.interval !== null && r.interval !== "monthly" && r.interval !== "annual") return null;
  if (r.variantKey !== undefined && r.variantKey !== null && (typeof r.variantKey !== "string" || !VARIANT_KEY_PATTERN.test(r.variantKey))) {
    return null;
  }

  const intent: PendingIntent = { action: r.action, returnTo: r.returnTo, ts };
  if (isIntentPlan(r.plan)) intent.plan = r.plan;
  if (needsPlan) intent.interval = r.interval === "annual" ? "annual" : "monthly";
  if (needsPlan) intent.variantKey = typeof r.variantKey === "string" ? r.variantKey : "control";
  return intent;
};

/** Reads the URL channel's params into the raw shape parsePendingIntent() expects. */
export const pendingIntentFromSearchParams = (params: URLSearchParams): Record<string, unknown> | null => {
  const action = params.get(`${URL_PREFIX}_action`);
  if (!action) return null;
  return {
    action,
    plan: params.get(`${URL_PREFIX}_plan`) ?? undefined,
    interval: params.get(`${URL_PREFIX}_interval`) ?? undefined,
    variantKey: params.get(`${URL_PREFIX}_variant`) ?? undefined,
    returnTo: params.get(`${URL_PREFIX}_return`) ?? undefined,
    ts: params.get(`${URL_PREFIX}_ts`) ?? undefined,
  };
};

export const setPendingIntent = (intent: NewPendingIntent): boolean => {
  const full = parsePendingIntent({ ...intent, ts: Date.now() });
  if (!full) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    return true;
  } catch {
    // Private browsing / storage disabled — the URL channel still carries it through redirects.
    return false;
  }
};

const readFromSessionStorage = (now: number): PendingIntent | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? parsePendingIntent(JSON.parse(raw), now) : null;
  } catch {
    return null;
  }
};

const readFromUrl = (now: number): PendingIntent | null => {
  if (typeof window === "undefined") return null;
  const raw = pendingIntentFromSearchParams(new URLSearchParams(window.location.search));
  return raw ? parsePendingIntent(raw, now) : null;
};

/** sessionStorage first (same tab), then the URL channel (new tab after an email link). */
export const getPendingIntent = (now: number = Date.now()): PendingIntent | null =>
  readFromSessionStorage(now) ?? readFromUrl(now);

export const clearPendingIntent = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined" && window.history?.replaceState) {
    const url = new URL(window.location.href);
    let touched = false;
    for (const key of [...URL_KEYS, ...LEGACY_URL_KEYS]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        touched = true;
      }
    }
    if (touched) window.history.replaceState(window.history.state, "", url.toString());
  }
};

/** Read-and-clear: an intent runs at most once. */
export const consumePendingIntent = (now: number = Date.now()): PendingIntent | null => {
  const intent = getPendingIntent(now);
  clearPendingIntent();
  return intent;
};

/**
 * Appends the intent to an OAuth / email-confirmation redirect URL so it
 * survives a new tab or browser context. The same validation applies on the
 * way back in, so a hand-edited link is simply ignored.
 */
export const withPendingIntentParams = (redirectUrl: string, intent: PendingIntent | null): string => {
  if (!intent) return redirectUrl;
  const url = new URL(redirectUrl);
  url.searchParams.set(`${URL_PREFIX}_action`, intent.action);
  if (intent.plan) url.searchParams.set(`${URL_PREFIX}_plan`, intent.plan);
  if (intent.interval) url.searchParams.set(`${URL_PREFIX}_interval`, intent.interval);
  if (intent.variantKey) url.searchParams.set(`${URL_PREFIX}_variant`, intent.variantKey);
  url.searchParams.set(`${URL_PREFIX}_return`, intent.returnTo);
  url.searchParams.set(`${URL_PREFIX}_ts`, String(intent.ts));
  return url.toString();
};

/** Current location as a returnTo value (path + query + hash), minus any intent params. */
export const currentReturnTo = (): string => {
  if (typeof window === "undefined") return "/";
  const url = new URL(window.location.href);
  for (const key of [...URL_KEYS, ...LEGACY_URL_KEYS]) url.searchParams.delete(key);
  const value = `${url.pathname}${url.search}${url.hash}`;
  return isSafeReturnTo(value) ? value : "/";
};
