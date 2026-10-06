import { expect, test } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Admin → Analytics → "App installs & devices": renders the admin_pwa_overview() aggregate
 * (install funnel, installs / launches by device, platform and browser, push, offline podcasts) and
 * the new "App & PWA" area in the generic events chart. The RPCs are mocked; the SQL itself is
 * covered by supabase/tests/pwa_admin_analytics.sql.
 */

const OVERVIEW = {
  window_days: 30,
  totals: { installs: 12, launches: 340, launch_users: 41, prompts_viewed: 96, offline_sessions: 18, updates_available: 3, updates_applied: 2, push_subscribed: 9, downloads_completed: 27, offline_plays: 14, events: 640 },
  install_funnel: [
    { stage: "Install prompt shown", count: 96 },
    { stage: "Install started", count: 30 },
    { stage: "Accepted", count: 22 },
    { stage: "App installed", count: 12 },
  ],
  prompt_outcomes: [
    { outcome: "Dismissed (Not now)", count: 40 },
    { outcome: "Declined in browser dialog", count: 8 },
    { outcome: "Accepted in browser dialog", count: 22 },
  ],
  prompt_by_kind: [
    { kind: "native", viewed: 70, dismissed: 28 },
    { kind: "ios", viewed: 26, dismissed: 12 },
  ],
  installs_by_platform: [{ label: "android", count: 7 }, { label: "ios", count: 3 }, { label: "windows", count: 2 }],
  installs_by_device: [{ label: "phone", count: 9 }, { label: "desktop", count: 2 }, { label: "tablet", count: 1 }],
  installs_by_browser: [{ label: "chrome", count: 8 }, { label: "safari", count: 3 }, { label: "edge", count: 1 }],
  launches_by_platform: [{ label: "android", count: 200 }, { label: "ios", count: 140 }],
  launches_by_device: [{ label: "phone", count: 320 }, { label: "tablet", count: 20 }],
  prompts_by_device: [{ label: "phone", count: 80 }, { label: "desktop", count: 16 }],
  push_funnel: [
    { stage: "Prompt shown", count: 30 },
    { stage: "Permission granted", count: 12 },
    { stage: "Permission denied", count: 5 },
    { stage: "Device subscribed", count: 9 },
    { stage: "Unsubscribed", count: 1 },
  ],
  push_by_platform: [{ label: "android", count: 6 }, { label: "ios", count: 3 }],
  offline_podcasts: [
    { stage: "Downloads started", count: 31 },
    { stage: "Downloads completed", count: 27 },
    { stage: "Downloads removed", count: 4 },
    { stage: "Played offline", count: 14 },
  ],
  daily: [
    { day: "2026-10-01", installs: 2, launches: 40, prompts: 12, push: 1, downloads: 3 },
    { day: "2026-10-02", installs: 4, launches: 60, prompts: 20, push: 2, downloads: 6 },
  ],
  by_event: [
    { event_name: "pwa_launch", count: 340, users: 41, last_seen: "2026-10-03T08:00:00Z" },
    { event_name: "pwa_installed", count: 12, users: 5, last_seen: "2026-10-03T07:00:00Z" },
  ],
  display_mode: [{ label: "standalone", count: 400 }, { label: "browser", count: 240 }],
};

test("shows installs, device types and related events from the admin aggregate", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: true });
  const requested: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/has_role*", (route) => route.fulfill({ json: true }));
  await page.route("**/rest/v1/rpc/admin_pwa_overview*", async (route) => {
    requested.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ json: OVERVIEW });
  });
  await page.route("**/rest/v1/rpc/admin_events_overview*", (route) => route.fulfill({ json: { window_days: 30, totals: { events: 0, signed_in_users: 0, event_types: 0, signed_in_events: 0, first_event_at: null }, daily: [], daily_by_category: [], by_category: [], by_event: [], by_path: [], by_hour: [], funnel: [] } }));
  await page.route("**/rest/v1/rpc/conversion_funnel*", (route) => route.fulfill({ json: [] }));

  await page.goto("/admin");
  await page.getByRole("tab", { name: /Analytics/ }).click({ force: true });

  const panel = page.getByRole("region", { name: "App and install analytics" });
  await expect(panel.getByRole("heading", { name: "App installs & devices" })).toBeVisible();
  expect(requested[0]).toEqual({ p_days: 30 });

  // headline tiles
  await expect(panel.getByText("App installs, last 30d")).toBeVisible();
  await expect(panel.getByText("13%").first()).toBeVisible(); // 12 installs ÷ 96 prompts
  await expect(panel.getByText("340", { exact: true }).first()).toBeVisible();

  // install funnel with stage-to-stage conversion
  await expect(panel.getByText("Install prompt shown")).toBeVisible();
  await expect(panel.getByText(/App installed/).first()).toBeVisible();
  await expect(panel.getByText("31% of previous").first()).toBeVisible(); // 30 ÷ 96

  // device-type, platform and browser breakdowns use friendly labels
  await expect(panel.getByText("Phone").first()).toBeVisible();
  await expect(panel.getByText("iPhone (iOS)").first()).toBeVisible();
  await expect(panel.getByText("Samsung Internet")).toHaveCount(0);
  await expect(panel.getByText("Safari").first()).toBeVisible();

  // related events
  await expect(panel.getByText("Device subscribed")).toBeVisible();
  await expect(panel.getByText("Played offline")).toBeVisible();
  await expect(panel.getByRole("cell", { name: "pwa_installed" })).toBeVisible();
  await expect(panel.getByText("Installed app launched (one per launch)")).toBeVisible();

  // range switch re-queries
  await panel.getByRole("button", { name: "7d" }).click();
  await expect.poll(() => requested.length).toBeGreaterThan(1);
  expect(requested[requested.length - 1]).toEqual({ p_days: 7 });
});

test("explains itself when the migration isn't applied yet (RPC missing)", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: true });
  await page.route("**/rest/v1/rpc/has_role*", (route) => route.fulfill({ json: true }));
  await page.route("**/rest/v1/rpc/admin_pwa_overview*", (route) => route.fulfill({ status: 404, json: { code: "PGRST202", message: "not found" } }));
  await page.goto("/admin");
  await page.getByRole("tab", { name: /Analytics/ }).click({ force: true });
  await expect(page.getByRole("alert").filter({ hasText: "app analytics" })).toBeVisible();
});
