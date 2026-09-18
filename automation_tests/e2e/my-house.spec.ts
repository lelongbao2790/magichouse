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

// A freshly registered player (0 coins, 0 owned house items — the players table
// default), used for TC-E021/TC-E025 which need a known "nothing yet" starting state.
async function registerFreshPlayer(page: Page) {
  const email = `myhouse-${Date.now()}-${Math.floor(Math.random() * 100_000)}@test.com`;
  await page.goto("/");
  await page.getByTestId("login-navigate-register").click();
  await page.getByTestId("register-name-input").fill("My House Tester");
  await page.getByTestId("register-email-input").fill(email);
  await page.getByTestId("register-password-input").fill("Admin@1234");
  await page.getByTestId("register-submit-button").click();
  await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 15_000 });
}

// Tops up the logged-in player's coin balance via the existing /api/players/coins
// endpoint (Q5=A) — reuses the page's own authenticated context, no UI flow needed.
async function topUpCoins(page: Page, amount: number) {
  await page.request.post("/api/players/coins", { data: { amount } });
}

async function openMyHouse(page: Page) {
  await page.getByTestId("nav-house").click();
  await page.getByTestId("my-house").waitFor({ state: "visible", timeout: 10_000 });
}

async function coinValue(page: Page): Promise<number> {
  const text = await page.getByTestId("coin-value").innerText();
  return Number(text.replace(/\D/g, "")) || 0;
}

// Drags a source element (identified by testid) and drops it centered over a target
// element — models a MyItemsStrip -> BedroomCanvas drop via raw mouse events, since
// the drag mechanic is Framer Motion pointer-based, not native HTML5 drag-and-drop.
async function dragOnto(page: Page, sourceTestId: string, targetTestId: string) {
  const sourceBox = await page.getByTestId(sourceTestId).boundingBox();
  const targetBox = await page.getByTestId(targetTestId).boundingBox();
  if (!sourceBox || !targetBox) throw new Error(`boundingBox missing for ${sourceTestId}/${targetTestId}`);

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

// Drags an already-placed item (identified by testid) by a pixel offset, staying
// within the given canvas's bounds — models a reposition drag.
async function dragWithinCanvas(page: Page, sourceTestId: string, canvasTestId: string, dx: number, dy: number) {
  const sourceBox = await page.getByTestId(sourceTestId).boundingBox();
  const canvasBox = await page.getByTestId(canvasTestId).boundingBox();
  if (!sourceBox || !canvasBox) throw new Error(`boundingBox missing for ${sourceTestId}/${canvasTestId}`);

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = Math.min(Math.max(startX + dx, canvasBox.x + 10), canvasBox.x + canvasBox.width - 10);
  const endY = Math.min(Math.max(startY + dy, canvasBox.y + 10), canvasBox.y + canvasBox.height - 10);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();
}

// ── TC-E018 ───────────────────────────────────────────────────────────────────

test("TC-E018 | Opening My House shows the Bedroom by default with the coin balance visible", async ({ page }) => {
  await login(page);
  await openMyHouse(page);

  await expect(page.getByTestId("room-bedroom")).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("coin-display")).toBeVisible();
  expect(await coinValue(page)).toBeGreaterThanOrEqual(0);
  await expect(page.getByTestId("house-items-grid")).toBeVisible();
});

// ── TC-E019 ───────────────────────────────────────────────────────────────────

test("TC-E019 | Kitchen, Living Room, and Garden show as locked and are not interactive", async ({ page }) => {
  await login(page);
  await openMyHouse(page);

  for (const roomTestId of ["room-kitchen", "room-living-room", "room-garden"]) {
    await expect(page.getByTestId(roomTestId)).toHaveAttribute("data-locked", "true");
  }

  await page.getByTestId("room-kitchen").click({ force: true });
  await expect(page.getByTestId("room-bedroom")).toHaveAttribute("data-active", "true");
});

