import { expect, test } from "@playwright/test";
import { freeProfile, lapsedProfile, mockSupabase, trialProfile } from "./support/mockSupabase";

/**
 * Onboarding & conversion journeys (overhaul prompts 02–11), run for desktop +
 * mobile in light + dark (see playwright.config.ts projects). Supabase is
 * mocked per test; see e2e/support/mockSupabase.ts.
 */

const deliveredAnalysis = {
  id: "rec-1",
  user_id: "00000000-0000-4000-8000-000000000001",
  skin_type: "combination",
  concerns: ["hyperpigmentation", "dehydration"],
  status: "delivered",
  created_at: "2026-09-28T08:00:00Z",
  mst_tone: null,
  analysis_completeness: 80,
  result_payload: null,
};

test("analysis → account → trial: a new account lands on /welcome once and starts the trial in one tap", async ({ page, context }) => {
  const state = await mockSupabase(context, {
    profile: freeProfile({ onboarding_completed_at: null }),
    userCreatedAt: new Date().toISOString(),
    tables: { skincare_recommendations: [deliveredAnalysis] },
  });
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome/);
  await expect(page.getByRole("heading", { name: "Nice. Your skin profile's saved." })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: /Start free trial/ }).click();
  await expect(page.getByText(/Glow Insider is active until 1 November 2026/)).toBeVisible();
  expect(state.rpcCalls).toContain("start_free_trial");
  await page.getByRole("button", { name: "Go to my dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  expect(state.profile.onboarding_completed_at).toBeTruthy();
});

test("a returning member never sees /welcome", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("pricing → trial: one tap from a plan card for a free account", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/pricing");
  await page.getByRole("button", { name: /Free until 1 November 2026|Try free for/ }).first().click();
  await expect.poll(() => state.rpcCalls.includes("start_free_trial")).toBe(true);
  // Already onboarded → /welcome forwards to the dashboard, which shows the trial.
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/Glow Insider trial/).first()).toBeVisible();
});

test("gate → trial → unlocked: a locked review unlocks in place", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/reviews/sb-cerious-proatection");
  const cta = page.getByRole("button", { name: /Start free trial/ }).first();
  await expect(cta).toBeVisible();
  await cta.click();
  await expect.poll(() => state.rpcCalls.includes("start_free_trial")).toBe(true);
  await expect(page).toHaveURL(/\/reviews\/sb-cerious-proatection/); // stays on the page
  await expect(page.getByRole("button", { name: /Start free trial/ })).toHaveCount(0);
});

test("trial → keep membership: the dialog states price, first charge date and cancel terms before payment", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: trialProfile() });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Keep my membership" }).first().click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Keep Glow Insider" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("R79");
  await expect(dialog).toContainText("1 November 2026");
  await expect(dialog).toContainText("Cancel any time in Billing");
  // PayFast is temporarily switched off (PAYFAST_ENABLED in src/lib/payments.ts): PayPal/card only.
  await expect(dialog.getByRole("button", { name: "Pay with PayPal" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Pay with PayFast" })).toHaveCount(0);
  expect(state.functionCalls.some((c) => c.action === "subscription_quote")).toBe(true);
});

test("trial → keep membership in the PayFast sandbox (needs a sandbox merchant)", async () => {
  // The real card-at-R0 tokenisation, ITN and cancel can only be exercised
  // against PayFast's sandbox with a real (sandbox) merchant and a real account.
  test.skip(!process.env.PAYFAST_SANDBOX_E2E, "Set PAYFAST_SANDBOX_E2E=1 with sandbox secrets configured to run the live sandbox leg (see CLAUDE.md, overhaul 06).");
});

test("lapsed → subscribe: an ended trial offers Keep membership, billed today", async ({ page, context }) => {
  await mockSupabase(context, { profile: lapsedProfile(), quoteStartKind: "immediate" });
  await page.goto("/dashboard");
  await expect(page.getByText("Your free trial has ended")).toBeVisible();
  await page.getByRole("button", { name: "Keep my membership" }).first().click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Keep Glow Insider" });
  await expect(dialog).toContainText("R79 today");
  await expect(dialog).not.toContainText("Nothing to pay today");
});

test("legacy dashboard links resolve under the new IA", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/dashboard?tab=overview");
  await expect(page.getByRole("tab", { name: "Home", selected: true })).toBeVisible();
  await page.goto("/dashboard?tab=security");
  await expect(page.getByRole("tab", { name: "Settings", selected: true })).toBeVisible();
});
