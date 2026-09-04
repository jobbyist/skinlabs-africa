/**
 * Central SEO metadata — aligned with SkinLabs SEO Metadata Implementation Reference.
 * Pattern: [Primary Keyword] + [Topic / Benefit] | SkinLabs®
 */

export const BRAND = "SkinLabs®";
export const SITE_URL = "https://skinlabs.co.za";
export const DEFAULT_OG = `${SITE_URL}/og-image.png`;

export type PageSeo = {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: string;
};

/** Core site pages from the SEO reference */
export const pageSeo: Record<string, PageSeo> = {
  home: {
    title: `Skincare Intelligence for South Africa | ${BRAND}`,
    description:
      "Skincare, without the nonsense. Evidence-graded product reviews, daily skin science briefings and AI-personalised routines, built for South African skin — no affiliate deals, no gifted samples.",
    keywords: "skincare South Africa, SA product reviews, AI skincare routine, skin science, SkinLabs",
    canonicalPath: "/",
  },
  about: {
    title: `About SkinLabs® | South Africa's Skin Intelligence Platform`,
    description:
      "Learn about SkinLabs®, a South African skincare intelligence platform helping you make smarter decisions about products, ingredients, routines and skin health.",
    canonicalPath: "/about",
  },
  contact: {
    title: `Contact SkinLabs® | South African Skincare Experts & Team`,
    description:
      "Contact SkinLabs® for questions, partnerships, product reviews, editorial enquiries, skincare brands and opportunities to work with our team.",
    canonicalPath: "/contact",
  },
  pricing: {
    title: `SkinLabs® Membership | Personalised Skincare Intelligence`,
    description:
      "Join SkinLabs® for personalised skincare intelligence, AI-powered routines, product recommendations, skin tracking and exclusive member benefits. Glow Explorer free; Insider from R99/month.",
    canonicalPath: "/pricing",
  },
  aiFormulator: {
    title: `AI Skincare Routine Builder for South Africa | ${BRAND}`,
    description:
      "Build a personalised skincare routine based on your skin profile, climate, budget and goals with SkinLabs® AI-powered skincare technology.",
    canonicalPath: "/ai-formulator",
  },
  reviews: {
    title: `Skincare Product Reviews South Africa | ${BRAND}`,
    description:
      "Discover independent skincare product reviews from South Africa. Compare ingredients, performance, value and suitability for different skin types and concerns.",
    canonicalPath: "/reviews",
  },
  compare: {
    title: `Shelf Showdown — SA Skincare Comparisons | ${BRAND}`,
    description:
      "Head-to-head skincare comparisons for South Africa: actives, evidence and Rand value — no universal winners. Shelf Showdown by SkinLabs®.",
    canonicalPath: "/compare",
  },
  spotlight: {
    title: `South African Skincare Brands | ${BRAND}`,
    description:
      "Discover skincare brands made for and sold in South Africa. Explore products, ingredients, reviews and recommendations curated by SkinLabs® Spotlight.",
    canonicalPath: "/spotlight",
  },
  briefings: {
    title: `The Daily Skinny: Daily SA Skincare Briefings | ${BRAND}`,
    description:
      "A daily brief of global skincare science, translated into what it means for South African skin, climate and shelves. Free to read, with a premium PDF magazine for members.",
    keywords: "skincare news South Africa, daily skincare briefing, SA skincare science, skincare research, skincare education",
    canonicalPath: "/briefings",
  },
  podcast: {
    title: `The Skin Deep Podcast | SA Skincare Conversations | ${BRAND}`,
    description:
      "Evidence-first South African skincare conversations, ingredient science and show notes. New episodes on the last Friday of every month.",
    canonicalPath: "/podcast",
  },
  seasonals: {
    title: `Seasonal Skincare Guides for South Africa | ${BRAND}`,
    description:
      "Seasonal skincare guides for South African climate — spring, summer, autumn and winter routines grounded in local UV, humidity and shelves.",
    canonicalPath: "/seasonals",
  },
  knowledgeHub: {
    title: `Knowledge Hub — Evidence-Backed Skincare Answers | ${BRAND}`,
    description:
      "Searchable, evidence-backed answers on skincare ingredients, routines, skin types, sun protection and the South African market — plus how SkinLabs memberships and AI routines work.",
    canonicalPath: "/knowledge-hub",
  },
  consultations: {
    title: `Virtual Derm Consultations South Africa | ${BRAND}`,
    description:
      "Book virtual consultations with South African dermatologists and aesthetic practitioners. Rand pricing and local availability for Glow Insider and VIP members.",
    canonicalPath: "/consultations",
  },
  shop: {
    title: `Skincare Marketplace South Africa | Coming Soon | ${BRAND}`,
    description:
      "The SkinLabs® marketplace for verified South African skincare is coming soon. Independent reviews stay editorial-first.",
    canonicalPath: "/shop",
  },
};

/** Product review title template */
export const productReviewTitle = (productName: string, keyAttribute = "Ingredients, Results & Rating") =>
  `${productName} Review: ${keyAttribute} | ${BRAND}`;

export const productReviewDescription = (productName: string, brand: string) =>
  `Our independent review of ${productName} by ${brand} — ingredients, performance, value and suitability for South African skin and climate.`;

/** Brand spotlight template */
export const brandProfileTitle = (brandName: string) =>
  `${brandName} | South African Skincare Brand | ${BRAND}`;

/** Article / Daily Skinny template */
export const articleTitle = (topic: string) => `${topic} | The Daily Skinny by ${BRAND}`;

/** Podcast episode template */
export const podcastEpisodeTitle = (topic: string) => `${topic} | The Skin Deep Series by ${BRAND}`;

export const formatTitle = (title: string) =>
  title.includes("SkinLabs") || title.includes("SKINLABS") ? title : `${title} | ${BRAND}`;
