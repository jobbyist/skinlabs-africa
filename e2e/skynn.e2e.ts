import { expect, test, type Page } from "@playwright/test";
import { ADVANCED_REFERENCE, freeProfile, mockSupabase, type MockState } from "./support/mockSupabase";

/**
 * SKYNN AI v2.1 — beta journeys (Basic AI Skin Analysis + Advanced AI
 * Dermatology Analysis), run for desktop + mobile in light + dark. Supabase is
 * mocked (e2e/support/mockSupabase.ts), including save_starter_analysis's
 * 7-day rule and the skynn-advanced-assessment function.
 */

const RETIRED = /Starter Analysis|AI Formulator|Advanced Assessment|Dermatology Report|SKYNN AI \(beta\)/;

const noLegacyCalls = (state: MockState) => {
  expect(state.functionCalls.map((c) => c.name)).not.toContain("skincare-ai");
  expect(state.rpcCalls).not.toContain("consume_analysis_pass");
  expect(state.rpcCalls).not.toContain("register_ai_analysis_use");
};

/**
 * Intro → consent → photo (skipped) → MST (prefer not to say) → 20 questions → context → preference → results.
 * 26 steps, ~35 s on a loaded runner — callers raise the per-test timeout.
 */
async function completeBasicAnalysis(page: Page) {
  test.setTimeout(90_000);
  await page.goto("/skynn-ai");
  await page.getByRole("button", { name: /Start my (free )?Basic AI Skin Analysis/ }).click();
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
}

test("anonymous Basic AI Skin Analysis: preview only, no automatic PDF, sign-up to see the rest", async ({ page, context }) => {
  const state = await mockSupabase(context, { signedIn: false });
  let downloaded = false;
  page.on("download", () => { downloaded = true; });
  await completeBasicAnalysis(page);
  await expect(page.getByRole("heading", { name: "Your skin at a glance" })).toBeVisible();
  await expect(page.getByText("Save your results — free")).toBeVisible();
  await expect(page.getByRole("button", { name: /Download my Basic AI Skin Analysis report/ })).toHaveCount(0);
  expect(downloaded).toBe(false);
  expect(state.basicSaves).toEqual([]);
  noLegacyCalls(state);
});

test("signed-in Basic AI Skin Analysis: saved server-side, then the full result and the PDF", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile() });
  await completeBasicAnalysis(page);
  await expect(page.getByRole("heading", { name: "Your Basic AI Skin Analysis", exact: true })).toBeVisible();
  expect(state.basicSaves).toHaveLength(1);
  expect(state.rpcCalls).toContain("get_formulator_allowance");
  // Nothing on the results screen may push the page sideways on a phone.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download my Basic AI Skin Analysis report/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^skinlabs-basic-ai-skin-analysis-.*\.pdf$/);
  noLegacyCalls(state);
});

test("weekly limit: a second Basic AI Skin Analysis inside 7 days is refused with the next date", async ({ page, context }) => {
  const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { lastFreeAnalysisAt: twoDaysAgo, passes: 2 } });
  await page.goto("/skynn-ai");
  await expect(page.getByRole("heading", { name: "You've used this week's Basic AI Skin Analysis" })).toBeVisible();
  await expect(page.getByText(/available once every 7 days\. Your next one is available on/)).toBeVisible();
  // Holding Analysis Passes never offers them for a Basic analysis.
  await expect(page.getByRole("button", { name: /Use an Analysis Pass/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Start my (free )?Basic AI Skin Analysis/ })).toHaveCount(0);
  expect(state.basicSaves).toEqual([]);
  noLegacyCalls(state);
});

test("every Advanced entry point on /skynn-ai goes to the one Pass-gated flow", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile({ subscription_status: "insider" }) });
  await page.goto("/skynn-ai");
  await page.getByRole("button", { name: "Get an Advanced AI Dermatology Analysis" }).click();
  await expect(page).toHaveURL(/\/skynn-ai\/advanced$/);
  // Membership alone doesn't include it — the server's access check says no Pass.
  await expect(page.getByText("You'll need an Analysis Pass")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get an Analysis Pass" })).toBeVisible();
  noLegacyCalls(state);
});

test("Advanced AI Dermatology Analysis with a Pass: submit → pending submission with a reference", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { passes: 1 } });
  await page.goto("/skynn-ai/advanced");
  await expect(page.getByRole("heading", { name: "Advanced AI Dermatology Analysis" })).toBeVisible();
  await page.getByRole("button", { name: "Start my assessment" }).click();
  // One question per screen; a single-choice answer moves on by itself.
  await expect(page.getByText(/Question 1 of 3/)).toBeVisible();
  // The consent section's own introduction sits above every consent question.
  await expect(page.getByText("Before we start: how SKYNN AI handles your skin information.")).toBeVisible();
  await page.getByText("I agree", { exact: true }).click();
  await expect(page.getByText(/Question 2 of 3/)).toBeVisible();
  await expect(page.getByText("Before we start: how SKYNN AI handles your skin information.")).toBeVisible();
  await page.getByText("I agree to cross-border processing").click();
  await expect(page.getByText(/Question 3 of 3/)).toBeVisible();
  // The last question is optional, so the member can go straight to review.
  await page.getByRole("button", { name: "Review answers" }).click();
  await page.getByRole("button", { name: "Submit my request" }).click();
  await expect(page.getByRole("heading", { name: "Your Advanced AI Dermatology Analysis submission has been received." })).toBeVisible();
  await expect(page.getByText(ADVANCED_REFERENCE).first()).toBeVisible();
  expect(state.advancedSubmitted).toBe(true);
  expect(state.passes).toBe(0);
  noLegacyCalls(state);
});

