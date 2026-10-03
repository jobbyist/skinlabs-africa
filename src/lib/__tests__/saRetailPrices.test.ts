import { describe, expect, test } from "bun:test";
import { checkedLabel as serverCheckedLabel } from "../../../supabase/functions/_shared/pricing/sanity";
import { checkedLabel, formatRand, formatSize, groupPrices, stockLabel, type SaRetailPrice } from "../pricing/saRetailPrices";

const row = (over: Partial<SaRetailPrice>): SaRetailPrice => ({
  product_slug: "p",
  retailer_slug: "clicks",
  retailer_name: "Clicks",
  listing_url: "https://clicks.co.za/x/p/1",
  listing_title: null,
  listing_size_ml: 30,
  price_zar: 130,
  in_stock: true,
  price_since: "2026-10-01T00:00:00Z",
  checked_at: "2026-10-03T05:00:00Z",
  ...over,
});

describe("saRetailPrices presentation", () => {
  test("formatRand", () => {
    expect(formatRand(130)).toBe("R130");
    expect(formatRand(1299)).toBe("R1 299");
    expect(formatRand(129.5)).toBe("R129.50");
    expect(formatRand(1234567)).toBe("R1 234 567");
  });

  test("formatSize", () => {
    expect(formatSize(30)).toBe("30ml");
    expect(formatSize(1000)).toBe("1L");
    expect(formatSize(2.5)).toBe("2.5ml");
    expect(formatSize(null)).toBeNull();
    expect(formatSize(0)).toBeNull();
  });

  test("prices are only compared within a pack size, cheapest first, unknown size last", () => {
    const groups = groupPrices([
      row({ retailer_name: "Takealot", price_zar: 150, listing_size_ml: 60 }),
      row({ retailer_name: "Dis-Chem", price_zar: 120, listing_size_ml: 30 }),
      row({ retailer_name: "Clicks", price_zar: 130, listing_size_ml: 30 }),
      row({ retailer_name: "Other", price_zar: 99, listing_size_ml: null }),
    ]);
    expect(groups.map((g) => g.sizeMl)).toEqual([30, 60, null]);
    expect(groups[0].rows.map((r) => r.retailer_name)).toEqual(["Dis-Chem", "Clicks"]);
  });

  test("only an explicit out-of-stock is stated", () => {
    expect(stockLabel(false)).toBe("Out of stock");
    expect(stockLabel(true)).toBeNull();
    expect(stockLabel(null)).toBeNull();
  });

  test("checkedLabel matches the server's rule exactly", () => {
    const now = new Date("2026-10-03T10:00:00Z");
    for (const iso of ["2026-10-03T05:00:00Z", "2026-10-02T22:30:00Z", "2026-10-02T20:00:00Z", "2026-09-28T09:00:00Z", "2026-10-03T10:00:00Z"]) {
      expect(checkedLabel(new Date(iso), now), iso).toBe(serverCheckedLabel(new Date(iso), now));
    }
  });
});
