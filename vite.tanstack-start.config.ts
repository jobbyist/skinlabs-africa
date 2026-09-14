// TanStack Start / Nitro build config for the SSR-migrated routes
// (currently: Briefings). Separate from the real `vite.config.ts`, which
// still builds the SPA (`dist/`) unchanged -- this config only produces the
// Nitro server function + its own route-specific client chunks, which
// `scripts/assemble-vercel-output.ts` then merges into the SPA's build
// output to form the final `.vercel/output/` deployed by `npm run build`.
// Originated as the Phase 2 repo-root coexistence test; see
// docs/architecture/tanstack-start-repo-root-coexistence-test.md for that
// history and docs/architecture/tanstack-start-production-migration.md for
// the production architecture this now feeds.
import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { nitro } from "nitro/vite";

export default defineConfig({
  // Same `@` -> src/ alias as the real vite.config.ts. Required now that
  // SSR-migrated routes import shared code via `@/lib/...` (src/lib/seo/*,
  // src/lib/content/*, src/lib/seo-config) -- without it Rollup fails to
  // resolve those imports for the client-hydration build specifically
  // (confirmed: the server/SSR build resolved them fine, but the client
  // environment build failed with "Rollup failed to resolve import
  // '@/lib/seo/head'" until this was added).
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    nitro(),
    tanstackStart({
      router: { routesDirectory: "routes", routeFileIgnorePattern: "routeTree\\.gen\\.ts$" },
    }),
    react(),
  ],
});
