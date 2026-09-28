import { describe, expect, test } from "bun:test";
import { formatRate, sastToday, summarizeFunnel, type FunnelDayRow } from "../conversionFunnelSummary";

const row = (day: string, n: Partial<FunnelDayRow> = {}): FunnelDayRow => ({
  day, signups: 0, starter_analyses_saved: 0, trials_started: 0, live_subscriptions_created: 0, paid_subscriptions_started: 0, ...n,
});

describe("summarizeFunnel", () => {
  const rows = [
    row("2026-09-28", { signups: 10, starter_analyses_saved: 6, trials_started: 4, live_subscriptions_created: 1, paid_subscriptions_started: 1 }),
    row("2026-09-22", { signups: 10, starter_analyses_saved: 2, trials_started: 1 }),
    row("2026-09-01", { signups: 100, trials_started: 50 }),
  ];
  test("7-day window is the last 7 SAST days inclusive (22–28 Sep)", () => {
    const s = summarizeFunnel(rows, 7, "2026-09-28");
    expect(s.totals.signups).toBe(20);
    expect(s.daily.map((d) => d.day)).toEqual(["2026-09-22", "2026-09-28"]);
    expect(summarizeFunnel(rows, 7, "2026-09-29").totals.signups).toBe(10); // 22 Sep drops out
  });
  test("30-day window and stage rates", () => {
    const s = summarizeFunnel(rows, 30, "2026-09-28");
    expect(s.totals).toEqual({ signups: 120, starter_analyses_saved: 8, trials_started: 55, live_subscriptions_created: 1, paid_subscriptions_started: 1 });
    expect(s.rates[0]).toEqual({ from: "signups", to: "starter_analyses_saved", rate: 8 / 120 });
    expect(s.rates.map((r) => r.to)).toEqual(["starter_analyses_saved", "trials_started", "live_subscriptions_created", "paid_subscriptions_started"]);
  });
  test("a zero denominator gives null, not NaN or Infinity", () => {
    const s = summarizeFunnel([row("2026-09-28")], 7, "2026-09-28");
    expect(s.rates.every((r) => r.rate === null)).toBe(true);
    expect(formatRate(null)).toBe("—");
  });
  test("daily is sorted oldest first; null days are ignored", () => {
    const s = summarizeFunnel([row("2026-09-28"), { ...row("x"), day: null }, row("2026-09-27")], 7, "2026-09-28");
    expect(s.daily.map((d) => d.day)).toEqual(["2026-09-27", "2026-09-28"]);
  });
  test("formatRate and sastToday", () => {
    expect(formatRate(0.5)).toBe("50%");
    expect(formatRate(0.066)).toBe("6.6%");
    expect(sastToday(new Date("2026-10-31T22:30:00Z"))).toBe("2026-11-01");
  });
});
