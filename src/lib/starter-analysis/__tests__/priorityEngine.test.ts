import { describe, expect, test } from "bun:test";
import { priorityLabel, rankPriorities } from "../priorityEngine";
import type { NormalisedProfile } from "../types";

const profile = (overrides: Partial<NormalisedProfile> = {}): NormalisedProfile => ({
  skinType: "combination",
  primaryConcern: "acne",
  secondaryConcerns: [],
  sensitivityTendency: "low",
  barrierTendency: "supported",
  activeTolerance: "tolerant",
  routineMaturity: "intermediate",
  skinBehaviour: "stable",
  maintenanceOrientation: "corrective",
  primaryGoal: "improve_appearance",
  secondaryGoal: null,
  mstTone: null,
  ...overrides,
});

describe("rankPriorities", () => {
  test("primary concern always ranks #1", () => {
    const result = rankPriorities(profile());
    expect(result.items[0].key).toBe("breakouts");
    expect(result.items[0].rank).toBe(1);
    expect(result.items[0].level).toBe("high");
  });

  test("ranks are contiguous starting at 1, never just answer order", () => {
    const result = rankPriorities(profile({ secondaryConcerns: ["dryness", "visible_pores"] }));
    const ranks = result.items.map((i) => i.rank);
    expect(ranks).toEqual(Array.from({ length: ranks.length }, (_, i) => i + 1));
  });

  test("high sensitivity + needs_support barrier boosts barrier_support above active-driven secondary concerns", () => {
    const result = rankPriorities(
      profile({
        primaryConcern: "brightening",
        sensitivityTendency: "high",
        barrierTendency: "needs_support",
        secondaryConcerns: ["texture"],
      }),
    );
    const barrierRank = result.items.find((i) => i.key === "barrier_support")?.rank;
    const textureRank = result.items.find((i) => i.key === "texture")?.rank;
    expect(barrierRank).toBeDefined();
    expect(barrierRank!).toBeLessThan(textureRank!);
  });

  test("high sensitivity applies the active-driven deprioritisation rule; low sensitivity doesn't", () => {
    const sensitive = rankPriorities(profile({ primaryConcern: "brightening", sensitivityTendency: "high", secondaryConcerns: ["texture"] }));
    const nonSensitive = rankPriorities(profile({ primaryConcern: "brightening", sensitivityTendency: "low", secondaryConcerns: ["texture"] }));
    expect(sensitive.items.find((i) => i.key === "texture")!.reason).toMatch(/deprioritised/i);
    expect(nonSensitive.items.find((i) => i.key === "texture")!.reason).not.toMatch(/deprioritised/i);
  });

  test("low sensitivity + pigmentation primary boosts tone-evening priority", () => {
    const result = rankPriorities(profile({ primaryConcern: "brightening", sensitivityTendency: "low" }));
    expect(result.items[0].key).toBe("uneven_tone");
    expect(result.items[0].level).toBe("high");
  });

  test("maintenance orientation with no active concerns surfaces a maintenance priority", () => {
    const result = rankPriorities(
      profile({ primaryConcern: "sensitivity", sensitivityTendency: "low", barrierTendency: "supported", maintenanceOrientation: "maintenance" }),
    );
    expect(result.items.some((i) => i.key === "maintenance")).toBe(true);
  });

  test("never produces duplicate concern keys", () => {
    const result = rankPriorities(profile({ secondaryConcerns: ["breakouts", "dryness"] })); // breakouts duplicates primary key on purpose
    const keys = result.items.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("scoringVersion is stamped on every result", () => {
    const result = rankPriorities(profile());
    expect(result.scoringVersion).toBeTruthy();
  });

  test("is deterministic for identical input", () => {
    const p = profile({ secondaryConcerns: ["dryness"] });
    expect(rankPriorities(p)).toEqual(rankPriorities(p));
  });
});

describe("priorityLabel", () => {
  test("returns a human label for every concern key", () => {
    const keys: Array<Parameters<typeof priorityLabel>[0]> = [
      "breakouts", "dryness", "dehydration", "uneven_tone", "pigmentation",
      "texture", "oiliness", "sensitivity", "visible_pores", "barrier_support", "maintenance",
    ];
    for (const key of keys) expect(priorityLabel(key)).toBeTruthy();
  });
});
