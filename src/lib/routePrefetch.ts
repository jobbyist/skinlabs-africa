/**
 * Intent-based route prefetching. Every page is its own chunk (lazyWithRetry in App.tsx), so the first tap on a link
 * used to wait for the download. Hovering, touching or focusing an internal link now starts that download early, and a
 * few likely next pages are warmed when the browser is idle. Vite de-duplicates these `import()`s with the router's own,
 * so nothing is fetched twice. Skipped entirely under Save-Data / 2G; failures are ignored (the real navigation retries).
 */
const loaders: Record<string, () => Promise<unknown>> = {
  briefings: () => import("@/pages/Newsroom"),
  briefing: () => import("@/pages/NewsroomArticle"),
  reviews: () => import("@/pages/Reviews"),
  review: () => import("@/pages/ProductReview"),
  compare: () => import("@/pages/Compare"),
  podcast: () => import("@/pages/PodcastPage"),
  episode: () => import("@/pages/EpisodePage"),
  dashboard: () => import("@/pages/UserDashboard"),
  skynn: () => import("@/pages/AIFormulator"),
  pricing: () => import("@/pages/Pricing"),
  spotlight: () => import("@/pages/Spotlight"),
  ingredients: () => import("@/pages/Ingredients"),
  seasonals: () => import("@/pages/Seasonals"),
};

/** Which page chunk a pathname belongs to (pure, tested). */
export const chunkForPath = (pathname: string): string | null => {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/briefings") return "briefings";
  if (p.startsWith("/briefings/")) return "briefing";
  if (p === "/reviews" || p.startsWith("/reviews/page/")) return "reviews";
  if (p.startsWith("/reviews/versus/")) return null;
  if (p.startsWith("/reviews/")) return "review";
  if (p === "/compare") return "compare";
  if (p === "/podcast") return "podcast";
  if (p.startsWith("/podcast/")) return "episode";
  if (p === "/dashboard") return "dashboard";
  if (p === "/skynn-ai") return "skynn";
  if (p === "/pricing") return "pricing";
  if (p === "/spotlight") return "spotlight";
  if (p === "/ingredients") return "ingredients";
  if (p === "/seasonals") return "seasonals";
  return null;
};

const started = new Set<string>();

export const prefetchChunk = (key: string | null) => {
  if (!key || started.has(key) || !loaders[key]) return;
  started.add(key);
  void loaders[key]().catch(() => started.delete(key));
};

const saveData = (): boolean => {
  const c = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g";
};

/** Wire intent listeners once (main.tsx). Returns a cleanup for tests. */
export const installRoutePrefetch = (): (() => void) => {
  // Automation (prerender, e2e) gets deterministic, un-prefetched behaviour.
  if (typeof document === "undefined" || saveData() || navigator.webdriver) return () => undefined;
  const onIntent = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link || link.origin !== window.location.origin || link.target === "_blank") return;
    prefetchChunk(chunkForPath(link.pathname));
  };
  const opts = { capture: true, passive: true } as const;
  document.addEventListener("pointerover", onIntent, opts);
  document.addEventListener("touchstart", onIntent, opts);
  document.addEventListener("focusin", onIntent, opts);

  // Warm the likeliest next pages once the page has settled.
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const warm = () => ["briefings", "reviews", "skynn"].forEach(prefetchChunk);
  const handle = idle ? idle(warm, { timeout: 6000 }) : window.setTimeout(warm, 4000);
  return () => {
    document.removeEventListener("pointerover", onIntent, opts);
    document.removeEventListener("touchstart", onIntent, opts);
    document.removeEventListener("focusin", onIntent, opts);
    if (!idle) window.clearTimeout(handle);
  };
};
