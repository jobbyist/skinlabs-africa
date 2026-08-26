// Sitemap generator for SkinLabs
// This generates an XML sitemap for SEO purposes

export interface SitemapUrl {
  loc: string;
  name?: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  description?: string;
}

export const sitemapUrls: SitemapUrl[] = [
  // Main pages
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/about', changefreq: 'weekly', priority: 0.9 },
  { loc: '/pricing', changefreq: 'weekly', priority: 0.9 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.7 },
  
  // Content pages
  { 
    loc: '/newsroom', 
    name: 'The Daily Skinny',
    description: 'Daily skin science briefings and industry news curated for South African skin',
    changefreq: 'daily', 
    priority: 0.95 
  },
  { 
    loc: '/reviews', 
    name: 'Product Reviews',
    description: 'Honest, evidence-based reviews of skincare products available in South Africa',
    changefreq: 'weekly', 
    priority: 0.9 
  },
  { 
    loc: '/podcast', 
    name: 'The Skin Deep Podcast',
    description: 'Conversations with dermatologists, researchers and skincare experts',
    changefreq: 'weekly', 
    priority: 0.85 
  },
  
  // Services
  { loc: '/ai-formulator', changefreq: 'weekly', priority: 0.9 },
  { loc: '/consultations', name: 'Expert Consultations', description: 'Book virtual consultations with qualified dermatologists and skincare specialists', changefreq: 'monthly', priority: 0.8 },
  
  // Support
  { loc: '/faq', changefreq: 'monthly', priority: 0.6 },
  { loc: '/shipping', changefreq: 'monthly', priority: 0.5 },
  { loc: '/returns', changefreq: 'monthly', priority: 0.5 },
  
  // Legal
  { loc: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
  { loc: '/cookie-policy', changefreq: 'yearly', priority: 0.3 },
];

// Pricing page added separately for emphasis
sitemapUrls.splice(3, 0, { loc: '/pricing', name: 'Membership Plans', description: 'Flexible membership plans for full access to briefings, AI skincare routines and expert consultations', changefreq: 'monthly', priority: 0.9 });

export const generateSitemap = (baseUrl: string = 'https://skinlabs.co.za'): string => {
  const today = new Date().toISOString().split('T')[0];
  
  const urlElements = sitemapUrls.map((url) => {
    const lastmod = url.lastmod || today;
    const changefreq = url.changefreq || 'weekly';
    const priority = url.priority || 0.5;
    const nameMeta = url.name ? `\n    <name>${url.name}</name>` : '';
    const descMeta = url.description ? `\n    <description>${url.description}</description>` : '';
    
    return `  <url>
    <loc>${baseUrl}${url.loc}</loc>${nameMeta}${descMeta}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlElements}
</urlset>`;
};

// Generate robots.txt content
export const generateRobotsTxt = (baseUrl: string = 'https://skinlabs.co.za'): string => {
  return `# SkinLabs Robots.txt
User-agent: *
Allow: /

# Disallow admin and user-specific pages
Disallow: /admin
Disallow: /dashboard

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional, adjust as needed)
Crawl-delay: 1
`;
};

// Helper to download sitemap
export const downloadSitemap = () => {
  const sitemap = generateSitemap();
  const blob = new Blob([sitemap], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  a.click();
};
