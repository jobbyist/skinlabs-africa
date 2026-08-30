import {
  Compass, ShieldCheck, BookOpen, ShoppingBag, LineChart, TrendingUp,
  Link2, Newspaper, Handshake, type LucideIcon,
} from "lucide-react";

export interface PartnerBenefit {
  icon: LucideIcon;
  eyebrow: string;
  description: string;
}

export const partnerBenefits: PartnerBenefit[] = [
  {
    icon: Compass,
    eyebrow: "Discovery",
    description: "Put your products and brand in front of consumers actively researching skincare.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Credibility",
    description: "Become part of an ecosystem built around education, product intelligence and informed discovery.",
  },
  {
    icon: BookOpen,
    eyebrow: "Content",
    description: "Extend your brand story through editorial features, product reviews, guides and curated collections.",
  },
  {
    icon: ShoppingBag,
    eyebrow: "Commerce",
    description: "Turn product discovery into measurable commercial opportunities through tracked links, retailer integrations and strategic campaigns.",
  },
  {
    icon: LineChart,
    eyebrow: "Data & Insights",
    description: "Where available, gain useful insights into engagement, product interest and campaign performance.",
  },
  {
    icon: TrendingUp,
    eyebrow: "Long-Term Growth",
    description: "Build a relationship with SkinLabs® that can evolve as your brand and our platform grow.",
  },
];

export type PartnershipModelId = "affiliate" | "editorial" | "strategic";

export interface PartnershipModel {
  id: PartnershipModelId;
  number: string;
  anchorId: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  shortDescription: string;
  detailedDescription: string;
  bestFor: string[];
  opportunitiesLabel: string;
  opportunities: string[];
  provideLabel: string;
  mayProvide: string[];
  commercialLabel: string;
  commercialModel: string;
  guidelinesLabel: string;
  guidelines: string[];
  cta: string;
  depth: 1 | 2 | 3;
}

