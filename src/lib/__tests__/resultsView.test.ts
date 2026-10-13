import { describe, expect, test } from "bun:test";
import {
  tabFromHash, hashForTab, identityTag, barrierBadge, cadenceForConcern, weeklyScheduleText, stepMeta, DAY_LABELS,
} from "@/lib/starter-analysis/resultsView";
import { buildPredeterminedRecommendation } from "@/data/formulaResults";

describe("results hub view rules", () => {
  test("tab hash round trip and rejects unknown", () => {
    expect(tabFromHash("#results-routine")).toBe("routine");
    expect(tabFromHash(hashForTab("integrity"))).toBe("integrity");
    expect(tabFromHash("#nope")).toBeNull();
  });
  test("identity tag and barrier badge", () => {
    expect(identityTag("oily", "acne")).toBe("OILY & BREAKOUT-PRONE");
    expect(barrierBadge("needs_support").tone).toBe("watch");
    expect(barrierBadge("uncertain").tone).toBe("unknown");
  });
  test("every concern has 3 phases with valid days", () => {
    for (const c of ["acne", "brightening", "aging", "sensitivity"] as const) {
      const p = cadenceForConcern(c);
      expect(p.map((x) => x.tab)).toEqual(["Weeks 1–2", "Weeks 3–4", "Ongoing"]);
      for (const ph of p) for (const r of ph.rows) for (const d of r.days) expect(d >= 0 && d < DAY_LABELS.length).toBe(true);
    }
    expect(cadenceForConcern("sensitivity").every((p) => p.rows.length === 0)).toBe(true);
    expect(cadenceForConcern("acne")[0].rows[0].days).toEqual([0, 2, 4]);
  });
  test("schedule text extracted from the recommendation", () => {
    const text = buildPredeterminedRecommendation("oily", "acne", {}, { revealProducts: false });
    expect(weeklyScheduleText(text)).toContain("Weeks 1–2");
  });
  test("step meta", () => {
    expect(stepMeta("SPF").verb).toBe("Protect");
    expect(stepMeta("Weird").verb).toBe("Weird");
  });
});
