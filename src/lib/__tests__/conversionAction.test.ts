import { describe, expect, test } from "bun:test";
import { resolveConversionAction, type ConversionState } from "../conversionAction";
import { trialCtaLabel } from "../promo";

const base: ConversionState = {
  loading: false,
  isSignedIn: true,
  tier: "explorer",
  isTrialing: false,
  trialUsed: false,
  entitled: false,
  feature: "reviews.full_body",
};

describe("resolveConversionAction", () => {
  test("no CTA while auth/membership is loading", () => {
    const d = resolveConversionAction({ ...base, loading: true, isSignedIn: false });
    expect(d.kind).toBeNull();
    expect(d.entitled).toBe(false);
    expect(d.unavailable).toBe(false);
  });

  test("entitled viewers get no CTA", () => {
    const d = resolveConversionAction({ ...base, tier: "insider", entitled: true });
    expect(d).toMatchObject({ kind: null, entitled: true, unavailable: false });
  });

  test("anonymous → create a free account", () => {
    const d = resolveConversionAction({ ...base, isSignedIn: false });
    expect(d.kind).toBe("signup");
    expect(d.label).toBe("Create free account");
  });

  test("anonymous is asked to sign up even for a VIP-only feature", () => {
    expect(resolveConversionAction({ ...base, isSignedIn: false, feature: "consult.priority_booking" }).kind).toBe("signup");
  });

  test("free account with a trial available → start trial, promo-aware label", () => {
    const d = resolveConversionAction(base);
    expect(d.kind).toBe("trial");
    expect(d.label).toBe(`Start free trial — ${trialCtaLabel()}`);
    expect(d.label).not.toMatch(/7-day/);
  });

  test("free account whose trial is used → subscribe", () => {
    const d = resolveConversionAction({ ...base, trialUsed: true });
    expect(d.kind).toBe("subscribe");
    expect(d.label).toBe("Subscribe");
  });

  test("a paying Glow Lite member is never offered a trial (it would overwrite their plan)", () => {
    const d = resolveConversionAction({ ...base, tier: "glow_lite" });
    expect(d.kind).toBe("subscribe");
    expect(d.sublabel).toMatch(/Upgrade/);
  });

  test("a Glow Lite trialist lacking the feature → subscribe, not another trial", () => {
    expect(resolveConversionAction({ ...base, tier: "glow_lite", isTrialing: true, trialUsed: true }).kind).toBe("subscribe");
  });

  test("VIP-only feature while VIP isn't purchasable → unavailable, no action", () => {
    const d = resolveConversionAction({ ...base, feature: "consult.priority_booking" });
    expect(d.kind).toBeNull();
    expect(d.unavailable).toBe(true);
    expect(d.label).toMatch(/coming soon/);
  });

  test("no feature (general membership) behaves like an Insider feature", () => {
    expect(resolveConversionAction({ ...base, feature: undefined }).kind).toBe("trial");
  });
});
