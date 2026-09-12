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
import AdSlot from "@/components/AdSlot";
import AdSlotAutorelaxed from "@/components/AdSlotAutorelaxed";
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

/** Split markdown on <!-- ad:mid-N --> and render AdSlots between segments. */
function BriefingBody({ body }: { body: string }) {
  const parts = body.split(/<!--\s*ad:mid-\d+\s*-->/i);
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-h3:font-semibold prose-p:my-4 prose-p:text-base prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-table:text-sm">
      {parts.map((segment, i) => (
        <div key={i}>
          {segment.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{segment}</ReactMarkdown>
          ) : null}
          {i < parts.length - 1 && (
            <div className="not-prose my-8">
              {i % 2 === 0 ? (
                <AdSlot placement={`briefing-mid-${i + 1}`} />
              ) : (
                <AdSlotAutorelaxed placement={`briefing-mid-${i + 1}`} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setBodyLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("get_article_body", { p_slug: slug });
      if (cancelled) return;
      if (error) {
        console.error("get_article_body failed:", error);
        setBody(null);
        setBodyLoading(false);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const typed = row as { body_markdown?: string; inline_images?: unknown } | null;
      setBody(typed?.body_markdown ?? null);
      setInlineImages(Array.isArray(typed?.inline_images) ? (typed!.inline_images as InlineImage[]) : []);
      setBodyLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!article?.id) return;
    setViews(article.view_count);
    void supabase.rpc("increment_article_views", { p_article_id: article.id }).then(({ data }) => {
      if (typeof data === "number") setViews(data);
    });
  }, [article?.id, article?.view_count]);

  useEffect(() => {
    if (!article?.id || !user) return;
    void supabase
      .from("news_article_engagement")
      .select("kind")
      .eq("user_id", user.id)
      .eq("article_id", article.id)
      .then(({ data }) => {
        setLiked((data ?? []).some((r) => r.kind === "like"));
        setSaved((data ?? []).some((r) => r.kind === "save"));
      });
    void supabase
      .from("news_article_comments")
      .select("id, author_name, body, created_at")
      .eq("article_id", article.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setComments(data ?? []));
  }, [article?.id, user]);

  const toggleEngagement = async (kind: "like" | "save") => {
    if (!user || !article) {
      toast.message("Sign in to like or save briefings.");
      return;
    }
    const active = kind === "like" ? liked : saved;
    const setter = kind === "like" ? setLiked : setSaved;
    setter(!active);
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
    if (!user || !article) return;
    const text = commentBody.trim();
    if (text.length < 2) return;
    setPosting(true);
    const authorName =
      (user.user_metadata as { username?: string; full_name?: string } | undefined)?.username ||
      (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
      user.email?.split("@")[0] ||
      "Member";
    const { data, error } = await supabase
      .from("news_article_comments")
      .insert({ article_id: article.id, user_id: user.id, author_name: authorName, body: text.slice(0, 2000) })
      .select("id, author_name, body, created_at")
      .single();
    setPosting(false);
    if (error) {
      toast.error("Could not post comment");
      return;
    }
    setComments((prev) => [data as Comment, ...prev]);
    setCommentBody("");
    toast.success("Comment posted");
  };

  const displayComments = useMemo(() => {
    if (comments.length > 0) return comments;
    if (!article) return [];
    const seeded = newsroomComments[article.slug] ?? [];
    return seeded.map((c, i) => ({
      id: `seeded-${i}`,
      author_name: c.display_name,
      body: c.body,
      created_at: c.created_at,
    }));
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
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-heading text-2xl font-bold">Briefing not found</h1>
          <Button asChild className="mt-6">
            <Link to="/briefings">Back to The Daily Skinny</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const socialImage = article.cover_image_url
    ? article.cover_image_url.startsWith("http")
      ? article.cover_image_url
      : `https://skinlabs.co.za${article.cover_image_url.startsWith("/") ? "" : "/"}${article.cover_image_url}`
    : undefined;

  return (
    <>
      <Helmet>
        <title>{article.seo_title || `${article.title} | SkinLabs®`}</title>
        <meta name="description" content={article.seo_description || article.excerpt} />
        <link rel="canonical" href={`https://skinlabs.co.za/briefings/${article.slug}`} />
        {socialImage && <meta property="og:image" content={socialImage} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <article className="container mx-auto max-w-3xl px-4">
            <Link to="/briefings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to The Daily Skinny
            </Link>

            <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
              <MapPin className="h-3 w-3" /> {article.sa_context_tag}
            </div>

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
                <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} className="w-full rounded-3xl object-cover" />
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

            <div className="mt-10">
              {bodyLoading || membershipLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : body ? (
                <>
                  <BriefingBody body={body} />
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
                </>
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
