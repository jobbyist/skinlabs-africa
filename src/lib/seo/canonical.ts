import { SITE_URL } from "@/lib/seo-config";

/**
 * Normalizes a site-relative path and roots it at the production domain --
 * same normalization SEO.tsx already applies client-side, extracted so SSR
 * routes can produce an identical canonical without importing a
 * react-helmet-async component.
 */
export function canonicalUrl(path: string): string {
  const trimmed = path.split("?")[0];
  const normalizedPath = trimmed === "/" ? "/" : `/${trimmed.replace(/^\/+|\/$/g, "")}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
