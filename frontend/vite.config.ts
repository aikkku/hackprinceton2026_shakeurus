import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = env.VITE_API_BASE_URL || "http://127.0.0.1:8060";
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || "/",
    server: {
      port: 8070,
      proxy: {
        "/api": api.replace(/\/$/, ""),
        "/health": api.replace(/\/$/, ""),
      },
    },
  };
});
