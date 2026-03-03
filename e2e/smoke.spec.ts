import { test, expect } from "@playwright/test";

/**
 * Smoke E2E: login and key portals load. Requires dev server (or BASE_URL) and seeded DB.
 */
test.describe("QuickSupply smoke", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
  });

  async function quickLogin(page: import("@playwright/test").Page, userName: RegExp) {
    await page.goto("/login");
    const button = page.getByRole("button", { name: userName }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click();
  }

  test("landing and login page load", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/QuickSupply|Desian/);
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /QuickSupply|Demo/i })).toBeVisible({ timeout: 5000 });
  });

  test("teacher login and dashboard load without hydration error", async ({ page }) => {
    await quickLogin(page, /Sarah Johnson/i);
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({ timeout: 5000 });
  });

  test("school login and dashboard load", async ({ page }) => {
    await quickLogin(page, /St\. Mary's Catholic Primary/i);
    await expect(page).toHaveURL(/\/school\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
  });

  test("agency login and dashboard load", async ({ page }) => {
    await quickLogin(page, /Sarah Mitchell/i);
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
  });
});
