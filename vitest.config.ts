import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    include: [
      "automation_tests/unit/**/*.{test,spec}.{ts,tsx}",
      "automation_tests/api/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "automation_tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "lib/services/**",
        "app/api/**",
        "components/**",
        "!components/ui/**",
        // Admin content API — verified manually (TC-M003), not by automated route tests.
        "!app/api/admin/**",
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
