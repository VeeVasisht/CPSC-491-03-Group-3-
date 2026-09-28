import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}"],
    exclude: [
      "**/*.integration.test.ts",
      "node_modules/**",
    ],
  },
});