// Single source of truth for build-time route enumeration, shared by
// generate-sitemap.mjs and prerender.mjs. Reads slugs straight out of the
// TS data files with a regex (no Vite runtime needed for a plain Node script).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcData = (file) => readFileSync(path.join(__dirname, "..", "src", "data", file), "utf8");

const extractIds = (source, key) => {
  const re = new RegExp(`${key}:\\s*["']([^"']+)["']`, "g");
  return [...source.matchAll(re)].map((m) => m[1]);
};

export const staticRoutes = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/about", changefreq: "weekly", priority: 0.9 },
  { loc: "/pricing", changefreq: "weekly", priority: 0.9 },
  { loc: "/contact", changefreq: "monthly", priority: 0.7 },
  { loc: "/newsroom", changefreq: "daily", priority: 0.95 },
  { loc: "/reviews", changefreq: "weekly", priority: 0.9 },
  { loc: "/podcast", changefreq: "weekly", priority: 0.9 },
  { loc: "/ai-formulator", changefreq: "weekly", priority: 0.95 },
  { loc: "/book-consultation", changefreq: "monthly", priority: 0.8 },
  { loc: "/business", changefreq: "monthly", priority: 0.5 },
  { loc: "/careers", changefreq: "monthly", priority: 0.4 },
  { loc: "/press", changefreq: "monthly", priority: 0.4 },
  { loc: "/our-science", changefreq: "monthly", priority: 0.6 },
  { loc: "/sustainability", changefreq: "monthly", priority: 0.5 },
  { loc: "/faq", changefreq: "monthly", priority: 0.5 },
  { loc: "/privacy-policy", changefreq: "yearly", priority: 0.2 },
  { loc: "/terms-of-service", changefreq: "yearly", priority: 0.2 },
  { loc: "/cookie-policy", changefreq: "yearly", priority: 0.2 },
];

export const newsroomSlugs = extractIds(srcData("newsroom.ts"), "id");
export const reviewSlugs = extractIds(srcData("reviews.ts"), "id");
export const podcastSlugs = extractIds(srcData("podcast.ts"), "slug");

export const allRoutes = () => [
  ...staticRoutes,
  ...newsroomSlugs.map((slug) => ({ loc: `/newsroom/${slug}`, changefreq: "monthly", priority: 0.75 })),
  ...reviewSlugs.map((slug) => ({ loc: `/reviews/${slug}`, changefreq: "monthly", priority: 0.75 })),
  ...podcastSlugs.map((slug) => ({ loc: `/podcast/${slug}`, changefreq: "monthly", priority: 0.75 })),
];
