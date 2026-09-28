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
  await page.getByRole("button", { name: "Explore the Advanced AI Dermatology Analysis" }).click();
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
  await page.getByText("I agree", { exact: true }).click();
  await page.getByText("I agree to cross-border processing").click();
  await page.getByRole("button", { name: "Review answers" }).click();
  await page.getByRole("button", { name: "Submit my request" }).click();
  await expect(page.getByRole("heading", { name: "Your Advanced AI Dermatology Analysis submission has been received." })).toBeVisible();
  await expect(page.getByText(ADVANCED_REFERENCE).first()).toBeVisible();
  expect(state.advancedSubmitted).toBe(true);
  expect(state.passes).toBe(0);
  noLegacyCalls(state);
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
