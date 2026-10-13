import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  createComment,
  createPost,
  deleteOwn,
  fetchCategories,
  fetchComment,
  fetchComments,
  fetchFeed,
  fetchPost,
  moderate,
  removeMedia,
  setCommentLike,
  setPostLike,
  type CommentPage,
  type Cursor,
  type FeedPage,
  type PostImage,
} from "@/lib/community/client";
import {
  insertPostSorted,
  patchComment,
  patchPost,
  postPatchFromRealtime,
  writeErrorMessage,
  type CommunityComment,
  type CommunityPost,
  type PostRealtimeRow,
} from "@/lib/community/rules";

export const COMMUNITY_KEY = "community";
type FeedData = InfiniteData<FeedPage, Cursor | null>;
type CommentData = InfiniteData<CommentPage, Cursor | null>;

/** Rewrite every cached copy of a post (all feed filters + the single-post deep-link cache). */
const mapPosts = (qc: QueryClient, fn: (posts: CommunityPost[]) => CommunityPost[]) => {
  qc.setQueriesData<FeedData>({ queryKey: [COMMUNITY_KEY, "feed"] }, (old) =>
    old ? { ...old, pages: old.pages.map((page) => ({ ...page, posts: fn(page.posts) })) } : old,
  );
  qc.setQueriesData<CommunityPost | null>({ queryKey: [COMMUNITY_KEY, "post"] }, (old) => {
    if (!old) return old;
    return fn([old])[0] ?? null;
  });
};

const mapComments = (qc: QueryClient, postId: string | null, fn: (comments: CommunityComment[]) => CommunityComment[]) => {
  qc.setQueriesData<CommentData>({ queryKey: postId ? [COMMUNITY_KEY, "comments", postId] : [COMMUNITY_KEY, "comments"] }, (old) =>
    old ? { ...old, pages: old.pages.map((page) => ({ ...page, comments: fn(page.comments) })) } : old,
  );
};

export const useCommunityCategories = () =>
  useQuery({ queryKey: [COMMUNITY_KEY, "categories"], queryFn: fetchCategories, staleTime: 30 * 60_000 });

export const useCommunityFeed = (category: string | null, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: [COMMUNITY_KEY, "feed", category],
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam }) => fetchFeed(category, pageParam),
    getNextPageParam: (last) => last.next,
    enabled,
    staleTime: 30_000,
  });

export const useCommunityPost = (id: string | null, enabled: boolean) =>
  useQuery({ queryKey: [COMMUNITY_KEY, "post", id], queryFn: () => fetchPost(id as string), enabled: enabled && Boolean(id), staleTime: 15_000 });

export const useCommunityComments = (postId: string | null, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: [COMMUNITY_KEY, "comments", postId],
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam }) => fetchComments(postId as string, pageParam),
    getNextPageParam: (last) => last.next,
    enabled: enabled && Boolean(postId),
    staleTime: 15_000,
  });

/** Optimistic like for a post. The database is authoritative: a failure rolls the screen back, a realtime echo corrects counts. */
export const usePostLike = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useCallback(
    async (post: CommunityPost) => {
      if (!user) return;
      const liked = !post.liked_by_me;
      const apply = (value: boolean, delta: number) =>
        mapPosts(qc, (posts) => patchPost(posts, post.id, { liked_by_me: value, like_count: Math.max(0, post.like_count + delta) }));
      apply(liked, liked ? 1 : -1);
      try {
        await setPostLike(user.id, post.id, liked);
      } catch (error) {
        apply(post.liked_by_me, 0);
        toast.error(writeErrorMessage(error as Error, "Couldn't update your like. Try again."));
      }
    },
    [qc, user],
  );
};

export const useCommentLike = (postId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useCallback(
    async (comment: CommunityComment) => {
      if (!user) return;
      const liked = !comment.liked_by_me;
      const apply = (value: boolean, count: number) => mapComments(qc, postId, (list) => patchComment(list, comment.id, { liked_by_me: value, like_count: Math.max(0, count) }));
      apply(liked, comment.like_count + (liked ? 1 : -1));
      try {
        await setCommentLike(user.id, comment.id, liked);
      } catch (error) {
        apply(comment.liked_by_me, comment.like_count);
        toast.error(writeErrorMessage(error as Error, "Couldn't update your like. Try again."));
      }
    },
    [qc, user, postId],
  );
};

/** Publishes a discussion, then puts it at the top of the feed without a refetch. */
export const useCreatePost = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string; category: string | null; image?: PostImage | null }) => {
      if (!user) throw new Error("Sign in first.");
      const id = await createPost(user.id, input);
      const post = await fetchPost(id);
      if (!post) throw new Error("Published, but couldn't load it.");
      return post;
    },
    onSuccess: (post) => {
      qc.setQueriesData<FeedData>({ queryKey: [COMMUNITY_KEY, "feed"] }, (old) => {
        if (!old || old.pages.length === 0) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, posts: insertPostSorted(first.posts, post) }, ...rest] };
      });
      qc.setQueryData([COMMUNITY_KEY, "post", post.id], post);
    },
  });
};

