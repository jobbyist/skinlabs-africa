/**
 * Spotlight by SkinLabs: a monthly, review-led ranking of South African skincare
 * brands. Not a popularity list, not a paid directory — every score is computed
 * live from SkinLabs' own published product review data (never hand-typed), and
 * every editorial note below is grounded in real, already-published verdict text
 * from src/data/reviews.ts. See /spotlight/methodology for what Methodology v1.0
 * actually measures.
 */
import { productReviews, overallScore, type ProductReview } from "./reviews";

export interface BrandEditorialOverlay {
  /** Must exactly match a `brand` value in productReviews. */
  brand: string;
  slug: string;
  positioningStatement: string;
  knownFor: string;
  /** 50–100 words. */
  skinlabsTake: string;
  /** 40–80 words. */
  whyTheyMadeTheList: string;
  brandStory?: string;
  officialWebsite?: string;
  /** Empty until the user uploads real brand assets — BrandLogo falls back to an initials badge. */
  logoUrl?: string;
  evidenceLimitation?: string;
}

export const brandEditorial: BrandEditorialOverlay[] = [
  {
    brand: "Standard Beauty",
    slug: "standard-beauty",
    positioningStatement: "South Africa's original affordable, evidence-led actives brand.",
    knownFor: "Ceramide barrier creams, niacinamide and entry-strength retinol at pharmacy prices.",
    skinlabsTake:
      "Standard Beauty is the brand we point beginners to first. Twelve products in our review set, and the pattern holds across nearly all of them: real, disclosed active concentrations, formulated with SA's climate in mind, priced like a brand that wants you to actually finish the bottle. The CERious PrOATection Moisturiser is the standout — a ceramide, panthenol and squalane barrier cream we called one of the best-value moisturisers we've tested locally, full stop.",
    whyTheyMadeTheList:
      "Twelve reviewed products, consistently strong efficacy-to-price ratios, and formulas built around SA humidity and Highveld dryness rather than a generic global routine. Read that again: a R195 moisturiser out-performing serums three times its price is worth knowing about.",
    officialWebsite: "https://standard-beauty.co.za",
  },
  {
    brand: "Skin Functional",
    slug: "skin-functional",
    positioningStatement: "Clinical-strength actives at pharmacy pricing, no packaging theatre.",
    knownFor: "A tight, well-concentrated actives range — niacinamide, vitamin C, retinoids, sunscreen.",
    skinlabsTake:
      "Ten reviewed products and barely a weak one among them. Skin Functional's multi-pathway brightening stack (arbutin, tranexamic acid, kojic acid and niacinamide together) is one of the best-value pigmentation serums sold in SA, and its ascorbic-and-ferulic vitamin C pairing is the evidence-leading daytime antioxidant combination in our whole review set. This is a brand that reads the research and prices accordingly, not a brand chasing a trend.",
    whyTheyMadeTheList:
      "Ten reviewed products spanning serums, cleanser and sunscreen, most scoring 8+ on efficacy. Directly compared against The Ordinary in our first Shelf Showdown and held its own on stability and formulation, not just price.",
    officialWebsite: "https://skinfunctional.com",
  },
  {
    brand: "Lelive",
    slug: "lelive",
    positioningStatement: "African botanicals paired with science-backed actives, imported pricing.",
    knownFor: "Tinted SPF, oil cleansers and shea-based moisturisers built around local botanicals.",
    skinlabsTake:
      "Lelive's formulas are genuinely pleasant to use — the tinted SPF30 gives real broad-spectrum protection with no white cast across SA skin tones, and the shea moisturiser performs beautifully on the dry Highveld and Cape. Where it consistently loses points is value: USD-linked import pricing means you're often paying a real premium over local alternatives with comparable actives.",
    whyTheyMadeTheList:
      "Eight reviewed products across sunscreen, cleansers, serums and moisturisers. Worth knowing before you buy: check a Skin Functional or Standard Beauty equivalent first if budget matters more than the botanical story.",
    officialWebsite: "https://leliveafrica.com",
  },
  {
    brand: "Portia M",
    slug: "portia-m",
    positioningStatement: "Accessible marula and pomegranate body oils for dry skin and scarring.",
    knownFor: "Marula Skin Tissue Oil — one of SA's most recognisable budget body-oil ranges.",
    skinlabsTake:
      "Here's the thing: Portia M's tissue oils work for what they are — affordable, effective body staples for dry skin and stretch marks. But we flagged an honesty note worth knowing: the base is mineral oil with marula added, not a pure marula oil as the name implies. Fragranced, so worth caution on acne-prone faces, but a genuinely useful, low-cost body staple.",
    whyTheyMadeTheList:
      "Five reviewed products, consistently strong value scores, and a transparent flag from us on the marula-vs-mineral-oil labelling point so you know exactly what you're buying.",
    officialWebsite: "https://portiamss.com",
    evidenceLimitation: "Efficacy scores for this brand's tissue oils sit in the 5.5–6.0 range — a solid budget pick, not a clinical treatment.",
  },
  {
    brand: "African Extracts",
    slug: "african-extracts",
    positioningStatement: "Rooibos-powered, Cape Town-founded, unapologetically affordable.",
    knownFor: "Rooibos antioxidant night creams and a gentle vitamin-enriched cleanser.",
    skinlabsTake:
      "African Extracts is the sleeper pick in our whole review set. The Classic Nourishing Night Cream is, in our words, hard to beat at this price point — jojoba oil and rooibos extract doing an honest, unglamorous job. The gentle cream cleanser with rooibos, vitamins C and E and aloe is a genuinely great budget staple for sensitive routines. Antioxidant rooibos is a credible active; don't expect the 'firming' claims to do much heavy lifting.",
    whyTheyMadeTheList:
      "Four reviewed products, the highest value scores of any moisturiser brand in our set, and a distinctly South African active (Cederberg rooibos) most imported brands can't touch.",
    officialWebsite: "https://africanextracts.com",
  },
  {
    brand: "Lamelle",
    slug: "lamelle",
    positioningStatement: "Evidence-driven clinical skincare from a South African research lab.",
    knownFor: "Patented Ceramide-P barrier repair and clinic-distributed brightening serums.",
    skinlabsTake:
      "Lamelle's Serra Restore Cream is, verdict in hand, an excellent, evidence-driven lamellar barrier cream — premium priced, but the formulation quality justifies it for genuinely compromised skin. Across the range the pattern repeats: real efficacy, clinic-grade pricing that sinks the value score against more affordable local alternatives with similar actives. This is a brand for a specific job (barrier repair, targeted pigmentation), not an everyday budget pick.",
    whyTheyMadeTheList:
      "Four reviewed products spanning moisturiser, cleanser, serum and sunscreen, with the strongest efficacy scores of any South African clinic brand in our set.",
    officialWebsite: "https://www.lamelle.co.za",
  },
  {
    brand: "Environ",
    slug: "environ",
    positioningStatement: "The Cape Town brand that pioneered high-dose vitamin A skincare.",
    knownFor: "The Vitamin STEP-UP SYSTEM — a gradual retinyl-palmitate escalation protocol.",
    skinlabsTake:
      "Environ was founded by Dr Des Fernandes on a simple premise: sun exposure depletes skin's vitamin A, so skincare should replace it, gradually. Our review of the step-up retinyl-palmitate system found strong evidence for photoageing and pigmentation — it's genuinely one of the more credible 'start low, go slow' retinoid protocols on SA shelves, though it's consultation-gated rather than something you self-prescribe from a shelf.",
    whyTheyMadeTheList:
      "Five reviewed products including a clinically trusted daily antioxidant SPF. A genuinely South African scientific export, not a marketing story bolted onto an imported formula.",
    brandStory: "Founded in 1990 by Dr Des Fernandes in Cape Town, built around correcting sun-induced vitamin A deficiency in skin.",
    officialWebsite: "https://www.environskincare.com/za",
  },
  {
    brand: "Esse",
    slug: "esse",
    positioningStatement: "Probiotic, microbiome-first skincare from a South African organic chemist.",
    knownFor: "Live probiotic serums built on four Lactobacillus strains at 1 billion CFU/ml.",
    skinlabsTake:
      "Esse, founded by organic chemist Trevor Steyn, takes a genuinely different approach — feeding and rebalancing your skin's microbiome rather than exfoliating or resurfacing it. Four Lactobacillus species at 1 billion CFU/ml is a genuinely innovative delivery format. Worth knowing: Esse cites a brand-supplied German Dermatest study showing +16% firmness in 28 days — a real data point, but not independently verified, and the clinical evidence base for microbiome skincare generally is still niche.",
    whyTheyMadeTheList:
      "Five reviewed products spanning serum, cleanser and moisturiser, certified organic and carbon neutral — a distinct scientific angle few other SA brands are working.",
    brandStory: "Founded in South Africa by organic chemist Trevor Steyn, built around microbiome science.",
    officialWebsite: "https://www.esseskincare.co.za",
  },
  {
    brand: "The Ordinary",
    slug: "the-ordinary",
    positioningStatement: "DECIEM's global budget-actives brand — clear concentrations, clear pricing.",
    knownFor: "Niacinamide 10% + Zinc, and a widely copied 'ingredient-first' naming convention.",
    skinlabsTake:
      "The Ordinary popularised disclosed-concentration budget actives worldwide, and its value scores in our set are consistently strong — the AHA/BHA peeling solution and niacinamide serum both punch well above their price. It's not a South African brand, so import pricing and stock reliability vary by retailer, and texture sometimes takes a back seat to formula purity. Still, it's the benchmark plenty of local budget-actives brands are explicitly built to compete with.",
    whyTheyMadeTheList:
      "Five reviewed products, the reference point in our first Shelf Showdown against Skin Functional, and a genuinely useful yardstick for judging whether a local brand's pricing is fair.",
    officialWebsite: "https://theordinary.com",
  },
  {
    brand: "Nimue",
    slug: "nimue",
    positioningStatement: "South African clinic-distributed skincare, sold through trained therapists.",
    knownFor: "Retinaldehyde serums and professional-strength brightening treatments.",
    skinlabsTake:
      "Nimue's Retinal Power+ serum is a genuinely premium option — retinaldehyde has strong evidence and acts faster than standard retinol, which matters if you want a clinician-guided regimen. The catch is consistent across the range: clinic-first pricing means Nimue posts the lowest value scores of any brand in our set, even where the formulation quality is real. This is a brand you choose for the guidance and the actives, not the price.",
    whyTheyMadeTheList:
      "Five reviewed products including a tinted SPF40 built for SA's high-UV conditions. A legitimate premium tier, priced accordingly — know that going in.",
    officialWebsite: "https://nimueskin.com",
    evidenceLimitation: "Value scores for this brand sit lowest in our set (5.5–6.5) — factor clinic-tier pricing into any comparison.",
  },
  {
    brand: "Optiphi",
    slug: "optiphi",
    positioningStatement: "Professional South African cosmeceutical skincare, clinic-distributed.",
    knownFor: "Peptide-retinol serums and a dependable daily SPF from a clinically trusted range.",
    skinlabsTake:
      "Optiphi sits a notch below Nimue on price without giving up much on formulation — its peptide-retinol serum is solid actives at a professional price, and its Solar Range SPF is a dependable daily choice across all SA regions. It's the more budget-conscious route into clinic-grade actives when you've compared it head-to-head against pricier alternatives, which is exactly what our first Shelf Showdown did.",
    whyTheyMadeTheList:
      "Five reviewed products spanning serum, eye cream, cleanser and sunscreen. A genuinely competitive clinic-tier option, not just a cheaper Nimue.",
    officialWebsite: "https://optiphi.com",
  },
  {
    brand: "Skin Creamery",
    slug: "skin-creamery",
    positioningStatement: "Cape Town 'Slow Beauty' — essential, multi-functional natural formulas.",
    knownFor: "A versatile everyday moisturiser and an oil-to-milk cleanser, both naturally derived.",
    skinlabsTake:
      "Founder Hannah Rubin built Skin Creamery around a simple idea: skincare doesn't need to be complicated to work. The Everyday Cream is a genuinely versatile, all-purpose moisturiser that performs across most SA climate zones — not flashy, just reliable. Its oil-to-milk cleanser has a lovely texture, though the price makes it a slightly harder recommendation than local alternatives doing a similar job for less.",
    whyTheyMadeTheList:
      "Five reviewed products across moisturiser, cleanser, body oil, serum and exfoliant. A distinctly Cape Town, naturally-derived brand with real cross-category range.",
    brandStory: "Founded by Hannah Rubin in Cape Town, built around 'Slow Beauty' — essential, multi-functional formulas rooted in nature.",
    officialWebsite: "https://www.skincreamery.com",
  },
  {
    brand: "Bio-Oil",
    slug: "bio-oil",
    positioningStatement: "SA's best-known scar and stretch-mark oil, sold worldwide.",
    knownFor: "The original multi-purpose skincare oil — a bathroom-cabinet staple for decades.",
    skinlabsTake:
      "Bio-Oil is the classic for a reason — a fragranced mineral-oil-based scar and stretch-mark oil that's affordable and genuinely effective for dry, non-acne skin. Worth knowing before you buy: the brand cites a proDERM Institute trial (66% improvement at 2 weeks, 92% at 8 weeks) that's brand-commissioned, not independently run — a real data point, but read it as marketing-adjacent evidence, not a clinical guarantee.",
    whyTheyMadeTheList:
      "Five reviewed products across original, natural (plant-oil) and dry-skin-gel formats. An SA household name with genuinely broad, affordable coverage for body skin.",
    officialWebsite: "https://www.bio-oil.com",
  },
  {
    brand: "Vitaderm",
    slug: "vitaderm",
    positioningStatement: "South African clinical skincare and nutricosmetics.",
    knownFor: "Phyto Active and Advanced Active ranges, plus a daily sun-defence SPF.",
    skinlabsTake:
      "Vitaderm sits in the same clinic-adjacent tier as SkinPhD — dependable, professionally positioned formulas that rarely surprise you, for better or worse. Its multivitamin and antioxidant creams perform well inland and on the coast, and the Sun Defence SPF is a solid, essential pick across all regions. Not the most exciting range in our set, but a consistently safe one.",
    whyTheyMadeTheList:
      "Five reviewed products spanning moisturiser, serum, cleanser and sunscreen — a genuinely broad, dependable clinical range with no major weak spots.",
    officialWebsite: "https://www.vitaderm.co.za",
  },
  {
    brand: "SkinPhD",
    slug: "skinphd",
    positioningStatement: "Cosmeceutical-grade skincare from a South African beauty franchise group.",
    knownFor: "A vitamin C serum and SPF day cream sold through SkinPhD's salon network.",
    skinlabsTake:
      "SkinPhD's formulas are dependable rather than remarkable — a cosmeceutical-grade vitamin C serum for AM brightening, a retinol night treatment for mature skin, an SPF day cream that does the basics well. Professional pricing throughout means value scores sit in the mid-range; we directly compared its vitamin C serum against Skin Functional's in our second Shelf Showdown, and the disclosed-concentration budget option came out ahead on transparency.",
    whyTheyMadeTheList:
      "Five reviewed products spanning serum, moisturiser, cleanser and sunscreen, distributed through a national salon network — genuinely accessible clinic-adjacent skincare.",
    officialWebsite: "https://skinphd.co.za",
  },
  {
    brand: "Bioderma",
    slug: "bioderma",
    positioningStatement: "French pharmacy dermatology, sold at every major SA pharmacy chain.",
    knownFor: "Sensibio H2O — the gold-standard gentle micellar cleanser for sensitive skin.",
    skinlabsTake:
      "Bioderma's Sensibio H2O is, in our words, the gold-standard gentle micellar cleanser for sensitive skin — genuinely excellent for the windy, drying Western Cape, and it's the reset-cleanser we point readers to first. Sébium H2O does the same job for oily and combination skin, and the Kerato+ anti-blemish cream is a dependable acne step-up. Widely stocked at Clicks, Dis-Chem and Dermastore — no import-only availability headache.",
    whyTheyMadeTheList:
      "Three reviewed products, all cleansers or acne treatments, with the strongest texture and climate-fit scores of any cleanser brand in our set.",
    officialWebsite: "https://www.bioderma.co.za",
  },
  {
    brand: "Skoon",
    slug: "skoon",
    positioningStatement: "Cape Town natural and organic skincare, founded by an engineer.",
    knownFor: "Layered hydrating serums built around hyaluronic acid and polyglutamic acid.",
    skinlabsTake:
      "Founder Stella Ciolli built Skoon around natural, home-remedy-inspired formulas made scientific. Its polyglutamic acid serum holds even more water than standard hyaluronic acid — a genuinely good layered hydrator, best sealed with an occlusive if you're inland. Its niacinamide-barrier serum uses a novel waterless, electrospun-nanofibre delivery format — genuinely innovative, though the premium format pricing is a hard sell against simpler alternatives doing a similar job.",
    whyTheyMadeTheList:
      "Two reviewed serums, both genuinely differentiated on formulation format rather than just ingredient list — worth watching as evidence builds.",
    brandStory: "Founded by engineer Stella Ciolli in Cape Town, blending natural ingredients with formulation science.",
    officialWebsite: "https://www.skoonskin.com",
    evidenceLimitation: "Currently 2 reviewed products — enough for our ranked tier, but a smaller sample than most brands on this list.",
  },
  {
    brand: "Fundamentals",
    slug: "fundamentals",
    positioningStatement: "No-frills, single-active South African skincare at pharmacy prices.",
    knownFor: "A 6% niacinamide serum and an arbutin-and-licorice brightening serum.",
    skinlabsTake:
      "Fundamentals does exactly what the name promises. Honest, no-frills and superb value — its 6% niacinamide serum proves you rarely need to pay more than R250 for a single-active serum that works. Its arbutin-and-licorice pairing gives dual tyrosinase inhibition for excellent-value pigment correction, one of the best brightening buys we've reviewed in SA, full stop. Two products, both genuinely excellent for the price.",
    whyTheyMadeTheList:
      "Two reviewed products with the highest combined value scores of any brand in our entire dataset — small range, exceptional execution.",
    officialWebsite: "https://fundamentals-skincare.co.za",
    evidenceLimitation: "Currently 2 reviewed products — a small but consistently excellent-value sample.",
  },
  {
    brand: "Silki",
    slug: "silki",
    positioningStatement: "One of South Africa's fastest-growing skincare brands.",
    knownFor: "Layered hydrating serums and a gentle squalane oil cleanser.",
    skinlabsTake:
      "Silki has built a genuinely large following fast, and the formulas we've reviewed back it up — a polyglutamic-and-HA serum that's a genuinely good layered hydrator, and a squalane oil cleanser gentle enough for daily use on dry or reactive skin. Nothing groundbreaking, but competently formulated, accessible skincare that's easy to build a routine around.",
    whyTheyMadeTheList:
      "Three reviewed products spanning serum and cleanser, all scoring well on texture and climate fit — dependable, growing, worth watching as its range expands.",
    officialWebsite: "https://feelsilki.com",
  },
  {
    brand: "Justine",
    slug: "justine",
    positioningStatement: "South Africa's original tissue-oil brand, sold direct since 1973.",
    knownFor: "Justine Tissue Oil — the multi-oil body staple that started it all.",
    skinlabsTake:
      "Justine's Tissue Oil is a fragranced multi-oil budget staple for dry skin and scars — an accessible direct-sales classic, though it runs heavy for humid KZN days. It's a genuine piece of South African skincare history: the original 1973 formula that arguably created the local tissue-oil category Bio-Oil and Portia M now compete in.",
    whyTheyMadeTheList:
      "New on the Radar: one reviewed product so far. We'll expand coverage as SkinLabs reviews more of Justine's wider range.",
    brandStory: "Justine's Tissue Oil launched in South Africa in 1973 and is credited with starting the local tissue-oil category. The brand is now part of the Avon group.",
    officialWebsite: "https://my.justine.co.za",
    evidenceLimitation: "Currently 1 reviewed product — not yet enough for our main Ranked tier, but a real, evidence-backed entry on the Radar.",
  },
  {
    brand: "Avon",
    slug: "avon",
    positioningStatement: "The global direct-sales giant's skincare line, sold door-to-door in SA.",
    knownFor: "The Anew range, including a vitamin C radiance serum.",
    skinlabsTake:
      "Avon's Anew Vitamin C Radiance Maximising Serum delivers roughly 10% vitamin C from a direct-sales staple — a real, disclosed concentration, though the alcohol-forward vehicle may not suit dry or sensitive skin and can feel drying in Cape wind. A dependable, widely accessible entry point into vitamin C brightening for anyone already buying through an Avon representative.",
    whyTheyMadeTheList:
      "New on the Radar: one reviewed product so far. We'll expand coverage as SkinLabs reviews more of Avon's wider skincare range.",
    officialWebsite: "https://my.avon.co.za",
    evidenceLimitation: "Currently 1 reviewed product — not yet enough for our main Ranked tier, but a real, evidence-backed entry on the Radar.",
  },
];

