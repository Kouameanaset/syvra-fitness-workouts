// Vite = the dev server + bundler. "defineConfig" comes from vitest/config so
// the same file can also hold the test settings (the "test" block).
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // lets Vite understand JSX/TSX and enables fast refresh
  test: {
    environment: "jsdom", // a fake browser (document, window) for the tests
    setupFiles: ["./src/test/setup.ts"],
  },
});
