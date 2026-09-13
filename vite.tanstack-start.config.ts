// Phase 2 repo-root coexistence test ONLY. Never referenced by `npm run
// build` / the real `vite.config.ts` -- built exclusively via the separate
// `build:tanstack-start-test` script. See
// docs/architecture/tanstack-start-repo-root-coexistence-test.md.
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
