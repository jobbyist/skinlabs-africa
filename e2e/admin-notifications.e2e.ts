import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Admin → Notifications. The admin role (has_role) and the engine's admin RPCs are faked here; what is under test is the
 * area: that it only ever calls the admin RPCs, the campaign flow (compose, preview, save, test, send, schedule, cancel),
 * the bulk typed confirmation, the kill switch, automations, templates, the audit list, verbatim RPC errors, and that a
 * member without the admin role gets nothing.
 */
const NOW = Date.now();
const iso = (offsetHours: number) => new Date(NOW + offsetHours * 3_600_000).toISOString();

interface Call {
  fn: string;
  args: Record<string, unknown>;
}

const makeBackend = (members = 3) => {
  const state = {
    members,
    calls: [] as Call[],
    failNext: new Map<string, string>(),
    settings: { push_enabled: true, default_daily_cap: 2 },
    campaigns: [] as Record<string, unknown>[],
    audit: [] as Record<string, unknown>[],
    templates: [
      { key: "report_ready", name: "Report ready", description: null, category: "report_ready", title: "Your SkinLabs® report is ready", body: "Tap to read it securely in the app.", inbox_title: null, inbox_body: null, url: "/dashboard?tab=analysis", channels: ["inbox", "push"], enabled: true, system: true, lock_screen_safe: true, bypass_caps: true },
      { key: "weekly_tip", name: "Weekly tip", description: null, category: "briefing", title: "A tip for your week", body: "Read this week’s tip.", inbox_title: null, inbox_body: null, url: "/briefings", channels: ["inbox", "push"], enabled: true, system: false, lock_screen_safe: true, bypass_caps: false },
    ] as Record<string, unknown>[],
    automations: [
      { id: "a1", key: "daily_briefing_push", name: "Daily briefing", description: "When the day’s briefing is out.", trigger_kind: "schedule", frequency: "daily", send_time: "08:00:00", weekday: null, month_day: null, template_key: "weekly_tip", audience: {}, system: true, enabled: false, last_run_at: null, last_run_count: null, stats: { enqueued: 4, sent: 3, skipped: 1, clicks: 2 }, template: { title: "A tip for your week", body: "x", category: "briefing" } },
      { id: "a2", key: "report_ready_event", name: "Report ready", description: null, trigger_kind: "event", frequency: null, send_time: null, weekday: null, month_day: null, template_key: "report_ready", audience: {}, system: true, enabled: true, last_run_at: null, last_run_count: null, stats: { enqueued: 0, sent: 0, skipped: 0, clicks: 0 }, template: null },
    ] as Record<string, unknown>[],
  };
  const log = (action: string, detail: Record<string, unknown> = {}) =>
    state.audit.unshift({ id: `au${state.audit.length}`, created_at: new Date().toISOString(), action, detail, admin_email: "admin@skinlabs.co.za" });

  const handle = (fn: string, a: Record<string, unknown>): { status?: number; body: unknown } => {
    state.calls.push({ fn, args: a });
    const failure = state.failNext.get(fn);
    if (failure) {
      state.failNext.delete(fn);
      return { status: 400, body: { code: "22023", message: failure, details: null, hint: null } };
    }
    switch (fn) {
      case "admin_notification_overview":
        return {
          body: {
            window_days: a.p_days,
            settings: { ...state.settings },
            totals: { enqueued: 12, push_sent: 9, push_skipped: 2, push_failed: 1, pending: 0, devices_delivered: 10, clicks: 4, inbox_written: 12 },
            skip_reasons: [{ reason: "preference_off", count: 2 }],
            subscriptions: { active_devices: 5, members_with_push: 4, installed_members: 3, by_platform: [{ label: "android", count: 3 }], by_browser: [{ label: "chrome", count: 3 }] },
            opt_ins: { members_with_preferences: 6, promotional: 1, briefing: 4 },
            daily: [{ day: "2026-10-03", enqueued: 12, sent: 9, clicks: 4 }],
          },
        };
      case "admin_set_notification_settings":
        if (typeof a.p_push_enabled === "boolean") state.settings.push_enabled = a.p_push_enabled;
        if (typeof a.p_default_daily_cap === "number") state.settings.default_daily_cap = a.p_default_daily_cap;
        log("notification_settings_updated", { ...state.settings });
        return { body: { ...state.settings } };
      case "admin_preview_notification_audience":
        return { body: { members: state.members, inbox_reachable: state.members, push_reachable: Math.floor(state.members / 2), opted_out: a.p_category === "promotional" ? 2 : 0, by_platform: [{ label: "android", count: 1 }] } };
      case "admin_save_notification_campaign": {
        const title = String(a.p_title ?? "");
        if (title.length > 80) return { status: 400, body: { code: "23514", message: 'new row for relation "notification_campaigns" violates check constraint "notification_campaigns_title_check"' } };
        const existing = state.campaigns.find((c) => c.id === a.p_id);
        if (existing && existing.status !== "draft") return { status: 400, body: { code: "22023", message: "Only draft campaigns can be edited" } };
        const id = (a.p_id as string | null) ?? `camp-${state.campaigns.length + 1}`;
        const row = { id, name: a.p_name, category: a.p_category, title: a.p_title, body: a.p_body, url: a.p_url, channels: a.p_channels, audience: a.p_audience, status: "draft", scheduled_for: null, sent_at: null, recipient_count: null, created_at: new Date().toISOString(), created_by_email: "admin@skinlabs.co.za", stats: { enqueued: 0, push_sent: 0, pending: 0, clicks: 0 } };
        if (existing) Object.assign(existing, row);
        else state.campaigns.unshift(row);
        log("notification_campaign_saved", { campaign_id: id });
        return { body: id };
      }
      case "admin_send_test_notification":
        log("notification_test_sent");
        return { body: "dispatch-1" };
      case "admin_send_notification_campaign_now": {
        if (state.members > 50 && a.p_confirm_recipients !== state.members) return { status: 400, body: { code: "22023", message: `confirmation_required:${state.members}`, hint: "Pass p_confirm_recipients" } };
        const c = state.campaigns.find((x) => x.id === a.p_id);
        if (c) Object.assign(c, { status: "sent", sent_at: new Date().toISOString(), recipient_count: state.members, stats: { enqueued: state.members, push_sent: 0, pending: state.members, clicks: 0 } });
        log("notification_campaign_sent", { campaign_id: a.p_id });
        return { body: state.members };
      }
      case "admin_schedule_notification_campaign": {
        if (Date.parse(String(a.p_scheduled_for)) < Date.now() - 5 * 60_000) return { status: 400, body: { code: "22023", message: "Schedule time must be in the future" } };
        if (state.members > 50 && a.p_confirm_recipients !== state.members) return { status: 400, body: { code: "22023", message: `confirmation_required:${state.members}` } };
        const c = state.campaigns.find((x) => x.id === a.p_id);
        if (c) Object.assign(c, { status: "scheduled", scheduled_for: a.p_scheduled_for });
        log("notification_campaign_scheduled", { campaign_id: a.p_id });
        return { body: state.members };
      }
      case "admin_cancel_notification_campaign": {
        const c = state.campaigns.find((x) => x.id === a.p_id);
        if (c && (c.status === "draft" || c.status === "scheduled")) c.status = "cancelled";
        log("notification_campaign_cancelled", { campaign_id: a.p_id });
        return { body: 0 };
      }
      case "admin_list_notification_campaigns":
        return { body: state.campaigns };
      case "admin_list_notification_dispatches":
        return { body: a.p_status === "failed" ? [] : [{ id: "d1", created_at: iso(-1), status: "sent", skip_reason: null, category: "briefing", source: "automation", title: "A tip for your week", devices_targeted: 1, devices_sent: 1, devices_failed: 0, last_error: null, email: "member@example.com", clicked: true }] };
      case "admin_list_notification_automations":
        return { body: state.automations };
      case "admin_list_notification_templates":
        return { body: state.templates };
      case "admin_list_notification_audit":
        return { body: state.audit };
      case "admin_update_notification_automation": {
        const auto = state.automations.find((x) => x.key === a.p_key);
        if (auto) {
          if (typeof a.p_enabled === "boolean") auto.enabled = a.p_enabled;
          if (typeof a.p_send_time === "string") auto.send_time = `${a.p_send_time}:00`;
        }
        log("notification_automation_updated", { key: a.p_key });
        return { body: auto };
      }
      case "admin_run_notification_automation_now": {
        const auto = state.automations.find((x) => x.key === a.p_key);
        if (!auto?.enabled) return { status: 400, body: { code: "22023", message: `Automation ${a.p_key} is switched off` } };
        log("notification_automation_run_now", { key: a.p_key, enqueued: 7 });
        return { body: 7 };
      }
      case "admin_create_notification_automation": {
        if (state.automations.some((x) => x.key === a.p_key)) return { status: 409, body: { code: "23505", message: 'duplicate key value violates unique constraint "notification_automations_key_key"' } };
        state.automations.push({ id: `a${state.automations.length + 1}`, key: a.p_key, name: a.p_name, description: a.p_description, trigger_kind: "schedule", frequency: a.p_frequency, send_time: `${a.p_send_time}:00`, weekday: a.p_weekday ?? null, month_day: a.p_month_day ?? null, template_key: a.p_template_key, audience: a.p_audience, system: false, enabled: false, last_run_at: null, last_run_count: null, stats: { enqueued: 0, sent: 0, skipped: 0, clicks: 0 }, template: null });
        log("notification_automation_created", { key: a.p_key });
        return { body: "new-id" };
      }
      case "admin_upsert_notification_template": {
        const t = state.templates.find((x) => x.key === a.p_key);
        if (t) Object.assign(t, { name: a.p_name, title: a.p_title, body: a.p_body, url: a.p_url, enabled: a.p_enabled });
        else state.templates.push({ key: a.p_key, name: a.p_name, description: a.p_description ?? null, category: a.p_category, title: a.p_title, body: a.p_body, inbox_title: a.p_inbox_title ?? null, inbox_body: a.p_inbox_body ?? null, url: a.p_url, channels: a.p_channels, enabled: a.p_enabled, system: false, lock_screen_safe: true, bypass_caps: false });
        log("notification_template_saved", { key: a.p_key });
        return { body: t ?? { key: a.p_key } };
      }
      default:
        return { status: 404, body: { message: `unexpected rpc ${fn}` } };
    }
  };
  return { state, handle };
};

