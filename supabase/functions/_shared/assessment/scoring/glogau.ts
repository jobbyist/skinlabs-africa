/**
 * Glogau-style photoageing type I-IV (SKYNN AI v2 framework §6), from a
 * single self-selected plain-language description. Self-reported only.
 */

export type GlogauType = "I" | "II" | "III" | "IV";

const GLOGAU: Record<string, { type: GlogauType; label: string }> = {
  type_i: { type: "I", label: "No wrinkles — early or no visible photoageing" },
  type_ii: { type: "II", label: "Wrinkles in motion — early to moderate photoageing" },
  type_iii: { type: "III", label: "Wrinkles at rest — advanced photoageing" },
  type_iv: { type: "IV", label: "Only wrinkles — severe photoageing" },
};

export interface GlogauResult {
  type: GlogauType | null;
  label: string | null;
  source: "self_reported";
}

export function scoreGlogau(responses: Record<string, unknown>): GlogauResult {
  const answer = responses["glogau_style"];
  const match = typeof answer === "string" ? GLOGAU[answer] : undefined;
  return { type: match?.type ?? null, label: match?.label ?? null, source: "self_reported" };
}
