/**
 * Spotlight by SkinLabs: a review-led ranking of South African skincare brands,
 * refreshed monthly as a full edition, with a Top 3 module that rotates weekly.
 * Not a popularity list, not a paid directory — every score is computed live from
 * SkinLabs' own published product review data (never hand-typed), and every
 * editorial note below is grounded in real, already-published verdict text from
 * src/data/reviews.ts. See /spotlight/methodology for what Methodology v1.1
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
  /** Real brand logo when available — BrandLogo falls back to initials. */
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
    logoUrl: "https://cdn.brandfetch.io/standard-beauty.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/skinfunctional.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/leliveafrica.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/portiamss.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/africanextracts.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/lamelle.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/environskincare.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/esseskincare.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/theordinary.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/nimueskin.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/optiphi.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/skincreamery.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/bio-oil.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/vitaderm.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/skinphd.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/bioderma.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/skoonskin.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/fundamentals-skincare.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
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
    logoUrl: "https://cdn.brandfetch.io/feelsilki.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
  },
  {
    brand: "Justine",
    slug: "justine",
    positioningStatement: "South Africa's original tissue-oil brand, sold direct since 1973.",
    knownFor: "Justine Tissue Oil and a vitamin E moisturising body lotion, sold direct.",
    skinlabsTake:
      "Justine's Tissue Oil is a fragranced multi-oil budget staple for dry skin and scars — an accessible direct-sales classic, though it runs heavy for humid KZN days. It's a genuine piece of South African skincare history: the original 1973 formula that arguably created the local tissue-oil category Bio-Oil and Portia M now compete in. The vitamin E body lotion is the lighter, easier-to-layer option for warmer days.",
    whyTheyMadeTheList:
      "Two reviewed products spanning a rich tissue oil and a lighter everyday lotion — an SA skincare original with genuine category history behind it.",
    brandStory: "Justine's Tissue Oil launched in South Africa in 1973 and is credited with starting the local tissue-oil category. The brand is now part of the Avon group.",
    officialWebsite: "https://my.justine.co.za",
    logoUrl: "https://cdn.brandfetch.io/justine.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Avon",
    slug: "avon",
    positioningStatement: "The global direct-sales giant's skincare line, sold door-to-door in SA.",
    knownFor: "The Anew range: a vitamin C radiance serum and a Hydra Fusion moisture cream.",
    skinlabsTake:
      "Avon's Anew Vitamin C Radiance Maximising Serum delivers roughly 10% vitamin C from a direct-sales staple — a real, disclosed concentration, though the alcohol-forward vehicle may not suit dry or sensitive skin and can feel drying in Cape wind. The Hydra Fusion cream is the steadier half of the pairing: a dependable hyaluronic-acid moisturiser with none of the serum's dryness risk. A widely accessible entry point into an actives routine for anyone already buying through an Avon representative.",
    whyTheyMadeTheList:
      "Two reviewed products pairing a disclosed-concentration vitamin C serum with a dependable daily moisturiser — a genuinely accessible actives starter kit for direct-sales shoppers.",
    officialWebsite: "https://my.avon.co.za",
    logoUrl: "https://cdn.brandfetch.io/avon.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Africology",
    slug: "africology",
    positioningStatement: "South Africa's leading natural spa and beauty brand, rooted in indigenous healing plants.",
    knownFor: "Rooibos, aloe ferox and marula-led body and skincare built around traditional African plant wisdom.",
    skinlabsTake:
      "Africology's spa heritage shows in the sensory side of its formulas — rich textures, genuinely pleasant application, and a coherent story built around rooibos, aloe ferox and marula rather than a scattershot ingredient list. Its aloe ferox serum leans on a genuinely well-evidenced local plant for soothing and hydration; don't expect the 'traditional healing' framing to substitute for disclosed active concentrations elsewhere in the range.",
    whyTheyMadeTheList:
      "Two reviewed products anchored in indigenous South African botanicals, with the strongest sensory-and-provenance story of any spa-positioned brand in our set.",
    officialWebsite: "https://africologyspa.com",
    logoUrl: "https://cdn.brandfetch.io/africologyspa.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Rain Africa",
    slug: "rain-africa",
    positioningStatement: "Handmade natural body and skincare from a small Free State town, now sold internationally.",
    knownFor: "African bio-actives worked into handmade botanical oils, butters and facial serums.",
    skinlabsTake:
      "Rain's Ladybrand roots are unusual for a brand that now ships internationally, and the handmade positioning is genuine rather than marketing gloss — batches read as small-scale, ingredient-forward formulas rather than mass-produced actives serums. Buchu and African potato aren't as clinically documented as niacinamide or retinoids, so treat this as a comfort-and-ritual pick more than a high-efficacy actives routine.",
    whyTheyMadeTheList:
      "Two reviewed products spanning body oil and facial serum, with a genuinely distinctive small-town-to-international origin story among SA natural brands.",
    officialWebsite: "https://rainafrica.co.za",
    logoUrl: "https://cdn.brandfetch.io/rainafrica.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Skin Renewal",
    slug: "skin-renewal",
    positioningStatement: "SA medical aesthetic clinic network with its own cosmeceutical retail range.",
    knownFor: "Clinic-formulated retinol and peptide products sold alongside in-house aesthetic treatments.",
    skinlabsTake:
      "Skin Renewal's retail range benefits from the same clinical positioning as its treatment rooms — genuinely well-formulated actives at professional-tier pricing. The peptide recovery cream is a solid, if unremarkable, barrier-support formula; the retinol serum sits at a sensible mid-strength for skin already on a retinoid. As with most clinic-distributed ranges in our set, the value score trails the efficacy score.",
    whyTheyMadeTheList:
      "Two reviewed products from a genuinely clinical, multi-city SA aesthetics network — a credible professional-tier alternative to Lamelle and Nimue.",
    officialWebsite: "https://www.skinrenewal.co.za",
    logoUrl: "https://cdn.brandfetch.io/skinrenewal.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Sorbet Skin",
    slug: "sorbet-skin",
    positioningStatement: "The in-house skincare line from SA's largest professional beauty and grooming franchise.",
    knownFor: "Salon-distributed vitamin C and daily-hydration formulas sold alongside Sorbet's treatment menu.",
    skinlabsTake:
      "Sorbet Skin is a dependable, mid-market range that benefits from the brand's national salon footprint more than from any standout formulation innovation — the vitamin C serum does a competent brightening job, and the day cream is an easy daily layer. Nothing here beats the more specialised actives brands in this file on efficacy, but availability at any Sorbet salon is a genuine convenience.",
    whyTheyMadeTheList:
      "Two reviewed products from South Africa's largest beauty and grooming franchise, with unmatched in-person salon availability nationwide.",
    officialWebsite: "https://www.sorbet.co.za",
    logoUrl: "https://cdn.brandfetch.io/sorbet.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Placecol",
    slug: "placecol",
    positioningStatement: "SA skin care clinic franchise with its own Dermaceutical and Illuminé retail ranges.",
    knownFor: "Clinic-distributed retinol renewal and brightening formulas sold through its national salon network.",
    skinlabsTake:
      "Placecol's Dermaceutical range reads as a credible clinic-tier actives line — the retinol serum is well-positioned for skin already tolerant of retinoids, and the Illuminé brightening moisturiser layers easily under SPF. As with other franchise-distributed ranges, you're paying partly for the in-clinic guidance that comes with it, not just the formula on the shelf.",
    whyTheyMadeTheList:
      "Two reviewed products from one of SA's longest-running skin clinic franchises, founded in the 1980s by Elma McKenzie.",
    officialWebsite: "https://placecol.com",
    logoUrl: "https://cdn.brandfetch.io/placecol.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Annique",
    slug: "annique",
    positioningStatement: "SA's original rooibos-based skincare brand, sold through a direct-consultant network.",
    knownFor: "Rooibos-antioxidant serums and creams, long associated with founder Annique Theron's tea research.",
    officialWebsite: "https://www.annique.com",
    logoUrl: "https://cdn.brandfetch.io/annique.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Annique built its identity on rooibos long before it became a mainstream SA skincare ingredient, and the formulas we've reviewed lean on that antioxidant story consistently. The anti-ageing serum and hydrating day cream are pleasant, dependable rooibos-forward formulas — don't expect dramatic retinoid-grade results, but they're an honest, on-brand execution of the rooibos positioning.",
    whyTheyMadeTheList:
      "Two reviewed products from the brand most responsible for putting Cederberg rooibos on the SA skincare map, alongside African Extracts.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Swiitch Beauty",
    slug: "swiitch-beauty",
    positioningStatement: "Affordable, customer-driven SA beauty and skincare, founded by Rabia Ghoor.",
    knownFor: "A bakuchiol retinol-alternative serum and a rosewater toner developed from direct customer feedback.",
    skinlabsTake:
      "Swiitch's product development process — genuinely shaped by customer requests rather than a top-down brand calendar — shows in a range that solves specific, unglamorous problems well. The bakuchiol serum is a sensible retinol alternative for pregnancy-safe or retinoid-sensitive routines, even if bakuchiol's evidence base is thinner than retinol's. The rosewater toner is a simple, inoffensive hydrating step.",
    whyTheyMadeTheList:
      "Two reviewed products from one of SA's fastest-growing affordable beauty brands, with a genuinely community-led product development story.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "CF Suncare",
    slug: "cf-suncare",
    positioningStatement: "A South African sunscreen specialist, built around SA's intense year-round UV load.",
    knownFor: "Everyday broad-spectrum SPF50 and a tinted mineral SPF for daily wear.",
    skinlabsTake:
      "A specialist sunscreen brand is a sensible bet in a market where broad-spectrum SPF is consistently the single highest-value step in any routine, and CF Suncare's formulas back that up with genuinely wearable, non-greasy textures across both the standard and tinted SPF. Reapplication compliance still matters more than brand choice — no sunscreen works if it stays in the bag.",
    whyTheyMadeTheList:
      "Two reviewed products, both sunscreens, from a brand that's chosen to specialise rather than chase a full skincare range — and does the one thing well.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "COR Skincare",
    slug: "cor-skincare",
    positioningStatement: "A South African actives-led skincare brand built around simple, functional formulas.",
    knownFor: "A niacinamide clarifying serum and a ceramide barrier moisturiser.",
    skinlabsTake:
      "COR keeps its range tight and its claims modest, which we'd rather see than an overreaching ingredient list. The niacinamide serum handles oil control and tone competently, and the ceramide moisturiser is a solid, unfussy barrier-support cream for daily use across most SA climate zones.",
    whyTheyMadeTheList:
      "Two reviewed products pairing a clean niacinamide serum with a genuine ceramide moisturiser — a tight, no-frills range that does the barrier-plus-tone basics well.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Luamu",
    slug: "luamu",
    positioningStatement: "A South African hydration-focused skincare brand.",
    knownFor: "A hyaluronic acid hydra serum and a gentle daily gel cleanser.",
    skinlabsTake:
      "Luamu's range leans hard into hydration rather than aggressive actives, which makes it a comfortable pick for reactive or dehydrated skin that can't yet tolerate acids or retinoids. The HA serum plumps well when sealed with a moisturiser; the gel cleanser doesn't strip the barrier it's meant to be protecting.",
    whyTheyMadeTheList:
      "Two reviewed products, a serum and a cleanser, both built around the same hydration-first, actives-free approach — a comfortable, coherent starting routine for reactive or dehydrated skin.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Mbiri Natural Skincare",
    slug: "mbiri-natural-skincare",
    positioningStatement: "Natural South African skincare built around marula, baobab and African black soap.",
    knownFor: "A marula-and-baobab face oil and a traditional African black soap cleanser.",
    officialWebsite: "https://mbiri-skincare.com",
    logoUrl: "https://cdn.brandfetch.io/mbiri-skincare.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Mbiri's face oil is a genuinely nice-textured blend of two well-regarded African oils, absorbing better than the heavier single-oil products elsewhere in this file. The black soap cleanser is a traditional formulation rather than a modern surfactant blend — effective for oily or congested skin, but patch-test first if you're sensitive, since batch consistency can vary more than with lab-formulated cleansers.",
    whyTheyMadeTheList:
      "Two reviewed products — a marula-and-baobab face oil and a traditional African black soap cleanser — built on traditional African ingredients rather than imported actives.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Hey Gorgeous",
    slug: "hey-gorgeous",
    positioningStatement: "Affordable, sustainably sourced botanical skincare and makeup.",
    knownFor: "A vitamin C brightening serum and a botanical clay cleanser.",
    officialWebsite: "https://hey-gorgeous.co.za",
    logoUrl: "https://cdn.brandfetch.io/hey-gorgeous.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Hey Gorgeous sits in the same affordable-botanical lane as several other brands in this file, and it earns its place with a vitamin C serum that performs respectably at a lower price point than the clinic-tier options here. The clay cleanser draws out congestion well for oily and combination skin without the tightness some clay formulas leave behind.",
    whyTheyMadeTheList:
      "Two reviewed products with a genuinely accessible price point for a vitamin C and clay-cleanser pairing.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Future Me",
    slug: "future-me",
    positioningStatement: "A modern South African skincare brand blending science-led actives with self-care.",
    knownFor: "A peptide youth serum and a barrier repair moisturiser.",
    skinlabsTake:
      "Future Me positions itself on a more contemporary, wellness-adjacent brand voice than the clinical brands in this file, but the formulas underneath are genuinely actives-led — a peptide serum with a sensible, if unremarkable, ingredient concentration, and a ceramide-forward barrier cream that layers well. A reasonable pick for someone who wants actives without a clinic-brand aesthetic.",
    whyTheyMadeTheList:
      "Two reviewed products pairing a peptide serum with genuine barrier-support formulation — a modern take on a classic actives-plus-barrier routine.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Eco Diva",
    slug: "eco-diva",
    positioningStatement: "Clean, paraben- and sulfate-free South African skincare.",
    knownFor: "A molecular hyaluronic acid serum and a gentle foaming cleanser.",
    logoUrl: "https://cdn.brandfetch.io/ecodivabeauty.ca/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Eco Diva's clean-beauty positioning doesn't come at the expense of function — the HA serum uses a genuinely reasonable multi-weight approach to hydration, and the foaming cleanser is gentle enough for daily use without the drying effect some sulfate-free foaming cleansers struggle to avoid.",
    whyTheyMadeTheList:
      "Two reviewed products from a brand built explicitly around paraben- and sulfate-free formulation, without sacrificing basic efficacy.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "CHILL Cape Town",
    slug: "chill-cape-town",
    positioningStatement: "A Cape Town skincare brand built around calm, unfussy daily routines.",
    knownFor: "A centella-based calming serum and an everyday moisturiser.",
    skinlabsTake:
      "CHILL's centella serum is a competent, soothing option for reactive or wind-irritated skin — genuinely useful for the Cape's exposure to salt air and gusty conditions. The everyday moisturiser is deliberately simple rather than actives-forward, positioned as a low-maintenance daily layer rather than a treatment step.",
    whyTheyMadeTheList:
      "Two reviewed products — a calm, centella-led serum and a low-maintenance daily moisturiser — well suited to the Cape's windier micro-climate.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Noa & Co",
    slug: "noa-and-co",
    positioningStatement: "Johannesburg-based wellness skincare built around probiotics and organic ingredients.",
    knownFor: "A probiotic balance serum and an organic hydrating cream, both family-safe formulations.",
    skinlabsTake:
      "Noa & Co's probiotic serum sits in similar territory to Esse's microbiome-first approach, though at a more accessible price point and with a more general wellness framing than Esse's clinical-organic positioning. The organic hydrating cream is a gentle, family-safe daily option rather than a targeted treatment.",
    whyTheyMadeTheList:
      "Two reviewed products offering an accessible take on probiotic, microbiome-friendly skincare alongside Esse's more premium range.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Hassteon Organix",
    slug: "hassteon-organix",
    positioningStatement: "Soweto-founded organic skincare bringing African heritage ingredients to a modern range.",
    knownFor: "A shea-and-marula body butter and a turmeric brightening treatment.",
    skinlabsTake:
      "Hassteon Organix's Soweto roots and heritage-ingredient story are a genuinely fresh addition to a Spotlight list still dominated by Cape Town-founded natural brands. The shea-marula butter is a rich, effective body moisturiser for dry skin; turmeric's brightening evidence is more folk-remedy than clinical, so treat the brightening claim as a nice-to-have rather than the main reason to buy.",
    whyTheyMadeTheList:
      "Two reviewed products from a genuinely local Soweto success story, broadening where SkinLabs' local-brand coverage comes from.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "SOiL Organic Aromatherapy",
    slug: "soil-organic-aromatherapy",
    positioningStatement: "An 18-year-old South African organic aromatherapy brand from Veld Botanicals.",
    knownFor: "A rosehip renewal facial oil and a lavender calming cleanser.",
    skinlabsTake:
      "SOiL's aromatherapy roots mean its formulas lean on essential oils for sensory effect as much as skin benefit — worth flagging for fragrance-sensitive skin, since essential-oil-forward formulas are more likely to irritate than fragrance-free actives. That said, the rosehip oil is a genuinely well-regarded natural active for scarring and dryness, and the lavender cleanser is a pleasant evening ritual step.",
    whyTheyMadeTheList:
      "Two reviewed products from one of SA's longest-running certified organic aromatherapy houses, family-owned since its founding.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Terres d'Afrique",
    slug: "terres-dafrique",
    positioningStatement: "Ethical, fair-trade skin and body care built around rare African botanicals.",
    knownFor: "A marula-and-rooibos nourishing oil and a Kalahari melon seed moisturiser.",
    officialWebsite: "https://www.terres-dafrique.com",
    logoUrl: "https://cdn.brandfetch.io/terres-dafrique.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Terres d'Afrique's fair-trade sourcing story is a genuine point of difference in a category where 'ethical' is often just packaging copy — the brand is explicit about where its rarer botanicals, like Kalahari melon seed, are harvested. The nourishing oil and moisturiser both perform solidly for dry-to-normal skin, if without the disclosed-percentage actives that dominate the top of this file.",
    whyTheyMadeTheList:
      "Two reviewed products showcasing rarer African botanicals most other brands in this set don't use, with a genuine fair-trade sourcing story.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Oh Lief",
    slug: "oh-lief",
    positioningStatement: "Natural, organic, family-safe skincare built around olive oil and beeswax.",
    knownFor: "An olive-and-beeswax repair balm and a gentle cleanser safe for the whole family.",
    logoUrl: "https://cdn.brandfetch.io/oh-lief.nl/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Oh Lief's family-safe positioning is genuinely conservative on ingredients — olive oil and beeswax are about as low-risk a base as skincare gets, which makes this a sensible pick for babies, pregnancy-safe routines or very reactive skin. Don't expect actives-grade results; this is a comfort-and-protection range, not a treatment one.",
    whyTheyMadeTheList:
      "Two reviewed products built on locally sourced, 100% natural raw ingredients — a genuinely low-risk option for sensitive and family skincare.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Black African Organics",
    slug: "black-african-organics",
    positioningStatement: "Skincare and haircare formulated specifically for melanin-rich skin.",
    knownFor: "A brightening serum and a shea deep-moisture cream, both blending traditional botanicals with modern actives.",
    officialWebsite: "https://www.blackafrican.co.za",
    logoUrl: "https://cdn.brandfetch.io/blackafrican.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Black African Organics fills a real gap — much of SA's skincare marketing defaults to a generic 'brightening' message without accounting for how post-inflammatory hyperpigmentation specifically presents on deeper skin tones. The brightening serum's tyrosinase-inhibiting approach is sound; the shea cream is a rich, effective daily moisturiser for drier melanin-rich skin.",
    whyTheyMadeTheList:
      "Two reviewed products built explicitly for melanin-rich skin, founded in 2016 with a clear, underserved target audience.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "AMAZI",
    slug: "amazi",
    positioningStatement: "Accessible, 100% natural oil-based skincare built around moringa and rooibos.",
    knownFor: "A moringa-and-rooibos face oil and a natural body oil.",
    skinlabsTake:
      "AMAZI's face oil pairs two genuinely credible local actives — moringa's antioxidant profile and rooibos' — in a straightforward, single-category product rather than an overcomplicated multi-active serum. The body oil is a solid, affordable everyday moisturising option, closer in spirit to Bio-Oil and Portia M than to the premium oil brands in this file.",
    whyTheyMadeTheList:
      "Two reviewed products with an honest, single-ingredient-family approach — moringa and rooibos, nothing more, at an accessible price.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Gloei",
    slug: "gloei",
    positioningStatement: "Award-winning natural, vegan skincare made in Cape Town.",
    knownFor: "A vegan vitamin C serum and a minimalist daily moisturiser.",
    officialWebsite: "https://gloei.beauty",
    logoUrl: "https://cdn.brandfetch.io/gloei.beauty/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Gloei's minimalist packaging philosophy carries through to its formulas — a vegan-certified vitamin C serum using a stable, if gentler, derivative rather than L-ascorbic acid, and a daily moisturiser that does one job cleanly rather than chasing a long ingredient list. A sensible pick for anyone prioritising vegan certification alongside basic actives.",
    whyTheyMadeTheList:
      "Two reviewed products — a vegan-certified vitamin C serum and a minimalist daily moisturiser — from an award-recognised Cape Town natural brand.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Yearn Skin",
    slug: "yearn-skin",
    positioningStatement: "Dermatologically tested SA skincare focused on hyperpigmentation and uneven tone.",
    knownFor: "A hyperpigmentation-correcting serum and an even-tone daily moisturiser.",
    officialWebsite: "https://yearnskin.co.za",
    logoUrl: "https://cdn.brandfetch.io/yearnskin.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Yearn Skin's tight focus on tone and pigmentation is a sensible specialisation given how common post-inflammatory hyperpigmentation is across SA's skin tones — the correcting serum uses a reasonable tyrosinase-inhibiting approach, and the daily moisturiser is a fine maintenance layer once the serum has done the heavier lifting. Pair with daily SPF, as with any pigmentation routine.",
    whyTheyMadeTheList:
      "Two reviewed products — a dermatologically tested hyperpigmentation serum and an even-tone daily moisturiser — with a specific, non-scattershot focus on tone.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Lumiglo",
    slug: "lumiglo",
    positioningStatement: "Sensitive-skin skincare created by a South African makeup artist.",
    knownFor: "A sensitive-skin barrier serum and a calming gel cleanser.",
    officialWebsite: "https://lumiglo.uk",
    logoUrl: "https://cdn.brandfetch.io/lumiglo.uk/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Lumiglo's makeup-artist origin shows in a range built around skin that has to look good under product all day — the barrier serum is gentle enough to sit comfortably under makeup, and the calming gel cleanser removes the day's build-up without the stripped, tight feeling some gel cleansers leave behind on reactive skin.",
    whyTheyMadeTheList:
      "Two reviewed products — a sensitive-skin barrier serum and a calming gel cleanser — built from a makeup artist's practical, day-to-day skin experience.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Lulu & Marula",
    slug: "lulu-and-marula",
    positioningStatement: "Natural, ethically produced Cape Town skincare built on plant extracts.",
    knownFor: "A marula oil elixir and a botanical hydrating cream, both free from mineral oil and palm oil.",
    skinlabsTake:
      "Lulu & Marula's sulphate-, paraben- and mineral-oil-free formulation stance is a genuine point of difference from the tissue-oil brands elsewhere in this file that lean on mineral oil bases — the marula elixir is a clean, well-absorbed single-oil product, and the hydrating cream layers easily without a greasy finish.",
    whyTheyMadeTheList:
      "Two reviewed products with a clearly stated mineral-oil-free, palm-oil-free formulation policy — a genuine differentiator in the local natural-oils category.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Afari",
    slug: "afari",
    positioningStatement: "Skincare built around Bulbine frutescens, supporting the women who harvest it.",
    knownFor: "A Bulbine frutescens healing gel and an anti-inflammatory body oil.",
    officialWebsite: "https://afariskincare.com",
    logoUrl: "https://cdn.brandfetch.io/afariskincare.com/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Afari's focus on Bulbine frutescens — a well-known indigenous SA succulent used traditionally for minor burns, cuts and irritation — is a genuinely distinctive single-ingredient story, and the healing gel performs credibly for minor skin irritation and soothing. The body oil extends the same calming positioning into a daily moisturising step. The women-harvester sourcing model is a real, verifiable point of difference, not just marketing language.",
    whyTheyMadeTheList:
      "Two reviewed products — a healing gel and a body oil, both built around a single, well-regarded indigenous succulent — with a genuine community-sourcing model behind them.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Pure Beginnings",
    slug: "pure-beginnings",
    positioningStatement: "All-natural, organic skincare for the whole family, including babies.",
    knownFor: "A gentle family moisturiser and a gentle baby-safe cleanser.",
    officialWebsite: "https://www.purebeginnings.co.za",
    logoUrl: "https://cdn.brandfetch.io/purebeginnings.co.za/w/128/theme/light/fallback/404?c=1idRUZaGIxsHRZL8WVX",
    skinlabsTake:
      "Pure Beginnings sits alongside Oh Lief in the family-safe natural category, with a slightly broader traditional-herb ingredient story layered on top of its South African plant base. Both the moisturiser and cleanser are formulated conservatively enough for baby skin, which by extension makes them a gentle, low-irritation option for adult sensitive-skin routines too.",
    whyTheyMadeTheList:
      "Two reviewed products combining traditional herbal botanicals with South African plant ingredients in a genuinely family-first, baby-safe range.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
  {
    brand: "Dermopal",
    slug: "dermopal",
    positioningStatement: "South African sunscreen and scar care formulated for darker skin tones.",
    knownFor: "A tinted sunscreen for deeper skin tones and a scar-and-stretch-mark oil.",
    skinlabsTake:
      "Dermopal fills a real, well-documented gap — sunscreen formulated and shade-matched for darker skin tones remains under-served on SA shelves, and a no-white-cast tinted SPF matters as much for daily wearability as for protection. The scar and stretch-mark oil is a competent, if familiar, oil blend in a category Bio-Oil and Portia M already crowd — Dermopal's differentiator is the SPF, not the body oil.",
    whyTheyMadeTheList:
      "Two reviewed products addressing a genuine gap in shade-inclusive sun protection for South Africa's predominantly deeper-skinned population.",
    evidenceLimitation: "Currently 2 reviewed products — enough for our Ranked tier, but a smaller sample than our longer-reviewed brands.",
  },
];

