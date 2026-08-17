// SSR server used for local dev (`bun run dev:ssr`), local production preview
// (`bun run start`), and as the basis for the Vercel serverless function in
// api/index.js. Follows Vite's official SSR recipe.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;

const app = express();

let vite;
if (!isProd) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, "dist/client"), { index: false }));
}

app.use(/.*/, async (req, res) => {
  const url = req.originalUrl;
  try {
    let template;
    let render;

    if (!isProd) {
      template = await fs.readFile(path.resolve(__dirname, "index.ssr.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
    } else {
      template = await fs.readFile(path.resolve(__dirname, "dist/client/index.ssr.html"), "utf-8");
      render = (await import("./dist/server/entry-server.js")).render;
    }

    const { html, head } = render(url);
    const page = template.replace("<!--app-head-->", head).replace("<!--app-html-->", html);

    res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(page);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e);
    res.status(500).end(e instanceof Error ? e.stack : String(e));
  }
});

app.listen(port, () => {
  console.log(`SSR server running at http://localhost:${port}`);
});
