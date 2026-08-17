export interface ProductReview {
  id: string;
  product_name: string;
  brand: string;
  local_price_zar: number;
  where_to_buy: string;
  category: string;
  skin_type_match: string[];
  score_efficacy: number;
  score_value: number;
  score_texture: number;
  score_climate: number;
  verdict: string;
  key_ingredients: string[];
  retailers: RetailerListing[];
  isNew?: boolean;
}

export interface RetailerListing {
  retailer: "Clicks" | "Dis-Chem" | "Takealot" | "Brand Direct" | "Dermastore" | "Faithful to Nature";
  price_zar: number;
  in_stock: boolean;
  url: string;
}

/** 0–10 scores. Climate = performance in SA heat, sun and dryness. */
export const productReviews: ProductReview[] = [
  {
    id: "skoon-sensitive-fluid",
    product_name: "Basic Sensitive Fluid Moisturiser",
    brand: "Skoon Skin",
    local_price_zar: 395,
    where_to_buy: "Dermastore, Clicks",
    category: "Moisturiser",
    skin_type_match: ["Sensitive", "Combination"],
    score_efficacy: 8.4,
    score_value: 7.9,
    score_texture: 9.1,
    score_climate: 8.8,
    verdict: "A weightless, fragrance-free daily fluid that holds up in Gauteng dryness without pilling under SPF.",
    key_ingredients: ["Glycerin", "Squalane", "Panthenol"],
    retailers: [{ retailer: "Dermastore", price_zar: 395, in_stock: true, url: "https://www.dermastore.co.za/" }, { retailer: "Clicks", price_zar: 409, in_stock: true, url: "https://clicks.co.za/" }, { retailer: "Brand Direct", price_zar: 385, in_stock: true, url: "https://skoonskin.com/" }, { retailer: "Takealot", price_zar: 429, in_stock: false, url: "https://www.takealot.com/" }],
    isNew: true,
  },
  {
    id: "swiitch-superhero-cleanser",
    product_name: "SuperHero Hydrating Cleanser",
    brand: "Swiitch Beauty",
    local_price_zar: 275,
    where_to_buy: "Swiitch Beauty online, Takealot",
    category: "Cleanser",
    skin_type_match: ["Dry", "Sensitive", "Normal"],
    score_efficacy: 8.0,
    score_value: 8.6,
    score_texture: 8.7,
    score_climate: 8.2,
    verdict: "Low-foam, non-stripping and forgiving on hard water — an easy first step for compromised barriers.",
    key_ingredients: ["Glycerin", "Allantoin", "Sodium PCA"],
    retailers: [{ retailer: "Brand Direct", price_zar: 275, in_stock: true, url: "https://swiitchbeauty.co.za/" }, { retailer: "Takealot", price_zar: 289, in_stock: true, url: "https://www.takealot.com/" }, { retailer: "Clicks", price_zar: 295, in_stock: false, url: "https://clicks.co.za/" }, { retailer: "Dis-Chem", price_zar: 289, in_stock: true, url: "https://www.dischem.co.za/" }],
  },
  {
    id: "standard-beauty-niacinamide",
    product_name: "10% Niacinamide + 1% Zinc Serum",
    brand: "Standard Beauty",
    local_price_zar: 189,
    where_to_buy: "Clicks, Dis-Chem",
    category: "Serum",
    skin_type_match: ["Oily", "Combination", "Acne-prone"],
    score_efficacy: 7.8,
    score_value: 9.4,
    score_texture: 7.2,
    score_climate: 8.0,
    verdict: "The best-value pigment and oil-control serum on local shelves, if you can tolerate 10%.",
    key_ingredients: ["Niacinamide 10%", "Zinc PCA"],
    retailers: [{ retailer: "Clicks", price_zar: 189, in_stock: true, url: "https://clicks.co.za/" }, { retailer: "Dis-Chem", price_zar: 185, in_stock: true, url: "https://www.dischem.co.za/" }, { retailer: "Takealot", price_zar: 199, in_stock: true, url: "https://www.takealot.com/" }, { retailer: "Brand Direct", price_zar: 179, in_stock: true, url: "https://standardbeauty.co.za/" }],
  },
  {
    id: "lelive-marula-spf",
    product_name: "All the Shade Marula Tinted SPF 30",
    brand: "Lelive",
    local_price_zar: 450,
    where_to_buy: "Lelive online, Superbalist",
    category: "Sunscreen",
    skin_type_match: ["Deep tones", "Normal", "Dry"],
    score_efficacy: 8.6,
    score_value: 7.5,
    score_texture: 8.9,
    score_climate: 9.3,
    verdict: "A tinted mineral SPF formulated for deeper skin tones with no grey cast — rare and genuinely useful here.",
    key_ingredients: ["Zinc Oxide", "Marula Oil", "Iron Oxides"],
    retailers: [{ retailer: "Brand Direct", price_zar: 450, in_stock: true, url: "https://lelive.co.za/" }, { retailer: "Takealot", price_zar: 479, in_stock: true, url: "https://www.takealot.com/" }, { retailer: "Clicks", price_zar: 469, in_stock: false, url: "https://clicks.co.za/" }, { retailer: "Dis-Chem", price_zar: 465, in_stock: false, url: "https://www.dischem.co.za/" }],
    isNew: true,
  },
  {
    id: "oh-lief-body-oil",
    product_name: "Natural Everyday Body Oil",
    brand: "Oh-Lief",
    local_price_zar: 215,
    where_to_buy: "Faithful to Nature, Clicks",
    category: "Body",
    skin_type_match: ["Dry", "Normal"],
    score_efficacy: 7.4,
    score_value: 8.8,
    score_texture: 7.9,
    score_climate: 7.1,
    verdict: "Straightforward plant-oil blend that fixes winter shin dryness at a fair local price.",
    key_ingredients: ["Olive Oil", "Marula Oil", "Vitamin E"],
    retailers: [{ retailer: "Faithful to Nature", price_zar: 215, in_stock: true, url: "https://www.faithful-to-nature.co.za/" }, { retailer: "Clicks", price_zar: 229, in_stock: true, url: "https://clicks.co.za/" }, { retailer: "Dis-Chem", price_zar: 225, in_stock: true, url: "https://www.dischem.co.za/" }, { retailer: "Takealot", price_zar: 239, in_stock: true, url: "https://www.takealot.com/" }],
  },
  {
    id: "dermastore-barrier-cream",
    product_name: "Barrier Repair Ceramide Cream",
    brand: "Dermastore Select",
    local_price_zar: 520,
    where_to_buy: "Dermastore",
    category: "Moisturiser",
    skin_type_match: ["Dry", "Sensitive", "Eczema-prone"],
    score_efficacy: 9.0,
    score_value: 7.0,
    score_texture: 8.1,
    score_climate: 8.9,
    verdict: "The reset cream we recommend most often for over-exfoliated or eczema-prone skin in dry inland climates.",
    key_ingredients: ["Ceramide NP", "Cholesterol", "Fatty Acids"],
    retailers: [{ retailer: "Dermastore", price_zar: 520, in_stock: true, url: "https://www.dermastore.co.za/" }, { retailer: "Brand Direct", price_zar: 520, in_stock: true, url: "https://www.dermastore.co.za/" }, { retailer: "Takealot", price_zar: 559, in_stock: false, url: "https://www.takealot.com/" }, { retailer: "Dis-Chem", price_zar: 549, in_stock: false, url: "https://www.dischem.co.za/" }],
  },
];

export const reviewCategories = Array.from(new Set(productReviews.map((review) => review.category)));

export const overallScore = (review: ProductReview) =>
  Number(
    (
      (review.score_efficacy + review.score_value + review.score_texture + review.score_climate) /
      4
    ).toFixed(1),
  );