export type SpotlightTier = "ranked" | "new-on-the-radar";

export interface SpotlightBrandRanking {
  brand: string;
  slug: string;
  tier: SpotlightTier;
  rank: number | null;
  avgOverallScore: number;
  productCount: number;
  products: ProductReview[];
  featuredProduct: ProductReview;
  editorial: BrandEditorialOverlay;
  movement: "New";
}

const editorialBySlug = new Map(brandEditorial.map((entry) => [entry.brand, entry]));

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

export const getSpotlightBrand = (slug: string) => spotlightRanking.find((entry) => entry.slug === slug);

/**
 * These two strings are the ONLY hand-curated identifiers in this file — bump them
 * when the brand roster changes meaningfully (a new brand added, a tier promoted,
 * an edition reassessed). Nothing else should ever hardcode a brand/ranked/radar
 * count in prose: every count shown to a reader (Spotlight.tsx's disclaimer, the
 * Methodology page, SpotlightArchive) is computed live from spotlightRanking /
 * spotlightRankedBrands / spotlightRisingBrands so it can never drift out of sync
 * with the actual data below.
 */
export const SPOTLIGHT_METHODOLOGY_VERSION = "Spotlight Methodology v1.1";
export const SPOTLIGHT_EDITION_MONTH = "September 2026";

