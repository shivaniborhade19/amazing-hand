import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 9500,
    allowedHosts: ['amazinghand.tenxerlabs.com', '192.168.0.24'],
    proxy: {
      "/upload": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/logs": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: false,
      },
      "/assets": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/api": {
    target: "http://127.0.0.1:5000",  // 👈 new route for save/load endpoints
    changeOrigin: true,
  },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
