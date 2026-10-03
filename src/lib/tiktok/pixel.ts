import { COOKIE_CONSENT_CHANGED_EVENT, getStoredCookiePreferences } from "@/lib/cookie-consent";
import { isAutomatedAgent } from "@/lib/viewerContext";
import { contentForPath, newEventId, parseTtclid, tiktokEventFor, type TikTokContent } from "@/lib/tiktok/events";
import { supabase } from "@/integrations/supabase/client";

/**
 * TikTok Pixel + Events API, behind the site's own cookie choice.
 *
 * The pixel is TikTok's standard base code, but it is injected from here instead of
 * sitting in index.html: SkinLabs' banner and Cookie Policy promise that advertising
 * technologies run only when the visitor turns on "Advertising / Targeting"
 * (`targetedAdvertising`), and POPIA expects the same. So:
 *   - nothing is loaded and no request goes to TikTok until that consent exists;
 *   - withdrawing it calls `ttq.revokeConsent()`/`disableCookie()` and stops all sending;
 *   - crawlers, headless renderers (prerender, Playwright) never load it.
 * Pixel code is public (it is in every page that uses it); the Events API access token
 * is a Supabase secret read only by the `tiktok-events` edge function.
 */
export const TIKTOK_PIXEL_ID: string =
  (import.meta.env?.VITE_TIKTOK_PIXEL_ID as string | undefined)?.trim() || "DB0DGNBC77U1FE0MB8Q0";

const TTCLID_KEY = "skinlabs_ttclid";
const TIKTOK_EVENTS_JS = "https://analytics.tiktok.com/i18n/pixel/events.js";

type Ttq = {
  load: (id: string, opts?: Record<string, unknown>) => void;
  page: () => void;
  identify?: (identity: Record<string, string>) => void;
  track: (name: string, props?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  grantConsent?: () => void;
  revokeConsent?: () => void;
  enableCookie?: () => void;
  disableCookie?: () => void;
  [key: string]: unknown;
};

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: Ttq;
  }
}

let loaded = false;
let started = false;

export const hasTikTokConsent = (): boolean => getStoredCookiePreferences()?.targetedAdvertising === true;

const shouldRun = (): boolean => {
  if (typeof window === "undefined") return false;
  if (isAutomatedAgent(navigator.userAgent, navigator.webdriver === true)) return false;
  return hasTikTokConsent();
};

type Deferred = Record<string, unknown> & { push: (call: unknown[]) => void };

/** TikTok's official base snippet, written as code. Defines window.ttq and appends events.js. */
const installSnippet = (pixelId: string) => {
  const w = window as unknown as Record<string, unknown>;
  const name = "ttq";
  w.TiktokAnalyticsObject = name;
  const ttq = (w[name] = w[name] || []) as Deferred & {
    methods?: string[];
    _i?: Record<string, unknown>;
    _t?: Record<string, number>;
    _o?: Record<string, unknown>;
  };
  const methods = [
    "page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group",
    "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent",
  ];
  ttq.methods = methods;
  // Until events.js arrives, every method just queues its call.
  const defer = (target: Deferred) => {
    for (const m of methods) target[m] = (...args: unknown[]) => target.push([m, ...args]);
  };
  defer(ttq);
  ttq._i = ttq._i || {};
  ttq._i[pixelId] = [];
  (ttq._i[pixelId] as Record<string, unknown>)._u = TIKTOK_EVENTS_JS;
  ttq._t = { ...(ttq._t || {}), [pixelId]: Date.now() };
  ttq._o = { ...(ttq._o || {}), [pixelId]: {} };
  const script = document.createElement("script");
  script.async = true;
  script.src = `${TIKTOK_EVENTS_JS}?sdkid=${encodeURIComponent(pixelId)}&lib=${name}`;
  const first = document.getElementsByTagName("script")[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);
};

const rememberTtclid = () => {
  const id = parseTtclid(window.location.search);
  if (!id) return;
  try {
    window.sessionStorage.setItem(TTCLID_KEY, id);
  } catch {
    /* ignore */
  }
};

const readTtclid = (): string | undefined => {
  try {
    return window.sessionStorage.getItem(TTCLID_KEY) ?? parseTtclid(window.location.search) ?? undefined;
  } catch {
    return parseTtclid(window.location.search) ?? undefined;
  }
};

