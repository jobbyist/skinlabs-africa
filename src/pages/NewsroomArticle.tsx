import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Bookmark, Clock, ExternalLink, Eye, Heart, Loader2, MapPin, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useNewsArticle } from "@/hooks/use-news-articles";
import { DAILY_SKINNY_FREE_WEEKLY } from "@/data/plans";
import { newsroomComments } from "@/data/articleComments";
import RelatedKnowledgeHub from "@/components/RelatedKnowledgeHub";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InlineImage {
  url: string;
  alt?: string;
  credit_name?: string;
  credit_url?: string;
  after_paragraph?: number;
}

interface Comment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const NewsroomArticle = () => {
  const { slug } = useParams();
  const { article, loading } = useNewsArticle(slug);
  const { user } = useAuth();
  const { isMember, loading: membershipLoading } = useMembership();

  const [body, setBody] = useState<string | null>(null);
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);

  // Register a view once per article per session
  useEffect(() => {
    if (!article) return;
    const key = `viewed:${article.id}`;
    if (sessionStorage.getItem(key)) {
      setViews(article.view_count);
      return;
    }
    sessionStorage.setItem(key, "1");
    void (async () => {
      const { data } = await supabase.rpc("register_article_view", { p_article_id: article.id });
      setViews(typeof data === "number" ? data : article.view_count + 1);
    })();
  }, [article]);

  // Body: fully public for is_premium=false articles, member-gated (with a free
  // weekly allowance) for everything else. The RPC itself decides what to return —
  // we always attempt the call so public articles render for signed-out visitors too.
  useEffect(() => {
    if (!article || !slug || membershipLoading) return;
    setBodyLoading(true);
    void (async () => {
      const { data, error } = await supabase.rpc("get_article_body", { p_slug: slug });
      if (error) {
        console.error("get_article_body failed:", error);
        toast.error("Couldn't load this briefing — please try again.");
        setBody(null);
        setInlineImages([]);
        setBodyLoading(false);
        return;
      }
      const row = (Array.isArray(data) ? data[0] : null) as
        | { body_markdown?: string; inline_images?: unknown }
        | null;
      setBody(row?.body_markdown ?? null);
      const imgs = row?.inline_images;
      setInlineImages(Array.isArray(imgs) ? (imgs as InlineImage[]) : []);
      setBodyLoading(false);
    })();
  }, [article, slug, isMember, membershipLoading]);

  // Engagement + comments
  useEffect(() => {
    if (!article) return;
    void (async () => {
      const [engagementRes, commentRes] = await Promise.all([
        user
          ? supabase
              .from("news_article_engagement")
              .select("kind")
              .eq("article_id", article.id)
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] as { kind: string }[] }),
        supabase
          .from("news_comments")
          .select("id, author_name, body, created_at")
          .eq("article_id", article.id)
          .order("created_at", { ascending: false }),
      ]);
      const kinds = (engagementRes.data ?? []).map((r: { kind: string }) => r.kind);
      setLiked(kinds.includes("like"));
      setSaved(kinds.includes("save"));
      setComments((commentRes.data as Comment[]) ?? []);
    })();
  }, [article, user]);

  const toggleEngagement = async (kind: "like" | "save") => {
    if (!article) return;
    if (!user) {
      toast.message("Sign in to like and save briefings.");
      return;
    }
    const active = kind === "like" ? liked : saved;
    (kind === "like" ? setLiked : setSaved)(!active);
    if (active) {
      await supabase
        .from("news_article_engagement")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", article.id)
        .eq("kind", kind);
    } else {
      await supabase
        .from("news_article_engagement")
        .insert({ user_id: user.id, article_id: article.id, kind });
    }
  };

  const postComment = async () => {
    if (!article || !user) {
      toast.message("Sign in to join the conversation.");
      return;
    }
    const text = commentBody.trim();
    if (text.length < 2) return;
    setPosting(true);
    const authorName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Member";
    const { data, error } = await supabase
      .from("news_comments")
      .insert({ article_id: article.id, user_id: user.id, author_name: authorName, body: text.slice(0, 2000) })
      .select("id, author_name, body, created_at")
      .maybeSingle();
    setPosting(false);
    if (error) {
      toast.error("Could not post your comment. Please try again.");
      return;
    }
    if (data) setComments((prev) => [data as Comment, ...prev]);
    setCommentBody("");
  };

  const jsonLd = useMemo(() => article?.json_ld ?? null, [article]);

  // Falls back to editorial seed comments only when this briefing has no
  // live member comments yet — same pattern as product reviews.
  const displayComments = useMemo(() => {
    if (comments.length > 0 || !article) return comments;
    const seeded = newsroomComments[article.slug] ?? [];
    return seeded.map((c, i) => ({ id: `seeded-${i}`, author_name: c.display_name, body: c.body, created_at: c.created_at }));
  }, [comments, article]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 text-center">
          <h1 className="font-heading text-3xl font-bold text-foreground">Briefing not found</h1>
          <p className="mt-3 text-muted-foreground">This story may have been unpublished.</p>
          <Button asChild className="mt-6">
            <Link to="/newsroom">Back to The Daily Skinny</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const canonical = `https://skinlabs.co.za/newsroom/${article.slug}`;

  return (
    <>
      <Helmet>
        <title>{(article.seo_title || article.title).slice(0, 60)}</title>
        <meta name="description" content={(article.seo_description || article.excerpt).slice(0, 158)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.seo_title || article.title} />
        <meta property="og:description" content={article.seo_description || article.excerpt} />
        <meta property="og:url" content={canonical} />
        {article.cover_image_url && <meta property="og:image" content={article.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <article className="container mx-auto max-w-3xl px-4 py-10">
            <Link
              to="/newsroom"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> The Daily Skinny
            </Link>

            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-foreground">
              <MapPin className="h-3 w-3" /> {article.sa_context_tag}
            </span>

            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {article.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>{new Date(article.publish_date).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {article.reading_time}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {(views ?? article.view_count).toLocaleString()} views</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {displayComments.length}</span>
            </div>

            {article.cover_image_url && (
              <figure className="mt-8">
                <img
                  src={article.cover_image_url}
                  alt={article.cover_image_alt || article.title}
                  className="w-full rounded-3xl object-cover"
                />
                {article.cover_credit_name && (
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    Photo by{" "}
                    <a href={article.cover_credit_url ?? "#"} target="_blank" rel="noreferrer noopener" className="underline">
                      {article.cover_credit_name}
                    </a>{" "}
                    on Unsplash
                  </figcaption>
                )}
              </figure>
            )}

            <p className="mt-8 text-lg leading-relaxed text-foreground">{article.excerpt}</p>

            {article.key_takeaways.length > 0 && (
              <div className="mt-8 rounded-3xl border border-border bg-card p-6">
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Key takeaways</h2>
                <ul className="space-y-2">
                  {article.key_takeaways.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <RelatedKnowledgeHub keywords={[article.sa_context_tag, ...article.key_takeaways]} />

            {/* Body: members only */}
            <div className="mt-10">
              {bodyLoading || membershipLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : body ? (
                <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-table:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                  {inlineImages.length > 0 && (
                    <div className="not-prose mt-8 grid gap-6 sm:grid-cols-2">
                      {inlineImages.map((img) => (
                        <figure key={img.url}>
                          <img src={img.url} alt={img.alt || article.title} loading="lazy" className="w-full rounded-2xl object-cover" />
                          {img.credit_name && (
                            <figcaption className="mt-2 text-xs text-muted-foreground">
                              Photo by{" "}
                              <a href={img.credit_url ?? "#"} target="_blank" rel="noreferrer noopener" className="underline">
                                {img.credit_name}
                              </a>{" "}
                              on Unsplash
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              ) : user ? (
                <div className="rounded-3xl border border-border bg-card p-8 text-center">
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {isMember ? "Check back soon for more briefings" : `You've used this week's ${DAILY_SKINNY_FREE_WEEKLY} free briefings`}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {isMember
                      ? "You've reached your weekly briefing limit. Check back in a few days for fresh intelligence."
                      : `Free accounts get ${DAILY_SKINNY_FREE_WEEKLY} full briefings every 7 days. Upgrade for unlimited daily briefings, or check back next week.`}
                  </p>
                  <Button asChild className="mt-5">
                    <Link to="/pricing">See membership plans</Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-card p-8 text-center">
                  <h2 className="font-heading text-xl font-bold text-foreground">Sign in to read this briefing</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Free accounts get {DAILY_SKINNY_FREE_WEEKLY} full briefings every week, no card required. Members get unlimited daily briefings.
                  </p>
                  <Button asChild className="mt-5">
                    <Link to="/pricing">See membership plans</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button variant="outline" size="sm" onClick={() => toggleEngagement("like")}>
                <Heart className={cn("mr-2 h-4 w-4", liked && "fill-primary text-primary")} /> Like
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleEngagement("save")}>
                <Bookmark className={cn("mr-2 h-4 w-4", saved && "fill-primary text-primary")} /> Save
              </Button>
              {article.source_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={article.source_url} target="_blank" rel="noreferrer noopener">
                    Read the original on {article.source_name}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Comments */}
            <section className="mt-12">
              <h2 className="mb-4 font-heading text-xl font-bold text-foreground">
                Comments ({displayComments.length})
              </h2>
              {user ? (
                <div className="space-y-3">
                  <Textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Share your take on this briefing…"
                    maxLength={2000}
                    rows={3}
                  />
                  <Button size="sm" onClick={postComment} disabled={posting || commentBody.trim().length < 2}>
                    {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Post comment
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
              )}

              <div className="mt-6 space-y-5">
                {displayComments.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleDateString("en-ZA")}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsroomArticle;
