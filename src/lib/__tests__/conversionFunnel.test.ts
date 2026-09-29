import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PAID_SUBSCRIPTION_STATUSES } from "../entitlements";

// conversion_funnel_daily counts "paid" profiles with a hardcoded SQL list —
// this pins it to the TS source of truth so the two can't drift.
const migration = readFileSync(
  join(import.meta.dir, "../../../supabase/migrations/20260924120000_conversion_funnel_daily.sql"),
  "utf8",
);

describe("conversion_funnel_daily migration", () => {
  it("uses exactly PAID_SUBSCRIPTION_STATUSES for paid subscriptions", () => {
    const match = migration.match(/lower\(coalesce\(p\.subscription_status, ''\)\) IN \(([^)]*)\)/);
    expect(match).not.toBeNull();
    const sqlStatuses = match![1].split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
    expect([...sqlStatuses].sort()).toEqual([...PAID_SUBSCRIPTION_STATUSES].sort());
  });

  it("gates rows on the admin role and exposes no user identifiers", () => {
    expect(migration).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(migration).toContain("security_invoker = true");
    const returns = migration.match(/RETURNS TABLE \(([\s\S]*?)\n\)/)![1];
    expect(returns).not.toMatch(/user_id|email|payer/);
  });
});
