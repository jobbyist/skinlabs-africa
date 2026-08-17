// Vercel serverless function: renders the SkinLabs app to HTML on each
// request using the SSR bundle produced by `bun run build:server`, then
// injects it into the client build's HTML template. Static assets under
// dist/client (JS, CSS, images) are served directly by Vercel and never
// reach this function — see vercel.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.resolve(__dirname, "../dist/client/index.ssr.html");
const template = fs.readFileSync(templatePath, "utf-8");

let renderPromise;
function getRender() {
  if (!renderPromise) {
    renderPromise = import("../dist/server/entry-server.js").then((mod) => mod.render);
  }
  return renderPromise;
}

export default async function handler(req, res) {
  try {
    const render = await getRender();
    const url = req.url || "/";
    const { html, head } = render(url);
    const page = template.replace("<!--app-head-->", head).replace("<!--app-html-->", html);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    res.end(page);
  } catch (err) {
    console.error("SSR render error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
