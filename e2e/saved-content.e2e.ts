import { expect, test } from "@playwright/test";
import { freeProfile, mockSupabase, USER_ID } from "./support/mockSupabase";

/** The Saved tab lists what the member saved or liked and still has it after a reload. */

const article = (id: string, slug: string, title: string) => ({
  id, slug, title, excerpt: "An excerpt.", sa_context_tag: "Johannesburg", publish_date: "2026-10-01", cover_image_url: null, reading_time: "5 min",
});

const ENGAGEMENT = [
  { id: "e1", article_id: "a1", kind: "save", created_at: "2026-10-02T08:00:00Z", news_articles: article("a1", "saved-briefing", "A saved briefing") },
  { id: "e2", article_id: "a2", kind: "like", created_at: "2026-10-03T08:00:00Z", news_articles: article("a2", "liked-briefing", "A liked briefing") },
];

test("Saved tab: saved briefings, then liked briefings, podcast episodes, reviews and brands", async ({ page, context }) => {
  await mockSupabase(context, {
    profile: freeProfile(),
    tables: { news_article_engagement: ENGAGEMENT, podcast_likes: [{ id: "p1", user_id: USER_ID, episode_slug: "ep-1-weird-skincare" }] },
  });
  // Liked on this device: a review and a Spotlight brand (zustand persisted store).
  await context.addInitScript(() => {
    localStorage.setItem("skinlabs-engagement", JSON.stringify({ state: { lastViewDate: "", viewedArticleIds: [], likedIds: ["sb-cerious-proatection", "spotlight:standard-beauty"], savedIds: [] }, version: 0 }));
  });
  await page.goto("/dashboard?tab=saved");
  await expect(page.getByRole("link", { name: "A saved briefing" })).toBeVisible();
  await page.getByRole("tab", { name: /Liked/ }).click();
  await expect(page.getByRole("link", { name: "A liked briefing" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Liked podcast episodes" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Liked podcast episodes" }).getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Liked reviews" }).getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Liked Spotlight brands" }).getByRole("link")).toHaveCount(1);

  // Persistence: still there after a reload.
  await page.reload();
  await page.getByRole("tab", { name: /Liked/ }).click();
  await expect(page.getByRole("region", { name: "Liked podcast episodes" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Liked reviews" })).toBeVisible();
});

test("empty Saved and Liked tabs point at what to do next", async ({ page, context }) => {
  await mockSupabase(context, { profile: freeProfile() });
  await page.goto("/dashboard?tab=saved");
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
  await page.getByRole("tab", { name: /Liked/ }).click();
  await expect(page.getByText(/Nothing liked yet/)).toBeVisible();
});
