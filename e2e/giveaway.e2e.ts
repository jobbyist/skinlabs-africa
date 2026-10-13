import { expect, test, type Page } from "@playwright/test";
import { mockSupabase, type MockState } from "./support/mockSupabase";

/**
 * October 2026 Skin Story Giveaway landing page (/giveaways/october-2026): content, CTA routing, entry
 * confirmation, terms, tracking and the privacy guarantees. Supabase is mocked (e2e/support/mockSupabase.ts).
 */
const PATH = "/giveaways/october-2026";
const CAMPAIGN_QS = "?utm_source=tiktok&utm_medium=paid_social&utm_campaign=skinlabs_october_2026_giveaway&utm_content=ad1&ttclid=E_C_P_test123";

type Captured = { analytics: { event_name: string; payload: Record<string, unknown> }[]; tiktok: Record<string, unknown>[] };

const capture = (page: Page): Captured => {
  const c: Captured = { analytics: [], tiktok: [] };
  page.on("request", (req) => {
    const url = req.url();
    if (req.method() !== "POST") return;
    try {
      if (url.includes("/rest/v1/analytics_events")) c.analytics.push(req.postDataJSON());
      if (url.includes("/functions/v1/tiktok-events")) c.tiktok.push(req.postDataJSON());
    } catch {
      /* ignore */
    }
  });
  return c;
};

