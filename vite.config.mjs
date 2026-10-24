import { defineConfig } from "vite";
import { localFontAssetsPlugin } from "./scripts/font-assets.mjs";

export default defineConfig({
  plugins: [localFontAssetsPlugin()],
  optimizeDeps: { exclude: ["@excalidraw/excalidraw"] },
});
