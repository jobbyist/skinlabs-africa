// Post-build static prerender for the Vite SPA. Serves ./dist locally,
// visits every route with headless Chromium, and writes each route's fully
// hydrated HTML to dist/<route>/index.html — so GitHub Pages (a pure static
// host with no SSR) still gives crawlers and social-share unfurlers a real,
// per-route <title>/meta/JSON-LD instead of just the generic index.html
// shell that react-helmet-async would otherwise only ever render client-side.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, copyFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { allRoutes } from "./routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const PORT = 4848;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

async function fileExists(p) {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

function startServer() {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = path.join(distDir, urlPath);
    if (!(await fileExists(filePath))) {
      // SPA fallback — serve the shell for any route without a matching file
      filePath = path.join(distDir, "index.html");
    }
    const ext = path.extname(filePath);
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function main() {
  if (!(await fileExists(path.join(distDir, "index.html")))) {
    console.error("[prerender] dist/index.html not found — run `vite build` first.");
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.warn("[prerender] playwright not installed — skipping prerender step.");
    return;
  }

  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const routes = allRoutes();
  console.log(`[prerender] rendering ${routes.length} routes…`);

  for (const route of routes) {
    const url = `http://localhost:${PORT}${route.loc}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      // Let react-helmet-async / async data effects settle after network idle.
      await page.waitForTimeout(250);
      const html = await page.content();

      const outDir = route.loc === "/" ? distDir : path.join(distDir, route.loc);
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, "index.html"), html);
    } catch (err) {
      console.warn(`[prerender] failed for ${route.loc}: ${err.message}`);
    }
  }

  await browser.close();
  server.close();

  // GitHub Pages 404 fallback so unprerendered/deep-linked paths still boot
  // the SPA router client-side instead of showing a bare GH Pages 404.
  await copyFile(path.join(distDir, "index.html"), path.join(distDir, "404.html"));

  console.log("[prerender] done.");
}

main();
