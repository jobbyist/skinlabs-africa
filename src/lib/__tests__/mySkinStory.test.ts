import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildPredeterminedRecommendation, FOCUS_ACTIVES, type FormulaConcern, type FormulaSkinType } from "@/data/formulaResults";
import { assembleStarterAnalysisResult } from "@/lib/starter-analysis/resultEngine";
import {
  cleanLabel,
  fitLine,
  formatStoryDate,
  MAX_CONCERNS,
  MAX_INGREDIENTS,
  sanitiseStoryData,
  wrapText,
  STORY_CTA,
  STORY_DISCLAIMER,
  type MySkinStoryData,
} from "@/lib/skynn/my-skin-story";
import { buildMySkinStoryData, storyVersionBadge } from "@/lib/skynn/my-skin-story-data";
import { SKYNN_FEATURE_VERSION } from "@/lib/skynn/terminology";
import { STORY_SHARE_URL } from "@/lib/skynn/share-my-skin-story";

const measure = (t: string) => t.length * 10;

const base: MySkinStoryData = {
  skinType: "combination",
  concerns: ["Pigmentation", "Dehydration", "Sensitivity", "Texture"],
  ingredients: ["Niacinamide", "Azelaic acid", "Ceramides", "Retinol"],
  assessmentDate: new Date(2026, 9, 4),
  aiVersion: "SKYNN AI v2.2 · BETA",
};

describe("sanitising", () => {
  test("cleanLabel trims, collapses whitespace, strips control/bidi chars and truncates", () => {
    expect(cleanLabel("  Dry \n  skin‮ ")).toBe("Dry skin");
    expect(cleanLabel("x".repeat(100), 10)).toBe("xxxxxxxxx…");
    expect(cleanLabel(undefined)).toBe("");
  });

  test("limits concerns and actives to 3 and dedupes", () => {
    const s = sanitiseStoryData({ ...base, concerns: ["A", "a", "B", "C", "D"] });
    expect(s.concerns).toEqual(["A", "B", "C"]);
    expect(sanitiseStoryData(base).concerns).toHaveLength(MAX_CONCERNS);
    expect(sanitiseStoryData(base).ingredients).toHaveLength(MAX_INGREDIENTS);
  });

  test("MST appears only when valid", () => {
    expect(sanitiseStoryData(base).skinTone).toBeNull();
    expect(sanitiseStoryData({ ...base, skinTone: { level: 5, hex: "#d7bd96" } }).skinTone?.level).toBe(5);
    expect(sanitiseStoryData({ ...base, skinTone: { level: 11, hex: "#d7bd96" } }).skinTone).toBeNull();
    expect(sanitiseStoryData({ ...base, skinTone: { level: 4, hex: "red; x" } }).skinTone).toBeNull();
  });

  test("date label", () => {
    expect(formatStoryDate(new Date(2026, 9, 4))).toBe("04 OCT 2026");
  });
});

describe("text helpers", () => {
  test("wrapText never exceeds the width or line count, even for one huge word", () => {
    for (const text of ["Post-Inflammatory Hyperpigmentation and uneven looking tone", "W".repeat(80), "a b c"]) {
      const lines = wrapText(text, 200, measure, 2);
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const l of lines) expect(measure(l)).toBeLessThanOrEqual(200);
    }
  });

  test("fitLine truncates with an ellipsis", () => {
    expect(fitLine("short", 200, measure)).toBe("short");
    const out = fitLine("a very long label indeed that overflows", 200, measure);
    expect(measure(out)).toBeLessThanOrEqual(200);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("data mapping", () => {
  const result = assembleStarterAnalysisResult({
    analysisId: "analysis-id-should-never-appear",
    answers: { q1: 1, q9: 1, q6: 0 },
    mstTone: 6,
    hasPhoto: true,
    context: { status: null, detail: null },
    priorityPreference: null,
    revealProducts: true,
  });

  test("version badge comes from the single version source", () => {
    expect(storyVersionBadge()).toBe("SKYNN AI v2.2 · BETA");
    expect(SKYNN_FEATURE_VERSION).toBe("2.2.0-beta");
  });

  test("no MST unless the member picked one; never inferred", () => {
    expect(buildMySkinStoryData({ skinType: "combination", result: null, mstTone: null }).skinTone).toBeUndefined();
    expect(buildMySkinStoryData({ skinType: "combination", result: null, mstTone: 5 }).skinTone?.level).toBe(5);
  });

  test("without a result nothing is invented", () => {
    const d = buildMySkinStoryData({ skinType: "dry", result: null, mstTone: null });
    expect(d.concerns).toEqual([]);
    expect(d.ingredients).toEqual([]);
    expect(d.routineFocus).toBeUndefined();
    expect(d.secondary).toBeUndefined();
  });

  test("a real result maps to safe cosmetic fields only", () => {
    const d = buildMySkinStoryData({ skinType: "combination", result, mstTone: 6 });
    const s = sanitiseStoryData(d);
    expect(s.concerns.length).toBeGreaterThan(0);
    expect(s.concerns.length).toBeLessThanOrEqual(3);
    expect(s.ingredients).toEqual(FOCUS_ACTIVES[result.primaryConcern].slice(0, 3));
    expect(s.skinTone?.level).toBe(6);
    const flat = JSON.stringify(d);
    expect(flat).not.toContain(result.analysisId);
  });
});

describe("focus actives are grounded in the recommendation text", () => {
  const skins: FormulaSkinType[] = ["oily", "combination", "normal", "dry"];
  for (const concern of Object.keys(FOCUS_ACTIVES) as FormulaConcern[]) {
    test(concern, () => {
      for (const skin of skins) {
        const text = buildPredeterminedRecommendation(skin, concern).toLowerCase();
        for (const active of FOCUS_ACTIVES[concern]) expect(text).toContain(active.toLowerCase());
      }
    });
  }
});

describe("privacy and claims", () => {
  const src = readFileSync("src/lib/skynn/my-skin-story.ts", "utf8");
  const dataSrc = readFileSync("src/lib/skynn/my-skin-story-data.ts", "utf8");
  const shareSrc = readFileSync("src/lib/skynn/share-my-skin-story.ts", "utf8");

  test("the card input has no identity fields and the mapper never reads them", () => {
    for (const forbidden of ["email", "userId", "user_id", "analysisId", "contactName", "skinImage", "phone", "username"]) {
      expect(src).not.toContain(`${forbidden}:`);
      expect(dataSrc).not.toContain(`.${forbidden}`);
    }
  });

  test("no uploads or network calls", () => {
    for (const f of [src, dataSrc, shareSrc]) {
      expect(f).not.toMatch(/fetch\(|supabase|XMLHttpRequest|sendBeacon/);
    }
  });

  test("share link is the public entry point with no query string", () => {
    expect(STORY_SHARE_URL).toBe("https://skinlabs.co.za/skynn-ai");
  });

  test("fixed copy has no diagnostic or clinical claims", () => {
    for (const text of [STORY_CTA, STORY_DISCLAIMER.replace("not medical advice", "")]) {
      expect(text).not.toMatch(/diagnos|disease|medical condition|treatment|cure/i);
    }
    expect(STORY_CTA.toLowerCase()).not.toMatch(/diagnos|disease|treatment/);
    expect(STORY_DISCLAIMER.toLowerCase()).toContain("not medical advice");
  });
});
