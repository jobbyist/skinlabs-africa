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
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    nitro(),
    tanstackStart({
      router: { routesDirectory: "routes", routeFileIgnorePattern: "routeTree\\.gen\\.ts$" },
    }),
    react(),
  ],
});
