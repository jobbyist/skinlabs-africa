/**
 * Active Ingredient Conflict Matcher — Glow Insider & VIP exclusive.
 *
 * Scans a member's SKYNN AI generated routine (GroundedRoutine, real
 * ProductReview picks — see src/lib/skynnProductMatch.ts) for incompatible
 * active-ingredient pairs, surfaces real synergy pairs already present, and
 * gives general seasonal guidance. Everything here is DB-driven: every
 * ingredient a product is said to contain comes from `product_ingredients`
 * (joined via `products.slug === ProductReview.id`, confirmed 1:1 with the
 * live catalogue), and every flag/synergy comes from `ingredient_interactions`
 * via the `get_routine_conflicts` RPC — never an LLM guess. Scoped to the
 * SKYNN AI generated routine only (not the free-text manual dashboard Routine
 * tracker, which has no product linkage to scan safely) — see CLAUDE.md.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { GroundedPick, GroundedRoutine } from "@/lib/skynnProductMatch";

type InteractionType = Database["public"]["Enums"]["ingredient_interaction_type"];

export interface RoutineIngredient {
  ingredientId: string;
  inciName: string;
  commonName: string | null;
  category: string | null;
  isKeyIngredient: boolean;
  fromProducts: { slot: string; productId: string; productName: string }[];
}

export interface ConflictFlag {
  interactionType: InteractionType;
  explanation: string | null;
  usageGuidance: string | null;
  sourceUrl: string | null;
  confidence: Database["public"]["Enums"]["confidence_level"] | null;
  ingredientA: RoutineIngredient;
  ingredientB: RoutineIngredient;
}

export interface SeasonalTip {
  category: string;
  tip: string;
}

export interface ConflictMatcherResult {
  routineIngredients: RoutineIngredient[];
  flags: ConflictFlag[];
  synergies: ConflictFlag[];
  seasonalTips: SeasonalTip[];
}

/** Resolves every real product in a GroundedRoutine to its current formulation's
 *  actual ingredients via product_ingredients — the same join documented in
 *  supabase/SCHEMA.md's example queries. */
async function resolveRoutineIngredients(routine: GroundedRoutine): Promise<RoutineIngredient[]> {
  const picks: GroundedPick[] = [...routine.am, ...routine.pm];
  const uniqueProductIds = [...new Set(picks.map((p) => p.product.id))];
  if (uniqueProductIds.length === 0) return [];

  const { data, error } = await supabase
    .from("product_ingredients")
    .select(
      "is_key_ingredient, product_versions!inner(is_current, products!inner(id, slug, name)), ingredients(id, inci_name, common_name, category)",
    )
    .eq("product_versions.is_current", true)
    .in("product_versions.products.slug", uniqueProductIds);

  if (error) throw error;

  const byIngredient = new Map<string, RoutineIngredient>();
  for (const row of data ?? []) {
    const ingredient = row.ingredients as { id: string; inci_name: string; common_name: string | null; category: string | null } | null;
    const pv = row.product_versions as { products: { id: string; slug: string; name: string } | null } | null;
    const product = pv?.products;
    if (!ingredient || !product) continue;

    const pick = picks.find((p) => p.product.id === product.slug);
    const slot = pick?.slot ?? "";

    const existing = byIngredient.get(ingredient.id);
    if (existing) {
      if (!existing.fromProducts.some((fp) => fp.productId === product.id)) {
        existing.fromProducts.push({ slot, productId: product.id, productName: product.name });
      }
      existing.isKeyIngredient = existing.isKeyIngredient || !!row.is_key_ingredient;
    } else {
      byIngredient.set(ingredient.id, {
        ingredientId: ingredient.id,
        inciName: ingredient.inci_name,
        commonName: ingredient.common_name,
        category: ingredient.category,
        isKeyIngredient: !!row.is_key_ingredient,
        fromProducts: [{ slot, productId: product.id, productName: product.name }],
      });
    }
  }
  return [...byIngredient.values()];
}

/** General, hedged, non-fabricated seasonal guidance keyed on which ingredient
 *  categories are present in the routine — same precedent as deriveMstSignal()
 *  in src/data/formulaResults.ts: no specific product or performance claim,
 *  just commonly-cited dermatological seasonal context for South Africa's
 *  high-UV climate. */
