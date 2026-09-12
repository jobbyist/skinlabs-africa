/**
 * Editorial descriptions and structured tags for the Lelive (21) and
 * Standard Beauty (20) entries in `src/data/marketplace/ftn-catalog.ts`.
 *
 * Descriptions are rewritten in SkinLabs' editorial voice from that file's
 * `rawDescription`/`howToUse` seed copy — never copy-pasted — and every
 * factual claim here is traceable back to that source text. `concern`,
 * `values` and `skinToneClaims` are drawn only from their fixed taxonomies
 * and only when the source text genuinely supports the tag (see the header
 * comment in ftn-catalog.ts for how this feeds
 * scripts/seed-openhaus-marketplace.ts).
 *
 * `name` is the join key back to `ftnCatalog` and must match character for
 * character. SKOON and Esse entries are handled by a separate tags file —
 * do not add them here.
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

export const lelivStandardBeautyTags: OpenHausProductTags[] = [
  // ---------------- Lelive (21) ----------------
  {
    name: "Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin",
    slug: "lelive-nourishing-3-step-routine-revitalise-plump-restore",
    description:
      "A three-step routine for normal-to-dry and dehydrated skin, built around a gentle jelly cleanser, the African Gold peptide-and-bakuchiol oil elixir, and the Du-Pont shea butter moisturiser. Together the trio is designed to unclog pores without disturbing the skin's pH, soften the look of fine lines and dark spots, and support the skin's own collagen production. Best suited to mature or moisture-starved skin that needs consistent nourishment rather than a quick fix.",
    category: "face",
    concern: ["Dry & Dehydrated", "Hyperpigmentation", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Hyaluronic Acid", "Niacinamide", "Bakuchiol", "Peptides", "Shea Butter"],
    size: null,
  },
  {
    name: "Lelive Own The Glow: Mini Icons",
    slug: "lelive-own-the-glow-mini-icons",
    description:
      "A seven-piece, travel-sized edit of Lelive's best-selling face and body products, covering cleansing, brightening, hydrating and sun protection in one set. Every formula is made in South Africa by a woman-owned brand, is safe to use during pregnancy, and is free from SLS/SLES, parabens, phthalates, silicones and synthetic fragrance. A practical way to try the range, or to keep a full routine on hand while travelling.",
    category: "face",
    concern: ["Hyperpigmentation", "Dry & Dehydrated"],
    values: ["Pregnancy-Safe", "SA Woman-Owned", "Fragrance-Free", "Cruelty-Free"],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Niacinamide", "Hyaluronic Acid", "Zinc Oxide", "Lactic Acid"],
    size: null,
  },
  {
    name: "Lelive. The Glow Kit: Mini Edition",
    slug: "lelive-the-glow-kit-mini-edition",
    description:
      "Five travel-sized essentials — cleanser, serum, moisturiser, tinted SPF and setting mist — covering a full daily routine for any skin type. The set is built to cleanse without stripping, keep pores clear, soften dark spots and fine lines, and support skin elasticity over time. Reef-safe, dermatologist-approved and free of sulphates and parabens, it's a low-commitment way to sample Lelive's core routine.",
    category: "face",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing", "Dry & Dehydrated"],
    values: ["Reef-Safe", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Hyaluronic Acid", "Niacinamide", "Zinc Oxide", "Turmeric"],
    size: null,
  },
  {
    name: "Lelive. Clean Slate | Cleanse + Renew Body Wash",
    slug: "lelive-clean-slate-cleanse-renew-body-wash",
    description:
      "A non-stripping body wash built around lactic acid, living stones, willow leaf extract and Cape aloe, which exfoliate and hydrate while helping to clear excess oil from pores. Suitable for all skin types and made locally without sulphates, parabens, phthalates or synthetic fragrance. It's sulphate-free, so it takes a little longer to work up a lather than a foaming wash — that's expected, not a fault.",
    category: "body",
    concern: ["Acne & Breakouts", "Dry & Dehydrated"],
    values: ["Vegan", "Cruelty-Free", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Lactic Acid", "Willow Leaf Extract", "Cape Aloe"],
    size: null,
  },
  {
    name: "Lelive. African Butter | Hydrate + Firm Body Cream",
    slug: "lelive-african-butter-hydrate-firm-body-cream",
    description:
      "A firming body cream formulated with niacinamide, hyaluronic acid, shea butter and baobab to hydrate, plump and brighten skin while supporting its natural strength. It spreads easily and settles into a non-greasy, glowing finish rather than sitting heavy on the skin. Made by a South African, woman-owned brand and free from petroleum derivatives, SLS/SLES and parabens.",
    category: "body",
    concern: ["Fine Lines & Ageing", "Hyperpigmentation", "Dry & Dehydrated"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Hyaluronic Acid", "Shea Butter", "Baobab"],
    size: null,
  },
  {
    name: "Lelive. Seatox Marine Algae & Aloe Detoxifying Mask",
    slug: "lelive-seatox-marine-algae-aloe-detoxifying-mask",
    description:
      "A plant-based detox mask combining algae, sea spaghetti and aloe to soothe and hydrate with kaolin, bentonite and charcoal to draw out impurities. It's aimed at inflamed, acne-prone skin, working as a deep clean that avoids stripping the skin's natural oils. Dermatologist-approved and made by a South African, woman-owned brand that donates 2% of sales to a water project.",
    category: "treatments",
    concern: ["Acne & Breakouts", "Sensitive Skin", "Dry & Dehydrated"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Marine Algae", "Aloe", "Kaolin Clay", "Charcoal"],
    size: null,
  },
  {
    name: "Lelive. Crème De La Cream African Mahogany Everyday Moisturiser",
    slug: "lelive-creme-de-la-cream-african-mahogany-everyday-moisturiser",
    description:
      "An everyday moisturiser built around African mahogany and peptides to support skin's firmness, alongside marula and baobab for deep moisture and rosehip and vitamin E for general anti-ageing care. The texture is light rather than oily, which is why Lelive also recommends it for oily, acne-prone or combination skin, not just dry types. Dermatologist-approved and made by a South African, woman-owned brand.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated", "Acne & Breakouts"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Peptides", "Marula Oil", "Rosehip Oil", "Vitamin E"],
    size: null,
  },
  {
    name: "Lelive. All Glow'd Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum",
    slug: "lelive-all-glowd-up-vitamin-c-turmeric-hyaluronic-acid-brightening-serum",
    description:
      "A brightening serum pairing vitamin C and hyaluronic acid to soften the look of fine lines with turmeric and liquorice to target dark spots and uneven tone. Bakuchiol and aloe add an anti-inflammatory, hydrating base, making it gentle enough for mild-to-moderate acne-prone skin as well as brightening-focused routines. Free from sulphates, parabens, synthetic fragrance and dye, and made by a South African, woman-owned brand.",
    category: "face",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing", "Acne & Breakouts"],
    values: ["Fragrance-Free", "SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Turmeric", "Hyaluronic Acid", "Bakuchiol", "Liquorice"],
    size: null,
  },
  {
    name: "Lelive. Rooibos & Aloe Jelly Splash Cleanser",
    slug: "lelive-rooibos-aloe-jelly-splash-cleanser",
    description:
      "A gentle plant-based cleanser that respects skin's natural pH, using aloe, green rooibos and rose water to soothe alongside salicylic acid, niacinamide and lactic acid to keep pores clear. Hyaluronic acid and shea butter are added to hydrate, so it cleanses without leaving skin stripped. Suitable for most skin types, and free from sulphates and parabens.",
    category: "face",
    concern: ["Acne & Breakouts", "Dry & Dehydrated", "Sensitive Skin"],
    values: ["Vegan"],
    skinToneClaims: [],
    keyActives: ["Salicylic Acid", "Niacinamide", "Lactic Acid", "Hyaluronic Acid"],
    size: null,
  },
  {
    name: "Lelive. Body Glow Up: Mini Edition",
    slug: "lelive-body-glow-up-mini-edition",
    description:
      "A four-piece mini body set covering exfoliation (AHA/PHA with jojoba beads and green rooibos), cleansing (lactic acid, living stones, willow and Cape aloe), moisture (niacinamide, hyaluronic acid, shea and baobab) and a brightening oil (vitamin C, bakuchiol, moringa and avocado). Together the set is designed to soften, clear, hydrate, firm and brighten in one routine. Made by a South African, woman-owned brand and suitable for all skin types.",
    category: "body",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing", "Hyperpigmentation"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["AHA/PHA", "Niacinamide", "Hyaluronic Acid", "Vitamin C", "Bakuchiol"],
    size: null,
  },
  {
    name: "Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types",
    slug: "lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types",
    description:
      "Pairs the All Glow'd Up brightening serum — vitamin C, hyaluronic acid, turmeric and liquorice — for daytime use with the Save Our Skin exfoliating serum for night-time oil control and texture refinement. Used together, the duo is designed to brighten, clarify and smooth skin without doubling up on exfoliation and hydration on the same night. Suited to all skin types looking for a simple AM/PM active routine.",
    category: "face",
    concern: ["Hyperpigmentation", "Acne & Breakouts", "Fine Lines & Ageing"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Bakuchiol", "Hyaluronic Acid", "Turmeric", "Willow Bark"],
    size: null,
  },
  {
    name: "Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser",
    slug: "lelive-cleaner-colada-coconut-pineapple-african-oil-cleanser",
    description:
      "An oil cleanser built on Kalahari melon, marula and mongongo oils with pineapple enzyme, coconut oil and squalane, designed to lift sebum, makeup and sunscreen while gently exfoliating and hydrating. It emulsifies into a light milk with water, and doubles as a shaving oil. Dermatologist-approved and made by a South African, woman-owned brand.",
    category: "face",
    concern: ["Acne & Breakouts", "Dry & Dehydrated"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Pineapple Enzyme", "Coconut Oil", "Squalane", "Marula Oil"],
    size: null,
  },
  {
    name: "Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types",
    slug: "lelive-bestselling-3-step-routine-brighten-clarify-glow",
    description:
      "Full-size versions of the Jelly Splash cleanser, All Glow'd Up serum and Créme de la Cream moisturiser, packaged with a gold key roller tube. The routine is built to cleanse without stripping, keep pores clear, and fade dark spots and fine lines while supporting skin elasticity and collagen. Dermatologist-approved and made by a South African, woman-owned brand for a wide range of skin types.",
    category: "face",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing", "Acne & Breakouts"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Salicylic Acid", "Vitamin C", "Niacinamide", "Peptides"],
    size: null,
  },
  {
    name: "Lelive. Good to Glow | Smooth + Renew Body Exfoliator",
    slug: "lelive-good-to-glow-smooth-renew-body-exfoliator",
    description:
      "A hybrid chemical-and-physical body exfoliator combining AHAs and PHAs with biodegradable jojoba beads and green rooibos to lift dead skin cells. It's designed to brighten, clear congestion and soften skin texture without relying on harsh physical scrubbing alone. Made by a South African, woman-owned brand, suitable for all skin types.",
    category: "body",
    concern: ["Hyperpigmentation", "Acne & Breakouts"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["AHA", "PHA", "Jojoba Beads", "Green Rooibos"],
    size: null,
  },
  {
    name: "Lelive. Oil La La | Brighten + Glow Body Oil",
    slug: "lelive-oil-la-la-brighten-glow-body-oil",
    description:
      "A lightweight, non-greasy body oil built around vitamin C, living stones, bakuchiol, moringa and avocado, aimed at softening skin and evening out tone by targeting dark spots. It absorbs quickly rather than sitting on the skin, and Lelive recommends following with a body cream to lock in the result. Made by a South African, woman-owned brand, suitable for all skin types.",
    category: "body",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing", "Acne & Breakouts"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Bakuchiol", "Moringa Oil", "Avocado Oil"],
    size: null,
  },
  {
    name: "Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir",
    slug: "lelive-african-gold-peptide-bakuchiol-african-oil-elixir",
    description:
      "An oil elixir combining baobab and rosehip oils with bakuchiol — a gentler, pregnancy-safe alternative to retinol — and peptides to support collagen production. Positioned as a restorative, replenishing treatment rather than a targeted spot fix, it's dermatologist-approved and formulated to suit most skin types, including oily skin when mixed sparingly into a night moisturiser. Vegan and free from sulphates, parabens, synthetic fragrance and dye.",
    category: "face",
    concern: ["Fine Lines & Ageing", "Dry & Dehydrated"],
    values: ["Pregnancy-Safe", "Vegan", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Bakuchiol", "Peptides", "Baobab Oil", "Rosehip Oil"],
    size: null,
  },
  {
    name: "Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream",
    slug: "lelive-eye-conic-peptide-coffee-arabica-eye-cream",
    description:
      "An eye cream pairing peptides and African mahogany to support collagen with vitamin C and niacinamide to brighten and smooth the appearance of fine lines around the eyes. It's designed to re-energise puffiness and dullness in the eye area specifically, applied after serum and before moisturiser. Vegan, unisex, and free from sulphates, parabens, synthetic fragrance and dye.",
    category: "face",
    concern: ["Dark Circles & Puffiness", "Fine Lines & Ageing", "Hyperpigmentation"],
    values: ["Vegan", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Peptides", "Coffee Arabica", "Vitamin C", "Niacinamide"],
    size: null,
  },
  {
    name: "Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite",
    slug: "lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite",
    description:
      "A hydrating setting mist built on deep sea biotics, rose water and cucumber to soothe and add moisture, with African malachite and niacinamide providing antioxidant and anti-inflammatory support. It's positioned to protect against environmental stress, refine texture and set makeup, and is gentle enough for sensitive skin. Made by a South African, woman-owned brand that donates 2% of sales to a water project.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Rose Water", "Cucumber Extract", "African Malachite"],
    size: null,
  },
  {
    name: "Lelive. The Du-Pont Shea Butter Lush Moisturiser",
    slug: "lelive-the-du-pont-shea-butter-lush-moisturiser",
    description:
      "A nourishing moisturiser for dry, dull or dehydrated skin, combining shea butter, squalane, hyaluronic acid, niacinamide and turmeric to restore moisture and support skin's natural renewal. It's rich enough to double as an overnight mask or a makeup primer, and Lelive positions it for dry and maturing skin in particular. Made by a South African, woman-owned brand, free from sulphates and parabens.",
    category: "face",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Shea Butter", "Squalane", "Hyaluronic Acid", "Niacinamide"],
    size: null,
  },
  {
    name: "Lelive. All the Shade Marula Tinted Spf 30 Moisturiser",
    slug: "lelive-all-the-shade-marula-tinted-spf-30-moisturiser",
    description:
      "A reef-safe, mineral SPF 30 tinted moisturiser using zinc oxide for broad-spectrum UVA/UVB cover, vitamin E for antioxidant support, and marula oil to nourish skin underneath. Lelive designed it to blend into all skin tones without leaving a white cast once fully absorbed. Made by a South African, woman-owned brand, free from sulphates and parabens.",
    category: "sun-care",
    concern: [],
    values: ["Reef-Safe", "SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: ["All Skin Tones"],
    keyActives: ["Zinc Oxide", "Vitamin E", "Marula Oil"],
    size: null,
  },
  {
    name: "Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator",
    slug: "lelive-save-our-skin-peach-aloe-aha-bha-exfoliator",
    description:
      "An AHA/BHA exfoliator built on plant-derived peach, aloe and willow bark, aimed at mild-to-moderate acne-prone skin that scars easily. It's designed to clear congestion and enhance glow while still moisturising, and can also be used as a targeted spot treatment. Made by a South African, woman-owned brand, dermatologist-approved for a range of skin types.",
    category: "treatments",
    concern: ["Acne & Breakouts", "Dry & Dehydrated"],
    values: ["SA Woman-Owned", "Cruelty-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Willow Bark", "Peach Extract", "Aloe"],
    size: null,
  },

  // ---------------- Standard Beauty (20) ----------------
  {
    name: "Standard Beauty Salicylic Acid Face Wash",
    slug: "standard-beauty-salicylic-acid-face-wash",
    description:
      "A light-foaming, non-drying cleanser built around salicylic acid for acne-prone and oily skin, formulated to help clear pores, reduce sebum and minimise blackheads and breakouts. Standard Beauty recommends leaving it on the skin for around three minutes to give the salicylic acid time to work, then following with SPF. Safe to use during pregnancy and breastfeeding, and vegan.",
    category: "face",
    concern: ["Acne & Breakouts"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Salicylic Acid"],
    size: "125ml",
  },
  {
    name: "Standard Beauty 2% Alpha Arbutin Serum",
    slug: "standard-beauty-2-alpha-arbutin-serum",
    description:
      "A serum combining 2% alpha arbutin with hyaluronic acid and niacinamide, aimed at pigmentation, sun spots and textured, uneven skin. It's designed to brighten hyperpigmentation and fade the look of acne scars while hydrating and plumping skin. Free from artificial fragrance and vegan — but not recommended during pregnancy or breastfeeding, and best paired with daily SPF.",
    category: "face",
    concern: ["Hyperpigmentation", "Dry & Dehydrated"],
    values: ["Vegan", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Alpha Arbutin", "Hyaluronic Acid", "Niacinamide"],
    size: "30ml",
  },
  {
    name: "Standard Beauty African Black Soap",
    slug: "standard-beauty-african-black-soap",
    description:
      "A 100% natural black soap made by a fair-trade women's cooperative in Ghana, formulated to purify skin without stripping its natural oils. It's positioned for acne, pigmentation, oily skin, psoriasis, dry skin and rashes, working to balance oiliness while brightening dark spots and acne scars. Safe during pregnancy and breastfeeding, and free from GMOs and artificial fragrance.",
    category: "face",
    concern: ["Acne & Breakouts", "Hyperpigmentation", "Dry & Dehydrated"],
    values: ["Pregnancy-Safe", "Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["African Black Soap"],
    size: null,
  },
  {
    name: "Standard Beauty Renew Your Dew Ceramide Butter",
    slug: "standard-beauty-renew-your-dew-ceramide-butter",
    description:
      "A ceramide-based moisturiser built with rosehip oil, cocoa and shea butters for dry, sensitive or compromised skin barriers. It's designed to deliver deep hydration and a protective layer against moisture loss and environmental stress, with anti-ageing support to encourage skin renewal. Dermatologically and clinically tested for low irritancy, safe during pregnancy and breastfeeding, and vegan.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin", "Fine Lines & Ageing"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Ceramides", "Rosehip Oil", "Cocoa Butter", "Shea Butter"],
    size: "50ml",
  },
  {
    name: "Standard Beauty Moisture Bomb",
    slug: "standard-beauty-moisture-bomb",
    description:
      "A lightweight, fast-absorbing moisturiser for normal, combination and oily skin, built on rose water, squalane and cucumber extract. Its antibacterial and anti-inflammatory properties are aimed at softening texture and calming redness, inflammation and puffiness, leaving a silky rather than heavy finish. Clinically tested for low irritancy, fragrance-free, and safe during pregnancy and breastfeeding.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin", "Dark Circles & Puffiness"],
    values: ["Pregnancy-Safe", "Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Rose Water", "Squalane", "Cucumber Extract"],
    size: "50ml",
  },
  {
    name: "Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid",
    slug: "standard-beauty-mattifying-gel-moisturiser-azelaic-acid",
    description:
      "An azelaic acid gel moisturiser aimed at rosacea, oily, acne and breakout-prone skin, using the ingredient's antimicrobial and anti-inflammatory properties to help clear acne-causing bacteria and calm redness. It's also formulated to encourage cell turnover and help prevent scarring and pigmentation from previous breakouts. Fragrance-free, safe during pregnancy and breastfeeding — but shouldn't be combined with retinol, vitamin C, AHAs or BHAs.",
    category: "face",
    concern: ["Acne & Breakouts", "Sensitive Skin", "Hyperpigmentation"],
    values: ["Pregnancy-Safe", "Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Azelaic Acid"],
    size: "50ml",
  },
  {
    name: "Standard Beauty 2% Salicylic Acid Toner",
    slug: "standard-beauty-2-salicylic-acid-toner",
    description:
      "A 2% salicylic acid toner for breakout-prone and oily skin, formulated to exfoliate the skin's surface, clear clogged pores and reduce sebum production. Niacinamide is added to help break down existing pimples, whiteheads and blackheads. Safe during pregnancy and breastfeeding, and vegan — but shouldn't be layered with other AHAs, BHAs, retinol or vitamin C.",
    category: "face",
    concern: ["Acne & Breakouts"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Salicylic Acid", "Niacinamide"],
    size: "125ml",
  },
  {
    name: "Standard Beauty 5% Lactic Acid Toner",
    slug: "standard-beauty-5-lactic-acid-toner",
    description:
      "A 5% lactic acid toner aimed at hyperpigmentation and uneven skin tone, designed to gently exfoliate, unclog pores and even out complexion while fading dark marks and discolouration. It's also positioned to support collagen and soften the look of fine lines and wrinkles over time. Safe during pregnancy and breastfeeding, and vegan — best used two to three times a week rather than daily.",
    category: "face",
    concern: ["Hyperpigmentation", "Fine Lines & Ageing"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Lactic Acid"],
    size: "125ml",
  },
  {
    name: "Standard Beauty Vitamin C Serum in Polyglutamic Acid",
    slug: "standard-beauty-vitamin-c-serum-polyglutamic-acid",
    description:
      "A water-based serum pairing two stable forms of vitamin C with a polyglutamic acid base, formulated for dry, dehydrated and pigmented skin. It's designed to brighten dark spots, even out tone and target the look of fine lines and wrinkles, with Standard Beauty citing potential improvement in sun damage and age spots. Fragrance-free, vegan, and safe during pregnancy and breastfeeding.",
    category: "face",
    concern: ["Dry & Dehydrated", "Hyperpigmentation", "Fine Lines & Ageing"],
    values: ["Pregnancy-Safe", "Vegan", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Vitamin C", "Polyglutamic Acid"],
    size: "30ml",
  },
  {
    name: "Standard Beauty Oat-So-Clean Cleansing Balm",
    slug: "standard-beauty-oat-so-clean-cleansing-balm",
    description:
      "A nourishing cleansing balm built on natural oils, formulated for double-cleansing on dry and sensitive skin. It's designed to lift makeup, impurities and excess sebum while protecting and strengthening the skin's lipid barrier rather than stripping it. Dermatologically and clinically tested for low irritancy, fragrance-free, vegan and safe during pregnancy and breastfeeding.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin"],
    values: ["Pregnancy-Safe", "Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Natural Oils"],
    size: "100ml",
  },
  {
    name: "Standard Beauty Rosehip Serum",
    slug: "standard-beauty-rosehip-serum",
    description:
      "An organic, cold-pressed rosehip oil serum rich in antioxidants and vitamins A and C, formulated for dry, acne-prone and mature skin. It's aimed at rejuvenating and hydrating skin while supporting collagen and elasticity, and softening the look of wrinkles, acne scars and dark spots over time. Non-comedogenic, vegan, and safe during pregnancy and breastfeeding.",
    category: "face",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing", "Acne & Breakouts"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Rosehip Oil", "Vitamin A", "Vitamin C"],
    size: "30ml",
  },
  {
    name: "Standard Beauty SOS Scalp Spray with Anti Itch Active",
    slug: "standard-beauty-sos-scalp-spray-anti-itch-active",
    description:
      "A leave-in scalp spray built around an anti-itch active for instant relief from an itchy or dry scalp, formulated to calm redness and sensitivity while balancing the scalp's microbiome. It's also designed to enhance circulation and support hair growth while reducing dandruff and excess sebum. Suitable for all hair types, including 1–4C, braided and unbraided styles.",
    category: "hair-scalp",
    concern: ["Dandruff & Scalp"],
    values: [],
    skinToneClaims: [],
    keyActives: ["Anti-Itch Active"],
    size: "100ml",
  },
  {
    name: "Standard Beauty Hot Oil Hair Therapy",
    slug: "standard-beauty-hot-oil-hair-therapy",
    description:
      "A hot oil treatment blending rosemary, argan and castor oils with nettle herbs, formulated for dry and damaged hair. It's designed to tame frizz, deeply moisturise and strengthen strands, and to support new growth after hair loss or thinning when massaged into the scalp. Free from artificial fragrance and colour, and vegan.",
    category: "hair-scalp",
    concern: ["Dry & Dehydrated", "Dandruff & Scalp"],
    values: ["Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Rosemary Oil", "Argan Oil", "Castor Oil", "Nettle Extract"],
    size: "100ml",
  },
  {
    name: "Standard Beauty Silicone Applicator Brush",
    slug: "standard-beauty-silicone-applicator-brush",
    description:
      "A mask applicator with a wooden handle and silicone tip, designed for hygienic, even and controlled application of masks and moisturisers. It reduces product waste and mess compared with applying by hand, and is easy to clean, dry and store between uses. Safe during pregnancy and breastfeeding, and vegan.",
    category: "tools",
    concern: [],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: [],
    size: null,
  },
  {
    name: "Standard Beauty Pigmentation Buster Mask",
    slug: "standard-beauty-pigmentation-buster-mask",
    description:
      "A chemical exfoliating mask combining five plant extracts — blueberry, sugarcane, orange, lemon and sugar maple — with four AHAs (lactic, glycolic, citric and tartaric) and alpha arbutin. It's formulated to brighten dark spots, address sun damage and acne scarring, and soothe irritation and redness while moisturising. Vegan and fragrance-free; Standard Beauty recommends no more than 10 minutes' contact time, two to three times a week.",
    category: "treatments",
    concern: ["Hyperpigmentation", "Sensitive Skin", "Dry & Dehydrated"],
    values: ["Vegan", "Fragrance-Free"],
    skinToneClaims: [],
    keyActives: ["Alpha Arbutin", "Glycolic Acid", "Lactic Acid", "AHA Complex"],
    size: null,
  },
  {
    name: "Standard Beauty Mild Face Wash",
    slug: "standard-beauty-mild-face-wash",
    description:
      "A mild face wash built on natural rose, cucumber and chamomile extracts for sensitive or dry skin, formulated to cleanse and hydrate without irritating or stripping the skin's natural oils. Dermatologically and clinically tested for low irritancy, it's safe during pregnancy and breastfeeding, and vegan.",
    category: "face",
    concern: ["Sensitive Skin", "Dry & Dehydrated"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Rose Extract", "Cucumber Extract", "Chamomile Extract"],
    size: "125ml",
  },
  {
    name: "Standard Beauty Aloe & Cucumber Toner for Sensitive Skin",
    slug: "standard-beauty-aloe-cucumber-toner-sensitive-skin",
    description:
      "A niacinamide toner built on cucumber and aloe for dry and sensitive skin, formulated to soothe inflammation while softening and strengthening the skin barrier. Niacinamide is also positioned to firm, even out tone and brighten pigmentation over time. Dermatologically and clinically tested for low irritancy, safe during pregnancy and breastfeeding, and vegan.",
    category: "face",
    concern: ["Sensitive Skin", "Dry & Dehydrated", "Hyperpigmentation"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Aloe", "Cucumber Extract"],
    size: "125ml",
  },
  {
    name: "Standard Beauty 10% Niacinamide Serum & 1% Zinc",
    slug: "standard-beauty-10-niacinamide-serum-1-zinc",
    description:
      "A 10% niacinamide serum with 1% zinc, formulated for inflamed, uneven and textured skin. It's aimed at treating hyperpigmentation and maintaining elasticity while soothing acne, rosacea and other inflammatory conditions, and refining the appearance of pores. Safe during pregnancy and breastfeeding, and vegan — but shouldn't be combined with vitamin C.",
    category: "face",
    concern: ["Hyperpigmentation", "Acne & Breakouts", "Sensitive Skin"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Niacinamide", "Zinc"],
    size: "30ml",
  },
  {
    name: "Standard Beauty 1,5% Hyaluronic Serum & Peptides",
    slug: "standard-beauty-1-5-hyaluronic-serum-peptides",
    description:
      "A 1.5% hyaluronic acid serum with peptides, formulated for wrinkled and dehydrated skin. It's designed to deliver intensive hydration and plumping while improving firmness and elasticity, supporting collagen and lipids, and softening the look of wrinkles and fine lines. Suitable for all skin types, safe during pregnancy and breastfeeding, and vegan.",
    category: "face",
    concern: ["Dry & Dehydrated", "Fine Lines & Ageing"],
    values: ["Pregnancy-Safe", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Hyaluronic Acid", "Peptides"],
    size: "30ml",
  },
  {
    name: "Standard Beauty Squalane Serum",
    slug: "standard-beauty-squalane-serum",
    description:
      "A 100% plant-derived squalane serum formulated for dry, sensitive and acne-prone skin, including skin prone to eczema. It's designed to lock in moisture for a dewy finish without feeling greasy or clogging pores, while helping to minimise the look of sun damage and age spots and support firmer, plumper skin over time. Fragrance-free, vegan, and safe during pregnancy and breastfeeding.",
    category: "face",
    concern: ["Dry & Dehydrated", "Sensitive Skin", "Acne & Breakouts"],
    values: ["Pregnancy-Safe", "Fragrance-Free", "Vegan"],
    skinToneClaims: [],
    keyActives: ["Squalane"],
    size: "30ml",
  },
];
