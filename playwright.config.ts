import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./automation_tests/e2e",
  outputDir: "./test-results",
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    headless: true,
    screenshot: "off",
    video: "off",
    trace: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});

/*
 * CI integration steps (in order):
 * 1. bun install --frozen-lockfile
 * 2. npx playwright install --with-deps
 * 3. Start dev server: bun dev & npx wait-on http://localhost:3000
 * 4. npx playwright test
 */
