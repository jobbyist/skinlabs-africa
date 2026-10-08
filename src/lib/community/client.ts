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
 * `db` is untyped until src/integrations/supabase/types.ts is regenerated after migration 20261008100000.
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
export const createPost = async (userId: string, input: { title: string; body: string; category: string | null }): Promise<string> => {
  const { data, error } = await db
    .from("community_posts")
    .insert({ title: input.title.trim(), body: input.body.trim(), category: input.category, author_id: userId })
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
