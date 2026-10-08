import { expect, test, type BrowserContext, type Route } from "@playwright/test";
import { freeProfile, mockSupabase } from "./support/mockSupabase";

/**
 * Community Forum (/community-forum): members-only feed, thread sheet, compose, likes, deep links, bottom-nav tab.
 * Supabase is mocked (e2e/support/mockSupabase.ts) plus an in-memory forum behind the community_* RPCs/tables, so
 * nothing here touches a real database. Realtime is covered by unit tests of the cache patches; the websocket is aborted.
 */

interface Post {
  id: string; author_name: string; author_role: string; is_mine: boolean; title: string; body: string; category: string | null; category_name: string | null;
  status: string; pinned: boolean; like_count: number; comment_count: number; share_count: number; created_at: string; edited_at: string | null; liked_by_me: boolean;
}
interface Comment { id: string; post_id: string; parent_id: null; author_name: string; author_role: string; is_mine: boolean; body: string; like_count: number; created_at: string; edited_at: null; liked_by_me: boolean }

const P1 = "11111111-1111-4111-8111-111111111111";
const SUN = "Sunscreen and hyperpigmentation: how much, how often?";
const P2 = "22222222-2222-4222-8222-222222222222";

const seedPosts = (): Post[] => [
  { id: P1, author_name: "Nicole N.", author_role: "moderator", is_mine: false, title: "Sunscreen and hyperpigmentation: how much, how often?", body: "Two finger-lengths for face and neck, reapplied outdoors.", category: "sun-care", category_name: "Sun care", status: "published", pinned: false, like_count: 3, comment_count: 1, share_count: 0, created_at: new Date(Date.now() - 3_600_000).toISOString(), edited_at: null, liked_by_me: false },
  { id: P2, author_name: "Thandi M.", author_role: "member", is_mine: false, title: "Winter dryness on the Highveld", body: "What layering works for you in July?", category: "seasonal", category_name: "Seasonal skin", status: "published", pinned: false, like_count: 0, comment_count: 0, share_count: 0, created_at: new Date(Date.now() - 7_200_000).toISOString(), edited_at: null, liked_by_me: false },
];

async function mockForum(context: BrowserContext, opts: { staff?: boolean } = {}) {
  const posts = seedPosts();
  const comments: Comment[] = [{ id: "c1", post_id: P1, parent_id: null, author_name: "Cole O.", author_role: "moderator", is_mine: false, body: "Great question, reapplication is the part people skip.", like_count: 1, created_at: new Date(Date.now() - 1_800_000).toISOString(), edited_at: null, liked_by_me: false }];
  const calls: string[] = [];
  const json = (r: Route, body: unknown, status = 200) => r.fulfill({ status, json: body });
  const bodyOf = (r: Route): Record<string, unknown> => { try { return (r.request().postDataJSON() as Record<string, unknown>) ?? {}; } catch { return {}; } };

  await context.route(/supabase\.co\/rest\/v1\/community_categories/, (r) => json(r, [{ slug: "sun-care", name: "Sun care" }, { slug: "seasonal", name: "Seasonal skin" }]));
  await context.route(/supabase\.co\/rest\/v1\/rpc\/community_feed/, (r) => {
    const b = bodyOf(r);
    calls.push("feed");
    if (b.p_post_id) return json(r, posts.filter((p) => p.id === b.p_post_id));
    return json(r, posts.filter((p) => !b.p_category || p.category === b.p_category));
  });
  await context.route(/supabase\.co\/rest\/v1\/rpc\/community_comments_page/, (r) => json(r, comments.filter((c) => c.post_id === bodyOf(r).p_post_id)));
  await context.route(/supabase\.co\/rest\/v1\/rpc\/community_comment_by_id/, (r) => json(r, comments.filter((c) => c.id === bodyOf(r).p_comment_id)));
  await context.route(/supabase\.co\/rest\/v1\/rpc\/community_is_staff/, (r) => json(r, Boolean(opts.staff)));
  await context.route(/supabase\.co\/rest\/v1\/rpc\/community_record_share/, (r) => { calls.push("share"); return json(r, null); });
  await context.route(/supabase\.co\/rest\/v1\/community_post_likes/, (r) => {
    const req = r.request();
    const id = req.method() === "POST" ? String(bodyOf(r).post_id) : /post_id=eq\.([0-9a-f-]+)/.exec(req.url())?.[1];
    const post = posts.find((p) => p.id === id);
    if (post) { post.liked_by_me = req.method() === "POST"; post.like_count += req.method() === "POST" ? 1 : -1; }
    calls.push(`${req.method()}:like`);
    return r.fulfill({ status: 201, body: "" });
  });
  await context.route(/supabase\.co\/rest\/v1\/community_posts/, (r) => {
    const b = bodyOf(r);
    const post: Post = { id: "33333333-3333-4333-8333-333333333333", author_name: "qa_user", author_role: "member", is_mine: true, title: String(b.title), body: String(b.body), category: (b.category as string) ?? null, category_name: null, status: "published", pinned: false, like_count: 0, comment_count: 0, share_count: 0, created_at: new Date().toISOString(), edited_at: null, liked_by_me: false };
    posts.unshift(post);
    calls.push("create-post");
    return json(r, { id: post.id }, 201);
  });
  await context.route(/supabase\.co\/rest\/v1\/community_comments/, (r) => {
    const b = bodyOf(r);
    const c: Comment = { id: `c${comments.length + 1}`, post_id: String(b.post_id), parent_id: null, author_name: "qa_user", author_role: "member", is_mine: true, body: String(b.body), like_count: 0, created_at: new Date().toISOString(), edited_at: null, liked_by_me: false };
    comments.push(c);
    const post = posts.find((p) => p.id === c.post_id);
    if (post) post.comment_count += 1;
    calls.push("create-comment");
    return json(r, { id: c.id }, 201);
  });
  return { calls, posts };
}

