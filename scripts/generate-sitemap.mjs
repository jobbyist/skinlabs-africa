// Regenerates public/sitemap.xml at build time from the live route list,
// including every Newsroom/Reviews/Podcast permalink slug. Replaces the old
// hand-maintained, always-stale sitemap.xml.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { allRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://skinlabs.co.za";

const urlElements = allRoutes()
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>
`;

const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
writeFileSync(outPath, sitemap);
console.log(`[generate-sitemap] wrote ${allRoutes().length} URLs to ${outPath}`);
