import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "Açaí Lab - Cardápio Digital",
        short_name: "Açaí Lab",
        description: "Cardápio digital e gestão de pedidos",
        start_url: "/",
        display: "standalone",
        background_color: "#f8f8f8",
        theme_color: "#7c3aed",
        orientation: "portrait",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          {
            src: "/favicon.ico",
            sizes: "192x192",
            type: "image/x-icon",
            purpose: "any maskable",
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
