import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  key_takeaways: string[];
  sa_context_tag: string;
  source_name: string;
  source_url: string;
  publish_date: string;
  reading_time: string;
  word_count: number;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_credit_name: string | null;
  cover_credit_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  json_ld: Record<string, unknown> | null;
  view_count: number;
}

const SELECT_COLUMNS =
  "id, slug, title, excerpt, key_takeaways, sa_context_tag, source_name, source_url, publish_date, reading_time, word_count, cover_image_url, cover_image_alt, cover_credit_name, cover_credit_url, seo_title, seo_description, json_ld, view_count";

/** Live Daily Skinny briefings. Bodies are never fetched here — they are member gated server side. */
export const useNewsArticles = (limit?: number) => {
  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let query = (supabase as any)
        .from("news_articles_public")
        .select(SELECT_COLUMNS)
        .order("publish_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data } = await query;
      if (!active) return;
      setArticles((data as NewsArticleSummary[]) ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [limit]);

  return { articles, loading };
};

export const useNewsArticle = (slug?: string) => {
  const [article, setArticle] = useState<NewsArticleSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) return;
      const { data } = await (supabase as any)
        .from("news_articles_public")
        .select(SELECT_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setArticle((data as NewsArticleSummary) ?? null);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return { article, loading };
};
