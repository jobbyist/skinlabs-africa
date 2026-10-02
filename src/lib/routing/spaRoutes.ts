/**
 * Paths the client-side react-router app (src/App.tsx) knows how to render.
 * Used by the catch-all server route to decide between 200 (real SPA route)
 * and 404 (nothing here), so crawlers stop seeing every junk URL as a valid page.
 *
 * Keep in sync with <Route> entries in src/App.tsx (spaRoutes.test.ts guards this).
 */
const EXACT = new Set([
  "/", "/get-started", "/skynn-ai", "/skynn-ai/advanced", "/ai-formulator", "/quote-ss-beauty",
  "/about", "/contact", "/business", "/practice-suite", "/partners", "/brand-ambassadors", "/brand-ambassadors/apply",
  "/our-science", "/sustainability", "/knowledge-hub", "/faq", "/privacy-policy", "/terms-of-service",
  "/cookie-policy", "/refund-policy", "/advertising-policy", "/corrections-removals", "/editorial-policy",
  "/community-guidelines", "/whitepapers", "/whitepaper", "/admin", "/shop", "/routines", "/learn",
  "/ingredients", "/ingredients/checker", "/marketplace", "/marketplace/brands", "/marketplace/categories",
  "/marketplace/saved", "/marketplace/shipping-returns", "/marketplace/terms", "/openhaus", "/podcast",
  "/stream", "/briefings", "/newsroom", "/reviews", "/compare", "/pricing", "/consultations", "/consult",
  "/announcements", "/spotlight", "/spotlight/methodology", "/spotlight/archive", "/seasonals",
  "/seasonals/spring", "/dashboard", "/reset-password", "/welcome",
]);

/** prefix -> number of extra path segments allowed after it (always exactly one slug). */
const ONE_SEGMENT_PREFIXES = [
  "/knowledge-hub", "/ingredients", "/podcast", "/stream", "/briefings", "/newsroom", "/reviews",
  "/reviews/versus", "/reviews/page", "/spotlight", "/seasonals",
  "/marketplace/product", "/marketplace/brand", "/marketplace/concern", "/marketplace/values",
  "/marketplace/skin-tone",
];

export function isKnownSpaPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT.has(path)) return true;
  return ONE_SEGMENT_PREFIXES.some((prefix) => {
    if (!path.startsWith(`${prefix}/`)) return false;
    const rest = path.slice(prefix.length + 1);
    return rest.length > 0 && !rest.includes("/");
  });
}
