import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' ws: wss: http://localhost:5000 http://localhost:5173;",
    },
    hmr: {
      overlay: false, // prevents crash spam
    },
  },
  define: {
    global: "globalThis",
    // Disable tracking prevention for Monaco Editor
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
  optimizeDeps: {
    // Prevent Monaco Editor from being optimized
    include: ["monaco-editor", "simple-peer"],
  },
});
