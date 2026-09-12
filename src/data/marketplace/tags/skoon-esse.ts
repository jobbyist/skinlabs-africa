/**
 * Editorial descriptions and structured tags for the SKOON (26) and Esse (17)
 * products in `ftnCatalog` (src/data/marketplace/ftn-catalog.ts), used to
 * seed the OpenHaus marketplace. `description` is a rewritten, non-copy-pasted
 * summary of each product's real `rawDescription`/`howToUse` in SkinLabs'
 * editorial voice — every factual claim here traces back to that source text;
 * nothing is invented. `name` in each entry is an exact match to the `name`
 * field in the corresponding `ftnCatalog` entry (the join key).
 *
 * Lelive and Standard Beauty entries are handled separately — not here.
 */

export interface OpenHausProductTags {
  name: string; // must exactly match the `name` field in ftnCatalog
  slug: string;
  description: string;
  category: "face" | "body" | "hair-scalp" | "sun-care" | "treatments" | "tools";
  concern: string[];
  values: string[];
  skinToneClaims: string[];
  keyActives: string[];
  size: string | null;
}

export const skoonEsseTags: OpenHausProductTags[] = [
  // ---------------- SKOON (26) ----------------
  {
    name: "SKOON. SUNNYBONANI® SPF40 Daily Defence Cream",
    slug: "skoon-sunnybonani-spf40-daily-defence-cream",
    description:
      "A mineral SPF40+ daily moisturiser built to do several jobs in one step: hydrate, brighten, repair and protect against both UV and blue light. The broad-spectrum mineral sunscreen base is paired with hyaluronic acid, niacinamide, bakuchiol and ceramides in a lightweight, non-greasy formula designed to blend into every skin tone without a white cast. It isn't water-resistant, so it suits everyday wear rather than swimming or heavy sweating.",
    category: "sun-care",
    concern: ["Hyperpigmentation", "Dry & Dehydrated", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: ["All Skin Tones"],
    keyActives: ["Hyaluronic Acid", "Niacinamide", "Bakuchiol", "Ceramides"],
    size: null,
  },
  {
    name: "SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser",
    slug: "skoon-essentials-double-cleanse-duo",
    description:
      "A two-step cleansing routine built around a cream-to-milk first cleanse and a gentle foaming second cleanse, designed to lift makeup, sunscreen and daily grime without disturbing the skin barrier. The oil-based first step dissolves impurities while the water-based follow-up finishes the job, leaving skin balanced and comfortably hydrated rather than stripped.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Cleansing Oils", "Skin-Loving Lipids"],
    size: null,
  },
  {
    name: "SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE",
    slug: "skoon-eye-shift-duo-bright-eyed-sleep-depuff",
    description:
      "Pairs the Bright-Eyed eye cream with a bonus Sleep Depuff gel pen for a combined approach to tired-looking eyes. The cream hydrates and reinforces the skin barrier while working to brighten and firm, visibly softening the look of dark circles and puffiness over time. Applied after serum and left to absorb before moisturiser, it targets the eye area without adding an extra step to the routine.",
    category: "face",
    concern: ["Dark Circles & Puffiness", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Hydrating Complex", "Brightening & Firming Complex"],
    size: "15ml + 8ml",
  },
  {
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream",
    slug: "skoon-happy-flora-microbiome-balancing-face-cream",
    description:
      "A microbiome-focused moisturiser built on Swiss yoghurt and Kigelia africana to support the bacterial balance underpinning healthy skin. It's formulated to strengthen the skin barrier and calm redness, dryness and general sensitivity, with baobab oil adding hydration and a light natural vanilla scent rounding out the feel — a fit for skin that needs settling down as much as moisturising.",
    category: "face",
    concern: ["Sensitive Skin", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Pre/Probiotics", "Swiss Yoghurt", "Kigelia Africana", "Baobab Oil"],
    size: null,
  },
  {
    name: "SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine",
    slug: "skoon-sleep-depuff-eye-gel-pen",
    description:
      "A roll-on gel treatment that pairs caffeine with peptides and bulbine to address puffiness and fine lines around the eyes. The metal rollerball delivers a cooling effect on contact, while the antioxidant-rich formula is designed to soften crow's feet, reduce dark circles and brighten the under-eye area over time. Meant to be layered under a cream, morning or night.",
    category: "face",
    concern: ["Dark Circles & Puffiness", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Caffeine", "Peptides", "Bulbine"],
    size: null,
  },
  {
    name: "SKOON. SUGABABE Face Concentrate – Hydrating Serum",
    slug: "skoon-sugababe-face-concentrate-hydrating-serum",
    description:
      "A vegan, fragrance-free hydrating serum built around three oil-based concentrates plus acmella, an ingredient known for a botox-like tightening effect that helps plump skin and soften the appearance of lines. It's gentle enough for sensitive, reactive skin, calming inflammation while it works, and can also be massaged into newly healed tissue as part of scar maintenance. A few drops mixed into moisturiser, or applied neat, is enough.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Sensitive Skin", "Dry & Dehydrated"],
    values: ["Vegan", "Cruelty-Free", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Acmella", "Plant Oil Concentrates"],
    size: null,
  },
  {
    name: "SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist",
    slug: "skoon-hydrosurge-duo-pack",
    description:
      "Combines the WOW-WOW WONDER+ NanoPillow serum with the SKIN PJ's Activator mist for an intensive hydration routine. The waterless, electrospun serum carries 20% hyaluronic acid and is designed to be activated with the mist immediately before application, driving moisture deep into skin for a plumper, more radiant finish. Built for skin that needs a real hydration boost rather than a light top-up.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Hyaluronic Acid (20%)", "Pro-Collagen Complex"],
    size: null,
  },
  {
    name: "SKOON Dream Team Duo Pack",
    slug: "skoon-dream-team-duo-pack",
    description:
      "Splits skincare into a clear day-and-night routine: a vitamin C serum for mornings that hydrates, softens and brightens, and a vitamin A treatment for evenings that supports collagen production and skin renewal. Hyaluronic acid and phytic acid round out the formulas, working on tone and texture from both directions. Daily broad-spectrum SPF is recommended alongside the evening vitamin A step.",
    category: "face",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Vitamin A", "Hyaluronic Acid", "Phytic Acid"],
    size: null,
  },
  {
    name: "SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm",
    slug: "skoon-ruby-marine-face-balm-stick",
    description:
      "A barrier-repair balm in a travel-friendly stick, built on marula oil, niacinamide, ceramide 3 and pomegranate sterols to soothe and rebuild a compromised skin barrier. It's formulated to ease hyperpigmentation and inflammation while delivering deep hydration, and the twist-up format makes it easy to apply on the go without decanting into a jar.",
    category: "face",
    concern: ["Hyperpigmentation", "Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Marula Oil", "Niacinamide", "Ceramide 3", "Pomegranate Sterols"],
    size: "15ml",
  },
  {
    name: "SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin",
    slug: "skoon-oh-so-bubbly-hydrating-cleanser",
    description:
      "A gentle, airy cleanser made with real Swiss yoghurt, honey and Kigelia africana, built to clear away impurities without disrupting the skin's natural barrier or pH. It's designed for combination and sensitive skin, hydrating, firming and toning as it cleanses so skin is left soft and calm rather than tight — and works well as the second step in a double-cleanse routine.",
    category: "face",
    concern: ["Sensitive Skin", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Swiss Yoghurt", "Honey", "Kigelia Africana"],
    size: "100ml",
  },
  {
    name: "SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads",
    slug: "skoon-fruitful-radiance-night-exfoliant",
    description:
      "A leave-on AHA/BHA night exfoliant that targets hyperpigmentation and breakouts by clearing dead skin cells, unclogging pores and encouraging cell turnover for a brighter, more even complexion. It also helps subsequent products absorb better. Reusable bamboo cotton pads are included, and a mild tingling on first use is expected as skin builds tolerance.",
    category: "treatments",
    concern: ["Hyperpigmentation", "Acne & Breakouts"],
    values: [],
    skinToneClaims: [],
    keyActives: ["AHA", "BHA"],
    size: null,
  },
  {
    name: "SKOON. BAKU GLOW Face Cream",
    slug: "skoon-baku-glow-face-cream",
    description:
      "A plant-based face cream built around 1% bakuchiol, a gentler alternative to retinol, alongside ceramides, kigelia and hyaluronic acid. It's designed to encourage gradual cell turnover and collagen production to soften fine lines and improve elasticity, while supporting hydration, texture and tone. Formulated to suit all skin types, and safe to use during pregnancy or while breastfeeding.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated"],
    values: ["Pregnancy-Safe"],
    skinToneClaims: [],
    keyActives: ["Bakuchiol (1%)", "Ceramides", "Kigelia", "Hyaluronic Acid"],
    size: "30ml",
  },
  {
    name: "SKOON. RETININ® Night 0.1% Retinal Treatment",
    slug: "skoon-retinin-night-01-retinal-treatment",
    description:
      "A night-only treatment built on 0.1% retinal, peptides and fulvic acid to firm skin, soften fine lines and wrinkles, and refine texture while also addressing breakouts. It's formulated for gentle, gradual renewal rather than aggressive resurfacing, using cruelty-free ingredients with no artificial colours or fragrances. Start at two to three nights a week and build up as skin adjusts, pairing daytime use with broad-spectrum SPF.",
    category: "treatments",
    concern: ["Fine Lines & Ageing", "Acne & Breakouts"],
    values: ["Cruelty-Free", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Retinal (0.1%)", "Peptides", "Fulvic Acid"],
    size: null,
  },
  {
    name: "SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack",
    slug: "skoon-wow-wow-wonder-nanopillow-serum-30-day",
    description:
      "A hydrating pro-collagen serum designed to nourish and regenerate skin while reinforcing its natural moisture barrier against everyday environmental stress. Used consistently, it's formulated to soften fine lines, firm and tone skin, and fade dark spots, all in a lightweight, non-greasy texture suited to every skin type.",
    category: "face",
    concern: ["Dry & Dehydrated", "Hyperpigmentation", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Pro-Collagen Complex", "Hydrating Actives"],
    size: null,
  },
  {
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin",
    slug: "skoon-everyday-essentials-set-combination-oily-skin",
    description:
      "A streamlined routine for oily T-zone, combination and sensitive skin, pairing a purifying clay cleanser with a hyaluronic hydrating and brightening serum. Together they clear congested pores and balance oil production while still hydrating drier patches and calming redness or irritation, so one routine covers uneven skin without over-drying it.",
    category: "face",
    concern: ["Acne & Breakouts", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Purifying Clay", "Hyaluronic Acid"],
    size: null,
  },
  {
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches",
    slug: "skoon-everyday-essentials-set-combination-dry-patches",
    description:
      "Built for combination, dry and sensitive skin, this set pairs a gel-to-milk cleanser and makeup remover with a hyaluronic hydrating and brightening serum, moisturiser and barrier balm. The routine is designed to cleanse gently while restoring moisture to rough, dry patches, controlling shine elsewhere and calming irritation, rather than treating the face as one uniform skin type.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Gel-to-Milk Cleanser Actives", "Hyaluronic Acid"],
    size: null,
  },
  {
    name: "SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost",
    slug: "skoon-pixie-dust-nanopillow-serum",
    description:
      "A barrier-focused hydrating serum combining niacinamide, squalane, hyaluronic acid and azelaic acid in a single-dose NanoPillow format. It's designed to deliver instant hydration while reinforcing the skin barrier, smoothing texture, brightening tone and fading dark spots for a more even complexion.",
    category: "face",
    concern: ["Dry & Dehydrated", "Hyperpigmentation", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Squalane", "Hyaluronic Acid", "Azelaic Acid"],
    size: null,
  },
  {
    name: "SKOON. Double Cleanse Heroes Combo - Dry Patches",
    slug: "skoon-double-cleanse-heroes-combo-dry-patches",
    description:
      "Pairs the Gel-to-Milk cleanser with the Oh So Bubbly foaming cleanser for a double cleanse that lifts dirt, impurities and excess oil while protecting the skin's natural oils and moisture barrier. The combination is built to unclog pores and combat breakouts while still hydrating and balancing skin, so a thorough cleanse doesn't come at the cost of comfort.",
    category: "face",
    concern: ["Acne & Breakouts", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Gel-to-Milk Cleanser Actives", "Swiss Yoghurt"],
    size: null,
  },
  {
    name: "SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula",
    slug: "skoon-bright-eyed-eye-cream-vitamin-c-k1",
    description:
      "An eye cream built on vitamin C and vitamin K1 to brighten dark circles, reduce puffiness and improve circulation around the eyes. Collagen-supporting ingredients work alongside deep hydration to smooth and firm the area while strengthening the skin barrier, for a more even, less tired-looking eye area over time.",
    category: "face",
    concern: ["Dark Circles & Puffiness", "Hyperpigmentation", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Vitamin K1", "Collagen-Boosting Ingredients"],
    size: "15ml",
  },
  {
    name: "SKOON. The One Hydra-Plump Face Cream - 30ml",
    slug: "skoon-the-one-hydra-plump-face-cream",
    description:
      "A lightweight, fast-absorbing face cream built on marula oil, ceramide 3 and hyaluronic acid to lock in moisture and support a plump, supple complexion. A natural fynbos-inspired scent rounds out a formula designed for deep, all-day nourishment without a heavy or greasy feel.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Marula Oil", "Ceramide 3", "Hyaluronic Acid"],
    size: "30ml",
  },
  {
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill",
    slug: "skoon-happy-flora-microbiome-balancing-face-cream-refill",
    description:
      "An eco-friendly refill of the Happy Flora microbiome-balancing face cream, letting you top up the formula instead of buying a new jar. The same blend of Swiss yoghurt, baobab and prebiotics is designed to support a balanced skin microbiome and a more resilient-looking barrier.",
    category: "face",
    concern: [],
    values: [],
    skinToneClaims: [],
    keyActives: ["Swiss Yoghurt", "Baobab", "Prebiotics"],
    size: "30ml",
  },
  {
    name: "SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml",
    slug: "skoon-wrap-me-up-ultra-thick-comforting-face-cream",
    description:
      "An ultra-thick comforting cream built on ceramides, pomegranate sterols and organic shea butter, designed to manage excessive dryness and calm stressed, uncomfortable skin. It's formulated to maintain a healthy-looking barrier while restoring a more balanced, settled complexion.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Ceramides", "Pomegranate Sterols", "Shea Butter"],
    size: "30ml",
  },
  {
    name: "SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml",
    slug: "skoon-pretty-smooth-oil-balance-gel-cream",
    description:
      "A fast-absorbing gel-cream built on niacinamide and seaweed extract to regulate surface shine and refine texture without weighing skin down. It's designed to balance an oily or combination complexion while still supporting a healthy-looking skin barrier.",
    category: "face",
    concern: ["Acne & Breakouts"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Seaweed Extract"],
    size: "30ml",
  },
  {
    name: "SKOON. essentials Rich Moisture Cream",
    slug: "skoon-essentials-rich-moisture-cream",
    description:
      "A rich moisturiser built on ceramide NP, shea butter and antioxidant-rich botanicals, designed to deeply hydrate dry, dehydrated and compromised skin. Kalahari melon seed and coconut oils help reinforce the barrier and reduce moisture loss, leaving skin feeling soft, smooth and more resilient.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Ceramide NP", "Shea Butter", "Kalahari Melon Seed Oil", "Coconut Oil"],
    size: null,
  },
  {
    name: "SKOON. SKIN PJs Face Mist - Hydrating Toner with Buchu & CBD",
    slug: "skoon-skin-pjs-face-mist-buchu-cbd",
    description:
      "A water-based hydrating toner spiked with buchu and CBD, designed to deliver an instant refresh while nourishing and calming sensitive skin. It's built to reinforce the skin's natural barrier and prime it to absorb serums, moisturisers and masks more effectively, and can be reapplied throughout the day.",
    category: "face",
    concern: ["Sensitive Skin", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Buchu", "CBD"],
    size: null,
  },
  {
    name: "SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask",
    slug: "skoon-bff-sleepover-overnight-regeneration-face-mask",
    description:
      "An overnight regeneration sheet mask built on hyaluronic acid, CBD and antioxidants, designed to repair, soothe and plump skin while it sleeps. The nanofibre sheet is soaked in active ingredients and oils to support long-term hydration and skin cell regeneration.",
    category: "treatments",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Hyaluronic Acid", "CBD", "Antioxidants"],
    size: null,
  },

  // ---------------- Esse (17) ----------------
  {
    name: "Esse Bakuchiol Serum",
    slug: "esse-bakuchiol-serum",
    description:
      "A plant-based alternative to retinol built on bakuchiol, aloe vera and jojoba seed oil, designed to boost collagen synthesis and smooth fine lines, wrinkles and rough texture. It's formulated to calm inflammation and fade hyperpigmentation while improving elasticity, with hydrating and protective properties suited to twice-daily use. Vegan-friendly and certified cruelty-free by PETA's Beauty Without Bunnies programme.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Hyperpigmentation", "Sensitive Skin"],
    values: ["Vegan", "Cruelty-Free"],
    skinToneClaims: [],
    keyActives: ["Bakuchiol", "Aloe Vera", "Jojoba Seed Oil"],
    size: null,
  },
  {
    name: "Esse Resurrect Serum",
    slug: "esse-resurrect-serum",
    description:
      "Built around the Namibian resurrection plant, a shrub prized for its hydrating and antioxidant properties, alongside aloe, baobab and probiotics. It's designed for evening use to calm inflammation, soften wrinkles and fine lines, and plump tired-looking skin. Made locally, cruelty-free and organic.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated"],
    values: ["Cruelty-Free"],
    skinToneClaims: [],
    keyActives: ["Resurrection Plant", "Aloe", "Baobab", "Probiotics"],
    size: null,
  },
  {
    name: "Esse Live Probiotic Mist",
    slug: "esse-live-probiotic-mist",
    description:
      "A facial mist activated with live probiotic powder just before first use, designed to hydrate, protect and rebalance the skin's microbiome while reinforcing its natural barrier. It's built to lock in moisture for lasting hydration across all skin types, and should be used within three months of activation.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Live Probiotics", "Microbiome-Balancing Actives"],
    size: null,
  },
  {
    name: "Esse Pro Sun D Serum",
    slug: "esse-pro-sun-d-serum",
    description:
      "A provitamin D serum designed to activate in sunlight, helping skin build its own vitamin D while supporting barrier repair and cell renewal. The lightweight, fast-absorbing formula is built to calm inflammation, slow visible ageing and leave skin plump, hydrated and glowing when paired with a few minutes of unprotected sun exposure. Vegan-friendly and certified cruelty-free by Beauty Without Cruelty SA.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated", "Sensitive Skin"],
    values: ["Vegan", "Cruelty-Free"],
    skinToneClaims: [],
    keyActives: ["Provitamin D", "Barrier-Repair Complex"],
    size: "15ml",
  },
  {
    name: "Esse Hyaluronic Serum",
    slug: "esse-hyaluronic-serum",
    description:
      "An anti-ageing serum for mature skin combining probiotics, prebiotics and hyaluronic acid in a fast-absorbing, cruelty-free formula. It's designed to protect existing collagen and slow premature ageing while calming inflammation and reinforcing the skin's natural barrier, leaving skin softer and more supple with regular evening use.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated", "Sensitive Skin"],
    values: ["Cruelty-Free"],
    skinToneClaims: [],
    keyActives: ["Hyaluronic Acid", "Probiotics", "Prebiotics"],
    size: null,
  },
  {
    name: "Esse Sunscreen",
    slug: "esse-sunscreen",
    description:
      "An organic mineral sunscreen offering broad-spectrum SPF30 protection via coated zinc oxide, formulated to spread easily and evenly with 0% nano-sized particles. It's fragrance-free and pH-balanced for sensitive skin, and biodegradable and coral-reef safe for anyone applying it before swimming. Reapply regularly, especially after swimming or towelling.",
    category: "sun-care",
    concern: ["Sensitive Skin"],
    values: ["Fragrance-Free", "Reef-Safe"],
    skinToneClaims: [],
    keyActives: ["Zinc Oxide", "Broad-Spectrum Mineral Filters"],
    size: null,
  },
  {
    name: "Esse Lip Conditioner",
    slug: "esse-lip-conditioner",
    description:
      "A protective lip conditioner made from organic, responsibly sourced ingredients, designed to lock in moisture and support the lips' natural barrier function. A small amount goes a long way, making it a simple daily addition rather than a heavy balm.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Organic Botanical Oils", "Barrier-Restoring Actives"],
    size: null,
  },
  {
    name: "Esse Light Moisturiser (Oily & Combination Skin)",
    slug: "esse-light-moisturiser-oily-combination-skin",
    description:
      "A lightweight moisturiser built for oily and combination skin, designed to let skin function without clogged pores or a build-up of impurities when paired with an Esse cleanser. It's formulated without the harsher chemicals found in many conventional moisturisers, making it a fit for oily and acne-prone skin that still needs hydration.",
    category: "face",
    concern: ["Acne & Breakouts"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Lightweight Botanical Complex", "Non-Comedogenic Actives"],
    size: null,
  },
  {
    name: "Esse Repair Oil (Tissue Oil)",
    slug: "esse-repair-oil-tissue-oil",
    description:
      "A tissue oil built on African botanicals — manketti, marula and yangu, rich in omega fatty acids and vitamins, alongside jojoba and rosehip — designed to support the look of stretch marks, scarring, pigmentation and damaged skin. It can be massaged directly into affected areas or blended into a moisturiser, and is intended to be used as often as needed.",
    category: "body",
    concern: ["Hyperpigmentation", "Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Manketti Oil", "Marula Oil", "Yangu Oil", "Jojoba Oil", "Rosehip Oil"],
    size: null,
  },
  {
    name: "Esse Hydrating Mist",
    slug: "esse-hydrating-mist",
    description:
      "A toning mist built on rooibos leaf extract, designed to revitalise skin tone and texture without the drying alcohol base of many conventional toners. Rooibos brings antioxidant protection against free-radical damage and visible ageing, and the mist can double as a midday refresh sprayed over makeup.",
    category: "face",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Rooibos Leaf Extract", "Antioxidants"],
    size: null,
  },
  {
    name: "Esse Eye & Lip Cream",
    slug: "esse-eye-lip-cream",
    description:
      "A non-toxic ointment for the eye and lip area, packed with organic active ingredients designed to moisturise gently without triggering puffiness while reducing the look of dark shadows. It's built to work alongside the wider signs-of-ageing routine rather than as a standalone treatment.",
    category: "face",
    concern: ["Dark Circles & Puffiness", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Organic Botanical Actives", "Anti-Ageing Complex"],
    size: null,
  },
  {
    name: "Esse Cream Mask",
    slug: "esse-cream-mask",
    description:
      "A creamy mask built on organic rooibos, aloe vera, jojoba and coconut oils, designed to feed and hydrate the most dehydrated skin. Aloe calms and soothes irritation while kigelia extract works on firmness, and the formula can double as an overnight mask for an extra hydration boost. Natural & Organic Cosmetic certified.",
    category: "treatments",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Rooibos", "Aloe Vera", "Jojoba Oil", "Coconut Oil", "Kigelia Extract"],
    size: null,
  },
  {
    name: "Esse Cocoa Exfoliator",
    slug: "esse-cocoa-exfoliator",
    description:
      "A cocoa-scented facial scrub designed to exfoliate gently without drying or tightening skin, using granules that dissolve as they're massaged in. It's suited to sensitive skin in particular, leaving skin soft and moisturised rather than stripped, and is made from natural and organic ingredients.",
    category: "treatments",
    concern: ["Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Cocoa", "Natural Exfoliating Granules"],
    size: null,
  },
  {
    name: "Esse Dry Skin Trial/Travel Set",
    slug: "esse-dry-skin-trial-travel-set",
    description:
      "A travel-sized routine built for dry skin: a non-foaming cream cleanser, a probiotic Biome Mist with inactive Lactobacilli and prebiotics, a probiotic-enriched Rich Moisturiser, and a vitamin-E-rich Repair Oil. It's designed to be introduced gradually — cleanser, oil and moisturiser first, with the Biome Mist layered in from week three — so skin's microbiome and barrier function can adjust before the full routine is in play.",
    category: "face",
    concern: ["Dry & Dehydrated"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Probiotics", "Prebiotics", "Vitamin E"],
    size: "50ml + 30ml + 20ml + 12ml",
  },
  {
    name: "Esse Omega Deep Moisturisers (Normal/Combination Skin)",
    slug: "esse-omega-deep-moisturisers-normal-combination-skin",
    description:
      "An omega-rich moisturiser and makeup base built on marula oil, omega 3, 6 and 9 fatty acids, chamomile extract and hyaluronic acid. It's designed to feed and calm skin cells, with chamomile's hypoallergenic, soothing properties suited to irritation-prone skin and hyaluronic acid helping other actives absorb more effectively. ECOCERT natural and organic cosmetic certified.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Marula Oil", "Omega 3, 6, 9", "Chamomile Extract", "Hyaluronic Acid"],
    size: null,
  },
  {
    name: "Esse Cream Cleanser (Normal/Combination Skin)",
    slug: "esse-cream-cleanser-normal-combination-skin",
    description:
      "A light cream cleanser built on jojoba and baobab oil, designed to refine and restore mature or combination skin without stripping it, and gentle enough to remove eye makeup too. It's suited to dry, sensitive and ageing skin, as well as normal and combination types.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Jojoba Oil", "Baobab Oil"],
    size: null,
  },
  {
    name: "Esse Hand Cream",
    slug: "esse-hand-cream",
    description:
      "A lightweight hand lotion built on marula, rooibos and jojoba, made with 90% organically farmed ingredients and designed to nourish hardworking hands without a greasy residue. Rooibos protects and rejuvenates, jojoba softens and moisturises, marula hydrates and repairs, and kigelia works on the visible signs of ageing.",
    category: "body",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Marula Seed Oil", "Rooibos Leaf Extract", "Jojoba Seed Oil", "Kigelia Fruit Extract"],
    size: null,
  },
];
