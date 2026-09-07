import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { pageSeo, SITE_URL, productReviewTitle, productReviewDescription, brandProfileTitle, articleTitle, podcastEpisodeTitle, BRAND } from "@/lib/seo-config";
import { getEntryBySlug, buildFaqJsonLd } from "@/data/faq";
import { productReviews } from "@/data/reviews";
import { podcastEpisodes } from "@/data/podcast";
import { getSpotlightBrand } from "@/data/spotlight";
import { comparisonArticles } from "@/data/comparisons";
import { seasonHubs } from "@/data/seasonals";
import { useReviewImages } from "@/hooks/use-review-images";

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const absolute = (value: string | undefined) => value ? (value.startsWith("http") ? value : `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`) : undefined;

const SitewideSEO = () => {
  const { pathname } = useLocation();
  const { getImage } = useReviewImages();
  const [article, setArticle] = useState<null | { title: string; excerpt: string; slug: string; cover_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; publish_date?: string | null; updated_at?: string | null }>(null);
  const articleSlug = pathname.startsWith("/briefings/") ? pathname.split("/")[2] : null;

  useEffect(() => {
    let active = true;
    if (!articleSlug) { setArticle(null); return; }
    void (async () => {
      const { data } = await supabase.from("news_articles_public")
        .select("title, excerpt, slug, cover_image_url, seo_title, seo_description, publish_date, updated_at")
        .eq("slug", articleSlug).maybeSingle();
      if (active) setArticle((data as typeof article) ?? null);
    })();
    return () => { active = false; };
  }, [articleSlug]);

  const meta = useMemo(() => {
    const canonical = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const faqSlug = pathname.startsWith("/knowledge-hub/") ? pathname.split("/")[2] : null;
    const reviewSlug = pathname.startsWith("/reviews/") && !pathname.startsWith("/reviews/versus/") ? pathname.split("/")[2] : null;
    const comparisonSlug = pathname.startsWith("/reviews/versus/") ? pathname.split("/")[3] : null;
    const podcastSlug = pathname.startsWith("/podcast/") ? pathname.split("/")[2] : null;
    const spotlightSlug = pathname.startsWith("/spotlight/") && !pathname.includes("/methodology") && !pathname.includes("/archive") ? pathname.split("/")[2] : null;
    const season = pathname.startsWith("/seasonals/") ? pathname.split("/")[2] : null;

    if (article) {
      const title = text(article.seo_title) || articleTitle(article.title);
      const description = text(article.seo_description) || text(article.excerpt);
      const image = absolute(article.cover_image_url ?? undefined);
      return { title, description, canonical, ogType: "article", ogImage: image, jsonLd: {
        "@context": "https://schema.org", "@type": "Article", headline: article.title, description,
        ...(image ? { image } : {}), datePublished: article.publish_date, dateModified: article.updated_at || article.publish_date,
        author: { "@type": "Organization", name: BRAND, url: SITE_URL }, publisher: { "@type": "Organization", name: BRAND, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/pwa-512.png` } },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonical}` },
      }};
    }

    if (faqSlug) {
      const entry = getEntryBySlug(faqSlug);
      if (entry) return { title: entry.question, description: entry.answer, canonical, ogType: "article", jsonLd: [buildFaqJsonLd([entry]), { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Knowledge Hub", item: `${SITE_URL}/knowledge-hub` }, { "@type": "ListItem", position: 2, name: entry.question, item: `${SITE_URL}${canonical}` }] }] };
    }

    if (reviewSlug) {
      const review = productReviews.find((r) => r.id === reviewSlug);
      if (review) {
        const image = getImage(review.id, review.category);
        const score = review ? review.score : undefined;
        return { title: productReviewTitle(review.product_name), description: productReviewDescription(review.product_name, review.brand), canonical, ogType: "article", ogImage: image?.url, jsonLd: {
          "@context": "https://schema.org", "@type": "Product", name: review.product_name, image: image?.url ? [absolute(image.url)] : undefined,
          brand: { "@type": "Brand", name: review.brand }, category: review.category,
          aggregateRating: score !== undefined ? { "@type": "AggregateRating", ratingValue: score, bestRating: 10, reviewCount: 1 } : undefined,
          review: { "@type": "Review", author: { "@type": "Organization", name: BRAND }, reviewRating: { "@type": "Rating", ratingValue: score ?? 0, bestRating: 10 }, reviewBody: review.verdict },
        } };
      }
    }

    if (comparisonSlug) {
      const comparison = comparisonArticles.find((c) => c.slug === comparisonSlug);
      if (comparison) return { title: `${comparison.title} | Shelf Showdown by ${BRAND}`, description: comparison.dek, canonical, ogType: "article", ogImage: absolute(comparison.thumbnail.url), jsonLd: { "@context": "https://schema.org", "@type": "Article", headline: comparison.title, description: comparison.dek, image: absolute(comparison.thumbnail.url), datePublished: comparison.publishDate, dateModified: comparison.modifiedDate, author: { "@type": "Organization", name: BRAND, url: SITE_URL }, publisher: { "@type": "Organization", name: BRAND, url: SITE_URL }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonical}` } } };
    }

    if (podcastSlug) {
      const episode = podcastEpisodes.find((e) => e.slug === podcastSlug);
      if (episode && !episode.comingSoon) return { title: podcastEpisodeTitle(episode.title), description: episode.description, canonical, ogType: "article", ogImage: absolute(episode.image), jsonLd: { "@context": "https://schema.org", "@type": "PodcastEpisode", name: episode.title, description: episode.description, datePublished: episode.publishedAt, image: absolute(episode.image), url: `${SITE_URL}${canonical}`, partOfSeries: { "@type": "PodcastSeries", name: "The Skin Deep Series", url: `${SITE_URL}/podcast` } } };
    }

    if (spotlightSlug) {
      const entry = getSpotlightBrand(spotlightSlug);
      if (entry) return { title: brandProfileTitle(entry.brand), description: text(entry.editorial.whyTheyMadeTheList), canonical, ogType: "article" };
    }

    if (season) {
      const hub = seasonHubs[season as keyof typeof seasonHubs];
      if (hub) return { title: hub.seoTitle, description: hub.seoDescription, canonical, ogType: "article", ogImage: absolute(hub.heroImage.url) };
    }

    const key = Object.entries(pageSeo).find(([, value]) => value.canonicalPath === canonical)?.[1];
    return key ? { title: key.title, description: key.description, canonical, ogType: key.ogType } : null;
  }, [pathname, article, getImage]);

  if (!meta) return null;
  return <SEO title={meta.title} description={meta.description} canonical={meta.canonical} ogType={meta.ogType} ogImage={meta.ogImage} jsonLd={meta.jsonLd} />;
};

export default SitewideSEO;
