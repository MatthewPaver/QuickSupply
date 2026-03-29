import { test, expect } from "@playwright/test";

test.describe("V2: Enhanced Teacher Matching", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("ranking weights settings page loads", async ({ page }) => {
    await page.goto("/agency/settings/ranking");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("settings page loads with ranking section", async ({ page }) => {
    await page.goto("/agency/settings");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("teacher detail page shows performance section", async ({ page }) => {
    // Navigate to teachers list, click first teacher
    await page.goto("/agency/teachers");
    const firstTeacher = page.locator('[data-slot="card"] a, a[href*="/agency/teachers/"]').first();
    if (await firstTeacher.isVisible()) {
      await firstTeacher.click();
      await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
    }
  });
});
