import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FORMULATOR_LIMITS,
  computeFormulatorAllowance,
  isFormulatorLimitError,
  windowProgress,
} from "../limits";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-09-24T10:00:00Z");
const daysAgo = (d: number, extraMs = 0) => new Date(NOW.getTime() - d * DAY - extraMs);

describe("FORMULATOR_LIMITS per tier", () => {
  test("Explorer: 1 free analysis when never analysed", () => {
    const a = computeFormulatorAllowance("explorer", null, NOW);
    expect(a).toMatchObject({ unlimited: false, freeRemaining: 1, locked: false, nextUnlockAt: null });
  });

  test("Explorer: locked after using the free one, unlocking 30 days later", () => {
    const last = daysAgo(3);
    const a = computeFormulatorAllowance("explorer", last, NOW);
    expect(a.locked).toBe(true);
    expect(a.freeRemaining).toBe(0);
    expect(a.nextUnlockAt?.getTime()).toBe(last.getTime() + 30 * DAY);
  });

  test("Glow Lite follows the same rolling allowance as Explorer", () => {
    expect(computeFormulatorAllowance("glow_lite", daysAgo(10), NOW).locked).toBe(true);
    expect(computeFormulatorAllowance("glow_lite", daysAgo(31), NOW).locked).toBe(false);
  });

  test.each(["insider", "vip"] as const)("%s is unlimited regardless of history", (tier) => {
    const a = computeFormulatorAllowance(tier, daysAgo(0), NOW);
    expect(a).toMatchObject({ unlimited: true, locked: false, freeRemaining: null, nextUnlockAt: null });
  });

  test("an unknown tier falls back to the Explorer allowance", () => {
    // @ts-expect-error — deliberately invalid tier, e.g. a stale client value
    expect(computeFormulatorAllowance("mystery", daysAgo(1), NOW).locked).toBe(true);
  });
});

describe("30-day rolling boundary", () => {
  test("29 days 23:59 after the last free analysis is still locked", () => {
    expect(computeFormulatorAllowance("explorer", daysAgo(30, -60_000), NOW).locked).toBe(true);
  });

  test("exactly 30 days later unlocks (inclusive boundary, same as the SQL)", () => {
    expect(computeFormulatorAllowance("explorer", daysAgo(30), NOW).locked).toBe(false);
  });

  test("boundary is timezone-safe: a SAST-midnight timestamp string behaves the same", () => {
    const last = "2026-08-25T12:00:00+02:00"; // = 10:00Z, exactly 30 days before NOW
    expect(computeFormulatorAllowance("explorer", last, NOW).locked).toBe(false);
  });

  test("an invalid date string is treated as never analysed rather than locking forever", () => {
    expect(computeFormulatorAllowance("explorer", "not-a-date", NOW).locked).toBe(false);
  });

  test("progress bar fills across the window", () => {
    expect(windowProgress(computeFormulatorAllowance("explorer", daysAgo(15), NOW), NOW)).toBeCloseTo(0.5, 5);
    expect(windowProgress(computeFormulatorAllowance("explorer", null, NOW), NOW)).toBe(1);
  });
});

describe("server error recognition", () => {
  test("recognises save_starter_analysis's limit error by message or hint", () => {
    expect(isFormulatorLimitError({ message: "formulator_limit_reached" })).toBe(true);
    expect(isFormulatorLimitError({ message: "x", hint: "formulator_limit_reached" })).toBe(true);
    expect(isFormulatorLimitError({ message: "Not authenticated" })).toBe(false);
    expect(isFormulatorLimitError(null)).toBe(false);
  });
});

describe("client config matches the server defaults", () => {
  const sql = readFileSync(
    resolve(import.meta.dir, "../../../../supabase/migrations/20260924100000_formulator_rolling_allowance.sql"),
    "utf8",
  );

  test("window length matches pricing_settings.free_analysis_window_days default", () => {
    const m = sql.match(/free_analysis_window_days int NOT NULL DEFAULT (\d+)/);
    expect(m).not.toBeNull();
    expect(FORMULATOR_LIMITS.explorer.unlimited).toBe(false);
    expect(FORMULATOR_LIMITS.explorer.windowDays).toBe(Number(m![1]));
    expect(FORMULATOR_LIMITS.glow_lite.windowDays).toBe(Number(m![1]));
  });

  test("the server treats exactly Insider and VIP as unlimited", () => {
    expect(sql).toContain("IF v_tier IN ('insider', 'vip') THEN");
    const unlimited = Object.entries(FORMULATOR_LIMITS).filter(([, l]) => l.unlimited).map(([t]) => t).sort();
    expect(unlimited).toEqual(["insider", "vip"]);
  });
});
