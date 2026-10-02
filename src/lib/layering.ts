/**
 * AM/PM layering order. Pure: classifies a routine step by its name/product
 * text and sorts thinnest → thickest, with general (cosmetic, non-clinical)
 * timing tips. Unknown steps keep their place in the middle.
 */
export type LayerKind =
  | "cleanser" | "toner" | "exfoliant" | "treatment" | "serum" | "eye"
  | "moisturiser" | "oil" | "sunscreen" | "other";

interface LayerRule { kind: LayerKind; rank: number; pattern: RegExp; tip: string; amOnly?: boolean; pmOnly?: boolean }

const RULES: LayerRule[] = [
  { kind: "sunscreen", rank: 90, pattern: /spf|sunscreen|sun ?block|sun protect/i, tip: "Last in the morning. Use two finger-lengths for face and neck and reapply every 2 hours outdoors.", amOnly: true },
  { kind: "cleanser", rank: 10, pattern: /cleans|wash|micellar|balm/i, tip: "Start on clean skin. Pat dry before the next step." },
  { kind: "exfoliant", rank: 25, pattern: /exfoli|aha|bha|glycolic|lactic|salicylic|peel/i, tip: "Evenings, a few times a week. Skip retinoids on the same night if your skin is sensitive." },
  { kind: "toner", rank: 20, pattern: /toner|essence|mist/i, tip: "Thin and watery, so it goes on first after cleansing." },
  { kind: "treatment", rank: 35, pattern: /retin|tretinoin|adapalene|azelaic|benzoyl|treatment|spot/i, tip: "Apply to dry skin, a pea-sized amount. Let it settle about a minute.", pmOnly: true },
  { kind: "serum", rank: 40, pattern: /serum|vitamin c|niacinamide|hyaluronic|ampoule|arbutin|tranexamic/i, tip: "Thinnest to thickest if you use more than one. Give each about 30–60 seconds." },
  { kind: "eye", rank: 50, pattern: /eye/i, tip: "Tap gently around the orbital bone before moisturiser." },
  { kind: "moisturiser", rank: 60, pattern: /moistur|cream|lotion|gel|hydrat/i, tip: "Seals in what's underneath. Wait a minute before sunscreen in the morning." },
  { kind: "oil", rank: 70, pattern: /oil|sleeping mask|occlusive/i, tip: "Oils go over water-based layers, never under them." },
];

export interface LayeredStep { id: string; label: string; product?: string | null; kind: LayerKind; rank: number; tip: string; warning?: string }

export function classifyStep(text: string): LayerRule | null {
  return RULES.find((r) => r.pattern.test(text)) ?? null;
}

export function layerSteps(
  steps: Array<{ id: string; step_name: string; product_name?: string | null }>,
  slot: "am" | "pm",
): LayeredStep[] {
  return steps
    .map((s, i) => {
      const rule = classifyStep(`${s.step_name} ${s.product_name ?? ""}`);
      let warning: string | undefined;
      if (rule?.amOnly && slot === "pm") warning = "Sunscreen isn't needed at night.";
      if (rule?.pmOnly && slot === "am") warning = "Usually an evening step — sunlight can make it less effective or more irritating.";
      return {
        id: s.id,
        label: s.step_name,
        product: s.product_name,
        kind: rule?.kind ?? "other",
        rank: rule?.rank ?? 45 + i * 0.01,
        tip: rule?.tip ?? "Apply in order of texture: thinnest first.",
        warning,
      };
    })
    .sort((a, b) => a.rank - b.rank);
}
