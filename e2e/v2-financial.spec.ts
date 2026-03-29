import { test, expect } from "@playwright/test";

test.describe("V2: Invoices & Pay Rates", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/agency/invoices");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("pay rates settings page loads", async ({ page }) => {
    await page.goto("/agency/settings/pay-rates");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("invoices nav item exists", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("link", { name: /Invoices/i })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/agency/settings");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });
});
