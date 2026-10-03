import { SITE_URL } from "@/lib/seo-config";

/**
 * The origin to use in auth and payment return URLs. A visitor who reaches the
 * app on a Vercel-assigned hostname (*.vercel.app deployments/previews) must
 * still come back to the canonical domain after Google sign-in, email
 * confirmation or a payment, so those hosts map to SITE_URL. localhost and
 * the real domain are used as-is.
 */
export const getSiteOrigin = (): string => {
  if (typeof window === "undefined") return SITE_URL;
  const host = window.location.hostname;
  return host.endsWith(".vercel.app") ? SITE_URL : window.location.origin;
};
