// Single, vendor-agnostic analytics entry point. Every call site in the app
// talks to trackEvent()/identifyUser() only — never to gtag or posthog
// directly — so swapping or adding a provider later is a one-file change.
// Both providers are optional and load lazily only if their env var is set,
// keeping the base bundle small when analytics isn't configured.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    posthog?: {
      capture: (event: string, props?: Record<string, unknown>) => void;
      identify: (id: string, props?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

let initialized = false;

export const initAnalytics = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const gaId = import.meta.env.VITE_GA4_ID as string | undefined;
  if (gaId) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId, { anonymize_ip: true });
  }

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://us.i.posthog.com";
  if (posthogKey) {
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
      window.posthog = posthog;
    });
  }
};

/** Fire a product event to every configured analytics provider. */
export const trackEvent = (name: string, props?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, props);
  window.posthog?.capture(name, props);
};

/** Associate the current visitor with a signed-in user id across providers. */
export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  window.posthog?.identify(userId, traits);
  window.gtag?.("set", "user_id", userId);
};
