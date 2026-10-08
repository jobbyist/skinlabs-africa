import { expect, test } from "@playwright/test";
import { freeProfile, mockSupabase } from "./support/mockSupabase";

/** 8 Oct 2026 final UI/UX tweaks. Supabase is mocked (e2e/support/mockSupabase.ts). */

test("home: latest reviews sit above Comparisons, 3 cards each, category photos", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  await page.goto("/");
  const latest = page.locator("#latest-reviews");
  const comparisons = page.locator("#editorials");
  await expect(latest.locator("a[href^='/reviews/']")).toHaveCount(3);
  await expect(comparisons.locator("a[href^='/reviews/versus/']")).toHaveCount(3);
  const order = await page.evaluate(() => {
    const a = document.querySelector("#latest-reviews");
    const b = document.querySelector("#editorials");
    return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
  for (const src of await latest.locator("img").evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).src))) {
    expect(src).toContain("images.unsplash.com");
  }
});

test("home: the 3 featured comparisons rotate between loads", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const seen = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.goto("/");
    await expect(page.locator("#editorials a[href^='/reviews/versus/']")).toHaveCount(3);
    await page.waitForTimeout(150);
    seen.add((await page.locator("#editorials a[href^='/reviews/versus/']").evaluateAll((a) => a.map((x) => x.getAttribute("href")).join("|"))));
  }
  expect(seen.size).toBeGreaterThan(1);
});

test("pricing: Glow Insider card has the animated gradient border", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  await page.goto("/pricing");
  const card = page.locator("div.gradient-border-anim", { has: page.getByRole("heading", { name: /Glow Insider/ }) });
  await expect(card).toHaveCount(1);
});

test("header: no Marketplace under Explore, and every Coming Soon link sits last in the Explore grid", async ({ page, context }, info) => {
  test.skip(info.project.name.startsWith("mobile"), "desktop menu popover");
  await mockSupabase(context, { signedIn: false });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const panel = page.locator("[data-radix-popper-content-wrapper]");
  await expect(panel.getByRole("link", { name: /Marketplace/ })).toHaveCount(0);
  const cards = panel.locator("a.gradient-border-anim");
  const texts = await cards.allInnerTexts();
  const soon = texts.map((t) => /coming soon/i.test(t));
  expect(soon.some(Boolean)).toBe(true);
  // once a "Coming Soon" card appears, every card after it is one too
  expect(soon.slice(soon.indexOf(true)).every(Boolean)).toBe(true);
  await expect(panel.getByRole("link", { name: /Practice Suite/ })).toContainText(/coming soon/i);
});

const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
test.describe("get the app", () => {
test.use({ userAgent: ANDROID_UA });
test("header: signed-in member who hasn't installed sees Get the app instead of the promo", async ({ page, context }) => {
  // The PWA layer switches itself off for automation (see e2e/pwa.e2e.ts), so present as a real browser.
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/");
  await page.evaluate(() => {
    const ev = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
    ev.prompt = async () => undefined;
    ev.userChoice = Promise.resolve({ outcome: "dismissed", platform: "web" });
    window.dispatchEvent(ev);
  });
  await expect(page.getByRole("button", { name: "Get the SkinLabs app" }).first()).toBeVisible();
  await expect(page.getByText(/Free until/)).toHaveCount(0);
});
});

test("settings: username card validates live and offers free suggestions", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile({ username: "glow_abc234", username_generated: true, full_name: "Thandi Nkosi" }) });
  await context.route(/rest\/v1\/rpc\/check_usernames/, (r) => {
    const names = (r.request().postDataJSON() as { p_usernames: string[] }).p_usernames;
    r.fulfill({ json: names.map((username) => ({ username, status: username === "taken_name" ? "taken" : "available" })) });
  });
  await page.goto("/dashboard?tab=profile");
  const field = page.getByLabel("Choose a username");
  await expect(field).toBeVisible();
  await field.fill("taken_name");
  await expect(page.getByText("taken_name is already taken.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save username" })).toBeDisabled();
  await field.fill("glow_nope");
  await expect(page.getByText(/reserved for new accounts/)).toBeVisible();
  await field.fill("thandi_skin1");
  await expect(page.getByText("thandi_skin1 is available.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save username" })).toBeEnabled();
  await expect(page.getByText("Available right now")).toBeVisible();
  await page.getByRole("button", { name: "thandinkosi", exact: true }).click().catch(() => undefined);
});
