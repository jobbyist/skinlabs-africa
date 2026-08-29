import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// PWA functionality (service worker, offline caching, install manifest) is
// temporarily disabled — see src/main.tsx for the matching service-worker
// teardown. Re-enable by restoring the VitePWA import/plugin block below.
// import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: mode === "production" ? false : true,
    rollupOptions: {
      output: {
        // Generate unique filenames to bust cache on every build
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: undefined,
      },
    },
    // Ensure clean builds
    emptyOutDir: true,
    // Disable CSS code splitting for better cache control
    cssCodeSplit: false,
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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
