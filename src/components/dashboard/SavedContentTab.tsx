import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Heart, Loader2, MapPin, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const load = async () => {
    if (!user) return;
    setLoading(true);
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
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
            Briefings you&apos;ve saved or liked. Saves sync to your account and appear here across devices.
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
                Liked ({items.filter((i) => i.kind === "like").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={subTab} className="mt-0">
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  {subTab === "saved"
                    ? "No saved briefings yet. Tap the bookmark on any Daily Skinny card while signed in."
                    : "No liked briefings in your account yet. Likes on cards are stored locally; account likes appear when you like from the full briefing page after signing in."}
                </p>
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
