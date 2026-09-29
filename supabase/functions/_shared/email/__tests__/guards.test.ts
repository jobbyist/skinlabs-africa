import { describe, expect, test } from "bun:test";
import { getGuard } from "../guards.ts";

// Minimal stand-in for the chains the guards actually call:
//   profiles:              from(table).select(cols).eq(col, val).maybeSingle()
//   payment_subscriptions: from(table).select(cols).eq(col, val).in(col, vals).limit(n)
function fakeSupabase(
  row: Record<string, unknown> | null,
  error: unknown = null,
  subs: { rows: unknown[]; error?: unknown } = { rows: [] },
) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: row, error };
                },
                in() {
                  return {
                    async limit() {
                      if (table !== "payment_subscriptions") throw new Error(`unexpected table ${table}`);
                      return { data: subs.rows, error: subs.error ?? null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("trial_expiring guard", () => {
  const guard = getGuard("trial_expiring")!;

  test("sends when the profile is still on an active insider trial", async () => {
    const supabase = fakeSupabase({ subscription_status: "trial", trial_plan: "insider", trial_ends_at: "2026-10-01" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(true);
    expect(result.vars?.trial_ends_at).toBe("2026-10-01");
  });

  test("sends for a Glow Lite trial and passes the plan through", async () => {
    const supabase = fakeSupabase({ subscription_status: "trial", trial_plan: "glow_lite", trial_ends_at: "2026-10-01" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(true);
    expect(result.vars?.plan).toBe("glow_lite");
  });

  test("reports has_payment_method from a live payment_subscriptions row at send time", async () => {
    const trial = { subscription_status: "trial", trial_plan: "insider", trial_ends_at: "2026-10-01" };
    const withCard = await guard(fakeSupabase(trial, null, { rows: [{ id: "s1" }] }), { user_id: "u1", payload: {} });
    expect(withCard.vars?.has_payment_method).toBe(true);
    const noCard = await guard(fakeSupabase(trial, null, { rows: [] }), { user_id: "u1", payload: {} });
    expect(noCard.vars?.has_payment_method).toBe(false);
    const unknown = await guard(fakeSupabase(trial, null, { rows: [], error: { message: "boom" } }), { user_id: "u1", payload: {} });
    expect(unknown.vars?.has_payment_method).toBeUndefined();
  });

  test("cancels when the trial already converted to a paid plan before send time", async () => {
    const supabase = fakeSupabase({ subscription_status: "insider", trial_plan: "insider", trial_ends_at: "2026-10-01" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(false);
  });

  test("cancels when the trial was cancelled (back to free) before send time", async () => {
    const supabase = fakeSupabase({ subscription_status: "free", trial_plan: "insider", trial_ends_at: "2026-10-01" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(false);
  });

  test("cancels when there is no user_id on the job", async () => {
    const supabase = fakeSupabase(null);
    const result = await guard(supabase, { user_id: null, payload: {} });
    expect(result.send).toBe(false);
  });
});

describe("trial_ended guard", () => {
  const guard = getGuard("trial_ended")!;

  test("sends when the account is genuinely back on the free plan", async () => {
    const supabase = fakeSupabase({ subscription_status: "free" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(true);
  });

  test("cancels when the user upgraded to paid again before the reminder sent", async () => {
    const supabase = fakeSupabase({ subscription_status: "insider" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(false);
  });

  test("cancels when a new trial started again before the reminder sent", async () => {
    const supabase = fakeSupabase({ subscription_status: "trial" });
    const result = await guard(supabase, { user_id: "u1", payload: {} });
    expect(result.send).toBe(false);
  });
});

describe("templates with no guard", () => {
  test("payment_succeeded and form confirmations have no guard (immutable past facts)", () => {
    expect(getGuard("payment_succeeded")).toBeUndefined();
    expect(getGuard("form_confirmation_contact")).toBeUndefined();
    expect(getGuard("membership_activated")).toBeUndefined();
  });
});
