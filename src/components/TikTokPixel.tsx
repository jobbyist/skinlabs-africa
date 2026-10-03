import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { startTikTokPixel, trackTikTokPageView } from "@/lib/tiktok/pixel";

/**
 * Renders nothing. Starts the consent-gated TikTok Pixel once and reports SPA
 * navigations as page views. Mounted in App.tsx and SsrConversionShell (the SSR
 * routes render outside App). See src/lib/tiktok/pixel.ts for the consent rules.
 */
const TikTokPixel = () => {
  const { pathname } = useLocation();

  useEffect(() => startTikTokPixel(), []);

  // The first page view is sent when the pixel loads; every later route change adds one.
  useEffect(() => {
    trackTikTokPageView(pathname);
  }, [pathname]);

  return null;
};

export default TikTokPixel;
