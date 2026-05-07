// ai-notebook/notebook/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../dist/notebook",
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
  },
});