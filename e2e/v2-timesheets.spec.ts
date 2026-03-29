import { test, expect } from "@playwright/test";

test.describe("V2: Agency Timesheets", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("agency timesheets page loads", async ({ page }) => {
    await page.goto("/agency/timesheets");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("timesheets page has status filter tabs", async ({ page }) => {
    await page.goto("/agency/timesheets");
    await expect(page.getByRole("link", { name: /Submitted/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Approved/i })).toBeVisible();
  });

  test("timesheets nav item exists", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("link", { name: /Timesheets/i })).toBeVisible();
  });
});

test.describe("V2: Teacher Timesheets", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Johnson/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
  });

  test("teacher timesheets page loads", async ({ page }) => {
    await page.goto("/teacher/timesheets");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("timesheets nav item exists in teacher nav", async ({ page }) => {
    await page.goto("/teacher/dashboard");
    await expect(page.getByRole("link", { name: /Timesheets/i })).toBeVisible();
  });
});