const readTtp = (): string | undefined => {
  const m = document.cookie.match(/(?:^|;\s*)_ttp=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

let identifiedFor: string | null = null;
let lastReportedPath: string | null = null;

/**
 * Advanced matching: for a signed-in member who accepted advertising cookies, tell the pixel
 * who they are with SHA-256 hashes only (email + account id), computed here in the browser.
 * Phone numbers are deliberately not sent. Called before events so they carry the identity.
 */
export const identifyTikTokUser = async (): Promise<void> => {
  try {
    if (!loaded || !shouldRun()) return;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user || identifiedFor === user.id) return;
    identifiedFor = user.id;
    const identity: Record<string, string> = { external_id: await sha256Hex(user.id) };
    if (user.email) identity.email = await sha256Hex(user.email);
    window.ttq?.identify?.(identity);
  } catch {
    /* identity is optional */
  }
};

/** Loads the pixel once (consent already checked by the caller) and sends the first page view. */
const load = () => {
  if (loaded) return;
  loaded = true;
  rememberTtclid();
  installSnippet(TIKTOK_PIXEL_ID);
  window.ttq?.enableCookie?.();
  window.ttq?.grantConsent?.();
  window.ttq?.page();
  void identifyTikTokUser();
  reportContent(window.location.pathname);
};

/** Re-evaluates consent: loads on grant, switches everything off on withdrawal. */
export const syncTikTokConsent = (): void => {
  if (typeof window === "undefined") return;
  if (shouldRun()) {
    if (!loaded) load();
    else {
      window.ttq?.enableCookie?.();
      window.ttq?.grantConsent?.();
      void identifyTikTokUser();
    }
  } else if (loaded) {
    window.ttq?.revokeConsent?.();
    window.ttq?.disableCookie?.();
    identifiedFor = null;
  }
};

/** Mount once. Listens for consent changes (banner, preferences panel, profile sync). */
export const startTikTokPixel = (): (() => void) => {
  if (typeof window === "undefined" || started) return () => {};
  started = true;
  syncTikTokConsent();
  const onChange = () => syncTikTokConsent();
  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    started = false;
  };
};

type ConversionPayload = Record<string, string | number | boolean | undefined>;

const moneyFrom = (payload: ConversionPayload): { value: number; currency: string } | null => {
  const value = typeof payload.value === "number" ? payload.value : typeof payload.amount === "number" ? payload.amount : null;
  const currency = typeof payload.currency === "string" ? payload.currency.toUpperCase() : "ZAR";
  return value !== null && value >= 0 && /^[A-Z]{3}$/.test(currency) ? { value, currency } : null;
};

/** Browser event + matching server event (same event_id). Caller has already checked consent. */
const sendEvent = (name: string, content: TikTokContent | null, money: { value: number; currency: string } | null) => {
  void identifyTikTokUser().finally(() => {
    const eventId = newEventId();
    window.ttq?.track(
      name,
      {
        ...(content ? { contents: [content] } : {}),
        ...(money ?? {}),
      },
      { event_id: eventId },
    );
    // supabase-js attaches the signed-in user's JWT itself; the function derives the email from it.
    void supabase.functions
      .invoke("tiktok-events", {
        body: {
          event: name,
          eventId,
          eventTime: Math.floor(Date.now() / 1000),
          url: window.location.href,
          referrer: document.referrer || undefined,
          ttclid: readTtclid(),
          ttp: readTtp(),
          consent: true,
          contentId: content?.content_id,
          contentType: content?.content_type,
          contentName: content?.content_name,
          ...(money ?? {}),
        },
      })
      .catch(() => undefined);
  });
};

function reportContent(pathname: string): void {
  if (lastReportedPath === pathname) return;
  lastReportedPath = pathname;
  const content = contentForPath(pathname);
  if (content) sendEvent("ViewContent", content, null);
}

/** SPA navigation → a page view, plus ViewContent on the key event pages (home, /skynn-ai, reviews…). */
export const trackTikTokPageView = (pathname: string = window.location.pathname): void => {
  try {
    if (!loaded || !shouldRun()) return;
    if (lastReportedPath !== pathname) window.ttq?.page();
    reportContent(pathname);
  } catch {
    /* never break navigation */
  }
};

/**
 * Forwarded from trackConversionEvent(). No-op without consent or for events TikTok
 * doesn't need. Never throws, never awaited by the caller.
 */
export const forwardConversionToTikTok = (event: string, payload: ConversionPayload = {}): void => {
  try {
    const name = tiktokEventFor(event);
    if (!name || !shouldRun()) return;
    if (!loaded) load();
    const path = window.location.pathname;
    // Page context only (never the search words, answers or anything typed by the visitor).
    sendEvent(name, contentForPath(path), moneyFrom(payload));
  } catch {
    /* analytics must never break the feature it measures */
  }
};