// ── TC-E020 ───────────────────────────────────────────────────────────────────

test("TC-E020 | Buying an affordable item deducts coins and moves it into My Items", async ({ page }) => {
  await registerFreshPlayer(page);
  await topUpCoins(page, 200);
  await openMyHouse(page);

  const startCoins = await coinValue(page);
  await page.getByTestId("buy-house-lamp").click();
  await page.getByTestId("my-item-lamp").waitFor({ state: "visible", timeout: 10_000 });

  await expect.poll(() => coinValue(page)).toBe(startCoins - 40);
  await expect(page.getByTestId("house-item-lamp")).toHaveAttribute("data-owned", "true");
  await expect(page.getByTestId("my-items-house").getByTestId("my-item-lamp")).toBeVisible();
});

// ── TC-E021 ───────────────────────────────────────────────────────────────────

test("TC-E021 | Purchase is blocked when the player cannot afford the item", async ({ page }) => {
  await registerFreshPlayer(page);
  await openMyHouse(page);

  expect(await coinValue(page)).toBe(0);
  await expect(page.getByTestId("buy-house-lamp")).toBeDisabled();

  await page.getByTestId("buy-house-lamp").click({ force: true });

  expect(await coinValue(page)).toBe(0);
  await expect(page.getByTestId("house-item-lamp")).toHaveAttribute("data-owned", "false");
  await expect(page.getByTestId("my-items-house").getByTestId("my-item-lamp")).toHaveCount(0);
});

// ── TC-E022 ───────────────────────────────────────────────────────────────────

test("TC-E022 | Dragging an owned item onto the Bedroom places it, and it can be moved", async ({ page }) => {
  await registerFreshPlayer(page);
  await topUpCoins(page, 200);
  await openMyHouse(page);

  await page.getByTestId("buy-house-lamp").click();
  await page.getByTestId("my-item-lamp").waitFor({ state: "visible", timeout: 10_000 });

  await dragOnto(page, "my-item-lamp", "bedroom-canvas");
  await page.getByTestId("placed-house-lamp").waitFor({ state: "visible", timeout: 10_000 });
  const styleAfterPlace = await page.getByTestId("placed-house-lamp").getAttribute("style");

  await dragWithinCanvas(page, "placed-house-lamp", "bedroom-canvas", 80, 80);
  await expect
    .poll(() => page.getByTestId("placed-house-lamp").getAttribute("style"))
    .not.toBe(styleAfterPlace);
});

// ── TC-E023 ───────────────────────────────────────────────────────────────────

test("TC-E023 | Removing a placed item returns it to My Items, still owned", async ({ page }) => {
  await registerFreshPlayer(page);
  await topUpCoins(page, 200);
  await openMyHouse(page);

  await page.getByTestId("buy-house-lamp").click();
  await page.getByTestId("my-item-lamp").waitFor({ state: "visible", timeout: 10_000 });
  await dragOnto(page, "my-item-lamp", "bedroom-canvas");
  await page.getByTestId("placed-house-lamp").waitFor({ state: "visible", timeout: 10_000 });

  await page.getByTestId("placed-house-lamp").click();
  await page.getByTestId("remove-house-lamp").click();

  await expect(page.getByTestId("placed-house-lamp")).toHaveCount(0);
  await expect(page.getByTestId("my-item-lamp")).toBeVisible();
});

// ── TC-E024 ───────────────────────────────────────────────────────────────────

