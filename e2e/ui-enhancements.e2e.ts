import { expect, test, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Homepage launchpad, skin-weather notch, members' content rail and contextual
 * feedback surveys. Supabase is mocked (e2e/support/mockSupabase.ts); the
 * weather call and the feedback insert are captured per test.
 */

const WEATHER = {
  uvNow: 4.2,
  uvMax: 9.4,
  uvPeakAt: null,
  humidity: 42,
  tempMax: 26,
  city: "johannesburg",
  cityLabel: "Johannesburg",
  fetchedAt: "2026-10-03T08:00:00Z",
  stale: false,
  attribution: "OpenWeather",
};

const mockWeather = (page: Page) =>
  page.route("**/functions/v1/skin-weather", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(WEATHER) }),
  );

const rail = (page: Page) => page.locator('nav[aria-label="Content sections"]');

test.describe("SKYNN AI launchpad", () => {
  test("shows the 4 steps, the Basic CTA, and doesn't load the quiz or PDF code", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    const heavy: string[] = [];
    page.on("request", (req) => {
      if (/AIFormulator|html2canvas|jspdf/i.test(req.url())) heavy.push(req.url());
    });
    await page.goto("/");
    const launchpad = page.locator("#skynn-launchpad");
    await launchpad.scrollIntoViewIfNeeded();
    for (const step of ["Skin Tone", "Primary Concern", "Desired Outcomes", "Tailored Routine"]) {
      await expect(launchpad.getByRole("button", { name: new RegExp(step) })).toBeVisible();
    }
    await expect(launchpad.getByRole("link", { name: "Start Your 2-Minute Basic AI Skin Analysis" })).toBeVisible();
    // Tapping a step opens its preview and hands control to the visitor.
    // force: the page height still settles for a few seconds (ad slots collapsing), which makes
    // Playwright's "element is stable" check slow on phones. The launchpad's own rows never move.
    await launchpad.getByRole("button", { name: /Primary Concern/ }).click({ force: true });
    await expect(launchpad.getByText("Dryness", { exact: true })).toBeVisible();
    expect(heavy).toEqual([]);
  });
});

test.describe("skin weather notch", () => {
  test("homepage only; shows UV, humidity and Highveld advice; dismissal lasts the day", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    await mockWeather(page);
    await page.goto("/");
    const tab = page.getByRole("button", { name: /Skin weather in Johannesburg: UV 9, Very high/ });
    await expect(tab).toBeVisible();
    await tab.click();
    const panel = page.getByRole("complementary", { name: "Today's skin weather" });
    await expect(panel.getByText("42%")).toBeVisible();
    await expect(panel.getByText("Highveld / inland")).toBeVisible();
    await page.getByRole("button", { name: "Hide skin weather for today" }).click();
    await expect(page.getByRole("complementary", { name: "Today's skin weather" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("button", { name: /Skin weather in/ })).toHaveCount(0);
  });

  test("not on other pages, and nothing renders when the weather call fails", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    await mockWeather(page);
    await page.goto("/reviews");
    await expect(page.getByRole("button", { name: /Skin weather in/ })).toHaveCount(0);

    await page.unroute("**/functions/v1/skin-weather");
    await page.route("**/functions/v1/skin-weather", (route) => route.fulfill({ status: 502, body: "{}" }));
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.getByRole("complementary", { name: "Today's skin weather" })).toHaveCount(0);
  });
});

test.describe("hero trial link", () => {
  test("hidden for signed-in members, shown to visitors", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Start Your 2-Minute Basic AI Skin Analysis" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Or try Glow Insider/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "See membership plans" })).toHaveCount(0);
  });
});

test.describe("members' content rail (phones)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("mobile"), "phone chrome only");
  });

  test("signed-out visitors never see it", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    await page.goto("/");
    await expect(rail(page)).toHaveCount(0);
  });

  test("members get all ten pills on key pages only, hides on scroll down, reveals on scroll up", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    await page.goto("/");
    await expect(rail(page)).toBeVisible();
    const labels = await rail(page).getByRole("link").allInnerTexts();
    expect(labels.map((l) => l.trim()).sort()).toEqual(
      [
        "AI Skin Analysis", "The Daily Skinny", "Seasonal Guides", "Shelf Showdown", "Business Solutions",
        "Practice Suite", "Verified Reviews", "Brand Spotlight", "Ingredient Dossier", "The Skin Deep Podcast",
      ].sort(),
    );

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(rail(page)).toHaveAttribute("aria-hidden", "true");
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(rail(page)).toHaveAttribute("aria-hidden", "false");

    // No horizontal page overflow from the strip.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // The order is reshuffled on a real page load, and the current section is marked.
    const first = labels.map((l) => l.trim());
    await page.reload();
    const second = (await rail(page).getByRole("link").allInnerTexts()).map((l) => l.trim());
    expect(second).not.toEqual(first);

    await page.goto("/reviews");
    await expect(rail(page).getByRole("link", { name: "Verified Reviews" })).toHaveAttribute("aria-current", "page");
    await page.goto("/pricing");
    await expect(rail(page)).toHaveCount(0);
  });
});

test.describe("contextual feedback survey (phones, members)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("mobile"), "mobile only by design");
  });

  test("appears once, sends to the database (not analytics), and never repeats", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    const inserts: Record<string, unknown>[] = [];
    await page.route("**/rest/v1/feedback_survey_responses*", async (route) => {
      inserts.push(route.request().postDataJSON());
      await route.fulfill({ status: 201, body: "" });
    });
    const analytics: string[] = [];
    await page.route("**/rest/v1/analytics_events*", async (route) => {
      analytics.push(route.request().postData() ?? "");
      await route.fulfill({ status: 201, body: "" });
    });

    await page.clock.install();
    await page.goto("/briefings");
    await expect(rail(page)).toBeVisible(); // signed in + phone resolved: the survey timer now exists
    await page.clock.fastForward(8000);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("What should The Daily Skinny cover?")).toBeVisible();
    await dialog.getByRole("button", { name: "Ingredient science" }).click();
    await dialog.getByLabel(/Anything you wish we covered/).fill("More on SPF for deeper skin tones");
    await dialog.getByRole("button", { name: "Send feedback" }).click();
    await expect(dialog).toHaveCount(0);

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      survey_id: "briefings-mobile-v1",
      surface: "briefings",
      answer: "ingredient_science",
      answer_label: "Ingredient science",
      comment: "More on SPF for deeper skin tones",
    });
    // The comment goes to feedback@ via the table, never into analytics.
    expect(analytics.join(" ")).not.toContain("SPF for deeper");

    // Same session, another surface: no second survey. Fresh load of the same one: not again.
    await page.goto("/reviews");
    await expect(rail(page)).toBeVisible();
    await page.clock.fastForward(9000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/briefings");
    await expect(rail(page)).toBeVisible();
    await page.clock.fastForward(9000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a failed send keeps the modal open and says so", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    await page.route("**/rest/v1/feedback_survey_responses*", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "boom" }) }),
    );
    await page.clock.install();
    await page.goto("/compare");
    await expect(rail(page)).toBeVisible();
    await page.clock.fastForward(8000);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Serums and treatments" }).click();
    await dialog.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText("Couldn't send your feedback")).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