export function deriveSeasonalGuidance(ingredients: RoutineIngredient[]): SeasonalTip[] {
  const categories = new Set(ingredients.map((i) => i.category).filter(Boolean) as string[]);
  const tips: SeasonalTip[] = [];

  if (categories.has("retinoid") || categories.has("retinoid-alternative")) {
    tips.push({
      category: "retinoid",
      tip: "Retinoids increase photosensitivity — many dermatologists suggest applying them only at night and pairing with daily SPF, which matters even more through South Africa's high-UV summer months.",
    });
  }
  if (categories.has("exfoliant-aha") || categories.has("exfoliant-bha")) {
    tips.push({
      category: "exfoliant",
      tip: "Exfoliating acids also raise sun sensitivity. Some people find they can tolerate a slightly higher frequency in cooler, lower-UV winter months and prefer to ease off during peak summer sun — daily SPF stays essential either way.",
    });
  }
  if (categories.has("humectant")) {
    tips.push({
      category: "humectant",
      tip: "Humectants like hyaluronic acid draw in moisture from the air — in very dry, low-humidity conditions (common on the Highveld in winter) they work best sealed under a moisturiser rather than left to draw from dry surrounding air.",
    });
  }
  if (categories.has("barrier-lipid")) {
    tips.push({
      category: "barrier-lipid",
      tip: "Richer barrier/occlusive products are commonly favoured in dry winter conditions and can feel heavy in humid coastal summer heat — worth adjusting texture seasonally rather than using one formulation year-round.",
    });
  }
  return tips;
}

export interface RoutineConflictRow {
  ingredient_a_id: string;
  ingredient_b_id: string;
  interaction_type: InteractionType;
  explanation: string | null;
  usage_guidance: string | null;
  source_url: string | null;
  confidence: Database["public"]["Enums"]["confidence_level"] | null;
}

/** Pure classification of get_routine_conflicts() rows into caution flags
 *  (avoid_combining/requires_spacing) vs positive synergies (enhances/
 *  compatible/buffers), resolved against the routine's known ingredients.
 *  A row referencing an ingredient not in `byId` is silently skipped rather
 *  than guessed at. Order-independent: swapping a row's a/b ids produces the
 *  same flags/synergies output. */
export function classifyInteractionRows(
  rows: RoutineConflictRow[],
  byId: Map<string, RoutineIngredient>,
): { flags: ConflictFlag[]; synergies: ConflictFlag[] } {
  const flags: ConflictFlag[] = [];
  const synergies: ConflictFlag[] = [];

  for (const row of rows) {
    const a = byId.get(row.ingredient_a_id);
    const b = byId.get(row.ingredient_b_id);
    if (!a || !b) continue;
    const flag: ConflictFlag = {
      interactionType: row.interaction_type,
      explanation: row.explanation,
      usageGuidance: row.usage_guidance,
      sourceUrl: row.source_url,
      confidence: row.confidence,
      ingredientA: a,
      ingredientB: b,
    };
    if (row.interaction_type === "avoid_combining" || row.interaction_type === "requires_spacing") {
      flags.push(flag);
    } else if (row.interaction_type === "enhances" || row.interaction_type === "compatible" || row.interaction_type === "buffers") {
      synergies.push(flag);
    }
  }
  return { flags, synergies };
}

/** Scans a member's SKYNN AI generated routine for real, DB-driven ingredient
 *  conflicts and synergies. Never invents a warning: a pair with no row in
 *  ingredient_interactions simply doesn't appear in flags or synergies. */
export async function analyzeRoutineConflicts(routine: GroundedRoutine): Promise<ConflictMatcherResult> {
  const routineIngredients = await resolveRoutineIngredients(routine);
  if (routineIngredients.length === 0) {
    return { routineIngredients: [], flags: [], synergies: [], seasonalTips: [] };
  }

  const ingredientIds = routineIngredients.map((i) => i.ingredientId);
  const { data, error } = await supabase.rpc("get_routine_conflicts", { p_ingredient_ids: ingredientIds });
  if (error) throw error;

  const byId = new Map(routineIngredients.map((i) => [i.ingredientId, i]));
  const { flags, synergies } = classifyInteractionRows(data ?? [], byId);

  return { routineIngredients, flags, synergies, seasonalTips: deriveSeasonalGuidance(routineIngredients) };
}
