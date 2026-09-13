// Test C: stable-Nitro-v2 override variant of vite.tanstack-start.config.ts.
// Swaps nitro/vite (v3-beta) for @tanstack/nitro-v2-vite-plugin (wraps real
// stable nitropack@2.13.4). See
// docs/architecture/tanstack-start-repo-root-coexistence-test.md.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";

export default defineConfig({
  plugins: [
    nitroV2Plugin(),
    tanstackStart({
      router: { routesDirectory: "routes", routeFileIgnorePattern: "routeTree\\.gen\\.ts$" },
    }),
    react(),
  ],
});