test("landing page: hero, prizes, steps, story, deadline and terms render without overflow", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  await page.goto(PATH + CAMPAIGN_QS);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your Skin Story Could Win You More Than Great Skin Insights.");
  await expect(page.getByText("2 people will win")).toBeVisible();
  await expect(page.getByText("R500 Takealot Voucher + Lifetime Glow Insider")).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started with the free skin assessment" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Start the free dermatology analysis" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Two Winners. Two Big SkinLabs® Rewards." })).toBeVisible();
  await expect(page.getByText("Entries close 31 October 2026.")).toBeVisible();
  await expect(page.getByText("isn't a giveaway entry")).toBeVisible();
  await expect(page.getByText("You do not have to leave a positive review.", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your skin has a story. Tell us yours." })).toBeVisible();
  // No site navigation, no ads: one action.
  await expect(page.getByRole("navigation", { name: /main/i })).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("SEO: exact title, description, canonical and social tags", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  await page.goto(PATH + CAMPAIGN_QS);
  await expect(page).toHaveTitle("Win R500 + Lifetime Glow Insider | SkinLabs® October Giveaway");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://skinlabs.co.za/giveaways/october-2026");
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  expect(desc).toContain("R500 Takealot voucher");
  expect(desc).toContain("31 Oct 2026");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Win R500/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og-giveaway-october-2026\.jpg/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("unauthenticated CTA goes to the existing free assessment, keeping the campaign labels", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const c = capture(page);
  await page.goto(PATH + CAMPAIGN_QS);
  await page.getByRole("link", { name: "Get started with the free skin assessment" }).first().click();
  await expect(page).toHaveURL(/\/skynn-ai$/);
  await expect(page.getByRole("button", { name: /Start my (free )?Basic AI Skin Analysis/ })).toBeVisible();
  const attr = await page.evaluate(() => JSON.parse(sessionStorage.getItem("skinlabs_attribution") ?? "{}"));
  expect(attr.utm_campaign).toBe("skinlabs_october_2026_giveaway");
  expect(attr.utm_source).toBe("tiktok");
  const cta = c.analytics.find((e) => e.event_name === "giveaway_cta_click");
  expect(cta?.payload).toMatchObject({ campaign: "skinlabs_october_2026_giveaway", cta_location: "hero", cta: "primary", utm_source: "tiktok", utm_medium: "paid_social" });
});

test("page view is logged once per visit with only whitelisted campaign fields (no health data)", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const c = capture(page);
  await page.goto(PATH + CAMPAIGN_QS);
  await expect.poll(() => c.analytics.filter((e) => e.event_name === "giveaway_page_view").length).toBe(1);
  await page.waitForTimeout(800);
  expect(c.analytics.filter((e) => e.event_name === "giveaway_page_view")).toHaveLength(1);
  const view = c.analytics.find((e) => e.event_name === "giveaway_page_view")!;
  expect(view.payload).toMatchObject({ campaign: "skinlabs_october_2026_giveaway", landing_page: PATH, campaign_deadline: "2026-10-31" });
  expect(JSON.stringify(c.analytics)).not.toMatch(/skinType|concern|acne|mst_tone|answers|result_payload/);
});

test("terms are collapsible, contain the required rules, and opening them is reported once", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const c = capture(page);
  await page.goto(PATH);
  const section = page.locator("#terms");
  await section.scrollIntoViewIfNeeded();
  const open = async (name: string, text: string) => {
    const trigger = section.getByRole("button", { name, exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(section.getByText(text, { exact: false })).toBeVisible();
  };
  await open("Who can enter", "SkinLabs® staff");
  await open("How to enter", "One entry per person");
  await open("TikTok and Takealot", "not sponsored, administered, run or endorsed by TikTok or Takealot");
  await expect.poll(() => c.analytics.filter((e) => e.event_name === "giveaway_terms_viewed").length).toBe(1);
});

test("example Skin Story image replaces the video, with a working entry CTA", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const videoRequests: string[] = [];
  page.on("request", (r) => r.url().endsWith(".mp4") && videoRequests.push(r.url()));
  await page.goto(PATH);
  const img = page.getByRole("img", { name: /Example SkinLabs® Skin Story/ }).locator("visible=true").first();
  await img.scrollIntoViewIfNeeded();
  await expect(img).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(videoRequests).toHaveLength(0);
  await expect(page.getByRole("button", { name: "Enter the Giveaway" }).locator("visible=true").first()).toBeVisible();
});

test.describe("entry confirmation", () => {
  const analysis = { id: "rec-1", user_id: "00000000-0000-4000-8000-000000000001", status: "delivered", result_payload: { ok: true } };

  const reachEntry = async (page: Page) => {
    await page.goto(`${PATH}#enter`);
    await page.locator("#enter").scrollIntoViewIfNeeded();
  };

  test("signed out: asks to sign in (the sign-up dialog opens)", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    await reachEntry(page);
    await page.getByRole("button", { name: "Sign in to confirm your entry" }).click({ force: true });
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("signed in without a saved analysis: sent to the free assessment first", async ({ page, context }) => {
    const state = await mockSupabase(context, { signedIn: true });
    await reachEntry(page);
    await expect(page.getByText("One step first: your free assessment")).toBeVisible();
    expect(state.giveawayEntries).toHaveLength(0);
  });

  test("signed in with a saved analysis: validates, submits once, and says it is not auto-verified", async ({ page, context }) => {
    const state: MockState = await mockSupabase(context, { signedIn: true, tables: { skincare_recommendations: [analysis] } });
    const c = capture(page);
    await reachEntry(page);
    await page.getByLabel("Your TikTok username").fill("bad name!");
    await page.getByRole("button", { name: "Confirm my entry" }).click();
    await expect(page.getByRole("alert")).toContainText("TikTok username");
    await page.getByLabel("Your TikTok username").fill("@glow.fan");
    await page.getByRole("button", { name: "Confirm my entry" }).click();
    await expect(page.getByRole("alert")).toContainText("tick the box");
    await page.locator("#giveaway-posted").click();
    await page.getByRole("button", { name: "Confirm my entry" }).click();
    await expect(page.getByRole("alert")).toContainText("18 or older");
    await page.locator("#giveaway-eligible").click();
    await page.locator("#giveaway-terms").click();
    await page.getByRole("button", { name: "Confirm my entry" }).click();
    await expect(page.getByText("Your entry is in.")).toBeVisible();
    await expect(page.getByText("not confirmation that your Story has been verified", { exact: false })).toBeVisible();
    expect(state.giveawayEntries).toHaveLength(1);
    expect(state.giveawayEntries[0]).toMatchObject({ p_campaign: "skinlabs_october_2026_giveaway", p_tiktok_handle: "glow.fan", p_confirmed: true });
    await expect.poll(() => c.analytics.filter((e) => e.event_name === "giveaway_entry_submitted").length).toBe(1);
    // The TikTok handle never goes to analytics.
    expect(JSON.stringify(c.analytics)).not.toContain("glow.fan");
  });
});

test.describe("TikTok pixel + Events API (consented, real-browser presentation)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      const now = Date.now();
      localStorage.setItem(
        "skinlabs_cookie_consent_v1",
        JSON.stringify({ decision: "accepted", timestamp: new Date(now).toISOString(), expiresAt: new Date(now + 80 * 86_400_000).toISOString(), version: "v1", preferences: { analytics: true, personalisation: true, targetedAdvertising: true } }),
      );
    });
  });

  test("ViewContent + ClickButton reach the Events API with a unique event_id and no health data or query strings", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    // mockSupabase's init script overwrites consent with "rejected"; set ours last.
    await context.addInitScript(() => {
      const now = Date.now();
      localStorage.setItem(
        "skinlabs_cookie_consent_v1",
        JSON.stringify({ decision: "accepted", timestamp: new Date(now).toISOString(), expiresAt: new Date(now + 80 * 86_400_000).toISOString(), version: "v1", preferences: { analytics: true, personalisation: true, targetedAdvertising: true } }),
      );
    });
    const c = capture(page);
    await page.goto(PATH + CAMPAIGN_QS);
    await expect.poll(() => c.tiktok.filter((e) => e.event === "ViewContent").length).toBeGreaterThan(0);
    await page.getByRole("link", { name: "Get started with the free skin assessment" }).first().click();
    await expect.poll(() => c.tiktok.filter((e) => e.event === "ClickButton").length).toBe(1);

    const view = c.tiktok.find((e) => e.event === "ViewContent")!;
    expect(view).toMatchObject({ contentId: "giveaway-october-2026", consent: true, ttclid: "E_C_P_test123" });
    const click = c.tiktok.find((e) => e.event === "ClickButton")!;
    expect(click.contentId).toBe("giveaway-october-2026");
    const ids = c.tiktok.map((e) => e.eventId as string);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of c.tiktok) {
      expect(String(e.url)).toContain("/giveaways/");
      expect(JSON.stringify(e)).not.toMatch(/skinType|acne|concern|mst|answers|result/i);
    }
    // Campaign labels are never forwarded to TikTok (they stay first-party).
    expect(JSON.stringify(c.tiktok)).not.toContain("utm_");
    // A refresh is a new page view; a re-render is not.
    const before = c.tiktok.filter((e) => e.event === "ClickButton").length;
    await page.waitForTimeout(500);
    expect(c.tiktok.filter((e) => e.event === "ClickButton").length).toBe(before);
  });

  test("without advertising consent nothing is sent to TikTok", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false });
    const c = capture(page);
    await page.goto(PATH + CAMPAIGN_QS);
    await page.getByRole("link", { name: "Get started with the free skin assessment" }).first().click();
    await page.waitForTimeout(500);
    expect(c.tiktok).toHaveLength(0);
  });
});

