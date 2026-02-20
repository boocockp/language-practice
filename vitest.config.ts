import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["convex/**", "edge-runtime"],
      ["**", "jsdom"],
    ],
    server: { deps: { inline: ["convex-test"] } },
  },
});
