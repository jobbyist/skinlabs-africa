import { createFileRoute } from "@tanstack/react-router";
// The real, hashed SPA entry document the Vite build produces (dist/index.html).
// Inlined at build time via Vite's `?raw` import -- this file becomes part of the
// Nitro server function bundle, which cannot read a sibling `static/` directory
// at Vercel runtime (functions and static assets are two separate, non-cross-
// readable parts of the Build Output API). `vite build` always runs before
// `build:tanstack-start` in `npm run build` (see package.json), so this file
// exists by the time this import is resolved.
import spaIndexHtml from "../../dist/index.html?raw";

/**
 * Root splat/catch-all server route: the function-based replacement for
 * Vercel's documented `{handle:"filesystem"}` + `{dest:"/index.html",
 * check:true}` static SPA-fallback pattern, which -- despite being generated
 * byte-for-byte identical to `@vercel/routing-utils`'s own official
 * transform (confirmed across three separate live-deployment attempts, see
 * scripts/assemble-vercel-output.ts and docs/architecture/
 * tanstack-start-production-migration.md) -- consistently 404s in this
 * project's real Vercel deployment context for any path with no
 * prerendered static file (e.g. /dashboard, /reviews/page/2).
 *
 * This route is only ever reached for paths that didn't match a real static
 * file (the filesystem phase in config.json still takes priority) and
 * aren't one of the explicitly SSR-migrated patterns (those have their own,
 * more specific routes). Returning the exact same dist/index.html a static
 * fallback would have served -- via the SSR function, whose dest:"/__server"
 * routing is the one mechanism already proven reliable on this project's
 * real infrastructure -- lets the client-side react-router-dom SPA boot and
 * take over rendering exactly as it always has.
 *
 * Deliberately server-only (no `component`): the response below is the
 * final HTTP response, with no TanStack Start document/head wrapping
 * applied, matching what a static file serve would have produced.
 */
export const Route = createFileRoute("/$")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(spaIndexHtml, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
