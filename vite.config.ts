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
  // The SSR client build (`bun run build:client`) uses ssr/index.ssr.html,
  // which hydrates via src/entry-client.tsx instead of src/main.tsx. It's
  // nested in ssr/ (rather than sitting in the output root as index.ssr.html)
  // so Vercel's filesystem-based static routing — which is checked before
  // rewrites — has no HTML file to implicitly serve for "/", forcing every
  // route including "/" through the rewrite to the SSR function. The plain
  // GitHub Pages build (`bun run build`) is untouched and keeps using
  // index.html + src/main.tsx (client-only render, no hydration). The SSR
  // server bundle (`--ssr src/entry-server.tsx`) supplies its own entry via
  // the CLI flag and must not have rollupOptions.input overridden here.
  ...(mode === "ssrclient" && !isSsrBuild
    ? { build: { rollupOptions: { input: "ssr/index.ssr.html" } } }
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
