import { test, expect } from "@playwright/test";

test.describe("V2: Compliance Management", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Mitchell/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
  });

  test("compliance dashboard loads", async ({ page }) => {
    await page.goto("/agency/compliance");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("compliance documents page loads", async ({ page }) => {
    await page.goto("/agency/compliance/documents");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 5000 });
  });

  test("compliance nav item exists in sidebar", async ({ page }) => {
    await page.goto("/agency/dashboard");
    await expect(page.getByRole("link", { name: /Compliance/i })).toBeVisible();
  });
});

test.describe("V2: Teacher Document Upload", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Sarah Johnson/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
  });

  test("teacher profile loads", async ({ page }) => {
    await page.goto("/teacher/profile");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
  });
});
