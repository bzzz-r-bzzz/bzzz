import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      name: "PersistTool",
      entry: "./src/index.js",
      formats: ["umd", "es"],
    },
    sourcemap: true,
  },
});
