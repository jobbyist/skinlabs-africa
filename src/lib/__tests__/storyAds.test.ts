import { describe, expect, test } from "bun:test";
import { STORY_ADS, interleaveStoryAds, isStoryAd, storyFromAd } from "../webStories/storyAds";
import type { Story } from "../webStories/stories";

const organic = (key: string): Story => ({
  key,
  source: "briefing",
  slug: key,
  title: key,
  kind: "briefing",
  coverImageUrl: "/x.jpg",
  coverImageAlt: "",
  ctaLabel: null,
  ctaUrl: null,
  isSponsored: false,
  sponsorName: null,
  railPosition: null,
  publishAt: "2026-09-20T00:00:00Z",
  pages: [{ mediaType: "image", mediaUrl: "/x.jpg", mediaAlt: "", posterUrl: null, headline: "h", body: null, durationMs: 6000 }],
});

const ads = STORY_ADS.map(storyFromAd);
const rail = Array.from({ length: 7 }, (_, i) => organic(`s${i}`));

describe("story ads", () => {
  test("every ad is a labelled, sponsored, single-page story linking out", () => {
    for (const ad of ads) {
      expect(isStoryAd(ad)).toBe(true);
      expect(ad.isSponsored).toBe(true);
      expect(ad.pages).toHaveLength(1);
      expect(ad.ctaUrl).toMatch(/^https:\/\/c\.trackmytarget\.com\//);
      // Never under public/web-stories/ — that prefix is routed to SSR.
      expect(ad.pages[0].mediaUrl.startsWith("/stories-media/ads/")).toBe(true);
    }
  });

  test("ads sit between organic stories: never first, last or adjacent", () => {
    const { stories } = interleaveStoryAds(rail, ads);
    expect(isStoryAd(stories[0])).toBe(false);
    expect(isStoryAd(stories[stories.length - 1])).toBe(false);
    stories.forEach((s, i) => {
      if (isStoryAd(s)) expect(isStoryAd(stories[i + 1])).toBe(false);
    });
    expect(stories.map((s) => s.key)).toEqual([
      "s0", "s1", "ad-timeless-skin", "s2", "s3", "ad-faithful-to-nature", "s4", "s5", "ad-timeless-skin", "s6",
    ]);
  });

  test("playlistIndex maps each rail story to its playlist position", () => {
    const { stories, playlistIndex } = interleaveStoryAds(rail, ads);
    rail.forEach((s, i) => expect(stories[playlistIndex[i]].key).toBe(s.key));
  });

  test("rotates from the chosen first ad and wraps", () => {
    const { stories } = interleaveStoryAds(rail, ads, 2, 1);
    expect(stories.filter(isStoryAd).map((s) => s.key)).toEqual(["ad-faithful-to-nature", "ad-timeless-skin", "ad-faithful-to-nature"]);
  });

  test("no ads (members / ad-light) leaves the rail untouched", () => {
    const { stories, playlistIndex } = interleaveStoryAds(rail, []);
    expect(stories).toEqual(rail);
    expect(playlistIndex).toEqual(rail.map((_, i) => i));
  });
});
