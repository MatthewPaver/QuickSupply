import { test, expect } from "@playwright/test";

test.describe("V2: Agency Analytics", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("analytics landing page loads with metric cards", async ({ page }) => {
    await page.goto("/agency/analytics");
    await expect(page.getByRole("heading", { name: /Analytics/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Fill Rate")).toBeVisible();
    await expect(page.getByText("Avg Response Time")).toBeVisible();
    await expect(page.getByText("Teacher Utilisation")).toBeVisible();
    await expect(page.getByText("School Satisfaction")).toBeVisible();
    await expect(page.getByText("Cancellation Rate")).toBeVisible();
    await expect(page.getByText("Gross Margin")).toBeVisible();
  });

  test("fill rate drill-down loads", async ({ page }) => {
    await page.goto("/agency/analytics/fill-rate");
    await expect(page.getByRole("heading", { name: /Fill Rate/i })).toBeVisible({ timeout: 5000 });
  });

  test("response time drill-down loads", async ({ page }) => {
    await page.goto("/agency/analytics/response-time");
    await expect(page.getByRole("heading", { name: /Response Time/i })).toBeVisible({ timeout: 5000 });
  });

  test("utilization drill-down loads", async ({ page }) => {
    await page.goto("/agency/analytics/utilization");
    await expect(page.getByRole("heading", { name: /Utilisation/i })).toBeVisible({ timeout: 5000 });
  });

  test("satisfaction drill-down loads", async ({ page }) => {
    await page.goto("/agency/analytics/satisfaction");
    await expect(page.getByRole("heading", { name: /Satisfaction/i })).toBeVisible({ timeout: 5000 });
  });

  test("margins drill-down loads", async ({ page }) => {
    await page.goto("/agency/analytics/margins");
    await expect(page.getByRole("heading", { name: /Margin/i })).toBeVisible({ timeout: 5000 });
  });

  test("date filter is present on analytics pages", async ({ page }) => {
    await page.goto("/agency/analytics");
    await expect(page.getByRole("button", { name: /Apply/i })).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test("analytics nav item exists in sidebar", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("link", { name: /Analytics/i })).toBeVisible();
  });
});