export const partnershipModels: PartnershipModel[] = [
  {
    id: "affiliate",
    number: "01",
    anchorId: "affiliate-partner",
    icon: Link2,
    label: "Affiliate Partner",
    headline: "Performance-Driven Commerce",
    shortDescription: "Turn SkinLabs® product discovery into measurable sales through tracked affiliate partnerships.",
    detailedDescription:
      "Affiliate Partners provide SkinLabs® with trackable product or retailer links. When a SkinLabs® user discovers a product through our platform and completes a qualifying purchase, the partner may compensate SkinLabs® according to the agreed affiliate terms.",
    bestFor: ["Skincare brands", "Beauty retailers", "Ecommerce stores", "Distributors", "Marketplaces", "Product-focused businesses"],
    opportunitiesLabel: "Potential integrations",
    opportunities: [
      "Product review pages",
      "Product comparison pages",
      "“Where to Buy” modules",
      "Seasonals",
      "Editorial articles",
      "Ingredient guides",
      "Curated product collections",
      "Campaign landing pages",
    ],
    provideLabel: "Partner may provide",
    mayProvide: ["Affiliate links", "Deep links", "Promotional codes", "Product feeds", "Approved product imagery", "Promotional creatives", "Campaign assets", "Product information"],
    commercialLabel: "Commercial model",
    commercialModel: "Performance-based. Commission structure, attribution window and other commercial terms are agreed with the partner or affiliate network.",
    guidelinesLabel: "Guidelines",
    guidelines: [
      "All affiliate relationships must be disclosed appropriately.",
      "SkinLabs® may independently determine editorial placement and product suitability.",
      "Affiliate participation does not guarantee positive reviews or editorial coverage.",
      "Product information must be accurate and kept up to date.",
      "Partners are responsible for ensuring their products, claims and promotional materials comply with applicable laws and regulations.",
      "SkinLabs® reserves the right to remove links or promotional placements where necessary.",
    ],
    cta: "Become an Affiliate Partner",
    depth: 1,
  },
  {
    id: "editorial",
    number: "02",
    anchorId: "editorial-partner",
    icon: Newspaper,
    label: "Editorial Partner",
    headline: "Tell Your Story Through SkinLabs®",
    shortDescription: "Collaborate with SkinLabs® on credible, useful and consumer-focused editorial experiences.",
    detailedDescription:
      "Editorial Partners work with SkinLabs® to provide product information, expert insights, samples, imagery, founder stories, educational resources or other materials that can support relevant editorial content.",
    bestFor: ["Skincare brands", "Founders", "Dermatologists", "Aesthetic practitioners", "Skincare professionals", "Ingredient experts", "Researchers", "Beauty businesses"],
    opportunitiesLabel: "Potential editorial opportunities",
    opportunities: [
      "Brand features",
      "Product reviews",
      "Expert interviews",
      "Founder stories",
      "Ingredient explainers",
      "Skincare guides",
      "Seasonal edits",
      "Curated collections",
      "“Spotlight by SkinLabs®”",
      "The Skin Deep Podcast",
      "Social/editorial campaigns",
    ],
    provideLabel: "Partner may provide",
    mayProvide: ["Product samples", "Product information", "Expert commentary", "Founder interviews", "Approved imagery", "Videos", "Brand assets", "Scientific or technical documentation", "Educational resources"],
    commercialLabel: "Commercial model",
    commercialModel: "Editorial partnerships may be collaborative, gifted, compensated or structured as a broader commercial partnership depending on the scope and nature of the engagement.",
    guidelinesLabel: "Critical editorial guidelines",
    guidelines: [
      "Editorial collaboration does not guarantee a favourable review, ranking or recommendation.",
      "SkinLabs® maintains editorial discretion over content, product selection and conclusions.",
      "Sponsored or commercially supported content will be identified appropriately.",
      "Products may be evaluated against SkinLabs® editorial and product-review criteria.",
      "Partner-provided claims may be independently reviewed, contextualised or qualified.",
    ],
    cta: "Explore an Editorial Partnership",
    depth: 2,
  },
  {
    id: "strategic",
    number: "03",
    anchorId: "strategic-commerce-partner",
    icon: Handshake,
    label: "Strategic Commerce Partner",
    headline: "Build a Commerce Partnership With SkinLabs®",
    shortDescription: "For brands and retailers looking to integrate more deeply into the SkinLabs® discovery and commerce ecosystem.",
    detailedDescription:
      "Strategic Commerce Partnerships are designed for organisations that want more than individual affiliate links or editorial exposure. These partnerships can combine commerce, content, product discovery, campaigns, data-informed merchandising and deeper platform integrations.",
    bestFor: ["Established skincare brands", "Major beauty retailers", "Ecommerce businesses", "Distributors", "Product marketplaces", "Professional skincare companies", "Strategic industry partners"],
    opportunitiesLabel: "Potential opportunities",
    opportunities: [
      "Product catalogue integrations",
      "Product feeds",
      "“Where to Buy” integrations",
      "Product comparison engine integration",
      "Featured product collections",
      "Strategic campaigns",
      "Sponsored placements",
      "Branded editorial initiatives",
      "Seasonal campaigns",
      "Launch campaigns",
      "Exclusive offers",
      "Promotional codes",
      "Co-branded content",
      "Lead-generation campaigns",
      "Product discovery experiences",
      "API/data integrations where technically appropriate",
    ],
    provideLabel: "Potential commercial structures",
    mayProvide: ["Monthly partnership packages", "Campaign-based fees", "Sponsored placements", "Fixed commercial agreements", "Affiliate revenue", "Hybrid commercial models", "Custom integrations"],
    commercialLabel: "Commercial model",
    commercialModel: "Commercial terms are tailored to the scope, audience, integration requirements and objectives of each partnership.",
    guidelinesLabel: "Guidelines",
    guidelines: [
      "Strategic partnerships require approval by SkinLabs®.",
      "Scope, deliverables, commercial terms and timelines will be agreed in writing.",
      "Brand participation does not automatically guarantee editorial endorsement.",
      "Sponsored placements must remain distinguishable from independent editorial content.",
      "Product claims and marketing materials remain subject to review.",
      "Integrations may require technical, legal and commercial assessment.",
      "SkinLabs® may decline partnerships that conflict with its brand standards, consumer interests or editorial principles.",
    ],
    cta: "Discuss a Strategic Partnership",
    depth: 3,
  },
];

export type ComparisonValue = string | boolean;

export interface ComparisonRow {
  label: string;
  affiliate: ComparisonValue;
  editorial: ComparisonValue;
  strategic: ComparisonValue;
}

export const comparisonRows: ComparisonRow[] = [
  { label: "Primary objective", affiliate: "Performance commerce", editorial: "Brand storytelling", strategic: "Integrated growth & commerce" },
  { label: "Commercial model", affiliate: "Performance-based", editorial: "Collaborative / gifted / compensated", strategic: "Custom commercial agreement" },
  { label: "Product links", affiliate: true, editorial: false, strategic: true },
  { label: "Editorial opportunities", affiliate: false, editorial: true, strategic: true },
  { label: "Product reviews", affiliate: false, editorial: true, strategic: true },
  { label: "Brand storytelling", affiliate: false, editorial: true, strategic: true },
  { label: "Campaigns", affiliate: false, editorial: "Where relevant", strategic: true },
  { label: "Product feeds", affiliate: "Where applicable", editorial: false, strategic: true },
  { label: "Sponsored placements", affiliate: false, editorial: "Where disclosed", strategic: true },
  { label: "Custom integrations", affiliate: false, editorial: false, strategic: true },
  { label: "Best suited for", affiliate: "Product-focused businesses", editorial: "Brands & professionals with a story to tell", strategic: "Established brands & retailers" },
];

