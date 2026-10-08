import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  COMMENT_PAGE_SIZE,
  FEED_PAGE_SIZE,
  type CommunityCategory,
  type CommunityComment,
  type CommunityPost,
  type ReportReason,
} from "./rules";

/**
 * Community Forum data access. Reads go through the SECURITY DEFINER RPCs (author names and roles are resolved
 * server-side, so the browser never reads `profiles`); writes use the tables' narrow column grants or small RPCs.
 * `db` is deliberately loosely typed: the RPC row shapes are the interfaces in rules.ts / this file (the generated Database types model RPC results as unions).
 */
const db = supabase as unknown as SupabaseClient;

export interface Cursor {
  at: string;
  id: string;
}

export class CommunityError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const fail = (error: { message: string; code?: string }): never => {
  throw new CommunityError(error.message, error.code);
};

export interface FeedPage {
  posts: CommunityPost[];
  next: Cursor | null;
}

export const fetchFeed = async (category: string | null, cursor: Cursor | null): Promise<FeedPage> => {
  const { data, error } = await db.rpc("community_feed", {
    p_limit: FEED_PAGE_SIZE,
    p_cursor_at: cursor?.at ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_category: category,
  });
  if (error) return fail(error);
  const posts = (data ?? []) as CommunityPost[];
  const regular = posts.filter((p) => !p.pinned);
  const last = regular[regular.length - 1];
  return { posts, next: regular.length >= FEED_PAGE_SIZE && last ? { at: last.created_at, id: last.id } : null };
};

/** One post for a deep link. null = not visible to this member (unavailable, removed or deleted). */
export const fetchPost = async (id: string): Promise<CommunityPost | null> => {
  const { data, error } = await db.rpc("community_feed", { p_post_id: id });
  if (error) return fail(error);
  return ((data ?? []) as CommunityPost[])[0] ?? null;
};

export interface CommentPage {
  comments: CommunityComment[];
  next: Cursor | null;
}

export const fetchComments = async (postId: string, cursor: Cursor | null): Promise<CommentPage> => {
  const { data, error } = await db.rpc("community_comments_page", {
    p_post_id: postId,
    p_limit: COMMENT_PAGE_SIZE,
    p_cursor_at: cursor?.at ?? null,
    p_cursor_id: cursor?.id ?? null,
  });
  if (error) return fail(error);
  const comments = (data ?? []) as CommunityComment[];
  const last = comments[comments.length - 1];
  return { comments, next: comments.length >= COMMENT_PAGE_SIZE && last ? { at: last.created_at, id: last.id } : null };
};

export const fetchComment = async (id: string): Promise<CommunityComment | null> => {
  const { data, error } = await db.rpc("community_comment_by_id", { p_comment_id: id });
  if (error) return fail(error);
  return ((data ?? []) as CommunityComment[])[0] ?? null;
};

export const fetchCategories = async (): Promise<CommunityCategory[]> => {
  const { data, error } = await db.from("community_categories").select("slug, name").order("sort_order");
  if (error) return fail(error);
  return (data ?? []) as CommunityCategory[];
};

/** Insert then read back through the feed RPC (the table row has no author name). Returns the new post id. */
export interface PostImage {
  path: string;
  width: number;
  height: number;
}

export const createPost = async (userId: string, input: { title: string; body: string; category: string | null; image?: PostImage | null }): Promise<string> => {
  const { data, error } = await db
    .from("community_posts")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      author_id: userId,
      ...(input.image ? { image_path: input.image.path, image_w: input.image.width, image_h: input.image.height } : {}),
    })
    .select("id")
    .single();
  if (error) return fail(error);
  return (data as { id: string }).id;
};

export const createComment = async (userId: string, postId: string, body: string): Promise<string> => {
  const { data, error } = await db
    .from("community_comments")
    .insert({ post_id: postId, body: body.trim(), author_id: userId })
    .select("id")
    .single();
  if (error) return fail(error);
  return (data as { id: string }).id;
};

export const setPostLike = async (userId: string, postId: string, liked: boolean): Promise<void> => {
  const { error } = liked
    ? await db.from("community_post_likes").insert({ post_id: postId, user_id: userId })
    : await db.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  // A duplicate like means the database already agrees with the screen.
  if (error && error.code !== "23505") fail(error);
};

