import ContextualEmptyState from "@/components/dashboard/ContextualEmptyState";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Heart, Loader2, MapPin, ArrowUpRight, Mic, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { podcastEpisodes } from "@/data/podcast";
import { productReviews } from "@/data/reviews";
import { getSpotlightBrand } from "@/data/spotlight";
import { useGeneratedReviews } from "@/hooks/use-generated-reviews";
import { useEngagementStore } from "@/stores/engagementStore";
import { loadLikedEpisodeSlugs, reconcileBriefingLikes } from "@/lib/savedContent";

interface SavedBriefing {
  id: string;
  article_id: string;
  kind: string;
  created_at: string;
  news_articles: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    sa_context_tag: string;
    publish_date: string;
    cover_image_url: string | null;
    reading_time: string;
  } | null;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

const SavedContentTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SavedBriefing[]>([]);
  const [subTab, setSubTab] = useState<"saved" | "liked">("saved");
  const [likedEpisodes, setLikedEpisodes] = useState<string[]>([]);
  // Reviews and Spotlight brands are liked on this device only (no account table), and are listed as such.
  const localLikes = useEngagementStore((st) => st.likedIds);
  const { data: generatedReviews = [] } = useGeneratedReviews();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // A briefing liked before signing in (device only) is pushed to the account first, so it shows up below.
    await reconcileBriefingLikes(user.id);
    setLikedEpisodes(await loadLikedEpisodeSlugs(user.id));
    const { data, error } = await supabase
      .from("news_article_engagement")
      .select(
        "id, article_id, kind, created_at, news_articles ( id, slug, title, excerpt, sa_context_tag, publish_date, cover_image_url, reading_time )",
      )
      .eq("user_id", user.id)
      .in("kind", ["save", "like"])
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Could not load saved content.");
      setItems([]);
    } else {
      setItems((data as SavedBriefing[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const episodes = useMemo(
    () => likedEpisodes.map((slug) => podcastEpisodes.find((e) => e.slug === slug)).filter((e): e is NonNullable<typeof e> => Boolean(e && !e.comingSoon)),
    [likedEpisodes],
  );
  const likedReviews = useMemo(() => {
    const all = [...productReviews, ...generatedReviews];
    return localLikes.filter((id) => !id.startsWith("spotlight:")).map((id) => all.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [localLikes, generatedReviews]);
  const likedBrands = useMemo(
    () => localLikes.filter((id) => id.startsWith("spotlight:")).map((id) => getSpotlightBrand(id.slice("spotlight:".length))).filter((b): b is NonNullable<typeof b> => Boolean(b)),
    [localLikes],
  );
  const likedExtras = episodes.length + likedReviews.length + likedBrands.length;

  const filtered = items.filter((i) => (subTab === "saved" ? i.kind === "save" : i.kind === "like"));

  const removeEngagement = async (row: SavedBriefing) => {
    if (!user) return;
    setItems((prev) => prev.filter((i) => i.id !== row.id));
    const { error } = await supabase
      .from("news_article_engagement")
      .delete()
      .eq("id", row.id)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Could not update.");
      void load();
      return;
    }
    toast.success(row.kind === "save" ? "Removed from saved" : "Like removed");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Saved content
          </CardTitle>
          <CardDescription>
            Briefings you&apos;ve saved, and briefings, podcast episodes, reviews and Spotlight brands you&apos;ve liked. Saved briefings, liked briefings and liked episodes sync to your account; reviews and brands are kept on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "saved" | "liked")}>
            <TabsList className="mb-4">
              <TabsTrigger value="saved" className="gap-1.5">
                <Bookmark className="h-3.5 w-3.5" />
                Saved ({items.filter((i) => i.kind === "save").length})
              </TabsTrigger>
              <TabsTrigger value="liked" className="gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Liked ({items.filter((i) => i.kind === "like").length + likedExtras})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={subTab} className="mt-0">
              {subTab === "liked" && likedExtras > 0 && (
                <div className="mb-6 space-y-5">
                  {episodes.length > 0 && (
                    <section aria-label="Liked podcast episodes">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Mic className="h-3.5 w-3.5" /> Podcast episodes</h3>
                      <ul className="space-y-2">
                        {episodes.map((e) => (
                          <li key={e.slug}>
                            <Link to={`/podcast/${e.slug}`} className="card-interactive flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                              <img src={e.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                              <span className="min-w-0 truncate text-sm font-medium">{e.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {likedReviews.length > 0 && (
                    <section aria-label="Liked reviews">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Star className="h-3.5 w-3.5" /> Reviews · on this device</h3>
                      <ul className="space-y-2">
                        {likedReviews.map((r) => (
                          <li key={r.id}>
                            <Link to={`/reviews/${r.id}`} className="card-interactive flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                              <span className="min-w-0 truncate text-sm font-medium">{r.brand} {r.product_name}</span>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {likedBrands.length > 0 && (
                    <section aria-label="Liked Spotlight brands">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Trophy className="h-3.5 w-3.5" /> Spotlight brands · on this device</h3>
                      <ul className="space-y-2">
                        {likedBrands.map((b) => (
                          <li key={b.slug}>
                            <Link to={`/spotlight/${b.slug}`} className="card-interactive flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                              <span className="min-w-0 truncate text-sm font-medium">{b.brand}</span>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {filtered.length > 0 && <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Heart className="h-3.5 w-3.5" /> Briefings</h3>}
                </div>
              )}
              {filtered.length === 0 ? (
                subTab === "saved" ? (
                  <ContextualEmptyState kind="saved_content" />
                ) : likedExtras === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nothing liked yet. Tap the heart on a briefing, podcast episode, review or Spotlight brand and it will be kept here.
                  </p>
                ) : null
              ) : (
                <ul className="space-y-4">
                  {filtered.map((row) => {
                    const article = row.news_articles;
                    if (!article) return null;
                    return (
                      <li
                        key={row.id}
                        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start"
                      >
                        {article.cover_image_url && (
                          <Link to={`/briefings/${article.slug}`} className="shrink-0">
                            <img
                              src={article.cover_image_url}
                              alt=""
                              className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-28"
                              loading="lazy"
                            />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {article.sa_context_tag}
                            </span>
                            <time dateTime={article.publish_date}>{formatDate(article.publish_date)}</time>
                            <span>{article.reading_time}</span>
                          </div>
                          <h3 className="font-heading text-base font-bold leading-snug text-foreground">
                            <Link to={`/briefings/${article.slug}`} className="hover:underline">
                              {article.title}
                            </Link>
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/briefings/${article.slug}`} className="gap-1">
                                Read <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void removeEngagement(row)}
                              className={cn("gap-1")}
                            >
                              {row.kind === "save" ? (
                                <>
                                  <Bookmark className="h-3.5 w-3.5 fill-primary text-primary" /> Unsave
                                </>
                              ) : (
                                <>
                                  <Heart className="h-3.5 w-3.5 fill-primary text-primary" /> Unlike
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedContentTab;
