// Sitemap generator for SkinLabs — content-heavy routes prioritised for Google / AI search

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export const sitemapUrls: SitemapUrl[] = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/reviews", changefreq: "daily", priority: 0.95 },
  { loc: "/newsroom", changefreq: "daily", priority: 0.95 },
  { loc: "/compare", changefreq: "weekly", priority: 0.9 },
  { loc: "/spotlight", changefreq: "weekly", priority: 0.9 },
  { loc: "/podcast", changefreq: "weekly", priority: 0.9 },
  { loc: "/seasonals", changefreq: "weekly", priority: 0.85 },
  { loc: "/ai-formulator", changefreq: "weekly", priority: 0.9 },
  { loc: "/pricing", changefreq: "weekly", priority: 0.9 },
  { loc: "/about", changefreq: "monthly", priority: 0.8 },
  { loc: "/consultations", changefreq: "monthly", priority: 0.8 },
  { loc: "/faq", changefreq: "monthly", priority: 0.75 },
  { loc: "/shop", changefreq: "monthly", priority: 0.6 },
  { loc: "/announcements", changefreq: "weekly", priority: 0.5 },
  { loc: "/spotlight/methodology", changefreq: "monthly", priority: 0.5 },
  { loc: "/spotlight/archive", changefreq: "monthly", priority: 0.5 },
  { loc: "/contact", changefreq: "monthly", priority: 0.5 },
  { loc: "/privacy-policy", changefreq: "yearly", priority: 0.3 },
  { loc: "/terms-of-service", changefreq: "yearly", priority: 0.3 },
  { loc: "/cookie-policy", changefreq: "yearly", priority: 0.3 },
];

export const generateSitemap = (baseUrl = "https://skinlabs.co.za"): string => {
  const today = new Date().toISOString().split("T")[0];
  const urlElements = sitemapUrls
    .map((url) => {
      const lastmod = url.lastmod || today;
      const changefreq = url.changefreq || "weekly";
      const priority = url.priority || 0.5;
      return `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
};

export const generateRobotsTxt = (baseUrl = "https://skinlabs.co.za"): string => {
  return `# SkinLabs Robots.txt
User-agent: *
Allow: /

Disallow: /admin
Disallow: /dashboard

Sitemap: ${baseUrl}/sitemap.xml

Crawl-delay: 1
`;
};

export const downloadSitemap = () => {
  const sitemap = generateSitemap();
  const blob = new Blob([sitemap], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sitemap.xml";
  a.click();
};
