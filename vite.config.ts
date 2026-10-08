import { defineConfig, build as viteBuild, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

/**
 * Builds src/sw/sw.ts into dist/sw.js (a standalone IIFE, not part of the app
 * bundle) after the main build has written dist/. Production builds only: there
 * is no service worker in `vite dev` (src/lib/pwa/serviceWorker.ts skips
 * registration there). Not using vite-plugin-pwa: the worker is hand-written
 * and dependency-free — see docs/pwa.md.
 */
const skinlabsServiceWorker = (): Plugin => ({
  name: "skinlabs-service-worker",
  apply: "build",
  enforce: "post",
  async closeBundle() {
    await viteBuild({
      configFile: false,
      logLevel: "warn",
      publicDir: false,
      resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
      build: {
        outDir: "dist",
        emptyOutDir: false,
        sourcemap: false,
        minify: "esbuild",
        target: "es2020",
        lib: { entry: path.resolve(__dirname, "src/sw/sw.ts"), formats: ["iife"], name: "SkinLabsServiceWorker", fileName: () => "sw.js" },
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  build: {
    outDir: "dist",
    // Was false in production, which is why live chunks like index-*.js and
    // AIFormulator-*.js shipped with no accompanying .map file — every stack
    // trace/error report from real production traffic was unmappable back to
    // source. This is a public content site (no obfuscated proprietary logic
    // worth hiding), so the standard tradeoff favors shipping real maps.
    sourcemap: true,
    rollupOptions: {
      output: {
        // Generate unique filenames to bust cache on every build
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // Every route is already React.lazy()-loaded (see src/App.tsx). A
        // named "vendor-charts"/"vendor-pdf" manualChunks entry previously
        // lived here to share recharts/jspdf across their several lazy
        // consumers (admin/dashboard/formulator) under one fixed,
        // long-term-cacheable filename -- but a real build measurement
        // showed Vite unconditionally emits <link rel="modulepreload"> for
        // *named* manualChunks vendor chunks in the root index.html,
        // regardless of whether anything on the current route actually
        // needs them. Confirmed directly: after lazy-loading the homepage's
        // AIFormulator widget (src/pages/Index.tsx) so recharts/jspdf are no
        // longer in ANY route's eager import graph, dist/index.html was
        // still preloading both vendor chunks (~246KB gzip) on literally
        // every page load. Removing the manualChunks entries fixes this --
        // Rollup's automatic chunking still creates one shared chunk for a
        // module reachable from multiple dynamic-import consumers, it's
        // just not statically named/preloaded, so it only loads when a
        // route that actually uses it is visited. The tradeoff (a
        // content-hashed rather than fixed vendor filename) is moot anyway
        // since every chunk filename here already busts on each build.
      },
    },
    // Ensure clean builds
    emptyOutDir: true,
    // Vite's default. NOTE: measured before/after -- this alone does NOT
    // split the CSS output here, because Tailwind's JIT scans the whole
    // codebase and emits one monolithic stylesheet from the single
    // `import "./index.css"` in main.tsx, regardless of route-level JS code
    // splitting. Actually shrinking first-load CSS would need per-route CSS
    // entry points, which this Tailwind setup doesn't have -- left as `true`
    // since it's still the correct default and is free.
    cssCodeSplit: true,
    // Minify in production
    minify: mode === "production" ? "esbuild" : false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Disable caching in dev server
  cacheDir: mode === "development" ? ".vite" : undefined,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && skinlabsServiceWorker(),
    // Compresses every raster/vector asset that goes through Vite's asset pipeline
    // (anything imported from src/assets) at build time — lossy but visually
    // transparent settings, matched per format. Files in public/ bypass Vite's
    // pipeline entirely and are handled by scripts/compress-images.ts instead.
    mode === "production" &&
      ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 78 },
        jpg: { quality: 78 },
        webp: { quality: 78 },
        svg: {
          multipass: true,
          plugins: [
            { name: "preset-default", params: { overrides: { removeViewBox: false } } },
          ] as unknown as import("svgo").PluginConfig[],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@/integrations/supabase/client": path.resolve(__dirname, "./src/integrations/supabase/productionClient.ts"),
      "@/integrations/supabase/types": path.resolve(__dirname, "./supabase/types.baseline.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
