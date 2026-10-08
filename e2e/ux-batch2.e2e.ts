import { expect, test, type Page } from "@playwright/test";
import { freeProfile, mockSupabase, USER_ID } from "./support/mockSupabase";

/**
 * Signed-in journeys for UX batch 2: My Skincare Shelf (PAO), the climate badge in the AM/PM tracker, and the full-product
 * INCI scanner's personal checks (allergies, routine conflicts, Monk Skin Tone) plus on-device photo reading (tesseract.js).
 * Supabase is mocked (e2e/support/mockSupabase.ts).
 */

const STEPS = [
  { id: "step-am-serum", step_name: "Serum", product_name: "Vitamin C booster", time_of_day: "am", sort_order: 0, source: "smart", guidance: null, product_slug: "vit-c-booster" },
  { id: "step-pm-cleanser", step_name: "Cleanser", product_name: null, time_of_day: "pm", sort_order: 1, source: "manual", guidance: null, product_slug: null },
];

const ING = [
  { id: "i-glycerin", slug: "glycerin", inci_name: "Glycerin", common_name: "Glycerin", category: "humectant", irritancy_risk: "low" },
  { id: "i-retinol", slug: "retinol", inci_name: "Retinol", common_name: "Retinol", category: "retinoid", irritancy_risk: "high" },
  { id: "i-vitc", slug: "ascorbic-acid", inci_name: "Ascorbic Acid", common_name: "Vitamin C", category: "antioxidant", irritancy_risk: "moderate" },
  { id: "i-niacinamide", slug: "niacinamide", inci_name: "Niacinamide", common_name: "Niacinamide", category: "vitamin", irritancy_risk: "low" },
];

const rpc = {
  search_ingredients: (body: Record<string, unknown>) => {
    const q = String(body.p_search ?? "").toLowerCase();
    const rows = ING.filter((i) => !q || i.inci_name.toLowerCase() === q || i.common_name.toLowerCase() === q);
    return rows.map((i) => ({ ...i, short_description: "d", evidence_level: "strong", pregnancy_safe: null, total_count: rows.length }));
  },
  get_routine_conflicts: () => [
    { id: "c1", ingredient_a_id: "i-retinol", ingredient_b_id: "i-vitc", interaction_type: "requires_spacing", explanation: "Both can irritate when layered.", usage_guidance: "Use vitamin C in the morning and retinol at night.", confidence: "high", source_url: null },
  ],
};

const openRoutine = async (page: Page) => {
  await page.goto("/dashboard?tab=routine");
  await expect(page.getByRole("heading", { name: "Today's routine" })).toBeVisible();
};

test.describe("routine climate badge", () => {
  test("Highveld dry air alert when today's humidity is low", async ({ page, context }) => {
    await mockSupabase(context, {
      profile: freeProfile({ weather_city_key: "johannesburg" }),
      tables: { routine_steps: STEPS },
      functions: { "skin-weather": () => ({ uvMax: 8, humidity: 25, tempHigh: 24, city: "johannesburg", cityLabel: "Johannesburg", fetchedAt: new Date().toISOString(), stale: false, attribution: "x" }) },
    });
    await openRoutine(page);
    await expect(page.getByRole("note")).toContainText("Highveld Dry Air Alert");
    await expect(page.getByRole("note")).toContainText("Add an occlusive layer over humectants.");
  });

  test("no Highveld alert on a humid day, and Durban gets the gel hydrator tip", async ({ page, context }) => {
    await mockSupabase(context, {
      profile: freeProfile({ weather_city_key: "johannesburg" }),
      tables: { routine_steps: STEPS },
      functions: { "skin-weather": () => ({ uvMax: 8, humidity: 80, tempHigh: 24, city: "johannesburg", cityLabel: "Johannesburg", fetchedAt: new Date().toISOString(), stale: false, attribution: "x" }) },
    });
    await openRoutine(page);
    await expect(page.getByRole("note")).toHaveCount(0);
  });

  test("Durban high humidity", async ({ page, context }) => {
    await mockSupabase(context, {
      profile: freeProfile({ weather_city_key: "durban" }),
      tables: { routine_steps: STEPS },
      functions: { "skin-weather": () => ({ uvMax: 9, humidity: 85, tempHigh: 28, city: "durban", cityLabel: "Durban", fetchedAt: new Date().toISOString(), stale: false, attribution: "x" }) },
    });
    await openRoutine(page);
    await expect(page.getByRole("note")).toContainText("Swap heavy cream for a gel hydrator.");
  });

  test("no city chosen: no badge", async ({ page, context }) => {
    await mockSupabase(context, { profile: freeProfile(), tables: { routine_steps: STEPS } });
    await openRoutine(page);
    await expect(page.getByRole("note")).toHaveCount(0);
  });
});

