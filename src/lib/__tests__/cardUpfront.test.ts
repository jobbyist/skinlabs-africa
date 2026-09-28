import { describe, expect, test } from "bun:test";
import { weightedPick } from "../pricing-config";
import { CARD_UPFRONT_VARIANT, isCardUpfrontVariant } from "../cardUpfront";

const variants = [
  { variant_key: CARD_UPFRONT_VARIANT, traffic_weight: 0 },
  { variant_key: "control", traffic_weight: 100 },
];

describe("card_upfront experiment", () => {
  test("a weight-0 variant is never picked, even on a zero roll", () => {
    for (const r of [0, 0.000001, 0.5, 0.999999]) expect(weightedPick(variants, () => r)).toBe("control");
  });
  test("once weighted, it gets its share", () => {
    const on = [{ variant_key: CARD_UPFRONT_VARIANT, traffic_weight: 10 }, { variant_key: "control", traffic_weight: 90 }];
    expect(weightedPick(on, () => 0.05)).toBe(CARD_UPFRONT_VARIANT);
    expect(weightedPick(on, () => 0.5)).toBe("control");
  });
  test("all-zero weights fall back to control", () => {
    expect(weightedPick([{ variant_key: CARD_UPFRONT_VARIANT, traffic_weight: 0 }], () => 0)).toBe("control");
  });
  test("variant check", () => {
    expect(isCardUpfrontVariant("card_upfront")).toBe(true);
    expect(isCardUpfrontVariant("control")).toBe(false);
    expect(isCardUpfrontVariant(null)).toBe(false);
  });
});
