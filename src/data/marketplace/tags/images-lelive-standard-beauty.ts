/**
 * Verified FTN product image URLs for the Lelive (21) and Standard Beauty
 * (20) products in `src/data/marketplace/ftn-catalog.ts`.
 *
 * Sourced via Firecrawl image search against faithful-to-nature.co.za, one
 * query per product name. Every URL below was verified by confirming its
 * FTN product-page `url` (ignoring the `?srsltid=...` tracking param)
 * matches that product's `sourceUrl` in `ftnCatalog` — results pointing at
 * a different, similarly-named product's page were discarded rather than
 * guessed at. Up to 3 images per product, preferring larger real product
 * photos (usually 400x400+) under `/media/catalog/product/` over small
 * icons/thumbnails, tie-broken by search result position.
 *
 * `Lelive. All Glow'd Up Vitamin C, Turmeric & Hyaluronic Acid Brightening
 * Serum` is a deliberate judgment call: ftnCatalog's `sourceUrl` for it is
 * `lelive-all-glow-d-up-ha-brightening-serum-vitamin-cturmeric` (missing a
 * hyphen), while the live FTN page path is
 * `lelive-all-glow-d-up-ha-brightening-serum-vitamin-c-turmeric`. Treated
 * as a same-product catalog transcription typo (title/SKU sku137436
 * otherwise match exactly) rather than a different product, so its images
 * were accepted.
 *
 * `Lelive. Body Glow Up: Mini Edition` and `Standard Beauty Silicone
 * Applicator Brush` only had 2 verified images each — no third candidate
 * passed the URL-match/size check.
 */

export interface ProductImageResult {
  name: string; // exact match to ftnCatalog's `name` field
  imageUrls: string[]; // 0-3 real, URL-verified image URLs, best first; empty array if none passed verification
}

