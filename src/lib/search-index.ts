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
  { title: "The Daily Skinny", description: "Daily skin science briefings for SA skin and climate", href: "/briefings", keywords: "newsroom briefings news" },
  { title: "Product Reviews", description: "Independent SA skincare product reviews and scores", href: "/reviews", keywords: "reviews scores ratings ingredients hyaluronic acid niacinamide retinol vitamin c" },
  { title: "Compare Products", description: "Compare skincare products side by side", href: "/compare", keywords: "compare versus shelf showdown" },
  { title: "Spotlight by SkinLabs", description: "A monthly, review-led ranking of South African skincare brands", href: "/spotlight", keywords: "spotlight brands ranking top brands" },
  { title: "Spotlight Methodology", description: "How Spotlight ranks South African skincare brands", href: "/spotlight/methodology", keywords: "spotlight methodology scoring" },
  { title: "Spotlight Archive", description: "Past Spotlight brand rankings by month", href: "/spotlight/archive", keywords: "spotlight archive past rankings" },
  { title: "Seasonals by SkinLabs", description: "Skincare for the season you're actually living in", href: "/seasonals", keywords: "seasonals seasonal skincare" },
  { title: "The Skin Deep Podcast", description: "Weekly SA skincare conversations and ingredient science", href: "/podcast", keywords: "podcast episodes audio" },
  { title: "Skin Analysis (SKYNN AI)", description: "Build a custom AI skincare routine from a skin quiz", href: "/skynn-ai", keywords: "skynn ai skin analysis routine formulator quiz mst monk skin tone hyperpigmentation acne dryness sensitivity personalised" },
  { title: "Consultations", description: "Book a virtual consultation with an SA practitioner", href: "/consultations", keywords: "derm dermatologist booking" },
  { title: "Find a Dermatologist", description: "Directory of verified South African dermatologists and dermatology practices", href: "/consult", keywords: "dermatologist directory find a dermatologist skin doctor South Africa HPCSA" },
  { title: "Membership Plans", description: "Glow Explorer, Glow Insider and Glow VIP pricing", href: "/pricing", keywords: "pricing membership plans trial" },
  { title: "Announcements", description: "What's new at SkinLabs", href: "/announcements", keywords: "news updates changelog" },
  { title: "The Openhaus Shop", description: "SkinLabs' curated shop", href: "/shop", keywords: "openhaus shop store" },
  { title: "OpenHaus Marketplace", description: "SkinLabs' in-app skincare marketplace — curated local and global brands available in South Africa", href: "/marketplace", keywords: "openhaus marketplace shop store buy skincare products brands" },
  { title: "OpenHaus Brands", description: "Browse every brand stocked on the OpenHaus marketplace", href: "/marketplace/brands", keywords: "openhaus brands marketplace" },
  { title: "OpenHaus Categories", description: "Shop OpenHaus by face, body, hair, sun care, treatments and tools", href: "/marketplace/categories", keywords: "openhaus categories marketplace face body haircare sun care treatments tools" },
  { title: "OpenHaus Shipping & Returns", description: "Shipping and returns policy for the OpenHaus marketplace", href: "/marketplace/shipping-returns", keywords: "openhaus shipping returns delivery marketplace" },
  { title: "OpenHaus Terms", description: "Terms of sale for the OpenHaus marketplace", href: "/marketplace/terms", keywords: "openhaus terms marketplace" },
  { title: "For Business", description: "SkinLabs for salons, clinics and retailers", href: "/business" },
  { title: "Partner Program", description: "Affiliate, editorial and strategic commerce partnerships with SkinLabs", href: "/partners", keywords: "partners partnerships affiliate editorial strategic commerce book a call" },
  { title: "Brand Ambassador Programme", description: "Apply to become a SkinLabs TikTok or Instagram Brand Ambassador", href: "/brand-ambassadors", keywords: "brand ambassador creator programme tiktok instagram affiliate commission apply" },
  { title: "About Us", description: "SkinLabs' story, science and sustainability", href: "/about", keywords: "our science sustainability" },
  { title: "Knowledge Hub", description: "Evidence-backed skincare answers, searchable by ingredient, concern or routine", href: "/knowledge-hub", keywords: "faq frequently asked questions shipping returns track order help" },
  { title: "Smart Routines", description: "Your skincare routine, finally built around you — a living AM and PM routine powered by your Advanced AI Dermatology Report from SKYNN AI that adapts to your skin, the season, your budget and your shelf", href: "/routines", keywords: "smart routines am pm personalised personalized dynamic seasonal budget advanced dermatology report analysis skynn ai" },
  { title: "SkinLabs Academy", description: "Self-paced skincare business and formulation learning platform — coming soon", href: "/learn", keywords: "academy learn courses coming soon" },
  { title: "Ingredients Hub", description: "Skincare ingredient science and a clash/compatibility analyser — coming soon", href: "/ingredients", keywords: "ingredients hub analyser coming soon" },
  { title: "Whitepapers", description: "SkinLabs' research and industry whitepapers", href: "/whitepapers", keywords: "whitepapers research reports" },
  { title: "Editorial Policy", description: "How SkinLabs reports, reviews and discloses conflicts of interest", href: "/editorial-policy", keywords: "editorial policy independence disclosure" },
  { title: "Community Guidelines", description: "Rules for comments, reviews and community participation on SkinLabs", href: "/community-guidelines", keywords: "community guidelines comments rules" },
  { title: "Refund Policy", description: "SkinLabs' refund policy for memberships and OpenHaus orders", href: "/refund-policy", keywords: "refund policy returns money back" },
  { title: "Contact", description: "Get in touch with SkinLabs", href: "/contact" },
  { title: "Privacy Policy", description: "How SkinLabs handles your data", href: "/privacy-policy" },
  { title: "Terms of Service", description: "SkinLabs' terms of service", href: "/terms-of-service" },
  { title: "Cookie Policy", description: "SkinLabs' cookie policy", href: "/cookie-policy" },
  { title: "Advertising & Sponsored Content Policy", description: "How SkinLabs handles commercial relationships, disclosures and advertising standards", href: "/advertising-policy", keywords: "advertising sponsored content disclosure policy" },
  { title: "Correction & Removal Requests", description: "Request a correction or removal of reviews, directory listings, brand profiles or editorial content", href: "/corrections-removals", keywords: "corrections removal request takedown" },
  { title: "Ingredient Combination Checker", description: "Check whether two skincare ingredients are safe to combine, backed by cited sources", href: "/ingredients/checker", keywords: "ingredient checker combine compatibility conflict" },
];
