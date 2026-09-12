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

export interface NewsArticlesPage {
  page: number;
  pageSize: number;
  /** Filter by SA context tag across the full published catalogue (server-side). */
  region?: string | null;
}

const isPaginatedOptions = (value: unknown): value is NewsArticlesPage =>
  typeof value === "object" && value !== null && "page" in value && "pageSize" in value;

/**
 * Live Daily Skinny briefings. Bodies are never fetched here — they are member gated server side.
 * Pass a number for a simple top-N fetch, or `{ page, pageSize, region? }` for paginated listing.
 */
export const useNewsArticles = (limitOrPage?: number | NewsArticlesPage) => {
  const [articles, setArticles] = useState<NewsArticleSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const paginated = isPaginatedOptions(limitOrPage);
  const limit = typeof limitOrPage === "number" ? limitOrPage : undefined;
  const page = paginated ? limitOrPage.page : 1;
  const pageSize = paginated ? limitOrPage.pageSize : 0;
  const region =
    paginated && limitOrPage.region && limitOrPage.region !== "all"
      ? limitOrPage.region
      : null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("news_articles_public")
        .select(SELECT_COLUMNS, paginated ? { count: "exact" } : undefined)
        .order("publish_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (region) {
        query = query.eq("sa_context_tag", region);
      }

      if (paginated) {
        const from = (page - 1) * pageSize;
        query = query.range(from, from + pageSize - 1);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data, count } = await query;
      if (!active) return;
      setArticles((data as unknown as NewsArticleSummary[]) ?? []);
      if (paginated) setTotalCount(count ?? 0);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [limit, paginated, page, pageSize, region]);

  return { articles, loading, totalCount };
};

/** Distinct SA context tags from all published briefings (for global filter dropdown). */
export const useSaContextTags = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("news_articles_public")
        .select("sa_context_tag")
        .not("sa_context_tag", "is", null)
        .order("sa_context_tag", { ascending: true });
      if (!active) return;
      const unique = Array.from(
        new Set(
          ((data as { sa_context_tag: string | null }[] | null) ?? [])
            .map((r) => r.sa_context_tag)
            .filter((t): t is string => Boolean(t && t.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b));
      setTags(unique);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return { tags, loading };
};

export const useNewsArticle = (slug?: string) => {
  const [article, setArticle] = useState<NewsArticleSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("news_articles_public")
        .select(SELECT_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setArticle((data as unknown as NewsArticleSummary) ?? null);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return { article, loading };
};
