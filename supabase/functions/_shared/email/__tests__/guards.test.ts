import { describe, expect, test } from "bun:test";
import { getGuard } from "../guards.ts";

// Minimal stand-in for the chain the guards actually call:
// supabase.from(table).select(cols).eq(col, val).maybeSingle()
function fakeSupabase(row: Record<string, unknown> | null, error: unknown = null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: row, error };
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
