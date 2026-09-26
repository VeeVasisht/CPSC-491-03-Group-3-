import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    // react-router's Vite plugin injects a "preamble" that only works
    // during its own dev/build flow. Under Vitest, swap it out for the
    // plain React plugin so components still transform/HMR correctly.
    process.env.VITEST ? react() : reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
  },
});