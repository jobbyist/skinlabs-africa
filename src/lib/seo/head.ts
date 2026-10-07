import { BRAND, DEFAULT_OG } from "@/lib/seo-config";
import { canonicalUrl, absoluteUrl } from "./canonical";
import type { PageMeta, HeadTags } from "./types";
import { clampAtWord } from "./text";


/**
 * Builds the exact shape TanStack Router's `head()` API consumes: flat meta
 * objects, `{rel, href}` links, and flat `{type, children}` scripts. One
 * shared builder so every SSR-migrated content type produces consistent
 * meta/OG/Twitter coverage instead of re-deriving it per route (mirrors
 * SEO.tsx's field set, the client-side equivalent used by every other page).
 *
 * `jsonLdBlocks` are pre-built objects (see jsonLd.ts) -- this function only
 * serializes and wires them in, it never invents structured data itself.
 */
export function buildHeadTags(meta: PageMeta, jsonLdBlocks: object[] = []): HeadTags {
  const canonical = canonicalUrl(meta.canonicalPath);
  const description = clampAtWord(meta.description, 160);
  const ogImage = meta.ogImage ? absoluteUrl(meta.ogImage) : DEFAULT_OG;
  const robots = meta.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const metaTags: Array<Record<string, string>> = [
    { title: meta.title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { property: "og:title", content: meta.title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: meta.ogType ?? "website" },
    { property: "og:image", content: ogImage },
    { property: "og:site_name", content: BRAND },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: meta.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];
  if (meta.publishedTime) metaTags.push({ property: "article:published_time", content: meta.publishedTime });
  if (meta.modifiedTime) metaTags.push({ property: "article:modified_time", content: meta.modifiedTime });

  // charset/viewport come from the root document (src/routes/__root.tsx); a per-route copy would override its
  // `viewport-fit=cover`. `data-rh` makes react-helmet-async adopt (and replace) these tags when the SPA boots, so
  // the browser never ends up with two canonicals, two sets of OG tags or duplicated JSON-LD.
  return {
    meta: metaTags.map((tag) => ("title" in tag ? tag : { ...tag, "data-rh": "true" })),
    links: [{ rel: "canonical", href: canonical, "data-rh": "true" }],
    scripts: jsonLdBlocks.map((block) => ({ type: "application/ld+json", children: JSON.stringify(block), "data-rh": "true" })),
  };
}
