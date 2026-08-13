import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Heart, Loader2, Pause, Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GatedOverlay from "@/components/GatedOverlay";
import { useAudio } from "@/context/AudioContext";
import { podcastEpisodes } from "@/data/podcast";
import { useMembership } from "@/hooks/use-membership";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentRow {
  id: string;
  user_id: string;
  display_name: string | null;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
}

const EpisodePage = () => {
  const { slug } = useParams();
  const { current, isPlaying, playEpisode, toggle } = useAudio();
  const { isMember } = useMembership();
  const { user } = useAuth();
  const episode = podcastEpisodes.find((item) => item.slug === slug);

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!episode) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: likeRows, error: likesError }, { data: commentRows, error: commentsError }] = await Promise.all([
          supabase.from("podcast_likes").select("user_id").eq("episode_slug", episode.slug),
          supabase
            .from("podcast_comments")
            .select("id, user_id, display_name, body, created_at, parent_comment_id")
            .eq("episode_slug", episode.slug)
            .order("created_at", { ascending: true })
            .limit(200),
        ]);
        if (likesError) console.error("Failed to load likes:", likesError);
        if (commentsError) console.error("Failed to load comments:", commentsError);
        if (!active) return;
        const rows = likeRows ?? [];
        setLikeCount(rows.length);
        setLiked(Boolean(user && rows.some((r) => r.user_id === user.id)));
        setComments(commentRows ?? []);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [episode, user?.id]);

  if (!episode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Episode not found</h1>
          <Button asChild className="mt-6">
            <Link to="/podcast">Back to the podcast hub</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isCurrent = current?.id === episode.id;

  const toggleLike = async () => {
    if (!user) {
      toast.error("Sign in to like this episode.");
      return;
    }
    if (likePending) return;

    setLikePending(true);
    const wasLiked = liked;
    try {
      if (liked) {
        const { error } = await supabase.from("podcast_likes").delete().eq("user_id", user.id).eq("episode_slug", episode.slug);
        if (error) {
          toast.error("Could not remove your like.");
          return;
        }
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await supabase.from("podcast_likes").insert({ user_id: user.id, episode_slug: episode.slug });
        if (error) {
          toast.error("Could not save your like.");
          return;
        }
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error("toggleLike error:", err);
      toast.error("Something went wrong.");
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : Math.max(0, c - 1));
    } finally {
      setLikePending(false);
    }
  };

  const postComment = async (text: string, parentCommentId: string | null) => {
    if (!text.trim()) return;
    if (!user) {
      toast.error("Sign in to join the discussion.");
      return;
    }
    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("podcast_comments")
        .insert({
          user_id: user.id,
          episode_slug: episode.slug,
          parent_comment_id: parentCommentId,
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Member",
          body: text.trim(),
        })
        .select("id, user_id, display_name, body, created_at, parent_comment_id")
        .single();
      if (error || !data) {
        toast.error("Could not post your comment.");
        return;
      }
      setComments((prev) => [...prev, data]);
      if (parentCommentId) {
        setReplyBody("");
        setReplyingTo(null);
      } else {
        setBody("");
      }
      toast.success("Comment posted");
    } finally {
      setPosting(false);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const repliesFor = (commentId: string) => comments.filter((c) => c.parent_comment_id === commentId);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${episode.title} — The Skin Deep Podcast | SkinLabs`}</title>
        <meta name="description" content={episode.description} />
        <link rel="canonical" href={`https://skinlabs.co.za/podcast/${episode.slug}`} />
        <meta property="og:title" content={`${episode.title} — The Skin Deep Podcast`} />
        <meta property="og:description" content={episode.description} />
        <meta property="og:url" content={`https://skinlabs.co.za/podcast/${episode.slug}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PodcastEpisode",
          name: episode.title,
          description: episode.description,
          datePublished: episode.publishedAt,
          url: `https://skinlabs.co.za/podcast/${episode.slug}`,
          partOfSeries: { "@type": "PodcastSeries", name: "The Skin Deep Podcast" },
          associatedMedia: { "@type": "MediaObject", contentUrl: `https://skinlabs.co.za${episode.audioFile}` },
        })}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-28">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[320px_1fr]">
          <div>
            <div className="flex w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted">
              <img
                src={episode.image}
                alt={`${episode.title} cover art`}
                className="w-full object-contain"
              />
            </div>
            <Button className="mt-4 w-full gap-2" onClick={() => (isCurrent ? toggle() : playEpisode(episode))}>
              {isCurrent && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isCurrent && isPlaying ? "Pause episode" : "Play episode"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {episode.duration} · Published {episode.publishedAt}
            </p>
            <button
              type="button"
              onClick={toggleLike}
              disabled={likePending}
              className="mx-auto mt-3 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {episode.topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {topic}
                  </span>
                ))}
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{episode.title}</h1>
              <p className="mt-3 text-muted-foreground">{episode.description}</p>
            </div>

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Show notes</h2>
              <ul className="space-y-2">
                {episode.showNotes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm text-foreground">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {note}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Chapters</h2>
              <div className="divide-y divide-border rounded-2xl border border-border">
                {episode.timestamps.map((stamp) => (
                  <button
                    key={stamp.time}
                    onClick={() => playEpisode(episode, stamp.seconds)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-mono text-xs text-primary">{stamp.time}</span>
                    <span className="text-foreground">{stamp.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {episode.productsMentioned.length > 0 && (
              <section>
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Products mentioned</h2>
                <div className="flex flex-wrap gap-2">
                  {episode.productsMentioned.map((product) => (
                    <Link
                      key={product.name}
                      to="/reviews"
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      {product.brand} — {product.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Transcript</h2>
              <GatedOverlay
                locked={!isMember}
                title="Transcripts are member-only"
                message="Glow Insider members get full transcripts and searchable show notes for every episode."
              >
                <div className="space-y-3">
                  {episode.transcript.map((line, index) => (
                    <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </GatedOverlay>
            </section>

            <section className="border-t border-border pt-8">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Discussion</h2>
              <div className="space-y-3">
                <Textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={user ? "What did you think of this episode?" : "Sign in to join the discussion"}
                  aria-label="Write a comment"
                  maxLength={2000}
                  rows={3}
                />
                <Button size="sm" onClick={() => postComment(body, null)} disabled={posting || !body.trim()}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post comment"}
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading discussion…</p>
                ) : topLevelComments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No comments yet — be the first.</p>
                ) : (
                  topLevelComments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-border bg-card p-3">
                      <p className="text-xs font-semibold text-foreground">{comment.display_name || "Member"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString("en-ZA")}
                        </p>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-[10px] font-semibold uppercase tracking-wide text-primary hover:underline"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Nested replies */}
                      {repliesFor(comment.id).length > 0 && (
                        <ul className="mt-3 space-y-3 border-l border-border pl-4">
                          {repliesFor(comment.id).map((reply) => (
                            <li key={reply.id}>
                              <p className="text-xs font-semibold text-foreground">{reply.display_name || "Member"}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{reply.body}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString("en-ZA")}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}

                      {replyingTo === comment.id && (
                        <div className="mt-3 space-y-2 border-l border-border pl-4">
                          <Textarea
                            value={replyBody}
                            onChange={(event) => setReplyBody(event.target.value)}
                            placeholder="Write a reply…"
                            aria-label="Write a reply"
                            maxLength={2000}
                            rows={2}
                          />
                          <Button size="sm" variant="outline" onClick={() => postComment(replyBody, comment.id)} disabled={posting || !replyBody.trim()}>
                            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post reply"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EpisodePage;
