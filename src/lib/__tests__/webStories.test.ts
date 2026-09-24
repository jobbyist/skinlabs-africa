import { describe, expect, test } from "bun:test";
import { arrangeRail, clipText, MAX_BODY_CHARS, MAX_HEADLINE_CHARS, storyFromBriefing, type Story } from "../webStories/stories";
import { curatedStories, podcastSeasonOneStory, springResetStory } from "../webStories/curated";
import { storyFromReview } from "../webStories/reviewStories";
import { podcastEpisodes } from "@/data/podcast";
import { productReviews } from "@/data/reviews";

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

describe("clipText", () => {
  test("leaves short text alone and never cuts mid-word", () => {
    expect(clipText("Short line", 120)).toBe("Short line");
    const clipped = clipText("word ".repeat(100), 50);
    expect(clipped.length).toBeLessThanOrEqual(50);
    expect(clipped.endsWith("word…")).toBe(true);
  });
});

describe("curated stories", () => {
  test("podcast season 1 is a cover plus all 10 episodes, within length limits", () => {
    const story = podcastSeasonOneStory();
    expect(story.pages).toHaveLength(11);
    for (const page of story.pages) {
      expect((page.headline ?? "").length).toBeLessThanOrEqual(MAX_HEADLINE_CHARS);
      expect((page.body ?? "").length).toBeLessThanOrEqual(MAX_BODY_CHARS);
    }
    expect(story.pages.slice(1).map((p) => p.headline)).toEqual(
      podcastEpisodes.filter((e) => e.id <= 10).sort((a, b) => a.id - b.id).map((e) => clipText(e.title, MAX_HEADLINE_CHARS)),
    );
  });

  test("an unreleased episode is labelled coming soon and never linked as playable", () => {
    const story = podcastSeasonOneStory();
    podcastEpisodes
      .filter((e) => e.id <= 10 && e.comingSoon)
      .forEach((episode) => {
        const slide = story.pages[episode.id];
        expect(slide.body?.startsWith("Coming soon.")).toBe(true);
        expect(slide.ctaUrl).toBe("/podcast");
      });
  });

  test("spring reset carries at least 4 excerpts and links back to the hub", () => {
    const story = springResetStory();
    expect(story.pages.length).toBeGreaterThanOrEqual(6);
    expect(story.ctaUrl).toBe("/seasonals/spring");
  });

  test("curated slugs are unique and AMP-slug safe", () => {
    const slugs = curatedStories().map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("storyFromReview", () => {
  test("builds from the review's own fields and keeps sponsorship disclosed", () => {
    const review = { ...productReviews[0], is_sponsored: true };
    const built = storyFromReview(review, { url: "/x.jpg", alt: "" });
    expect(built.key).toBe(`review-${review.id}`);
    expect(built.ctaUrl).toBe(`/reviews/${review.id}`);
    expect(built.isSponsored).toBe(true);
    expect(built.sponsorName).toBe(review.brand);
    expect(built.pages[0].headline?.length).toBeLessThanOrEqual(MAX_HEADLINE_CHARS);
    expect(built.railPosition).toBeNull();
  });
});

describe("rail order with every source", () => {
  test("authored → briefings → curated → reviews, sponsored reviews not pulled into promo slots", () => {
    const briefing = story("briefing-a", { source: "briefing" });
    const reviews = productReviews.slice(0, 5).map((r) => storyFromReview({ ...r, is_sponsored: true }, { url: "/x.jpg", alt: "" }));
    const rail = arrangeRail([story("authored")], [briefing, ...curatedStories(), ...reviews]);
    expect(rail.map((s) => s.source).slice(0, 4)).toEqual(["db", "briefing", "curated", "curated"]);
    expect(rail.slice(4).every((s) => s.source === "review")).toBe(true);
  });
});
