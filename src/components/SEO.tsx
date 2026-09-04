import { Helmet } from "react-helmet-async";
import { BRAND, SITE_URL, DEFAULT_OG } from "@/lib/seo-config";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  keywords?: string;
  jsonLd?: object | object[];
  /** Set only for pages that must not be indexed (e.g. dashboards). Defaults to indexable. */
  noindex?: boolean;
}

const SEO = ({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG,
  keywords,
  jsonLd,
  noindex = false,
}: SEOProps) => {
  const fullTitle = title.toLowerCase().includes("skinlabs") ? title : `${title} | ${BRAND}`;
  // Always canonicalize onto the production domain (skinlabs.co.za), never window.location.host,
  // so a page previewed on a staging/preview domain still emits the correct canonical.
  const path = canonical
    ? canonical.startsWith("http")
      ? (() => { const u = new URL(canonical); return u.pathname + u.search; })()
      : canonical
    : typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";
  const url = `${SITE_URL}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={BRAND} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="SkinLabs" />

      {/* Geographic Tags */}
      <meta name="geo.region" content="ZA" />
      <meta name="geo.placename" content="South Africa" />

      {/* Mobile */}
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />

      {/* JSON-LD Structured Data */}
      {jsonLdList.map((entry, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
