/**
 * Admin "Conversion funnel" panel (onboarding overhaul 11): totals and
 * stage-to-stage rates over the last N SAST days of the admin-only
 * conversion_funnel_daily view (migration 20260924120000). Pure and unit
 * tested (src/lib/__tests__/conversionFunnelSummary.test.ts).
 *
 * The view counts EVENTS per day (sign-ups that day, trials started that day…),
 * not cohorts, so a rate here is "stage B events ÷ stage A events in the same
 * window" — a trend indicator, not "x% of the people who signed up then
 * trialled". The panel says so. A rate with a zero denominator is null.
 */

export interface FunnelDayRow {
  day: string | null;
  signups: number | null;
  starter_analyses_saved: number | null;
  trials_started: number | null;
  live_subscriptions_created: number | null;
  paid_subscriptions_started: number | null;
}

export const FUNNEL_STAGES = [
  { key: "signups", label: "Sign-ups" },
  { key: "starter_analyses_saved", label: "Saved analyses" },
  { key: "trials_started", label: "Trials started" },
  { key: "live_subscriptions_created", label: "Auto-renew set up" },
  { key: "paid_subscriptions_started", label: "Paid memberships" },
] as const;

export type FunnelStageKey = (typeof FUNNEL_STAGES)[number]["key"];

export interface FunnelSummary {
  days: number;
  totals: Record<FunnelStageKey, number>;
  /** Consecutive stage-to-stage rates, 0–1, or null when the earlier stage is 0. */
  rates: { from: FunnelStageKey; to: FunnelStageKey; rate: number | null }[];
  daily: { day: string; signups: number; trials_started: number; paid_subscriptions_started: number }[];
}

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** YYYY-MM-DD of today in SAST. */
export const sastToday = (now: Date = new Date()): string => new Date(now.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);

const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const summarizeFunnel = (rows: FunnelDayRow[], days: number, today: string = sastToday()): FunnelSummary => {
  const from = addDays(today, -(days - 1));
  const inWindow = rows
    .filter((r): r is FunnelDayRow & { day: string } => Boolean(r.day) && r.day! >= from && r.day! <= today)
    .sort((a, b) => a.day.localeCompare(b.day));

  const totals = Object.fromEntries(FUNNEL_STAGES.map((s) => [s.key, 0])) as Record<FunnelStageKey, number>;
  for (const r of inWindow) for (const s of FUNNEL_STAGES) totals[s.key] += Number(r[s.key] ?? 0);

  const rates = FUNNEL_STAGES.slice(1).map((s, i) => {
    const prev = FUNNEL_STAGES[i].key;
    return { from: prev, to: s.key, rate: totals[prev] > 0 ? totals[s.key] / totals[prev] : null };
  });

  return {
    days,
    totals,
    rates,
    daily: inWindow.map((r) => ({
      day: r.day,
      signups: Number(r.signups ?? 0),
      trials_started: Number(r.trials_started ?? 0),
      paid_subscriptions_started: Number(r.paid_subscriptions_started ?? 0),
    })),
  };
};

export const formatRate = (rate: number | null): string => (rate === null ? "—" : `${(rate * 100).toFixed(rate < 0.1 && rate > 0 ? 1 : 0)}%`);
