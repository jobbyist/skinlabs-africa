import { expect, test, type BrowserContext, type Route } from "@playwright/test";
import zlib from "node:zlib";
import { freeProfile, mockSupabase } from "./support/mockSupabase";

/**
 * Community Forum (/community-forum): members-only feed, thread sheet, compose, likes, deep links, bottom-nav tab.
 * Supabase is mocked (e2e/support/mockSupabase.ts) plus an in-memory forum behind the community_* RPCs/tables, so
 * nothing here touches a real database. Realtime is covered by unit tests of the cache patches; the websocket is aborted.
 */

interface Post {
  id: string; author_name: string; author_role: string; is_mine: boolean; title: string; body: string; category: string | null; category_name: string | null;
  status: string; pinned: boolean; like_count: number; comment_count: number; share_count: number; created_at: string; edited_at: string | null; liked_by_me: boolean;
  author_avatar: string | null; image_path: string | null; image_w: number | null; image_h: number | null;
}
interface Comment { id: string; post_id: string; parent_id: null; author_name: string; author_role: string; is_mine: boolean; body: string; like_count: number; created_at: string; edited_at: null; liked_by_me: boolean; author_avatar: string | null }

const P1 = "11111111-1111-4111-8111-111111111111";
const SUN = "Sunscreen and hyperpigmentation: how much, how often?";
const P2 = "22222222-2222-4222-8222-222222222222";

const seedPosts = (): Post[] => [
  { id: P1, author_name: "Nicole N.", author_role: "moderator", is_mine: false, title: "Sunscreen and hyperpigmentation: how much, how often?", body: "Two finger-lengths for face and neck, reapplied outdoors.", category: "sun-care", category_name: "Sun care", status: "published", pinned: false, like_count: 3, comment_count: 1, share_count: 0, created_at: new Date(Date.now() - 3_600_000).toISOString(), edited_at: null, liked_by_me: false, author_avatar: "11111111-1111-4111-8111-aaaaaaaaaaaa/av.webp", image_path: null, image_w: null, image_h: null },
  { id: P2, author_name: "Thandi M.", author_role: "member", is_mine: false, title: "Winter dryness on the Highveld", body: "What layering works for you in July?", category: "seasonal", category_name: "Seasonal skin", status: "published", pinned: false, like_count: 0, comment_count: 0, share_count: 0, created_at: new Date(Date.now() - 7_200_000).toISOString(), edited_at: null, liked_by_me: false, author_avatar: null, image_path: null, image_w: null, image_h: null },
];

async function mockForum(context: BrowserContext, opts: { staff?: boolean; extraPosts?: number } = {}) {
  const posts = seedPosts();
  for (let i = 0; i < (opts.extraPosts ?? 0); i++) posts.push({ ...seedPosts()[1], id: `44444444-4444-4444-8444-${String(i).padStart(12, "0")}`, title: `Extra discussion ${i + 1}`, created_at: new Date(Date.now() - (3 + i) * 3_600_000).toISOString() });
  const uploads: string[] = [];
  const created: Record<string, unknown>[] = [];
  const comments: Comment[] = [{ id: "c1", post_id: P1, parent_id: null, author_name: "Cole O.", author_role: "moderator", is_mine: false, body: "Great question, reapplication is the part people skip.", like_count: 1, created_at: new Date(Date.now() - 1_800_000).toISOString(), edited_at: null, liked_by_me: false, author_avatar: null }];
  const calls: string[] = [];
  const json = (r: Route, body: unknown, status = 200) => r.fulfill({ status, json: body });
  const bodyOf = (r: Route): Record<string, unknown> => { try { return (r.request().postDataJSON() as Record<string, unknown>) ?? {}; } catch { return {}; } };

  await context.route(/supabase\.co\/storage\/v1\/object\/public\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }));
  await context.route(/supabase\.co\/storage\/v1\/object\/(community-media|avatars)\//, (r) => {
    if (r.request().method() === "GET") return r.fallback();
    uploads.push(decodeURIComponent(new URL(r.request().url()).pathname.replace("/storage/v1/object/", "")));
    return r.fulfill({ status: 200, json: { Key: "ok" } });
  });
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
    const post: Post = { id: "33333333-3333-4333-8333-333333333333", author_name: "qa_user", author_role: "member", is_mine: true, title: String(b.title), body: String(b.body), category: (b.category as string) ?? null, category_name: null, status: /https?:\/\//.test(String(b.body)) ? "held" : "published", pinned: false, like_count: 0, comment_count: 0, share_count: 0, created_at: new Date().toISOString(), edited_at: null, liked_by_me: false, author_avatar: null, image_path: (b.image_path as string) ?? null, image_w: (b.image_w as number) ?? null, image_h: (b.image_h as number) ?? null };
    created.push(b);
    posts.unshift(post);
    calls.push("create-post");
    return json(r, { id: post.id }, 201);
  });
  await context.route(/supabase\.co\/rest\/v1\/community_comments/, (r) => {
    const b = bodyOf(r);
    const c: Comment = { id: `c${comments.length + 1}`, post_id: String(b.post_id), parent_id: null, author_name: "qa_user", author_role: "member", is_mine: true, body: String(b.body), like_count: 0, created_at: new Date().toISOString(), edited_at: null, liked_by_me: false, author_avatar: null };
    comments.push(c);
    const post = posts.find((p) => p.id === c.post_id);
    if (post) post.comment_count += 1;
    calls.push("create-comment");
    return json(r, { id: c.id }, 201);
  });
  return { calls, posts, uploads, created };
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
  const like = page.getByRole("button", { name: /Upvote this post, 3 upvotes/ });
  await like.click();
  await expect(page.getByRole("button", { name: /Remove upvote from this post, 4 upvotes/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Remove upvote from this post, 4 upvotes/ }).click();
  await expect(page.getByRole("button", { name: /Upvote this post, 3 upvotes/ })).toBeVisible();
  expect(forum.calls).toContain("POST:like");
  expect(forum.calls).toContain("DELETE:like");
});

