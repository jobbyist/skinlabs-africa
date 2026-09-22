/**
 * Canonical, indexable static routes shared by the build-time sitemap
 * fallback (scripts/generate-sitemap.ts, used when the Nitro SSR function
 * isn't available) and the live SSR sitemap route (src/routes/sitemap[.]xml.ts,
 * the one actually served in production). Kept in one place so the two
 * never drift on which routes are canonical — redirects, retired commerce
 * routes, dashboards and 404 paths are deliberately excluded from both.
 */
export interface StaticSitemapRoute {
  path: string;
  changefreq: string;
  priority: string;
}

export const STATIC_SITEMAP_ROUTES: StaticSitemapRoute[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/business", changefreq: "monthly", priority: "0.6" },
  { path: "/partners", changefreq: "monthly", priority: "0.8" },
  { path: "/brand-ambassadors", changefreq: "weekly", priority: "0.8" },
  { path: "/skynn-ai", changefreq: "weekly", priority: "0.95" },
  { path: "/briefings", changefreq: "daily", priority: "0.95" },
  { path: "/reviews", changefreq: "weekly", priority: "0.95" },
  { path: "/compare", changefreq: "weekly", priority: "0.9" },
  { path: "/podcast", changefreq: "weekly", priority: "0.9" },
  { path: "/spotlight", changefreq: "monthly", priority: "0.9" },
  { path: "/spotlight/methodology", changefreq: "monthly", priority: "0.5" },
  { path: "/spotlight/archive", changefreq: "monthly", priority: "0.4" },
  { path: "/seasonals", changefreq: "weekly", priority: "0.9" },
  { path: "/seasonals/spring", changefreq: "weekly", priority: "0.85" },
  { path: "/seasonals/summer", changefreq: "monthly", priority: "0.7" },
  { path: "/seasonals/autumn", changefreq: "monthly", priority: "0.7" },
  { path: "/seasonals/winter", changefreq: "monthly", priority: "0.7" },
  { path: "/consultations", changefreq: "monthly", priority: "0.8" },
  { path: "/consult", changefreq: "weekly", priority: "0.85" },
  { path: "/announcements", changefreq: "monthly", priority: "0.6" },
  { path: "/knowledge-hub", changefreq: "weekly", priority: "0.9" },
  { path: "/ingredients", changefreq: "weekly", priority: "0.85" },
  { path: "/ingredients/checker", changefreq: "monthly", priority: "0.7" },
  { path: "/marketplace", changefreq: "daily", priority: "0.9" },
  { path: "/marketplace/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/marketplace/categories", changefreq: "weekly", priority: "0.7" },
  { path: "/marketplace/shipping-returns", changefreq: "monthly", priority: "0.3" },
  { path: "/marketplace/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/whitepapers", changefreq: "monthly", priority: "0.5" },
  { path: "/editorial-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/community-guidelines", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.2" },
  { path: "/cookie-policy", changefreq: "yearly", priority: "0.2" },
];