test("Advanced AI Dermatology Analysis: declining consent blocks the flow, Back returns to the previous question", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { passes: 1 } });
  await page.goto("/skynn-ai/advanced");
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await page.getByText("I agree", { exact: true }).click();
  await expect(page.getByText(/Question 2 of 3/)).toBeVisible();
  await page.getByText("I don't agree to cross-border processing").click();
  await expect(page.getByRole("alert")).toContainText("only accept an Advanced AI Dermatology Analysis submission with your consent");
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await expect(page.getByText(/Question 2 of 3/)).toBeVisible();
  await page.getByRole("button", { name: "Previous question" }).click();
  await expect(page.getByText(/Question 1 of 3/)).toBeVisible();
  expect(state.advancedSubmitted).toBe(false);
});

test("no retired SKYNN AI names on the current surfaces", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), skynn: { passes: 1 } });
  for (const path of ["/skynn-ai", "/skynn-ai/advanced", "/routines"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(RETIRED);
  }
  await expect(page).toHaveTitle(/SkinLabs/);
});

test("/ai-formulator still redirects to /skynn-ai", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  await page.goto("/ai-formulator");
  await expect(page).toHaveURL(/\/skynn-ai$/);
});

// --- "Share my skin story" (1080 × 1920 PNG, built on-device) ----------------

const pngSize = (bytes: Buffer) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });

test("Share my skin story: no native file share → preview dialog, 1080×1920 download, link copy", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    (window as unknown as { __copied: string[] }).__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (t: string) => { (window as unknown as { __copied: string[] }).__copied.push(t); } },
      configurable: true,
    });
  });
  await completeBasicAnalysis(page);
  await expect(page.getByRole("heading", { name: "Your Basic AI Skin Analysis", exact: true })).toBeVisible();
  await expect(page.getByText("Share my skin type")).toHaveCount(0);
  await page.getByRole("button", { name: "Share my skin story" }).first().click();

  const dialog = page.getByRole("dialog", { name: "My Skin Story" });
  await expect(dialog).toBeVisible();
  const preview = dialog.getByRole("img", { name: /Your SkinLabs skin story/ });
  await expect(preview).toBeVisible();
  const box = await preview.boundingBox();
  expect(box && Math.abs(box.height / box.width - 16 / 9)).toBeLessThan(0.05);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "Download Story Image" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("skinlabs-my-skin-story.png");
  const path = await download.path();
  const { readFileSync } = await import("node:fs");
  expect(pngSize(readFileSync(path))).toEqual({ width: 1080, height: 1920 });

  await dialog.getByRole("button", { name: "Copy Share Link" }).click();
  await expect(page.getByText("Link copied — paste it anywhere")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual(["https://skinlabs.co.za/skynn-ai"]);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  // Loading state reset: the button is back and enabled.
  await expect(page.getByRole("button", { name: "Share my skin story" }).first()).toBeEnabled();
});

test("Share my skin story: native file share gets the PNG, no dialog", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: { title?: string; text?: string; name: string; type: string; size: number; hasUrl: boolean }[] };
    w.__shared = [];
    Object.defineProperty(navigator, "canShare", { value: (d: ShareData) => Boolean(d.files?.length), configurable: true });
    Object.defineProperty(navigator, "share", {
      value: async (d: ShareData) => {
        const f = d.files![0];
        w.__shared.push({ title: d.title, text: d.text, name: f.name, type: f.type, size: f.size, hasUrl: Boolean(d.url) });
      },
      configurable: true,
    });
  });
  await completeBasicAnalysis(page);
  await page.getByRole("button", { name: "Share my skin story" }).first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length)).toBe(1);
  const [shared] = await page.evaluate(() => (window as unknown as { __shared: { name: string; type: string; size: number; title: string }[] }).__shared);
  expect(shared).toMatchObject({ name: "skinlabs-my-skin-story.png", type: "image/png", title: "My Skin Story" });
  expect(shared.size).toBeGreaterThan(10_000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Share my skin story: cancelling the native sheet is silent and the button recovers", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
    Object.defineProperty(navigator, "share", {
      value: async () => { throw new DOMException("cancelled", "AbortError"); },
      configurable: true,
    });
  });
  await completeBasicAnalysis(page);
  const button = page.getByRole("button", { name: "Share my skin story" }).first();
  await button.click();
  await expect(button).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/couldn't create your skin story/)).toHaveCount(0);
});
