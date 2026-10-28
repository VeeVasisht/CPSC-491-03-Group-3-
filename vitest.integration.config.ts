import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.integration.test.ts", "app/**/*.integration.test.tsx"],
    exclude: ["node_modules/**"],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});