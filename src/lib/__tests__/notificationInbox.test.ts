import { describe, expect, test } from "bun:test";
import { isVisibleRow, mergeRow, safeImageUrl, safeLinkTarget, toInboxRow, unreadOf, visibleRows, type InboxRow } from "../notificationInbox";

const ORIGIN = "https://skinlabs.co.za";
const NOW = Date.parse("2026-10-04T10:00:00Z");
const row = (over: Partial<InboxRow> = {}): InboxRow => ({
  id: "1",
  category: "system",
  title: "t",
  body: null,
  link: null,
  read_at: null,
  created_at: "2026-10-04T09:00:00Z",
  archived_at: null,
  expires_at: null,
  image_url: null,
  action_label: null,
  ...over,
});

describe("inbox visibility", () => {
  test("archived and expired rows are hidden, future expiry is shown", () => {
    expect(isVisibleRow(row(), NOW)).toBe(true);
    expect(isVisibleRow(row({ archived_at: "2026-10-04T09:30:00Z" }), NOW)).toBe(false);
    expect(isVisibleRow(row({ expires_at: "2026-10-04T09:59:59Z" }), NOW)).toBe(false);
    expect(isVisibleRow(row({ expires_at: "2026-10-05T00:00:00Z" }), NOW)).toBe(true);
  });
  test("unread count ignores read, archived and expired rows", () => {
    const rows = [row({ id: "a" }), row({ id: "b", read_at: "x" }), row({ id: "c", archived_at: "x" }), row({ id: "d", expires_at: "2026-01-01T00:00:00Z" })];
    expect(unreadOf(rows, NOW)).toBe(1);
  });
  test("newest first", () => {
    const out = visibleRows([row({ id: "old", created_at: "2026-10-01T00:00:00Z" }), row({ id: "new", created_at: "2026-10-04T00:00:00Z" })], NOW);
    expect(out.map((r) => r.id)).toEqual(["new", "old"]);
  });
  test("a realtime insert is merged once; an archive update removes the row", () => {
    const a = row({ id: "a" });
    const once = mergeRow([a], row({ id: "b", created_at: "2026-10-04T09:30:00Z" }), NOW);
    expect(once.map((r) => r.id)).toEqual(["b", "a"]);
    expect(mergeRow(once, row({ id: "b", created_at: "2026-10-04T09:30:00Z" }), NOW)).toHaveLength(2);
    expect(mergeRow(once, row({ id: "b", archived_at: "2026-10-04T09:40:00Z" }), NOW).map((r) => r.id)).toEqual(["a"]);
  });
  test("toInboxRow rejects junk and fills defaults", () => {
    expect(toInboxRow(null)).toBeNull();
    expect(toInboxRow({ id: 1 })).toBeNull();
    expect(toInboxRow({ id: "x", title: "T", created_at: "2026-10-04T00:00:00Z" })?.category).toBe("system");
  });
});

describe("links and images stay on our origin", () => {
  test("links", () => {
    expect(safeLinkTarget("/dashboard?tab=inbox", ORIGIN)).toBe("/dashboard?tab=inbox");
    expect(safeLinkTarget("https://skinlabs.co.za/reviews/x#a", ORIGIN)).toBe("/reviews/x#a");
    for (const bad of ["https://evil.example/x", "//evil.example", "javascript:alert(1)", "/\\evil.example", "", null, undefined]) {
      expect(safeLinkTarget(bad as string | null, ORIGIN)).toBeNull();
    }
  });
  test("images", () => {
    expect(safeImageUrl("/images/a.jpg", ORIGIN)).toBe("/images/a.jpg");
    expect(safeImageUrl("https://skinlabs.co.za/images/a.jpg", ORIGIN)).toBe("/images/a.jpg");
    for (const bad of ["https://cdn.evil.example/a.jpg", "http://skinlabs.co.za.evil.example/a.jpg", "data:image/png;base64,AAAA", "//evil.example/a.jpg", null]) {
      expect(safeImageUrl(bad as string | null, ORIGIN)).toBeNull();
    }
  });
});
