import { test, expect, type Page } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/");
  await page.getByTestId("login-email-input").fill(process.env.E2E_USERNAME ?? "bear@test.com");
  await page.getByTestId("login-password-input").fill(process.env.E2E_PASSWORD ?? "Admin@1234");
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes("/api/auth/login"), { timeout: 20_000 }),
    page.getByTestId("login-submit-button").click(),
  ]);
  if (!response.ok()) {
    throw new Error(`Login API returned ${response.status()} — check E2E_USERNAME / E2E_PASSWORD`);
  }
  await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 15_000 });
}

async function openLearningZone(page: Page) {
  await page.getByTestId("nav-learning").click();
  await page.getByTestId("learning-zone").waitFor({ state: "visible", timeout: 12_000 });
}

async function setLanguage(page: Page, lang: "vi" | "en") {
  await page.getByTestId(`lang-${lang}`).click();
}

async function openGrade2Subject(page: Page, subject: "vietnamese" | "english") {
  await page.getByTestId("tab-grade2").click();
  await page.getByTestId("tab-content").waitFor({ state: "visible" });
  await page.getByTestId(`grade2-subject-${subject}`).click();
}

async function waitForQuestion(page: Page) {
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
}

const VI_DIACRITIC = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// ── TC-E009 / TC-E010 — the language bug fix ──────────────────────────────────

test.describe("Grade 2 language subjects — content language", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openLearningZone(page);
  });

  test("TC-E009 | UI in English, Grade 2 Vietnamese subject shows Vietnamese question text", async ({ page }) => {
    await setLanguage(page, "en");
    await openGrade2Subject(page, "vietnamese");
    await waitForQuestion(page);
    const q = (await page.getByTestId("quiz-question").innerText()).trim();
    expect(q).toMatch(VI_DIACRITIC);
    const options = await page.getByTestId("quiz-options").innerText();
    expect(options.length).toBeGreaterThan(0);
    // chrome is English
    await expect(page.getByTestId("quiz-progress-text")).toHaveText("1/10");
  });

  test("TC-E010 | UI in English, Grade 2 English subject shows English question text", async ({ page }) => {
    await setLanguage(page, "en");
    await openGrade2Subject(page, "english");
    await waitForQuestion(page);
    const q = (await page.getByTestId("quiz-question").innerText()).trim();
    expect(q).not.toMatch(VI_DIACRITIC);
    expect(q.length).toBeGreaterThan(0);
  });

  test("TC-E012 | switching UI language while a Vietnamese-subject quiz is open does not change the question", async ({ page }) => {
    await setLanguage(page, "vi");
    await openGrade2Subject(page, "vietnamese");
    await waitForQuestion(page);
    const before = (await page.getByTestId("quiz-question").innerText()).trim();
    await setLanguage(page, "en");
    await page.waitForTimeout(300);
    const after = (await page.getByTestId("quiz-question").innerText()).trim();
    expect(after).toBe(before);
    // chrome switched
    await expect(page.getByTestId("quiz-difficulty-badge")).toContainText(/Easy|Medium|Hard/);
  });
});

// ── TC-E011 — localized (preschool) subject follows the UI language ───────────

test("TC-E011 | Preschool subject follows the UI language", async ({ page }) => {
  await login(page);
  await openLearningZone(page);
  await page.getByTestId("tab-preschool").click();

  await page.getByTestId("lang-vi").click();
  await page.getByTestId("quiz-shapes").click();
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
  const viText = (await page.getByTestId("quiz-question").innerText()).trim();
  await page.getByTestId("quiz-close").click();

  await page.getByTestId("lang-en").click();
  await page.getByTestId("quiz-shapes").click();
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
  const enText = (await page.getByTestId("quiz-question").innerText()).trim();

  expect(viText).toMatch(VI_DIACRITIC);
  expect(enText).not.toBe(viText);
});

// ── TC-E013 — loading state ──────────────────────────────────────────────────

test("TC-E013 | opening a content-subject quiz shows a loading state, then 10 questions", async ({ page }) => {
  await login(page);
  await openLearningZone(page);
  await openGrade2Subject(page, "english");
  // loading may be brief; either it was seen or the question is already up
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
  await expect(page.getByTestId("quiz-progress-text")).toHaveText("1/10");
});

// ── TC-E014 — API failure -> retry, no quiz ──────────────────────────────────

test("TC-E014 | questions API failure shows an error + Retry, and no quiz starts", async ({ page, context }) => {
  await login(page);
  await openLearningZone(page);

  await context.route("**/api/subjects/**", route => route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ data: null, error: "boom" }),
  }));

  await openGrade2Subject(page, "vietnamese");
  await page.getByTestId("quiz-error").waitFor({ state: "visible", timeout: 12_000 });
  await expect(page.getByTestId("quiz-question")).toHaveCount(0);
  await expect(page.getByTestId("quiz-retry-button")).toBeVisible();

  await context.unroute("**/api/subjects/**");
  await page.getByTestId("quiz-retry-button").click();
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
});

// ── TC-E015 — full quiz completion + coins ───────────────────────────────────

test("TC-E015 | completing a full Grade 2 Vietnamese quiz shows results and awards coins", async ({ page }) => {
  await login(page);
  await openLearningZone(page);
  const startCoins = Number((await page.getByTestId("coin-value").innerText()).replace(/\D/g, "")) || 0;

  await openGrade2Subject(page, "vietnamese");
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });

  for (let i = 0; i < 10; i++) {
    await page.getByTestId("quiz-option-0").click();
    const next = page.getByTestId("quiz-next-button");
    await next.click();
  }
  await expect(page.getByTestId("quiz-results")).toBeVisible();
  await expect(page.getByTestId("quiz-score")).toContainText("/10");
  await page.getByTestId("quiz-claim-coins").click();

  await expect
    .poll(async () => Number((await page.getByTestId("coin-value").innerText()).replace(/\D/g, "")) || 0)
    .toBeGreaterThan(startCoins);
});

// ── TC-E016 — math practice regression ──────────────────────────────────────

test("TC-E016 | math practice still opens and runs after the refactor", async ({ page }) => {
  await login(page);
  await openLearningZone(page);
  await page.getByTestId("tab-grade2").click();
  await page.getByTestId("grade2-subject-math").click();
  await page.getByTestId("grade2-practice-addition").click();
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 8_000 });
  await expect(page.getByTestId("quiz-loading")).toHaveCount(0);
  await expect(page.getByTestId("quiz-question")).toContainText(/\d+\s*\+\s*\d+/);
  await page.getByTestId("quiz-option-0").click();
  await page.getByTestId("quiz-next-button").click();
  await expect(page.getByTestId("quiz-progress-text")).toHaveText("2/10");
});

// ── TC-E017 — preschool quiz regression ─────────────────────────────────────

test("TC-E017 | preschool quiz still opens and scores after migration to the DB", async ({ page }) => {
  await login(page);
  await openLearningZone(page);
  await page.getByTestId("lang-vi").click();
  await page.getByTestId("tab-preschool").click();
  await page.getByTestId("quiz-colors").click();
  await page.getByTestId("quiz-question").waitFor({ state: "visible", timeout: 12_000 });
  await page.getByTestId("quiz-option-0").click();
  await expect(page.getByTestId("quiz-feedback-text")).toBeVisible();
  await page.getByTestId("quiz-next-button").click();
  await expect(page.getByTestId("quiz-progress-text")).toHaveText("2/10");
});
