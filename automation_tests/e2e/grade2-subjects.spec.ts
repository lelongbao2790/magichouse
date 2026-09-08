import { test, expect, type Page } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/");
  await page.getByTestId("login-email-input").fill(process.env.E2E_USERNAME ?? "bear@test.com");
  await page.getByTestId("login-password-input").fill(process.env.E2E_PASSWORD ?? "Admin@1234");
  // Wait for the login API response concurrently with the click so we know auth
  // completed (not silently timed out) before waiting for the React re-render.
  const [response] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes("/api/auth/login"),
      { timeout: 20_000 },
    ),
    page.getByTestId("login-submit-button").click(),
  ]);
  if (!response.ok()) {
    throw new Error(`Login API returned ${response.status()} — check E2E_USERNAME / E2E_PASSWORD secrets`);
  }
  // Two React render cycles are needed after setPlayer() before the dashboard
  // div appears; WebKit is slower through this path — 15 s is sufficient.
  await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 15_000 });
}

async function openLearningZone(page: Page) {
  await page.getByTestId("nav-learning").click();
  await page.getByTestId("learning-zone").waitFor({ state: "visible", timeout: 12_000 });
}

async function goToGrade2Tab(page: Page) {
  await page.getByTestId("tab-grade2").click();
  await page.getByTestId("tab-content").waitFor({ state: "visible" });
}

// ── Grade 2 subject card list ─────────────────────────────────────────────────

test.describe("Grade 2 — subject card list", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
  });

  test("TC-E001 | Grade 2 tab shows Math, Vietnamese, and English subject cards", async ({ page }) => {
    await expect(page.getByTestId("grade2-subject-math")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-vietnamese")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-english")).toBeVisible();
  });

  test("TC-E002 | Grade 2 subject list does not show practice cards at top level", async ({ page }) => {
    await expect(page.getByTestId("grade2-practice-addition")).not.toBeVisible();
    await expect(page.getByTestId("grade2-practice-subtraction")).not.toBeVisible();
    await expect(page.getByTestId("grade2-practice-timesTable")).not.toBeVisible();
  });
});

// ── Grade 2 Math drill-down ───────────────────────────────────────────────────

test.describe("Grade 2 — Math drill-down", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
    await page.getByTestId("grade2-subject-math").click();
  });

  test("TC-E003 | Math drill-down shows back button and Addition, Subtraction, Times Table cards", async ({ page }) => {
    await expect(page.getByTestId("grade2-math-back")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-addition")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-subtraction")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-timesTable")).toBeVisible();
  });

  test("TC-E004 | Back button from Math drill-down returns to subject card list", async ({ page }) => {
    await page.getByTestId("grade2-math-back").click();
    await expect(page.getByTestId("grade2-subject-math")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-vietnamese")).toBeVisible();
    await expect(page.getByTestId("grade2-subject-english")).toBeVisible();
    await expect(page.getByTestId("grade2-practice-addition")).not.toBeVisible();
  });

  test("TC-E005 | Re-entering Math after pressing Back still shows all practice cards", async ({ page }) => {
    await page.getByTestId("grade2-math-back").click();
    await page.getByTestId("grade2-subject-math").click();
    await expect(page.getByTestId("grade2-practice-addition")).toBeVisible();
  });
});

// ── Difficulty badge ──────────────────────────────────────────────────────────

test.describe("Grade 2 — difficulty badge in quiz", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await goToGrade2Tab(page);
    await page.getByTestId("grade2-subject-math").click();
  });

  test("TC-E006 | Difficulty badge is visible on the first Addition quiz question with a valid label", async ({ page }) => {
    await page.getByTestId("grade2-practice-addition").click();
    await page.getByTestId("quiz-difficulty-badge").waitFor({ state: "visible", timeout: 5_000 });
    const text = await page.getByTestId("quiz-difficulty-badge").innerText();
    expect(["Dễ", "Vừa", "Khó", "Easy", "Medium", "Hard"].some((l) => text.includes(l))).toBe(true);
  });
});

// ── Backward compatibility ────────────────────────────────────────────────────

test.describe("Backward compatibility — Preschool tab", () => {
  test("TC-E007 | Preschool tab still renders category cards after Grade 2 changes", async ({ page }) => {
    await login(page);
    await openLearningZone(page);
    await page.getByTestId("tab-preschool").click();
    const cards = page.locator("[data-testid^='quiz-']");
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
  });
});
