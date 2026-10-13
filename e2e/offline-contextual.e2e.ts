import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { freeProfile, mockSupabase, USER_ID } from "./support/mockSupabase";

/**
 * Offline + service worker behaviour of the contextual layer (docs/contextual-ux.md, docs/pwa.md):
 *  - already-loaded Home keeps its answer when the network drops or a refresh fails (no wrong "take the analysis"),
 *  - a section warmed by hovering its tab still opens offline (lazy chunk + prefetch + service worker),
 *  - none of the member snapshot's reads is ever stored in Cache Storage.
 * Presents as a real browser (the PWA layer switches itself off for automation), like e2e/pwa.e2e.ts.
 */

const ROW = {
  id: "rec-1", user_id: USER_ID, created_at: "2026-09-20T08:00:00Z", status: "delivered", skin_type: "oily", concerns: ["acne"], mst_tone: null, analysis_completeness: 80,
  result_payload: { analysisId: "abc12345-0000-4000-8000-000000000000", generatedAt: "2026-09-20T08:00:00Z", skinType: "oily", primaryConcern: "acne",
    profile: { skinType: "oily", primaryConcern: "acne", secondaryConcerns: ["oiliness"], sensitivityTendency: "moderate", barrierTendency: "supported", activeTolerance: "tolerant", routineMaturity: "intermediate", skinBehaviour: "stable", maintenanceOrientation: "corrective", primaryGoal: "improve_appearance", secondaryGoal: null, mstTone: null },
    skinStory: { narrative: "x" }, priorities: { items: [] }, preferences: { complexity: "moderate", priority: null, budgetConscious: true }, context: { status: "always_like_this", detail: null }, answers: {}, groundedRoutine: { am: [], pm: [], matchStats: { matched: 0, attempted: 4 } }, recommendationText: "x", refinementHistory: [], versions: {} },
};

const setup = async (context: BrowserContext) => {
  const state = await mockSupabase(context, { profile: freeProfile(), tables: { skincare_recommendations: [ROW] } });
  await context.route(/googlesyndication\.com|doubleclick\.net/, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  return state;
};

const swReady = async (page: Page) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15_000 }).toBe(true);
};

const cacheUrls = (page: Page) =>
  page.evaluate(async () => {
    const out: string[] = [];
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) out.push(new URL(r.url).pathname);
    return out;
  });

test("offline after Home has loaded: the next action stays, a failed refresh never falls back to guessing", async ({ page, context }) => {
  await setup(context);
  await page.goto("/dashboard");
  await swReady(page);
  await expect(page.getByRole("link", { name: "Build my routine" }).first()).toBeVisible();
  await context.setOffline(true);
  // Something happened that makes the snapshot refetch (e.g. a routine edit): the refetch fails offline.
  await page.evaluate(() => window.dispatchEvent(new Event("skinlabs:member-context-changed")));
  await page.waitForTimeout(2500);
  await expect(page.getByRole("link", { name: "Build my routine" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Take the 2-minute Basic AI Skin Analysis" })).toHaveCount(0);
  await context.setOffline(false);
});

test("a section warmed by hovering its tab opens offline", async ({ page, context }) => {
  await setup(context);
  await page.goto("/dashboard");
  await swReady(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Settings" }).hover();
  await page.waitForTimeout(1500); // the settings chunks download and are cached by the service worker
  await context.setOffline(true);
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByRole("button", { name: "Billing" })).toBeVisible();
  await context.setOffline(false);
});

test("the member snapshot is never stored in Cache Storage", async ({ page, context }) => {
  await setup(context);
  await page.goto("/dashboard");
  await swReady(page);
  await page.goto("/dashboard?tab=saved");
  await page.goto("/dashboard?tab=routine");
  await page.waitForTimeout(1000);
  const all = await cacheUrls(page);
  const privateRead = /^\/rest\/v1\/(profiles|routine_steps|routine_checkins|smart_routines|skincare_recommendations|advanced_assessment_reports|podcast_likes|news_article_engagement|member_content_reads|payment_subscriptions)/;
  expect(all.filter((u) => privateRead.test(u) || /^\/rest\/v1\/rpc\//.test(u))).toEqual([]);
  expect(all).not.toContain("/dashboard");
});