test.describe("My skincare shelf", () => {
  test("add a vitamin C bottle opened 5 months ago, see the oxidation window, then mark it finished", async ({ page, context }) => {
    const tables = { routine_steps: STEPS, shelf_items: [] as Record<string, unknown>[] };
    await mockSupabase(context, { profile: freeProfile(), tables });
    await openRoutine(page);
    await expect(page.getByText("My skincare shelf")).toBeVisible();
    await page.getByRole("button", { name: "Add a bottle" }).click();
    await page.getByLabel("Product", { exact: true }).fill("15% L-Ascorbic Acid Serum");
    // The active is suggested from the name and shown as pressed until the member changes it.
    await expect(page.getByRole("button", { name: "Vitamin C (L-ascorbic acid)" })).toHaveAttribute("aria-pressed", "true");
    const opened = new Date();
    opened.setMonth(opened.getMonth() - 5);
    await page.getByLabel("Date opened").fill(`${opened.getFullYear()}-${String(opened.getMonth() + 1).padStart(2, "0")}-${String(opened.getDate()).padStart(2, "0")}`);
    await page.getByLabel("Size in ml (optional)").fill("30");
    await page.getByLabel("Uses per week (optional)").fill("7");
    await page.getByRole("button", { name: "Save bottle" }).click();

    await expect(page.getByText("15% L-Ascorbic Acid Serum")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("usually best used within about 3 months");
    await expect(page.getByText(/likely finished around/)).toBeVisible();
    expect(tables.shelf_items).toHaveLength(1);
    expect(tables.shelf_items[0]).toMatchObject({ name: "15% L-Ascorbic Acid Serum", actives: ["vitamin_c"], pao_months: 12, size_ml: 30, uses_per_week: 7 });

    await page.getByRole("button", { name: "Finished" }).click();
    await expect(page.getByText("15% L-Ascorbic Acid Serum")).toHaveCount(0);
    expect(tables.shelf_items[0].finished_on).toBeTruthy();
  });

  test("a bottle linked to a routine step estimates run-out from check-ins", async ({ page, context }) => {
    const today = new Date();
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const opened = new Date(today); opened.setDate(opened.getDate() - 14);
    const checkins = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - i); return { step_id: "step-am-serum", checkin_date: iso(d), time_slot: "am", user_id: USER_ID }; });
    await mockSupabase(context, {
      profile: freeProfile(),
      tables: {
        routine_steps: STEPS,
        routine_checkins: checkins,
        shelf_items: [{ id: "shelf-seed", name: "Hydrating serum", brand: null, category: "serum", actives: [], opened_on: iso(opened), pao_months: 12, size_ml: 30, amount_per_use_ml: 0.5, uses_per_week: null, routine_step_id: "step-am-serum", looks_oxidised: false, finished_on: null }],
      },
    });
    await openRoutine(page);
    await expect(page.getByText("Hydrating serum")).toBeVisible();
    await expect(page.getByText(/from your last 28 days of check-ins/)).toBeVisible();
    await expect(page.getByText(/Linked to “Serum”/)).toBeVisible();
  });

  test("the shelf hides itself when the migration isn't applied yet", async ({ page, context }) => {
    await mockSupabase(context, { profile: freeProfile(), tables: { routine_steps: STEPS }, missingTables: ["shelf_items"] });
    await openRoutine(page);
    await expect(page.getByText("My skincare shelf")).toHaveCount(0);
  });
});

