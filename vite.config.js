// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // autorise l'accès via LAN (mobile, autre PC)
    port: 5173,
    strictPort: true, // échoue si 5173 est occupé (utile pour scripts)
    // proxy: {
    //   "/api": { target: "http://localhost:8000", changeOrigin: true },
    // },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true, // pratique pour déboguer en dev/staging
  },
});
