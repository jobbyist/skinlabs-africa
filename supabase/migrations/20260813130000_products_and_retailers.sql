-- Review Engine data migration: moves src/data/reviews.ts's static array into
-- real tables so pricing/sentiment can eventually be kept current (the
-- refresh-reviews edge function scaffold is the next step). This is curated
-- editorial content, not user-generated — public read, writes restricted to
-- service_role (edge functions / admin), unlike review_ratings/review_comments.

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  local_price_zar INTEGER NOT NULL,
  where_to_buy TEXT NOT NULL,
  category TEXT NOT NULL,
  skin_type_match TEXT[] NOT NULL DEFAULT '{}',
  score_efficacy NUMERIC(3,1) NOT NULL,
  score_value NUMERIC(3,1) NOT NULL,
  score_texture NUMERIC(3,1) NOT NULL,
  score_climate NUMERIC(3,1) NOT NULL,
  verdict TEXT NOT NULL,
  full_review TEXT NOT NULL,
  key_ingredients TEXT[] NOT NULL DEFAULT '{}',
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.retailer_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL,
  price_zar INTEGER NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.retailer_listings TO anon, authenticated;
GRANT ALL ON public.retailer_listings TO service_role;
ALTER TABLE public.retailer_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read retailer listings" ON public.retailer_listings FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_retailer_listings_product ON public.retailer_listings(product_id);

-- Seed with the current 6 reviews so behaviour is unchanged post-migration.

INSERT INTO public.products (id, product_name, brand, local_price_zar, where_to_buy, category, skin_type_match, score_efficacy, score_value, score_texture, score_climate, verdict, full_review, key_ingredients, is_new) VALUES
('skoon-sensitive-fluid', 'Basic Sensitive Fluid Moisturiser', 'Skoon Skin', 395, 'Dermastore, Clicks', 'Moisturiser', ARRAY['Sensitive','Combination'], 8.4, 7.9, 9.1, 8.8,
 $$A weightless, fragrance-free daily fluid that holds up in Gauteng dryness without pilling under SPF.$$,
 $$Skoon's sensitive fluid is built around a minimal, fragrance-free base that suits reactive and post-procedure skin. Texture is the standout: it absorbs in seconds and layers cleanly under mineral sunscreen, which is where most local moisturisers fail. Hydration holds through a full Highveld workday, though very dry skin types will want an occlusive on top at night. Value is fair rather than cheap, and the 50ml tube lasts roughly ten weeks with twice-daily use.$$,
 ARRAY['Glycerin','Squalane','Panthenol'], true),
('swiitch-superhero-cleanser', 'SuperHero Hydrating Cleanser', 'Swiitch Beauty', 275, 'Swiitch Beauty online, Takealot', 'Cleanser', ARRAY['Dry','Sensitive','Normal'], 8.0, 8.6, 8.7, 8.2,
 $$Low-foam, non-stripping and forgiving on hard water — an easy first step for compromised barriers.$$,
 $$This is the cleanser we most often recommend to users mid-barrier-reset. The low-foam formula avoids the tight, squeaky finish that hard municipal water tends to amplify, and it removes SPF adequately as a second cleanse. It will not fully dissolve heavy waterproof sunscreen on its own, so pair it with an oil cleanse on beach days. Excellent value per millilitre for a locally formulated product.$$,
 ARRAY['Glycerin','Allantoin','Sodium PCA'], false),
('standard-beauty-niacinamide', '10% Niacinamide + 1% Zinc Serum', 'Standard Beauty', 189, 'Clicks, Dis-Chem', 'Serum', ARRAY['Oily','Combination','Acne-prone'], 7.8, 9.4, 7.2, 8.0,
 $$The best-value pigment and oil-control serum on local shelves, if you can tolerate 10%.$$,
 $$At under R200 this is the most accessible niacinamide serum in South Africa, and the 10% concentration does measurable work on post-inflammatory marks over eight to twelve weeks. The trade-off is texture: it is slightly tacky and needs a full minute to set before moisturiser. Users with reactive skin should start at alternate days, since 10% is above the comfort threshold for many Fitzpatrick IV–VI users prone to flushing.$$,
 ARRAY['Niacinamide 10%','Zinc PCA'], false),
