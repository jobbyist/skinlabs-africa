/**
 * Verified FTN product image URLs for the SKOON (26) and Esse (17) products
 * in `src/data/marketplace/ftn-catalog.ts`.
 *
 * Sourced via Firecrawl image search against faithful-to-nature.co.za, one
 * query per product name. Every URL below was verified by confirming its
 * FTN product-page `url` (ignoring the `?srsltid=...` tracking param)
 * matches that product's `sourceUrl` in `ftnCatalog`, AND that the image
 * filename plausibly names the same product (a handful of search results
 * shared a matching product-page URL but were actually cross-sell
 * thumbnails for a *different* product embedded on that page — those were
 * discarded too). Up to 3 images per product, preferring larger real
 * product photos under `/media/catalog/product/` over small icons.
 *
 * Same-name-different-size variants (e.g. "HAPPY FLORA ... Face Cream" vs.
 * "... - 30ml Refill") are genuinely separate FTN product pages/URLs, so
 * their images were kept strictly separate rather than shared.
 */

export interface ProductImageResult {
  name: string; // exact match to ftnCatalog's `name` field
  imageUrls: string[]; // 0-3 real, URL-verified image URLs, best first; empty array if none passed verification
}

export const skoonEsseImages: ProductImageResult[] = [
  {
    name: "SKOON. SUNNYBONANI® SPF40 Daily Defence Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_sunnybonani_spf40_all-in-one_daily_defence_cream_sku164146.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_sunnybonani_spf40_all-in-one_daily_defence_cream_sku164146.png",
    ],
  },
  {
    name: "SKOON. essentials Double Cleanse Duo - Gentle Cream + Foaming Cleanser",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_essentials_double_cleanse_duo_-_gentle_cream_foaming_cleanser_sku167404_back.png",
    ],
  },
  {
    name: "SKOON. The Eye Shift Duo - Bright-Eyed Brighten & Firm Eye Cream + Sleep Depuff Eye Gel Pen 8ml FREE",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/b/o/box-front.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/u/s/usp2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/u/s/usp1.jpg",
    ],
  },
  {
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_50ml_sku137443_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_happy_flora_microbiome_balancing_face_cream-_refill_sku159043.jpg",
    ],
  },
  {
    name: "SKOON. SLEEP DEPUFF Eye Gel Pen – Caffeine, Peptides & Bulbine",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._sleep_depuff_eye_gel_pen_sku152828_box.jpg",
    ],
  },
  {
    name: "SKOON. SUGABABE Face Concentrate – Hydrating Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_back.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_front_box.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._15ml_sugababe_moisture_matrix_face_concentrate_sku158295_side.jpg",
    ],
  },
  {
    name: "SKOON. HYDROSURGE Duo Pack – NanoPillow Serum + Activator Mist",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/h/y/hydrosurge_3_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_hydrosurge_duo_pack_nanopillow_serum_activator_mist_sku158724_6.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_hydrosurge_duo_pack_nanopillow_serum_activator_mist_sku158724_1.jpg",
    ],
  },
  {
    name: "SKOON Dream Team Duo Pack",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/d/r/dreamteam_15ml_15ml_sku159332_lifestyle3.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/d/r/dreamteam_15ml_15ml_sku159332_front.png",
    ],
  },
  {
    name: "SKOON. RUBY MARINE Face Balm Stick – Barrier Repair Balm",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_5.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._ruby_marine_barrier_recovery_face_balm_stick_15ml_sku160744_4.jpg",
    ],
  },
  {
    name: "SKOON. OH SO BUBBLY Hydrating Cleanser for Combination & Sensitive Skin",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser150ml_refill_sku162233_1_1.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser_100ml_sku162232.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_oh_so_bubbly_-_soothing_cloud_cleanser_100ml_sku162232.png",
    ],
  },
  {
    name: "SKOON. FRUITFUL RADIANCE – AHA/BHA Night Exfoliant + Cleanse Pads",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_10.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_3.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_fruitful_radiance_100ml_aha_bha_night_exfoliant_cleanse_pads_sku163274_5.jpg",
    ],
  },
  {
    name: "SKOON. BAKU GLOW Face Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/sku161410.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_baku-glow_gentle_1_bakuchiol_resurfacing_cream_sku161410.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/s/_skoon_baku-glow_gentle_1_bakuchiol_resurfacing_cream_sku161410_2.png",
    ],
  },
  {
    name: "SKOON. RETININ® Night 0.1% Retinal Treatment",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_retinin_night_intensive_0.1_retinal_firming_treatment_sku161333_.png",
    ],
  },
  {
    name: "SKOON. WOW-WOW WONDER NanoPillow Serum 30-day pack",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694_1_3.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wow_wow_wonder_nanopillow_serum_sku162694.png",
    ],
  },
  {
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Oily Skin",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_t-zone_-combination_oily-t_sensitive_sku163276.png",
    ],
  },
  {
    name: "SKOON. EVERYDAY ESSENTIALS SET – Combination & Dry Patches",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_everyday_essential_set_patch_perfect_-_combination_dry_patches_sensitive_sku163277_2.png",
    ],
  },
  {
    name: "SKOON. PIXIE DUST NanoPillow Serum – Barrier Boost",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pixie_dust_nanopillow_serum_sku162695.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pixie_dust_nanopillow_serum_sku162695.png",
    ],
  },
  {
    name: "SKOON. Double Cleanse Heroes Combo - Dry Patches",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882_4.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_double_cleanse_heoes_combo_dy_paches_pack_sku163882.png",
    ],
  },
  {
    name: "SKOON. BRIGHT-EYED Eye Cream – Vitamin C & K1 Brightening Formula",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_bright-eyed_brighten_firm_eye_cream_15ml_sku165092_box.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_bright-eyed_brighten_firm_eye_cream_15ml_sku165092.jpg",
    ],
  },
  {
    name: "SKOON. The One Hydra-Plump Face Cream - 30ml",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_the_one_hydra-plump_face_cream_30ml_sku166853.jpg",
    ],
  },
  {
    name: "SKOON. HAPPY FLORA Microbiome Balancing Face Cream - 30ml Refill",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._happy_flora_microbiome_balancing_face_cream_30ml_refill_sku166856.png",
    ],
  },
  {
    name: "SKOON. WRAP ME UP Ultra-Thick Comforting Face Cream - 30ml",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wrap_me_up_ultra-thick_comforting_face_cream_30ml_sku166857_7.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_wrap_me_up_ultra-thick_comforting_face_cream_30ml_sku166857_5.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/sku166857_box.jpg",
    ],
  },
  {
    name: "SKOON. PRETTY SMOOTH Oil-Balance Gel-Cream - 30ml",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870_2.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pretty_smooth_oil-balance_gel-cream_30ml_sku166870_15.png",
    ],
  },
  {
    name: "SKOON. essentials Rich Moisture Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon_essentials_rich_moisture_cream_sku167400.png",
    ],
  },
  {
    name: "SKOON. SKIN PJs Face Mist - Hydrating Toner with Buchu & CBD",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon_pjs_activator_face_mist_sku152829_2.jpg",
    ],
  },
  {
    name: "SKOON. BFF SLEEPOVER Overnight Regeneration Face Mask",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/s/k/skoon._bff_sleepover_overnight_regeneration_face_mask_sku152827_back.jpg",
    ],
  },
  {
    name: "Esse Bakuchiol Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_bakuchiol_serum_sku159254_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_bakuchiol_serum_sku159254_2.jpg",
    ],
  },
  {
    name: "Esse Resurrect Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_resurrect_serum_sku92393_.jpg",
    ],
  },
  {
    name: "Esse Live Probiotic Mist",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/l/i/live_probiotic_mist_50ml_sku165285.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/l/i/live_probiotic_mist_50ml_sku165285.jpg",
    ],
  },
  {
    name: "Esse Pro Sun D Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_pro_sun_d_serum_sku160124_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_pro_sun_d_serum_15ml_sku160124_3.png",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_pro_sun_d_serum_15ml_sku160124_1.png",
    ],
  },
  {
    name: "Esse Hyaluronic Serum",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_hyaluronic_serum_15ml_sku69084v1_2.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_hyaluronic_serum_15ml_sku69084v1.jpg",
    ],
  },
  {
    name: "Esse Sunscreen",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_sunscreen_sku69002_.jpg",
    ],
  },
  {
    name: "Esse Lip Conditioner",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_lip_conditioner_sku2599_.jpg",
    ],
  },
  {
    name: "Esse Light Moisturiser (Oily & Combination Skin)",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_light_moisturiser_sku67.jpg",
    ],
  },
  {
    name: "Esse Repair Oil (Tissue Oil)",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_repair_oil_tissue_oil_sku72_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/_/e/_esse_repair_oil_tissue_oil_sku72_.jpg",
    ],
  },
  {
    name: "Esse Hydrating Mist",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_mist_sku73.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/400x400/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_mist_sku73.jpg",
    ],
  },
  {
    name: "Esse Eye & Lip Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_eye_lip_cream_sku80.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_eye_lip_cream_sku80.jpg",
    ],
  },
  {
    name: "Esse Cream Mask",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cream_mask_sku495_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_cream_mask_sku495_.jpg",
    ],
  },
  {
    name: "Esse Cocoa Exfoliator",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cocoa_exfoliator_sku555.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cocoa_exfoliator_sku555.jpg",
    ],
  },
  {
    name: "Esse Dry Skin Trial/Travel Set",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x630/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_dry_skin_trial_travel_set_sku1935v4_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_dry_skin_trial_travel_set_sku1935v4_.jpg",
    ],
  },
  {
    name: "Esse Omega Deep Moisturisers (Normal/Combination Skin)",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_omega_deep_moisturisers_sku2019_1.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/e/s/esse_omega_deep_moisturisers_sku2019.jpg",
    ],
  },
  {
    name: "Esse Cream Cleanser (Normal/Combination Skin)",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/small_image/210x/9df78eab33525d08d6e5fb8d27136e95/e/s/esse_cream_cleanser_normalcombination_skin_100ml_sku66v1_2.jpg",
    ],
  },
  {
    name: "Esse Hand Cream",
    imageUrls: [
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/image/1200x600/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_hand_cream_sku6808_.jpg",
      "https://www.faithful-to-nature.co.za/media/catalog/product/cache/1/thumbnail/9df78eab33525d08d6e5fb8d27136e95/_/e/_esse_hand_cream_sku6808_.jpg",
    ],
  },
];
