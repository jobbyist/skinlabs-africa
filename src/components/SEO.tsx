import { Helmet } from "react-helmet-async";
import { BRAND, SITE_URL, DEFAULT_OG } from "@/lib/seo-config";

interface SEOProps {
  /** Search-facing title. The brand is appended automatically unless already present. */
  title: string;
  /** Concise, page-specific description. Prefer 140–160 characters for snippets. */
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  keywords?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const clamp = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

const SEO = ({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG,
  keywords,
  jsonLd,
  noindex = false,
  publishedTime,
  modifiedTime,
  author = "SkinLabs®",
}: SEOProps) => {
  const fullTitle = /skinlabs/i.test(title) ? title : `${title} | ${BRAND}`;
  const safeDescription = clamp(description, 160);

  // Canonical URLs are always rooted at the production domain. This prevents
  // Vercel preview/staging hosts and query-string variants becoming canonicals.
  const path = canonical
    ? canonical.startsWith("http")
      ? (() => {
          const u = new URL(canonical);
          return u.pathname || "/";
        })()
      : canonical.split("?")[0]
    : typeof window !== "undefined"
      ? window.location.pathname
      : "/";
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/$/g, "")}`;
  const url = `${SITE_URL}${normalizedPath}`;
  const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={BRAND} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      <meta name="language" content="English" />
      <meta name="author" content={author} />
      <meta name="geo.region" content="ZA" />
      <meta name="geo.placename" content="South Africa" />
      <meta name="theme-color" content="#000000" />

      {jsonLdList.map((entry, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
