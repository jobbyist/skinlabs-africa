import { SITE_URL } from "@/lib/seo-config";
import { absoluteUrl } from "./canonical";
import type { BreadcrumbItem } from "./types";

/**
 * Builds a BreadcrumbList item array rooted at the SkinLabs home page.
 * `trail` is every crumb after "SkinLabs" itself, e.g.
 * `[{name: "Briefings", path: "/briefings"}, {name: article.title, path: canonicalPath}]`.
 */
export function siteBreadcrumbTrail(trail: Array<{ name: string; path: string }>): BreadcrumbItem[] {
  return [{ name: "SkinLabs", url: SITE_URL }, ...trail.map((t) => ({ name: t.name, url: absoluteUrl(t.path) }))];
}
