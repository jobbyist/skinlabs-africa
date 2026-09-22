import { describe, expect, test } from "bun:test";
import { classifyInteractionRows, deriveSeasonalGuidance, type RoutineConflictRow } from "../conflictMatcher";
import type { RoutineIngredient } from "../conflictMatcher";

const ingredient = (overrides: Partial<RoutineIngredient> = {}): RoutineIngredient => ({
  ingredientId: "id-placeholder",
  slug: null,
  inciName: "Placeholder",
  commonName: null,
  category: null,
  isKeyIngredient: true,
  fromProducts: [{ slot: "Serum", productId: "p1", productName: "Test Product" }],
  ...overrides,
});

const retinol = ingredient({ ingredientId: "retinol-id", inciName: "Retinol", category: "retinoid" });
const glycolicAcid = ingredient({ ingredientId: "glycolic-id", inciName: "Glycolic Acid", category: "exfoliant-aha" });
const niacinamide = ingredient({ ingredientId: "niacinamide-id", inciName: "Niacinamide", category: "brightening" });
const vitaminC = ingredient({ ingredientId: "vitc-id", inciName: "Ascorbic Acid", category: "antioxidant" });
const unrelated = ingredient({ ingredientId: "unrelated-id", inciName: "Squalane", category: "barrier-lipid" });

const byId = new Map([
  [retinol.ingredientId, retinol],
  [glycolicAcid.ingredientId, glycolicAcid],
  [niacinamide.ingredientId, niacinamide],
  [vitaminC.ingredientId, vitaminC],
  [unrelated.ingredientId, unrelated],
]);

const cautionRow: RoutineConflictRow = {
  ingredient_a_id: retinol.ingredientId,
  ingredient_b_id: glycolicAcid.ingredientId,
  interaction_type: "requires_spacing",
  explanation: "Compounds irritation and dryness.",
  usage_guidance: "Use on alternating nights.",
  source_url: "https://dermnetnz.org/topics/topical-retinoids",
  confidence: "medium",
};

const safeRow: RoutineConflictRow = {
  ingredient_a_id: vitaminC.ingredientId,
  ingredient_b_id: niacinamide.ingredientId,
  interaction_type: "compatible",
  explanation: "Modern derm consensus debunks the older pH-reaction myth.",
  usage_guidance: "Can be layered or used together.",
  source_url: "https://dermnetnz.org/topics/nicotinamide",
  confidence: "medium",
};

describe("classifyInteractionRows", () => {
  test("known caution pair (Retinol + Glycolic Acid) lands in flags, not synergies", () => {
    const { flags, synergies } = classifyInteractionRows([cautionRow], byId);
    expect(flags).toHaveLength(1);
    expect(synergies).toHaveLength(0);
    expect(flags[0].interactionType).toBe("requires_spacing");
  });

  test("known safe/compatible pair (Vitamin C + Niacinamide) lands in synergies, not flags", () => {
    const { flags, synergies } = classifyInteractionRows([safeRow], byId);
    expect(flags).toHaveLength(0);
    expect(synergies).toHaveLength(1);
    expect(synergies[0].interactionType).toBe("compatible");
  });

  test("avoid_combining and enhances also classify correctly", () => {
    const avoidRow: RoutineConflictRow = { ...cautionRow, interaction_type: "avoid_combining" };
    const enhancesRow: RoutineConflictRow = { ...safeRow, interaction_type: "enhances" };
    const { flags, synergies } = classifyInteractionRows([avoidRow, enhancesRow], byId);
    expect(flags).toHaveLength(1);
    expect(synergies).toHaveLength(1);
  });

  test("a pair with no verified relationship (no row at all) simply produces nothing — never inferred", () => {
    const { flags, synergies } = classifyInteractionRows([], byId);
    expect(flags).toHaveLength(0);
    expect(synergies).toHaveLength(0);
  });

  test("a row referencing an ingredient not in the routine's ingredient set is skipped, not guessed at", () => {
    const rowWithUnknown: RoutineConflictRow = { ...cautionRow, ingredient_a_id: "not-in-routine" };
    const { flags, synergies } = classifyInteractionRows([rowWithUnknown], byId);
    expect(flags).toHaveLength(0);
    expect(synergies).toHaveLength(0);
  });

  test("switching a/b order on the row yields the same classified output", () => {
    const swapped: RoutineConflictRow = {
      ...cautionRow,
      ingredient_a_id: glycolicAcid.ingredientId,
      ingredient_b_id: retinol.ingredientId,
    };
    const original = classifyInteractionRows([cautionRow], byId);
    const reordered = classifyInteractionRows([swapped], byId);
    expect(reordered.flags[0].ingredientA.ingredientId).toBe(glycolicAcid.ingredientId);
    expect(reordered.flags[0].ingredientB.ingredientId).toBe(retinol.ingredientId);
    expect(reordered.flags).toHaveLength(original.flags.length);
    expect(reordered.flags[0].interactionType).toBe(original.flags[0].interactionType);
  });

  test("an unrelated ingredient with no interaction rows contributes nothing", () => {
    const { flags, synergies } = classifyInteractionRows([cautionRow, safeRow], byId);
    const involvesUnrelated = [...flags, ...synergies].some(
      (f) => f.ingredientA.ingredientId === unrelated.ingredientId || f.ingredientB.ingredientId === unrelated.ingredientId,
    );
    expect(involvesUnrelated).toBe(false);
  });
});

describe("deriveSeasonalGuidance", () => {
  test("returns a retinoid tip when a retinoid-category ingredient is present", () => {
    const tips = deriveSeasonalGuidance([retinol]);
    expect(tips.some((t) => t.category === "retinoid")).toBe(true);
  });

  test("returns an exfoliant tip for AHA/BHA categories", () => {
    const tips = deriveSeasonalGuidance([glycolicAcid]);
    expect(tips.some((t) => t.category === "exfoliant")).toBe(true);
  });

  test("returns no tips when no recognised category is present", () => {
    const plain = ingredient({ ingredientId: "x", category: null });
    expect(deriveSeasonalGuidance([plain])).toHaveLength(0);
  });

  test("never mentions a specific product or brand — general guidance only", () => {
    const tips = deriveSeasonalGuidance([retinol, glycolicAcid]);
    for (const t of tips) {
      expect(t.tip.toLowerCase()).not.toContain("skinlabs");
      expect(t.tip).not.toMatch(/\bR\d+\b/); // no ZAR price
    }
  });
});
