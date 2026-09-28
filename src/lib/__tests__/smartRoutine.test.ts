import { describe, expect, test } from "bun:test";
import { buildMemberSkinProfile, hasSkinProfile } from "@/lib/skynn/memberSkinProfile";
import { buildSmartRoutine, fromReport, matchShelfProduct, routineStrings } from "@/lib/smartRoutine/engine";
import { productReviews } from "@/data/reviews";

const BASIC = {
  id: "rec-1",
  created_at: "2026-09-20T08:00:00Z",
  mst_tone: 8,
  result_payload: {
    skinType: "oily",
    primaryConcern: "acne",
    profile: { skinType: "oily", primaryConcern: "acne", secondaryConcerns: ["oiliness"], sensitivityTendency: "moderate", mstTone: 8 },
    preferences: { complexity: "moderate", priority: null, budgetConscious: true },
    answers: { q11: 0 },
  },
};

const ADVANCED = {
  id: "sess-1",
  submitted_at: "2026-09-27T08:00:00Z",
  responses: {
    skin_type: "combination",
    primary_concerns: ["uneven_tone_pigmentation", "breakouts_acne"],
    sensitivity_level: 4,
    climate: "highveld_dry_winter",
    spf_habit: "only_when_sunny",
    actives_in_use: ["bha_exfoliant"],
    exfoliation_frequency: "daily",
    known_irritating_ingredients: "fragrance, essential oils",
    pregnancy_status: "not_applicable",
    current_products: [{ productName: `${productReviews.find((p) => p.category === "Cleanser")!.brand} ${productReviews.find((p) => p.category === "Cleanser")!.product_name}` }],
  },
};

const NOW = new Date("2026-07-01T10:00:00Z"); // winter in South Africa

describe("member skin profile", () => {
  test("Advanced answers win over the Basic analysis; provenance is recorded", () => {
    const p = buildMemberSkinProfile({ basic: BASIC, advanced: ADVANCED, profileAllergies: ["nut oils"] });
    expect(p.skinType).toBe("combination");
    expect(p.provenance.skinType).toBe("advanced");
    expect(p.primaryConcern).toBe("brightening");
    expect(p.sensitivity).toBe("high");
    expect(p.climate).toBe("highveld_dry_winter");
    expect(p.budgetConscious).toBe(true);
    expect(p.provenance.budgetConscious).toBe("basic");
    expect(p.avoid).toEqual(expect.arrayContaining(["fragrance", "essential oils", "nut oils"]));
    expect(p.mstTone).toBe(8);
    expect(hasSkinProfile(p)).toBe(true);
  });

  test("Basic only", () => {
    const p = buildMemberSkinProfile({ basic: BASIC });
    expect(p.skinType).toBe("oily");
    expect(p.primaryConcern).toBe("acne");
    expect(p.climate).toBe("hot_humid");
    expect(p.provenance.skinType).toBe("basic");
  });

  test("nothing submitted → empty profile, never throws on junk", () => {
    expect(hasSkinProfile(buildMemberSkinProfile({}))).toBe(false);
    for (const junk of [null, "x", [], { profile: 3 }]) {
      expect(() => buildMemberSkinProfile({ basic: { ...BASIC, result_payload: junk }, advanced: { id: "s", submitted_at: null, responses: junk as never } })).not.toThrow();
    }
  });
});

describe("Smart Routine engine", () => {
  const profile = buildMemberSkinProfile({ basic: BASIC, advanced: ADVANCED });

  test("every product is a real reviewed product", () => {
    const r = buildSmartRoutine(profile, { now: NOW });
    const ids = new Set(productReviews.map((p) => p.id));
    for (const s of [...r.am, ...r.pm]) if (s.productSlug) expect(ids.has(s.productSlug)).toBe(true);
    expect(r.am.at(-1)?.step).toBe("Protect");
    expect(r.source).toBe("rule_based");
    expect(r.season).toBe("winter");
  });

  test("never picks a product containing something the member avoids", () => {
    const avoidAll = buildMemberSkinProfile({ basic: BASIC, profileAllergies: ["niacinamide", "glycerin"] });
    const r = buildSmartRoutine(avoidAll, { now: NOW });
    for (const s of [...r.am, ...r.pm]) {
      if (!s.productSlug) continue;
      const p = productReviews.find((x) => x.id === s.productSlug)!;
      expect(p.key_ingredients.some((i) => /niacinamide|glycerin/i.test(i))).toBe(false);
    }
  });

  test("pregnancy: no retinoid or hydroquinone products, and it says so", () => {
    const preg = buildMemberSkinProfile({
      basic: { ...BASIC, result_payload: { ...BASIC.result_payload, primaryConcern: "aging", profile: { ...BASIC.result_payload.profile, primaryConcern: "aging" } } },
      advanced: { ...ADVANCED, responses: { ...ADVANCED.responses, primary_concerns: ["fine_lines_aging"], pregnancy_status: "pregnant" } },
    });
    const r = buildSmartRoutine(preg, { now: NOW });
    for (const s of [...r.am, ...r.pm]) {
      if (!s.productSlug) continue;
      const p = productReviews.find((x) => x.id === s.productSlug)!;
      expect(p.key_ingredients.some((i) => /retin|tretinoin|adapalene|hydroquinone/i.test(i))).toBe(false);
    }
    expect(r.notes.join(" ")).toContain("leaves out retinoids");
  });

  test("sensitive skin gets two treatment nights; daily exfoliation gets a gentle note", () => {
    const r = buildSmartRoutine(profile, { now: NOW });
    const treatNights = r.weekly.filter((d) => d.pm.includes("Treatment")).length;
    expect(treatNights === 0 || treatNights === 2).toBe(true);
    expect(r.notes.join(" ")).toContain("exfoliate daily");
    for (const d of r.weekly) {
      expect(d.pm.includes("Treatment") && d.pm.some((x) => x.startsWith("Exfoliate"))).toBe(false);
    }
  });

  test("a reviewed product on the member's shelf is kept", () => {
    const r = buildSmartRoutine(profile, { now: NOW });
    expect(r.am.find((s) => s.step === "Cleanse")?.fromShelf).toBe(true);
    expect(matchShelfProduct("xx")).toBeNull();
  });

  test("wording stays cosmetic: no diagnosis, cure or prescription language", () => {
    const banned = /\b(diagnos\w*|cure[sd]?|curing|prescri\w*|disease|eczema|psoriasis|rosacea|dermatitis|infection|heal(s|ing)?|clinically proven|guarantee\w*)\b/i;
    const all = [
      buildSmartRoutine(profile, { now: NOW }),
      buildSmartRoutine(buildMemberSkinProfile({ basic: BASIC }), { now: new Date("2026-01-10T10:00:00Z") }),
      buildSmartRoutine(buildMemberSkinProfile({}), { now: new Date("2026-10-10T10:00:00Z") }),
    ];
    for (const r of all) for (const s of routineStrings(r)) expect(s).not.toMatch(banned);
  });

  test("an approved report's steps replace the rule-based ones", () => {
    const r = fromReport(
      profile,
      [{ step: "Cleanse", product_type: "gentle gel cleanser", guidance: "Morning rinse.", citations: [] }],
      [{ step: "Moisturise", product_type: "barrier cream", guidance: "Night layer.", citations: [] }],
      { now: NOW },
    );
    expect(r.source).toBe("advanced_report");
    expect(r.am).toHaveLength(1);
    expect(r.pm[0].productType).toBe("barrier cream");
    expect(r.notes.length).toBeGreaterThan(0);
  });
});
