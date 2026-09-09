/** Marketplace sample data — sourced from SkinLabs' reviewed brand catalogue.
 *  Ratings and product details are editorial picks drawn from public product info.
 *  Prices are indicative.
 */

export interface MarketplaceProduct {
  id: string;
  brand: string;
  name: string;
  slug: string;
  price: number;
  rating: number;
  reviewCount: number;
  badge?: "BESTSELLER" | "NEW" | "POPULAR";
  benefits: string[];
  category: string;
  concern: string[];
  skinType: string;
  keyActives: string[];
  targets: string;
  size: string;
  description: string;
  inStock: boolean;
  images: string[];
}

export interface MarketplaceBrand {
  id: string;
  name: string;
  slug: string;
  origin: string;
  logoText: string;
  logoStyle: string;
}

export const featuredBrands: MarketplaceBrand[] = [
  {
    id: "skoon",
    name: "Skoon",
    slug: "skoon",
    origin: "South African",
    logoText: "SKOON.",
    logoStyle: "font-black tracking-widest text-white bg-black",
  },
  {
    id: "standard-beauty",
    name: "Standard Beauty",
    slug: "standard-beauty",
    origin: "South African",
    logoText: "standard.",
    logoStyle: "font-light tracking-wide text-white bg-black",
  },
  {
    id: "esse",
    name: "Esse",
    slug: "esse",
    origin: "South African",
    logoText: "esse",
    logoStyle: "font-thin tracking-widest italic text-white bg-black",
  },
  {
    id: "lelive",
    name: "Lelive",
    slug: "lelive",
    origin: "South African",
    logoText: "lelive.",
    logoStyle: "font-light tracking-widest text-white bg-black",
  },
];

export const skinLabsPicks: MarketplaceProduct[] = [
  {
    id: "skin-functional-vit-c",
    brand: "Skin Functional",
    name: "3% Vitamin C + Niacinamide Serum",
    slug: "skin-functional-vitamin-c-niacinamide-serum",
    price: 349,
    rating: 4.8,
    reviewCount: 124,
    badge: "BESTSELLER",
    benefits: ["Brighten", "Even Tone", "Hydrate"],
    category: "Serum",
    concern: ["Hyperpigmentation"],
    skinType: "All skin types",
    keyActives: ["Vitamin C", "Niacinamide", "Hyaluronic Acid"],
    targets: "Dark spots, uneven tone, dehydration",
    size: "30ml",
    description: "A high-performance brightening serum combining 3% Vitamin C with 5% Niacinamide to target uneven skin tone and dark spots. Lightweight and fast-absorbing, it layers beautifully under moisturiser.",
    inStock: true,
    images: [],
  },
  {
    id: "skoon-barrier",
    brand: "Skoon",
    name: "Barrier Repair Moisturiser",
    slug: "skoon-barrier-repair-moisturiser",
    price: 545,
    rating: 4.7,
    reviewCount: 89,
    badge: "NEW",
    benefits: ["Nourish", "Restore", "Protect"],
    category: "Moisturiser",
    concern: ["Dry & Dehydrated"],
    skinType: "Dry, Sensitive",
    keyActives: ["Ceramides", "Shea Butter", "Centella"],
    targets: "Compromised barrier, dryness, sensitivity",
    size: "50ml",
    description: "A rich yet non-greasy moisturiser formulated to rebuild and strengthen the skin barrier. Ceramide-rich and climate-adapted for South African conditions.",
    inStock: true,
    images: [],
  },
  {
    id: "esse-spf50",
    brand: "Esse",
    name: "Daily Defence SPF 50 PA+++",
    slug: "esse-daily-defence-spf50",
    price: 425,
    rating: 4.6,
    reviewCount: 203,
    badge: "POPULAR",
    benefits: ["Protect", "Hydrate", "Soothe"],
    category: "Sun Care",
    concern: ["Sensitive Skin"],
    skinType: "All skin types (including sensitive)",
    keyActives: ["Zinc Oxide", "Aloe Vera", "Green Tea"],
    targets: "UV damage, inflammation, dehydration",
    size: "50ml",
    description: "A mineral SPF50 that sits invisibly on all skin tones. Formulated for South Africa's intense UV index, with probiotic actives to soothe and hydrate throughout the day.",
    inStock: true,
    images: [],
  },
  {
    id: "standard-ha-serum",
    brand: "Standard Beauty",
    name: "Hyaluronic Acid 2% + B5 Serum",
    slug: "standard-hyaluronic-acid-serum",
    price: 195,
    rating: 4.5,
    reviewCount: 76,
    benefits: ["Hydrate", "Plump", "Rejuvenate"],
    category: "Serum",
    concern: ["Dry & Dehydrated"],
    skinType: "All skin types",
    keyActives: ["Hyaluronic Acid", "Vitamin B5", "Sodium PCA"],
    targets: "Dehydration, fine lines, dullness",
    size: "30ml",
    description: "An affordable science-backed hydration serum with two molecular weights of Hyaluronic Acid and Vitamin B5. Fragrance-free and suitable for all skin types, including reactive skin.",
    inStock: true,
    images: [],
  },
];

