// https://vite.dev/config/
/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/testConfig.ts"],
    coverage: {
      provider: "v8",
      exclude: ["*.config.(j|t)s"],
      all: true,
    },
  },
  plugins: [react()],
  build: {
    target: "esnext",
  },
});