test("journey: giveaway → free assessment → results carry a way back to the giveaway entry", async ({ page, context }) => {
  test.setTimeout(120_000);
  await mockSupabase(context, { signedIn: false });
  const c = capture(page);
  await page.goto(PATH + CAMPAIGN_QS);
  await page.getByRole("link", { name: "Get started with the free skin assessment" }).first().click();
  await page.getByRole("button", { name: /Start my (free )?Basic AI Skin Analysis/ }).click();
  await expect.poll(() => c.analytics.filter((e) => e.event_name === "giveaway_assessment_started").length).toBe(1);
  for (const id of ["consent-data", "consent-mst", "consent-terms"]) await page.locator(`#${id}`).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip photo" }).click();
  await page.getByRole("button", { name: "Prefer not to say" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (let i = 0; i < 20; i++) {
    await page.locator('[role="radiogroup"] label').first().click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await page.getByText("My skin has always been like this").click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('[role="radiogroup"] label').first().click();
  await page.getByRole("button", { name: "See My Results" }).click();
  await expect(page.getByTestId("giveaway-nudge")).toBeVisible();
  await expect.poll(() => c.analytics.filter((e) => e.event_name === "giveaway_assessment_completed").length).toBe(1);
  // Completed is reported once, and no skin data rides on any giveaway event.
  const giveaway = c.analytics.filter((e) => e.event_name.startsWith("giveaway_"));
  for (const e of giveaway) expect(Object.keys(e.payload).filter((k) => !/^(utm_|attr_sid|path$|campaign|landing_page|cta)/.test(k))).toEqual([]);
  await page.getByRole("link", { name: /Back to the giveaway/ }).click();
  await expect(page).toHaveURL(/\/giveaways\/october-2026#enter$/);
});

test("results of someone who never visited the giveaway show no giveaway nudge or events", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const c = capture(page);
  await page.goto("/skynn-ai");
  await page.getByRole("button", { name: /Start my (free )?Basic AI Skin Analysis/ }).click();
  await page.waitForTimeout(400);
  expect(c.analytics.filter((e) => e.event_name.startsWith("giveaway_"))).toHaveLength(0);
});
