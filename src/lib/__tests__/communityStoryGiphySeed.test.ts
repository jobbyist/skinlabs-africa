import { describe, expect, test } from "bun:test";
import { joinTheDiscussionStory, curatedStories } from "@/lib/webStories/curated";
import { MAX_BODY_CHARS, MAX_HEADLINE_CHARS } from "@/lib/webStories/stories";
import { GLOBAL_HOURLY_LIMIT, PAGE_SIZE, USER_HOURLY_LIMIT, parseGifQuery, trimGiphyPayload } from "../../../api/giphy";
import { rateLimitMessage } from "@/lib/community/giphy";
import { BACKFILL, PERSONAS, POOL } from "../../../scripts/community-seed/content";
import { readFileSync } from "node:fs";

describe("Join the discussion web story", () => {
  const story = joinTheDiscussionStory();
  test("has 4+ slides, each with an Unsplash background and alt text, inside the length limits", () => {
    expect(story.pages.length).toBeGreaterThanOrEqual(4);
    for (const page of story.pages) {
      expect(page.mediaUrl.startsWith("https://images.unsplash.com/")).toBe(true);
      expect(page.mediaAlt?.length).toBeGreaterThan(5);
      expect((page.headline ?? "").length).toBeLessThanOrEqual(MAX_HEADLINE_CHARS);
      expect((page.body ?? "").length).toBeLessThanOrEqual(MAX_BODY_CHARS);
    }
    expect(new Set(story.pages.map((p) => p.mediaUrl)).size).toBe(story.pages.length);
  });
  test("states the access rule honestly and is in the curated rail", () => {
    const text = story.pages.map((p) => p.body).join(" ");
    expect(text).toMatch(/Glow Lite, Insider and VIP/);
    expect(text).toMatch(/until further notice/i);
    expect(story.title).toBe("Join the discussion");
    expect(curatedStories().some((s) => s.slug === "join-the-discussion")).toBe(true);
  });
});

describe("GIPHY proxy rules", () => {
  test("stays under GIPHY's 100/hour beta limit and one member can't use it all", () => {
    expect(GLOBAL_HOURLY_LIMIT).toBeLessThan(100);
    expect(USER_HOURLY_LIMIT).toBeLessThan(GLOBAL_HOURLY_LIMIT);
    expect(PAGE_SIZE).toBe(24);
  });
  test("equivalent searches share one cache key; bad offsets are refused", () => {
    expect(parseGifQuery({ q: "  Glowing   SKIN " })?.cacheKey).toBe("search|glowing skin|0");
    expect(parseGifQuery({ q: "glowing skin", offset: "24" })?.cacheKey).toBe("search|glowing skin|24");
    expect(parseGifQuery({})?.kind).toBe("trending");
    for (const offset of ["-1", "abc", "1.5", "9999"]) expect(parseGifQuery({ q: "x", offset })).toBeNull();
    expect(parseGifQuery({ q: "x".repeat(200) })?.q.length).toBe(50);
  });
  test("only the fields the composer reads are passed on", () => {
    const out = trimGiphyPayload({
      meta: { secret: 1 },
      pagination: { total_count: 5, offset: 0 },
      data: [{ id: "a", title: "T", user: { name: "x" }, analytics: {}, images: { fixed_width_small: { url: "https://media1.giphy.com/a.gif", width: "1", height: "2", size: "3", mp4: "x" }, original: { url: "https://media1.giphy.com/o.gif" } } }, null, { id: 3 }],
    });
    expect(out).toEqual({ pagination: { total_count: 5 }, data: [{ id: "a", title: "T", images: { fixed_width_small: { url: "https://media1.giphy.com/a.gif", width: "1", height: "2", size: "3" } } }] });
  });
  test("rate-limit wording tells the member how long and offers upload", () => {
    expect(rateLimitMessage(1200)).toMatch(/20 minutes/);
    expect(rateLimitMessage(30)).toMatch(/1 minute\b/);
    expect(rateLimitMessage(600, "user")).toMatch(/searched a lot/);
    expect(rateLimitMessage(600)).toMatch(/upload your own/);
  });
  test("the migration limits calls in a rolling window and keeps everything service-role only", () => {
    const sql = readFileSync("supabase/migrations/20261009120000_giphy_rate_limit_and_community_seed_scheduler.sql", "utf8");
    expect(sql).toContain("called_at > now() - interval '1 hour'");
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.giphy_take_quota\(uuid, integer, integer\)[^;]*TO service_role/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.giphy_take_quota[^;]*FROM PUBLIC, anon, authenticated/);
  });
});

describe("community seed content", () => {
  const names = new Set([...PERSONAS.map((p) => p.name), "Nicole N.", "Cole O."]);
  const categories = new Set(["routines", "sun-care", "acne", "deeper-skin-tones", "ingredients", "budget-sa", "sensitive-skin", "seasonal", "myths", "ask-the-community"]);
  const all = [...BACKFILL, ...POOL];
  test("personas are valid, unique, SA-style handles", () => {
    expect(new Set(PERSONAS.map((p) => p.name)).size).toBe(PERSONAS.length);
    for (const p of PERSONAS) {
      expect(p.name.length).toBeGreaterThanOrEqual(2);
      expect(p.name.length).toBeLessThanOrEqual(40);
    }
  });
  test("every post fits the database limits and uses known authors and topics", () => {
    for (const p of all) {
      expect(names.has(p.by)).toBe(true);
      expect(categories.has(p.cat)).toBe(true);
      expect(p.title.trim().length).toBeGreaterThanOrEqual(4);
      expect(p.title.length).toBeLessThanOrEqual(140);
      expect(p.body.trim().length).toBeGreaterThanOrEqual(10);
      expect(p.body.length).toBeLessThanOrEqual(4000);
      p.comments.forEach((c, i) => {
        expect(names.has(c.by)).toBe(true);
        expect(c.body.trim().length).toBeGreaterThan(0);
        expect(c.body.length).toBeLessThanOrEqual(1500);
        if (c.re !== undefined) expect(c.re).toBeLessThan(i);
      });
    }
  });
  test("history runs 15 Sep to 9 Oct 2026, in the past", () => {
    const days = BACKFILL.map((p) => p.d ?? 0);
    expect(Math.min(...days)).toBe(0);
    expect(Math.max(...days)).toBeLessThanOrEqual(24);
    expect(BACKFILL.length).toBeGreaterThanOrEqual(25);
    expect(POOL.length).toBeGreaterThanOrEqual(30);
    expect(new Set(all.map((p) => p.title)).size).toBe(all.length);
  });
  test("no medical claims or diagnoses: nothing promises a cure", () => {
    const text = all.map((p) => `${p.title} ${p.body} ${p.comments.map((c) => c.body).join(" ")}`).join(" ").toLowerCase();
    for (const bad of ["cures ", "guaranteed", "100% effective", "diagnos" + "ed you"]) expect(text).not.toContain(bad);
  });
  test("the generated migration matches the content (regenerate with scripts/generate-community-seed.ts)", () => {
    const sql = readFileSync("supabase/migrations/20261009130000_community_seed_content.sql", "utf8");
    for (const p of [BACKFILL[0], POOL[0], BACKFILL[BACKFILL.length - 1]]) expect(sql).toContain(JSON.stringify(p.title).slice(1, -1));
  });
});