export type SpotlightTier = "ranked" | "new-on-the-radar";

export interface SpotlightBrandRanking {
  brand: string;
  slug: string;
  tier: SpotlightTier;
  /** 1-based rank within the "ranked" tier only; null for "new-on-the-radar". */
  rank: number | null;
  avgOverallScore: number;
  productCount: number;
  products: ProductReview[];
  featuredProduct: ProductReview;
  editorial: BrandEditorialOverlay;
  /** Every entry is "New" for this inaugural edition — there's no prior snapshot to compare against. */
  movement: "New";
}

const editorialBySlug = new Map(brandEditorial.map((entry) => [entry.brand, entry]));

/**
 * Groups productReviews by brand, averages overallScore() per brand (the only
 * "score" Spotlight uses — see /spotlight/methodology), and tiers brands into
 * "ranked" (2+ reviewed products) vs "new-on-the-radar" (1 product), per the
 * reference doc's own stated preference for multi-product evidence.
 */
export function computeSpotlightRanking(reviews: ProductReview[] = productReviews): SpotlightBrandRanking[] {
  const byBrand = new Map<string, ProductReview[]>();
  for (const review of reviews) {
    const list = byBrand.get(review.brand) ?? [];
    list.push(review);
    byBrand.set(review.brand, list);
  }

  const entries: SpotlightBrandRanking[] = [];
  for (const [brand, products] of byBrand) {
    const editorial = editorialBySlug.get(brand);
    if (!editorial) {
      if (import.meta.env.DEV) {
        throw new Error(`Spotlight: "${brand}" has reviewed products but no BrandEditorialOverlay entry.`);
      }
      continue;
    }
    const sortedProducts = [...products].sort((a, b) => overallScore(b) - overallScore(a));
    const avgOverallScore = Number(
      (products.reduce((sum, review) => sum + overallScore(review), 0) / products.length).toFixed(2),
    );
    entries.push({
      brand,
      slug: editorial.slug,
      tier: products.length >= 2 ? "ranked" : "new-on-the-radar",
      rank: null,
      avgOverallScore,
      productCount: products.length,
      products: sortedProducts,
      featuredProduct: sortedProducts[0],
      editorial,
      movement: "New",
    });
  }

  if (import.meta.env.DEV) {
    for (const editorial of brandEditorial) {
      if (!entries.some((entry) => entry.brand === editorial.brand)) {
        throw new Error(`Spotlight: BrandEditorialOverlay "${editorial.brand}" has no matching productReviews entries.`);
      }
    }
  }

  const ranked = entries
    .filter((entry) => entry.tier === "ranked")
    .sort((a, b) => b.avgOverallScore - a.avgOverallScore || b.productCount - a.productCount);
  ranked.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const radar = entries
    .filter((entry) => entry.tier === "new-on-the-radar")
    .sort((a, b) => b.avgOverallScore - a.avgOverallScore);

  return [...ranked, ...radar];
}