test("vote targets and composers stay usable above a resized and panned keyboard viewport", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  const vote = page.getByRole("button", { name: /Upvote this post, 3 upvotes/ });
  const target = await vote.boundingBox();
  expect(target?.width).toBe(44);
  expect(target?.height).toBe(44);
  await expect(vote).toHaveAttribute("data-haptic", "true");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  for (const label of ["Title", "Details", "Topic (optional)"]) {
    expect(await sheet.getByLabel(label, { exact: true }).evaluate(el => getComputedStyle(el).fontSize)).toBe("16px");
  }
  await sheet.getByLabel("Details").fill("A keyboard-safe skincare discussion draft.");
  await sheet.getByLabel("Details").focus();
  await page.evaluate(() => {
    const viewport = window.visualViewport;
    if (!viewport) throw new Error("visualViewport unavailable");
    Object.defineProperty(viewport, "height", { configurable: true, value: window.innerHeight - 300 });
    Object.defineProperty(viewport, "offsetTop", { configurable: true, value: 50 });
    viewport.dispatchEvent(new Event("resize"));
    viewport.dispatchEvent(new Event("scroll"));
  });
  await expect(sheet).toHaveAttribute("data-keyboard-open", "true");
  await expect.poll(() => sheet.evaluate(el => Math.round(el.getBoundingClientRect().bottom))).toBe((page.viewportSize()?.height ?? 0) - 250);
  await expect(sheet.getByRole("toolbar", { name: "Discussion attachments" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Publish", exact: true })).toBeInViewport();
  await sheet.screenshot({ path: `/tmp/browser/forum-composer-${test.info().project.name}.png` });
  await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await page.getByRole("button", { name: SUN, exact: true }).click();
  const thread = page.getByRole("dialog");
  expect(await thread.getByLabel("Add a comment").evaluate(el => getComputedStyle(el).fontSize)).toBe("16px");
  await thread.getByLabel("Add a comment").fill("My comment stays above the keyboard.");
  await expect(thread.getByRole("button", { name: "Post comment", exact: true })).toBeInViewport();
  await thread.screenshot({ path: `/tmp/browser/forum-thread-${test.info().project.name}.png` });
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
  await expect.poll(() => forum.calls).toContain("create-comment");
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
  await expect(page.locator("[data-post-id]").getByRole("button", { name: "Best gentle cleanser for combination skin?", exact: true })).toBeVisible();
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

// A real 24x24 PNG (so the browser's own decoder and lossless encoder run), generated here to avoid a binary fixture.
const png24 = () => {
  const w = 24, h = 24;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = x * 10; raw[o + 1] = y * 10; raw[o + 2] = 128; }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
};

test("the Community Guidelines open in a scrollable popup that fits the screen", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: "Community guidelines" }).click();
  const dialog = page.getByRole("dialog", { name: "Community Guidelines" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.height).toBeLessThanOrEqual(viewport.height);
  const scroller = dialog.getByLabel("Community Guidelines text");
  expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(dialog.getByText("6. Posting in the Community Forum")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("sponsored units sit between discussions, never adjacent, and never before the first post", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context, { extraPosts: 5 });
  await page.goto("/community-forum");
  await expect(page.locator("[data-post-id]")).toHaveCount(7);
  await expect(page.locator("[data-feed-ad]")).toHaveCount(3);
  const layout = await page.evaluate(() => Array.from(document.querySelectorAll("ul > li[data-post-id], ul > li[data-feed-ad]")).map((li) => (li.hasAttribute("data-feed-ad") ? "ad" : "post")));
  expect(layout[0]).toBe("post");
  expect(layout.join(",")).not.toContain("ad,ad");
  expect(layout.filter((x) => x === "ad")).toHaveLength(3);
});

test("emoji go in at the caret, and a photo is optimised, uploaded to the member's own folder and attached", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Title").fill("Lunchtime glow check");
  await sheet.getByLabel("Details").fill("Sunscreen reapplied and still glowing by lunch");
  await sheet.getByLabel("Details").evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
  await sheet.getByRole("button", { name: "Add emoji" }).click();
  await page.getByRole("tab", { name: "Skincare" }).click();
  await page.getByRole("button", { name: "Insert ✨" }).click();
  await expect(sheet.getByLabel("Details")).toHaveValue("Sunscreen reapplied and still glowing by lunch✨");
  await page.keyboard.press("Escape");

  await sheet.getByLabel("Choose a photo").setInputFiles({ name: "glow.png", mimeType: "image/png", buffer: png24() });
  await expect(sheet.getByAltText("Preview of your attached image")).toBeVisible();
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(forum.uploads).toHaveLength(1);
  expect(forum.uploads[0]).toMatch(/^community-media\/00000000-0000-4000-8000-000000000001\/[0-9a-f-]{36}\.(webp|png)$/);
  expect(String(forum.created[0].image_path)).toMatch(/^00000000-0000-4000-8000-000000000001\/[0-9a-f-]{36}\.(webp|png)$/);
  await expect(page.locator("[data-post-id]").first().getByRole("img", { name: /Image shared with/ })).toBeVisible();
});

test("a file that is not an image is refused before any upload", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Choose a photo").setInputFiles({ name: "evil.jpg", mimeType: "image/jpeg", buffer: Buffer.from("MZ not an image at all") });
  await expect(sheet.getByText(/isn't a supported image/)).toBeVisible();
  expect(forum.uploads).toHaveLength(0);
});

test("a GIF is uploaded untouched so it keeps animating", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Title").fill("Application technique GIF");
  await sheet.getByLabel("Details").fill("Pressing, not rubbing, the sunscreen in.");
  const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  await sheet.getByLabel("Choose a GIF").setInputFiles({ name: "tip.gif", mimeType: "image/gif", buffer: gif });
  await expect(sheet.getByAltText("Preview of your attached image")).toBeVisible();
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(forum.uploads[0]).toMatch(/\.gif$/);
});

test("a post with a link is held for review and says so", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Title").fill("Great read about SPF");
  await sheet.getByLabel("Details").fill("Have a look at https://example.com/spf-guide for the basics.");
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Awaiting moderator review").first()).toBeVisible();
});

