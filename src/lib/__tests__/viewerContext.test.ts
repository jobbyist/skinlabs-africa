import { describe, expect, test } from "bun:test";
import {
  isAdBlockWallExempt,
  isAutomatedAgent,
  matchesAudience,
  resolveAdPolicy,
  shouldEnforceAdBlockWall,
  shouldShowAd,
  type ViewerFacts,
} from "../viewerContext";

const facts = (over: Partial<ViewerFacts> = {}): ViewerFacts => ({
  loading: false,
  isSignedIn: true,
  ladderTier: "free",
  isTrialing: false,
  isFoundingMember: false,
  adBlock: "clear",
  ...over,
});

describe("resolveAdPolicy", () => {
  test("free tiers see full ads, Insider ad-light, VIP none", () => {
    expect(resolveAdPolicy({ ladderTier: "anonymous", isFoundingMember: false })).toBe("full");
    expect(resolveAdPolicy({ ladderTier: "free", isFoundingMember: false })).toBe("full");
    expect(resolveAdPolicy({ ladderTier: "glow_lite", isFoundingMember: false })).toBe("full");
    expect(resolveAdPolicy({ ladderTier: "insider", isFoundingMember: false })).toBe("light");
    expect(resolveAdPolicy({ ladderTier: "vip", isFoundingMember: false })).toBe("none");
    expect(resolveAdPolicy({ ladderTier: "free", isFoundingMember: true })).toBe("light");
  });
});

describe("shouldShowAd", () => {
  test("ad-light keeps only primary units", () => {
    expect(shouldShowAd("full")).toBe(true);
    expect(shouldShowAd("light", "secondary")).toBe(false);
    expect(shouldShowAd("light", "primary")).toBe(true);
    expect(shouldShowAd("none", "primary")).toBe(false);
    expect(shouldShowAd(null, "primary")).toBe(false);
  });
});

describe("ad-block wall", () => {
  const base = { adPolicy: "full" as const, adBlock: "blocked" as const, pathname: "/briefings/x", isAutomated: false };
  test("blocks content for an ad-supported viewer with a blocker", () => {
    expect(shouldEnforceAdBlockWall(base)).toBe(true);
  });
  test("never for paying tiers, unknown/clear detection, bots or exempt pages", () => {
    expect(shouldEnforceAdBlockWall({ ...base, adPolicy: "light" })).toBe(false);
    expect(shouldEnforceAdBlockWall({ ...base, adPolicy: null })).toBe(false);
    expect(shouldEnforceAdBlockWall({ ...base, adBlock: "unknown" })).toBe(false);
    expect(shouldEnforceAdBlockWall({ ...base, adBlock: "clear" })).toBe(false);
    expect(shouldEnforceAdBlockWall({ ...base, isAutomated: true })).toBe(false);
    for (const p of ["/pricing", "/dashboard", "/dashboard?tab=billing", "/privacy-policy", "/reset-password", "/admin/x"]) {
      expect(shouldEnforceAdBlockWall({ ...base, pathname: p })).toBe(false);
    }
  });
  test("exempt prefixes don't swallow look-alike paths", () => {
    expect(isAdBlockWallExempt("/pricing-guide")).toBe(false);
    expect(isAdBlockWallExempt("/terms-of-service")).toBe(true);
  });
  test("crawlers and headless renderers are automated", () => {
    expect(isAutomatedAgent("Mozilla/5.0 (compatible; Googlebot/2.1)", false)).toBe(true);
    expect(isAutomatedAgent("Mozilla/5.0 HeadlessChrome/147", false)).toBe(true);
    expect(isAutomatedAgent("Mozilla/5.0 (iPhone) Safari/604.1", true)).toBe(true);
    expect(isAutomatedAgent("Mozilla/5.0 (iPhone) Safari/604.1", false)).toBe(false);
  });
});

describe("matchesAudience", () => {
  test("waits while loading instead of guessing", () => {
    expect(matchesAudience(facts({ loading: true }), { signedIn: true })).toBeNull();
    expect(matchesAudience(facts({ loading: true }), { adBlock: ["blocked"] })).toBe(false);
  });
  test("signed-in, tiers, minTier, belowTier, trialing", () => {
    expect(matchesAudience(facts({ isSignedIn: false, ladderTier: "anonymous" }), { signedIn: false })).toBe(true);
    expect(matchesAudience(facts(), { signedIn: false })).toBe(false);
    expect(matchesAudience(facts({ ladderTier: "vip" }), { minTier: "insider" })).toBe(true);
    expect(matchesAudience(facts({ ladderTier: "glow_lite" }), { minTier: "insider" })).toBe(false);
    expect(matchesAudience(facts({ ladderTier: "glow_lite" }), { belowTier: "insider" })).toBe(true);
    expect(matchesAudience(facts({ ladderTier: "insider" }), { belowTier: "insider" })).toBe(false);
    expect(matchesAudience(facts({ ladderTier: "insider", isTrialing: true }), { trialing: true, tiers: ["insider"] })).toBe(true);
  });
  test("ad policy and ad-block status", () => {
    expect(matchesAudience(facts({ ladderTier: "insider" }), { adPolicy: ["light", "none"] })).toBe(true);
    expect(matchesAudience(facts({ adBlock: "blocked" }), { adBlock: ["blocked"] })).toBe(true);
  });
});
