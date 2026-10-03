import { COOKIE_CONSENT_CHANGED_EVENT, getStoredCookiePreferences } from "@/lib/cookie-consent";
import { isAutomatedAgent } from "@/lib/viewerContext";
import { newEventId, parseTtclid, tiktokEventFor } from "@/lib/tiktok/events";
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

/** Loads the pixel once (consent already checked by the caller) and sends the first page view. */
const load = () => {
  if (loaded) return;
  loaded = true;
  rememberTtclid();
  installSnippet(TIKTOK_PIXEL_ID);
  window.ttq?.enableCookie?.();
  window.ttq?.grantConsent?.();
  window.ttq?.page();
};

/** Re-evaluates consent: loads on grant, switches everything off on withdrawal. */
export const syncTikTokConsent = (): void => {
  if (typeof window === "undefined") return;
  if (shouldRun()) {
    if (!loaded) load();
    else {
      window.ttq?.enableCookie?.();
      window.ttq?.grantConsent?.();
    }
  } else if (loaded) {
    window.ttq?.revokeConsent?.();
    window.ttq?.disableCookie?.();
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

/** SPA navigation → one more page view (the first one is sent by load()). */
export const trackTikTokPageView = (): void => {
  if (!loaded || !shouldRun()) return;
  window.ttq?.page();
};

type ConversionPayload = Record<string, string | number | boolean | undefined>;

const moneyFrom = (payload: ConversionPayload): { value: number; currency: string } | null => {
  const value = typeof payload.value === "number" ? payload.value : typeof payload.amount === "number" ? payload.amount : null;
  const currency = typeof payload.currency === "string" ? payload.currency.toUpperCase() : "ZAR";
  return value !== null && value >= 0 && /^[A-Z]{3}$/.test(currency) ? { value, currency } : null;
};

/**
 * Forwarded from trackConversionEvent(). No-op without consent or for events TikTok
 * doesn't need. Sends the browser event and the matching server event (same event_id).
 * Never throws, never awaited by the caller.
 */
export const forwardConversionToTikTok = (event: string, payload: ConversionPayload = {}): void => {
  try {
    const name = tiktokEventFor(event);
    if (!name || !shouldRun()) return;
    if (!loaded) load();
    const eventId = newEventId();
    const money = moneyFrom(payload);
    window.ttq?.track(
      name,
      money ? { value: money.value, currency: money.currency } : {},
      { event_id: eventId },
    );

    void (async () => {
      try {
        // supabase-js attaches the signed-in user's JWT itself; the function derives the email from it.
        await supabase.functions.invoke("tiktok-events", {
          body: {
            event: name,
            eventId,
            eventTime: Math.floor(Date.now() / 1000),
            url: window.location.href,
            referrer: document.referrer || undefined,
            ttclid: readTtclid(),
            ttp: readTtp(),
            consent: true,
            ...(money ?? {}),
          },
        });
      } catch {
        /* server copy is best effort */
      }
    })();
  } catch {
    /* analytics must never break the feature it measures */
  }
};