('lelive-marula-spf', 'All the Shade Marula Tinted SPF 30', 'Lelive', 450, 'Lelive online, Superbalist', 'Sunscreen', ARRAY['Deep tones','Normal','Dry'], 8.6, 7.5, 8.9, 9.3,
 $$A tinted mineral SPF formulated for deeper skin tones with no grey cast — rare and genuinely useful here.$$,
 $$Most mineral sunscreens ash out on melanin-rich skin. Lelive's tinted marula formula is the clearest local answer to that problem, blending to a natural satin finish across a wide tonal range. Climate performance is the highest in our review set: it holds through humid coastal conditions without sliding, and the tint adds visible-light defence, which matters for melasma. SPF 30 rather than 50 is the only real limitation, so reapply diligently on long outdoor days.$$,
 ARRAY['Zinc Oxide','Marula Oil','Iron Oxides'], true),
('oh-lief-body-oil', 'Natural Everyday Body Oil', 'Oh-Lief', 215, 'Faithful to Nature, Clicks', 'Body', ARRAY['Dry','Normal'], 7.4, 8.8, 7.9, 7.1,
 $$Straightforward plant-oil blend that fixes winter shin dryness at a fair local price.$$,
 $$Nothing clever here, and that is the appeal: a clean blend of local plant oils that seals damp skin after a shower. It sits heavier than a lotion in summer humidity, so treat it as a winter and post-bath product. Fragrance is naturally derived and noticeable, which will not suit highly reactive users.$$,
 ARRAY['Olive Oil','Marula Oil','Vitamin E'], false),
('dermastore-barrier-cream', 'Barrier Repair Ceramide Cream', 'Dermastore Select', 520, 'Dermastore', 'Moisturiser', ARRAY['Dry','Sensitive','Eczema-prone'], 9.0, 7.0, 8.1, 8.9,
 $$The reset cream we recommend most often for over-exfoliated or eczema-prone skin in dry inland climates.$$,
 $$A serious ceramide-and-cholesterol formula that measurably shortens barrier recovery time. Applied to damp skin twice daily, most users report reduced stinging within three to five days. It is rich, so oily skin types should reserve it for night use. Price is the main obstacle, but per week of use during a flare it remains cheaper than a dermatology consult.$$,
 ARRAY['Ceramide NP','Cholesterol','Fatty Acids'], false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.retailer_listings (product_id, retailer, price_zar, in_stock, url) VALUES
('skoon-sensitive-fluid', 'Dermastore', 395, true, 'https://www.dermastore.co.za/'),
('skoon-sensitive-fluid', 'Clicks', 409, true, 'https://clicks.co.za/'),
('skoon-sensitive-fluid', 'Brand Direct', 385, true, 'https://skoonskin.com/'),
('skoon-sensitive-fluid', 'Takealot', 429, false, 'https://www.takealot.com/'),
('swiitch-superhero-cleanser', 'Brand Direct', 275, true, 'https://swiitchbeauty.co.za/'),
('swiitch-superhero-cleanser', 'Takealot', 289, true, 'https://www.takealot.com/'),
('swiitch-superhero-cleanser', 'Clicks', 295, false, 'https://clicks.co.za/'),
('swiitch-superhero-cleanser', 'Dis-Chem', 289, true, 'https://www.dischem.co.za/'),
('standard-beauty-niacinamide', 'Clicks', 189, true, 'https://clicks.co.za/'),
('standard-beauty-niacinamide', 'Dis-Chem', 185, true, 'https://www.dischem.co.za/'),
('standard-beauty-niacinamide', 'Takealot', 199, true, 'https://www.takealot.com/'),
('standard-beauty-niacinamide', 'Brand Direct', 179, true, 'https://standardbeauty.co.za/'),
('lelive-marula-spf', 'Brand Direct', 450, true, 'https://lelive.co.za/'),
('lelive-marula-spf', 'Takealot', 479, true, 'https://www.takealot.com/'),
('lelive-marula-spf', 'Clicks', 469, false, 'https://clicks.co.za/'),
('lelive-marula-spf', 'Dis-Chem', 465, false, 'https://www.dischem.co.za/'),
('oh-lief-body-oil', 'Faithful to Nature', 215, true, 'https://www.faithful-to-nature.co.za/'),
('oh-lief-body-oil', 'Clicks', 229, true, 'https://clicks.co.za/'),
('oh-lief-body-oil', 'Dis-Chem', 225, true, 'https://www.dischem.co.za/'),
('oh-lief-body-oil', 'Takealot', 239, true, 'https://www.takealot.com/'),
('dermastore-barrier-cream', 'Dermastore', 520, true, 'https://www.dermastore.co.za/'),
('dermastore-barrier-cream', 'Brand Direct', 520, true, 'https://www.dermastore.co.za/'),
('dermastore-barrier-cream', 'Takealot', 559, false, 'https://www.takealot.com/'),
('dermastore-barrier-cream', 'Dis-Chem', 549, false, 'https://www.dischem.co.za/');
