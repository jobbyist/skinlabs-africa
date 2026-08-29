/**
 * Homepage "Editorials" + Shelf Showdown coming-soon catalogue.
 * Published comparisons live in comparisons.ts; comingSoon entries route to
 * /reviews/versus/:slug and render the coming-soon shell in ComparisonArticle.
 */

export interface FeaturedEditorial {
  slug: string;
  href: string;
  title: string;
  dek: string;
  saContext: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  comingSoon?: boolean;
}

const thumb = {
  vitaminC: "https://images.unsplash.com/photo-1640625696922-1fd63c0b97c9?auto=format&fit=crop&w=800&q=80",
  serum: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=800&q=80",
  cream: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
  oil: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80",
  cleanser: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  spf: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80",
  niacinamide: "https://images.unsplash.com/photo-1620916569875-d9b2c5c1c0c0?auto=format&fit=crop&w=800&q=80",
  moisturiser: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?auto=format&fit=crop&w=800&q=80",
};

export const featuredEditorials: FeaturedEditorial[] = [
  {
    slug: "skin-functional-vs-skinphd-vitamin-c",
    href: "/reviews/versus/skin-functional-vs-skinphd-vitamin-c",
    title: "Skin Functional vs SkinPhD: Budget vs Clinic-Tier Vitamin C, Compared",
    dek: "A R270 pharmacy serum against a R660 clinic-brand one — we check whether the price gap actually buys more brightening.",
    saContext: "Budget vs Clinic-Tier",
    thumbnailUrl: thumb.vitaminC,
    thumbnailAlt: "A vitamin C serum dropper bottle resting on fresh oranges",
  },
  {
    slug: "nimue-vs-optiphi-retinoid-serums",
    href: "/reviews/versus/nimue-vs-optiphi-retinoid-serums",
    title: "Nimue vs Optiphi: SA's Clinic-Brand Retinoids, Compared",
    dek: "Retinaldehyde against retinol-plus-peptides — two SA clinic brands, one very different retinoid strategy.",
    saContext: "Clinic-Grade Actives",
    thumbnailUrl: thumb.serum,
    thumbnailAlt: "Two amber skincare serum bottles on a plain background",
  },
  {
    slug: "cerave-vs-cetaphil-sa-climate",
    href: "/reviews/versus/cerave-vs-cetaphil-sa-climate",
    title: "CeraVe vs Cetaphil in SA's Climate: Barrier Repair Compared",
    dek: "CeraVe's ceramide-and-MVE technology against Cetaphil's lighter approach — which barrier-repair line actually suits Highveld winters?",
    saContext: "Barrier Repair",
    thumbnailUrl: thumb.cream,
    thumbnailAlt: "A jar of barrier-repair moisturiser cream on a neutral background",
    comingSoon: true,
  },
  // ——— 12 additional coming-soon showdowns (products from SkinLabs reviews) ———
  {
    slug: "fundamentals-vs-the-ordinary-niacinamide",
    href: "/reviews/versus/fundamentals-vs-the-ordinary-niacinamide",
    title: "Fundamentals vs The Ordinary: Niacinamide Serums, Compared",
    dek: "SA's no-frills 6% niacinamide against DECIEM's 10% + zinc benchmark — concentration, texture and Rand value for local skin.",
    saContext: "Niacinamide",
    thumbnailUrl: thumb.serum,
    thumbnailAlt: "Niacinamide serum bottles on a neutral surface",
    comingSoon: true,
  },
  {
    slug: "skin-functional-vs-standard-beauty-niacinamide",
    href: "/reviews/versus/skin-functional-vs-standard-beauty-niacinamide",
    title: "Skin Functional vs Standard Beauty: Niacinamide Stacks, Compared",
    dek: "A multi-active niacinamide complex against a straightforward 10% serum — which pharmacy-aisle option actually earns its shelf space?",
    saContext: "Budget Actives",
    thumbnailUrl: thumb.serum,
    thumbnailAlt: "Two pharmacy skincare serums side by side",
    comingSoon: true,
  },
  {
    slug: "bio-oil-vs-portia-m-tissue-oil",
    href: "/reviews/versus/bio-oil-vs-portia-m-tissue-oil",
    title: "Bio-Oil vs Portia M: SA Tissue Oils for Scars & Dry Skin, Compared",
    dek: "The household-name scar oil against Portia M's marula tissue oil — mineral oil bases, fragrance and real body-skin performance.",
    saContext: "Body Oils",
    thumbnailUrl: thumb.oil,
    thumbnailAlt: "Skincare oils in glass bottles on a wooden surface",
    comingSoon: true,
  },
  {
    slug: "lamelle-vs-environ-barrier-retinoid",
    href: "/reviews/versus/lamelle-vs-environ-barrier-retinoid",
    title: "Lamelle vs Environ: Clinic Barrier Repair & Vitamin A, Compared",
    dek: "Ceramide-P barrier science against Environ's vitamin STEP-UP system — two SA clinic legends, two different jobs for compromised skin.",
    saContext: "Clinic Brands",
    thumbnailUrl: thumb.cream,
    thumbnailAlt: "Premium clinical skincare jars on a clean counter",
    comingSoon: true,
  },
  {
    slug: "bioderma-sensibio-vs-sebium",
    href: "/reviews/versus/bioderma-sensibio-vs-sebium",
    title: "Bioderma Sensibio vs Sébium: Which Micellar Water for SA Skin?",
    dek: "Sensitive-skin gold standard against the oily-skin sibling — climate, residue and when to reach for each bottle.",
    saContext: "Cleansers",
    thumbnailUrl: thumb.cleanser,
    thumbnailAlt: "Micellar water bottles and cotton pads",
    comingSoon: true,
  },
  {
    slug: "silki-vs-skin-functional-vitamin-c",
    href: "/reviews/versus/silki-vs-skin-functional-vitamin-c",
    title: "Silki vs Skin Functional: Vitamin C + Arbutin Brightening, Compared",
    dek: "A fast-growing SA brand's vitamin C stack against Skin Functional's disclosed ascorbic-and-ferulic approach — stability and Highveld UV.",
    saContext: "Brightening",
    thumbnailUrl: thumb.vitaminC,
    thumbnailAlt: "Vitamin C serums with citrus accents",
    comingSoon: true,
  },
  {
    slug: "optiphi-vs-skinphd-retinoid-night",
    href: "/reviews/versus/optiphi-vs-skinphd-retinoid-night",
    title: "Optiphi vs SkinPhD: Clinic Retinoid Night Treatments, Compared",
    dek: "Peptide-retinol professional serum against a franchise cosmeceutical night treatment — irritation runway and Rand value.",
    saContext: "Retinoids",
    thumbnailUrl: thumb.serum,
    thumbnailAlt: "Night treatment serum bottles in low light",
    comingSoon: true,
  },
  {
    slug: "esse-vs-skoon-hydration",
    href: "/reviews/versus/esse-vs-skoon-hydration",
    title: "Esse vs Skoon: Probiotic Serum vs Layered Hydrators, Compared",
    dek: "Live Lactobacillus serums against polyglutamic-and-HA layering — two Cape Town approaches to barrier comfort.",
    saContext: "Hydration",
    thumbnailUrl: thumb.moisturiser,
    thumbnailAlt: "Hydrating skincare serums with water droplets",
    comingSoon: true,
  },
  {
    slug: "lelive-vs-nimue-tinted-spf",
    href: "/reviews/versus/lelive-vs-nimue-tinted-spf",
    title: "Lelive vs Nimue: Tinted SPF for SA Skin Tones, Compared",
    dek: "Botanical-tinted SPF30 against clinic-tint SPF40 — white cast, UV claim strength and everyday wear across SA climates.",
    saContext: "Sun Protection",
    thumbnailUrl: thumb.spf,
    thumbnailAlt: "Tinted sunscreen tubes on a sunny surface",
    comingSoon: true,
  },
  {
    slug: "african-extracts-vs-skin-creamery-moisturiser",
    href: "/reviews/versus/african-extracts-vs-skin-creamery-moisturiser",
    title: "African Extracts vs Skin Creamery: Everyday Moisturisers, Compared",
    dek: "Rooibos night cream value against Cape Town 'Slow Beauty' everyday cream — texture, climate fit and price per gram.",
    saContext: "Moisturisers",
    thumbnailUrl: thumb.moisturiser,
    thumbnailAlt: "Two moisturiser jars on a marble surface",
    comingSoon: true,
  },
  {
    slug: "vitaderm-vs-skinphd-clinical-range",
    href: "/reviews/versus/vitaderm-vs-skinphd-clinical-range",
    title: "Vitaderm vs SkinPhD: SA Clinical Ranges, Compared",
    dek: "Two clinic-adjacent SA ranges — vitamin and antioxidant creams versus salon-network cosmeceuticals, on evidence and accessibility.",
    saContext: "Clinical Skincare",
    thumbnailUrl: thumb.cream,
    thumbnailAlt: "Clinical skincare products arranged on a shelf",
    comingSoon: true,
  },
  {
    slug: "justine-vs-bio-oil-tissue-oil",
    href: "/reviews/versus/justine-vs-bio-oil-tissue-oil",
    title: "Justine vs Bio-Oil: The Original Tissue Oil Showdown",
    dek: "SA's 1973 direct-sales classic against the global Bio-Oil staple — fragrance, mineral oil bases and body-skin reality.",
    saContext: "Body Care",
    thumbnailUrl: thumb.oil,
    thumbnailAlt: "Classic tissue oil bottles",
    comingSoon: true,
  },
  {
    slug: "lamelle-vs-nimue-brightening",
    href: "/reviews/versus/lamelle-vs-nimue-brightening",
    title: "Lamelle vs Nimue: Clinic Brightening Serums, Compared",
    dek: "Brite-Lite / Brighter against Nimue Radiance — professional pigmentation protocols, price and who actually needs clinic gating.",
    saContext: "Pigmentation",
    thumbnailUrl: thumb.serum,
    thumbnailAlt: "Brightening serums with droppers",
    comingSoon: true,
  },
];

/** All coming-soon Shelf Showdowns (for /compare and versus routes). */
export const comingSoonComparisons = featuredEditorials.filter((e) => e.comingSoon);
