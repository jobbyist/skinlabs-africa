import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ArrowUp, Flame, Loader2, PenLine, Sparkles, TrendingUp } from "lucide-react";
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
import GuidelinesDialog from "@/components/community/GuidelinesDialog";
import FaithfulToNature from "@/components/FaithfulToNature";
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
import { fetchIsStaff, getMySanction, recordShare } from "@/lib/community/client";
import { FORUM_PATH, parsePostParam, postPath, writeErrorMessage, type CommunityComment, type CommunityPost } from "@/lib/community/rules";
import { shareContent } from "@/lib/pwa/share";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { cn } from "@/lib/utils";

type Sort = "hot" | "new" | "top";
const SORTS: { key: Sort; label: string; icon: typeof Flame }[] = [
  { key: "hot", label: "Hot", icon: Flame },
  { key: "new", label: "New", icon: Sparkles },
  { key: "top", label: "Top", icon: TrendingUp },
];

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
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("hot");

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
  const sanction = useQuery({ queryKey: [COMMUNITY_KEY, "sanction", user?.id], queryFn: getMySanction, enabled: signedIn, staleTime: 60_000 });
  const suspended = sanction.data?.kind === "suspend";
  const muted = sanction.data?.kind === "mute";
  const loaded = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);
  // Sorting reorders the discussions already loaded (pinned always first); the server order is newest first.
  const posts = useMemo(() => {
    if (sort === "new") return loaded;
    const score = (p: CommunityPost) => (sort === "top" ? p.like_count : p.like_count * 2 + p.comment_count);
    const weight = (p: CommunityPost) => (p.pinned ? 1 : 0);
    return [...loaded].sort((a, b) => weight(b) - weight(a) || score(b) - score(a) || Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [loaded, sort]);

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
        if (kind === "delete") await content.deletePost(post.id, post.image_path);
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

  const onPublished = (id: string, held: boolean) => {
    if (held) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Move focus to the new discussion once it has rendered.
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-post-id="${id}"] button`)?.focus({ preventScroll: true }), 350);
  };

  const feedBody = () => {
    if (feed.isLoading) return <FeedSkeleton />;
    if (feed.isError) return <FeedError onAction={() => void feed.refetch()} />;
    if (posts.length === 0) return <FeedEmpty filtered={Boolean(category)} onAction={() => setComposeOpen(true)} />;
    return (
      <ul className="space-y-3">
        {posts.map((post, index) => (
          <Fragment key={post.id}>
            <li data-post-id={post.id}>
              <PostCard post={post} isStaff={isStaff} onOpen={openThread} {...actions} />
            </li>
            {/* A Faithful to Nature unit after every second discussion. The forum is login-gated, so no AdSense
                units run here (AdSense policy). The component applies the viewer's plan and the labelling itself. */}
            {index % 2 === 1 && (
              <li data-feed-ad={index} aria-label="Advertisement" className="empty:hidden">
                <FaithfulToNature placement={`community-feed-${index}`} />
              </li>
            )}
          </Fragment>
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
          <div className="container mx-auto max-w-5xl px-4">
            <section className="pb-5 pt-6 md:pt-8">
              <p className="eyebrow">Community</p>
              <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">Skin talk, South African style.</h1>
              <p className="mt-3 max-w-xl text-base text-muted-foreground [text-wrap:pretty]">
                Real routines, honest product questions and what's actually working in Highveld winters and coastal summers. Share experience, not diagnoses: for anything persistent, see a doctor.{" "}
                <button type="button" onClick={() => setGuidelinesOpen(true)} className="rounded underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Community guidelines
                </button>
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
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="min-w-0 space-y-3">
                {sanction.data && (
                  <div role="status" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
                    <p className="font-semibold">{suspended ? "Your Community access is suspended" : "You're muted"}</p>
                    <p className="mt-1 text-muted-foreground">
                      {suspended ? "You can't post, comment or react" : "You can read and react, but you can't post or comment"}
                      {sanction.data.expires_at ? ` until ${new Date(sanction.data.expires_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}.` : " until a moderator lifts this."}{" "}
                      See the Community guidelines, or contact support if you think this is a mistake.
                    </p>
                  </div>
                )}
                {!suspended && (
                <button
                  type="button"
                  disabled={muted}
                  onClick={() => setComposeOpen(true)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-muted-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PenLine className="size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Start a discussion…</span>
                  <span className="gradient-bg shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold">New</span>
                </button>
                )}

                <nav aria-label="Topics" className="-mx-4 flex lg:hidden gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Chip active={category === null} onClick={() => setCategory(null)}>
                    All
                  </Chip>
                  {(categories.data ?? []).map((c) => (
                    <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                      {c.name}
                    </Chip>
                  ))}
                </nav>

                <div role="tablist" aria-label="Sort discussions" className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
                  {SORTS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={sort === key}
                      onClick={() => setSort(key)}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        sort === key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" /> {label}
                    </button>
                  ))}
                </div>

                <ConnectionBanner state={realtime.state} />

                {realtime.newPosts > 0 && (
                  <div className="sticky top-24 z-20 flex justify-center">
                    <Button onClick={showNew} className="gradient-bg h-10 rounded-full border-0 px-4 shadow-lg hover:opacity-90">
                      <ArrowUp className="mr-1.5 size-4" aria-hidden="true" />
                      {realtime.newPosts} new {realtime.newPosts === 1 ? "discussion" : "discussions"}
                    </Button>
                  </div>
                )}

                {suspended ? null : feedBody()}

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

              <aside aria-label="About this community" className="hidden space-y-4 lg:sticky lg:top-28 lg:block">
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="gradient-bg h-10" aria-hidden="true" />
                  <div className="space-y-3 p-4">
                    <h2 className="font-heading text-base font-semibold">SkinLabs® Community</h2>
                    <p className="text-sm text-muted-foreground">Routines, products and honest questions for South African skin.</p>
                    {!suspended && (
                      <Button className="w-full" disabled={muted} onClick={() => setComposeOpen(true)}>
                        Create a post
                      </Button>
                    )}
                    <button type="button" onClick={() => setGuidelinesOpen(true)} className="w-full rounded text-center text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Community guidelines
                    </button>
                  </div>
                </div>
                <nav aria-label="Topics" className="rounded-2xl border border-border bg-card p-2">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topics</p>
                  {[{ slug: null as string | null, name: "All" }, ...(categories.data ?? [])].map((c) => (
                    <button
                      key={c.slug ?? "all"}
                      type="button"
                      aria-pressed={category === c.slug}
                      onClick={() => setCategory(c.slug)}
                      className={cn(
                        "block w-full truncate rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        category === c.slug ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </nav>
              </aside>
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
      <GuidelinesDialog open={guidelinesOpen} onOpenChange={setGuidelinesOpen} />
      {handleDialog}
      <AuthDialog open={authOpen && !user} onOpenChange={setAuthOpen} returnTo={`${FORUM_PATH}${params.toString() ? `?${params.toString()}` : ""}`} />
    </>
  );
};

export default CommunityForum;