export const useCreateComment = (postId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, parentId = null }: { body: string; parentId?: string | null }) => {
      if (!user) throw new Error("Sign in first.");
      const id = await createComment(user.id, postId, body, parentId);
      // null = saved but held for moderator review (it isn't visible yet, to anyone including its author's thread view)
      return fetchComment(id);
    },
    onSuccess: (comment) => {
      if (!comment) return;
      qc.setQueriesData<CommentData>({ queryKey: [COMMUNITY_KEY, "comments", postId] }, (old) => {
        if (!old || old.pages.length === 0) return old;
        if (old.pages.some((p) => p.comments.some((c) => c.id === comment.id))) return old;
        const lastIndex = old.pages.length - 1;
        return { ...old, pages: old.pages.map((p, i) => (i === lastIndex ? { ...p, comments: [...p.comments, comment] } : p)) };
      });
      mapPosts(qc, (posts) => posts.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
    },
  });
};

export const useContentActions = () => {
  const qc = useQueryClient();
  const removeFromFeeds = (id: string) => mapPosts(qc, (posts) => posts.filter((p) => p.id !== id));
  return {
    deletePost: async (id: string, imagePath?: string | null) => {
      await deleteOwn("post", id);
      removeFromFeeds(id);
      if (imagePath) removeMedia("community-media", [imagePath]);
    },
    deleteComment: async (postId: string, id: string) => {
      await deleteOwn("comment", id);
      mapComments(qc, postId, (list) => list.filter((c) => c.id !== id));
      mapPosts(qc, (posts) => posts.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p)));
    },
    removePost: async (id: string) => {
      await moderate("post", id, "remove");
      removeFromFeeds(id);
    },
    removeComment: async (postId: string, id: string) => {
      await moderate("comment", id, "remove");
      mapComments(qc, postId, (list) => list.filter((c) => c.id !== id));
    },
    setPinned: async (id: string, pinned: boolean) => {
      await moderate("post", id, pinned ? "pin" : "unpin");
      await qc.invalidateQueries({ queryKey: [COMMUNITY_KEY, "feed"] });
    },
  };
};

export type ConnectionState = "connecting" | "live" | "reconnecting";

/**
 * ONE realtime channel for the whole forum page (posts + comments; likes and comment counts ride on those rows' counters,
 * so no per-post or per-component subscriptions exist). Events patch the react-query cache in place. A new discussion from
 * somebody else is counted ("N new") rather than injected under the reader's thumb. When the socket drops and comes back,
 * everything is refetched, so nothing missed during the gap stays stale.
 */
export const useCommunityRealtime = (enabled: boolean) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const instance = useId();
  const [state, setState] = useState<ConnectionState>("connecting");
  const [newPosts, setNewPosts] = useState(0);
  const wasLive = useRef(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!enabled || !userId) return;
    const onPostChange = (payload: { eventType: string; new: unknown }) => {
      const row = payload.new as PostRealtimeRow & { author_id?: string | null };
      if (!row?.id) return;
      if (payload.eventType === "INSERT") {
        if (row.status === "published" && row.author_id !== userId) setNewPosts((n) => n + 1);
        return;
      }
      if (row.status && row.status !== "published") {
        mapPosts(qc, (posts) => posts.filter((p) => p.id !== row.id));
        return;
      }
      mapPosts(qc, (posts) => patchPost(posts, row.id, postPatchFromRealtime(row)));
    };
    const onCommentChange = (payload: { eventType: string; new: unknown }) => {
      const row = payload.new as { id?: string; post_id?: string; author_id?: string | null; status?: string; like_count?: number; body?: string };
      if (!row?.id || !row.post_id) return;
      if (payload.eventType === "INSERT") {
        // Only refetch a thread somebody has open; the author's own insert is already in the cache.
        if (row.author_id !== userId && qc.getQueryState([COMMUNITY_KEY, "comments", row.post_id])) {
          void qc.invalidateQueries({ queryKey: [COMMUNITY_KEY, "comments", row.post_id] });
        }
        return;
      }
      if (row.status && row.status !== "published") {
        mapComments(qc, row.post_id, (list) => list.filter((c) => c.id !== row.id));
        return;
      }
      const patch: Partial<CommunityComment> = {};
      if (typeof row.like_count === "number") patch.like_count = row.like_count;
      if (typeof row.body === "string") patch.body = row.body;
      mapComments(qc, row.post_id, (list) => patchComment(list, row.id as string, patch));
    };

    const channel = supabase
      .channel(`community-${userId}-${instance}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, onPostChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, onCommentChange)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setState("live");
          if (wasLive.current) void qc.invalidateQueries({ queryKey: [COMMUNITY_KEY] });
          wasLive.current = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setState("reconnecting");
        }
      });
    return () => {
      wasLive.current = false;
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, instance, qc]);

  const showNew = useCallback(() => {
    setNewPosts(0);
    void qc.invalidateQueries({ queryKey: [COMMUNITY_KEY, "feed"] });
  }, [qc]);

  return { state, newPosts, showNew };
};