export const leliveStandardBeautyImages: ProductImageResult[] = [
  // ---------------- Lelive (21) ----------------
  {
    name: "Lelive. Nourishing 3 Step Routine - Revitalise, Plump + Restore Normal to Dry Skin",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_10.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_nourishing_3_step_routine_revitalise_plump_restore_normal_to_dry_skin_sku162081_4.jpg",
    ],
  },
  {
    name: "Lelive Own The Glow: Mini Icons",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/.lelive_own_the_glow_mini_icons_sku165620_closed_box.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_own_the_glow_mini_icons_sku165620_products___box.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_own_the_glow_mini_icons_sku165620_products.jpg",
    ],
  },
  {
    name: "Lelive. The Glow Kit: Mini Edition",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_5.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_glow_kit_the_mini_edition_5-piece_set_sku162079_2.jpg",
    ],
  },
  {
    name: "Lelive. Clean Slate | Cleanse + Renew Body Wash",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_4.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_3.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_clean_slate_cleanse_renew_body_sku159391_1_.jpg",
    ],
  },
  {
    name: "Lelive. African Butter | Hydrate + Firm Body Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390_5.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_butter_hydrate_firm_body_cream_sku159390_3.jpg",
    ],
  },
  {
    name: "Lelive. Seatox Marine Algae & Aloe Detoxifying Mask",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_seatox_marine_algae_aloe_detox_sku137583_1.jpg",
    ],
  },
  {
    name: "Lelive. Crème De La Cream African Mahogany Everyday Moisturiser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_ls.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cre_me_de_la_cream_african_mahogany_sku160644_3.jpg",
    ],
  },
  {
    name: "Lelive. All Glow'd Up Vitamin C, Turmeric & Hyaluronic Acid Brightening Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436_6.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_glowd_up_vitamin_c_turmeric_hyaluronic_acid_brightening_serum_sku137436_2.jpg",
    ],
  },
  {
    name: "Lelive. Rooibos & Aloe Jelly Splash Cleanser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_1_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_2_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_rooibos_aloe_jelly_splash_clean_sku137434_3_1.jpg",
    ],
  },
  {
    name: "Lelive. Body Glow Up: Mini Edition",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_body_glow_up-_mini_edition_4-piece_set_sku162693_3.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_body_glow_up-_mini_edition_4-piece_set_sku162693_2.png",
    ],
  },
  {
    name: "Lelive. Am + Pm Serum Kit - Multi-Benefit Duo All Skin Types",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_7.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_am_pm_serum_kit_multi_benefit_duo_all_skin_types_sku162082_6.jpg",
    ],
  },
  {
    name: "Lelive. Cleaner Colada Coconut & Pineapple African Oil Cleanser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_cleaner_colada_coconut_pineapple_sku137433_2.jpg",
    ],
  },
  {
    name: "Lelive. Bestselling 3 Step Routine - Brighten, Clarify + Glow All Skin Types",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080_8.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_bestselling_3_step_routine_brighten_clarify_glow_all_skin_types_sku162080_7.jpg",
    ],
  },
  {
    name: "Lelive. Good to Glow | Smooth + Renew Body Exfoliator",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_5.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_good_to_glow_smooth_renew_body_exfoliator_sku159393_1.jpg",
    ],
  },
  {
    name: "Lelive. Oil La La | Brighten + Glow Body Oil",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_4.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_oil_la_la_brighten_glow_body_oil_sku159392_5.jpg",
    ],
  },
  {
    name: "Lelive. African Gold Peptide, Bakuchiol + African Oil Elixir",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_2_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_african_gold_peptide_bakuchiol_african_oil_elixir_sku152849_1.jpg",
    ],
  },
  {
    name: "Lelive. Eye-Conic Peptide + Coffee Arabica Eye Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_eye-conic_peptide_coffee_arabica_eye_sku152848_3.jpg",
    ],
  },
  {
    name: "Lelive. The Drip Hydrating Mist - Deep Sea Biotics + African Malachite",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_the_drip_hydrating_mist_-_deep_sea_sku137584_ls.jpg",
    ],
  },
  {
    name: "Lelive. The Du-Pont Shea Butter Lush Moisturiser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/l/_lelive_the_du-pont_shea_butter_lush_moisturiser_sku137438_2.jpg",
    ],
  },
  {
    name: "Lelive. All the Shade Marula Tinted Spf 30 Moisturiser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_5.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_all_the_shade_marula_tinted_spf_sku137437_4.jpg",
    ],
  },
  {
    name: "Lelive. Save Our Skin Peach & Aloe aha/bha Exfoliator",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_1_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/l/e/lelive_save_our_skin_peach_aloe_aha_bh_sku137435_3.jpg",
    ],
  },

  // ---------------- Standard Beauty (20) ----------------
  {
    name: "Standard Beauty Salicylic Acid Face Wash",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_salicylic_acid_face_wash_125_ml_sku159696.png",
    ],
  },
  {
    name: "Standard Beauty 2% Alpha Arbutin Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_2_alpha_arbutin_serum_30_ml_sku159675.png",
    ],
  },
  {
    name: "Standard Beauty African Black Soap",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_african_black_soap_sku159674_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_african_black_soap_sku159674_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_african_black_soap_sku159674.png",
    ],
  },
  {
    name: "Standard Beauty Renew Your Dew Ceramide Butter",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_ceramide_butter_renew_your_dew_50_ml_sku159673.png",
    ],
  },
  {
    name: "Standard Beauty Moisture Bomb",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_moisture_bomb_50_ml_sku159663.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_moisture_bomb_50_ml_sku159663_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_moisture_bomb_50_ml_sku159663.png",
    ],
  },
  {
    name: "Standard Beauty Mattifying Gel Moisturiser with Azelaic Acid",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_mattifying_gel_moisturiser_with_azelaic_acid_50_ml_sku159662.png",
    ],
  },
  {
    name: "Standard Beauty 2% Salicylic Acid Toner",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_2_salicylic_acid_toner_125_ml_sku159659.png",
    ],
  },
  {
    name: "Standard Beauty 5% Lactic Acid Toner",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_box.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_ls.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_5_lactic_acid_toner_125_ml_sku159658_2.png",
    ],
  },
  {
    name: "Standard Beauty Vitamin C Serum in Polyglutamic Acid",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657_open.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_vitamin_c_serum_in_polyglutamic_acid_30_ml_sku159657.png",
    ],
  },
  {
    name: "Standard Beauty Oat-So-Clean Cleansing Balm",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_oat-so-clean_cleansing_balm_100_ml_sku159697_ls.png",
    ],
  },
  {
    name: "Standard Beauty Rosehip Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_rosehip_serum_30_ml_sku159624_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_rosehip_serum_30_ml_sku159624.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_rosehip_serum_30_ml_sku159624.png",
    ],
  },
  {
    name: "Standard Beauty SOS Scalp Spray with Anti Itch Active",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670_3.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_sos_scalp_spray_with_anti_itch_active_100_ml_sku159670_1.png",
    ],
  },
  {
    name: "Standard Beauty Hot Oil Hair Therapy",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_hot_oil_hair_therapy_100_ml_sku159669_1.png",
    ],
  },
  {
    name: "Standard Beauty Silicone Applicator Brush",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_silicone_applicator_brush_sku159666.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_silicone_applicator_brush_sku159666.png",
    ],
  },
  {
    name: "Standard Beauty Pigmentation Buster Mask",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_pigmentation_buster_mask_sku159665.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_pigmentation_buster_mask_sku159665_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_pigmentation_buster_mask_sku159665_ls_.png",
    ],
  },
  {
    name: "Standard Beauty Mild Face Wash",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_ls.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_mild_face_wash_125_ml_sku159661_.png",
    ],
  },
  {
    name: "Standard Beauty Aloe & Cucumber Toner for Sensitive Skin",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_aloe_cucumber_toner_for_sensitive_skin_125_ml_sku159660.png",
    ],
  },
  {
    name: "Standard Beauty 10% Niacinamide Serum & 1% Zinc",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656_1_.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_10_niacinamide_serum_zinc_sku159656_5.png",
    ],
  },
  {
    name: "Standard Beauty 1,5% Hyaluronic Serum & Peptides",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_1_5_hyaluronic_serum_peptides_30_ml_sku159655.png",
    ],
  },
  {
    name: "Standard Beauty Squalane Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_squalane_serum_30_ml_sku159625.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/t/standard_beauty_squalane_serum_30_ml_sku159625_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/t/standard_beauty_squalane_serum_30_ml_sku159625.png",
    ],
  },
];
