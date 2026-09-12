import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bookmark, Clock, ExternalLink, Eye, Heart, Loader2, MapPin, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useNewsArticle } from "@/hooks/use-news-articles";
import { DAILY_SKINNY_FREE_WEEKLY } from "@/data/plans";
import RelatedKnowledgeHub from "@/components/RelatedKnowledgeHub";
import BriefingBody from "@/components/briefings/BriefingBody";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLikedBriefingIds, recordBriefingView, toggleLikedBriefing } from "@/lib/briefing-engagement";

interface InlineImage {
  url: string;
  alt?: string;
  credit_name?: string;
  credit_url?: string;
  after_paragraph?: number;
}

const PEXELS_FALLBACK_COVER = "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=1600";

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
    setViews(recordBriefingView(article.id, article.view_count));
  }, [article?.id, article?.view_count]);

  useEffect(() => {
    if (!article?.id) return;
    setLiked(getLikedBriefingIds().includes(article.id));
  }, [article?.id]);

  useEffect(() => {
    if (!article?.id || !user) {
      setSaved(false);
      return;
    }
    let active = true;
    void supabase
      .from("news_article_engagement")
      .select("kind")
      .eq("user_id", user.id)
      .eq("article_id", article.id)
      .eq("kind", "save")
      .then(({ data }) => {
        if (active) setSaved((data ?? []).length > 0);
      });
    return () => {
      active = false;
    };
  }, [article?.id, user]);

  const toggleEngagement = async (kind: "like" | "save") => {
    if (!article) {
      return;
    }
    if (kind === "like") {
      const wasLiked = getLikedBriefingIds().includes(article.id);
      const isLiked = toggleLikedBriefing(article.id).includes(article.id);
      setLiked(isLiked);
      toast.success(wasLiked ? "Like removed" : "Briefing liked");
      return;
    }
    }
    if (!user) {
      toast.message("Sign in to save briefings.");
      return;
    }
    const active = saved;
    setSaved(!active);
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

  const shareBriefing = async () => {
    if (!article) return;
    const shareData = { title: article.title, text: article.excerpt, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Briefing link copied");
    } catch {
      toast.error("Could not copy the briefing link");
    }
  };

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
            </div>

            {article.cover_image_url && (
              <figure className="mt-8">
                <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} onError={(event) => { if (event.currentTarget.src !== PEXELS_FALLBACK_COVER) event.currentTarget.src = PEXELS_FALLBACK_COVER; }} className="w-full rounded-3xl object-cover" />
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
                <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-foreground">Key takeaways</h2>
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

            <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center">
              <Button variant="outline" size="sm" onClick={() => toggleEngagement("like")}>
                <Heart className={cn("mr-2 h-4 w-4", liked && "fill-primary text-primary")} /> Like
              </Button>
              <Button variant="outline" size="sm" onClick={() => void shareBriefing()}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleEngagement("save")}>
                <Bookmark className={cn("mr-2 h-4 w-4", saved && "fill-primary text-primary")} /> Save
              </Button>
              {article.source_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="max-w-full min-w-0 h-auto whitespace-normal py-2"
                >
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex max-w-full min-w-0 items-start gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1 break-words">
                      Read the original on {article.source_name}
                    </span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                  </a>
                </Button>
              )}
            </div>

          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsroomArticle;
