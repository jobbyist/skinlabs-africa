/** Static pages surfaced in site-wide search, independent of any data file. */
export interface SearchablePage {
  title: string;
  description: string;
  href: string;
  keywords?: string;
}

/**
 * Kept in sync with the routes declared in src/App.tsx by `bun run search-index:check`
 * (wired into `npm run build` and `npm run lint`), which fails the build if a real,
 * content-bearing route has no entry here. Redirect-only routes (e.g. /devices,
 * /serums, /stream) and routes already covered by a dedicated SiteSearch group
 * (individual reviews, comparisons, podcast episodes, spotlight brands, seasonal
 * hubs, newsroom briefings) are intentionally excluded — see scripts/check-search-index.ts.
 */
export const searchablePages: SearchablePage[] = [
  { title: "Home", description: "SkinLabs — AI skincare routines and SA skin science", href: "/" },
  { title: "Products", description: "Browse SkinLabs' full skincare product catalogue", href: "/products", keywords: "shop catalogue skincare products" },
  { title: "The Daily Skinny", description: "Daily skin science briefings for SA skin and climate", href: "/newsroom", keywords: "newsroom briefings news" },
  { title: "Product Reviews", description: "Independent SA skincare product reviews and scores", href: "/reviews", keywords: "reviews scores ratings ingredients hyaluronic acid niacinamide retinol vitamin c" },
  { title: "Compare Products", description: "Compare skincare products side by side", href: "/compare", keywords: "compare versus shelf showdown" },
  { title: "Spotlight by SkinLabs", description: "A monthly, review-led ranking of South African skincare brands", href: "/spotlight", keywords: "spotlight brands ranking top brands" },
  { title: "Spotlight Methodology", description: "How Spotlight ranks South African skincare brands", href: "/spotlight/methodology", keywords: "spotlight methodology scoring" },
  { title: "Spotlight Archive", description: "Past Spotlight brand rankings by month", href: "/spotlight/archive", keywords: "spotlight archive past rankings" },
  { title: "Seasonals by SkinLabs", description: "Skincare for the season you're actually living in", href: "/seasonals", keywords: "seasonals seasonal skincare" },
  { title: "The Skin Deep Podcast", description: "Weekly SA skincare conversations and ingredient science", href: "/podcast", keywords: "podcast episodes audio" },
  { title: "AI Formulator", description: "Build a custom AI skincare routine from a skin quiz", href: "/ai-formulator", keywords: "ai routine formulator analysis quiz hyperpigmentation acne dryness sensitivity personalised" },
  { title: "Consultations", description: "Book a virtual consultation with an SA practitioner", href: "/consultations", keywords: "derm dermatologist booking" },
  { title: "Membership Plans", description: "Glow Explorer, Glow Insider and Glow VIP pricing", href: "/pricing", keywords: "pricing membership plans trial" },
  { title: "Announcements", description: "What's new at SkinLabs", href: "/announcements", keywords: "news updates changelog" },
  { title: "The Openhaus Shop", description: "SkinLabs' curated shop", href: "/shop", keywords: "openhaus shop store" },
  { title: "For Business", description: "SkinLabs for salons, clinics and retailers", href: "/business" },
  { title: "Partner Program", description: "Affiliate, editorial and strategic commerce partnerships with SkinLabs", href: "/partners", keywords: "partners partnerships affiliate editorial strategic commerce book a call" },
  { title: "About Us", description: "SkinLabs' story, science and sustainability", href: "/about", keywords: "our science sustainability" },
  { title: "Knowledge Hub", description: "Evidence-backed skincare answers, searchable by ingredient, concern or routine", href: "/knowledge-hub", keywords: "faq frequently asked questions shipping returns track order help" },
  { title: "Contact", description: "Get in touch with SkinLabs", href: "/contact" },
  { title: "Privacy Policy", description: "How SkinLabs handles your data", href: "/privacy-policy" },
  { title: "Terms of Service", description: "SkinLabs' terms of service", href: "/terms-of-service" },
  { title: "Cookie Policy", description: "SkinLabs' cookie policy", href: "/cookie-policy" },
];
