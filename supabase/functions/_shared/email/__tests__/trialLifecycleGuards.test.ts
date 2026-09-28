import { describe, expect, test } from "bun:test";
import { getGuard } from "../guards.ts";

// Minimal chainable stand-in for the supabase-js query builder.
interface Db {
  profile: Record<string, unknown> | null;
  subs: Record<string, unknown>[] | null; // null = read error
  counts?: Record<string, number>;
}
const fakeClient = (db: Db) => ({
  from(table: string) {
    const q = {
      _head: false,
      select(_cols: string, opts?: { head?: boolean }) {
        q._head = Boolean(opts?.head);
        return q;
      },
      eq: () => q,
      in: () => q,
      order: () => q,
      limit: () =>
        Promise.resolve(
          table === "payment_subscriptions"
            ? db.subs === null
              ? { data: null, error: { message: "boom" } }
              : { data: db.subs, error: null }
            : { data: [], error: null },
        ),
      maybeSingle: () => Promise.resolve({ data: db.profile, error: null }),
      then(resolve: (v: unknown) => void) {
        resolve({ count: db.counts?.[table] ?? 0, data: null, error: null });
      },
    };
    return q;
  },
});

const ENDS = "2026-10-31T22:00:00Z";
const job = (payload: Record<string, unknown> = {}) => ({ user_id: "u1", payload: { trial_ends_at: ENDS, ...payload } });
const trialing = { subscription_status: "trial", trial_plan: "insider", trial_ends_at: ENDS, marketing_consent: true };
const card = { amount_zar: 79, amount_charged: 79, currency: "ZAR", gateway: "payfast" };

describe("trial lifecycle send-time guards", () => {
  test("T-7 sends while the same trial runs, with the current card state", async () => {
    const r = await getGuard("trial_week_left")!(fakeClient({ profile: trialing, subs: [card] }), job());
    expect(r.send).toBe(true);
    expect(r.vars?.has_payment_method).toBe(true);
  });
  test("T-7 is cancelled once the trial converted or its end date moved", async () => {
    expect((await getGuard("trial_week_left")!(fakeClient({ profile: { ...trialing, subscription_status: "insider" }, subs: [] }), job())).send).toBe(false);
    expect((await getGuard("trial_week_left")!(fakeClient({ profile: { ...trialing, trial_ends_at: "2026-11-30T22:00:00Z" }, subs: [] }), job())).send).toBe(false);
  });
  test("precharge needs a live card and refreshes the amount; last chance needs none", async () => {
    const pre = await getGuard("trial_precharge_reminder")!(fakeClient({ profile: trialing, subs: [card] }), job());
    expect(pre.send).toBe(true);
    expect(pre.vars?.amount_zar).toBe(79);
    expect((await getGuard("trial_precharge_reminder")!(fakeClient({ profile: trialing, subs: [] }), job())).send).toBe(false);
    expect((await getGuard("trial_last_chance")!(fakeClient({ profile: trialing, subs: [card] }), job())).send).toBe(false);
    expect((await getGuard("trial_last_chance")!(fakeClient({ profile: trialing, subs: [] }), job())).send).toBe(true);
  });
  test("a payment-state read error never sends charge-dependent copy", async () => {
    expect((await getGuard("trial_precharge_reminder")!(fakeClient({ profile: trialing, subs: null }), job())).send).toBe(false);
    expect((await getGuard("trial_last_chance")!(fakeClient({ profile: trialing, subs: null }), job())).send).toBe(false);
    const wk = await getGuard("trial_week_left")!(fakeClient({ profile: trialing, subs: null }), job());
    expect(wk.send).toBe(true);
    expect(wk.vars?.has_payment_method).toBeUndefined();
  });
  test("nudge: consent re-checked, skipped once activated", async () => {
    expect((await getGuard("trial_activation_nudge")!(fakeClient({ profile: trialing, subs: [] }), job())).send).toBe(true);
    expect((await getGuard("trial_activation_nudge")!(fakeClient({ profile: { ...trialing, marketing_consent: false }, subs: [] }), job())).send).toBe(false);
    expect((await getGuard("trial_activation_nudge")!(fakeClient({ profile: trialing, subs: [], counts: { routine_steps: 1 } }), job())).send).toBe(false);
  });
  test("win-back: only for a free, consenting member with no auto-renew", async () => {
    const free = { ...trialing, subscription_status: "free" };
    expect((await getGuard("trial_winback")!(fakeClient({ profile: free, subs: [] }), job())).send).toBe(true);
    expect((await getGuard("trial_winback")!(fakeClient({ profile: { ...free, subscription_status: "insider" }, subs: [] }), job())).send).toBe(false);
    expect((await getGuard("trial_winback")!(fakeClient({ profile: free, subs: [card] }), job())).send).toBe(false);
    expect((await getGuard("trial_winback")!(fakeClient({ profile: { ...free, marketing_consent: false }, subs: [] }), job())).send).toBe(false);
  });
});
