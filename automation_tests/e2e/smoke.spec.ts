import { test, expect } from "@playwright/test";

test("TC-E008 | Browser launches successfully and page object is not null", async ({ page }) => {
  await page.goto("about:blank");
  expect(page).not.toBeNull();
});

test("TC-E009 | Home page loads and has a non-empty title", async ({ page }) => {
  await page.goto("/");
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});
