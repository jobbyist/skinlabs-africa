import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { HelmetServerState } from "react-helmet-async";
import { AppProviders, AppContent } from "./App";
import { PodcastPlayerProvider } from "./components/PodcastPlayer";

export interface RenderResult {
  html: string;
  head: string;
}

/**
 * Renders the app to a static HTML string for the given URL, along with the
 * <head> tags (title/meta/link/script) collected by react-helmet-async for
 * that specific route. Nothing here touches the network — all data fetching
 * still happens client-side after hydration.
 */
export function render(url: string): RenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {};

  const html = renderToString(
    <AppProviders helmetContext={helmetContext}>
      <StaticRouter location={url}>
        <PodcastPlayerProvider>
          <AppContent />
        </PodcastPlayerProvider>
      </StaticRouter>
    </AppProviders>,
  );

  const { helmet } = helmetContext;
  const head = helmet
    ? [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ].join("\n")
    : "";

  return { html, head };
}