const wire = async (page: Page, backend: ReturnType<typeof makeBackend>, admin = true) => {
  await page.route("**/rest/v1/rpc/has_role*", (route) => route.fulfill({ json: admin }));
  await page.route(/\/rest\/v1\/rpc\/admin_[a-z_]*notification[a-z_]*/, (route) => {
    const fn = /rpc\/([a-z_]+)/.exec(route.request().url())?.[1] ?? "";
    if (!admin) {
      backend.state.calls.push({ fn, args: {} });
      return route.fulfill({ status: 403, json: { code: "42501", message: "Admin access required" } });
    }
    let args: Record<string, unknown> = {};
    try {
      args = (route.request().postDataJSON() as Record<string, unknown>) ?? {};
    } catch {
      /* no body */
    }
    const out = backend.handle(fn, args);
    return route.fulfill({ status: out.status ?? 200, json: out.body });
  });
};

const open = async (page: Page, context: BrowserContext, backend: ReturnType<typeof makeBackend>) => {
  await mockSupabase(context, { signedIn: true });
  await wire(page, backend);
  await page.goto("/admin");
  // force: the tab strip scrolls and re-lays out as the dashboard's counts load (same as admin-passes.e2e.ts).
  await page.getByRole("tab", { name: "Notifications", exact: true }).click({ force: true });
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
};
// The homepage-style layout settles after load on phones, so a forced click can land a moment early: retry until selected.
const sub = async (page: Page, name: string | RegExp) => {
  const tab = page.getByRole("tab", { name });
  await expect(async () => {
    await tab.click({ force: true });
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
};
const callsOf = (b: ReturnType<typeof makeBackend>, fn: string) => b.state.calls.filter((c) => c.fn === fn);

test("a member without the admin role gets nothing: no tab, and not a single notification RPC is called", async ({ page, context }) => {
  const backend = makeBackend();
  await mockSupabase(context, { signedIn: true });
  await wire(page, backend, false);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Notifications", exact: true })).toHaveCount(0);
  await expect(page.getByText("Push delivery")).toHaveCount(0);
  expect(backend.state.calls).toEqual([]);
});

test("a signed-out visitor sees the sign-in state and no notification RPC is called", async ({ page, context }) => {
  const backend = makeBackend();
  await mockSupabase(context, { signedIn: false });
  await wire(page, backend, false);
  await page.goto("/admin");
  await expect(page.getByText("Sign in with your SkinLabs® admin account to continue.")).toBeVisible();
  expect(backend.state.calls).toEqual([]);
});

test("the RPC itself refuses a non-admin: its message is shown verbatim", async ({ page, context }) => {
  // The role gate says admin (so the area renders) but the RPC answers like a non-admin session would.
  const backend = makeBackend();
  backend.state.failNext.set("admin_notification_overview", "Admin access required");
  await open(page, context, backend);
  await expect(page.getByText("Admin access required").first()).toBeVisible();
});

test.describe("Overview and the kill switch", () => {
  test("shows the numbers; pausing asks first, sends the RPC, shows the banner; resuming clears it", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await expect(page.getByTestId("total-push_sent")).toHaveText("9");
    await expect(page.getByText("Member has this category off")).toBeVisible();
    await expect(page.getByTestId("push-paused-banner")).toHaveCount(0);

    await page.getByRole("switch", { name: /Push delivery/ }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("Pause all push notifications?");
    expect(callsOf(backend, "admin_set_notification_settings")).toHaveLength(0); // nothing until confirmed
    await dialog.getByRole("button", { name: "Pause push" }).click();
    await expect(page.getByTestId("push-paused-banner")).toContainText("Push is paused");
    expect(callsOf(backend, "admin_set_notification_settings")[0].args).toEqual({ p_push_enabled: false });

    await page.getByRole("switch", { name: /Push delivery/ }).click();
    await expect(page.getByTestId("push-paused-banner")).toHaveCount(0);
    expect(callsOf(backend, "admin_set_notification_settings")[1].args).toEqual({ p_push_enabled: true });
  });

  test("a failed pause shows the RPC's message verbatim and the banner does not appear", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    backend.state.failNext.set("admin_set_notification_settings", "Admin access required");
    await page.getByRole("switch", { name: /Push delivery/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Pause push" }).click();
    await expect(page.getByText("Admin access required").first()).toBeVisible();
    await expect(page.getByTestId("push-paused-banner")).toHaveCount(0);
  });

  test("default daily limit and a test push", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await page.getByRole("button", { name: "Raise default limit" }).click();
    await page.getByRole("button", { name: "Save limit" }).click();
    await expect.poll(() => callsOf(backend, "admin_set_notification_settings").map((c) => c.args)).toEqual([{ p_default_daily_cap: 3 }]);
    await page.getByRole("button", { name: "Send a test push to me" }).click();
    await expect.poll(() => callsOf(backend, "admin_send_test_notification")).toHaveLength(1);
    await page.getByRole("button", { name: "7 days" }).click();
    await expect.poll(() => callsOf(backend, "admin_notification_overview").some((c) => c.args.p_days === 7)).toBe(true);
  });
});

test.describe("Compose → preview → save → test → send / schedule → cancel", () => {
  const fill = async (page: Page, over: { title?: string; body?: string } = {}) => {
    await sub(page, "Compose");
    await page.getByLabel("Campaign name (only you see this)").fill("October offer");
    await page.getByLabel("Title").fill(over.title ?? "A note from SkinLabs®");
    await page.getByLabel("Message").fill(over.body ?? "Something worth a look.");
  };

  test("previews every OS, counts the audience, and sends only the filters that were set", async ({ page, context }) => {
    const backend = makeBackend(3);
    await open(page, context, backend);
    await fill(page);
    for (const os of ["ios", "android", "desktop"]) await expect(page.getByTestId(`preview-${os}`)).toContainText("A note from SkinLabs®");
    await expect(page.getByTestId("audience-preview")).toContainText("Members matched");
    await expect(page.getByTestId("audience-preview").getByText("3", { exact: true }).first()).toBeVisible();

    await page.getByRole("checkbox", { name: "Glow Insider" }).check();
    await page.getByLabel("Has a push device").selectOption("yes");
    await expect.poll(() => callsOf(backend, "admin_preview_notification_audience").at(-1)?.args.p_audience).toEqual({ tiers: ["insider"], push_enabled: true });
    expect(callsOf(backend, "admin_preview_notification_audience").at(-1)?.args).toMatchObject({ p_category: "service", p_channels: ["inbox", "push"] });

    // Category changes the opted-out number (promotional is opt-in).
    await page.getByLabel("Category").selectOption("promotional");
    await expect(page.getByTestId("audience-preview")).toContainText("Opted out of this");
    await expect(page.getByTestId("audience-preview").getByText("2", { exact: true }).first()).toBeVisible();
  });

  test("80 / 240 limits block sending and say why", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await fill(page, { title: "T".repeat(81), body: "B".repeat(241) });
    await expect(page.getByTestId("title-count")).toHaveText("81/80");
    await expect(page.getByTestId("body-count")).toHaveText("241/240");
    await expect(page.getByText(/limited to 80 characters/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Send now…" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
    await page.getByLabel("Title").fill("T".repeat(80));
    await page.getByLabel("Message").fill("B".repeat(240));
    await expect(page.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });

  test("health categories carry the generic-copy warning", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await sub(page, "Compose");
    await page.getByLabel("Category").selectOption("report_ready");
    await expect(page.getByText("Keep lock-screen text generic")).toBeVisible();
    await page.getByLabel("Category").selectOption("briefing");
    await expect(page.getByText("Keep lock-screen text generic")).toHaveCount(0);
  });

  test("save draft, send a test to me, then send now: exact payloads and a confirm step", async ({ page, context }) => {
    const backend = makeBackend(3);
    await open(page, context, backend);
    await fill(page);
    await expect(page.getByTestId("audience-preview")).toContainText("Members matched");

    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.")).toBeVisible();
    expect(callsOf(backend, "admin_save_notification_campaign")[0].args).toMatchObject({
      p_id: null,
      p_name: "October offer",
      p_category: "service",
      p_title: "A note from SkinLabs®",
      p_body: "Something worth a look.",
      p_url: "/dashboard?tab=inbox",
      p_channels: ["inbox", "push"],
      p_audience: {},
    });

    await page.getByRole("button", { name: "Send a test to me" }).click();
    await expect.poll(() => callsOf(backend, "admin_send_test_notification")[0]?.args).toEqual({ p_title: "A note from SkinLabs®", p_body: "Something worth a look.", p_url: "/dashboard?tab=inbox" });

    await page.getByRole("button", { name: "Send now…" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("3 members");
    expect(callsOf(backend, "admin_send_notification_campaign_now")).toHaveLength(0);
    await dialog.getByRole("button", { name: "Send to 3" }).click();
    await expect(page.getByText(/Sent: 3 notifications queued/)).toBeVisible();
    const sent = callsOf(backend, "admin_send_notification_campaign_now")[0].args;
    expect(sent).toEqual({ p_id: "camp-1" }); // ≤ 50 recipients: no confirmation number
    // The edited draft was re-saved (same id) before sending, not duplicated.
    expect(callsOf(backend, "admin_save_notification_campaign").every((c) => c.args.p_id === null || c.args.p_id === "camp-1")).toBe(true);

    await sub(page, /Scheduled/);
    const row = page.getByTestId("campaign-row").first();
    await expect(row).toContainText("October offer");
    await expect(row).toHaveAttribute("data-status", "sent");
    await expect(page.getByTestId("dispatch-row").first()).toContainText("member@example.com");
  });

  test("more than 50 recipients: the audience size must be typed, and is sent as p_confirm_recipients", async ({ page, context }) => {
    const backend = makeBackend(240);
    await open(page, context, backend);
    await fill(page);
    await expect(page.getByTestId("audience-preview")).toContainText("240");
    await page.getByRole("button", { name: "Send now…" }).click();
    const dialog = page.getByRole("alertdialog");
    const go = dialog.getByRole("button", { name: "Send to 240" });
    await expect(go).toBeDisabled();
    await dialog.getByLabel(/Type 240 to confirm/).fill("24");
    await expect(go).toBeDisabled();
    await dialog.getByLabel(/Type 240 to confirm/).fill("240");
    await expect(go).toBeEnabled();
    await go.click();
    await expect(page.getByText(/Sent: 240 notifications queued/)).toBeVisible();
    expect(callsOf(backend, "admin_send_notification_campaign_now")[0].args).toEqual({ p_id: "camp-1", p_confirm_recipients: 240 });
  });

  test("if the audience grew since the preview, the server's confirmation_required message is shown verbatim", async ({ page, context }) => {
    const backend = makeBackend(60);
    await open(page, context, backend);
    await fill(page);
    await expect(page.getByTestId("audience-preview")).toContainText("60");
    await page.getByRole("button", { name: "Send now…" }).click();
    backend.state.members = 75; // 15 members joined the audience after the preview
    const dialog = page.getByRole("alertdialog");
    await dialog.getByLabel(/Type 60 to confirm/).fill("60");
    await dialog.getByRole("button", { name: "Send to 60" }).click();
    await expect(page.getByText("confirmation_required:75").first()).toBeVisible();
    // The dialog now asks for the new size.
    await expect(dialog.getByLabel(/Type 75 to confirm/)).toBeVisible();
  });

  test("schedule: a past time is refused with the server's message; a future time is scheduled, listed, and can be cancelled", async ({ page, context }) => {
    const backend = makeBackend(3);
    await open(page, context, backend);
    await fill(page);
    await expect(page.getByTestId("audience-preview")).toContainText("Members matched");

    await page.getByLabel("Schedule for (South African time)").fill("2020-01-01T09:00");
    await page.getByRole("button", { name: "Schedule…" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByText("Schedule time must be in the future").first()).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();

    await page.getByLabel("Schedule for (South African time)").fill("2030-05-05T09:00");
    await page.getByRole("button", { name: "Schedule…" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("2030");
    await page.getByRole("alertdialog").getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByText(/^Scheduled for /)).toBeVisible();
    // 09:00 South African time is 07:00 UTC.
    expect(callsOf(backend, "admin_schedule_notification_campaign").at(-1)?.args.p_scheduled_for).toBe("2030-05-05T07:00:00.000Z");

    await sub(page, /Scheduled/);
    const row = page.getByTestId("campaign-row").first();
    await expect(row).toHaveAttribute("data-status", "scheduled");
    await row.getByRole("button", { name: /^Cancel:/ }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes, cancel" }).click();
    await expect(page.getByTestId("campaign-row").first()).toHaveAttribute("data-status", "cancelled");
    expect(callsOf(backend, "admin_cancel_notification_campaign")).toHaveLength(1);
  });

  test("a saved draft can be edited from History and is saved under the same id", async ({ page, context }) => {
    const backend = makeBackend(3);
    await open(page, context, backend);
    await fill(page);
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Draft saved.")).toBeVisible();
    await sub(page, /Scheduled/);
    await page.getByRole("button", { name: "Edit draft: October offer" }).click();
    await expect(page.getByLabel("Title")).toHaveValue("A note from SkinLabs®");
    await page.getByLabel("Title").fill("A fresher title");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect.poll(() => callsOf(backend, "admin_save_notification_campaign").at(-1)?.args).toMatchObject({ p_id: "camp-1", p_title: "A fresher title" });
    expect(backend.state.campaigns).toHaveLength(1);
  });

  test("a save error is shown verbatim", async ({ page, context }) => {
    const backend = makeBackend(3);
    await open(page, context, backend);
    await fill(page);
    backend.state.failNext.set("admin_save_notification_campaign", "Only draft campaigns can be edited");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Only draft campaigns can be edited").first()).toBeVisible();
  });
});

test.describe("Automations", () => {
  test("toggle on/off, run now only when on (with a confirm), and verbatim errors", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await sub(page, "Automations");
    const row = page.getByTestId("automation-row").filter({ hasText: "Daily briefing" });
    await expect(row.getByRole("button", { name: /Run now/ })).toBeDisabled(); // off
    await row.getByRole("switch", { name: /enabled/ }).click();
    await expect.poll(() => callsOf(backend, "admin_update_notification_automation").at(-1)?.args).toEqual({ p_key: "daily_briefing_push", p_enabled: true });
    await expect(row.getByRole("button", { name: /Run now/ })).toBeEnabled();

    await row.getByRole("button", { name: /Run now/ }).click();
    expect(callsOf(backend, "admin_run_notification_automation_now")).toHaveLength(0);
    await page.getByRole("alertdialog").getByRole("button", { name: "Run now" }).click();
    await expect(page.getByText(/queued/).first()).toBeVisible();
    expect(callsOf(backend, "admin_run_notification_automation_now")[0].args).toEqual({ p_key: "daily_briefing_push" });

    // Time change is sent as HH:MM.
    await row.getByLabel("Send at (SAST)").fill("07:45");
    await row.getByLabel("Send at (SAST)").blur();
    await expect.poll(() => callsOf(backend, "admin_update_notification_automation").at(-1)?.args).toEqual({ p_key: "daily_briefing_push", p_send_time: "07:45" });

    // Event automations have no schedule controls and no run-now.
    const event = page.getByTestId("automation-row").filter({ hasText: "When it happens" });
    await expect(event.getByRole("button", { name: /Run now/ })).toHaveCount(0);
    backend.state.failNext.set("admin_update_notification_automation", "Unknown automation report_ready_event");
    await event.getByRole("switch", { name: /enabled/ }).click();
    await expect(page.getByText("Unknown automation report_ready_event").first()).toBeVisible();
  });

  test("create a scheduled automation (starts off); a duplicate key's error is shown verbatim", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await sub(page, "Automations");
    await page.getByRole("button", { name: "New scheduled automation" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/^Key/).fill("friday_tip");
    await dialog.getByLabel("Name").fill("Friday tip");
    await dialog.getByLabel("How often").selectOption("weekly");
    await dialog.getByLabel("Day of the week").selectOption("5");
    await dialog.getByLabel("Template to send").selectOption("weekly_tip");
    await dialog.getByLabel("Glow Insider").check();
    await dialog.getByRole("button", { name: "Create automation" }).click();
    await expect(page.getByText(/switched off until you turn it on/)).toBeVisible();
    expect(callsOf(backend, "admin_create_notification_automation")[0].args).toMatchObject({
      p_key: "friday_tip",
      p_name: "Friday tip",
      p_frequency: "weekly",
      p_send_time: "09:00",
      p_template_key: "weekly_tip",
      p_weekday: 5,
      p_audience: { tiers: ["insider"] },
    });
    await expect(page.getByTestId("automation-row").filter({ hasText: "Friday tip" })).toBeVisible();

    await page.getByRole("button", { name: "New scheduled automation" }).click();
    await dialog.getByLabel(/^Key/).fill("friday_tip");
    await dialog.getByLabel("Name").fill("Again");
    await dialog.getByLabel("Template to send").selectOption("weekly_tip");
    await dialog.getByRole("button", { name: "Create automation" }).click();
    await expect(page.getByText(/duplicate key value violates unique constraint/).first()).toBeVisible();
  });
});

test.describe("Templates and Audit", () => {
  test("a system template can be reworded but its category and channels are fixed; limits are enforced", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await sub(page, "Templates");
    await page.getByRole("button", { name: "Edit template: Report ready" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Category")).toBeDisabled();
    await expect(dialog.getByLabel("Key", { exact: true })).toBeDisabled();
    await expect(dialog.getByText("Keep lock-screen text generic")).toBeVisible();
    await dialog.getByLabel("Title", { exact: true }).fill("T".repeat(81));
    await expect(dialog.getByRole("button", { name: "Save template" })).toBeDisabled();
    await dialog.getByLabel("Title", { exact: true }).fill("Your SkinLabs® report is ready now");
    await dialog.getByRole("button", { name: "Save template" }).click();
    await expect(page.getByText("Template saved.")).toBeVisible();
    expect(callsOf(backend, "admin_upsert_notification_template")[0].args).toMatchObject({ p_key: "report_ready", p_title: "Your SkinLabs® report is ready now", p_category: "report_ready", p_channels: ["inbox", "push"] });
  });

  test("a new template needs a valid key", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await sub(page, "Templates");
    await page.getByRole("button", { name: "New template" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name", { exact: true }).fill("Welcome");
    await dialog.getByLabel("Title", { exact: true }).fill("Welcome to SkinLabs®");
    await dialog.getByLabel("Message", { exact: true }).fill("Glad you’re here.");
    await dialog.getByLabel("Key", { exact: true }).fill("Bad Key!");
    await expect(dialog.getByRole("button", { name: "Save template" })).toBeDisabled();
    await dialog.getByLabel("Key", { exact: true }).fill("welcome_note");
    await expect(dialog.getByRole("button", { name: "Save template" })).toBeEnabled();
  });

  test("the audit trail lists what was done here", async ({ page, context }) => {
    const backend = makeBackend();
    await open(page, context, backend);
    await page.getByRole("button", { name: "Raise default limit" }).click();
    await page.getByRole("button", { name: "Save limit" }).click();
    await expect.poll(() => backend.state.audit.length).toBe(1);
    await sub(page, "Audit");
    await expect(page.getByTestId("audit-row").first()).toContainText("settings updated");
    await expect(page.getByTestId("audit-row").first()).toContainText("admin@skinlabs.co.za");
  });
});

test("the area never queries tables or calls anything but the admin notification RPCs", async ({ page, context }) => {
  const backend = makeBackend();
  const stray: string[] = [];
  await mockSupabase(context, { signedIn: true });
  await wire(page, backend);
  page.on("request", (req) => {
    const u = req.url();
    if (/notification_(templates|automations|campaigns|dispatches|settings|admin_audit_log)|push_deliveries|push_subscriptions/.test(u) && /rest\/v1\/(?!rpc)/.test(u)) stray.push(u);
  });
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Notifications", exact: true }).click({ force: true });
  for (const name of ["Compose", "Automations", "Templates", /Scheduled/, "Audit"]) await sub(page, name);
  expect(stray).toEqual([]);
});
