import { expect, test, type Page } from "@playwright/test";
import { ADVANCED_REFERENCE, freeProfile, mockSupabase, USER_ID } from "./support/mockSupabase";

/**
 * SKYNN AI v2.1 follow-up journeys: the Advanced analysis starting from the
 * Basic analysis, branded PDFs, Smart Routines in the dashboard, /routines,
 * and legal copy that matches the PhotoJournal product. Supabase is mocked
 * (e2e/support/mockSupabase.ts).
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

const SUBMISSION_TABLES = {
  skincare_recommendations: [BASIC_ROW],
  advanced_assessment_reports: [
    { id: "rep-e2e", user_id: USER_ID, session_id: "sess-e2e", created_at: "2026-09-27T08:00:00Z", submitted_at: "2026-09-27T08:00:00Z", generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", reference_number: ADVANCED_REFERENCE },
  ],
  advanced_assessment_sessions: [
    {
      id: "sess-e2e", submitted_at: "2026-09-27T08:00:00Z",
      responses: { skin_type: "combination", primary_concerns: ["breakouts_acne"], sensitivity_level: 3, climate: "mild_temperate", pregnancy_status: "not_applicable" },
    },
  ],
};

/** One question per screen: the two consent questions come before the prefilled skin type. */
const answerConsent = async (page: Page) => {
  await page.getByText("I agree", { exact: true }).click();
  await page.getByText("I agree to cross-border processing").click();
  await expect(page.getByText(/Question 3 of 3/)).toBeVisible();
};

test("a new Advanced analysis starts from the member's Basic analysis, marked and editable", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { passes: 1 }, tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/skynn-ai/advanced");
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await answerConsent(page);
  await expect(page.getByText(/We've started from your Basic AI Skin Analysis/)).toBeVisible();
  await expect(page.getByText(/check it still fits/).first()).toBeVisible();
  await expect(page.getByRole("radio", { name: "Oily" })).toBeChecked();
  expect(state.seededResponses).toEqual({ skin_type: "oily" });
  expect(state.linkedBasicAnalysis).toEqual({ basicAnalysisId: "rec-basic-1", prefilledQuestionIds: ["skin_type"] });
  expect(state.seededResponses).not.toHaveProperty("popia_special_info_consent");
  await page.getByText("Dry", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Dry" })).toBeChecked();
});

test("without a saved Basic analysis nothing is suggested", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { passes: 1 } });
  await page.goto("/skynn-ai/advanced");
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await answerConsent(page);
  await expect(page.getByText("Which best describes your skin type?")).toBeVisible();
  await expect(page.getByText(/check it still fits/)).toHaveCount(0);
  expect(state.linkedBasicAnalysis).toBeNull();
});

test("the member can download a branded PDF of their Advanced submission", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), skynn: { submitted: true }, tables: SUBMISSION_TABLES });
  await page.goto("/skynn-ai/advanced?session=sess-e2e");
  await expect(page.getByText(ADVANCED_REFERENCE).first()).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download submission PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^skinlabs-advanced-ai-dermatology-analysis-.*\.pdf$/);
});

test("the member can re-download their Basic analysis PDF from the dashboard", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard?tab=analysis");
  await page.getByRole("button", { name: /oily Skin/i }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^skinlabs-basic-ai-skin-analysis-.*\.pdf$/);
});

test("a saved Basic AI Skin Analysis is enough to build a Smart Routine (no Advanced needed)", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [BASIC_ROW] } });
  await page.goto("/dashboard?tab=routine");
  await expect(page.getByText("Your Smart Routine is ready to build")).toBeVisible();
  await page.getByRole("button", { name: "Build my Smart Routine" }).click();
  await expect(page.getByText("Rule-based from your answers")).toBeVisible();
  expect(state.rpcCalls).toContain("save_smart_routine");
  expect((state.smartRoutine as { routine: { source: string } }).routine.source).toBe("rule_based");
});

test("without a saved Basic analysis Smart Routines stay locked and point to the analysis", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/dashboard?tab=routine");
  await expect(page.getByText(/Smart Routines are free with your Basic AI Skin Analysis/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Build my Smart Routine" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Start my Advanced AI Dermatology Analysis/ })).toBeVisible();
  expect(state.rpcCalls).not.toContain("save_smart_routine");
});

test("a member who has submitted builds a Smart Routine that lands in the tracker", async ({ page, context }) => {
  const state = await mockSupabase(context, { profile: freeProfile(), skynn: { submitted: true }, tables: SUBMISSION_TABLES });
  await page.goto("/dashboard?tab=routine");
  await page.getByRole("button", { name: "Build my Smart Routine" }).click();
  await expect(page.getByText("Your Smart Routine", { exact: true })).toBeVisible();
  await expect(page.getByText("Rule-based from your answers")).toBeVisible();
  expect(state.rpcCalls).toContain("save_smart_routine");
  const routine = state.smartRoutine as { routine: { am: { step: string }[]; pm: { step: string }[]; source: string } };
  expect(routine.routine.source).toBe("rule_based");
  expect(routine.routine.am.map((s) => s.step)).toContain("Protect");
  await expect(page.getByText("Smart", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/steps done today/)).toBeVisible();
});

test("/routines opens the member's Smart Routine once they have access", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile(), skynn: { submitted: true }, tables: SUBMISSION_TABLES });
  await page.goto("/routines");
  await expect(page.getByRole("link", { name: /Open my Smart Routine/ }).first()).toBeVisible();
  await expect(page.getByText(/Smart Routines already work from your free Basic AI Skin Analysis/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Smart Routines included in your membership");
  await expect(page.locator("body")).not.toContainText("Set your budget");
});

test("/routines without access leads with the free Basic analysis; the Analysis Pass is the optional upgrade", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/routines");
  await expect(page.getByRole("link", { name: /Take the free Basic AI Skin Analysis/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Get Analysis Pass/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Open my Smart Routine/ })).toHaveCount(0);
});

test("legal and policy pages accurately describe PhotoJournal storage without claiming image analysis", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const banned = [/computer vision provider/i, /facial recognition/i, /biometric identification/i, /image[- ]capture state/i, /credit packs?/i];
  for (const path of ["/privacy-policy", "/terms-of-service", "/cookie-policy", "/refund-policy", "/whitepapers"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // The policy legitimately says images are "not analysed ... for facial recognition ..."; only an
    // un-negated claim (no "not"/"never" earlier in the same sentence) should fail.
    const text = (await page.locator("body").innerText()).replace(/\b(?:not|never)\b[^.]*\./gi, " ");
    for (const re of banned) expect(text, `${path} matches ${re}`).not.toMatch(re);
  }
  await page.goto("/privacy-policy");
  await expect(page.locator("body")).toContainText("PhotoJournal and baseline photos");
  await expect(page.locator("body")).toContainText("private PhotoJournal");
  await expect(page.locator("body")).toContainText("limited to 5 MB");
  await expect(page.locator("body")).toContainText("not analysed by SKYNN AI");
  await expect(page.locator("body")).toContainText("Skin tone is never inferred");
  await expect(page.locator("body")).not.toContainText("Photos never leave your device");
});
