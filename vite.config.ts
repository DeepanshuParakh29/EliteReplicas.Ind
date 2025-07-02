import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables based on mode
const env = loadEnv('development', process.cwd(), '');

const isProduction = env.NODE_ENV === 'production';
const isVercel = !!env.VERCEL;

// Base URL for API requests
const apiBaseUrl = isVercel
  ? `https://${env.VERCEL_URL}`
  : 'http://localhost:5000';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
      "@server": path.resolve(import.meta.dirname, "./server"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: isProduction ? '/' : '/',
  publicDir: 'public',
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: isProduction ? 'hidden' : true,
    minify: isProduction ? 'esbuild' : false,
    manifest: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "client/index.html"),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      mode === 'production' ? '/api' : 'http://localhost:5000/api'
    ),
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '^/api/.*': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiBaseUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}));
