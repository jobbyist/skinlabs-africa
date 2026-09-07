/**
 * The Monk Skin Tone (MST) Scale — a 10-point skin-tone scale developed by Dr. Ellis
 * Monk (Harvard) and published by Google for inclusive technology evaluation.
 * Reference: https://skintone.google/ · https://blog.google/innovation-and-ai/products/monk-skin-tone-scale/
 *
 * SKYNN AI treats MST strictly as a self-reported FAIRNESS/EVALUATION dimension, never
 * as a diagnostic input — see supabase/SCHEMA.md and the product's standing instruction
 * against fabricating or over-claiming AI performance. It is not a proxy for race,
 * ethnicity or identity, and selecting one is always optional.
 */
export interface MstSwatch {
  level: number;
  hex: string;
}

export const MST_SCALE: MstSwatch[] = [
  { level: 1, hex: "#f6ede4" },
  { level: 2, hex: "#f3e7db" },
  { level: 3, hex: "#f7ead0" },
  { level: 4, hex: "#eadaba" },
  { level: 5, hex: "#d7bd96" },
  { level: 6, hex: "#a07e56" },
  { level: 7, hex: "#825c43" },
  { level: 8, hex: "#604134" },
  { level: 9, hex: "#3a312a" },
  { level: 10, hex: "#292420" },
];

export type MstSource = "user_reported" | "model_estimated";
