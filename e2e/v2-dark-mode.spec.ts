import { test, expect } from "@playwright/test";

test.describe("V2: Dark Mode", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
  });

  test("landing page has theme toggle button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /theme|dark|light|mode/i })).toBeVisible();
  });

  test("html element can receive dark class", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });

    // Toggle dark mode by clicking the theme button
    const themeButton = page.getByRole("button", { name: /theme|dark|light|mode/i });
    await themeButton.click();

    // Verify the html element has the "dark" class applied
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });
});
