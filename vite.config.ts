import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  // The SSR client build (`bun run build:client`) uses index.ssr.html, which
  // hydrates via src/entry-client.tsx instead of src/main.tsx. The plain
  // GitHub Pages build (`bun run build`) is untouched and keeps using
  // index.html + src/main.tsx (client-only render, no hydration). The SSR
  // server bundle (`--ssr src/entry-server.tsx`) supplies its own entry via
  // the CLI flag and must not have rollupOptions.input overridden here.
  ...(mode === "ssrclient" && !isSsrBuild
    ? { build: { rollupOptions: { input: "index.ssr.html" } } }
    : {}),
  // react-helmet-async ships CJS; bundle it for SSR so Node's ESM/CJS
  // interop doesn't drop its named exports at runtime.
  ssr: { noExternal: ["react-helmet-async"] },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "SkinLabs® South Africa",
        short_name: "SkinLabs",
        description: "Next-Generation Skincare Science",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
