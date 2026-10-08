/**
 * Pure rules for the Community Forum (src/pages/CommunityForum.tsx). Unit tested in
 * src/lib/__tests__/communityRules.test.ts. The database enforces the same limits (CHECK constraints, column grants,
 * rate limits); these exist so the UI can explain a problem before a round trip.
 */

export type CommunityRole = "admin" | "moderator" | "member";

export interface CommunityPost {
  id: string;
  author_name: string;
  author_role: CommunityRole;
  is_mine: boolean;
  title: string;
  body: string;
  category: string | null;
  category_name: string | null;
  status: "published" | "removed" | "deleted";
  pinned: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  edited_at: string | null;
  liked_by_me: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_role: CommunityRole;
  is_mine: boolean;
  body: string;
  like_count: number;
  created_at: string;
  edited_at: string | null;
  liked_by_me: boolean;
}

export interface CommunityCategory {
  slug: string;
  name: string;
}

export const TITLE_MIN = 4;
export const TITLE_MAX = 140;
export const BODY_MIN = 10;
export const BODY_MAX = 4000;
export const COMMENT_MAX = 1500;
export const FEED_PAGE_SIZE = 15;
export const COMMENT_PAGE_SIZE = 30;
export const FORUM_PATH = "/community-forum";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or unkind behaviour" },
  { value: "medical_misinformation", label: "Misleading health or skincare claim" },
  { value: "unsafe_advice", label: "Unsafe advice" },
  { value: "self_promotion", label: "Self-promotion" },
  { value: "other", label: "Something else" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export interface FieldErrors {
  title?: string;
  body?: string;
}

/** Empty or obviously invalid drafts are refused before they leave the browser. */
export const validatePostDraft = (title: string, body: string): FieldErrors => {
  const errors: FieldErrors = {};
  const t = title.trim();
  const b = body.trim();
  if (t.length < TITLE_MIN) errors.title = `Give your discussion a title (at least ${TITLE_MIN} characters).`;
  else if (t.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;
  if (b.length < BODY_MIN) errors.body = `Say a little more (at least ${BODY_MIN} characters).`;
  else if (b.length > BODY_MAX) errors.body = `Keep it under ${BODY_MAX} characters.`;
  return errors;
};

export const validateCommentDraft = (body: string): string | null => {
  const b = body.trim();
  if (!b) return "Write something first.";
  if (b.length > COMMENT_MAX) return `Keep comments under ${COMMENT_MAX} characters.`;
  return null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `?post=<uuid>` deep link (push taps, shares). Anything that isn't a uuid is ignored. */
export const parsePostParam = (search: string): string | null => {
  const raw = new URLSearchParams(search).get("post");
  return raw && UUID.test(raw) ? raw.toLowerCase() : null;
};

export const postPath = (id: string): string => `${FORUM_PATH}?post=${id}`;

/** A short relative time: "now", "5m", "3h", "2d", then a date. */
export const relativeTime = (iso: string, now: number = Date.now()): string => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(t).toLocaleDateString("en-ZA", { day: "numeric", month: "short", ...(d > 300 ? { year: "numeric" } : {}), timeZone: "Africa/Johannesburg" });
};

export const initialsOf = (name: string): string => {
  const parts = name.replace(/[^\p{L}\p{N}\s_]/gu, "").split(/[\s_]+/).filter(Boolean);
  if (parts.length === 0) return "S";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
};

export const roleLabel = (role: CommunityRole): string | null => (role === "admin" ? "Admin" : role === "moderator" ? "Mod" : null);

/** What the member sees for a failed write. Mirrors the database's error messages (handle_required, rate_limited, RLS). */
export const writeErrorMessage = (error: { message?: string; code?: string } | null | undefined, fallback: string): string => {
  const m = error?.message ?? "";
  if (m.includes("handle_required")) return "Choose a public handle first.";
  if (m.includes("rate_limited")) return "You're posting very quickly. Give it a few minutes.";
  if (error?.code === "42501" || /row-level security|permission denied/i.test(m)) return "That isn't available to you.";
  if (error?.code === "23514") return "That doesn't look right. Check the length and try again.";
  return fallback;
};

export const needsHandle = (error: { message?: string } | null | undefined): boolean => (error?.message ?? "").includes("handle_required");

/** Immutable list helpers used by the cache patches. */
export const patchPost = (posts: readonly CommunityPost[], id: string, patch: Partial<CommunityPost>): CommunityPost[] =>
  posts.map((p) => (p.id === id ? { ...p, ...patch } : p));

export const patchComment = (comments: readonly CommunityComment[], id: string, patch: Partial<CommunityComment>): CommunityComment[] =>
  comments.map((c) => (c.id === id ? { ...c, ...patch } : c));

/** Pinned posts stay on top; otherwise newest first. Inserts a post once. */
export const insertPostSorted = (posts: readonly CommunityPost[], post: CommunityPost): CommunityPost[] => {
  if (posts.some((p) => p.id === post.id)) return posts.map((p) => (p.id === post.id ? post : p));
  const pinnedCount = posts.filter((p) => p.pinned).length;
  if (post.pinned) return [post, ...posts];
  return [...posts.slice(0, pinnedCount), post, ...posts.slice(pinnedCount)];
};

/** Fields a realtime UPDATE may refresh. `liked_by_me` / `is_mine` are per-viewer, so the event never carries them. */
export interface PostRealtimeRow {
  id: string;
  status?: string;
  pinned?: boolean;
  title?: string;
  body?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  edited_at?: string | null;
}

export const postPatchFromRealtime = (row: PostRealtimeRow): Partial<CommunityPost> => {
  const patch: Partial<CommunityPost> = {};
  if (typeof row.like_count === "number") patch.like_count = row.like_count;
  if (typeof row.comment_count === "number") patch.comment_count = row.comment_count;
  if (typeof row.share_count === "number") patch.share_count = row.share_count;
  if (typeof row.pinned === "boolean") patch.pinned = row.pinned;
  if (typeof row.title === "string") patch.title = row.title;
  if (typeof row.body === "string") patch.body = row.body;
  if (row.edited_at !== undefined) patch.edited_at = row.edited_at;
  return patch;
};
