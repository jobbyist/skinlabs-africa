/**
 * Pure rules for push-send (no Deno / network imports so bun tests can run them).
 */

export const PUSH_CATEGORIES = ["podcast_episode", "briefing", "routine_reminder", "account_update", "promotional", "service"] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];

export interface PreferenceRow {
  user_id: string;
  podcast_episode?: boolean;
  briefing?: boolean;
  routine_reminder?: boolean;
  account_update?: boolean;
  promotional?: boolean;
  service?: boolean;
}

/**
 * Whether a member may be sent this category. A member with no preference row gets only the
 * essential defaults (account + service). `promotional` requires an explicit stored opt-in:
 * a missing value is "no".
 */
export const categoryAllowed = (prefs: PreferenceRow | undefined, category: PushCategory): boolean => {
  if (!prefs) return category === "account_update" || category === "service";
  return prefs[category] === true;
};

export interface SendRequest {
  category: PushCategory;
  title: string;
  body: string;
  url: string;
  tag?: string;
  userIds?: string[];
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Same-origin relative path only. */
export const sanitizePath = (value: unknown): string => {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/start";
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/start";
  return value.slice(0, 300);
};

export const parseSendRequest = (raw: unknown): { ok: true; request: SendRequest } | { ok: false; reason: string } => {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "invalid_body" };
  const r = raw as Record<string, unknown>;
  if (!(PUSH_CATEGORIES as readonly string[]).includes(r.category as string)) return { ok: false, reason: "invalid_category" };
  const title = clip(r.title, 80);
  const body = clip(r.body, 240);
  if (!title || !body) return { ok: false, reason: "title_and_body_required" };
  let userIds: string[] | undefined;
  if (r.user_ids !== undefined) {
    if (!Array.isArray(r.user_ids) || r.user_ids.length > 1000 || !r.user_ids.every((u) => typeof u === "string" && /^[0-9a-f-]{36}$/i.test(u))) {
      return { ok: false, reason: "invalid_user_ids" };
    }
    userIds = r.user_ids as string[];
  }
  return {
    ok: true,
    request: { category: r.category as PushCategory, title, body, url: sanitizePath(r.url), tag: clip(r.tag, 60) || undefined, userIds },
  };
};

/** Delivery failures that mean the subscription is permanently gone (browser said so). */
export const isGoneStatus = (status: number | undefined): boolean => status === 404 || status === 410;

export const MAX_CONSECUTIVE_FAILURES = 5;
