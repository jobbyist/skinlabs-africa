/**
 * Central SEO metadata and reusable naming conventions for SkinLabs®.
 * Primary pattern: [Primary Keyword] + [Topic / Benefit / Location] | SkinLabs®
 */
export const BRAND = "SkinLabs®";
export const SITE_URL = "https://skinlabs.co.za";
export const DEFAULT_OG = `${SITE_URL}/og-image.png`;

export type PageSeo = { title: string; description: string; keywords?: string; canonicalPath?: string; ogType?: string; };

export const pageSeo: Record<string, PageSeo> = {
  home: { title: `Skincare Intelligence for South Africa | ${BRAND}`, description: "Skincare, without the nonsense. Evidence-graded product reviews, daily skin science briefings and AI-personalised routines, built for South African skin — no affiliate deals, no gifted samples.", keywords: "skincare South Africa, SA product reviews, AI skincare routine, skin science, SkinLabs", canonicalPath: "/" },
  about: { title: `About SkinLabs® | South Africa's Skin Intelligence Platform`, description: "Learn about SkinLabs®, a South African skincare intelligence platform helping you make smarter decisions about products, ingredients, routines and skin health.", canonicalPath: "/about" },
  contact: { title: `Contact SkinLabs® | South African Skincare Experts & Team`, description: "Contact SkinLabs® for questions, partnerships, product reviews, editorial enquiries, skincare brands and opportunities to work with our team.", canonicalPath: "/contact" },
  pricing: { title: `SkinLabs® Membership | Personalised Skincare Intelligence`, description: "Join SkinLabs® for personalised skincare intelligence, AI-powered routines, product recommendations, skin tracking and exclusive member benefits. Glow Explorer free; Insider from R99/month.", canonicalPath: "/pricing" },
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
  products: { title: `Skincare Products & Recommendations | ${BRAND}`, description: "Explore skincare products, ingredient-led recommendations and curated product discovery from SkinLabs®, built around South African skin and climate.", canonicalPath: "/products" },
  partners: { title: `SkinLabs® Partner Program | Skincare Brand & Commerce Partnerships`, description: "Partner with SkinLabs® to reach a growing South African skincare audience through editorial, brand discovery, content, affiliate and commerce opportunities.", canonicalPath: "/partners" },
  business: { title: `SkinLabs® for Business | Skincare Brand & Industry Solutions`, description: "Explore SkinLabs® opportunities for skincare brands, professionals and businesses across South Africa, including partnerships, content and audience solutions.", canonicalPath: "/business" },
  sustainability: { title: `Sustainable Skincare & Beauty | SkinLabs®`, description: "Explore SkinLabs®' approach to sustainability, responsible skincare, informed consumption and a more transparent South African beauty industry.", canonicalPath: "/sustainability" },
  science: { title: `Our Science | Evidence-Based Skincare Intelligence | ${BRAND}`, description: "Learn how SkinLabs® evaluates skincare evidence, ingredients, product claims and recommendations to make skincare information more useful and transparent.", canonicalPath: "/our-science" },
  announcements: { title: `SkinLabs® Announcements | Product & Platform Updates`, description: "Follow SkinLabs® announcements, new features, editorial launches, product updates and platform developments.", canonicalPath: "/announcements" },
};

export const productReviewTitle = (productName: string, keyAttribute = "Ingredients, Results & Rating") => `${productName} Review: ${keyAttribute} | ${BRAND}`;
export const productReviewDescription = (productName: string, brand: string) => `Our independent review of ${productName} by ${brand} — ingredients, performance, value and suitability for South African skin and climate.`;
export const brandProfileTitle = (brandName: string) => `${brandName} | South African Skincare Brand | ${BRAND}`;
export const articleTitle = (topic: string) => `${topic} | The Daily Skinny by ${BRAND}`;
export const podcastEpisodeTitle = (topic: string) => `${topic} | The Skin Deep Series by ${BRAND}`;
export const formatTitle = (title: string) => /skinlabs/i.test(title) ? title : `${title} | ${BRAND}`;