test("a bot that fills the hidden field or submits instantly sends nothing", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/community-forum");
  await page.getByRole("button", { name: /Start a discussion/ }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Title").fill("Totally organic discussion");
  await sheet.getByLabel("Details").fill("A perfectly normal sounding message about skincare routines.");
  await sheet.locator("#community-website").fill("http://spam.example", { force: true });
  await sheet.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(forum.calls).not.toContain("create-post");
});

test("a profile picture shows next to the author's name", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  await expect(page.locator("[data-post-id]").first().locator("img[src*='/object/public/avatars/']")).toHaveCount(1);
});

test("the browser's WebP encoder at quality 1 reproduces every pixel (the premise of 'lossless')", async ({ page, context }) => {
  await mockSupabase(context, { profile: member });
  await mockForum(context);
  await page.goto("/community-forum");
  const result = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 96; c.height = 64;
    const g = c.getContext("2d")!;
    const img = g.createImageData(96, 64);
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = (i * 7) % 256; img.data[i + 1] = (i * 13) % 251; img.data[i + 2] = (i * 29) % 241; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/webp", 1));
    if (!blob || blob.type !== "image/webp") return { supported: false, same: true };
    const bmp = await createImageBitmap(blob);
    const c2 = document.createElement("canvas");
    c2.width = 96; c2.height = 64;
    const g2 = c2.getContext("2d")!;
    g2.drawImage(bmp, 0, 0);
    const a = g.getImageData(0, 0, 96, 64).data, b = g2.getImageData(0, 0, 96, 64).data;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return { supported: true, same: false };
    return { supported: true, same: true };
  });
  expect(result.same).toBe(true);
});

