import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = env.VITE_API_BASE_URL || "http://127.0.0.1:8060";
  
  return {
    plugins: [react()],
    
    // Because you are using a custom Porkbun domain, this defaults to "/"
    // which is exactly what GitHub Pages needs.
    base: "/",
    
    // NOTE: This proxy ONLY works on your laptop during `npm run dev`.
    // It intercepts local `/api` calls and routes them to your local Python server.
    server: {
      port: 8070,
      proxy: {
        "/api": api.replace(/\/$/, ""),
        "/health": api.replace(/\/$/, ""),
      },
    },
  };
});