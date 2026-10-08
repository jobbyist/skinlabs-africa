import { describe, expect, test } from "bun:test";
import {
  BODY_MAX,
  COMMENT_MAX,
  TITLE_MAX,
  initialsOf,
  insertPostSorted,
  needsHandle,
  parsePostParam,
  patchPost,
  postPatchFromRealtime,
  postPath,
  relativeTime,
  roleLabel,
  validateCommentDraft,
  validatePostDraft,
  writeErrorMessage,
  type CommunityPost,
} from "../community/rules";

const post = (over: Partial<CommunityPost> = {}): CommunityPost => ({
  id: "p1",
  author_name: "Nicole N.",
  author_role: "moderator",
  is_mine: false,
  title: "Title",
  body: "Body body body",
  category: null,
  category_name: null,
  status: "published",
  pinned: false,
  like_count: 0,
  comment_count: 0,
  share_count: 0,
  created_at: "2026-10-08T08:00:00Z",
  edited_at: null,
  liked_by_me: false,
  ...over,
});

describe("community drafts", () => {
  test("empty or tiny drafts are refused with a reason for each field", () => {
    const e = validatePostDraft("  ", "short");
    expect(e.title).toBeDefined();
    expect(e.body).toBeDefined();
  });
  test("a sensible draft passes; limits match the database CHECKs", () => {
    expect(validatePostDraft("Sunscreen and marks", "Does anyone reapply over the day?")).toEqual({});
    expect(validatePostDraft("x".repeat(TITLE_MAX + 1), "a".repeat(20)).title).toBeDefined();
    expect(validatePostDraft("Fine title", "a".repeat(BODY_MAX + 1)).body).toBeDefined();
    expect(validateCommentDraft("   ")).not.toBeNull();
    expect(validateCommentDraft("a".repeat(COMMENT_MAX + 1))).not.toBeNull();
    expect(validateCommentDraft("Lovely tip")).toBeNull();
  });
});

describe("deep links", () => {
  test("only a uuid is accepted as ?post=", () => {
    const id = "0b7a2c9e-1d1e-4a8b-9f43-5d0c2e4a1b77";
    expect(parsePostParam(`?post=${id}`)).toBe(id);
    expect(parsePostParam(`?post=${id.toUpperCase()}`)).toBe(id);
    expect(parsePostParam("?post=../../admin")).toBeNull();
    expect(parsePostParam("?post=<script>")).toBeNull();
    expect(parsePostParam("")).toBeNull();
    expect(postPath(id)).toBe(`/community-forum?post=${id}`);
  });
});

describe("display helpers", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");
  test("relative time", () => {
    expect(relativeTime("2026-10-08T11:59:40Z", now)).toBe("now");
    expect(relativeTime("2026-10-08T11:30:00Z", now)).toBe("30m");
    expect(relativeTime("2026-10-08T09:00:00Z", now)).toBe("3h");
    expect(relativeTime("2026-10-06T12:00:00Z", now)).toBe("2d");
    expect(relativeTime("nonsense", now)).toBe("");
  });
  test("initials and role labels", () => {
    expect(initialsOf("Nicole N.")).toBe("NN");
    expect(initialsOf("glow_fan")).toBe("GF");
    expect(initialsOf("")).toBe("S");
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("moderator")).toBe("Mod");
    expect(roleLabel("member")).toBeNull();
  });
});

describe("write errors", () => {
  test("database messages become readable guidance", () => {
    expect(writeErrorMessage({ message: "handle_required" }, "x")).toMatch(/handle/i);
    expect(needsHandle({ message: "handle_required" })).toBe(true);
    expect(writeErrorMessage({ message: "rate_limited" }, "x")).toMatch(/quickly/i);
    expect(writeErrorMessage({ code: "42501", message: "new row violates row-level security policy" }, "x")).toMatch(/isn't available/);
    expect(writeErrorMessage({ message: "boom" }, "fallback")).toBe("fallback");
  });
});

describe("cache patches", () => {
  test("a realtime update refreshes counts but never per-viewer fields", () => {
    const patch = postPatchFromRealtime({ id: "p1", like_count: 5, comment_count: 2, pinned: true });
    expect(patch).toEqual({ like_count: 5, comment_count: 2, pinned: true });
    const out = patchPost([post({ liked_by_me: true, is_mine: true })], "p1", patch);
    expect(out[0].like_count).toBe(5);
    expect(out[0].liked_by_me).toBe(true);
    expect(out[0].is_mine).toBe(true);
  });
  test("new posts go under the pinned ones, once", () => {
    const list = [post({ id: "pin", pinned: true }), post({ id: "a" })];
    const next = insertPostSorted(list, post({ id: "new" }));
    expect(next.map((p) => p.id)).toEqual(["pin", "new", "a"]);
    expect(insertPostSorted(next, post({ id: "new", like_count: 1 })).filter((p) => p.id === "new")).toHaveLength(1);
  });
});
