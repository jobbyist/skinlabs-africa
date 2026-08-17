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

export interface SeededComment {
  display_name: string;
  body: string;
  created_at: string;
}

export interface SeededRating {
  display_name: string;
  rating: number;
  liked: boolean;
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

/** Seeded member comments for featured product reviews with realistic South African usernames */
export const seededComments: Record<string, SeededComment[]> = {
  "skoon-sensitive-fluid": [
    {
      display_name: "Thandi_M",
      body: "Finally found a moisturiser that doesn't break me out in this Joburg dryness! Light texture but properly hydrating. Been using for 3 months now.",
      created_at: "2026-07-15T14:30:00Z",
    },
    {
      display_name: "JJ_vanderMerwe",
      body: "My derm recommended this and I'm so glad. No fragrance, no irritation, layers perfectly under my morning SPF. Worth every cent.",
      created_at: "2026-07-22T09:15:00Z",
    },
    {
      display_name: "Lerato_ZA",
      body: "I have super reactive skin and this is one of the few products I can use daily. Doesn't pill under makeup which is a huge plus!",
      created_at: "2026-08-02T16:45:00Z",
    },
    {
      display_name: "SiphoK",
      body: "Great for combination skin. Not too heavy but keeps my cheeks from getting tight during winter. Repurchasing for sure.",
      created_at: "2026-08-10T11:20:00Z",
    },
  ],
  "swiitch-superhero-cleanser": [
    {
      display_name: "Zanele_DBN",
      body: "Love that this doesn't strip my skin even with our hard Durban water. Gentle enough for morning and evening use.",
      created_at: "2026-06-28T13:40:00Z",
    },
    {
      display_name: "PieterJ",
      body: "Been using this for 2 weeks and my skin barrier already feels stronger. The low-foam formula takes getting used to but it works.",
      created_at: "2026-07-18T10:05:00Z",
    },
    {
      display_name: "NomvulaM",
      body: "This cleanser is a game changer for sensitive skin. No tightness, no irritation. Just clean, comfortable skin. 10/10",
      created_at: "2026-08-05T15:30:00Z",
    },
  ],
  "standard-beauty-niacinamide": [
    {
      display_name: "Tanya_CPT",
      body: "At this price point, you can't go wrong. Helps with my oiliness and fading dark spots. Started with every other day to build tolerance.",
      created_at: "2026-07-08T12:10:00Z",
    },
    {
      display_name: "Bongani_JHB",
      body: "The 10% concentration is strong but effective. I use it 3x per week and have seen real improvement in my acne scarring.",
      created_at: "2026-07-25T14:55:00Z",
    },
    {
      display_name: "ChrisM_PE",
      body: "Great value for money. Does exactly what it says on the bottle. My T-zone looks much less shiny by midday now.",
      created_at: "2026-08-01T09:30:00Z",
    },
    {
      display_name: "Mbali_Soweto",
      body: "Been using this for a month and my skin texture has improved noticeably. Just be careful if you have sensitive skin - ease into it!",
      created_at: "2026-08-12T16:20:00Z",
    },
    {
      display_name: "LiamR",
      body: "Affordable and effective. Helped control my combination skin's oil production without drying out my cheeks. Solid product.",
      created_at: "2026-08-14T11:45:00Z",
    },
  ],
  "lelive-marula-spf": [
    {
      display_name: "Ayanda_ZA",
      body: "FINALLY an SPF that doesn't make my deep skin tone look ashy! The tint blends beautifully and the marula oil keeps me glowing. This is revolutionary.",
      created_at: "2026-07-12T10:25:00Z",
    },
    {
      display_name: "ZinhleN",
      body: "I've been waiting for something like this! No white cast, feels luxurious, and actually protects. Supporting this local brand all the way.",
      created_at: "2026-07-30T13:15:00Z",
    },
    {
      display_name: "ThembaM",
      body: "As someone with dark skin, I've struggled to find SPF that works. This is perfect - no grey undertones and doesn't feel heavy in our heat.",
      created_at: "2026-08-06T15:50:00Z",
    },
    {
      display_name: "NeoK_GP",
      body: "Texture is smooth, blends easily, and holds up well in Pretoria's sun. The price is steep but the formulation is worth it for melanin-rich skin.",
      created_at: "2026-08-11T09:40:00Z",
    },
  ],
  "oh-lief-body-oil": [
    {
      display_name: "AnneliS",
      body: "Perfect for our dry winters. I use it right after the shower on damp skin. Absorbs well and keeps my legs from looking scaly. Great price too!",
      created_at: "2026-06-20T14:30:00Z",
    },
    {
      display_name: "KayaM",
      body: "Simple, effective, affordable. This is what body care should be. No fancy claims, just good quality oils that work.",
      created_at: "2026-07-14T11:15:00Z",
    },
    {
      display_name: "RianV",
      body: "My go-to for winter dryness. The marula and olive oil combo is nourishing without being greasy. Solid local product.",
      created_at: "2026-08-03T16:05:00Z",
    },
  ],
  "dermastore-barrier-cream": [
    {
      display_name: "SarahL_CPT",
      body: "This saved my skin after I over-exfoliated with acids. Rich but not greasy, and my barrier healed in about 2 weeks. Keep this in stock always!",
      created_at: "2026-07-05T13:20:00Z",
    },
    {
      display_name: "Mandla_GP",
      body: "My eczema-prone skin loves this. The ceramide formula really works in our dry Highveld climate. Pricey but I'd rather spend it here than on cortisone.",
      created_at: "2026-07-19T10:45:00Z",
    },
    {
      display_name: "Emma_Durbs",
      body: "Best barrier repair cream I've tried. Healed my compromised skin from tretinoin overuse. Texture is thick but absorbs well.",
      created_at: "2026-07-28T15:30:00Z",
    },
    {
      display_name: "ThaboN",
      body: "This is my HG for winter. Locks in moisture like nothing else. Worth the investment if you have chronic dryness or sensitivity issues.",
      created_at: "2026-08-07T12:10:00Z",
    },
  ],
};

/** Seeded member ratings for featured product reviews (3-5 stars) */
export const seededRatings: Record<string, SeededRating[]> = {
  "skoon-sensitive-fluid": [
    { display_name: "Ntombi_JHB", rating: 5, liked: true },
    { display_name: "DavidB", rating: 4, liked: true },
    { display_name: "LindiweP", rating: 5, liked: true },
    { display_name: "GerritV", rating: 4, liked: false },
  ],
  "swiitch-superhero-cleanser": [
    { display_name: "PhumlaniM", rating: 4, liked: true },
    { display_name: "CarlaJ", rating: 5, liked: true },
    { display_name: "SimphiweK", rating: 4, liked: true },
  ],
  "standard-beauty-niacinamide": [
    { display_name: "NatashaR", rating: 4, liked: true },
    { display_name: "LungiM", rating: 5, liked: true },
    { display_name: "PietroD", rating: 3, liked: false },
    { display_name: "ThandiN", rating: 4, liked: true },
    { display_name: "JasonW", rating: 4, liked: true },
  ],
  "lelive-marula-spf": [
    { display_name: "BongiweS", rating: 5, liked: true },
    { display_name: "RohanP", rating: 5, liked: true },
    { display_name: "KeletsoM", rating: 4, liked: true },
    { display_name: "ZandiM", rating: 5, liked: true },
  ],
  "oh-lief-body-oil": [
    { display_name: "MikeH", rating: 4, liked: true },
    { display_name: "PreciousN", rating: 3, liked: false },
    { display_name: "StefanK", rating: 4, liked: true },
  ],
  "dermastore-barrier-cream": [
    { display_name: "NombusoD", rating: 5, liked: true },
    { display_name: "JanW", rating: 4, liked: true },
    { display_name: "SibaM", rating: 5, liked: true },
    { display_name: "KarenL", rating: 4, liked: false },
  ],
};

/** Helper to get average rating from seeded ratings */
export const getSeededAverageRating = (reviewId: string): number | null => {
  const ratings = seededRatings[reviewId];
  if (!ratings || ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / ratings.length).toFixed(1));
};

/** Helper to get like count from seeded ratings */
export const getSeededLikeCount = (reviewId: string): number => {
  const ratings = seededRatings[reviewId];
  if (!ratings) return 0;
  return ratings.filter((r) => r.liked).length;
};
