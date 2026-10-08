import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ArrowUp, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/community/PostCard";
import ThreadSheet from "@/components/community/ThreadSheet";
import ComposeSheet from "@/components/community/ComposeSheet";
import ReportDialog, { type ReportTarget } from "@/components/community/ReportDialog";
import ConfirmDialog from "@/components/community/ConfirmDialog";
import { ConnectionBanner, FeedEmpty, FeedError, FeedSkeleton } from "@/components/community/ForumStates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRequireHandle } from "@/hooks/use-require-handle";
import {
  COMMUNITY_KEY,
  useCommunityCategories,
  useCommunityFeed,
  useCommunityPost,
  useCommunityRealtime,
  useContentActions,
  usePostLike,
} from "@/hooks/use-community";
import { fetchIsStaff, recordShare } from "@/lib/community/client";
import { FORUM_PATH, parsePostParam, postPath, writeErrorMessage, type CommunityComment, type CommunityPost } from "@/lib/community/rules";
import { shareContent } from "@/lib/pwa/share";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { cn } from "@/lib/utils";

type Confirm = { kind: "delete" | "remove"; post: CommunityPost } | null;

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80 hover:border-foreground/30",
    )}
  >
    {children}
  </button>
);

/**
 * /community-forum — members-only SkinLabs® Community. Discussions, comments, likes, sharing and reports are Supabase-backed
 * (see 20261008100000_community_forum_schema.sql); ONE realtime channel keeps the feed live; engagement notifies the author
 * through the existing notification engine (inbox + web push). Page state lives in the URL: `?post=<id>` is the open
 * discussion, which is also what notification taps and shared links open.
 */
