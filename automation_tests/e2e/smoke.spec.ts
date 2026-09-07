import { test, expect } from "@playwright/test";

test("browser launches and page object is not null", async ({ page }) => {
  // Navigate to a blank page — no dev server required
  await page.goto("about:blank");
  expect(page).not.toBeNull();
});

test("home page loads and title is present", async ({ page }) => {
  await page.goto("/");
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});
