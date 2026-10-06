import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/attribution";
import { trackConversionEvent } from "@/lib/analytics-events";

/**
 * Renders nothing. Keeps the campaign labels (utm_*, or a TikTok click id) a visitor arrived with and logs one
 * `campaign_landing` event per campaign per session, so Admin → Ads can show landings next to registrations.
 * Not consent-gated: UTM labels are our own campaign names, kept for the tab session only and sent to our own
 * analytics, never to TikTok (see src/lib/attribution.ts). Mounted next to <TikTokPixel /> in App.tsx and
 * SsrConversionShell (the SSR routes render outside App).
 */
const AttributionCapture = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const captured = captureAttribution(search);
    if (captured?.isNewLanding) trackConversionEvent("campaign_landing");
  }, [pathname, search]);

  return null;
};

export default AttributionCapture;