export const spotlightRanking = computeSpotlightRanking();
export const spotlightRankedBrands = spotlightRanking.filter((entry) => entry.tier === "ranked");
export const spotlightRisingBrands = spotlightRanking.filter((entry) => entry.tier === "new-on-the-radar");
export const spotlightTopThree = spotlightRankedBrands.slice(0, 3);

export const getSpotlightBrand = (slug: string) => spotlightRanking.find((entry) => entry.slug === slug);

export const SPOTLIGHT_METHODOLOGY_VERSION = "Spotlight Methodology v1.0";
export const SPOTLIGHT_EDITION_MONTH = "August 2026";

/** Seeded starting like counts — a lightweight social-proof affordance only.
 * Never used as a ranking input; the ranking above is 100% review-score-derived. */
export const seededBrandLikes: Record<string, number> = {
  "standard-beauty": 214,
  "skin-functional": 198,
  lelive: 87,
  "portia-m": 62,
  "african-extracts": 121,
  lamelle: 143,
  environ: 176,
  esse: 96,
  "the-ordinary": 251,
  nimue: 118,
  optiphi: 74,
  "skin-creamery": 109,
  "bio-oil": 233,
  vitaderm: 58,
  skinphd: 82,
  bioderma: 187,
  skoon: 47,
  fundamentals: 165,
  silki: 93,
  justine: 41,
  avon: 39,
};