/**
 * Weekly Top 3 rotation (Methodology v1.1). SAST has no DST, so it is always UTC+2.
 * The rotation flips every Friday at 00:00 SAST — never mid-week, never on demand.
 */
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The most recent Friday 00:00 SAST at or before `date` — the rotation's week boundary. */
export function spotlightRotationWeekStart(date: Date = new Date()): Date {
  const sast = new Date(date.getTime() + SAST_OFFSET_MS);
  const sastDay = sast.getUTCDay(); // 0 Sun … 5 Fri … 6 Sat, read as SAST wall-clock day
  const daysSinceFriday = (sastDay - 5 + 7) % 7;
  const fridaySastMidnightUtcMs = Date.UTC(sast.getUTCFullYear(), sast.getUTCMonth(), sast.getUTCDate() - daysSinceFriday);
  return new Date(fridaySastMidnightUtcMs - SAST_OFFSET_MS);
}

/** Increments by exactly 1 every Friday 00:00 SAST — the index the rotation is keyed on. */
export function spotlightRotationWeekIndex(date: Date = new Date()): number {
  return Math.floor(spotlightRotationWeekStart(date).getTime() / WEEK_MS);
}

/**
 * "Top 3 brands this week": drawn only from the highest-scoring Ranked brands (never an
 * arbitrary or paid pick), grouped into rotation cohorts of 3 and cycled weekly so the
 * spotlight moves across real, evidence-backed top performers rather than freezing on the
 * same three every edition. See Spotlight Methodology v1.1, "Weekly Top 3 rotation".
 */
