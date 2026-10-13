import { expect, test, type Page } from "@playwright/test";
import { ADVANCED_REFERENCE, freeProfile, mockSupabase, USER_ID } from "./support/mockSupabase";

/**
 * Contextual UX (docs/contextual-ux.md): the dashboard and navigation answer "what is the most
 * useful thing for this member right now?" and never ask for something already done.
 * Supabase is mocked (e2e/support/mockSupabase.ts).
 */

const BASIC_ROW = {
  id: "rec-basic-1",
  user_id: USER_ID,
  created_at: "2026-09-20T08:00:00Z",
  status: "delivered",
  skin_type: "oily",
  concerns: ["acne", "oiliness"],
  mst_tone: null,
  analysis_completeness: 80,
  result_payload: {
    analysisId: "abc12345-0000-4000-8000-000000000000",
    generatedAt: "2026-09-20T08:00:00Z",
    skinType: "oily",
    primaryConcern: "acne",
    profile: {
      skinType: "oily", primaryConcern: "acne", secondaryConcerns: ["oiliness"], sensitivityTendency: "moderate",
      barrierTendency: "supported", activeTolerance: "tolerant", routineMaturity: "intermediate", skinBehaviour: "stable",
      maintenanceOrientation: "corrective", primaryGoal: "improve_appearance", secondaryGoal: null, mstTone: null,
    },
    skinStory: { narrative: "Your skin runs oily with occasional breakouts." },
    priorities: { items: [{ key: "breakouts", level: "high", reason: "Your main concern", rank: 1 }] },
    preferences: { complexity: "moderate", priority: null, budgetConscious: true },
    context: { status: "always_like_this", detail: null },
    answers: { q1: 0, q2: 0, q3: 0, q11: 0 },
    groundedRoutine: { am: [], pm: [], matchStats: { matched: 0, attempted: 4 } },
    recommendationText: "## Your routine\n- Cleanse gently twice a day\n1. Moisturise",
    refinementHistory: [],
    versions: { resultVersion: "2.0.0", scoringVersion: "1.0.0", contentVersion: "1.0.0", productMatchingVersion: "1.0.0" },
  },
};

const PENDING_REPORT = {
  id: "rep-e2e", user_id: USER_ID, session_id: "sess-e2e", created_at: "2026-09-27T08:00:00Z", submitted_at: "2026-09-27T08:00:00Z",
  generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", reference_number: ADVANCED_REFERENCE,
};

/** The next-action card is the one place Home asks the member to do something. */
const nextAction = (page: Page) => page.locator("main").first();

test("NEW USER: Home leads with the Basic analysis and nothing about routines or Advanced", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("QA");
  await expect(page.getByRole("link", { name: "Take the 2-minute Basic AI Skin Analysis" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Build my routine" })).toHaveCount(0);
  await expect(page.getByText("Get an Analysis Pass")).toHaveCount(0);
  // Not a sitemap: the old stack of plan / credits / passes cards is gone.
  await expect(page.getByText("Manage billing")).toHaveCount(0);
  await expect(nextAction(page)).toBeVisible();
});

test("BASIC COMPLETE: build the routine; 'take the analysis' disappears everywhere on Home", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Build my routine" }).first()).toBeVisible();
  await expect(page.getByText("Your skin profile is ready. Build a routine around it.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Take the 2-minute Basic AI Skin Analysis" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start analysis" })).toHaveCount(0);
  expect(state.rpcCalls).toContain("get_advanced_assessment_access");
});

test("ADVANCED PENDING: view status, and no prompt to get an Analysis Pass", async ({ page, context }) => {
  await mockSupabase(context, {
    profile: freeProfile(),
    skynn: { submitted: true },
    tables: { skincare_recommendations: [BASIC_ROW], advanced_assessment_reports: [PENDING_REPORT] },
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "View analysis status" }).first()).toBeVisible();
  await expect(page.getByText("with our team").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Get an Analysis Pass|Start your Advanced/ })).toHaveCount(0);
});

test("ROUTINE SAVED: Home asks for the check-in instead of 'build a routine'", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard?tab=routine");
  await page.getByRole("button", { name: "Build my Smart Routine" }).click();
  await expect(page.getByText("Rule-based from your answers")).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Check in on today's routine" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Build my routine" })).toHaveCount(0);
});

test("a member with a skin profile gets Home · My Skin · Routine · Explore · Account in the bottom nav", async ({ page, context }, info) => {
  test.skip(!info.project.name.startsWith("mobile"), "bottom navigation is a phone control");
  await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const label of ["Home", "My Skin", "Routine", "Explore", "Account"]) await expect(nav.getByLabel(label)).toBeVisible();
  await expect(nav.getByLabel("Compare")).toHaveCount(0);
  await nav.getByLabel("Routine").click();
  await expect(page).toHaveURL(/tab=routine/);
  await expect(nav.getByLabel("Routine")).toHaveAttribute("aria-current", "page");
  // Explore opens the menu that still carries every destination.
  await nav.getByLabel("Explore").click();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Comparisons/ })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Podcast/ })).toBeVisible();
});

test("a visitor and a brand-new member keep the public content tabs", async ({ page, context }, info) => {
  test.skip(!info.project.name.startsWith("mobile"), "bottom navigation is a phone control");
  await mockSupabase(context, { signedIn: false });
  await page.goto("/briefings");
  const nav = page.getByRole("navigation", { name: "Primary" });
  for (const label of ["Home", "News", "Stream", "Reviews", "Compare", "Sign in"]) await expect(nav.getByLabel(label, { exact: true })).toBeVisible();
});

test("no horizontal overflow on Home at phone width in each state", async ({ page, context }, info) => {
  test.skip(!info.project.name.startsWith("mobile"), "phone layout check");
  await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW], advanced_assessment_reports: [PENDING_REPORT] } });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("FAILED READ: Home says it couldn't load and never guesses 'take the analysis'", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  // Registered after the mock, so it wins: the member's routine read fails.
  await context.route(/supabase\.co\/rest\/v1\/routine_steps/, (r) => r.abort());
  await page.goto("/dashboard");
  await expect(page.getByText("We couldn't load your latest activity just now.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Take the 2-minute Basic AI Skin Analysis" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("a secondary suggestion can be dismissed with 'Not now' and stays away", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile({ trial_used_at: null }), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard");
  const dismiss = page.getByRole("button", { name: /^Not now:/ }).first();
  await expect(dismiss).toBeVisible();
  const label = (await dismiss.getAttribute("aria-label"))!.replace("Not now: ", "");
  await dismiss.click();
  await expect(page.getByText(label, { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(label, { exact: true })).toHaveCount(0);
});
