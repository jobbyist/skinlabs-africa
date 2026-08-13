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
  full_review: string;
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

/**
 * 0–10 scores. Climate = performance in SA heat, sun and dryness.
 * Terminology: scores/verdict/retailer pricing are always free to view;
 * only `full_review` and `key_ingredients` are membership-gated. Keep this
 * split consistent across new copy and new review entries.
 */
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
    full_review:
      "Skoon's sensitive fluid is built around a minimal, fragrance-free base that suits reactive and post-procedure skin. Texture is the standout: it absorbs in seconds and layers cleanly under mineral sunscreen, which is where most local moisturisers fail. Hydration holds through a full Highveld workday, though very dry skin types will want an occlusive on top at night. Value is fair rather than cheap, and the 50ml tube lasts roughly ten weeks with twice-daily use.",
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
    full_review:
      "This is the cleanser we most often recommend to users mid-barrier-reset. The low-foam formula avoids the tight, squeaky finish that hard municipal water tends to amplify, and it removes SPF adequately as a second cleanse. It will not fully dissolve heavy waterproof sunscreen on its own, so pair it with an oil cleanse on beach days. Excellent value per millilitre for a locally formulated product.",
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
    full_review:
      "At under R200 this is the most accessible niacinamide serum in South Africa, and the 10% concentration does measurable work on post-inflammatory marks over eight to twelve weeks. The trade-off is texture: it is slightly tacky and needs a full minute to set before moisturiser. Users with reactive skin should start at alternate days, since 10% is above the comfort threshold for many Fitzpatrick IV–VI users prone to flushing.",
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
    full_review:
      "Most mineral sunscreens ash out on melanin-rich skin. Lelive's tinted marula formula is the clearest local answer to that problem, blending to a natural satin finish across a wide tonal range. Climate performance is the highest in our review set: it holds through humid coastal conditions without sliding, and the tint adds visible-light defence, which matters for melasma. SPF 30 rather than 50 is the only real limitation, so reapply diligently on long outdoor days.",
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
    full_review:
      "Nothing clever here, and that is the appeal: a clean blend of local plant oils that seals damp skin after a shower. It sits heavier than a lotion in summer humidity, so treat it as a winter and post-bath product. Fragrance is naturally derived and noticeable, which will not suit highly reactive users.",
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
    full_review:
      "A serious ceramide-and-cholesterol formula that measurably shortens barrier recovery time. Applied to damp skin twice daily, most users report reduced stinging within three to five days. It is rich, so oily skin types should reserve it for night use. Price is the main obstacle, but per week of use during a flare it remains cheaper than a dermatology consult.",
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
