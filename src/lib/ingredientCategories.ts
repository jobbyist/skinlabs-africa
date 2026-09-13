/** Human-readable labels for the ingredient `category` values backfilled in
 *  supabase/migrations/20260913081000_ingredients_intelligence_curated_seed.sql.
 *  Keep in sync with that migration's category set. */
export const INGREDIENT_CATEGORY_LABELS: Record<string, string> = {
  humectant: "Humectant",
  "barrier-lipid": "Barrier & Lipid",
  "exfoliant-aha": "AHA Exfoliant",
  "exfoliant-bha": "BHA Exfoliant",
  "exfoliant-enzyme": "Enzyme Exfoliant",
  retinoid: "Retinoid",
  "retinoid-alternative": "Retinoid Alternative",
  antioxidant: "Antioxidant",
  brightening: "Brightening",
  peptide: "Peptide",
  "soothing-botanical": "Soothing Botanical",
  "sebum-regulator": "Sebum Regulator",
  "uv-filter": "UV Filter",
  "cleansing-base": "Cleansing Base",
  probiotic: "Probiotic",
  "repair-technology": "Repair Technology",
};

export const INGREDIENT_CATEGORY_OPTIONS = Object.entries(INGREDIENT_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const ingredientCategoryLabel = (category: string | null): string =>
  (category && INGREDIENT_CATEGORY_LABELS[category]) || "Uncategorised";