export interface ProcessStep {
  number: string;
  title: string;
}

export const processSteps: ProcessStep[] = [
  { number: "01", title: "Tell Us About Your Business" },
  { number: "02", title: "Choose Your Partnership Direction" },
  { number: "03", title: "Meet With Our Team" },
  { number: "04", title: "Launch & Grow" },
];

export interface PartnerType {
  title: string;
  description: string;
}

export const partnerTypes: PartnerType[] = [
  { title: "Skincare Brands", description: "Emerging, established and specialist skincare brands." },
  { title: "Beauty Retailers", description: "Online and physical retailers with relevant product ranges." },
  { title: "Dermatologists & Clinics", description: "Qualified professionals and practices contributing expertise and services." },
  { title: "Aesthetic & Wellness Businesses", description: "Businesses operating within the broader skincare, beauty and wellness ecosystem." },
  { title: "Distributors & Marketplaces", description: "Organisations enabling consumers to access relevant skincare products." },
  { title: "Experts & Industry Professionals", description: "Researchers, formulators, educators and subject-matter experts." },
];

export interface PartnerPrinciple {
  title: string;
  description: string;
}

export const partnerPrinciples: PartnerPrinciple[] = [
  { title: "Consumer First", description: "Partnerships must create genuine value for SkinLabs® users." },
  { title: "Editorial Independence", description: "Commercial relationships do not automatically influence editorial conclusions." },
  { title: "Transparency", description: "Commercial relationships and sponsored content will be disclosed appropriately." },
  { title: "Quality", description: "We prioritise relevant products, credible businesses and useful consumer experiences." },
  { title: "Compliance", description: "Partners are expected to comply with applicable advertising, consumer protection, product and regulatory requirements." },
  { title: "Long-Term Thinking", description: "We favour partnerships capable of creating sustainable value rather than short-term exposure." },
];

export interface PartnerFaq {
  q: string;
  a: string;
}

export const partnerFaqs: PartnerFaq[] = [
  {
    q: "What does it cost to become a SkinLabs® partner?",
    a: "Some partnerships are performance-based, while others involve agreed commercial fees or custom partnership structures. Commercial terms depend on the partnership model, scope and objectives. Contact our team to discuss your requirements.",
  },
  {
    q: "Can a small or emerging skincare brand apply?",
    a: "Yes. SkinLabs® works with businesses at different stages of growth. Partnership suitability depends on product relevance, quality, audience fit and the proposed collaboration.",
  },
  {
    q: "Does becoming an affiliate partner guarantee a product review?",
    a: "No. Affiliate participation does not guarantee editorial coverage, rankings or reviews. SkinLabs® maintains editorial discretion.",
  },
  {
    q: "Can we provide products for review?",
    a: "Yes. Product samples may be considered for relevant editorial or review opportunities. Submission does not guarantee publication or a positive assessment.",
  },
  {
    q: "Can SkinLabs® create a custom campaign for our brand?",
    a: "Yes. Strategic Commerce Partnerships can include customised campaigns, content, commerce placements and other initiatives depending on requirements.",
  },
  {
    q: "Can retailers integrate their product catalogue?",
    a: "Potentially. Product feed and catalogue integrations can be considered as part of a Strategic Commerce Partnership, subject to technical and commercial requirements.",
  },
  {
    q: "Do you work with dermatologists and skincare professionals?",
    a: "Yes. SkinLabs® welcomes qualified professionals and practices interested in educational, editorial, directory, referral or strategic collaborations.",
  },
  {
    q: "Will sponsored content be disclosed?",
    a: "Yes. Commercially supported content and relevant commercial relationships will be identified appropriately.",
  },
  {
    q: "How long does the partnership process take?",
    a: "Timing depends on the partnership model and complexity. The first step is a conversation with our team to understand the opportunity.",
  },
];

export const enquiryPartnershipModelOptions = [
  { value: "affiliate", label: "Affiliate Partner" },
  { value: "editorial", label: "Editorial Partner" },
  { value: "strategic_commerce", label: "Strategic Commerce Partner" },
  { value: "not_sure", label: "Not Sure — Recommend a Partnership Model" },
];
