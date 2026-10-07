import { test, expect } from "@playwright/test";

test.describe("V2: School Request Templates", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Mersey View Primary \(demo\)/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/school\/dashboard/, { timeout: 10000 });
  });

  test("new request page shows template selector", async ({ page }) => {
    await page.goto("/school/requests/new");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/template/i)).toBeVisible({ timeout: 5000 });
  });

  test("school analytics page loads", async ({ page }) => {
    await page.goto("/school/analytics");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
  });
});