export const concerns = [
  {
    id: "acne-breakouts",
    label: "Acne & Breakouts",
    slug: "acne-breakouts",
    colorClass: "bg-[#e8f4e8]",
  },
  {
    id: "hyperpigmentation",
    label: "Hyperpigmentation",
    slug: "hyperpigmentation",
    colorClass: "bg-[#fdebd0]",
  },
  {
    id: "dry-dehydrated",
    label: "Dry & Dehydrated",
    slug: "dry-dehydrated",
    colorClass: "bg-[#e8eef8]",
  },
  {
    id: "sensitive-skin",
    label: "Sensitive Skin",
    slug: "sensitive-skin",
    colorClass: "bg-[#f3e8f8]",
  },
];

export const categories = [
  { id: "face", label: "Face", icon: "👤" },
  { id: "body", label: "Body", icon: "🧴" },
  { id: "hair-scalp", label: "Hair & Scalp", icon: "💆" },
  { id: "sun-care", label: "Sun Care", icon: "☀️" },
  { id: "treatments", label: "Treatments", icon: "💧" },
  { id: "tools", label: "Tools", icon: "🖌️" },
];

export const youMightAlsoLike: MarketplaceProduct[] = [
  {
    id: "lelive-gel-moist",
    brand: "Lelive",
    name: "Hydrating Gel Moisturiser",
    slug: "lelive-hydrating-gel-moisturiser",
    price: 550,
    rating: 4.7,
    reviewCount: 89,
    benefits: ["Hydrate", "Balance"],
    category: "Moisturiser",
    concern: ["Dry & Dehydrated"],
    skinType: "All skin types",
    keyActives: ["Aloe", "Niacinamide"],
    targets: "Dehydration, shine",
    size: "50ml",
    description: "",
    inStock: true,
    images: [],
  },
  {
    id: "skin-functional-vit-c-glow",
    brand: "Skin Functional",
    name: "Vitamin C Glow Serum",
    slug: "skin-functional-vitamin-c-glow",
    price: 395,
    rating: 4.9,
    reviewCount: 176,
    benefits: ["Brighten", "Glow"],
    category: "Serum",
    concern: ["Hyperpigmentation"],
    skinType: "All skin types",
    keyActives: ["L-Ascorbic Acid"],
    targets: "Dullness, uneven tone",
    size: "30ml",
    description: "",
    inStock: true,
    images: [],
  },
  {
    id: "skoon-gentle-gel",
    brand: "Skoon",
    name: "Gentle Cleansing Gel",
    slug: "skoon-gentle-cleansing-gel",
    price: 295,
    rating: 4.6,
    reviewCount: 102,
    benefits: ["Cleanse", "Soothe"],
    category: "Cleanser",
    concern: ["Sensitive Skin"],
    skinType: "Sensitive, Combination",
    keyActives: ["Aloe", "Chamomile"],
    targets: "Impurities, sensitivity",
    size: "150ml",
    description: "",
    inStock: true,
    images: [],
  },
  {
    id: "standard-night-cream",
    brand: "Standard Beauty",
    name: "CERious PROATection Moisturiser",
    slug: "standard-cerious-proatection",
    price: 195,
    rating: 4.8,
    reviewCount: 94,
    benefits: ["Repair", "Nourish"],
    category: "Moisturiser",
    concern: ["Dry & Dehydrated"],
    skinType: "Dry, Mature",
    keyActives: ["Oat", "Ceramides"],
    targets: "Dryness, barrier repair",
    size: "50ml",
    description: "",
    inStock: true,
    images: [],
  },
];
