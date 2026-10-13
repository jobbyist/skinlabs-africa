import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseSpaShell, SSR_FALLBACK_CSS } from "../routing/spaShell";
import { buildHeadTags } from "../seo/head";
import { SPA_SHELL_MARKER, stripClientPreloads, stripClientPreloadsFromResponse } from "../routing/stripClientPreloads";

const root = resolve(__dirname, "../../..");
const sourceIndex = readFileSync(resolve(root, "index.html"), "utf8");
const rootRoute = readFileSync(resolve(root, "src/routes/__root.tsx"), "utf8");

// What vite emits for the entry (index.html in the repo references /src/main.tsx; the build rewrites it to hashed assets).
const BUILT = `<!doctype html><html lang="en"><head><meta charset="UTF-8" />
<!-- <title>ignored</title><script type="module" src="/assets/evil.js"></script> -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/assets/noscript.css"></noscript>
<script>window.addEventListener("load", function () { /* adsense */ });</script>
<style>#pwa-boot-splash{position:fixed}</style>
<script type="module" crossorigin src="/assets/index-AbC123.js"></script>
<link rel="modulepreload" crossorigin href="/assets/vendor-XyZ.js">
<script src="https://evil.example/x.js"></script>
<script type="module" src="https://evil.example/m.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-AbC123.css"></head>
<body><script>(function(){ var standalone = true; })();</script><div id="root"></div></body></html>`;

describe("SPA shell used by the server-rendered content routes", () => {
  const shell = parseSpaShell(BUILT);
  test("carries only the hashed same-origin entry, stylesheet and preloads", () => {
    expect(shell.entryScripts).toEqual(["/assets/index-AbC123.js"]);
    expect(shell.stylesheets).toEqual(["/assets/index-AbC123.css"]);
    expect(shell.modulePreloads).toEqual(["/assets/vendor-XyZ.js"]);
  });
  test("ignores comments, <noscript> fallbacks and third-party scripts", () => {
    const all = JSON.stringify(shell);
    expect(all).not.toContain("evil");
    expect(all).not.toContain("noscript.css");
  });
  test("keeps the inline head script, boot-splash style and body splash script", () => {
    expect(shell.headScripts).toHaveLength(1);
    expect(shell.headStyles).toEqual(["#pwa-boot-splash{position:fixed}"]);
    expect(shell.bodyScripts[0]).toContain("standalone");
  });
  test("the real index.html yields a boot splash script + style (shell assets are still discovered after a build)", () => {
    const real = parseSpaShell(sourceIndex);
    expect(real.bodyScripts.some((js) => js.includes("pwa-boot-splash"))).toBe(true);
    expect(real.headStyles.some((css) => css.includes("#pwa-boot-splash"))).toBe(true);
    expect(real.headScripts.some((js) => js.includes("adsbygoogle"))).toBe(true);
  });
  test("the hidden fallback always reveals itself if the app never boots", () => {
    expect(SSR_FALLBACK_CSS).toContain("visibility:hidden");
    expect(SSR_FALLBACK_CSS).toContain("8s forwards");
  });
});

describe("root document stays in step with index.html", () => {
  test("static head values mirrored in __root.tsx exist in index.html", () => {
    for (const needle of [
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Montserrat:wght@400;500;600;700;800&display=swap",
      "/manifest.webmanifest",
      "/apple-touch-icon.png",
      "/favicon.ico",
      "@SkinLabsZA",
      "viewport-fit=cover",
    ]) {
      expect(sourceIndex).toContain(needle);
      expect(rootRoute).toContain(needle);
    }
  });
  test("the TanStack client bundle is not loaded (the SPA entry is the only app script)", () => {
    expect(rootRoute).not.toMatch(/<Scripts\s*\/>/);
  });
});

describe("per-route head tags", () => {
  const tags = buildHeadTags({ title: "T", description: "D", canonicalPath: "/briefings/x" }, [{ "@type": "Article" }]);
  test("do not override the root viewport/charset", () => {
    expect(tags.meta.some((m) => "charSet" in m || m.name === "viewport")).toBe(false);
  });
  test("are adopted by react-helmet-async when the SPA boots (no duplicate canonical/OG/JSON-LD)", () => {
    expect(tags.links.every((l) => l["data-rh"] === "true")).toBe(true);
    expect(tags.scripts.every((s) => s["data-rh"] === "true")).toBe(true);
    expect(tags.meta.filter((m) => !("title" in m)).every((m) => m["data-rh"] === "true")).toBe(true);
  });
});

describe("unused TanStack client preloads", () => {
  const head = `<head><link rel="modulepreload" href="/assets/index-tsr.js"/><link rel="modulepreload" href="/assets/spa.js" ${SPA_SHELL_MARKER}=""/><link rel="stylesheet" href="/assets/a.css"/></head>`;
  test("drops unmarked modulepreloads and keeps the shell's own", () => {
    const out = stripClientPreloads(head);
    expect(out).not.toContain("index-tsr.js");
    expect(out).toContain("/assets/spa.js");
    expect(out).toContain("/assets/a.css");
  });
  test("rewrites a streamed HTML response across chunk boundaries and leaves the body untouched", async () => {
    const enc = new TextEncoder();
    const full = `<!doctype html><html>${head}<body><p>modulepreload stays in body text</p></body></html>`;
    const mid = full.indexOf("index-tsr") + 3; // split inside the tag
    const body = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(full.slice(0, mid)));
        c.enqueue(enc.encode(full.slice(mid)));
        c.close();
      },
    });
    const res = stripClientPreloadsFromResponse(new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } }));
    const text = await res.text();
    expect(text).not.toContain("index-tsr.js");
    expect(text).toContain("/assets/spa.js");
    expect(text).toContain("<p>modulepreload stays in body text</p>");
  });
  test("non-HTML responses pass through", async () => {
    const res = new Response("<link rel=\"modulepreload\" href=\"/x\">", { headers: { "content-type": "application/xml" } });
    expect(stripClientPreloadsFromResponse(res)).toBe(res);
  });
});
