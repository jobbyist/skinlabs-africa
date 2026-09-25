import { describe, expect, test } from "bun:test";
import {
  PENDING_INTENT_MAX_AGE_MS,
  isSafeReturnTo,
  parsePendingIntent,
  pendingIntentFromSearchParams,
  withPendingIntentParams,
} from "../pendingIntent";
import * as legacy from "../pendingPlan";

const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);
const base = { action: "trial", plan: "glow_lite", interval: "monthly", variantKey: "control", returnTo: "/pricing", ts: NOW };

describe("parsePendingIntent", () => {
  test("accepts every valid action", () => {
    expect(parsePendingIntent(base, NOW)).toEqual(base as never);
    expect(parsePendingIntent({ ...base, action: "subscribe", plan: "insider", interval: "annual" }, NOW)?.interval).toBe("annual");
    expect(parsePendingIntent({ action: "unlock", returnTo: "/reviews/some-serum", ts: NOW }, NOW)).toEqual({
      action: "unlock",
      returnTo: "/reviews/some-serum",
      ts: NOW,
    });
    expect(parsePendingIntent({ action: "save_analysis", returnTo: "/skynn-ai", ts: NOW }, NOW)?.action).toBe("save_analysis");
  });

  test("defaults interval and variant for plan intents", () => {
    const parsed = parsePendingIntent({ action: "subscribe", plan: "insider", returnTo: "/pricing", ts: NOW }, NOW);
    expect(parsed).toMatchObject({ interval: "monthly", variantKey: "control" });
  });

  test("accepts a numeric-string ts (URL channel)", () => {
    expect(parsePendingIntent({ ...base, ts: String(NOW) }, NOW)?.ts).toBe(NOW);
  });

  describe("expiry", () => {
    test("accepts an intent right at the 30-minute limit", () => {
      expect(parsePendingIntent({ ...base, ts: NOW - PENDING_INTENT_MAX_AGE_MS }, NOW)).not.toBeNull();
    });
    test("rejects one older than 30 minutes", () => {
      expect(parsePendingIntent({ ...base, ts: NOW - PENDING_INTENT_MAX_AGE_MS - 1 }, NOW)).toBeNull();
    });
    test("rejects a ts from the future beyond small clock skew", () => {
      expect(parsePendingIntent({ ...base, ts: NOW + 30_000 }, NOW)).not.toBeNull();
      expect(parsePendingIntent({ ...base, ts: NOW + 5 * 60_000 }, NOW)).toBeNull();
    });
    test("rejects a missing or non-numeric ts", () => {
      expect(parsePendingIntent({ ...base, ts: undefined }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, ts: "soon" }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, ts: "1e20" }, NOW)).toBeNull();
    });
  });

  describe("tamper", () => {
    test("rejects non-objects and unknown actions", () => {
      for (const raw of [null, undefined, "trial", 42, []]) expect(parsePendingIntent(raw, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, action: "grant_vip" }, NOW)).toBeNull();
    });
    test("rejects plan intents without a real paid plan", () => {
      expect(parsePendingIntent({ ...base, plan: undefined }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, plan: "explorer" }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, plan: "platinum" }, NOW)).toBeNull();
      expect(parsePendingIntent({ action: "unlock", returnTo: "/", plan: "platinum", ts: NOW }, NOW)).toBeNull();
    });
    test("rejects a bad interval or variant key", () => {
      expect(parsePendingIntent({ ...base, interval: "weekly" }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, variantKey: "x".repeat(41) }, NOW)).toBeNull();
      expect(parsePendingIntent({ ...base, variantKey: "a b<script>" }, NOW)).toBeNull();
    });
    test("drops unknown fields instead of passing them through", () => {
      const parsed = parsePendingIntent({ ...base, isAdmin: true, price: 0 }, NOW) as unknown as Record<string, unknown>;
      expect(parsed.isAdmin).toBeUndefined();
      expect(parsed.price).toBeUndefined();
    });
  });
});

describe("isSafeReturnTo", () => {
  test("accepts same-origin relative paths with query and hash", () => {
    for (const ok of ["/", "/reviews/cerave-hydrating-cleanser", "/dashboard?tab=billing", "/pricing?interval=annual#plans", "/skynn-ai"]) {
      expect(isSafeReturnTo(ok)).toBe(true);
    }
  });

  test("rejects absolute, protocol-relative and scheme URLs", () => {
    for (const bad of [
      "https://evil.example/phish",
      "//evil.example",
      "///evil.example",
      "javascript:alert(1)",
      "data:text/html,hi",
      "evil.example/path",
      "reviews/relative-without-slash",
    ]) {
      expect(isSafeReturnTo(bad)).toBe(false);
    }
  });

  test("rejects backslash and control-character tricks", () => {
    for (const bad of ["/\\evil.example", "/\\/evil.example", "/\t/evil.example", "/path\nx", "/\u0000"]) {
      expect(isSafeReturnTo(bad)).toBe(false);
    }
  });

  test("rejects empty, non-string and oversized values", () => {
    expect(isSafeReturnTo("")).toBe(false);
    expect(isSafeReturnTo(undefined)).toBe(false);
    expect(isSafeReturnTo({ toString: () => "/" })).toBe(false);
    expect(isSafeReturnTo(`/${"a".repeat(600)}`)).toBe(false);
  });

  test("an intent with an unsafe returnTo is rejected outright", () => {
    expect(parsePendingIntent({ ...base, returnTo: "https://evil.example" }, NOW)).toBeNull();
    expect(parsePendingIntent({ ...base, returnTo: undefined }, NOW)).toBeNull();
  });
});

describe("URL channel", () => {
  test("round-trips through withPendingIntentParams", () => {
    const intent = parsePendingIntent({ ...base, returnTo: "/reviews/x?from=gate" }, NOW)!;
    const url = new URL(withPendingIntentParams("https://skinlabs.co.za/reviews/x", intent));
    const raw = pendingIntentFromSearchParams(url.searchParams);
    expect(parsePendingIntent(raw, NOW)).toEqual(intent);
  });

  test("a hand-edited returnTo in the link is refused", () => {
    const intent = parsePendingIntent(base, NOW)!;
    const url = new URL(withPendingIntentParams("https://skinlabs.co.za/pricing", intent));
    url.searchParams.set("pi_return", "//evil.example");
    expect(parsePendingIntent(pendingIntentFromSearchParams(url.searchParams), NOW)).toBeNull();
  });

  test("an old email link expires like a stored intent", () => {
    const intent = parsePendingIntent(base, NOW)!;
    const url = new URL(withPendingIntentParams("https://skinlabs.co.za/pricing", intent));
    expect(parsePendingIntent(pendingIntentFromSearchParams(url.searchParams), NOW + PENDING_INTENT_MAX_AGE_MS + 1)).toBeNull();
  });

  test("no intent leaves the redirect URL untouched", () => {
    expect(withPendingIntentParams("https://skinlabs.co.za/skynn-ai", null)).toBe("https://skinlabs.co.za/skynn-ai");
    expect(pendingIntentFromSearchParams(new URLSearchParams("tab=billing"))).toBeNull();
  });
});

describe("pendingPlan.ts shim", () => {
  test("re-exports the new module under the old names", () => {
    expect(legacy.withPendingPlanParams).toBe(withPendingIntentParams);
    expect(legacy.parsePendingIntent).toBe(parsePendingIntent);
    expect(typeof legacy.getPendingPlanIntent).toBe("function");
    expect(typeof legacy.clearPendingPlanIntent).toBe("function");
  });
});
