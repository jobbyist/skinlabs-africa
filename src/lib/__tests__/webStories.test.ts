import { describe, expect, test } from "bun:test";
import { arrangeRail, storyFromBriefing, type Story } from "../webStories/stories";

const page = { mediaType: "image" as const, mediaUrl: "/x.jpg", mediaAlt: "", posterUrl: null, headline: "h", body: null, durationMs: 6000 };

const story = (key: string, overrides: Partial<Story> = {}): Story => ({
  key,
  source: "db",
  slug: key,
  title: key,
  kind: "editorial",
  coverImageUrl: "/x.jpg",
  coverImageAlt: "",
  ctaLabel: null,
  ctaUrl: null,
  isSponsored: false,
  sponsorName: null,
  railPosition: null,
  publishAt: "2026-09-20T00:00:00Z",
  pages: [page],
  ...overrides,
});

const promo = (key: string, overrides: Partial<Story> = {}) =>
  story(key, { kind: "promotional", isSponsored: true, sponsorName: "Brand", ...overrides });

const briefings = Array.from({ length: 12 }, (_, i) => story(`briefing-${i}`, { source: "briefing" }));

describe("arrangeRail", () => {
  test("spaces three unpositioned promotional stories at slots 3, 7 and 11", () => {
    const rail = arrangeRail([promo("p1"), promo("p2"), promo("p3"), story("e1")], briefings);
    const positions = rail.map((s, i) => (s.isSponsored ? i + 1 : null)).filter(Boolean);
    expect(positions).toEqual([3, 7, 11]);
    expect(rail[0].key).toBe("e1");
  });

  test("never places two sponsored stories next to each other by default", () => {
    const rail = arrangeRail([promo("p1"), promo("p2"), promo("p3")], briefings);
    for (let i = 1; i < rail.length; i++) {
      expect(rail[i].isSponsored && rail[i - 1].isSponsored).toBe(false);
    }
  });

  test("honours an explicit rail_position", () => {
    const rail = arrangeRail([story("pinned", { railPosition: 1 }), story("newer", { publishAt: "2026-09-22T00:00:00Z" })], briefings);
    expect(rail[0].key).toBe("pinned");
    expect(rail[1].key).toBe("newer");
  });

  test("authored stories come before briefings, newest first", () => {
    const rail = arrangeRail(
      [story("old", { publishAt: "2026-09-01T00:00:00Z" }), story("new", { publishAt: "2026-09-21T00:00:00Z" })],
      briefings,
    );
    expect(rail.slice(0, 3).map((s) => s.key)).toEqual(["new", "old", "briefing-0"]);
  });

  test("pulls pinned stories forward instead of leaving gaps when content runs out", () => {
    const rail = arrangeRail([promo("p1")], []);
    expect(rail.map((s) => s.key)).toEqual(["p1"]);
  });

  test("drops stories with no pages and caps the rail length", () => {
    const rail = arrangeRail([story("empty", { pages: [] })], briefings, 5);
    expect(rail).toHaveLength(5);
    expect(rail.some((s) => s.key === "empty")).toBe(false);
  });
});

describe("storyFromBriefing", () => {
  test("builds pages only from the briefing's own published fields", () => {
    const built = storyFromBriefing({
      slug: "melasma",
      title: "The Melasma Playbook",
      excerpt: "Excerpt text",
      key_takeaways: ["one", "two", "three", "four"],
      cover_image_url: "/cover.jpg",
      cover_image_alt: null,
      publish_date: "2026-09-22",
    });
    expect(built.key).toBe("briefing-melasma");
    expect(built.pages.map((p) => p.body)).toEqual(["Excerpt text", "one", "two", "three"]);
    expect(built.ctaUrl).toBe("/briefings/melasma");
    expect(built.isSponsored).toBe(false);
  });
});
