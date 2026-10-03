import { describe, expect, test } from "bun:test";
import { reviewTimeSnapshot } from "../pricing/editorialPrices";

describe("reviewTimeSnapshot: what may still be shown from a review's stored retailer prices", () => {
  test("static-catalogue entries (retailer home page, no review date) are never shown", () => {
    expect(
      reviewTimeSnapshot(
        [
          { retailer: "Clicks", price_zar: 185, in_stock: true, url: "https://clicks.co.za/" },
          { retailer: "Takealot", price_zar: 219, in_stock: true, url: "https://www.takealot.com/" },
        ],
        undefined,
      ),
    ).toBeNull();
    // a date alone isn't enough when the links are only home pages
    expect(reviewTimeSnapshot([{ retailer: "Clicks", price_zar: 185, url: "https://clicks.co.za/" }], "2026-09-13")).toBeNull();
  });

  test("a real product-page URL with a review date is shown as a dated snapshot, cheapest first, without a stock claim", () => {
    const snap = reviewTimeSnapshot(
      [
        { retailer: "Dis-Chem", price_zar: 179, in_stock: true, url: "https://www.dischem.co.za/some-product-12" },
        { retailer: "Takealot", price_zar: 149, in_stock: true, url: "https://www.takealot.com/x/PLID1" },
      ],
      "2026-09-13",
    )!;
    expect(snap.asOf).toBe("2026-09-13");
    expect(snap.rows.map((r) => r.retailer)).toEqual(["Takealot", "Dis-Chem"]);
    expect(Object.keys(snap.rows[0])).toEqual(["retailer", "price_zar", "url"]); // no in_stock field leaks through
  });

  test("bad input yields nothing", () => {
    expect(reviewTimeSnapshot(null, "2026-09-13")).toBeNull();
    expect(reviewTimeSnapshot([], "2026-09-13")).toBeNull();
    expect(reviewTimeSnapshot([{ retailer: "X", price_zar: 0, url: "https://x.co.za/a/b" }], "2026-09-13")).toBeNull();
    expect(reviewTimeSnapshot([{ retailer: "X", price_zar: 10, url: "not a url" }], "2026-09-13")).toBeNull();
    expect(reviewTimeSnapshot([{ retailer: "X", price_zar: 10, url: "https://x.co.za/a/b" }], "garbage")).toBeNull();
  });
});
