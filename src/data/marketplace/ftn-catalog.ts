/**
 * Source catalog for OpenHaus marketplace seeding — 84 real products across
 * 4 South African brands (Lelive, Standard Beauty, SKOON, Esse), transcribed
 * from a Faithful to Nature (FTN) wholesale catalog (September 2026).
 *
 * `rawDescription`/`howToUse` are FTN's own catalog copy, kept here only as
 * seed material for scripts/seed-openhaus-marketplace.ts to write a
 * rewritten, non-copy-pasted `description` from — never rendered to users
 * directly. `originalPriceZar` is FTN's current listed price (the
 * already-discounted price where the catalog showed a "was" price).
 * `sourceUrl` is the live FTN product page the pricing-sync edge function
 * re-checks going forward.
 */

export type FtnBrandSlug = "lelive" | "standard-beauty" | "skoon" | "esse";

export interface FtnCatalogProduct {
  brand: FtnBrandSlug;
  name: string;
  originalPriceZar: number;
  rawDescription: string;
  howToUse: string;
  sourceUrl: string;
}

export const ftnCatalog: FtnCatalogProduct[] = [
  // ---------------- Lelive (21) ----------------
  {
    brand: "lelive",
    name: "Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin",
    originalPriceZar: 933.0,
    rawDescription:
      "Rejuvenate your skin with Lelive's Nourishing 3-Step Routine. This luxurious set includes the Jelly Splash Brighten + Renew Jelly Cleanser, African Gold Glow + Restore Oil Elixir, and The Du-Pont Extra Nourishment Moisturiser. Designed to gently cleanse, reduce fine lines, wrinkles and dark spots, stimulate collagen production, and restore dull skin, it is the ideal set for dehydrated and mature skin. Offers deep nourishment and hydration for a healthy, radiant complexion. 3-step skincare routine to revitalise, plump & restore skin, maintains skin's pH balance, unclogs pores.",
    howToUse:
      "Step 1 Jelly Splash: morning or second cleanse evening. Step 2 African Gold: 3-4 drops morning and night after cleansing. Step 3 The Du-Pont: apply after serum, preferably at night.",
    sourceUrl:
      "https://www.faithful-to-nature.co.za/lelive-nourishing-3-step-routine-revitalise-plump-restore-normal-to-dry-skin",
  },
  {
    brand: "lelive",
    name: "Lelive Own The Glow: Mini Icons",
    originalPriceZar: 699.3,
    rawDescription:
      "Discover radiant skin from head to toe with Lelive Own The Glow: Mini Icons. A 7-piece skin care set featuring travel-friendly face and body favourites for cleansing, brightening, hydrating and protecting your skin, wrapped in artwork celebrating African creativity, with an exclusive A3 print. Contains Lelive's best-selling face & body products. Suitable for all skin types & pregnancy safe. Proudly South African & woman-owned, ethically sourced, free from SLS/SLES, parabens, phthalates, silicones, synthetic fragrance. Cruelty-free.",
    howToUse:
      "Individual directions for each mini product (cleanser, serum, moisturiser, SPF, mist, body wash, body oil).",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-own-the-glow-mini-icons",
  },
  {
    brand: "lelive",
    name: "Lelive. The Glow Kit: Mini Edition",
    originalPriceZar: 589.0,
    rawDescription:
      "Travel-friendly collection of five essential skincare products that enhance skin health and luminosity. Delivers deep hydration, nourishment, and revitalisation for a glowing complexion. Ideal for all skin types. Contains cleanser, serum, moisturizer, SPF tinted moisturizer & setting mist. Gently cleanses without stripping, maintains pH, unclogs pores, brightens, hydrates, reduces dark spots/fine lines, supports elasticity/collagen. Reef safe, dermatologist-approved, sulphate- & paraben-free, cruelty-free, vegan.",
    howToUse: "Detailed steps for each product provided on the pack.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-the-glow-kit-the-mini-edition-5-piece-set",
  },
  {
    brand: "lelive",
    name: "Lelive. Clean Slate | Cleanse + Renew Body Wash",
    originalPriceZar: 299.0,
    rawDescription:
      "Gentle, non-stripping body wash crafted with lactic acid, living stones, willow leaf extract, and Cape aloe. Exfoliates, cleanses, and hydrates. Helps reduce excess oil and clears pores. Suitable for all skin types. Locally-made, vegan-friendly, cruelty-free; free from sulphates, parabens, phthalates and synthetic fragrances.",
    howToUse: "Add a liberal amount to hands or sponge. Lather gently before rinsing. Sulphate-free, so allow extra time to lather.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-clean-slate-cleanse-renew-body-wash",
  },
  {
    brand: "lelive",
    name: "Lelive. African Butter | Hydrate + Firm Body Cream",
    originalPriceZar: 349.0,
    rawDescription:
      "Expertly crafted with niacinamide, hyaluronic acid, shea butter, and baobab. Nourishes, firms, brightens and strengthens. Hydrates and plumps, spreads easily, non-greasy glowing finish. Suitable for all skin types. South African woman-owned, ethically sourced, free from petroleum derivatives, SLS/SLES, parabens. Cruelty-free, vegan.",
    howToUse: "Apply a generous dollop and massage in circular motions.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-african-butter-hydrate-firm-body-cream",
  },
  {
    brand: "lelive",
    name: "Lelive. Seatox Marine Algae & Aloe Detoxifying Mask",
    originalPriceZar: 329.0,
    rawDescription:
      "Plant-based mask for deep cleanse without stripping natural oils. Soothes inflamed and acne-prone skin, exfoliates and restores moisture. Algae, sea spaghetti & aloe soothe & hydrate; chlorophyll, kaolin, bentonite & charcoal detox. Dermatologist-approved, all skin types, sulphate- & paraben-free, South African, woman-owned, 2% of sales to a water project, cruelty-free, vegan.",
    howToUse:
      "Apply after cleansing, avoiding the eye and lip areas. Leave for 15-20 minutes or until dry. Rinse. Use 1-2 times a week.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-seatox-aloe-detoxifying-mask-marine-algae",
  },
  {
    brand: "lelive",
    name: "Lelive. Crème De La Cream African Mahogany Everyday Moisturiser",
    originalPriceZar: 319.0,
    rawDescription:
      "Firming & renewing facial cream for day and night. A blend of botanicals that moisturise, tighten and renew. African mahogany & peptides tighten & regenerate; marula & baobab deeply moisturise; rosehip & vitamin E anti-ageing. Light, non-oily feel. Ideal for oily, acne-prone or combination skin too. Dermatologist-approved, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse: "After serum, squeeze out and rub in. Day and night. Spot-test for sensitive skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-creme-de-la-cream-everyday-moisturiser-african-mahogany",
  },
  {
    brand: "lelive",
    name: "Lelive. All Glow'd Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum",
    originalPriceZar: 319.0,
    rawDescription:
      "Vegan-friendly botanical serum that enhances natural radiant glow. A blend of vitamin C and hyaluronic acid reduces fine lines and wrinkles; turmeric and liquorice minimise dark spots and encourage an even complexion. Brightening & soothing, dermatologist-approved, multiple skin types including mild-moderate acne-prone. Supports collagen, anti-inflammatory (bakuchiol & aloe), hydrates, regenerates. Free from sulphates, parabens, synthetic fragrance & dye. Proudly South African, woman-owned, cruelty-free, vegan.",
    howToUse: "After cleansing, add 3-4 drops, tap until absorbed. Day and night.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-all-glow-d-up-ha-brightening-serum-vitamin-cturmeric",
  },
  {
    brand: "lelive",
    name: "Lelive. Rooibos & Aloe Jelly Splash Cleanser",
    originalPriceZar: 349.0,
    rawDescription:
      "Soothing plant-based cleanser that respects skin's natural balance and pH. Use morning or as a second cleanse at night. Aloe, green rooibos & rose water soothe; salicylic acid, niacinamide & lactic acid rejuvenate; hyaluronic acid & shea butter hydrate. Does not strip oils, unclogs pores, moisturises. Dermatologist-approved, multiple skin types, sulphate- & paraben-free, vegan.",
    howToUse: "Wet face, one pump on hands, add lukewarm water to remove. Morning only or second cleanse evening.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-jelly-splash-cleanser-rooibos-aloe",
  },
  {
    brand: "lelive",
    name: "Lelive. Body Glow Up: Mini Edition",
    originalPriceZar: 349.3,
    rawDescription:
      "4-piece mini body set: exfoliator (AHA/PHA, jojoba beads, green rooibos), body wash (lactic acid, living stones, willow, Cape aloe), cream (niacinamide, HA, shea, baobab), oil (vitamin C, bakuchiol, moringa, avocado). Softens, clears, hydrates, firms, brightens. Suitable for all skin types. South African woman-owned, ethically sourced, free from SLS etc., cruelty-free, vegan.",
    howToUse: "Exfoliator 2-3x/week on dry skin; body wash daily; cream massage in; oil pat and massage, follow with cream.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-body-glow-up-mini-edition-4-piece-set",
  },
  {
    brand: "lelive",
    name: "Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types",
    originalPriceZar: 401.8,
    rawDescription:
      "Duo of All Glow'd Up Brighten + Clarify Serum and Save Our Skin (SOS) Smooth + Control Exfoliating Serum. Brightens, clarifies, smooths and refines texture for day and night. Vitamin C, bakuchiol, HA, turmeric, liquorice for brightening and collagen; SOS for evening and oil control. Ideal for all skin types.",
    howToUse:
      "All Glow'd Up: 3-4 drops after cleansing morning (or night when not using SOS). SOS: 3-4 drops at night 3x/week, increase gradually. Do not use the same night.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-am-pm-serum-kit-multi-benefit-duo-all-skin-types",
  },
  {
    brand: "lelive",
    name: "Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser",
    originalPriceZar: 349.0,
    rawDescription:
      "Plant-based oil cleanser with Kalahari melon, marula, mongongo, pineapple enzyme, coconut oil and squalane. Removes sebum, dirt, makeup and sunscreen while gently exfoliating and hydrating. Transforms to a light milk with water. Doubles as a nourishing shaving oil. Dermatologist-approved, multiple skin types, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse:
      "Apply one pump on dry hands to dry face, massage, add water to emulsify. Follow with jelly splash for a double cleanse if needed. Excellent as a shaving oil.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-cleaner-colada-african-oil-cleanser-coconut-pineapple",
  },
  {
    brand: "lelive",
    name: "Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types",
    originalPriceZar: 888.0,
    rawDescription:
      "Full-sized Jelly Splash cleanser, All Glow'd Up serum, Créme de la Cream moisturiser + gold key tube roller. Brightens, clarifies and enhances natural glow. Gently cleanses without stripping, maintains pH, unclogs pores, moisturises, reduces dark spots and fine lines, supports elasticity and collagen. Dermatologist-approved, multiple skin types, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse: "Step 1: Jelly Splash. Step 2: 3-4 drops All Glow'd Up. Step 3: Créme de la Cream. Day and night.",
    sourceUrl:
      "https://www.faithful-to-nature.co.za/lelive-bestselling-3-step-routine-brighten-clarify-glow-all-skin-types",
  },
  {
    brand: "lelive",
    name: "Lelive. Good to Glow | Smooth + Renew Body Exfoliator",
    originalPriceZar: 202.3,
    rawDescription:
      "Hybrid chemical + physical body exfoliator with AHA, PHA, biodegradable jojoba beads and green rooibos. Brightens, clears and softens; gently removes dead skin cells. Suitable for all skin types. South African woman-owned, ethically sourced, free from SLS etc., cruelty-free, vegan.",
    howToUse: "Apply onto dry skin with wet hands, circular motions, rinse thoroughly. Use 2-3 times per week before body wash.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-good-to-glow-smooth-renew-body-exfoliator",
  },
  {
    brand: "lelive",
    name: "Lelive. Oil La La | Brighten + Glow Body Oil",
    originalPriceZar: 369.0,
    rawDescription:
      "Brightening & hydrating body oil with vitamin C, living stones, bakuchiol, moringa and avocado. Softens, brightens, clarifies and firms; targets dark spots for a more even tone. Non-greasy, lightweight, silky radiant glow. Suitable for all skin types. South African woman-owned, ethically sourced, free from SLS etc., cruelty-free, vegan.",
    howToUse: "Apply onto cleansed skin, pat and massage in circular motions. Use daily; follow with cream to lock in moisture.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-oil-la-la-brighten-glow-body-oil",
  },
  {
    brand: "lelive",
    name: "Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir",
    originalPriceZar: 369.0,
    rawDescription:
      "Ultra-nourishing oil elixir with sustainably-sourced African oils (baobab, rosehip), bakuchiol (a gentle, pregnancy-safe retinol alternative) and peptides that stimulate collagen. Re-energises, restores and rejuvenates. Full of skin-replenishing fatty acids. Dermatologist-approved, most skin types, unisex, pregnancy-safe, vegan, GMO-free, free of sulphates, parabens, synthetic fragrances & dye.",
    howToUse:
      "Add 3-4 drops morning and night after cleansing, before moisturiser. Oily skin: 1-2 drops mixed into moisturiser at night.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-african-gold",
  },
  {
    brand: "lelive",
    name: "Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream",
    originalPriceZar: 349.0,
    rawDescription:
      "Gentle peptide and coffee arabica complex that depuffs and re-energises the eye area. Peptides and African mahogany stimulate collagen; vitamin C and niacinamide brighten and smooth fine lines. Dermatologist-approved, most skin types, unisex, vegan, GMO-free, free of sulphates, parabens, synthetic fragrances & dye.",
    howToUse: "After cleansing morning and evening, gently dot around the eye area and wait for it to sink in. Follow with moisturiser.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-eye-conic",
  },
  {
    brand: "lelive",
    name: "Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite",
    originalPriceZar: 319.0,
    rawDescription:
      "Ultimate mist that protects with antioxidants, smoothes texture, boosts hydration and sets makeup. Deep sea biotics from sustainably-sourced algae help recharge skin energy; rose water and cucumber soothe and hydrate; African malachite and niacinamide provide antioxidant protection and anti-inflammation. Suitable for all skin types including sensitive, day & night. Dermatologist-approved, sulphate- & paraben-free, South African, woman-owned, 2% sales to a water project, cruelty-free, vegan.",
    howToUse: "Close eyes and mist 30cm from skin before or after makeup. Can help set makeup. Spot-test for sensitive skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-the-drip-hydrating-mist-deep-sea-biotics-african-malachite",
  },
  {
    brand: "lelive",
    name: "Lelive. The Du-Pont Shea Butter Lush Moisturiser",
    originalPriceZar: 319.0,
    rawDescription:
      "Nourishing botanical blend that moisturises, hydrates and renews. Ideal for dry, dull, dehydrated skin. Shea butter, squalane, hyaluronic acid, niacinamide and turmeric restore and invigorate. Soft, natural glow. Can be used as a primer or overnight mask. Ideal for dry and maturing skin. Dermatologist-approved, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse: "After serum, squeeze out and rub in. Best results applying liberally at night. Day and night. Spot-test for sensitive skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-the-du-pont-lush-moisturiser-shea-butter",
  },
  {
    brand: "lelive",
    name: "Lelive. All the Shade Marula Tinted Spf 30 Moisturiser",
    originalPriceZar: 349.0,
    rawDescription:
      "Reef-safe SPF 30 facial cream with natural minerals and plant-based ingredients. Zinc oxide for broad-spectrum UVA/UVB protection; vitamin E against free-radical damage; marula oil (omega fatty acids and amino acids) nurtures and protects. Perfect for all skin tones, no white residue when fully absorbed. Dermatologist-approved, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse: "After serum, squeeze a liberal amount, rub in until fully absorbed. For very dry skin, use crème de la cream or Du-Pont first.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-all-the-shade-tinted-spf-30-moisturiser-marula",
  },
  {
    brand: "lelive",
    name: "Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator",
    originalPriceZar: 319.0,
    rawDescription:
      "Vegan-friendly restorative exfoliator with plant-derived peach, aloe and willow bark. Clears skin and enhances natural glow. Moisturises, doubles as a spot treatment. Ideal for mild to moderate acne-prone skin that scars easily. Dermatologist-approved, multiple skin types, sulphate- & paraben-free, South African, woman-owned, cruelty-free, vegan.",
    howToUse:
      "Add 3-4 drops after cleanser at night, 2 times a week then increase. Can be used as a spot treatment. Expect results in 4-6 weeks. Spot-test for sensitive skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/lelive-save-our-skin-aha-bha-exfoliator-peach-aloe",
  },

  // ---------------- Standard Beauty (20) ----------------
  {
    brand: "standard-beauty",
    name: "Standard Beauty Salicylic Acid Face Wash",
    originalPriceZar: 145.0,
    rawDescription:
      "Non-drying, light-foaming cleanser for acne-prone & oily skin. Helps remove makeup and dirt, penetrate and clear pores, reduce sebum production, minimise blackheads and breakouts, break down pimples and comedones. Salon-grade, pregnancy & breastfeeding safe, vegan.",
    howToUse: "Gently massage in circular motions. Can leave on for 3 minutes for the salicylic acid to work. Use with SPF.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-salicylic-acid-face-wash-125-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty 2% Alpha Arbutin Serum",
    originalPriceZar: 185.0,
    rawDescription:
      "Powerful yet gentle serum with 2% alpha arbutin, hyaluronic acid and niacinamide. Targets pigmentation, textured skin and sun spots; diminishes acne scars; brightens hyperpigmentation; hydrates, soothes and plumps; reduces uneven tone. Free from artificial fragrance, vegan. Not for pregnancy/breastfeeding. Use with SPF.",
    howToUse: "Patch test. Apply AM and/or PM after washing & toning. Massage in a few drops, follow with moisturiser, oil serum and SPF.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-2-alpha-arbutin-serum-30-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty African Black Soap",
    originalPriceZar: 125.0,
    rawDescription:
      "100% natural African black soap from a fair-trade female village in Ghana. Treats acne, pigmentation, oily skin, psoriasis, dry skin and rashes. Purifies without stripping natural oils, balances oiliness, brightens dark spots, hyperpigmentation and acne scars. Pregnancy & breastfeeding safe, free from GMOs & artificial fragrances, vegan.",
    howToUse:
      "First-time users: every second day. After 3 weeks' tolerance, 1-2x daily. Do not combine with AHAs/BHAs in the first week. Store dry, cool, away from sunlight.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-african-black-soap",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Renew Your Dew Ceramide Butter",
    originalPriceZar: 265.0,
    rawDescription:
      "Facial moisturiser with ceramides, rosehip oil, cocoa and shea butter for dry, sensitive and compromised skin barriers. Deep hydration, protective layer against moisture loss and environmental aggressors, anti-ageing, encourages renewal. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, all skin types, vegan.",
    howToUse: "Patch test. Apply AM and/or PM after cleansing and toning. Massage in, follow with an oil-based serum.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-ceramide-butter-renew-your-dew-50-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Moisture Bomb",
    originalPriceZar: 195.0,
    rawDescription:
      "Lightweight, fast-absorbing moisturiser with rose water, squalane and cucumber extract. Ideal for normal, combination and oily skin. Adds moisture, softens texture, soothes redness/inflammation/puffiness with antibacterial and anti-inflammatory properties. Silky finish. Clinically tested for low-irritancy, pregnancy & breastfeeding safe, fragrance-free, vegan.",
    howToUse:
      "Patch test. Use AM and/or PM after cleansing, toning and a water-based serum. Massage in, follow with an oil-based serum and sunscreen.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-moisture-bomb-50-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid",
    originalPriceZar: 195.0,
    rawDescription:
      "Ideal for rosacea, oily, acne and breakout-prone skin. Antimicrobial and anti-inflammatory properties help clear acne-causing bacteria, prevent breakouts, reduce inflammation and redness, encourage cell turnover, minimise scarring and prevent pigmentation. Clinically tested for low-irritancy, pregnancy & breastfeeding safe, fragrance-free, vegan. Do not combine with Retinol, Vitamin C, AHAs, BHAs.",
    howToUse:
      "Patch test. Use AM and/or PM after cleansing, toning and a water-based serum. Massage in, follow with an oil-based serum and sunscreen. Not for hyper-sensitive skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-mattifying-gel-moisturiser-with-azelaic-acid-50-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty 2% Salicylic Acid Toner",
    originalPriceZar: 135.0,
    rawDescription:
      "Ideal for breakout-prone and oily skin. 2% salicylic acid exfoliates the top layer, clears clogged pores, reduces sebum production. Enriched with niacinamide to break down pimples, whiteheads and blackheads. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, vegan. Do not combine with AHAs, other BHAs, Retinol or Vitamin C.",
    howToUse:
      "Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub over skin. Follow with normal routine and SPF.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-2-salicylic-acid-toner-125-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty 5% Lactic Acid Toner",
    originalPriceZar: 135.0,
    rawDescription:
      "AHA 5% lactic acid toner ideal for hyperpigmentation and uneven skin. Gently exfoliates, unclogs pores, promotes a smooth even complexion, brightens, strengthens, stimulates collagen, fades dark marks and discolouration, may reduce fine lines and wrinkles. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, vegan. Do not combine with other AHAs, BHAs, Retinol, Azelaic Acid or Vitamin C.",
    howToUse:
      "Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub over skin. Follow with normal routine and SPF.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-5-lactic-acid-toner-125-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Vitamin C Serum in Polyglutamic Acid",
    originalPriceZar: 195.0,
    rawDescription:
      "Water-based serum with two stable forms of vitamin C in a polyglutamic acid base. Ideal for dry, dehydrated skin and pigmentation. Brightens dark spots, promotes radiant even-toned skin, targets wrinkles and fine lines, may reverse sun damage and age spots. Clinically tested for low-irritancy, pregnancy & breastfeeding safe, vegan, fragrance-free.",
    howToUse: "Patch test. Use AM or PM after washing/cleansing/toning and before moisturising.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-vitamin-c-serum-in-polyglutamic-acid-30-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Oat-So-Clean Cleansing Balm",
    originalPriceZar: 205.0,
    rawDescription:
      "Gentle nourishing cleansing balm with rich natural oils. Ideal for double-cleansing, dry and sensitive skin. Removes makeup, impurities and excess sebum while protecting and strengthening the lipid barrier and providing long-lasting moisture. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, free from artificial fragrances, all skin types, vegan.",
    howToUse:
      "Use as the first cleanser when double-cleansing. In dry winter months can be a primary cleanser. Mornings and evenings.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-oat-so-clean-cleansing-balm-100-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Rosehip Serum",
    originalPriceZar: 185.0,
    rawDescription:
      "Organic cold-pressed rosehip oil serum ideal for dry, acne-prone and mature skin. Packed with antioxidants, vitamins A & C. Rejuvenates and hydrates, stimulates collagen, improves elasticity, reduces wrinkles, fine lines, acne scars and dark spots, evens skin tone, aids tissue and cell regeneration. Non-comedogenic, pregnancy & breastfeeding safe, all skin types, vegan.",
    howToUse: "Use AM and/or PM after cleansing, toning and moisturising. Apply a few drops and gently massage in.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-rosehip-serum-30-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty SOS Scalp Spray with Anti Itch Active",
    originalPriceZar: 199.0,
    rawDescription:
      "Instant itch and dry scalp relief. Calms itchiness, redness and sensitivity, balances the scalp microbiome, enhances circulation, supports hair growth, reduces dandruff and sebum production, hydrates and nourishes the scalp. Suitable for all hair types including 1-4C, braided and unbraided styles.",
    howToUse: "Shake before use. As needed or once daily, spray a generous amount onto the scalp. Leave-in treatment.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-sos-scalp-spray-with-anti-itch-active-100-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Hot Oil Hair Therapy",
    originalPriceZar: 195.0,
    rawDescription:
      "Luxurious blend of rosemary, argan and castor oils infused with nettle herbs for dry and damaged hair. Tames frizz, deeply moisturises, restores and strengthens, leaves a soft silky finish, promotes new growth after loss or thinning. Free from artificial fragrances & colours, vegan.",
    howToUse:
      "1-2 times per week. Heat the bottle (remove pipette), apply to dry or damp hair section by section, massage, cover and leave 20 minutes or overnight. Rinse and shampoo. Target scalp for growth or strands/ends for moisture.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-hot-oil-hair-therapy-100-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Silicone Applicator Brush",
    originalPriceZar: 75.0,
    rawDescription:
      "Mask applicator with an easy-to-grip wood handle and silicone tip for hygienic, even and controlled application of masks and moisturisers. Reduces mess and product waste. Easy to clean, dry and store. Pregnancy & breastfeeding safe, vegan.",
    howToUse:
      "Scoop mask, dip brush, apply in even upward strokes from the centre of the face outward. Avoid eye and lip areas. Rinse brush after use.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-silicone-applicator-brush",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Pigmentation Buster Mask",
    originalPriceZar: 225.0,
    rawDescription:
      "Chemical exfoliant mask with 5 plant extracts (blueberry, sugarcane, orange, lemon, sugar maple) and 4 AHAs (lactic, glycolic, citric, tartaric) plus alpha arbutin. Brightens dark spots, tackles sun damage, reduces pigmentation and acne scars, soothes irritation and redness, moisturises. Vegan, fragrance-free.",
    howToUse:
      "Patch test. Use 2-3 times a week. Apply a generous amount on clean skin, leave for a max of 10 minutes, rinse with warm water. Follow with normal routine.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-pigmentation-buster-mask",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Mild Face Wash",
    originalPriceZar: 135.0,
    rawDescription:
      "Mild face wash with natural rose, cucumber and chamomile extracts for sensitive or dry skin. Cleanses and hydrates without irritating or stripping natural oils. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, vegan.",
    howToUse: "Use AM and/or PM. Apply in circular motions and rinse with water. Follow with normal routine.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-mild-face-wash-125-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Aloe & Cucumber Toner for Sensitive Skin",
    originalPriceZar: 135.0,
    rawDescription:
      "Blend of botanicals enriched with niacinamide for dry and sensitive skin. Cucumber and aloe soothe inflammation, soften, strengthen and hydrate. Niacinamide and anti-ageing properties firm, even tone and brighten pigmentation. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, vegan.",
    howToUse: "Patch test. Use AM or PM only, 2-3x per week. After washing, apply on a cotton pad and gently rub. Follow with normal routine and SPF.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-aloe-cucumber-toner-for-sensitive-skin-125-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty 10% Niacinamide Serum & 1% Zinc",
    originalPriceZar: 185.0,
    rawDescription:
      "For inflamed, uneven and textured skin. Treats hyperpigmentation, maintains elasticity, soothes to reduce acne, rosacea and inflammatory conditions, promotes even tone and texture, minimises pores. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, vegan. Do not combine with vitamin C.",
    howToUse: "Patch test. Apply AM and/or PM after cleansing and toning on damp skin. Follow with moisturiser, oil-based serum and SPF 50+.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-10-niacinamide-serum-1-zinc-30-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty 1,5% Hyaluronic Serum & Peptides",
    originalPriceZar: 195.0,
    rawDescription:
      "1.5% hyaluronic acid & peptides for wrinkled and dehydrated skin. Extreme hydration and plumping, improves firmness and elasticity, stimulates cell growth, reduces wrinkles and fine lines, boosts lipids and collagen, strengthens the barrier, leaves skin luminescent. Dermatologically tested & approved, clinically tested for non-irritancy, pregnancy & breastfeeding safe, all skin types, vegan.",
    howToUse: "Patch test. Apply AM and/or PM after cleansing and toning on damp skin. Follow with moisturiser, oil-based serum and SPF 50+.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-1-5-hyaluronic-serum-peptides-30-ml",
  },
  {
    brand: "standard-beauty",
    name: "Standard Beauty Squalane Serum",
    originalPriceZar: 175.0,
    rawDescription:
      "100% plant-derived squalane serum. Ultra-hydrating, locks in moisture for a dewy glass-skin look. Lightweight, non-greasy, non-comedogenic, anti-inflammatory. Ideal for dry, sensitive and acne-prone skin. Minimises sun damage and age spots, improves elasticity for firmer, plumper, softer skin. Can be used on eczema. Pregnancy & breastfeeding safe, fragrance-free, vegan.",
    howToUse: "Patch test. Apply AM and/or PM as last step, follow with SPF. For hair: work through damp clean hair daily or as required.",
    sourceUrl: "https://www.faithful-to-nature.co.za/standard-beauty-squalane-serum-30-ml",
  },

  // ---------------- SKOON (26) ----------------
  {
    brand: "skoon",
    name: "SKOON. SUNNYBONANI® SPF40 Daily Defence Cream",
    originalPriceZar: 599.0,
    rawDescription:
      "SKOON. SUNNYBONANI® SPF40+ All-in-One Daily Defence Cream. A 5-in-1 powerhouse packed with skin actives, hydrates, brightens, repairs, and protects skin while defending against blue light. Lightweight, non-greasy, mineral-based formula, broad-spectrum SPF protection, blends without a white cast for all skin tones. Powered by hyaluronic acid, niacinamide, bakuchiol & ceramides.",
    howToUse:
      "AM: as the final step in your routine, apply 1-2 pumps to face, neck, and décolletage. Gently massage in and allow a few minutes to absorb. To neutralise any white cast and match skin tone, blend with Colour-Me-Perfect Elixir. Not water resistant; not suitable for water-based activities.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-sunnybonanir-spf40-all-in-one-daily-defence-cream",
  },
  {
    brand: "skoon",
    name: "SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser",
    originalPriceZar: 459.0,
    rawDescription:
      "A double-cleansing duo designed to remove makeup, sunscreen and daily impurities while supporting the skin barrier and maintaining hydration. Combines a cream cleanser with a gentle foaming cleanser for a two-step routine that leaves skin clean, soft, balanced and comfortably refreshed. Powered by an oil-to-milk first cleanse & a water-based second cleanse, enriched with skin-loving lipids.",
    howToUse:
      "Step 1 Gentle Cream Cleanser: apply to dry skin, massage to dissolve makeup and impurities, add water to emulsify into a milky texture, then rinse. Step 2 Gentle Foaming Cleanser: apply to damp skin, massage to a soft foam, rinse with lukewarm water.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-essentials-combo-dry-patches",
  },
  {
    brand: "skoon",
    name: "SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE",
    originalPriceZar: 999.0,
    rawDescription:
      "Revitalise tired-looking eyes with SKOON. BRIGHT-EYED Brighten + Firm Eye Cream. A lightweight eye cream that deeply hydrates and strengthens the skin barrier while diminishing dark circles and puffiness, absorbing seamlessly to restore a youthful glow. Targeted brightening & firming, may help reduce dark circles & puffiness, supports a brighter, smoother, more even-looking eye area.",
    howToUse:
      "Use morning and evening. Apply a pea-sized amount to clean, dry skin around the eyes, including the brow bone, eyelid, outer corners and under-eye area. Use after serum and allow to absorb fully before applying face cream. Apply gently without tugging.",
    sourceUrl:
      "https://www.faithful-to-nature.co.za/skoon-the-eye-shift-duo-bright-eyed-brighten-firm-eye-cream-15ml-sleep-depuff-eye-gel-pen-8ml-free",
  },
  {
    brand: "skoon",
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream",
    originalPriceZar: 459.0,
    rawDescription:
      "Balances your skin's microbiome with pre- and probiotics. Swiss yoghurt & Kigelia africana promote microbial balance essential to skin health and anti-ageing. This gentle moisturiser strengthens the skin's natural barrier and soothes sensitivities, redness and dryness — perfect for irritated skin. Hydrating and regenerative effects of Baobab oil, calming natural aroma from vanilla extract.",
    howToUse:
      "AM/PM: smooth a dollop of the cream onto clean skin. For intense nourishment, add 1-2 drops of a SKOON concentrate to the cream, blend in the palm of your hand and apply.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-happy-flora-microbiome-balancing-face-cream",
  },
  {
    brand: "skoon",
    name: "SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine",
    originalPriceZar: 599.0,
    rawDescription:
      "The ultimate lightweight eye treatment. A convenient, easy-to-use gel pen containing caffeine and youth-boosting peptides that depuff, minimise fine lines, and improve complexion around the eye. Antioxidant-rich ingredients provide hydration and brightening; depuffs the under-eye area, reduces dark circles, minimises fine lines and crow's feet.",
    howToUse:
      "Shake the pen to coat the metal roller ball with gel. Glide the roller ball under each eye from inner to outer corner several times. Re-shake if necessary. Follow with a cream to lock in water-based actives. Can be used AM and PM.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-sleep-depuff-eye-gel-pen",
  },
  {
    brand: "skoon",
    name: "SKOON. SUGABABE Face Concentrate – Hydrating Serum",
    originalPriceZar: 599.95,
    rawDescription:
      "Soothe your skin and lock in moisture. These drops contain three oil-based concentrates and acmella, nature's answer to a botox-like effect, to plump, firm and increase skin elasticity, visibly reducing lines and wrinkles. Ideal for sensitive skin as it calms inflammatory and irritated skin. Vegan, cruelty- and fragrance-free moisture drops.",
    howToUse:
      "AM | PM: add 1-2 drops to enrich your moisturiser. Massage twice daily into newly healed tissue for aesthetic scar maintenance. Alternatively, smooth directly onto clean skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-15ml-sugababe-moisture-matrix-face-concentrate",
  },
  {
    brand: "skoon",
    name: "SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist",
    originalPriceZar: 799.95,
    rawDescription:
      "The ultimate hydration duo pack, combining WOW-WOW WONDER+ Nanopillow Face Serum and SKIN PJ's Activator Face Mist. The pro-collagen nanopillow serum is made using patented electrospinning technology, a high-potency, waterless serum that penetrates deep into skin to deliver intense moisture, leaving skin plumper, more supple, and visibly radiant. Contains 20% hyaluronic acid.",
    howToUse:
      "AM | PM: dispense one WOW-WOW WONDER+ Nanopillow into the cupped palm of a clean, dry hand by gently tapping the container. Activate with the SKIN PJ's Activator Face Mist and pat/press into skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-hydrosurge-duo-pack",
  },
  {
    brand: "skoon",
    name: "SKOON Dream Team Duo Pack",
    originalPriceZar: 671.3,
    rawDescription:
      "A combination of a locally made serum and cream that elevates your skincare routine: a Vitamin C Serum for morning use which hydrates, softens, and brightens skin, and a Vitamin A Treatment for overnight use that rejuvenates and supports collagen production. Packed with plant-based ingredients, hyaluronic acid, phytic acid, and vitamin C to enhance tone and texture.",
    howToUse:
      "Morning: smooth a few drops of the Wow Wow Wonder serum onto clean, damp skin, mist for best results, lock in moisture with a SKOON concentrate or moisturiser. Evening only: smooth a dollop of the Vitamin A treatment onto clean skin. Use a broad-spectrum SPF during the day.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-dream-team-duo-pack-159332",
  },
  {
    brand: "skoon",
    name: "SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm",
    originalPriceZar: 409.0,
    rawDescription:
      "Repair and strengthen your skin barrier with this luxurious balm, enriched with marula oil, niacinamide, ceramide 3, and pomegranate sterols, designed to rapidly soothe, repair, and regenerate damaged skin barriers. Can help reduce hyperpigmentation and inflammation while providing deep hydration and protection. Lightweight, easy-to-use stick formula, perfect for travel or on-the-go.",
    howToUse:
      "AM/PM: apply after cleansing and serum. Remove the protective cover and glide the balm onto the face and décolletage, massaging in with fingertips. Replace the cover after use.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-ruby-marine-barrier-recovery-face-balm-stick-15ml",
  },
  {
    brand: "skoon",
    name: "SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin",
    originalPriceZar: 549.95,
    rawDescription:
      "A gentle, airy cleanser crafted with real Swiss yoghurt, honey and Kigelia africana to deeply cleanse while maintaining the skin's natural barrier and pH balance, hydrating, firming and toning, leaving skin soft and calm. Enriched with nourishing ingredients, effectively removes impurities without causing dryness.",
    howToUse:
      "AM | PM: apply 1-3 pumps on damp skin and gently massage in circular motion for 45-60 seconds. Remove with a Bamboo Muslin facecloth soaked in lukewarm water. Use as the second step in a double-cleanse routine.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-oh-so-bubbly-soothing-cloud-cleanser-100ml",
  },
  {
    brand: "skoon",
    name: "SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads",
    originalPriceZar: 749.95,
    rawDescription:
      "A leave-on liquid skin exfoliant designed to target hyperpigmentation and breakouts, removing dead skin cells, unclogging pores, and promoting cell turnover for brighter, more even-toned skin. Enhances product absorption. Paired with reusable bamboo cotton pads for a complete, eco-friendly solution.",
    howToUse:
      "PM: after cleansing, dampen a cotton pad with the exfoliant and sweep over face, neck, and décolletage, avoiding the eye area. Do not rinse; once absorbed, follow with face cream. Start with gradual use — a mild tingling sensation is normal. For skin cycling, use on Night 1.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-fruitful-radiance-night-liquid-exfoliant-free-cleanse-pads",
  },
  {
    brand: "skoon",
    name: "SKOON. BAKU GLOW Face Cream",
    originalPriceZar: 663.2,
    rawDescription:
      "A gentle plant-based formula made with nature's retinol alternative, Bakuchiol (1%), enriched with ceramides, kigelia, and hyaluronic acid. Promotes gentle cell turnover and collagen production to reduce fine lines and improve elasticity, and can help improve skin hydration, texture, tone, and radiance. Suitable for all skin types.",
    howToUse: "AM & PM: smooth 2 to 3 pumps onto cleansed skin. Use twice daily for optimal results. Follow with sun cream by day and a nourishing face cream at night. Safe for pregnancy or breastfeeding.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-30ml-baku-glow-face-cream",
  },
  {
    brand: "skoon",
    name: "SKOON. RETININ® Night 0.1% Retinal Treatment",
    originalPriceZar: 699.0,
    rawDescription:
      "A fast-acting formula that helps firm skin, reduce the appearance of fine lines and wrinkles, and improve skin texture and tone while combatting breakouts. Its gentle composition makes it perfect for nightly use, ensuring deep skin renewal and intense hydration. Made with retinal, peptides, and fulvic acid, cruelty-free ingredients free from artificial colours and fragrances.",
    howToUse:
      "PM ONLY: apply 2 to 3 pumps to cleansed skin, 2-3 times per week at night. Increase frequency gradually as tolerated. Apply broad-spectrum SPF during the day.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-retininr-night-face-cream-0-1-retinal",
  },
  {
    brand: "skoon",
    name: "SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack",
    originalPriceZar: 699.95,
    rawDescription:
      "The ultimate hydrating pro-collagen serum, nourishing and regenerating skin while deeply hydrating for a plump, radiant complexion. Strengthens the natural moisture barrier, protects against environmental stressors, and reduces dark spots. Smooths fine lines and firms and tones skin. Suitable for all skin types, lightweight and non-greasy.",
    howToUse:
      "Begin with clean, dry hands, gently tap the container to drop one NanoPillow into your cupped palm. Reseal for future use. Spritz 4-6 times of SKIN PJ's Activator Face Mist directly onto the Nanopillow, mist your entire face, and allow a few moments to absorb.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-wow-wow-wonder-nanopillow-serum",
  },
  {
    brand: "skoon",
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin",
    originalPriceZar: 1149.0,
    rawDescription:
      "Simplify your skincare with an Everyday Essential Set for T-Zone Combination (Oily-T) + Sensitive Skin, crafted to address all of your skin's needs in one streamlined routine. Cleanses, clears clogged pores, balances oil and hydrates dry areas, and soothes sensitive skin by calming redness and irritation. Paired with a reusable EVA bag.",
    howToUse:
      "Cleanse: apply a coin-sized amount of the Purifying Clay Cleanser to damp skin, massage, remove with a bamboo Muslin facecloth soaked in lukewarm water, rinse. Serum: apply a few drops of the Hyaluron Hydrating & Brightening Serum onto damp skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-everyday-essential-set-t-zone-combination-oily-t-sensitive",
  },
  {
    brand: "skoon",
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches",
    originalPriceZar: 1149.0,
    rawDescription:
      "Simplify your skincare routine with the Patch Perfect Everyday Essential Set, ideal for combination, dry, and sensitive skin. Featuring a cleanser, serum, moisturiser, and barrier balm that gently cleanses while nourishing and balancing skin, restores moisture to smooth rough patches, controls shine without over-drying, and calms redness and irritation.",
    howToUse:
      "Cleanse: apply a coin-sized amount of the Gel-to-Milk Cleanser + Makeup Remover to dry skin, add water and massage gently, remove excess with a Bamboo Muslin facecloth, rinse. Serum: apply a few drops of the Hyaluron Hydrating & Brightening Serum onto damp skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-everyday-essential-set-patch-perfect-combination-dry-patches-sensitive",
  },
  {
    brand: "skoon",
    name: "SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost",
    originalPriceZar: 699.95,
    rawDescription:
      "A powerful hydrating serum infused with niacinamide, squalane, hyaluronic acid, and azelaic acid. This skin barrier repair serum delivers instant hydration while strengthening the natural barrier, smooths texture, brightens skin, and reduces dark spots for a radiant, youthful glow.",
    howToUse:
      "AM/PM: dispense one Pixie Dust Nanopillow into the cupped palm of a clean, dry hand by gently tapping the container. Reseal for future use. Activate with the Face Mist and pat/press into skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-pixie-dust-nanopillow-serum",
  },
  {
    brand: "skoon",
    name: "SKOON. Double Cleanse Heroes Combo - Dry Patches",
    originalPriceZar: 759.96,
    rawDescription:
      "Featuring Gel-to-Milk and Oh So Bubbly cleansers, this dynamic duo gently removes dirt, impurities, and excess oil while supporting the skin's natural oils and protecting its moisture barrier. Hydrating and balancing, it minimises clogged pores, combats breakouts, and purifies deeply for a radiant glow.",
    howToUse:
      "Gel-to-Milk Cleanser & Make-up Remover, use AM | PM: gently massage a small amount into skin, dip fingers into water to emulsify, splash with water and wipe with a Bamboo Muslin facecloth to remove excess cleanser.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-double-cleanse-heroes-combo-dry-patches",
  },
  {
    brand: "skoon",
    name: "SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula",
    originalPriceZar: 999.0,
    rawDescription:
      "This powerful yet gentle eye cream restores luminosity and resilience to the delicate eye area, reducing puffiness, brightening dark circles and improving circulation for even, radiant skin. Deeply hydrating and packed with collagen-boosting ingredients, it smooths and firms skin while strengthening the skin barrier.",
    howToUse:
      "AM | PM: apply a pea-sized amount to clean, dry skin around the eyes, including brow bone, eyelid, outer corners, and under-eye. Use after serum, let absorb fully before applying face cream. Store below 25°C, avoid direct sunlight.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-bright-eyed-brighten-firm-eye-cream-15ml",
  },
  {
    brand: "skoon",
    name: "SKOON. The One Hydra-Plump Face Cream - 30ml",
    originalPriceZar: 569.0,
    rawDescription:
      "A luxurious fusion of marula oil, ceramide 3, and hyaluronic acid, this lightweight, fast-absorbing formula masterfully maintains essential moisture, encouraging a supple and beautifully plump appearance. Infused with a natural fynbos-inspired scent, provides deep nourishment and all-day comfort.",
    howToUse: "Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Alternatively, add 1-2 drops of a SKOON concentrate, blend in the palm of your hand, and apply.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-the-one-hydra-plump-face-cream-30ml",
  },
  {
    brand: "skoon",
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill",
    originalPriceZar: 459.0,
    rawDescription:
      "An eco-friendly refill of the Happy Flora Microbiome Balancing Face Cream, designed to top up your favourite cream while minimising environmental impact. A sophisticated blend of Swiss yoghurt, baobab, and prebiotics supports a balanced microbiome and a resilient, healthy-looking barrier.",
    howToUse:
      "Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Refill: twist open the base, screw out the current insert to screw in the refill unit.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-happy-flora-microbiome-balancing-face-cream-30ml-refill",
  },
  {
    brand: "skoon",
    name: "SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml",
    originalPriceZar: 569.0,
    rawDescription:
      "This ultra-thick, comforting cream is formulated with ceramides, pomegranate sterols, and organic shea butter to masterfully maintain a healthy-looking barrier and resilient complexion, managing excessive dryness and soothing stressed skin to reveal a balanced, youthful-looking glow.",
    howToUse:
      "Use daily AM or PM. Smooth 3-4 pumps onto clean skin. Bottle priming: gently tap the base to dislodge air bubbles, pump several times to initiate product flow.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-wrap-me-up-ultra-thick-comforting-face-cream-30ml",
  },
  {
    brand: "skoon",
    name: "SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml",
    originalPriceZar: 569.0,
    rawDescription:
      "An innovative gel-cream, expertly formulated to balance your complexion without any heaviness. Infused with niacinamide and seaweed, it masterfully regulates surface shine while promoting a smoother, more refined texture — fast-absorbing and encourages a healthy-looking barrier.",
    howToUse: "Apply morning and evening after cleansing and a water-based serum. Gently massage into face and neck until fully absorbed.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-pretty-smooth-oil-balance-gel-cream-30ml",
  },
  {
    brand: "skoon",
    name: "SKOON. essentials Rich Moisture Cream",
    originalPriceZar: 399.0,
    rawDescription:
      "A nourishing moisturiser formulated to deeply hydrate and restore dry, dehydrated and compromised skin. Powered by ceramide NP, shea butter and antioxidant-rich botanical extracts, this comforting cream helps strengthen the skin barrier, reduce moisture loss and leaves skin feeling soft, smooth and resilient. Enriched with Kalahari melon seed & coconut oils.",
    howToUse:
      "Apply to clean skin after cleansing. Gently massage into face and neck until fully absorbed. Use morning and evening, or as needed, for intensive hydration and barrier support.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-essentials-rich-moisture-cream",
  },
  {
    brand: "skoon",
    name: "SKOON. SKIN PJs Face Mist - Hydrating Toner with Buchu & CBD",
    originalPriceZar: 349.0,
    rawDescription:
      "A water-based face mist packed with nutrients and A-beauty actives. Provides instant and refreshing hydration, nourishes and soothes sensitive skin while strengthening the skin's natural barrier, and helps skin absorb serums, moisturisers and masks.",
    howToUse:
      "Spritz clean skin with the mist, follow by applying a water-based serum, cream and/or oil-based concentrate. Misting before and after water-based actives enhances efficacy. Can be used throughout the day.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-pj-s-activator-face-mist",
  },
  {
    brand: "skoon",
    name: "SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask",
    originalPriceZar: 349.95,
    rawDescription:
      "Repairs, soothes and plumps up skin with active, clean and skin-nourishing ingredients. Formulated with hyaluronic acid, CBD and powerful antioxidants to provide long-term hydration and enhance skin cell regeneration. A nanofibre sheet mask infused with active ingredients & oils.",
    howToUse:
      "Remove one mask from the sachet using dry hands, re-seal the ziplock. Spritz the entire face with the Activator face mist until very damp. Remove the middle mesh piece and apply the mask directly onto clean, damp skin, leaving the paper cover in place.",
    sourceUrl: "https://www.faithful-to-nature.co.za/skoon-bff-sleepover-overnight-regeneration-mask",
  },

  // ---------------- Esse (17) ----------------
  {
    brand: "esse",
    name: "Esse Bakuchiol Serum",
    originalPriceZar: 575.0,
    rawDescription:
      "Nature's answer to retinol. Infused with bakuchiol, aloe vera, and jojoba seed oil, this serum helps renew skin by boosting collagen synthesis to smooth fine lines, wrinkles and roughness while reducing hyperpigmentation and inflammation and promoting skin elasticity. Provides protection, hydration, and calming properties. Vegan-friendly and certified cruelty-free by PETA Beauty Without Bunnies.",
    howToUse: "Apply a thin layer over the face twice daily. Follow with a microbiome-friendly moisturiser. Store at room temperature out of direct sunlight.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-bakuchiol-serum",
  },
  {
    brand: "esse",
    name: "Esse Resurrect Serum",
    originalPriceZar: 1375.0,
    rawDescription:
      "Formulated to bring new life and vitality to tired skin. The star ingredient is the Namibian 'Resurrection Plant', a special shrub that provides excellent hydration and antioxidant protection. Also includes aloe, baobab and probiotics to reduce inflammation, reduce wrinkles and fine lines, and plump the skin. Locally made, cruelty-free and organic.",
    howToUse: "Use in the evenings. Smooth over face, neck & décolleté after cleansing & toning. Follow with your preferred natural moisturiser. Store in a cool dry place out of direct sunlight.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-resurrect-serum",
  },
  {
    brand: "esse",
    name: "Esse Live Probiotic Mist",
    originalPriceZar: 650.0,
    rawDescription:
      "A revolutionary facial mist that hydrates, protects, and restores skin. Packed with live probiotics, it strengthens the skin's natural barrier while rebalancing its microbiome for a radiant, healthy glow. Locks in moisture and promotes lasting hydration for all skin types.",
    howToUse:
      "To activate, add the Probiotic Powder to the Mist bottle, replace the pump and shake well for at least 1 minute. After cleansing, spritz directly onto face, neck, and décolleté. Follow with your preferred Esse moisturiser. Use within 3 months of activation.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-live-probiotic-mist",
  },
  {
    brand: "esse",
    name: "Esse Pro Sun D Serum",
    originalPriceZar: 575.0,
    rawDescription:
      "A provitamin D serum that activates under the sun to boost the skin's vitamin D levels. Lightweight, fast-absorbing, helps repair barrier function and regulates cell regeneration for a youthful complexion, promotes plump, hydrated, glowing skin while calming inflammation and slowing ageing. Vegan-friendly and certified cruelty-free by Beauty Without Cruelty SA.",
    howToUse:
      "Apply once daily or before sun exposure. Smooth over face and décolleté after cleansing and misting. For optimum Vitamin D synthesis, expose skin to at least 5 minutes of direct sunlight without SPF or foundation. Store in a cool, dry place out of direct sunlight.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-pro-sun-d-serum-15ml",
  },
  {
    brand: "esse",
    name: "Esse Hyaluronic Serum",
    originalPriceZar: 675.0,
    rawDescription:
      "Intense, targeted anti-ageing with a cruelty-free formulation. Combining probiotics, prebiotics and hyaluronic acid, this rapidly absorbing serum protects collagen and slows premature signs of ageing, leaving skin softer and more supple. Specially formulated for mature skin, naturally anti-inflammatory, supports the natural barrier.",
    howToUse: "Use in the evenings. Smooth over face, neck and décolleté after cleansing and toning. Follow with preferred moisturiser.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-hyaluronic-serum",
  },
  {
    brand: "esse",
    name: "Esse Sunscreen",
    originalPriceZar: 690.0,
    rawDescription:
      "An organic mineral sunscreen that's gentle on skin and kind to the marine environment, providing broad-spectrum SPF30 protection against UVA and UVB rays. Fragrance-free and suitable for sensitive skin, biodegradable and coral-reef safe, pH balanced. Coated zinc oxide screens out UV rays, spreads easily and evenly, 0% nano-sized particles.",
    howToUse:
      "Apply liberally to exposed areas of skin before sun exposure. Reapply regularly to maintain protection, especially after swimming or towelling. For external use only; avoid contact with eyes.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-sunscreen",
  },
  {
    brand: "esse",
    name: "Esse Lip Conditioner",
    originalPriceZar: 355.0,
    rawDescription:
      "A soothing organic lip conditioner from Esse. A protective lip conditioner that locks in moisture while helping to restore natural barrier function. Made with organic, environmentally friendly and responsibly sourced ingredients.",
    howToUse: "Apply a small amount to the lips as needed. A little goes a long way.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-lip-conditioner",
  },
  {
    brand: "esse",
    name: "Esse Light Moisturiser (Oily & Combination Skin)",
    originalPriceZar: 820.0,
    rawDescription:
      "A lightweight organic facial moisturiser ideal for combination skin that's a little on the oily side, and for anyone sensitive to the harmful chemicals used in ordinary moisturisers. An incredible scientific formula that, used with an Esse cleanser, allows skin to function at its best — no clogged pores, less build-up of impurities, a lovely natural glow. Ideal for oily and acne-prone skin.",
    howToUse: "For optimal results, apply gently onto clean skin after cleansing, preferably using circular motions to stimulate blood circulation. Can be used day and night.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-light-moisturiser-oily-combination-skin",
  },
  {
    brand: "esse",
    name: "Esse Repair Oil (Tissue Oil)",
    originalPriceZar: 655.0,
    rawDescription:
      "Harnesses the therapeutic power of key African botanicals as powerful healing remedies. Ideal for healing stretch marks, scars, pigmentation and damaged skin. Manketti, marula and yangu are rich in omega oils and nourishing vitamin actives that feed the skin and stimulate new cell growth; jojoba soothes sensitive and dry skin and helps prevent moisture loss; rosehip helps with scarring.",
    howToUse: "Massage gently into affected areas. Can be added as nourishment to your moisturiser, and should be used as often as necessary.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-repair-oil-tissue-oil",
  },
  {
    brand: "esse",
    name: "Esse Hydrating Mist",
    originalPriceZar: 500.0,
    rawDescription:
      "An important part of Esse's organic African skincare collection, completing their cleansing process. Made with natural and organic ingredients including rooibos leaf extract, it works to revitalise and improve skin's tone and texture without drying it out, and won't leave skin smelling like alcohol as many chemical toners do. Rooibos is an antioxidant that protects against free radical damage and the signs of ageing.",
    howToUse:
      "Apply 3-4 pump sprays to face and neck, twice daily. Blot any excess with a tissue, cotton wool or face cloth. Follow with an organic moisturiser for best results. Can also be sprayed over makeup to rehydrate skin.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-toner",
  },
  {
    brand: "esse",
    name: "Esse Eye & Lip Cream",
    originalPriceZar: 655.0,
    rawDescription:
      "Takes care of the sensitive areas around the eyes and lips. This ointment is packed with organic active ingredients and is 100% non-toxic. It gently moisturises skin without causing puffiness and reduces dark shadows, packed with active ingredients that combat the signs of ageing.",
    howToUse: "Apply a small amount (1-2 pumps) to eye and lip areas in the morning and evening. Use consistently, along with an organic facial cleanser, toner and moisturiser, for best results.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-eye-lip-cream",
  },
  {
    brand: "esse",
    name: "Esse Cream Mask",
    originalPriceZar: 930.0,
    rawDescription:
      "A luscious facial mask blend to feed and nourish the most dehydrated skins. This creamy formula includes organic rooibos and aloe vera extract, with jojoba and coconut oils for luxurious natural hydration. Aloe vera leaf is very soothing & calms irritated skin; kigelia extract is firming & rejuvenating. Natural & Organic Cosmetic certified.",
    howToUse: "Apply generously to the face and neck. Leave on for 20-30 minutes, then rinse off with warm water. For best results, use twice a week or as needed. Can also be used as an overnight mask for extra hydration.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-cream-mask",
  },
  {
    brand: "esse",
    name: "Esse Cocoa Exfoliator",
    originalPriceZar: 645.0,
    rawDescription:
      "A delectable exfoliation experience for all skin types — an exfoliating cocoa facial scrub. Gently exfoliates without drying or tightening the skin, leaves skin feeling soft and moisturised, with a delicious chocolate scent. Ideal for sensitive skin as the granules dissolve while massaging. Composed of natural and organic ingredients.",
    howToUse: "Apply a small amount to damp skin. Massage gently, allowing the granules to dissolve. Rinse thoroughly with water. Can be used once a week for optimal results.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-cocoa-exfoliator",
  },
  {
    brand: "esse",
    name: "Esse Dry Skin Trial/Travel Set",
    originalPriceZar: 1575.0,
    rawDescription:
      "An Esse set for dry skin: a 50ml Cream Cleanser (a non-foaming cleanser that gently removes dirt and make-up), a 30ml Biome Mist (a hydrating probiotic defence mist with inactive Lactobacilli to promote skin's innate immune function while maintaining barrier function, plus prebiotics), a 20ml Rich Moisturiser (with probiotic extracts to optimise skin's microbiome), and a 12ml Repair Oil (intensely nourishing, supplies vitamin E).",
    howToUse:
      "Weeks 1 & 2: start with the Cream Cleanser, Repair Oil and Rich Moisturiser — use the Cream Cleanser in the evenings to remove make-up and sunscreen, and rinse with lukewarm water in the mornings. Week 3: introduce the Biome Mist three times per week, building up from there.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-trial-pack-dry-skin",
  },
  {
    brand: "esse",
    name: "Esse Omega Deep Moisturisers (Normal/Combination Skin)",
    originalPriceZar: 1370.0,
    rawDescription:
      "An omega-rich formula suitable as a facial moisturiser and makeup base. Marula oil is a potent antioxidant, full of essential fatty acids and vitamin E; omega 3, 6 and 9 create an anti-inflammatory blend that moisturises and feeds skin cells; chamomile extract is hypoallergenic and soothes irritations; hyaluronic acid helps increase penetration of other active ingredients. Natural and organic cosmetic certified by ECOCERT, dark glass bottles to keep ingredients fresh.",
    howToUse: "Massage gently into face and neck. Suitable as a makeup base.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-omega-deep-moisturisers-normal-combination-skin",
  },
  {
    brand: "esse",
    name: "Esse Cream Cleanser (Normal/Combination Skin)",
    originalPriceZar: 545.0,
    rawDescription:
      "A light, gentle cream cleanser specially designed to refine and restore mature or combination skin types, made from all-natural ingredients. African botanicals like jojoba and baobab oil are masterfully blended to leave skin clean without drying it out — gentle enough to remove eye makeup too. Ideal for dry, sensitive or ageing skin, also suitable for normal and combination skin types.",
    howToUse: "Gently press into skin of face, neck and décolleté morning and evening after cleansing and toning.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-cream-cleanser-normal-combination-skin",
  },
  {
    brand: "esse",
    name: "Esse Hand Cream",
    originalPriceZar: 430.0,
    rawDescription:
      "A lightweight hand lotion made with marula, rooibos, and jojoba to nourish skin without leaving a greasy residue, perfect for hardworking hands that need pampering. Made with 90% organically farmed ingredients. Rooibos leaf extract protects & rejuvenates skin; jojoba seed oil nourishes, moisturises & softens; marula seed oil hydrates & repairs; kigelia fruit extract rejuvenates cells & reduces the signs of ageing.",
    howToUse: "Apply directly to hands as frequently as needed.",
    sourceUrl: "https://www.faithful-to-nature.co.za/esse-hand-cream",
  },
];
