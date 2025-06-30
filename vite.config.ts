import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vercel environment variables
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:5000';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: mode === 'production' ? '/' : '/',
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      mode === 'production' ? '/api' : 'http://localhost:5000/api'
    ),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: vercelUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target: vercelUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}));
