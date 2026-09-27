import type { ProductReview } from "@/data/reviews";
/**
 * Central SEO metadata and reusable naming conventions for SkinLabs®.
 * Primary pattern: [Primary Keyword] + [Topic / Benefit / Location] | SkinLabs®
 */
export const BRAND = "SkinLabs®";
export const SITE_URL = "https://skinlabs.co.za";
export const DEFAULT_OG = `${SITE_URL}/og-image.png`;

/**
 * Theme-appropriate Organization logos for structured data. logosvg.png/
 * logosvgwhite.png are real wordmark exports (public/logosvg.svg /
 * public/logosvgwhite.svg rasterized) — light-mode dark wordmark and
 * dark-mode light wordmark respectively, matching the same light/dark
 * asset pair already used visually elsewhere (e.g. AuthDialog.tsx's
 * skinlabs-logo-black.svg/skinlabs-logo-white.svg).
 */
export const ORG_LOGO_LIGHT = `${SITE_URL}/logosvg.png`;
export const ORG_LOGO_DARK = `${SITE_URL}/logosvgwhite.png`;

/**
 * Real, verified-live social profile URLs — kept in exactly one place so
 * Organization JSON-LD (schema.org sameAs) never drifts from what
 * Footer.tsx actually renders as clickable links. Previously three
 * independent declarations (Index.tsx, About.tsx, Partners.tsx) had each
 * gone stale differently: missing X entirely, or pointing at a WhatsApp
 * channel ID that didn't match the one actually linked in the footer.
 */
export const ORG_SAME_AS = [
  "https://instagram.com/skinlabsza",
  "https://facebook.com/skinlabs.co.za",
  "https://x.com/skinlabsza",
  "https://tiktok.com/@skinlabsza",
  "https://whatsapp.com/channel/0029Vb6AAeX7YSdws80fii1m",
] as const;

export type PageSeo = { title: string; description: string; keywords?: string; canonicalPath?: string; ogType?: string; };

/**
 * The single Organization JSON-LD builder for the whole site. Every page
 * that identifies SkinLabs as an entity (home, about, partners, ...)
 * should call this rather than hand-rolling its own — that's what
 * previously let three pages drift to three different sameAs/logo values
 * for the same real-world organization. `theme` should come from
 * `useTheme().resolvedTheme` so the logo matches what's actually on
 * screen; defaults to the light-mode logo for any caller that can't
 * resolve a theme (e.g. a server-rendered route with no theme context).
 */
export function buildOrganizationJsonLd(theme?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: SITE_URL,
    logo: theme === "dark" ? ORG_LOGO_DARK : ORG_LOGO_LIGHT,
    sameAs: [...ORG_SAME_AS],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+27680200749",
      contactType: "customer service",
      areaServed: "ZA",
    },
  };
}

