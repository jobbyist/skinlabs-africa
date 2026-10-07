import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { pageSeo, SITE_URL, articleTitle, BRAND, AUTHOR_NAME, AUTHOR_URL } from "@/lib/seo-config";

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const absolute = (value: string | undefined) => value ? (value.startsWith("http") ? value : `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`) : undefined;

/**
 * Fallback head tags for pages that don't set their own: the static page table (seo-config `pageSeo`) and live briefing
 * articles. Review, Shelf Showdown, podcast, Spotlight and season pages each render their own <SEO> (which wins over
 * this one), so this component deliberately carries no content catalogue and runs no per-page image queries.
 */
const SitewideSEO = () => {
  const { pathname } = useLocation();
  const [article, setArticle] = useState<null | { title: string; excerpt: string; slug: string; cover_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; publish_date?: string | null }>(null);
  const articleSlug = pathname.startsWith("/briefings/") ? pathname.split("/")[2] : null;

  useEffect(() => {
    let active = true;
    setArticle(null);
    if (!articleSlug) return;
    void (async () => {
      const { data } = await supabase.from("news_articles_public")
        .select("title, excerpt, slug, cover_image_url, seo_title, seo_description, publish_date")
        .eq("slug", articleSlug).maybeSingle();
      if (active) setArticle((data as typeof article) ?? null);
    })();
    return () => { active = false; };
  }, [articleSlug]);

  const meta = useMemo((): SeoMeta | null => {
    const canonical = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    if (article) {
      const title = text(article.seo_title) || articleTitle(article.title);
      const description = text(article.seo_description) || text(article.excerpt);
      const image = absolute(article.cover_image_url ?? undefined);
      return { title, description, canonical, ogType: "article", ogImage: image, jsonLd: {
        "@context": "https://schema.org", "@type": "Article", headline: article.title, description,
        ...(image ? { image } : {}), datePublished: article.publish_date, dateModified: article.publish_date,
        author: { "@type": "Person", name: AUTHOR_NAME, url: AUTHOR_URL, worksFor: { "@type": "Organization", name: BRAND, url: SITE_URL } },
        editor: { "@type": "Person", name: AUTHOR_NAME, url: AUTHOR_URL }, publisher: { "@type": "Organization", name: BRAND, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/pwa-512.png` } },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonical}` },
      }};
    }
    const key = Object.entries(pageSeo).find(([, value]) => value.canonicalPath === canonical)?.[1];
    return key ? { title: key.title, description: key.description, canonical, ogType: key.ogType } : null;
  }, [pathname, article]);

  if (!meta) return null;
  return <SEO title={meta.title} description={meta.description} canonical={meta.canonical} ogType={meta.ogType} ogImage={meta.ogImage} jsonLd={meta.jsonLd} />;
};

export default SitewideSEO;
