// Load-bearing in production (see vite.tanstack-start.config.ts). Without
// this, Nitro auto-detects the real app's own root index.html and serves it
// verbatim as a catch-all "renderer" for every route, silently shadowing
// TanStack Start's actual SSR route tree -- confirmed by direct inspection
// of the compiled .output/server/_chunks/renderer-template.mjs during the
// Phase 2 coexistence test. See
// docs/architecture/tanstack-start-repo-root-coexistence-test.md.
import { defineConfig } from "nitro";

export default defineConfig({
  renderer: false,
});