export const pageSeo: Record<string, PageSeo> = {
  home: { title: `Skincare Intelligence for South Africa | ${BRAND}`, description: "Skincare, without the nonsense. Evidence-graded product reviews, daily skin science briefings and AI-personalised routines, built for South African skin — no affiliate deals, no gifted samples.", keywords: "skincare South Africa, SA product reviews, AI skincare routine, skin science, SkinLabs", canonicalPath: "/" },
  about: { title: `About SkinLabs® | South Africa's Skin Intelligence Platform`, description: "Learn about SkinLabs®, a South African skincare intelligence platform helping you make smarter decisions about products, ingredients, routines and skin health.", canonicalPath: "/about" },
  contact: { title: `Contact SkinLabs® | South African Skincare Experts & Team`, description: "Contact SkinLabs® for questions, partnerships, product reviews, editorial enquiries, skincare brands and opportunities to work with our team.", canonicalPath: "/contact" },
  pricing: { title: `SkinLabs® Membership | Personalised Skincare Intelligence`, description: "Join SkinLabs® for personalised skincare intelligence, AI-powered routines, product recommendations, skin tracking and exclusive member benefits. Start free with Glow Explorer, or compare our paid plans.", canonicalPath: "/pricing" },
  skynnAi: { title: `SKYNN AI (beta) — Skin Analysis & Routine Builder | ${BRAND}`, description: "SKYNN AI (beta): an AI-powered skin assessment with Monk Skin Tone (MST) fairness testing, built for every skin tone, delivering a personalised routine based on your skin profile, climate, budget and goals.", canonicalPath: "/skynn-ai" },
  reviews: { title: `Skincare Product Reviews South Africa | ${BRAND}`, description: "Discover independent skincare product reviews from South Africa. Compare ingredients, performance, value and suitability for different skin types and concerns.", canonicalPath: "/reviews" },
  compare: { title: `Shelf Showdown — SA Skincare Comparisons | ${BRAND}`, description: "Head-to-head skincare comparisons for South Africa: actives, evidence and Rand value — no universal winners. Shelf Showdown by SkinLabs®.", canonicalPath: "/compare" },
  spotlight: { title: `South African Skincare Brands | ${BRAND}`, description: "Discover skincare brands made for and sold in South Africa. Explore products, ingredients, reviews and recommendations curated by SkinLabs® Spotlight.", canonicalPath: "/spotlight" },
  briefings: { title: `The Daily Skinny: Daily SA Skincare Briefings | ${BRAND}`, description: "A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. Free to read, with a premium PDF magazine for members.", keywords: "skincare news South Africa, daily skincare briefing, SA skincare science, skincare research, skincare education", canonicalPath: "/briefings" },
  podcast: { title: `The Skin Deep Series | Skincare Podcast South Africa | ${BRAND}`, description: "The Skin Deep Series is SkinLabs®' skincare podcast exploring ingredient science, skincare culture, routines, experts and the realities of South African skin.", canonicalPath: "/podcast" },
  seasonals: { title: `Seasonal Skincare Guides for South Africa | ${BRAND}`, description: "Seasonal skincare guides for South African climate — spring, summer, autumn and winter routines grounded in local UV, humidity and shelves.", canonicalPath: "/seasonals" },
  knowledgeHub: { title: `Knowledge Hub — Evidence-Backed Skincare Answers | ${BRAND}`, description: "Searchable, evidence-backed answers on skincare ingredients, routines, skin types, sun protection and the South African market — plus how SkinLabs memberships and AI routines work.", canonicalPath: "/knowledge-hub" },
  consultations: { title: `Virtual Derm Consultations South Africa | ${BRAND}`, description: "Book virtual consultations with South African dermatologists and aesthetic practitioners. Rand pricing and local availability for Glow Insider and VIP members.", canonicalPath: "/consultations" },
  consult: { title: `Find a Trusted Dermatologist in South Africa | ${BRAND}`, description: "Browse SkinLabs' directory of verified South African dermatologists and dermatology practices across Gauteng, the Western Cape, KwaZulu-Natal and beyond.", canonicalPath: "/consult" },
  shop: { title: `Skincare Marketplace South Africa | Coming Soon | ${BRAND}`, description: "The SkinLabs® marketplace for verified South African skincare is coming soon. Independent reviews stay editorial-first.", canonicalPath: "/shop" },
  partners: { title: `SkinLabs® Partner Program | Skincare Brand & Commerce Partnerships`, description: "Partner with SkinLabs® to reach a growing South African skincare audience through editorial, brand discovery, content, affiliate and commerce opportunities.", canonicalPath: "/partners" },
  business: { title: `SkinLabs® for Business | Skincare Brand & Industry Solutions`, description: "Explore SkinLabs® opportunities for skincare brands, professionals and businesses across South Africa, including partnerships, content and audience solutions.", canonicalPath: "/business" },
  sustainability: { title: `Sustainable Skincare & Beauty | SkinLabs®`, description: "Explore SkinLabs®' approach to sustainability, responsible skincare, informed consumption and a more transparent South African beauty industry.", canonicalPath: "/sustainability" },
  science: { title: `Our Science | Evidence-Based Skincare Intelligence | ${BRAND}`, description: "Learn how SkinLabs® evaluates skincare evidence, ingredients, product claims and recommendations to make skincare information more useful and transparent.", canonicalPath: "/our-science" },
  announcements: { title: `SkinLabs® Announcements | Product & Platform Updates`, description: "Follow SkinLabs® announcements, new features, editorial launches, product updates and platform developments.", canonicalPath: "/announcements" },
};

