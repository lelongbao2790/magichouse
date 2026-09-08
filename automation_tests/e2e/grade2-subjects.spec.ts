import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page) {
  await page.goto("/");
  await page.getByTestId("login-email-input").fill(process.env.E2E_USERNAME ?? "bear@test.com");
  await page.getByTestId("login-password-input").fill(process.env.E2E_PASSWORD ?? "Admin@1234");
  await page.getByTestId("login-submit-button").click();
  await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 10_000 });
}

async function openLearningZone(page: Page) {
  await page.getByTestId("nav-learning").click();
  await page.getByTestId("learning-zone").waitFor({ state: "visible", timeout: 8_000 });
}

async function goToGrade2Tab(page: Page) {
  await page.getByTestId("tab-grade2").click();
  await page.getByTestId("tab-content").waitFor({ state: "visible" });
}

// ---------------------------------------------------------------------------
// Grade 2 subject navigation
// ---------------------------------------------------------------------------

test.describe("Grade 2 — subject card list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
  });

  test("shows three subject cards: Math, Vietnamese, English", async ({ page }) => {
    await expect(page.getByTestId("grade2-subject-math")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-vietnamese")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-english")).toBeVisible();
  });

  test("does NOT show Math practice cards at top level", async ({ page }) => {
    await expect(page.getByTestId("grade2-practice-addition")).not.toBeVisible();
    await expect(page.getByTestId("grade2-practice-subtraction")).not.toBeVisible();
    await expect(page.getByTestId("grade2-practice-timesTable")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Math drill-down
// ---------------------------------------------------------------------------

test.describe("Grade 2 — Math drill-down", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
    await page.getByTestId("grade2-subject-math").click();
  });

  test("shows back button and three practice cards after clicking Math", async ({ page }) => {
    await expect(page.getByTestId("grade2-math-back")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-addition")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-subtraction")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-timesTable")).toBeVisible();
  });

  test("back button returns to subject list", async ({ page }) => {
    await page.getByTestId("grade2-math-back").click();
    await expect(page.getByTestId("grade2-subject-math")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-vietnamese")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-english")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-addition")).not.toBeVisible();
  });

  test("re-entering Math after Back still shows practice cards", async ({ page }) => {
    await page.getByTestId("grade2-math-back").click();
    await page.getByTestId("grade2-subject-math").click();
    await expect(page.getByTestId("grade2-practice-addition")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Difficulty badge
// ---------------------------------------------------------------------------

test.describe("Grade 2 — difficulty badge in quiz", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
    await page.getByTestId("grade2-subject-math").click();
  });

  test("difficulty badge is visible on first Addition question", async ({ page }) => {
    await page.getByTestId("grade2-practice-addition").click();
    // Quiz modal opens — wait for first question
    await page.getByTestId("quiz-difficulty-badge").waitFor({ state: "visible", timeout: 5_000 });
    const badge = page.getByTestId("quiz-difficulty-badge");
    await expect(badge).toBeVisible();
    // Badge text should be one of the three known difficulty labels
    const text = await badge.innerText();
    expect(["Dễ", "Vừa", "Khó", "Easy", "Medium", "Hard"].some((l) => text.includes(l))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Backward compatibility — Preschool still works
// ---------------------------------------------------------------------------

test.describe("Backward compatibility — Preschool tab", () => {
  test("Preschool tab still renders category cards", async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await page.getByTestId("tab-preschool").click();
    // At least one preschool card should be present (shapes, colors, or animals)
    const cards = page.locator("[data-testid^='quiz-']");
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
  });
});
