/**
 * The SPA document shell, as the SSR content routes need it.
 *
 * /briefings/:slug, /reviews/:slug, /ingredients/:slug and /spotlight/:slug are answered by the TanStack Start
 * server function (so crawlers get real metadata + content). A browser, however, must end up in the REAL app
 * (react-router, the site stylesheet, header/footer, providers, the PWA runtime, push-tap routing) — the same page
 * a member reaches by tapping a card. So the SSR document is the SPA's own shell (its hashed entry script and
 * stylesheet, read from the build's dist/index.html) wrapped around the server-rendered content; the SPA's
 * createRoot() replaces that content on boot. Without this the SSR routes served an unstyled, header-less page
 * with no service-worker registration, which is what broke deep links, shared links and notification taps.
 *
 * Pure so it can be unit tested against the real index.html.
 */

export interface SpaShellAssets {
  /** `<script type="module" src="/assets/…">` entries (the hashed app bundle). */
  entryScripts: string[];
  /** `<link rel="stylesheet" href="/assets/…">` (the hashed site stylesheet). */
  stylesheets: string[];
  /** `<link rel="modulepreload" href="/assets/…">`. */
  modulePreloads: string[];
  /** Inline `<style>` blocks from the head (the installed-app boot splash). */
  headStyles: string[];
  /** Inline head scripts (the idle-time AdSense loader). */
  headScripts: string[];
  /** Inline body scripts (the standalone-mode boot splash). */
  bodyScripts: string[];
}

const ATTR_RE = /([\w:-]+)(?:\s*=\s*"([^"]*)")?/g;

const attributesOf = (tag: string): Record<string, string> => {
  const out: Record<string, string> = {};
  const inner = tag.replace(/^<\s*\w+/, "").replace(/\/?>$/, "");
  for (const m of inner.matchAll(ATTR_RE)) out[m[1].toLowerCase()] = m[2] ?? "";
  return out;
};

const section = (html: string, tag: "head" | "body"): string => {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(html);
  return match ? match[1] : "";
};

/** Only same-origin hashed build files are carried over; a third-party URL in the shell is never inlined here. */
const isBuildAsset = (href: string | undefined): href is string => !!href && /^\/assets\/[^"'?#\s]+$/.test(href);

export function parseSpaShell(html: string): SpaShellAssets {
  const head = section(html, "head");
  const body = section(html, "body");
  const out: SpaShellAssets = { entryScripts: [], stylesheets: [], modulePreloads: [], headStyles: [], headScripts: [], bodyScripts: [] };

  // HTML comments in the shell contain tag-like text ("<title>"), so drop them before scanning.
  const stripped = head.replace(/<!--[\s\S]*?-->/g, "");
  // <noscript> fallbacks are not part of the live shell.
  const live = stripped.replace(/<noscript>[\s\S]*?<\/noscript>/gi, "");

  for (const m of live.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributesOf(m[0]);
    if (!isBuildAsset(attrs.href)) continue;
    if (attrs.rel === "stylesheet") out.stylesheets.push(attrs.href);
    else if (attrs.rel === "modulepreload") out.modulePreloads.push(attrs.href);
  }
  for (const m of live.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = attributesOf(`<script ${m[1]}>`);
    if (attrs.src !== undefined) {
      if (attrs.type === "module" && isBuildAsset(attrs.src)) out.entryScripts.push(attrs.src);
    } else if (m[2].trim()) {
      out.headScripts.push(m[2].trim());
    }
  }
  for (const m of live.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) if (m[1].trim()) out.headStyles.push(m[1].trim());

  const bodyLive = body.replace(/<!--[\s\S]*?-->/g, "");
  for (const m of bodyLive.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(m[1]) && m[2].trim()) out.bodyScripts.push(m[2].trim());
  }
  return out;
}

/**
 * Until the app boots, the server-rendered article is hidden from people (crawlers and no-JS readers still get it),
 * so nobody sees an unstyled flash before the real page replaces it. If the bundle never boots, it is revealed
 * after 8 s so the content is never lost. `js` is set by the first head script.
 */
export const SSR_FALLBACK_ATTRIBUTE = "data-ssr-fallback";
export const SSR_FALLBACK_CSS =
  `html.js [${SSR_FALLBACK_ATTRIBUTE}]{visibility:hidden;animation:ssr-fallback-reveal 0s linear 8s forwards}` +
  `@keyframes ssr-fallback-reveal{to{visibility:visible}}` +
  `[${SSR_FALLBACK_ATTRIBUTE}]{max-width:48rem;margin:0 auto;padding:5rem 1rem 3rem}`;
export const SSR_FALLBACK_JS_FLAG = "document.documentElement.classList.add('js');";
