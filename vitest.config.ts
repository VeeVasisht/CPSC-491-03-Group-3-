import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}"],
    exclude: ["**/*.integration.test.ts", "node_modules/**"],
  },
});