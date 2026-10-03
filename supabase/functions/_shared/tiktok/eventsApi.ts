/**
 * TikTok Events API (v1.3 /event/track/) request building — pure, no I/O, so
 * it is unit tested (src/lib/__tests__/tiktokEventsApi.test.ts) and used by
 * the `tiktok-events` edge function.
 *
 * Only the standard events below are ever forwarded; anything else is dropped.
 * Personal data never leaves in the clear: email and the account id are
 * SHA-256 hashed (lower-cased and trimmed first, as TikTok requires).
 */

export const TIKTOK_STANDARD_EVENTS = [
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "CompletePayment",
  "CompleteRegistration",
  "StartTrial",
  "Subscribe",
  "SubmitForm",
  "Search",
  "AddPaymentInfo",
  "Purchase",
] as const;

export type TikTokStandardEvent = (typeof TIKTOK_STANDARD_EVENTS)[number];

export const isTikTokStandardEvent = (value: unknown): value is TikTokStandardEvent =>
  typeof value === "string" && (TIKTOK_STANDARD_EVENTS as readonly string[]).includes(value);

export interface IncomingTikTokEvent {
  event: string;
  eventId: string;
  /** Unix seconds; falls back to now when missing or implausible. */
  eventTime?: number;
  url?: string;
  referrer?: string;
  ttclid?: string;
  ttp?: string;
  /** Only ever present for a visitor who accepted advertising cookies. */
  consent?: boolean;
  value?: number;
  currency?: string;
  contentId?: string;
  contentType?: "product" | "product_group";
  contentName?: string;
}

export interface EventContext {
  ip?: string;
  userAgent?: string;
  email?: string;
  userId?: string;
}

const EVENT_ID_RE = /^[A-Za-z0-9_.:-]{8,64}$/;
const TOKEN_RE = /^[A-Za-z0-9_.~-]{1,300}$/;

/** True only for a well-formed IPv4 or IPv6 literal; anything else is never forwarded to TikTok. */
export const isValidIp = (value: string | undefined): value is string => {
  if (!value || value.length > 45) return false;
  const v4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) return v4.slice(1).every((o) => Number(o) <= 255 && String(Number(o)) === o);
  if (!/^[0-9a-fA-F:]+$/.test(value) || !value.includes(":")) return false;
  const groups = value.split("::");
  if (groups.length > 2) return false;
  const parts = value.split(":");
  if (parts.some((g) => g.length > 4)) return false;
  const count = parts.filter((g) => g !== "").length;
  return groups.length === 2 ? count <= 7 : parts.length === 8 && count === 8;
};

export const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

const safeUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    // Query strings can carry tokens (reset links, intents); keep only the page.
    return `${u.origin}${u.pathname}`;
  } catch {
    return undefined;
  }
};

export type ValidationResult =
  | { ok: true; event: IncomingTikTokEvent & { event: TikTokStandardEvent } }
  | { ok: false; reason: string };

/** Validates untrusted client input. Requires explicit consent and a whitelisted event. */
export const validateIncomingEvent = (raw: unknown): ValidationResult => {
  if (typeof raw !== "object" || raw === null) return { ok: false, reason: "invalid_body" };
  const e = raw as Record<string, unknown>;
  if (e.consent !== true) return { ok: false, reason: "no_consent" };
  if (!isTikTokStandardEvent(e.event)) return { ok: false, reason: "unsupported_event" };
  if (typeof e.eventId !== "string" || !EVENT_ID_RE.test(e.eventId)) return { ok: false, reason: "invalid_event_id" };
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e7 ? v : undefined);
  const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : undefined);
  return {
    ok: true,
    event: {
      event: e.event,
      eventId: e.eventId,
      eventTime: num(e.eventTime),
      url: str(e.url, 2048),
      referrer: str(e.referrer, 2048),
      ttclid: typeof e.ttclid === "string" && TOKEN_RE.test(e.ttclid) ? e.ttclid : undefined,
      ttp: typeof e.ttp === "string" && TOKEN_RE.test(e.ttp) ? e.ttp : undefined,
      consent: true,
      value: num(e.value),
      currency: typeof e.currency === "string" && /^[A-Z]{3}$/.test(e.currency) ? e.currency : undefined,
      contentId: typeof e.contentId === "string" && /^[A-Za-z0-9:_.-]{1,140}$/.test(e.contentId) ? e.contentId : undefined,
      contentType: e.contentType === "product" || e.contentType === "product_group" ? e.contentType : undefined,
      contentName: str(e.contentName, 120),
    },
  };
};

export interface TrackRequestBody {
  event_source: "web";
  event_source_id: string;
  test_event_code?: string;
  data: Array<Record<string, unknown>>;
}

export const buildTrackBody = async (args: {
  pixelCode: string;
  event: IncomingTikTokEvent & { event: TikTokStandardEvent };
  context: EventContext;
  testEventCode?: string;
  nowSeconds?: number;
}): Promise<TrackRequestBody> => {
  const { pixelCode, event, context } = args;
  const now = args.nowSeconds ?? Math.floor(Date.now() / 1000);
  // Accept the browser's timestamp only if it is within the last 7 days (TikTok's own limit).
  const time = event.eventTime && event.eventTime <= now && now - event.eventTime < 7 * 86400 ? Math.floor(event.eventTime) : now;

  const user: Record<string, string> = {};
  if (context.email) user.email = await sha256Hex(context.email);
  if (context.userId) user.external_id = await sha256Hex(context.userId);
  if (event.ttclid) user.ttclid = event.ttclid;
  if (event.ttp) user.ttp = event.ttp;
  if (isValidIp(context.ip)) user.ip = context.ip;
  if (context.userAgent) user.user_agent = context.userAgent;

  const properties: Record<string, unknown> = {};
  if (event.value !== undefined && event.currency) {
    properties.value = event.value;
    properties.currency = event.currency;
  }
  if (event.contentId && event.contentType) {
    properties.contents = [
      { content_id: event.contentId, content_type: event.contentType, ...(event.contentName ? { content_name: event.contentName } : {}) },
    ];
  }

  const page: Record<string, string> = {};
  const url = safeUrl(event.url);
  const referrer = safeUrl(event.referrer);
  if (url) page.url = url;
  if (referrer) page.referrer = referrer;

  return {
    event_source: "web",
    event_source_id: pixelCode,
    ...(args.testEventCode ? { test_event_code: args.testEventCode } : {}),
    data: [
      {
        event: event.event,
        event_time: time,
        event_id: event.eventId,
        user,
        properties,
        page,
      },
    ],
  };
};
