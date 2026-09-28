import { describe, expect, test } from "bun:test";
import { formatSastDate, sastDaysUntil, trialBannerState, type TrialBannerInput } from "../trialLifecycle";

// The promo trial ends 2026-10-31T22:00Z = 00:00 on 1 November SAST.
const END = "2026-10-31T22:00:00Z";
const at = (sast: string) => new Date(`${sast}+02:00`);
const base: TrialBannerInput = { isTrialing: true, trialEndsAt: END, hasPaymentOnFile: false, trialUsed: true, isExplorer: false };

describe("sastDaysUntil", () => {
  test("counts SAST calendar days, not 24h blocks", () => {
    expect(sastDaysUntil(END, at("2026-10-25T08:00:00"))).toBe(7);
    expect(sastDaysUntil(END, at("2026-10-29T23:59:00"))).toBe(3);
    expect(sastDaysUntil(END, at("2026-10-31T23:00:00"))).toBe(1);
    expect(sastDaysUntil(END, at("2026-11-06T09:00:00"))).toBe(-5);
  });
  test("the end instant is the 1 November date", () => {
    expect(formatSastDate(END)).toBe("1 November 2026");
  });
});

describe("trialBannerState", () => {
  test("more than a week left → trialing", () => {
    expect(trialBannerState({ ...base, now: at("2026-10-01T10:00:00") })).toBe("trialing");
  });
  test("4–7 days left → week_left", () => {
    expect(trialBannerState({ ...base, now: at("2026-10-25T10:00:00") })).toBe("week_left");
    expect(trialBannerState({ ...base, now: at("2026-10-28T10:00:00") })).toBe("week_left");
  });
  test("3 days or fewer → precharge with a card, last_chance without", () => {
    expect(trialBannerState({ ...base, now: at("2026-10-29T10:00:00") })).toBe("last_chance");
    expect(trialBannerState({ ...base, hasPaymentOnFile: true, now: at("2026-10-29T10:00:00") })).toBe("precharge");
  });
  test("unknown payment state never picks charge copy", () => {
    expect(trialBannerState({ ...base, hasPaymentOnFile: null, now: at("2026-10-30T10:00:00") })).toBe("trialing");
  });
  test("ended: trial used, back on the free tier", () => {
    expect(trialBannerState({ ...base, isTrialing: false, isExplorer: true })).toBe("ended");
  });
  test("paid member or never trialled → none", () => {
    expect(trialBannerState({ ...base, isTrialing: false, isExplorer: false })).toBe("none");
    expect(trialBannerState({ ...base, isTrialing: false, trialUsed: false, isExplorer: true })).toBe("none");
  });
});