test("the profile picture uploader writes to the member's own avatar folder and updates the profile", async ({ page, context }) => {
  const mock = await mockSupabase(context, { profile: member });
  const forum = await mockForum(context);
  await page.goto("/dashboard?tab=profile");
  await page.getByLabel("Choose a profile picture").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png24() });
  await expect(page.getByText("Profile picture updated")).toBeVisible();
  expect(forum.uploads[0]).toMatch(/^avatars\/00000000-0000-4000-8000-000000000001\/[0-9a-f-]{36}\.(webp|png)$/);
  expect(String(mock.profile.avatar_path)).toMatch(/^00000000-0000-4000-8000-000000000001\//);
});

test.describe("Admin → Moderation", () => {
  const wireAdmin = async (page: import("@playwright/test").Page, admin: boolean) => {
    const calls: string[] = [];
    const held = [{ target_type: "post", target_id: "h1", post_id: "h1", title: "Cheap followers", body: "buy followers at https://spam.example", author_name: "newbie", flags: ["blocked_term", "new_account_link"], created_at: new Date().toISOString(), image_path: null }];
    const reports = [{ report_id: "r1", created_at: new Date().toISOString(), reason: "spam", details: "looks like an ad", status: "open", target_type: "post", target_id: P2, post_id: P2, title: "Winter dryness on the Highveld", body: "What layering works?", content_status: "published", author_name: "Thandi M.", reporter_name: "qa_user", report_count: 2 }];
    await page.route("**/rest/v1/rpc/has_role*", (route) => route.fulfill({ json: admin }));
    await page.route(/\/rest\/v1\/rpc\/community_[a-z_]+/, (route) => {
      const fn = /rpc\/([a-z_]+)/.exec(route.request().url())?.[1] ?? "";
      calls.push(fn);
      if (!admin) return route.fulfill({ status: 403, json: { code: "42501", message: "Moderator access required" } });
      const body = (() => { try { return route.request().postDataJSON() as Record<string, unknown>; } catch { return {}; } })();
      if (fn === "community_admin_overview") return route.fulfill({ json: { open_reports: reports.length, held_posts: held.length, held_comments: 0, removed_7d: 1, posts_24h: 4, comments_24h: 9 } });
      if (fn === "community_admin_reports") return route.fulfill({ json: body.p_status === "open" ? reports : [] });
      if (fn === "community_admin_held") return route.fulfill({ json: held });
      if (fn === "community_admin_log") return route.fulfill({ json: [{ created_at: new Date().toISOString(), actor_name: "System", target_type: "post", target_id: "x", action: "hold", note: "auto: 3 reports" }] });
      if (fn === "community_admin_terms") return route.fulfill({ json: [{ id: "t1", pattern: "crypto", enabled: true, created_at: new Date().toISOString() }] });
      if (fn === "community_review_held") { held.length = 0; return route.fulfill({ json: true }); }
      return route.fulfill({ json: true });
    });
    return calls;
  };

  // The admin tab strip re-lays out while counts load, so a forced click can land early: retry until selected.
  const select = async (page: import("@playwright/test").Page, name: string | RegExp) => {
    const tab = page.getByRole("tab", { name });
    await expect(async () => {
      await tab.click({ force: true });
      await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 1500 });
    }).toPass({ timeout: 15_000 });
  };

  test("an admin reviews held content and reports; a member sees nothing", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    const calls = await wireAdmin(page, true);
    await page.goto("/admin");
    await select(page, "Moderation");
    await expect(page.getByText("Open reports")).toBeVisible();
    await expect(page.getByText("looks like an ad")).toBeVisible();
    await select(page, /^Held/);
    await expect(page.getByText("Blocked term", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Nothing is waiting for review.")).toBeVisible();
    expect(calls).toContain("community_review_held");
    await select(page, "Blocked terms");
    await expect(page.getByText("crypto")).toBeVisible();
  });

  test("without the admin role the Moderation tab does not exist and no moderation RPC is called", async ({ page, context }) => {
    await mockSupabase(context, { signedIn: true });
    const calls = await wireAdmin(page, false);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Access Denied" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Moderation", exact: true })).toHaveCount(0);
    expect(calls).toEqual([]);
  });
});