test.describe("INCI scanner (signed in)", () => {
  const signedIn = (extra: Record<string, unknown> = {}) => ({
    profile: freeProfile({ allergies: ["fragrance"] }),
    rpc,
    tables: {
      routine_steps: STEPS,
      skincare_recommendations: [{ id: "rec-1", user_id: USER_ID, status: "delivered", mst_tone: 8, created_at: "2026-09-20T08:00:00Z", result_payload: null }],
      product_ingredients: [{ is_key_ingredient: true, product_versions: { is_current: true, products: { slug: "vit-c-booster" } }, ingredients: { id: "i-vitc", inci_name: "Ascorbic Acid", common_name: "Vitamin C" } }],
      ...extra,
    },
  });

  test("flags the allergy, the routine conflict and the skin-tone notes", async ({ page, context }) => {
    await mockSupabase(context, signedIn());
    await page.goto("/ingredients/checker");
    await page.getByLabel("Product ingredient list").fill("Ingredients: Aqua, Glycerin, Retinol, Parfum, Notarealthing");
    await page.getByRole("button", { name: "Analyze", exact: true }).click();
    await expect(page.getByText(/Matched 2 of 5 ingredients/)).toBeVisible();
    await expect(page.getByText(/Parfum.*may relate to “fragrance” in your profile/)).toBeVisible();
    const conflicts = page.locator("section.rounded-2xl", { has: page.getByRole("heading", { name: "Conflicts" }) });
    await expect(conflicts).toContainText("Retinol");
    await expect(conflicts).toContainText("Vitamin C");
    await expect(conflicts).toContainText("with your Serum (AM)");
    const tone = page.locator("section.rounded-2xl", { has: page.getByRole("heading", { name: "Monk Skin Tone considerations" }) });
    await expect(tone).toContainText("Retinol");
    await expect(tone).toContainText("Parfum");
    await expect(page.getByText("Higher irritancy ingredients")).toBeVisible();
    // Unmatched ingredients are listed as unchecked, never as safe.
    await expect(page.getByText(/aren't in our catalogue yet/)).toBeVisible();
  });

  test("with no skin tone on file it asks, and never guesses", async ({ page, context }) => {
    await mockSupabase(context, signedIn({ skincare_recommendations: [] }));
    await page.goto("/ingredients/checker");
    await page.getByLabel("Product ingredient list").fill("Aqua, Glycerin, Retinol");
    await page.getByRole("button", { name: "Analyze", exact: true }).click();
    await expect(page.getByText(/We never guess it/)).toBeVisible();
  });

  test("signed out: the list is matched but the personal checks ask for an account", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false, rpc });
    await page.goto("/ingredients/checker");
    await page.getByLabel("Product ingredient list").fill("Aqua, Glycerin, Retinol");
    await page.getByRole("button", { name: "Analyze", exact: true }).click();
    await expect(page.getByText(/Sign in to also check this list against your allergies/)).toBeVisible();
  });
});

test.describe("photo reading (tesseract.js, on-device)", () => {
  test.setTimeout(150_000);

  test("reads an ingredient list from a photo with the self-hosted reader", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: false, rpc });
    // The reader must only ever come from our own origin.
    const external: string[] = [];
    page.on("request", (req) => { const u = new URL(req.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !u.hostname.endsWith("supabase.co")) external.push(req.url()); });
    await page.goto("/ingredients/checker");
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 1100; c.height = 260;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = "#000"; g.font = "bold 38px Arial";
      g.fillText("INGREDIENTS: Aqua, Glycerin, Niacinamide,", 30, 90);
      g.fillText("Panthenol, Squalane, Tocopherol, Allantoin.", 30, 170);
      return c.toDataURL("image/png").split(",")[1];
    });
    await page.locator('input[type="file"]').setInputFiles({ name: "label.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    const box = page.getByLabel("Product ingredient list");
    await expect(box).toHaveValue(/Glycerin/i, { timeout: 120_000 });
    await expect(box).toHaveValue(/Niacinamide/i);
    await expect(box).toHaveValue(/Squalane/i);
    expect(external.filter((u) => /tesseract|traineddata|jsdelivr|unpkg|cdnjs/i.test(u)), "OCR assets must be self-hosted").toEqual([]);
    await page.getByRole("button", { name: "Analyze", exact: true }).click();
    await expect(page.getByText(/Matched 2 of/)).toBeVisible();
  });
});