test("TC-E024 | Reloading My House restores previously bought items and the saved layout", async ({ page }) => {
  await registerFreshPlayer(page);
  await topUpCoins(page, 300);
  await openMyHouse(page);

  await page.getByTestId("buy-house-lamp").click();
  await page.getByTestId("my-item-lamp").waitFor({ state: "visible", timeout: 10_000 });
  await page.getByTestId("buy-house-teddy_bear").click();
  await page.getByTestId("my-item-teddy_bear").waitFor({ state: "visible", timeout: 10_000 });

  await dragOnto(page, "my-item-teddy_bear", "bedroom-canvas");
  await page.getByTestId("placed-house-teddy_bear").waitFor({ state: "visible", timeout: 10_000 });
  const styleBeforeReload = await page.getByTestId("placed-house-teddy_bear").getAttribute("style");

  // Wait out the 300ms debounced autosave (BR-7) plus margin before navigating away.
  await page.waitForTimeout(600);

  await page.reload();
  await page.getByTestId("dashboard").waitFor({ state: "visible", timeout: 15_000 });
  await openMyHouse(page);

  await expect(page.getByTestId("my-item-lamp")).toBeVisible();
  await page.getByTestId("placed-house-teddy_bear").waitFor({ state: "visible", timeout: 10_000 });
  const styleAfterReload = await page.getByTestId("placed-house-teddy_bear").getAttribute("style");
  expect(styleAfterReload).toBe(styleBeforeReload);
});

// ── TC-E025 ───────────────────────────────────────────────────────────────────

test("TC-E025 | First-time player sees an empty Bedroom and empty My Items", async ({ page }) => {
  await registerFreshPlayer(page);
  await openMyHouse(page);

  await expect(page.getByTestId("bedroom-canvas").locator('[data-testid^="placed-house-"]')).toHaveCount(0);
  await expect(page.getByTestId("no-house-items-message")).toBeVisible();
});

// ── TC-E026 ───────────────────────────────────────────────────────────────────

test("TC-E026 | Coin balance stays consistent across Shop, Creative Room, and My House (regression)", async ({ page }) => {
  await registerFreshPlayer(page);
  await topUpCoins(page, 200);

  await page.getByTestId("nav-shop").click();
  await page.getByTestId("sticker-shop").waitFor({ state: "visible", timeout: 10_000 });
  const shopCoins = await coinValue(page);

  await page.getByTestId("shop-back").click();
  await page.getByTestId("dashboard").waitFor({ state: "visible" });
  await openMyHouse(page);
  expect(await coinValue(page)).toBe(shopCoins);

  await page.getByTestId("buy-house-lamp").click();
  await page.getByTestId("my-item-lamp").waitFor({ state: "visible", timeout: 10_000 });
  const houseCoinsAfterBuy = await coinValue(page);

  await page.getByTestId("house-back").click();
  await page.getByTestId("dashboard").waitFor({ state: "visible" });
  await page.getByTestId("nav-creative").click();
  await page.getByTestId("creative-room").waitFor({ state: "visible", timeout: 10_000 });

  expect(await coinValue(page)).toBe(houseCoinsAfterBuy);
});

// ── TC-E027 ───────────────────────────────────────────────────────────────────

test("TC-E027 | Dashboard navigation to and from My House works alongside existing sections (regression)", async ({ page }) => {
  await login(page);

  await page.getByTestId("nav-house").click();
  await page.getByTestId("my-house").waitFor({ state: "visible", timeout: 10_000 });
  await page.getByTestId("house-back").click();
  await page.getByTestId("main-nav").waitFor({ state: "visible" });

  const sections: Array<{ nav: string; screen: string; back: string }> = [
    { nav: "nav-shop", screen: "sticker-shop", back: "shop-back" },
    { nav: "nav-creative", screen: "creative-room", back: "creative-back" },
    { nav: "nav-learning", screen: "learning-zone", back: "learning-back" },
  ];

  for (const { nav, screen, back } of sections) {
    await page.getByTestId(nav).click();
    await page.getByTestId(screen).waitFor({ state: "visible", timeout: 10_000 });
    await page.getByTestId(back).click();
    await page.getByTestId("main-nav").waitFor({ state: "visible" });
  }

  await expect(page.getByTestId("main-nav")).toBeVisible();
  for (const nav of ["nav-shop", "nav-creative", "nav-learning", "nav-house"]) {
    await expect(page.getByTestId(nav)).toBeVisible();
  }
});