const member = freeProfile({ username: "qa_user", username_generated: false, full_name: "QA User" });

test("members see the feed with author names and role badges", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Skin talk");
  await expect(page.getByRole("button", { name: SUN, exact: true })).toBeVisible();
  await expect(page.getByText("Nicole N.").first()).toBeVisible();
  await expect(page.getByText("Mod", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Thandi M.")).toBeVisible();
});

test("liking is a real write and toggles back", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  const like = page.getByRole("button", { name: /Like this post, 3 likes/ });
  await like.click();
  await expect(page.getByRole("button", { name: /Unlike this post, 4 likes/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Unlike this post, 4 likes/ }).click();
  await expect(page.getByRole("button", { name: /Like this post, 3 likes/ })).toBeVisible();
  expect(forum.calls).toContain("POST:like");
  expect(forum.calls).toContain("DELETE:like");
});

test("a discussion opens with its comments, and a new comment appears at once", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: SUN, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`post=${P1}`));
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Great question, reapplication is the part people skip.")).toBeVisible();
  await sheet.getByLabel("Add a comment").fill("I keep a stick sunscreen in my bag.");
  await sheet.getByRole("button", { name: "Post comment" }).click();
  await expect(sheet.getByText("I keep a stick sunscreen in my bag.")).toBeVisible();
  expect(forum.calls).toContain("create-comment");
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/post=/);
});

test("starting a discussion validates, publishes, and shows it at the top", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(sheet.getByText(/Give your discussion a title/)).toBeVisible();
  expect(forum.calls).not.toContain("create-post");
  await sheet.getByLabel("Title").fill("Best gentle cleanser for combination skin?");
  await sheet.getByLabel("Details").fill("Cape Town, tight after most cleansers but oily nose and chin.");
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-post-id]").first().getByRole("button", { name: "Best gentle cleanser for combination skin?", exact: true })).toBeVisible();
  expect(forum.calls).toContain("create-post");
});

test("a deep link opens the discussion; an unknown one says it is unavailable", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto(`/community-forum?post=${P2}`);
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Winter dryness on the Highveld" })).toBeVisible();
  await page.goto("/community-forum?post=99999999-9999-4999-8999-999999999999");
  await expect(page.getByText("This discussion isn't available")).toBeVisible();
});

test("signed-out visitors are asked to sign in and see no discussions", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: false });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  // The sign-in dialog opens in place (the page behind it is inert while it is open).
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Sign in to join the conversation")).toBeAttached();
  await expect(page.getByText("Sunscreen and hyperpigmentation")).toHaveCount(0);
  expect(forum.calls).not.toContain("feed");
});

test("moderators can pin and remove; members only get Report", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context, { staff: true });
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /More actions for “Sunscreen/ }).click();
  await expect(page.getByRole("menuitem", { name: /Pin to top/ })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Remove \(moderator\)/ })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Report" })).toBeVisible();
});

test("the Forum tab is in the bottom navigation and is current on the page", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Forum" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
  // No horizontal overflow from the extra tab
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
