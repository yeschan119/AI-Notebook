import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    build: {
        outDir: "dist",
        emptyOutDir: true,
        minify: false,
        sourcemap: true,
        rollupOptions: {
                input: {
                    background: resolve(__dirname, "src/background.ts"),
                    content: resolve(__dirname, "src/content.ts"),
                    popup: resolve(__dirname, "src/popup.ts")
                },
                output: {
                    entryFileNames: "[name].js",
                    chunkFileNames: "[name].js",
                    assetFileNames: "[name].[ext]"
                }
            }
        }
});