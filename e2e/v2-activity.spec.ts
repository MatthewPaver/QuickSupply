import { test, expect } from "@playwright/test";

test.describe("V2: Agency Activity Log", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("activity log page loads", async ({ page }) => {
    await page.goto("/agency/activity");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
  });

  test("activity nav item exists in sidebar", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("link", { name: /Activity/i })).toBeVisible();
  });
});
