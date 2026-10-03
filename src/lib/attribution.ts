/**
 * Campaign attribution (UTM + ttclid) for paid-traffic tests.
 *
 * What it does: when a visitor lands with `?utm_*` (or a TikTok `ttclid`) in the URL, the campaign labels are kept for
 * the browser session and attached to every conversion event, so Admin → Ads can show which campaign / ad produced a
 * landing, an analysis, a registration or a trial.
 *
 * Privacy: these are campaign labels we chose, not personal data. They live in sessionStorage only (gone when the tab
 * closes), carry a random per-session id (never a user id) and are sent only to our own `analytics_events` table and
 * Vercel Web Analytics, exactly like the other conversion events. They are NEVER forwarded to TikTok: the Events API
 * function strips query strings by design.
 *
 * Pure parsing helpers are unit tested (src/lib/__tests__/attribution.test.ts); storage is guarded for SSR / blocked storage.
 */

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];

export type Attribution = Partial<Record<UtmKey, string>> & {
  /** Random per-browser-session id so reports can count sessions, not just events. Not linked to any account. */
  attr_sid?: string;
};

const STORAGE_KEY = "skinlabs_attribution";
const LANDED_KEY = "skinlabs_attribution_landed";

/** A campaign label we'd actually write: lowercase letters, digits and `_ - . ~`, up to 80 characters. */
export const sanitizeUtmValue = (raw: unknown): string | undefined => {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return /^[a-z0-9_.~-]{1,80}$/.test(v) ? v : undefined;
};

const hasTtclid = (params: URLSearchParams): boolean => {
  const v = params.get("ttclid");
  return Boolean(v && /^[A-Za-z0-9_.~-]{1,300}$/.test(v));
};

/**
 * Campaign labels from a landing URL's query string, or null when the visit isn't campaign traffic.
 * TikTok appends `ttclid` to ad clicks; if the UTMs were forgotten we still credit tiktok / paid_social
 * (campaign "ttclid_only") rather than losing the click into "direct".
 */
export const parseAttribution = (search: string): Attribution | null => {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const found: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = sanitizeUtmValue(params.get(key));
    if (value) found[key] = value;
  }
  if (!found.utm_source && !found.utm_medium && !found.utm_campaign) {
    if (!hasTtclid(params)) return null;
    return { utm_source: "tiktok", utm_medium: "paid_social", utm_campaign: "ttclid_only" };
  }
  return found;
};

/**
 * Stable label for "this campaign + ad + keyword", used to log one landing per campaign per session.
 * `utm_term` is included so two links that differ only by term aren't collapsed into one landing. (The Admin report
 * groups by source / medium / campaign / content, so term-only variants still roll up into the same ad row there.)
 */
export const attributionSignature = (a: Attribution): string =>
  [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content, a.utm_term].map((v) => v ?? "").join("|");

const newSessionId = (): string => {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return `as_${c.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  return `as_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
};

const readStored = (): Attribution | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Attribution = {};
    for (const key of UTM_KEYS) {
      const value = sanitizeUtmValue(parsed[key]);
      if (value) out[key] = value;
    }
    if (typeof parsed.attr_sid === "string" && /^as_[a-z0-9]{8,40}$/.test(parsed.attr_sid)) out.attr_sid = parsed.attr_sid;
    return out.utm_source || out.utm_medium || out.utm_campaign ? out : null;
  } catch {
    return null;
  }
};

/** Attribution to attach to an event: whatever this session landed with, or {} for organic / direct visits. */
export const readAttribution = (): Attribution => readStored() ?? {};

/**
 * Call on app start (and on route changes — cheap). Stores campaign labels when the current URL carries them (last
 * campaign touch in the session wins) and returns them, or null for organic visits. Returns `isNewLanding` so the caller
 * can log exactly one `campaign_landing` per campaign per session.
 */
export const captureAttribution = (
  search: string = typeof window !== "undefined" ? window.location.search : "",
): { attribution: Attribution; isNewLanding: boolean } | null => {
  const fresh = parseAttribution(search);
  if (!fresh) return null;
  if (typeof window === "undefined") return { attribution: fresh, isNewLanding: false };
  try {
    const existing = readStored();
    const sameCampaign = existing && attributionSignature(existing) === attributionSignature(fresh);
    const attr_sid = existing?.attr_sid ?? newSessionId();
    const attribution: Attribution = { ...fresh, attr_sid };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    const landed = window.sessionStorage.getItem(LANDED_KEY);
    const signature = attributionSignature(attribution);
    const isNewLanding = !sameCampaign || landed !== signature;
    if (isNewLanding) window.sessionStorage.setItem(LANDED_KEY, signature);
    return { attribution, isNewLanding };
  } catch {
    // Storage blocked: still report the landing once per page load, just without session continuity.
    return { attribution: fresh, isNewLanding: true };
  }
};