const CommunityForum = () => {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [authOpen, setAuthOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const signedIn = Boolean(user);
  const openPostId = parsePostParam(`?${params.toString()}`);
  const { ensure: ensureHandle, dialog: handleDialog } = useRequireHandle(user?.id);
  const categories = useCommunityCategories();
  const feed = useCommunityFeed(category, signedIn);
  const thread = useCommunityPost(openPostId, signedIn);
  const realtime = useCommunityRealtime(signedIn);
  const like = usePostLike();
  const content = useContentActions();
  const staff = useQuery({ queryKey: [COMMUNITY_KEY, "staff", user?.id], queryFn: () => fetchIsStaff(user!.id), enabled: signedIn, staleTime: 10 * 60_000 });
  const isStaff = staff.data === true;
  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);

  // Signed-out visitors get the normal sign-in dialog in place, and come back to this exact discussion afterwards.
  useEffect(() => {
    if (!authLoading && !user) setAuthOpen(true);
  }, [authLoading, user]);

  // Infinite scroll: fetch the next page shortly before the sentinel scrolls into view.
  const sentinel = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && !isFetchingNextPage && void fetchNextPage(), { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  // Opening a discussion from a notification marks that notification read (best effort).
  useEffect(() => {
    if (!user || !openPostId) return;
    void supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null)
      .like("link", `${postPath(openPostId)}%`)
      .then(() => window.dispatchEvent(new Event("skinlabs:notifications-changed")));
  }, [user, openPostId]);

  const openThread = useCallback(
    (post: CommunityPost) => {
      qc.setQueryData([COMMUNITY_KEY, "post", post.id], post);
      setParams({ post: post.id }, { replace: false });
    },
    [qc, setParams],
  );
  const closeThread = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const guarded = useCallback(async (fn: () => Promise<void>, failure: string, success?: string) => {
    try {
      await fn();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(writeErrorMessage(error as Error, failure));
    }
  }, []);

  const onShare = useCallback((post: CommunityPost) => {
    const url = `${getSiteOrigin()}${postPath(post.id)}`;
    void shareContent({ title: post.title, text: "Join the conversation in the SkinLabs® Community", url }).then((result) => {
      if (result === "shared" || result === "copied") recordShare(post.id);
    });
  }, []);

  const actions = {
    onLike: like,
    onShare,
    onReport: (post: CommunityPost) => setReport({ kind: "post", id: post.id }),
    onDelete: (post: CommunityPost) => setConfirm({ kind: "delete", post }),
    onRemove: (post: CommunityPost) => setConfirm({ kind: "remove", post }),
    onPin: (post: CommunityPost) => void guarded(() => content.setPinned(post.id, !post.pinned), "Couldn't change the pin.", post.pinned ? "Unpinned" : "Pinned to the top"),
  };

  const runConfirm = () => {
    if (!confirm) return;
    const { kind, post } = confirm;
    setConfirm(null);
    void guarded(
      async () => {
        if (kind === "delete") await content.deletePost(post.id);
        else await content.removePost(post.id);
        if (openPostId === post.id) closeThread();
      },
      "That didn't work. Try again.",
      kind === "delete" ? "Your post was deleted" : "Post removed",
    );
  };

  const showNew = () => {
    realtime.showNew();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPublished = (id: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Move focus to the new discussion once it has rendered.
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-post-id="${id}"] button`)?.focus({ preventScroll: true }), 350);
  };

  const feedBody = () => {
    if (feed.isLoading) return <FeedSkeleton />;
    if (feed.isError) return <FeedError onAction={() => void feed.refetch()} />;
    if (posts.length === 0) return <FeedEmpty filtered={Boolean(category)} onAction={() => setComposeOpen(true)} />;
    return (
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} data-post-id={post.id}>
            <PostCard post={post} isStaff={isStaff} onOpen={openThread} {...actions} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <SEO
        title="SkinLabs® Community"
        description="Members-only skincare conversations for South African skin, sun, seasons and budgets."
        canonical={`https://skinlabs.co.za${FORUM_PATH}`}
        noindex
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-32 pt-20 md:pt-24">
          <div className="container mx-auto max-w-2xl px-4">
            <section className="pb-6 pt-6 md:pt-10">
              <p className="eyebrow">Community</p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">Skin talk, South African style.</h1>
              <p className="mt-3 max-w-xl text-base text-muted-foreground [text-wrap:pretty]">
                Real routines, honest product questions and what's actually working in Highveld winters and coastal summers. Share experience, not diagnoses: for anything persistent, see a doctor.{" "}
                <a href="/community-guidelines" className="underline underline-offset-2 hover:text-foreground">
                  Community guidelines
                </a>
              </p>
            </section>

            {authLoading ? (
              <FeedSkeleton />
            ) : !user ? (
              <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center">
                <h2 className="font-heading text-lg font-semibold">Sign in to join the conversation</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">The community is for SkinLabs® members. It's free to join.</p>
                <Button className="mt-5" onClick={() => setAuthOpen(true)}>
                  Sign in or create an account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setComposeOpen(true)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-3xl border border-border bg-card px-5 py-3 text-left text-muted-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PenLine className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Start a discussion…</span>
                  <span className="gradient-bg shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold">New</span>
                </button>

                <nav aria-label="Topics" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Chip active={category === null} onClick={() => setCategory(null)}>
                    All
                  </Chip>
                  {(categories.data ?? []).map((c) => (
                    <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                      {c.name}
                    </Chip>
                  ))}
                </nav>

                <ConnectionBanner state={realtime.state} />

                {realtime.newPosts > 0 && (
                  <div className="sticky top-24 z-20 flex justify-center">
                    <Button onClick={showNew} className="gradient-bg h-10 rounded-full border-0 px-4 shadow-lg hover:opacity-90">
                      <ArrowUp className="mr-1.5 size-4" aria-hidden="true" />
                      {realtime.newPosts} new {realtime.newPosts === 1 ? "discussion" : "discussions"}
                    </Button>
                  </div>
                )}

                {feedBody()}

                <div ref={sentinel} aria-hidden="true" />
                {feed.isFetchingNextPage && (
                  <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground" role="status">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading more
                  </p>
                )}
                {feed.hasNextPage && !feed.isFetchingNextPage && (
                  <Button variant="outline" className="w-full" onClick={() => void feed.fetchNextPage()}>
                    Show more discussions
                  </Button>
                )}
                {!feed.hasNextPage && posts.length > 0 && <p className="py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {user && (
        <>
          <ThreadSheet
            postId={openPostId}
            post={thread.data}
            loading={thread.isLoading}
            isStaff={isStaff}
            onClose={closeThread}
            ensureHandle={ensureHandle}
            onReportComment={(c: CommunityComment) => setReport({ kind: "comment", id: c.id })}
            {...actions}
          />
          <ComposeSheet
            open={composeOpen}
            onOpenChange={setComposeOpen}
            categories={categories.data ?? []}
            defaultCategory={category}
            ensureHandle={ensureHandle}
            onPublished={onPublished}
          />
          <ReportDialog userId={user.id} target={report} onClose={() => setReport(null)} />
        </>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === "delete" ? "Delete your post?" : "Remove this post?"}
        description={
          confirm?.kind === "delete"
            ? "Your discussion and its comments will no longer be visible to the community."
            : "It will be hidden from the community and any open reports on it will be closed. This is logged."
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Remove"}
        onConfirm={runConfirm}
      />
      {handleDialog}
      <AuthDialog open={authOpen && !user} onOpenChange={setAuthOpen} returnTo={`${FORUM_PATH}${params.toString() ? `?${params.toString()}` : ""}`} />
    </>
  );
};

export default CommunityForum;
