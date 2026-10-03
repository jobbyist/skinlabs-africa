import { beforeEach, describe, expect, test } from "bun:test";
import {
  CONTENT_RAIL_ITEMS,
  contentRailOrderForThisPageLoad,
  isContentRailItemActive,
  isContentRailPage,
  resetContentRailOrder,
  shouldShowContentRail,
  shuffled,
} from "../contentRail";

describe("content rail items", () => {
  test("are exactly the ten requested pills with unique routes", () => {
    expect(CONTENT_RAIL_ITEMS.map((i) => i.label).sort()).toEqual(
      [
        "AI Skin Analysis",
        "The Daily Skinny",
        "Seasonal Guides",
        "Shelf Showdown",
        "Business Solutions",
        "Practice Suite",
        "Verified Reviews",
        "Brand Spotlight",
        "Ingredient Dossier",
        "The Skin Deep Podcast",
      ].sort(),
    );
    expect(new Set(CONTENT_RAIL_ITEMS.map((i) => i.href)).size).toBe(10);
  });
});

describe("where the rail shows", () => {
  test("key pages: home and each vertical hub, trailing slash tolerated", () => {
    for (const p of ["/", "/briefings", "/reviews/", "/compare", "/spotlight", "/seasonals", "/ingredients", "/podcast", "/business", "/practice-suite"]) {
      expect(isContentRailPage(p)).toBe(true);
    }
  });
  test("not on detail pages, task flows or the dashboard", () => {
    for (const p of ["/briefings/some-story", "/reviews/a-serum", "/skynn-ai", "/skynn-ai/advanced", "/pricing", "/dashboard", "/welcome", "/admin"]) {
      expect(isContentRailPage(p)).toBe(false);
    }
  });
  test("members only", () => {
    expect(shouldShowContentRail("/", false)).toBe(false);
    expect(shouldShowContentRail("/", true)).toBe(true);
    expect(shouldShowContentRail("/reviews/a-serum", true)).toBe(false);
  });
  test("active pill follows the section, without prefix false positives", () => {
    const reviews = CONTENT_RAIL_ITEMS.find((i) => i.kind === "verified_reviews")!;
    expect(isContentRailItemActive("/reviews", reviews)).toBe(true);
    expect(isContentRailItemActive("/reviews/a-serum", reviews)).toBe(true);
    expect(isContentRailItemActive("/reviews-archive", reviews)).toBe(false);
  });
});

describe("ordering", () => {
  beforeEach(resetContentRailOrder);

  test("shuffle keeps every pill, never mutates the source and honours the rng", () => {
    const before = CONTENT_RAIL_ITEMS.map((i) => i.kind);
    const out = shuffled(CONTENT_RAIL_ITEMS, () => 0);
    expect(CONTENT_RAIL_ITEMS.map((i) => i.kind)).toEqual(before);
    expect(out.map((i) => i.kind).sort()).toEqual([...before].sort());
    expect(out.map((i) => i.kind)).not.toEqual(before);
  });

  test("one order per page load, new order after a reload", () => {
    const first = contentRailOrderForThisPageLoad(() => 0.3);
    expect(contentRailOrderForThisPageLoad(() => 0.9)).toBe(first);
    resetContentRailOrder();
    expect(contentRailOrderForThisPageLoad(() => 0.9)).not.toBe(first);
  });
});