export function computeSpotlightTopThisWeek(
  ranked: SpotlightBrandRanking[] = spotlightRankedBrands,
  date: Date = new Date(),
): SpotlightBrandRanking[] {
  if (ranked.length <= 3) return ranked.slice(0, 3);
  const groupCount = Math.max(1, Math.floor(Math.min(9, ranked.length) / 3));
  const pool = ranked.slice(0, groupCount * 3);
  const groups: SpotlightBrandRanking[][] = [];
  for (let i = 0; i < groupCount; i++) groups.push(pool.slice(i * 3, i * 3 + 3));
  const activeGroup = groups[spotlightRotationWeekIndex(date) % groups.length];
  return activeGroup && activeGroup.length === 3 ? activeGroup : ranked.slice(0, 3);
}

export const spotlightTopThisWeek = computeSpotlightTopThisWeek();

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
  africology: 88,
  "rain-africa": 102,
  "skin-renewal": 76,
  "sorbet-skin": 134,
  placecol: 69,
  annique: 145,
  "swiitch-beauty": 158,
  "cf-suncare": 54,
  "cor-skincare": 37,
  luamu: 33,
  "mbiri-natural-skincare": 45,
  "hey-gorgeous": 112,
  "future-me": 61,
  "eco-diva": 58,
  "chill-cape-town": 49,
  "noa-and-co": 66,
  "hassteon-organix": 42,
  "soil-organic-aromatherapy": 71,
  "terres-dafrique": 53,
  "oh-lief": 97,
  "black-african-organics": 84,
  amazi: 67,
  gloei: 91,
  "yearn-skin": 63,
  lumiglo: 39,
  "lulu-and-marula": 57,
  afari: 44,
  "pure-beginnings": 103,
  dermopal: 72,
};
