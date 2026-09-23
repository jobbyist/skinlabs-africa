/**
 * Monk Skin Tone tier + fairness group (SKYNN AI v2 framework §6/§9).
 *
 * MST is self-selected (never inferred) and is the PRIMARY tone descriptor.
 * Fairness groups follow the framework's evaluation strata (1-3 / 4-6 /
 * 7-10), which is deliberately different from the Starter Analysis's
 * older 1-3 / 4-7 / 8-10 buckets in src/data/mstScale.ts — the v2 engine
 * stratifies on the framework's groups; the Starter pipeline is unchanged.
 * The sun-response answer is Fitzpatrick-style CONTEXT for photosensitivity
 * only, never a proxy for tone, race or colour.
 */

export type MstGroup = "1-3" | "4-6" | "7-10";

export interface MstResult {
  tier: number | null;
  group: MstGroup | null;
  /** MST 7-10: weight guidance toward PIH, melasma, PFB, keloid risk and
   *  visible-light photoprotection (framework §5C). */
  skinOfColourPriority: boolean;
  /** MST 5-10 or melasma: iron-oxide (tinted) SPF indicated (§5D). */
  ironOxideSpfIndicated: boolean;
  sunResponse: string | null;
  source: "self_reported";
}

export function mstGroup(tier: number | null): MstGroup | null {
  if (tier === null) return null;
  if (tier <= 3) return "1-3";
  if (tier <= 6) return "4-6";
  return "7-10";
}

export function scoreMst(responses: Record<string, unknown>, melasmaPresent: boolean): MstResult {
  const raw = responses["mst_tone"];
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  const tier = Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
  const sun = responses["sun_response"];
  return {
    tier,
    group: mstGroup(tier),
    skinOfColourPriority: tier !== null && tier >= 7,
    ironOxideSpfIndicated: (tier !== null && tier >= 5) || melasmaPresent,
    sunResponse: typeof sun === "string" ? sun : null,
    source: "self_reported",
  };
}
