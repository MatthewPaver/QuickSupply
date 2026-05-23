import { test, expect } from "@playwright/test";

test.describe("V2: Agency Search", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("search trigger button exists on dashboard", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /search/i })).toBeVisible();
  });

  test("search API returns JSON", async ({ request, context }) => {
    // Authenticate via cookie first
    const loginPage = await request.get("/login");
    expect(loginPage.ok()).toBeTruthy();

    const response = await request.get("/api/agency/search?q=test");
    expect(response.status()).toBeLessThan(500);
    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toContain("json");
  });
});