/**
 * Generate an SEO-optimized title for a product review page.
 * Follows best practices: include brand, product, key benefit/feature, and site brand.
 * Max ~60 chars to avoid truncation in SERPs.
 * 
 * Examples:
 * - "CeraVe Moisturising Cream Review — Ceramide Barrier Repair | SkinLabs®"
 * - "The Ordinary Niacinamide 10% + Zinc — Pore & Oil Control Review | SkinLabs®"
 */
export const productReviewTitle = (
  productName: string,
  brand: string,
  keyAttribute?: string
): string => {
  // Try to be concise - target ~55 chars before brand suffix
  const baseName = `${brand} ${productName}`;
  
  if (keyAttribute) {
    // If we have a key attribute, use it
    return `${baseName} — ${keyAttribute} Review | ${BRAND}`;
  }
  
  // Default format
  return `${baseName} Review | ${BRAND}`;
};

/**
 * Generate an SEO-optimized description for a product review page.
 * Should be 150-160 chars, include key information and create click incentive.
 * 
 * Template: Independent review of [Product] by [Brand] — [scores/verdict snippet], 
 * [key ingredients], suitability for [skin types] and South African climate.
 */
export const productReviewDescription = (
  productName: string,
  brand: string,
  options?: {
    verdict?: string;
    keyIngredients?: string[];
    skinTypes?: string[];
    score?: number;
  }
): string => {
  const parts: string[] = [];
  
  // Start with the product
  parts.push(`Independent review of ${productName} by ${brand}`);
  
  // Add score if available (makes it more compelling)
  if (options?.score) {
    parts.push(`(${options.score}/10)`);
  }
  
  // Add key ingredients if available (max 2-3 to keep concise)
  if (options?.keyIngredients && options.keyIngredients.length > 0) {
    const topIngredients = options.keyIngredients.slice(0, 2).join(', ');
    parts.push(`— ${topIngredients}`);
  }
  
  // Add skin type suitability if available
  if (options?.skinTypes && options.skinTypes.length > 0) {
    const types = options.skinTypes.slice(0, 2).join(' & ');
    parts.push(`for ${types} skin`);
  }
  
  // Always end with SA context
  parts.push('in South African climate.');
  
  const description = parts.join(' ');
  
  // Ensure we don't exceed 160 chars
  return description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;
};

/**
 * Generate a compelling intro paragraph for a product review page (SEO content).
 * This goes at the top of the page, before the review structure.
 * ~50-100 words, natural language, includes key terms.
 */
export const productReviewIntro = (
  productName: string,
  brand: string,
  category: string,
  options?: {
    verdict?: string;
    keyIngredients?: string[];
    price?: number;
  }
): string => {
  const parts: string[] = [];
  
  parts.push(`${brand} ${productName} is a ${category.toLowerCase()} that`);
  
  // Add verdict snippet if available
  if (options?.verdict) {
    const shortVerdict = options.verdict.substring(0, 100);
    parts.push(shortVerdict);
  }
  
  return parts.join(' ');
};

export const brandProfileTitle = (brandName: string) => `${brandName} | South African Skincare Brand | ${BRAND}`;
export const articleTitle = (topic: string) => `${topic} | The Daily Skinny by ${BRAND}`;
export const podcastEpisodeTitle = (topic: string) => `${topic} | The Skin Deep Series by ${BRAND}`;
export const formatTitle = (title: string) => /skinlabs/i.test(title) ? title : `${title} | ${BRAND}`;
