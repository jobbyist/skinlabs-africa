import { expect, test } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Live SA retail prices on a review page. Supabase is mocked: the `sa_retail_prices`
 * view returns whatever the test provides, so this checks what a visitor sees in each case.
 */
const SLUG = "sb-glow-glaze-serum";
const now = new Date().toISOString();

const LIVE_ROWS = [
  { product_slug: SLUG, retailer_slug: "dis-chem", retailer_name: "Dis-Chem", listing_url: "https://www.dischem.co.za/glow-glaze-serum-1", listing_title: "Glow Glaze Serum 30ml", listing_size_ml: 30, price_zar: 120, in_stock: true, price_since: now, checked_at: now },
  { product_slug: SLUG, retailer_slug: "clicks", retailer_name: "Clicks", listing_url: "https://clicks.co.za/glow-glaze-serum/p/1", listing_title: "Glow Glaze Serum 30ml", listing_size_ml: 30, price_zar: 130, in_stock: false, price_since: now, checked_at: now },
  { product_slug: SLUG, retailer_slug: "takealot", retailer_name: "Takealot", listing_url: "https://www.takealot.com/glow-glaze-serum/PLID1", listing_title: "Glow Glaze Serum", listing_size_ml: null, price_zar: 99, in_stock: null, price_since: now, checked_at: now },
];

test("verified prices are shown cheapest-first per pack size, dated, with no invented stock claim", async ({ page, context }) => {
  await mockSupabase(context, { tables: { sa_retail_prices: LIVE_ROWS } });
  await page.goto(`/reviews/${SLUG}`);

  const panel = page.getByRole("region", { name: "Where to buy in South Africa" });
  await expect(panel).toBeVisible();
  const links = panel.getByRole("link");
  await expect(links).toHaveCount(3);
  // 30ml group first (Dis-Chem R120 then Clicks R130), unknown size last
  await expect(links.nth(0)).toContainText("Dis-Chem");
  await expect(links.nth(0)).toContainText("R120");
  await expect(links.nth(1)).toContainText("Clicks");
  await expect(links.nth(1)).toContainText("Out of stock");
  await expect(links.nth(2)).toContainText("Takealot");
  await expect(panel.getByText("30ml")).toBeVisible();
  await expect(panel.getByText("Pack size not stated")).toBeVisible();
  await expect(panel).toContainText("checked today");
  // Only an explicit out-of-stock is stated: nothing claims "In stock".
  await expect(panel).not.toContainText("In stock");
  // Honest framing and third-party-seller note for Takealot
  await expect(panel).toContainText("read automatically from each retailer");
  await expect(panel).toContainText("Takealot listings may be sold by third-party sellers");
  // Links go straight to the listing, not a home page, and are marked nofollow
  await expect(links.nth(0)).toHaveAttribute("href", "https://www.dischem.co.za/glow-glaze-serum-1");
  await expect(links.nth(0)).toHaveAttribute("rel", /nofollow/);
});

test("with no verified price, the old unchecked 'in stock' price table is gone", async ({ page, context }) => {
  await mockSupabase(context, { tables: { sa_retail_prices: [] } });
  await page.goto(`/reviews/${SLUG}`);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.getByText("Where to buy — SA price comparison")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Where to buy in South Africa" })).toHaveCount(0);
  await expect(page.getByText("In stock", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Lowest verified price")).toHaveCount(0);
});
