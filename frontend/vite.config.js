import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig(({ mode }) => ({
  root: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // now "@/Foo" === "./src/Foo"
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // in dev we serve from "/", in prod we prefix with your Django/Flask static path:
  base: mode === "production" ? "/static/frontend/" : "/",
  server: {
    proxy: {
      "/get_course_codes": "http://localhost:8000",
      "/get_section_numbers": "http://localhost:8000",
      "/search/": "http://localhost:8000",
      "/submit_suggestion/": "http://localhost:8000",
    },
  },
  build: {
    outDir: "../backend/static/frontend",
    emptyOutDir: true,
    rollupOptions: {
      input: "./index.html",
    },
  },
}));
