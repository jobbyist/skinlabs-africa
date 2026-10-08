import { expect, test, type BrowserContext } from "@playwright/test";
import { mockSupabase, USER_ID, type MockOptions } from "./support/mockSupabase";
import { stubPushApis, type PushStub } from "./support/pushHarness";

/**
 * Member side of the notification engine: Dashboard → Inbox (realtime, archive, read, mark-all, push-received refetch,
 * same-origin images/links only) and Dashboard → Settings → App → Notifications (every category, delivery times,
 * quiet hours, daily cap, devices, test, and the denied / needs_install / unsupported states).
 *
 *   VITE_VAPID_PUBLIC_KEY=<public key> npx vite build && npx playwright test e2e/notifications-member.e2e.ts
 */
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPHONE_SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const setup = async (context: BrowserContext, options: MockOptions, push: PushStub = { permission: "default" }) => {
  const state = await mockSupabase(context, { signedIn: true, ...options });
  // Real-browser presentation + a working ad network, so the ad-block wall stays away (see pwa.e2e.ts).
  await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await stubPushApis(context, push);
  return state;
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const inboxRow = (over: Record<string, unknown>) => ({
  user_id: USER_ID,
  category: "system",
  body: null,
  link: null,
  read_at: null,
  archived_at: null,
  expires_at: null,
  image_url: null,
  action_label: null,
  created_at: hoursAgo(1),
  ...over,
});

test.describe("inbox", () => {
  test.use({ userAgent: ANDROID_UA });

  const seed = () => [
    inboxRow({ id: "n-welcome", title: "Welcome to SkinLabs®", body: "Your account is ready.", created_at: hoursAgo(3) }),
    inboxRow({ id: "n-report", title: "Your SkinLabs® report is ready", body: "Tap to read it securely in the app.", link: "/dashboard?tab=analysis", action_label: "Open report", created_at: hoursAgo(2) }),
    inboxRow({ id: "n-old-read", title: "An old, read notice", read_at: hoursAgo(20), created_at: hoursAgo(30) }),
    inboxRow({ id: "n-archived", title: "Archived already", archived_at: hoursAgo(5), created_at: hoursAgo(6) }),
    inboxRow({ id: "n-expired", title: "Expired offer", expires_at: hoursAgo(1), created_at: hoursAgo(7) }),
  ];

  test("hides archived and expired rows, shows an unread count, and only our own images and links are honoured", async ({ page, context }) => {
    const rows = [
      ...seed(),
      inboxRow({ id: "n-img", title: "Cross-origin picture", image_url: "https://cdn.evil.example/x.jpg", link: "https://evil.example/phish", action_label: "Go", created_at: hoursAgo(0.5) }),
      inboxRow({ id: "n-own-img", title: "Own-origin picture", image_url: "/images/logo.png", created_at: hoursAgo(0.4) }),
    ];
    await setup(context, { tables: { notifications: rows } });
    await page.goto("/dashboard?tab=inbox");
    await expect(page.getByText("Welcome to SkinLabs®")).toBeVisible();
    await expect(page.getByText("Archived already")).toHaveCount(0);
    await expect(page.getByText("Expired offer")).toHaveCount(0);
    await expect(page.getByTestId("inbox-item")).toHaveCount(5);

    // Cross-origin image never rendered; own-origin one is. A cross-origin link gets no action button.
    const picture = page.getByTestId("inbox-item").filter({ hasText: "Cross-origin picture" }).first();
    await expect(picture.locator("img")).toHaveCount(0);
    await expect(picture.getByRole("button", { name: "Go" })).toHaveCount(0);
    await expect(page.getByTestId("inbox-item").filter({ hasText: "Own-origin picture" }).locator("img")).toHaveAttribute("src", "/images/logo.png");
    // The same-origin link has its action button.
    await expect(page.getByRole("button", { name: "Open report" })).toBeVisible();
  });

  test("a realtime INSERT appears without a refresh; an UPDATE with archived_at removes it", async ({ page, context }) => {
    const state = await setup(context, { tables: { notifications: seed() } });
    await page.goto("/dashboard?tab=inbox");
    await expect(page.getByText("Welcome to SkinLabs®")).toBeVisible();
    await expect.poll(() => state.realtime.bindings(), { timeout: 15_000 }).toBeGreaterThanOrEqual(1);

    const fresh = inboxRow({ id: "n-live", title: "Fresh from realtime", body: "Arrived while you were here.", created_at: new Date().toISOString() });
    state.realtime.emit("INSERT", fresh);
    const item = page.getByTestId("inbox-item").filter({ hasText: "Fresh from realtime" });
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute("data-unread", "true");
    // The newest row is on top.
    await expect(page.getByTestId("inbox-item").first()).toContainText("Fresh from realtime");
    // Redelivery of the same row never duplicates it.
    state.realtime.emit("INSERT", fresh);
    await expect(item).toHaveCount(1);

    // Archived on another device.
    state.realtime.emit("UPDATE", { ...fresh, archived_at: new Date().toISOString() });
    await expect(page.getByText("Fresh from realtime")).toHaveCount(0);
  });

  test("a push-received message from the service worker refetches the feed", async ({ page, context }) => {
    const rows = seed();
    await setup(context, { tables: { notifications: rows } });
    await page.goto("/dashboard?tab=inbox");
    await expect(page.getByText("Welcome to SkinLabs®")).toBeVisible();
    rows.unshift(inboxRow({ id: "n-pushed", title: "Delivered by push", created_at: new Date().toISOString() }));
    await page.evaluate(() => window.dispatchEvent(new Event("skinlabs:push-received")));
    await expect(page.getByText("Delivered by push")).toBeVisible();
  });

  test("opening marks it read (and follows a same-origin link); archive removes it; mark all read uses the RPC", async ({ page, context }) => {
    const state = await setup(context, { tables: { notifications: seed() } });
    await page.goto("/dashboard?tab=inbox");
    const welcome = page.getByTestId("inbox-item").filter({ hasText: "Welcome to SkinLabs®" });
    await expect(welcome).toHaveAttribute("data-unread", "true");

    await welcome.getByRole("button").first().click();
    await expect(welcome).toHaveAttribute("data-unread", "false");
    await expect.poll(() => state.notificationPatches.some((p) => p.id === "n-welcome" && typeof p.patch.read_at === "string")).toBe(true);

    await page.getByRole("button", { name: "Archive: An old, read notice" }).click();
    await expect(page.getByText("An old, read notice")).toHaveCount(0);
    await expect.poll(() => state.notificationPatches.some((p) => p.id === "n-old-read" && typeof p.patch.archived_at === "string")).toBe(true);

    await page.getByRole("button", { name: /Mark all read/ }).click();
    await expect.poll(() => state.rpcCalls.includes("mark_all_notifications_read")).toBe(true);
    await expect(page.getByTestId("inbox-item").filter({ hasText: "Your SkinLabs® report is ready" })).toHaveAttribute("data-unread", "false");
    await expect(page.getByRole("button", { name: /Mark all read/ })).toHaveCount(0);
  });

  test("the action button opens the link in the app", async ({ page, context }) => {
    await setup(context, { tables: { notifications: seed() } });
    await page.goto("/dashboard?tab=inbox");
    await page.getByRole("button", { name: "Open report" }).click();
    await expect(page).toHaveURL(/tab=analysis/);
  });
});

test.describe("Settings → App → Notifications", () => {
  test.use({ userAgent: ANDROID_UA });
  const open = (page: import("@playwright/test").Page) => page.goto("/dashboard?tab=app");
  const card = (page: import("@playwright/test").Page) => page.locator("#notification-settings");

  test("shows all eleven categories with an example, 'On by default' on the four defaults, and Offers and news off", async ({ page, context }) => {
    await setup(context, {});
    await open(page);
    const c = card(page);
    for (const label of [
      "Report ready",
      "Account updates",
      "Account and analysis updates",
      "Routine reminders",
      "SkinLabs® briefings",
      "Skin weather alerts",
      "Progress check-ins",
      "New podcast episodes",
      "Offers and news",
      "Price alerts",
      "Community activity",
    ]) {
      await expect(c.getByLabel(new RegExp(label)).first()).toBeVisible();
    }
    await expect(c.getByText("e.g. “Your SkinLabs® report is ready”")).toBeVisible();
    await expect(c.getByText("On by default", { exact: true })).toHaveCount(4);
    await expect(c.getByText("Offers and news - you can turn this off any time.")).toBeVisible();
    await expect(c.getByRole("switch", { name: /Offers and news/ })).not.toBeChecked();
    await expect(c.getByRole("switch", { name: /Report ready/ })).toBeChecked();
  });

  test("toggling a category writes only that column, never user_id or promotional_opt_in_at", async ({ page, context }) => {
    const state = await setup(context, {});
    await open(page);
    const c = card(page);
    await c.getByRole("switch", { name: /Offers and news/ }).click();
    await expect.poll(() => state.preferenceWrites.length).toBe(1);
    expect(state.preferenceWrites[0]).toEqual({ promotional: true });
    await c.getByRole("switch", { name: /Skin weather alerts/ }).click();
    await expect.poll(() => state.preferenceWrites.length).toBe(2);
    expect(state.preferenceWrites[1]).toEqual({ skin_weather: true });
    await c.getByRole("switch", { name: /Offers and news/ }).click();
    await expect.poll(() => state.preferenceWrites.length).toBe(3);
    expect(state.preferenceWrites[2]).toEqual({ promotional: false });
  });

  test("loads saved values from the real columns (HH:MM:SS → HH:MM) and writes time, quiet hours and the daily cap", async ({ page, context }) => {
    const state = await setup(context, {
      tables: {
        notification_preferences: [
          { user_id: USER_ID, briefing: true, routine_reminder_time: "07:30:00", quiet_hours_enabled: true, quiet_hours_start: "22:00:00", quiet_hours_end: "06:30:00", daily_cap: 4 },
        ],
      },
    });
    await open(page);
    const c = card(page);
    await expect(c.getByRole("switch", { name: /SkinLabs® briefings/ })).toBeChecked();
    await expect(c.getByLabel("Routine reminder time")).toHaveValue("07:30");
    await expect(c.getByLabel("From")).toHaveValue("22:00");
    await expect(c.getByLabel("Until")).toHaveValue("06:30");
    await expect(c.getByTestId("daily-cap")).toHaveText("4");

    await c.getByLabel("Routine reminder time").fill("08:15");
    await expect.poll(() => state.preferenceWrites.some((w) => w.routine_reminder_time === "08:15")).toBe(true);
    await c.getByLabel("Until").fill("07:00");
    await expect.poll(() => state.preferenceWrites.some((w) => w.quiet_hours_end === "07:00")).toBe(true);

    await c.getByRole("button", { name: "More per day" }).click();
    await expect(c.getByTestId("daily-cap")).toHaveText("5");
    await expect.poll(() => state.preferenceWrites.some((w) => w.daily_cap === 5)).toBe(true);
    // 0 and 10 are the limits.
    for (let i = 0; i < 12; i++) if (await c.getByRole("button", { name: "More per day" }).isEnabled()) await c.getByRole("button", { name: "More per day" }).click();
    await expect(c.getByTestId("daily-cap")).toHaveText("10");
    await expect(c.getByRole("button", { name: "More per day" })).toBeDisabled();

    await c.getByRole("switch", { name: /Quiet hours/ }).click();
    await expect(c.getByLabel("From")).toBeDisabled();
    await expect.poll(() => state.preferenceWrites.some((w) => w.quiet_hours_enabled === false)).toBe(true);
    // No write ever carried a forbidden column.
    expect(state.preferenceWrites.every((w) => !("user_id" in w) && !("promotional_opt_in_at" in w))).toBe(true);
  });

  test("lists devices, removes one by id, and 'Send me a test' reports the rate limit", async ({ page, context }) => {
    const state = await setup(context, { pushDevices: [{ id: "dev-a", platform: "android", browser: "chrome" }, { id: "dev-b", platform: "ios", browser: "safari" }] });
    let calls = 0;
    await context.route(/functions\/v1\/push-send/, (r) => {
      calls++;
      return calls === 1 ? r.fulfill({ json: { sent: 1 } }) : r.fulfill({ status: 429, json: { error: "too_many_requests" } });
    });
    await open(page);
    const c = card(page);
    await expect(c.getByText(/chrome on android/i)).toBeVisible();
    await expect(c.getByText(/safari on ios/i)).toBeVisible();

    await c.getByRole("button", { name: "Send me a test" }).click();
    await expect(page.getByText("Test notification sent to your devices.")).toBeVisible();
    await c.getByRole("button", { name: "Send me a test" }).click();
    await expect(page.getByText(/just sent one/)).toBeVisible();

    await c.getByRole("button", { name: /Remove this device: safari on ios/i }).click();
    await expect.poll(() => state.removedDevices).toEqual(["dev-b"]);
    await expect(c.getByText(/safari on ios/i)).toHaveCount(0);
    await expect(c.getByText(/chrome on android/i)).toBeVisible();
  });

  test("blocked: replaces the switches with re-enable steps and never asks the browser again", async ({ page, context }) => {
    await setup(context, {}, { permission: "denied" });
    await open(page);
    const c = card(page);
    await expect(c.getByText(/blocked for SkinLabs®/)).toBeVisible();
    await expect(c.getByText(/Open Permissions → Notifications|Choose Allow/).first()).toBeVisible();
    await expect(c.getByRole("switch")).toHaveCount(0);
    await expect(c.getByRole("button", { name: "Enable notifications" })).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __push: { requestCalls: number } }).__push.requestCalls)).toBe(0);
  });

  test("unsupported browser: says so, no switches", async ({ page, context }) => {
    await setup(context, {}, { permission: "default", noPushApi: true });
    await open(page);
    const c = card(page);
    await expect(c.getByText(/can’t receive push notifications/)).toBeVisible();
    await expect(c.getByRole("switch")).toHaveCount(0);
  });

  test.describe("iPhone in a Safari tab", () => {
    test.use({ userAgent: IPHONE_SAFARI_UA });
    test("needs_install: Home Screen steps as text, no switches", async ({ page, context }) => {
      await setup(context, {}, { permission: "default", noPushApi: true });
      await open(page);
      const c = card(page);
      await expect(c.getByText(/notifications work from the installed app/)).toBeVisible();
      await expect(c.getByText(/Add to Home Screen/)).toBeVisible();
      await expect(c.getByRole("switch")).toHaveCount(0);
    });
  });
});
