/**
 * SkinLabs Knowledge Hub — structured content layer.
 *
 * This replaces the old hard-coded FAQ.tsx array. Every entry carries evidence
 * provenance, review metadata, risk level and contextual related-content links so
 * the same structured data can drive visible UI, client-side search, FAQPage
 * JSON-LD and future CMS migration without changing the shape callers depend on.
 *
 * Editorial rules this file follows (see brand voice + Knowledge Hub blueprint):
 *  - Membership/entitlement facts are derived from src/data/plans.ts, never
 *    hand-typed twice.
 *  - Retailer prices, shipping thresholds and stock claims are avoided — they
 *    go stale fast and aren't ours to promise.
 *  - Claims use conservative verbs ("may help", "can support") rather than
 *    guarantees, and higher-risk topics carry an explicit safety boundary.
 */
import { getPlan, MONEY_BACK_GUARANTEE_DAYS, PODCAST_FREE_MONTHLY, COMPARE_FREE_MONTHLY, type MembershipPlan } from "./plans";

export type FAQCategoryId =
  | "about"
  | "skin-basics"
  | "ingredients"
  | "concerns"
  | "routines"
  | "sun-protection"
  | "south-africa"
  | "products"
  | "membership";

export interface FAQCategoryMeta {
  id: FAQCategoryId;
  title: string;
  shortLabel: string;
  description: string;
  /** lucide-react icon name, resolved in the Knowledge Hub UI */
  icon: string;
}

export type EvidenceSourceType = "AAD" | "DermNet" | "PubMed" | "OfficialProduct" | "SkinKnowledgeBase";

export interface EvidenceSource {
  sourceType: EvidenceSourceType;
  title: string;
  url: string;
  /** What this specific source backs up — shown in the evidence drawer */
  supports: string;
}

export type RiskLevel = "low" | "moderate" | "high";

export interface FAQEntry {
  id: string;
  slug: string;
  question: string;
  /** Direct answer first, nuance second — see answerStructure convention below */
  answer: string;
  category: FAQCategoryId;
  tags: string[];
  relatedQuestions: string[];
  relatedPages: { label: string; href: string }[];
  evidence: EvidenceSource[];
  lastReviewed: string;
  reviewedBy?: string;
  riskLevel: RiskLevel;
  geography?: "global" | "south-africa";
  commercial?: boolean;
  /** Extra escalation/safety line rendered with a stronger visual treatment */
  safetyNote?: string;
}

export const KNOWLEDGE_HUB_REVIEW_DATE = "2026-08-31";
const REVIEWER = "SkinLabs Editorial Team";

export const GLOBAL_SAFETY_NOTICE =
  "SkinLabs provides educational skincare information, not medical diagnosis or treatment. Persistent symptoms, severe reactions, unusual lesions and significant skin concerns should be assessed by a qualified healthcare professional.";

export const CATEGORIES: FAQCategoryMeta[] = [
  {
    id: "about",
    title: "About SkinLabs",
    shortLabel: "About",
    description: "What SkinLabs is, how the AI formulator works and what's actually free.",
    icon: "Atom",
  },
  {
    id: "skin-basics",
    title: "Skin Basics",
    shortLabel: "Skin Basics",
    description: "Skin types, dehydration and the fundamentals everything else builds on.",
    icon: "Fingerprint",
  },
  {
    id: "ingredients",
    title: "Ingredients",
    shortLabel: "Ingredients",
    description: "Retinoids, niacinamide, vitamin C, acids and what the evidence actually says.",
    icon: "FlaskConical",
  },
  {
    id: "concerns",
    title: "Concerns",
    shortLabel: "Concerns",
    description: "Acne, pigmentation, sensitivity and aging — what's driving them and what helps.",
    icon: "Target",
  },
  {
    id: "routines",
    title: "Routines",
    shortLabel: "Routines",
    description: "Order of application, timing, combining actives and not overdoing it.",
    icon: "ListChecks",
  },
  {
    id: "sun-protection",
    title: "Sun Protection",
    shortLabel: "Sun",
    description: "SPF, UVA/UVB, reapplication and sunscreen for South African conditions.",
    icon: "Sun",
  },
  {
    id: "south-africa",
    title: "South Africa",
    shortLabel: "South Africa",
    description: "Climate, altitude, skin tone and what actually changes for SA routines.",
    icon: "MapPin",
  },
  {
    id: "products",
    title: "Products & Shopping",
    shortLabel: "Shopping",
    description: "Where to buy, what's worth it and how delivery and returns generally work.",
    icon: "ShoppingBag",
  },
  {
    id: "membership",
    title: "Membership & Platform",
    shortLabel: "Membership",
    description: "Plans, pricing and exactly what each SkinLabs tier includes.",
    icon: "Crown",
  },
];

export const POPULAR_QUESTION_IDS = [
  "routines-retinol-vitamin-c",
  "sun-protection-need-sunscreen-sa",
  "concerns-hyperpigmentation",
  "concerns-acne-prone",
  "ingredients-niacinamide",
];

/* -------------------------------------------------------------------------- */
/* Membership copy — derived from src/data/plans.ts (single source of truth) */
/* -------------------------------------------------------------------------- */

const explorer = getPlan("explorer") as MembershipPlan;
const insider = getPlan("insider") as MembershipPlan;
const vip = getPlan("vip") as MembershipPlan;

const featureLike = (plan: MembershipPlan, needle: string, fallback: string) =>
  plan.features.find((f) => f.toLowerCase().includes(needle.toLowerCase())) ?? fallback;

const explorerAiLine = featureLike(explorer, "AI skin analysis", "1 basic AI skin analysis per month");
const explorerBriefingLine = featureLike(explorer, "Daily Skinny briefing", "3 full Daily Skinny briefings per week");
const insiderAiLine = featureLike(insider, "AI skincare analysis", "1 standard AI skincare analysis per week");
const vipConsultLine = featureLike(vip, "consultation", "1 virtual derm consultation per month");
const insiderMoneyBack = insider.moneyBackDays ?? MONEY_BACK_GUARANTEE_DAYS;

const membershipSummaryAnswer =
  `Yes — three tiers. ${explorer.name} is free forever: ${explorerAiLine.toLowerCase()}, ${explorerBriefingLine.toLowerCase()}, ` +
  `limited product review access, ${PODCAST_FREE_MONTHLY} free podcast episode a month and ${COMPARE_FREE_MONTHLY} free comparison articles a month. ` +
  `${insider.name} (R${insider.priceMonthly}/month or R${insider.priceAnnual}/year) unlocks a custom AI routine, ${insiderAiLine.toLowerCase()}, ` +
  `the full podcast library, unlimited product reviews and full Spotlight brand profiles — it starts with a 7-day free trial, no card required, ` +
  `and carries a ${insiderMoneyBack}-day money-back guarantee once you subscribe. ${vip.name} (R${vip.priceMonthly}/month) adds everything in ${insider.name} ` +
  `plus ${vipConsultLine.toLowerCase()} and priority booking with SA practitioners.`;