export const setCommentLike = async (userId: string, commentId: string, liked: boolean): Promise<void> => {
  const { error } = liked
    ? await db.from("community_comment_likes").insert({ comment_id: commentId, user_id: userId })
    : await db.from("community_comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  if (error && error.code !== "23505") fail(error);
};

export const deleteOwn = async (type: "post" | "comment", id: string): Promise<void> => {
  const { error } = await db.rpc("community_delete_own", { p_type: type, p_id: id });
  if (error) fail(error);
};

export const moderate = async (type: "post" | "comment", id: string, action: "remove" | "restore" | "pin" | "unpin"): Promise<void> => {
  const { error } = await db.rpc("community_moderate", { p_type: type, p_id: id, p_action: action });
  if (error) fail(error);
};

export const reportContent = async (
  userId: string,
  target: { post_id?: string; comment_id?: string },
  reason: ReportReason,
  details: string,
): Promise<"sent" | "already_reported"> => {
  const { error } = await db
    .from("community_reports")
    .insert({ reporter_id: userId, ...target, reason, details: details.trim().slice(0, 500) || null });
  if (error?.code === "23505") return "already_reported";
  if (error) fail(error);
  return "sent";
};

/** Fire-and-forget: counts a share once per member. Never blocks or fails the share itself. */
export const recordShare = (postId: string): void => {
  void db.rpc("community_record_share", { p_post_id: postId }).then(() => undefined, () => undefined);
};

export { db as communityDb };

export const fetchIsStaff = async (userId: string): Promise<boolean> => {
  const { data, error } = await db.rpc("community_is_staff", { p_user_id: userId });
  if (error) return false;
  return data === true;
};

export interface MediaUsage {
  used: number;
  quota: number;
}

/** The member's picture storage use against their quota (null when it can't be read; uploads then rely on the server check). */
export const getMyMediaUsage = async (): Promise<MediaUsage | null> => {
  const { data, error } = await db.rpc("community_my_media_usage");
  if (error || !data) return null;
  const d = data as { used?: number; quota?: number };
  return typeof d.used === "number" && typeof d.quota === "number" ? { used: d.used, quota: d.quota } : null;
};

export interface MySanction {
  kind: "mute" | "suspend";
  expires_at: string | null;
}

/** The member's own mute/suspension, if one is in force. Reason and moderator are never exposed to the member. */
export const getMySanction = async (): Promise<MySanction | null> => {
  const { data, error } = await db.rpc("community_my_sanction");
  const d = data as Partial<MySanction> | null;
  if (error || !d || (d.kind !== "mute" && d.kind !== "suspend")) return null;
  return { kind: d.kind, expires_at: d.expires_at ?? null };
};

export type MediaBucket = "community-media" | "avatars";

/** Public URL of an uploaded picture (both buckets are public-read; object names are unguessable). */
export const mediaUrl = (bucket: MediaBucket, path: string | null | undefined): string | null =>
  path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;

/** Uploads a prepared blob into the caller's own folder and returns its storage path. */
export const uploadMedia = async (bucket: MediaBucket, userId: string, prepared: { blob: Blob; ext: string; contentType: string }): Promise<string> => {
  if (bucket === "community-media") {
    // The server refuses uploads once a member is at their quota; checking first gives the member a clear message and
    // stops a single large file from taking them well over it.
    const usage = await getMyMediaUsage();
    if (usage && usage.used + prepared.blob.size > usage.quota) throw new CommunityError("media_quota_exceeded", "media_quota_exceeded");
  }
  const path = `${userId}/${crypto.randomUUID()}.${prepared.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, prepared.blob, { contentType: prepared.contentType, cacheControl: "31536000", upsert: false });
  if (error) throw new CommunityError(/row-level security|violates|unauthorized/i.test(error.message) && bucket === "community-media" ? "media_quota_exceeded" : error.message);
  return path;
};

/** Best effort: an orphaned or replaced file is cleaned up, but a failure never blocks the member. */
export const removeMedia = (bucket: MediaBucket, paths: string[]): void => {
  if (paths.length === 0) return;
  void supabase.storage.from(bucket).remove(paths).then(() => undefined, () => undefined);
};

export const AdminModeration = {
  overview: async () => {
    const { data, error } = await db.rpc("community_admin_overview");
    if (error) return fail(error);
    return data as Record<string, number>;
  },
  reports: async (status: string | null, limit = 50) => {
    const { data, error } = await db.rpc("community_admin_reports", { p_status: status, p_limit: limit });
    if (error) return fail(error);
    return (data ?? []) as AdminReport[];
  },
  held: async () => {
    const { data, error } = await db.rpc("community_admin_held", { p_limit: 50 });
    if (error) return fail(error);
    return (data ?? []) as AdminHeld[];
  },
  review: async (type: "post" | "comment", id: string, approve: boolean) => {
    const { error } = await db.rpc("community_review_held", { p_type: type, p_id: id, p_approve: approve });
    if (error) fail(error);
  },
  resolveReport: async (id: string, status: "dismissed" | "actioned") => {
    const { error } = await db.rpc("community_resolve_report", { p_report_id: id, p_status: status });
    if (error) fail(error);
  },
  log: async () => {
    const { data, error } = await db.rpc("community_admin_log", { p_limit: 50 });
    if (error) return fail(error);
    return (data ?? []) as AdminLogRow[];
  },
  terms: async () => {
    const { data, error } = await db.rpc("community_admin_terms");
    if (error) return fail(error);
    return (data ?? []) as AdminTerm[];
  },
  setTerm: async (pattern: string, enabled: boolean) => {
    const { error } = await db.rpc("community_admin_set_term", { p_pattern: pattern, p_enabled: enabled });
    if (error) fail(error);
  },
  searchMembers: async (query: string) => {
    const { data, error } = await db.rpc("community_admin_member_search", { p_query: query });
    if (error) return fail(error);
    return (data ?? []) as AdminMember[];
  },
  sanction: async (userId: string, kind: SanctionKind, hours: number | null, reason: string) => {
    const { error } = await db.rpc("community_admin_sanction", { p_user_id: userId, p_kind: kind, p_hours: hours, p_reason: reason });
    if (error) fail(error);
  },
  sanctionAuthor: async (type: "post" | "comment", id: string, kind: SanctionKind, hours: number | null, reason: string) => {
    const { error } = await db.rpc("community_admin_sanction_content_author", { p_type: type, p_id: id, p_kind: kind, p_hours: hours, p_reason: reason });
    if (error) fail(error);
  },
  liftSanction: async (id: string) => {
    const { error } = await db.rpc("community_admin_lift_sanction", { p_sanction_id: id });
    if (error) fail(error);
  },
  sanctions: async (activeOnly = true) => {
    const { data, error } = await db.rpc("community_admin_sanctions", { p_active_only: activeOnly });
    if (error) return fail(error);
    return (data ?? []) as AdminSanction[];
  },
};

export type SanctionKind = "mute" | "suspend";
export interface AdminMember {
  user_id: string;
  handle: string;
  role: string;
  posts: number;
  comments: number;
  sanction_kind: SanctionKind | null;
  sanction_expires_at: string | null;
}
export interface AdminSanction {
  id: string;
  user_id: string;
  handle: string | null;
  kind: SanctionKind;
  reason: string;
  created_by_name: string | null;
  created_at: string;
  expires_at: string | null;
  lifted_at: string | null;
  active: boolean;
}

export interface AdminReport {
  report_id: string;
  created_at: string;
  reason: string;
  details: string | null;
  status: string;
  target_type: "post" | "comment";
  target_id: string;
  post_id: string;
  title: string | null;
  body: string | null;
  content_status: string | null;
  author_name: string | null;
  reporter_name: string | null;
  report_count: number;
}
export interface AdminHeld {
  target_type: "post" | "comment";
  target_id: string;
  post_id: string;
  title: string | null;
  body: string;
  author_name: string | null;
  flags: string[];
  created_at: string;
  image_path: string | null;
}
export interface AdminLogRow {
  created_at: string;
  actor_name: string;
  target_type: string;
  target_id: string;
  action: string;
  note: string | null;
}
export interface AdminTerm {
  id: string;
  pattern: string;
  enabled: boolean;
  created_at: string;
}