const aiQuotaAnswer =
  `It depends on your plan, and this is the exact entitlement — not a rough estimate. ${explorer.name} (free) includes ${explorerAiLine.toLowerCase()}. ` +
  `${insider.name} steps that up to ${insiderAiLine.toLowerCase()}, re-analysed as your skin or routine changes. Need a human alongside the AI? ` +
  `${vip.name} adds ${vipConsultLine.toLowerCase()} on top of everything in Insider. Full feature-by-feature comparison lives on the Pricing page.`;

/* -------------------------------------------------------------------------- */
/* Entries                                                                     */
/* -------------------------------------------------------------------------- */

export const faqEntries: FAQEntry[] = [
  // ---------------------------------------------------------------- About --
  {
    id: "about-what-is-skinlabs",
    slug: "what-is-skinlabs",
    question: "What is SkinLabs?",
    answer:
      "SkinLabs is South Africa's independent skincare intelligence platform. Tell us your skin, your concerns, your lifestyle and your climate, and the AI Formulator builds a routine around it — grounded in dermatological science and local market knowledge, not guesswork. We also publish independent product reviews, daily skin science briefings and brand rankings, funded by members rather than brand deals.",
    category: "about",
    tags: ["skinlabs", "platform", "overview"],
    relatedQuestions: ["about-ai-formulator-works", "about-is-free", "membership-subscription-service"],
    relatedPages: [
      { label: "How SkinLabs scores products", href: "/about#science" },
      { label: "Start your skin analysis", href: "/ai-formulator" },
    ],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "about-only-for-sa",
    slug: "is-skinlabs-only-for-south-africa",
    question: "Is SkinLabs only for South African users?",
    answer:
      "It's built specifically for South Africa — our local climate, common skin concerns and what's actually on shelves here — but anyone can use the platform. Just know our product picks and Rand pricing are optimised for SA, so some recommendations may be harder to action if you're shopping from elsewhere.",
    category: "about",
    tags: ["south africa", "eligibility"],
    relatedQuestions: ["south-africa-climate-effect", "about-what-is-skinlabs"],
    relatedPages: [{ label: "South African climate context", href: "/knowledge-hub#south-africa" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "about-ai-formulator-works",
    slug: "how-does-the-ai-formulator-work",
    question: "How does the AI formulator work?",
    answer:
      "You work through a short skin-profile quiz — oiliness, pores, breakouts, dryness, sensitivity and your day-to-day environment — and can optionally add a photo. The AI Formulator uses that, plus your stated concerns, budget and consistency level, to recommend a routine and the actives that make sense for you. It's built for South African conditions and shelves, but it's educational and routine guidance — not a medical diagnosis, and not a substitute for seeing a dermatologist about a specific condition.",
    category: "about",
    tags: ["ai formulator", "quiz", "how it works"],
    relatedQuestions: ["about-what-is-skinlabs", "routines-basic-routine"],
    relatedPages: [{ label: "Start your skin analysis", href: "/ai-formulator" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
    geography: "south-africa",
    safetyNote:
      "The AI Formulator gives educational routine guidance, not a diagnosis. See a dermatologist for a specific skin condition, persistent symptoms or before starting active treatment if you're pregnant, breastfeeding or on medication.",
  },
  {
    id: "about-is-free",
    slug: "is-skinlabs-free-to-use",
    question: "Is SkinLabs free to use?",
    answer: membershipSummaryAnswer,
    category: "about",
    tags: ["free", "pricing", "membership"],
    relatedQuestions: ["membership-subscription-service", "membership-ai-quotas"],
    relatedPages: [{ label: "Compare plans on Pricing", href: "/pricing" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    commercial: true,
  },
  {
    id: "about-do-you-sell",
    slug: "does-skinlabs-sell-products",
    question: "Do you sell skincare products?",
    answer:
      "No — we're not a retailer. SkinLabs gives you independent recommendations and links you to trusted South African retailers where you can actually buy the products we cover. That separation is deliberate: it's what lets us score honestly instead of steering you toward whatever we'd earn a cut on.",
    category: "about",
    tags: ["retailer", "independence", "commercial relationships"],
    relatedQuestions: ["products-where-to-buy", "products-authentic-brands"],
    relatedPages: [{ label: "Our scoring methodology", href: "/spotlight/methodology" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },

  // ----------------------------------------------------------- Skin Basics --
  {
    id: "skin-basics-types",
    slug: "what-skin-types-do-you-cater-to",
    question: "What skin types do you cater to?",
    answer:
      "All of them — oily, dry, combination, sensitive and mature. The AI Formulator factors in your specific skin profile plus South African climate conditions before recommending anything, rather than assuming one default skin type.",
    category: "skin-basics",
    tags: ["skin type", "oily", "dry", "combination", "sensitive"],
    relatedQuestions: ["skin-basics-know-your-type", "about-ai-formulator-works"],
    relatedPages: [{ label: "Start your skin analysis", href: "/ai-formulator" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — skin type reference", url: "https://dermnetnz.org/", supports: "General skin-type classification" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "skin-basics-know-your-type",
    slug: "how-do-i-know-my-skin-type",
    question: "How do I know my skin type?",
    answer:
      "Our AI Formulator includes a skin analysis quiz that works this out for you in a couple of minutes. Or just pay attention: oily skin feels greasy by midday, dry skin feels tight or flaky, combination has an oily T-zone with normal-to-dry cheeks, and sensitive skin reacts easily — stinging, redness or itching — to new products.",
    category: "skin-basics",
    tags: ["skin type", "self assessment"],
    relatedQuestions: ["skin-basics-types", "about-ai-formulator-works"],
    relatedPages: [{ label: "Take the skin analysis quiz", href: "/ai-formulator" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — skin care basics", url: "https://www.aad.org/public", supports: "Skin-type self-assessment signs" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "skin-basics-gauteng-dryness",
    slug: "what-causes-dry-skin-in-gauteng",
    question: "What causes dry skin in Gauteng?",
    answer:
      "Gauteng's high altitude and low humidity — especially in winter — speed up trans-epidermal water loss (TEWL, or moisture escaping through your skin), which is why skin feels tight and flaky. Richer moisturisers built around ceramides and humectants, sealed in with an occlusive layer (think a balm or an oil on top), help slow that water loss down.",
    category: "skin-basics",
    tags: ["gauteng", "dry skin", "altitude", "TEWL"],
    relatedQuestions: ["ingredients-ceramides", "south-africa-climate-effect"],
    relatedPages: [{ label: "Winter seasonal guide", href: "/seasonals/winter" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — barrier function & TEWL", url: "https://dermnetnz.org/", supports: "Trans-epidermal water loss mechanism" },
      { sourceType: "PubMed", title: "PubMed — altitude and skin barrier research", url: "https://pubmed.ncbi.nlm.nih.gov/?term=altitude+skin+barrier+transepidermal+water+loss", supports: "Altitude/humidity effects on skin barrier" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },

  // ----------------------------------------------------------- Ingredients --
  {
    id: "ingredients-niacinamide",
    slug: "what-is-niacinamide-and-what-does-it-do",
    question: "What is niacinamide and what does it do?",
    answer:
      "Niacinamide is basically vitamin B3 for your skin. It's a workhorse — research suggests it can help calm inflammation, minimise the look of pores, help regulate oil and support an even skin tone over time. It suits most skin types and layers easily with almost everything else, and it's widely available in SA brands like Standard Beauty and Skoon.",
    category: "ingredients",
    tags: ["niacinamide", "vitamin b3", "pores", "oil control", "pigmentation"],
    relatedQuestions: ["ingredients-vitamin-c", "concerns-hyperpigmentation"],
    relatedPages: [{ label: "Read niacinamide product reviews", href: "/reviews?q=niacinamide" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — niacinamide", url: "https://dermnetnz.org/", supports: "Mechanism and general use" },
      { sourceType: "PubMed", title: "PubMed — niacinamide topical studies", url: "https://pubmed.ncbi.nlm.nih.gov/?term=niacinamide+topical+skin", supports: "Clinical evidence on oil, tone and barrier" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "ingredients-retinoids-safe",
    slug: "are-retinoids-safe-for-all-skin-types",
    question: "Are retinoids safe for all skin types?",
    answer:
      "Retinoids (vitamin A derivatives) are genuinely effective for anti-aging and acne, but \"retinoid\" covers a range — cosmetic retinol, retinal, prescription-strength adapalene and tretinoin all differ in strength and how they're used. There's no single universal starting percentage; check the product's own directions and your tolerance. Most people do best starting low, using it 2–3 times a week, and always pairing it with daytime sunscreen, since retinoids increase sun sensitivity.",
    category: "ingredients",
    tags: ["retinoids", "retinol", "tretinoin", "adapalene", "anti-aging"],
    relatedQuestions: ["routines-retinol-vitamin-c", "sun-protection-spf"],
    relatedPages: [{ label: "Read retinoid product reviews", href: "/reviews?q=retinol" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — retinoids", url: "https://www.aad.org/public", supports: "Retinoid use, tolerance-building and sun sensitivity" },
      { sourceType: "PubMed", title: "PubMed — topical retinoid research", url: "https://pubmed.ncbi.nlm.nih.gov/?term=topical+retinoid+skin+tolerability", supports: "Efficacy and irritation profile across retinoid types" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
    safetyNote:
      "Retinoids are not recommended during pregnancy or while breastfeeding. If either applies to you, talk to a doctor or dermatologist before starting one.",
  },
  {
    id: "ingredients-aha-bha",
    slug: "whats-the-difference-between-ahas-and-bhas",
    question: "What's the difference between AHAs and BHAs?",
    answer:
      "AHAs (like glycolic and lactic acid) are water-soluble and work mainly at the skin's surface — good for dryness and dullness. Salicylic acid, the main BHA, is oil-soluble, so it can get into oil-filled pores — useful for oily and acne-prone skin. That's a useful starting distinction, not a rigid rule: formulation, concentration and pH all affect how any given product actually behaves on your skin.",
    category: "ingredients",
    tags: ["aha", "bha", "salicylic acid", "glycolic acid", "exfoliation"],
    relatedQuestions: ["routines-over-exfoliating", "concerns-acne-prone"],
    relatedPages: [{ label: "Read exfoliant reviews", href: "/reviews?q=exfoliant" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — alpha and beta hydroxy acids", url: "https://dermnetnz.org/", supports: "AHA/BHA mechanism and skin-type suitability" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
  },
  {
    id: "ingredients-vitamin-c",
    slug: "do-i-really-need-vitamin-c-serum",
    question: "Do I really need vitamin C serum?",
    answer:
      "Not mandatory, but it earns its place — a solid antioxidant that research suggests can help brighten skin, fade dark spots over time and support your skin's defence against environmental damage, which matters given how much sun South Africa gets. Worth knowing: L-ascorbic acid has the strongest evidence base but is relatively unstable (degrades with light/air), while derivatives like ascorbyl glucoside are more stable but not automatically equivalent in effect. Both are reasonable choices — stability just affects shelf life and how the product should be stored.",
    category: "ingredients",
    tags: ["vitamin c", "l-ascorbic acid", "antioxidant", "brightening"],
    relatedQuestions: ["ingredients-niacinamide", "concerns-hyperpigmentation"],
    relatedPages: [{ label: "Read vitamin C serum reviews", href: "/reviews?q=vitamin+c" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — topical vitamin C / L-ascorbic acid", url: "https://pubmed.ncbi.nlm.nih.gov/?term=topical+vitamin+c+ascorbic+acid+skin", supports: "Antioxidant and brightening evidence, stability profile" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "ingredients-ceramides",
    slug: "what-are-ceramides",
    question: "What are ceramides?",
    answer:
      "Ceramides are lipids (fats) that make up a large part of your skin's protective barrier. Products containing them can help support that barrier and reduce water loss, which matters more in SA's harsher climates — dry Highveld winters especially. They're not a treatment for a specific concern so much as a foundation ingredient that helps everything else work better.",
    category: "ingredients",
    tags: ["ceramides", "barrier", "moisture"],
    relatedQuestions: ["skin-basics-gauteng-dryness", "routines-over-exfoliating"],
    relatedPages: [{ label: "Read moisturiser reviews", href: "/reviews?q=ceramide" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — skin barrier function", url: "https://dermnetnz.org/", supports: "Ceramide role in barrier structure" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "ingredients-hyaluronic-acid",
    slug: "is-hyaluronic-acid-good-for-dry-skin",
    question: "Is hyaluronic acid good for dry skin?",
    answer:
      "Yes, with a technique caveat. Hyaluronic acid is a humectant — it draws moisture toward itself rather than manufacturing it. In genuinely dry, low-humidity air (Gauteng winters, for instance), applying it and leaving it unsealed can theoretically pull some moisture from deeper skin layers instead of the air. The fix is simple: apply it to damp skin and follow with a moisturiser to lock the water in, rather than skipping that.",
    category: "ingredients",
    tags: ["hyaluronic acid", "humectant", "hydration"],
    relatedQuestions: ["skin-basics-gauteng-dryness", "ingredients-ceramides"],
    relatedPages: [{ label: "Read hyaluronic acid serum reviews", href: "/reviews?q=hyaluronic" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — hyaluronic acid topical hydration", url: "https://pubmed.ncbi.nlm.nih.gov/?term=hyaluronic+acid+topical+skin+hydration", supports: "Humectant mechanism and correct application" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "ingredients-parabens-sulfates",
    slug: "are-parabens-and-sulfates-bad",
    question: "Are parabens and sulfates bad?",
    answer:
      "Not inherently. Parabens are preservatives, sulfates are cleansing agents — both are generally considered safe at the concentrations used in cosmetics by major regulatory reviews, though some people are sensitive to them or simply prefer to avoid them. There's a lot of marketing doing the heavy lifting around \"paraben-free\" and \"sulfate-free\" labels — the absence of either doesn't automatically make a product better. Plenty of SA brands now offer paraben- and sulfate-free alternatives if you'd rather steer clear.",
    category: "ingredients",
    tags: ["parabens", "sulfates", "preservatives", "clean beauty"],
    relatedQuestions: ["ingredients-niacinamide"],
    relatedPages: [{ label: "Browse product reviews", href: "/reviews" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — cosmetic ingredient safety", url: "https://www.aad.org/public", supports: "Regulatory safety context for common preservatives" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "ingredients-snail-mucin",
    slug: "whats-the-deal-with-snail-mucin",
    question: "What's the deal with snail mucin?",
    answer:
      "Snail secretion filtrate contains glycoproteins, hyaluronic acid and glycolic acid, and can offer hydration and soothing support. Cute packaging, but let's be precise about what it does: the evidence for snail mucin specifically is still fairly limited, and composition varies by brand and preparation — it doesn't \"heal\" skin the way some marketing implies. Treat it as a hydration-and-soothing ingredient with promising but not proven standalone results, and judge it on how your skin actually responds.",
    category: "ingredients",
    tags: ["snail mucin", "hydration", "soothing"],
    relatedQuestions: ["ingredients-hyaluronic-acid"],
    relatedPages: [{ label: "Read snail mucin product reviews", href: "/reviews?q=snail" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — snail secretion filtrate skincare studies", url: "https://pubmed.ncbi.nlm.nih.gov/?term=snail+secretion+filtrate+skin", supports: "Limited evidence base and composition variability" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },

  // -------------------------------------------------------------- Concerns --
  {
    id: "concerns-acne-prone",
    slug: "can-you-help-with-acne-prone-skin",
    question: "Can you help with acne-prone skin?",
    answer:
      "Yes. We lean on evidence-based ingredients — salicylic acid, niacinamide, benzoyl peroxide — all available from South African brands, and the AI Formulator builds a routine around what's actually driving your breakouts. Results typically take 6–8 weeks of consistent use before you can fairly judge whether a routine is working, so give it time before switching everything.",
    category: "concerns",
    tags: ["acne", "breakouts", "salicylic acid", "benzoyl peroxide"],
    relatedQuestions: ["ingredients-aha-bha", "routines-results-timeline"],
    relatedPages: [{ label: "Read acne product reviews", href: "/reviews?q=acne" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — acne treatment", url: "https://www.aad.org/public", supports: "Evidence-based acne ingredients and expected timelines" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
    safetyNote:
      "Severe, cystic or scarring acne, or acne that isn't responding after a few months of consistent care, is worth taking to a dermatologist rather than continuing to self-treat.",
  },
  {
    id: "concerns-hyperpigmentation",
    slug: "i-have-hyperpigmentation-can-you-help",
    question: "I have hyperpigmentation. Can you help?",
    answer:
      "Yes — hyperpigmentation and post-inflammatory marks are common concerns here, especially on melanin-rich skin, where irritation itself can trigger dark marks. We recommend ingredients like vitamin C, niacinamide, azelaic acid and retinoids, which evidence supports for evening out skin tone over time, alongside daily SPF — without consistent sun protection, pigmentation treatments fight an uphill battle.",
    category: "concerns",
    tags: ["hyperpigmentation", "dark spots", "post-inflammatory", "melanin-rich skin"],
    relatedQuestions: ["south-africa-ingredients-skin-tones", "sun-protection-spf"],
    relatedPages: [{ label: "Read pigmentation-focused reviews", href: "/reviews?q=pigmentation" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — post-inflammatory hyperpigmentation treatment", url: "https://pubmed.ncbi.nlm.nih.gov/?term=post-inflammatory+hyperpigmentation+treatment", supports: "Ingredient evidence and pigmentation-prone skin mechanisms" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
  },
  {
    id: "concerns-sensitive-reactive",
    slug: "what-about-sensitive-or-reactive-skin",
    question: "What about sensitive or reactive skin?",
    answer:
      "We build routines around gentle, fragrance-free products that support the skin barrier rather than fight it. The goal is dodging common irritants — fragrance, high concentrations of actives, alcohol-based astringents — and keeping the routine minimal but effective, adding actives back in slowly once your skin is calmer.",
    category: "concerns",
    tags: ["sensitive skin", "reactive skin", "barrier", "fragrance-free"],
    relatedQuestions: ["ingredients-ceramides", "routines-over-exfoliating"],
    relatedPages: [{ label: "Read sensitive-skin product reviews", href: "/reviews?q=sensitive" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — sensitive skin", url: "https://dermnetnz.org/", supports: "Barrier-first approach for reactive skin" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "concerns-aging",
    slug: "can-skinlabs-help-with-aging-skin-concerns",
    question: "Can SkinLabs help with aging skin concerns?",
    answer:
      "Yes — we recommend routines built around retinoids, peptides, antioxidants and daily sunscreen, which the evidence backs as the most reliable, well-studied approach to fine lines, loss of firmness and uneven tone. There's no product that erases decades of sun exposure overnight, whatever an \"age-defying\" label implies — consistency over months, not a single hero product, is what actually moves the needle.",
    category: "concerns",
    tags: ["aging", "wrinkles", "retinoids", "peptides", "antioxidants"],
    relatedQuestions: ["ingredients-retinoids-safe", "sun-protection-spf"],
    relatedPages: [{ label: "Read anti-aging product reviews", href: "/reviews?q=anti-aging" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — anti-aging skincare", url: "https://www.aad.org/public", supports: "Evidence-based approaches to visible aging" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },

  // -------------------------------------------------------------- Routines --
  {
    id: "routines-basic-routine",
    slug: "whats-a-basic-skincare-routine",
    question: "What's a basic skincare routine?",
    answer:
      "Three steps: a cleanser to remove dirt and oil, a moisturiser to hydrate and support the barrier, and sunscreen (SPF 30+) every morning. That foundation works for every skin type — everything else (serums, treatments, exfoliants) is an addition once those three are consistent, not a replacement for them.",
    category: "routines",
    tags: ["basic routine", "cleanser", "moisturiser", "sunscreen"],
    relatedQuestions: ["routines-application-order", "sun-protection-spf"],
    relatedPages: [{ label: "Build your routine with the AI Formulator", href: "/ai-formulator" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — daily skincare basics", url: "https://www.aad.org/public", supports: "Minimum-effective-routine guidance" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "routines-summer-winter",
    slug: "should-i-use-different-products-in-summer-vs-winter",
    question: "Should I use different products in summer vs. winter?",
    answer:
      "Often, yes. In humid summer conditions — especially coastal regions — lighter gel moisturisers usually do the job. In dry inland winters, richer creams with occlusives make more sense. Sunscreen stays non-negotiable year-round either way; UV doesn't take winter off.",
    category: "routines",
    tags: ["seasonal", "summer", "winter", "moisturiser"],
    relatedQuestions: ["skin-basics-gauteng-dryness", "sun-protection-need-sunscreen-sa"],
    relatedPages: [{ label: "Seasonal skincare guides", href: "/seasonals" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "routines-application-order",
    slug: "in-what-order-should-i-apply-my-products",
    question: "In what order should I apply my products?",
    answer:
      "Thinnest to thickest, generally: cleanser, toner or essence, serum (water-based first, then oil-based), eye cream, moisturiser, then sunscreen. At night, drop the sunscreen and add your retinoid or treatment after serum instead.",
    category: "routines",
    tags: ["order", "layering", "am pm routine"],
    relatedQuestions: ["routines-basic-routine", "routines-best-time"],
    relatedPages: [{ label: "Build your routine with the AI Formulator", href: "/ai-formulator" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "routines-results-timeline",
    slug: "how-long-before-i-see-results",
    question: "How long before I see results?",
    answer:
      "Depends on what you're treating: hydration can improve within days, acne generally needs 6–8 weeks, hyperpigmentation needs 8–12 weeks, and visible anti-aging benefits from consistent retinoid use tend to show after 3–6 months. Results can vary by person — patience, and sticking with one routine long enough to judge it, does most of the work here.",
    category: "routines",
    tags: ["results", "timeline", "patience"],
    relatedQuestions: ["concerns-acne-prone", "concerns-hyperpigmentation"],
    relatedPages: [{ label: "Track your routine progress", href: "/dashboard" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "routines-retinol-vitamin-c",
    slug: "can-i-use-retinol-and-vitamin-c-together",
    question: "Can I use retinol and vitamin C together?",
    answer:
      "Yes — you can use both in the same overall routine. The simplest, lowest-irritation default is vitamin C in the morning under sunscreen, retinol at night, so you're not layering two potentially irritating actives in one application. Some formulations are gentle enough to use closer together, but if your skin is sensitive or new to actives, keeping them on separate shifts is the safer starting point.",
    category: "routines",
    tags: ["retinol", "vitamin c", "combining actives"],
    relatedQuestions: ["ingredients-retinoids-safe", "ingredients-vitamin-c"],
    relatedPages: [{ label: "Read retinol vs vitamin C ingredient guide", href: "/reviews?q=retinol" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — combining topical actives", url: "https://dermnetnz.org/", supports: "AM/PM separation rationale for retinoids and vitamin C" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
  },
  {
    id: "routines-best-time",
    slug: "whats-the-best-time-to-do-my-skincare-routine",
    question: "What's the best time to do my skincare routine?",
    answer:
      "Cleanse and treat morning and night. Mornings should always finish with sunscreen. Nights are the better window for actives like retinoids and AHAs, since you're not heading out into UV straight after applying them.",
    category: "routines",
    tags: ["am routine", "pm routine", "timing"],
    relatedQuestions: ["routines-application-order", "sun-protection-spf"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "routines-over-exfoliating",
    slug: "how-do-i-know-if-im-over-exfoliating",
    question: "How do I know if I'm over-exfoliating?",
    answer:
      "Watch for redness, stinging when you apply products, extra sensitivity, flaking and new breakouts — signs your barrier is compromised rather than your skin being \"purged.\" If that's happening, drop all acids and retinoids for a while, stick to gentle cleansing and moisturising, and rebuild your barrier with ceramide-rich products before reintroducing actives slowly.",
    category: "routines",
    tags: ["over-exfoliating", "barrier damage", "purging"],
    relatedQuestions: ["ingredients-aha-bha", "ingredients-ceramides"],
    relatedPages: [{ label: "Read barrier-repair product reviews", href: "/reviews?q=barrier" }],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — irritant contact dermatitis & barrier damage", url: "https://dermnetnz.org/", supports: "Signs of compromised skin barrier from over-exfoliation" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
    safetyNote:
      "If symptoms are severe, spreading, or don't settle within a couple of weeks of stripping the routine back, see a dermatologist rather than continuing to self-treat.",
  },
  {
    id: "routines-toner",
    slug: "do-i-need-a-toner",
    question: "Do I need a toner?",
    answer:
      "Not essential, but it can help. Hydrating toners with glycerin or hyaluronic acid add moisture; acid toners (AHA/BHA) offer gentle exfoliation. Skip the old-school alcohol-based astringent kind — those tend to strip more than they help, especially in SA's drier inland regions.",
    category: "routines",
    tags: ["toner", "essence"],
    relatedQuestions: ["routines-basic-routine", "ingredients-aha-bha"],
    relatedPages: [{ label: "Read toner product reviews", href: "/reviews?q=toner" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },

  // --------------------------------------------------------- Sun Protection --
  {
    id: "sun-protection-need-sunscreen-sa",
    slug: "do-i-need-sunscreen-in-south-africa",
    question: "Do I need sunscreen in South Africa?",
    answer:
      "Yes. South Africa's UV levels run high for large parts of the year, and how much you're actually exposed depends on season, latitude, altitude, time of day and how long you're outside — not a flat \"high year-round\" number. Sunscreen is one of the most effective, well-evidenced ways to help prevent sunburn, premature aging, hyperpigmentation and skin cancer, whatever the day's exact UV index.",
    category: "sun-protection",
    tags: ["sunscreen", "spf", "uv", "south africa"],
    relatedQuestions: ["sun-protection-spf", "south-africa-climate-effect"],
    relatedPages: [{ label: "Read sunscreen product reviews", href: "/reviews?q=sunscreen" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — sunscreen FAQs", url: "https://www.aad.org/public", supports: "Sunscreen's role in preventing UV skin damage" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "sun-protection-spf",
    slug: "what-spf-should-i-use",
    question: "What SPF should I use?",
    answer:
      "SPF 30 is the usual dermatologist-recommended minimum for daily wear; SPF 50 gives you more headroom on high-exposure days. Apply generously — a practical rule of thumb is about two finger-lengths of product for face and neck — and reapply roughly every two hours outdoors, or straight after swimming or heavy sweating. Check your specific product's label for its exact application guidance too.",
    category: "sun-protection",
    tags: ["spf", "reapplication", "sunscreen amount"],
    relatedQuestions: ["sun-protection-need-sunscreen-sa", "sun-protection-chemical-vs-mineral"],
    relatedPages: [{ label: "Read sunscreen product reviews", href: "/reviews?q=sunscreen" }],
    evidence: [
      { sourceType: "AAD", title: "American Academy of Dermatology — how to apply sunscreen", url: "https://www.aad.org/public", supports: "SPF selection and application quantity" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "sun-protection-chemical-vs-mineral",
    slug: "chemical-vs-mineral-sunscreen-which-is-better",
    question: "Chemical vs. mineral sunscreen — which is better?",
    answer:
      "Both work when applied correctly. Chemical sunscreens (avobenzone, octinoxate) absorb UV rays and tend to feel lighter. Mineral sunscreens (zinc oxide, titanium dioxide) work by both absorbing and scattering UV — not simply \"sitting on top and reflecting it,\" as older explanations put it — and modern formulas have moved past the heavy white cast. Mineral isn't automatically gentler for everyone, though it's often a reasonable first choice for very reactive or acne-prone skin. Honestly, the best sunscreen is the one you'll actually wear every single day.",
    category: "sun-protection",
    tags: ["chemical sunscreen", "mineral sunscreen", "zinc oxide"],
    relatedQuestions: ["sun-protection-spf", "sun-protection-oily-skin"],
    relatedPages: [{ label: "Read sunscreen product reviews", href: "/reviews?q=sunscreen" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — mineral vs chemical UV filter mechanisms", url: "https://pubmed.ncbi.nlm.nih.gov/?term=mineral+chemical+sunscreen+filter+mechanism", supports: "How mineral filters absorb and scatter UV" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "sun-protection-indoor",
    slug: "do-i-need-sunscreen-indoors",
    question: "Do I need sunscreen indoors?",
    answer:
      "Near windows, it's worth it — UVA rays can pass through ordinary glass and contribute to aging over time, even if you're not getting burned. Indoor UV exposure is generally much lower than being directly outside, though, so how much this matters depends on your setup: working from home right next to a sunny window is a different situation to sitting in a windowless office all day.",
    category: "sun-protection",
    tags: ["indoor sunscreen", "uva", "windows"],
    relatedQuestions: ["sun-protection-spf"],
    relatedPages: [],
    evidence: [
      { sourceType: "DermNet", title: "DermNet NZ — UVA and window glass", url: "https://dermnetnz.org/", supports: "UVA transmission through glass" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "sun-protection-makeup-spf",
    slug: "can-i-use-makeup-with-spf-instead",
    question: "Can I use makeup with SPF instead?",
    answer:
      "It's a nice bonus, not a substitute. You'd need to apply foundation far thicker than anyone actually does to hit the SPF stated on the label. Sunscreen first, makeup after — that order still stands.",
    category: "sun-protection",
    tags: ["makeup spf", "foundation"],
    relatedQuestions: ["sun-protection-spf"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
  },
  {
    id: "sun-protection-oily-skin",
    slug: "what-sunscreens-are-good-for-oily-skin",
    question: "What sunscreens are good for oily skin?",
    answer:
      "Look for oil-free, mattifying or gel formulas. South African brands like Heliocare and Solal offer lightweight options built for exactly this, and a sunscreen with niacinamide in the formula can help keep oil in check on top of the UV protection.",
    category: "sun-protection",
    tags: ["oily skin", "sunscreen", "mattifying"],
    relatedQuestions: ["sun-protection-chemical-vs-mineral", "ingredients-niacinamide"],
    relatedPages: [{ label: "Read sunscreen product reviews", href: "/reviews?q=sunscreen" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },

  // ------------------------------------------------------------- South Africa --
  {
    id: "south-africa-climate-effect",
    slug: "how-does-south-african-climate-affect-my-skincare-routine",
    question: "How does South African climate affect my skincare routine?",
    answer:
      "SA's climates pull in different directions: coastal humidity calls for lighter products, Highveld dryness calls for richer moisturisers, and seasonally high UV wherever you are makes sunscreen non-negotiable. The AI Formulator factors your location into every recommendation rather than assuming one national climate.",
    category: "south-africa",
    tags: ["climate", "humidity", "highveld", "coastal"],
    relatedQuestions: ["skin-basics-gauteng-dryness", "routines-summer-winter"],
    relatedPages: [{ label: "Seasonal skincare guides", href: "/seasonals" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "south-africa-ingredients-skin-tones",
    slug: "what-skincare-ingredients-work-best-for-south-african-skin-tones",
    question: "What skincare ingredients work best for South African skin tones?",
    answer:
      "There's no single \"South African skin type\" — skin tone, skin type and climate are three different things, and SA has enormous diversity across all three. For melanin-rich skin specifically, a genuinely common concern: niacinamide and gentle acids like mandelic acid for hyperpigmentation, vitamin C for brightening, and daily SPF to help stop dark spots forming in the first place. Harsh, stripping ingredients are more likely to trigger post-inflammatory hyperpigmentation on deeper skin tones through irritation, so a gentler approach usually pays off.",
    category: "south-africa",
    tags: ["melanin-rich skin", "skin tone", "hyperpigmentation"],
    relatedQuestions: ["concerns-hyperpigmentation", "ingredients-niacinamide"],
    relatedPages: [{ label: "Read pigmentation-focused reviews", href: "/reviews?q=pigmentation" }],
    evidence: [
      { sourceType: "PubMed", title: "PubMed — melanin-rich skin and post-inflammatory hyperpigmentation", url: "https://pubmed.ncbi.nlm.nih.gov/?term=melanin-rich+skin+post-inflammatory+hyperpigmentation", supports: "Irritation-to-pigmentation mechanism in deeper skin tones" },
    ],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "moderate",
    geography: "south-africa",
  },
  {
    id: "south-africa-authentic-brands",
    slug: "are-international-brands-sold-in-sa-authentic",
    question: "Are international brands sold in SA authentic?",
    answer:
      "Stick to authorised retailers — Clicks, Dis-Chem, Woolworths, Dermastore and official brand sites — to be confident about what you're getting. Be wary of steep discounts on general online marketplaces; counterfeit skincare does circulate in SA, and it's not always obvious from photos alone.",
    category: "south-africa",
    tags: ["authenticity", "counterfeit", "retailers"],
    relatedQuestions: ["products-where-to-buy"],
    relatedPages: [{ label: "Where to buy what we recommend", href: "/knowledge-hub#products" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "south-africa-overseas-tips",
    slug: "can-i-use-overseas-skincare-tips-in-south-africa",
    question: "Can I use overseas skincare tips in South Africa?",
    answer:
      "Some of it translates, not all of it. SA's UV environment often makes sunscreen more of a daily non-negotiable than in lower-UV climates, our drier inland regions want more occlusive moisturisers than a naturally humid climate does, and product availability isn't the same as in the US or UK content you might be watching. Treat overseas advice as a useful starting point, not a script to follow exactly.",
    category: "south-africa",
    tags: ["overseas advice", "tiktok", "social media skincare"],
    relatedQuestions: ["south-africa-climate-effect"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "south-africa-johannesburg-climate",
    slug: "whats-the-best-skincare-for-johannesburgs-climate",
    question: "What's the best skincare for Johannesburg's climate?",
    answer:
      "Johannesburg's high altitude and low humidity dry skin out fast, especially in winter. Hydrating serums (hyaluronic acid, applied to damp skin), rich moisturisers with ceramides, and consistent SPF do the heavy lifting — a humidifier indoors during winter can help with the dryness too, alongside your routine rather than instead of it.",
    category: "south-africa",
    tags: ["johannesburg", "highveld", "altitude"],
    relatedQuestions: ["skin-basics-gauteng-dryness", "ingredients-hyaluronic-acid"],
    relatedPages: [{ label: "Winter seasonal guide", href: "/seasonals/winter" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
  },
  {
    id: "south-africa-dermatologists",
    slug: "are-there-dermatologists-i-can-consult-in-south-africa",
    question: "Are there dermatologists I can consult in South Africa?",
    answer:
      "Yes — SkinLabs partners with registered dermatologists and skincare professionals across SA for virtual consultations, and many of them also see patients in person since they practise in major cities. Glow VIP members get one virtual consultation a month included; anyone can browse the practitioner directory to find someone independently.",
    category: "south-africa",
    tags: ["dermatologist", "consultation", "practitioner"],
    relatedQuestions: ["membership-ai-quotas"],
    relatedPages: [{ label: "Book a consultation", href: "/consultations" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },

  // ---------------------------------------------------- Products & Shopping --
  {
    id: "products-sa-brands",
    slug: "what-south-african-skincare-brands-do-you-recommend",
    question: "What South African skincare brands do you recommend?",
    answer:
      "Local, accessible brands including Skoon, Esse, Standard Beauty, Swiitch Beauty, African Extracts, Dermastore Select, Lelive and Clere — plus international brands widely available at Dis-Chem, Clicks and Woolworths. Spotlight ranks a much wider set of SA brands by our own published review scores, updated monthly, if you want the full picture.",
    category: "products",
    tags: ["sa brands", "local skincare", "recommendations"],
    relatedQuestions: ["products-where-to-buy", "products-drugstore-vs-expensive"],
    relatedPages: [{ label: "See SA skincare brands, ranked", href: "/spotlight" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-where-to-buy",
    slug: "where-can-i-buy-the-products-you-recommend",
    question: "Where can I buy the products you recommend?",
    answer:
      "Most of what we recommend is available at Clicks, Dis-Chem, Woolworths, Takealot and specialist retailers like Dermastore. Every product review links directly to where you can buy it — retailer availability and stock levels shift, so treat those links as the current source of truth rather than anything we state generally here.",
    category: "products",
    tags: ["retailers", "where to buy"],
    relatedQuestions: ["south-africa-authentic-brands", "about-do-you-sell"],
    relatedPages: [{ label: "Browse product reviews", href: "/reviews" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-drugstore-vs-expensive",
    slug: "are-drugstore-products-as-good-as-expensive-ones",
    question: "Are drugstore products as good as expensive ones?",
    answer:
      "Often, yes. Effective skincare comes down to active ingredients and their concentration, not the price tag or the packaging. Affordable brands like CeraVe, The Ordinary and local SA labels can hold their own against premium alternatives — we care about what's actually in the formula, not the marketing budget behind it.",
    category: "products",
    tags: ["affordable skincare", "value", "drugstore"],
    relatedQuestions: ["products-affordable-vitamin-c"],
    relatedPages: [{ label: "Compare products on value", href: "/compare" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    commercial: true,
  },
  {
    id: "products-affordable-vitamin-c",
    slug: "whats-a-good-affordable-vitamin-c-serum-in-sa",
    question: "What's a good affordable vitamin C serum in SA?",
    answer:
      "Standard Beauty's 10% Vitamin C + Ferulic Acid serum is a solid, locally made option worth a look. Skoon's Vitamin C serum is another reasonable local pick, and The Ordinary's vitamin C range shows up at select retailers when stock allows. Check current reviews and retailer links for pricing, since it moves.",
    category: "products",
    tags: ["vitamin c", "affordable", "budget"],
    relatedQuestions: ["ingredients-vitamin-c", "products-drugstore-vs-expensive"],
    relatedPages: [{ label: "Read vitamin C serum reviews", href: "/reviews?q=vitamin+c" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-moisturizer-under-r200",
    slug: "best-moisturizer-for-dry-skin-under-r200",
    question: "Best moisturizer for dry skin under R200?",
    answer:
      "CeraVe Moisturizing Cream (Dis-Chem and Clicks) is a reliable, well-evidenced pick for dry skin at this price. Eucerin Dry Skin Relief and Skoon's Basic Sensitive Fluid are also worth considering. One correction on an older recommendation of ours: general body lotions like Clere Hand & Body Lotion aren't positioned by the manufacturer for facial use, so we no longer suggest using a body-formulated product on your face — stick to products actually formulated and labelled for facial skin.",
    category: "products",
    tags: ["moisturiser", "dry skin", "budget"],
    relatedQuestions: ["ingredients-ceramides", "products-drugstore-vs-expensive"],
    relatedPages: [{ label: "Read moisturiser reviews", href: "/reviews?q=moisturiser" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-the-ordinary-sa",
    slug: "where-can-i-find-the-ordinary-products-in-sa",
    question: "Where can I find The Ordinary products in SA?",
    answer:
      "Stock shows up sporadically at select Woolworths stores and online through Dermastore and Takealot. Availability genuinely varies month to month, so check a couple of retailers directly, and it's worth having a backup product from a local brand in mind rather than waiting on restock.",
    category: "products",
    tags: ["the ordinary", "stock", "availability"],
    relatedQuestions: ["products-drugstore-vs-expensive"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-cost-range",
    slug: "how-much-do-recommended-products-typically-cost",
    question: "How much do recommended products typically cost?",
    answer:
      "It spans every budget: basic routines can run in the low hundreds of Rand total, mid-range routines cost more, and premium options go well beyond that. We always flag an affordable alternative where a genuinely comparable one exists — value matters more to us than price point. Exact current pricing lives on each product's retailer links rather than fixed numbers here, since prices change.",
    category: "products",
    tags: ["budget", "cost", "pricing"],
    relatedQuestions: ["products-drugstore-vs-expensive"],
    relatedPages: [{ label: "Browse product reviews", href: "/reviews" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-payment-methods",
    slug: "what-payment-methods-do-sa-retailers-accept",
    question: "What payment methods do SA retailers accept?",
    answer:
      "Most take credit/debit cards, and many support instant EFT and card-based instalment options like PayJustNow, Payflex or Mobicred on larger purchases. Exact payment options vary by retailer — check the checkout page of the specific store you're buying from for what's currently supported.",
    category: "products",
    tags: ["payment", "retailers", "instalments"],
    relatedQuestions: ["products-where-to-buy"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-shipping-delivery",
    slug: "how-does-shipping-and-delivery-work",
    question: "How does shipping and delivery work for products you recommend?",
    answer:
      "Since SkinLabs isn't a retailer, shipping cost, delivery time and any free-shipping threshold all depend entirely on which retailer you buy from. Most major SA retailers deliver within a few business days to major cities and a little longer to smaller towns, and several — Clicks and Dis-Chem included — offer in-store pickup as an alternative. Check the specific retailer's shipping page at checkout for current costs and timeframes, since these change and we'd rather send you to the source than guess.",
    category: "products",
    tags: ["shipping", "delivery"],
    relatedQuestions: ["products-returns", "about-do-you-sell"],
    relatedPages: [],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "products-returns",
    slug: "what-is-your-return-policy",
    question: "What's the return policy on skincare products?",
    answer:
      "Since we don't sell products ourselves, returns depend entirely on the retailer you bought from. As a general pattern, most SA retailers accept returns on unopened products within a set window with proof of purchase, and opened skincare is often excluded for hygiene reasons — though many make an exception for a genuine allergic reaction. Keep your receipt either way, and check the specific retailer's current returns policy before you open anything you might need to send back.",
    category: "products",
    tags: ["returns", "refunds"],
    relatedQuestions: ["products-shipping-delivery", "concerns-allergic-reaction"],
    relatedPages: [{ label: "SkinLabs membership money-back guarantee", href: "/terms-of-service#money-back-guarantee" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    geography: "south-africa",
    commercial: true,
  },
  {
    id: "concerns-allergic-reaction",
    slug: "what-if-i-have-an-allergic-reaction-to-a-product",
    question: "What if I have an allergic reaction to a product?",
    answer:
      "Stop using it immediately and rinse the area with lukewarm water. Most SA retailers will accept a return for a medical reason if you have proof of purchase, even on an opened product. If the reaction is severe — swelling, difficulty breathing, spreading rash, blistering — treat it as a medical emergency and get help straight away rather than waiting to see if it settles.",
    category: "products",
    tags: ["allergic reaction", "irritation", "safety"],
    relatedQuestions: ["products-returns", "routines-over-exfoliating"],
    relatedPages: [{ label: "Book a consultation", href: "/consultations" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "high",
    safetyNote:
      "A severe allergic reaction (swelling of the face or throat, difficulty breathing, widespread blistering or hives) needs urgent medical attention — go to a doctor, clinic or emergency room, don't wait it out.",
  },

  // -------------------------------------------------------------- Membership --
  {
    id: "membership-subscription-service",
    slug: "do-you-have-a-subscription-service",
    question: "Do you have a subscription service?",
    answer: membershipSummaryAnswer,
    category: "membership",
    tags: ["subscription", "glow insider", "glow vip", "pricing"],
    relatedQuestions: ["membership-ai-quotas", "membership-hidden-costs"],
    relatedPages: [{ label: "Compare all plan details", href: "/pricing" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    commercial: true,
  },
  {
    id: "membership-ai-quotas",
    slug: "how-many-ai-skin-analyses-do-i-get",
    question: "How many AI skin analyses and consultations do I get per plan?",
    answer: aiQuotaAnswer,
    category: "membership",
    tags: ["ai quota", "glow insider", "glow vip", "consultations"],
    relatedQuestions: ["membership-subscription-service", "south-africa-dermatologists"],
    relatedPages: [{ label: "Start your skin analysis", href: "/ai-formulator" }, { label: "Compare all plan details", href: "/pricing" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    commercial: true,
  },
  {
    id: "membership-hidden-costs",
    slug: "are-there-any-hidden-costs",
    question: "Are there any hidden costs?",
    answer:
      "None from us — Glow Explorer is free to use, permanently, with no card required. Glow Insider's 7-day trial also needs no card upfront. Once you do subscribe to a paid plan, the price shown at checkout is what you pay — no surprise add-ons. When you're buying a physical product from a retailer we've linked to, just watch for that retailer's own shipping costs and check whether their displayed price already includes VAT (it usually does).",
    category: "membership",
    tags: ["hidden costs", "free trial", "pricing transparency"],
    relatedQuestions: ["membership-subscription-service"],
    relatedPages: [{ label: "Compare all plan details", href: "/pricing" }],
    evidence: [],
    lastReviewed: KNOWLEDGE_HUB_REVIEW_DATE,
    reviewedBy: REVIEWER,
    riskLevel: "low",
    commercial: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export const getCategoryMeta = (id: FAQCategoryId) => CATEGORIES.find((c) => c.id === id);

export const getEntryBySlug = (slug: string) => faqEntries.find((e) => e.slug === slug);

export const getEntryById = (id: string) => faqEntries.find((e) => e.id === id);

export const getEntriesByCategory = (id: FAQCategoryId) => faqEntries.filter((e) => e.category === id);

export const getRelatedEntries = (entry: FAQEntry) =>
  entry.relatedQuestions.map((id) => getEntryById(id)).filter((e): e is FAQEntry => Boolean(e));

export const getPopularEntries = () =>
  POPULAR_QUESTION_IDS.map((id) => getEntryById(id)).filter((e): e is FAQEntry => Boolean(e));

export const buildFaqJsonLd = (entries: FAQEntry[] = faqEntries) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: entries.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  })),
});
