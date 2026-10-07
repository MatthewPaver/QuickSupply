import { test, expect } from "@playwright/test";

// The theme toggle lives in the signed-in app shell (school, agency, teacher layouts),
// not on the public landing page.
test.describe("V2: Dark Mode", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
    await page.goto("/login");
    const button = page.getByRole("button", { name: /Mersey View Primary \(demo\)/i }).first();
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    await expect(page).toHaveURL(/\/school\/dashboard/, { timeout: 10000 });
  });

  test("app shell has a theme toggle button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /switch to (light|dark|system) mode/i }).first()).toBeVisible();
  });

  test("html element can receive dark class", async ({ page }) => {
    const html = page.locator("html");
    // Toggle cycles light -> dark -> system; at most three clicks reach dark from any start.
    for (let i = 0; i < 3 && !((await html.getAttribute("class")) ?? "").includes("dark"); i++) {
      await page.getByRole("button", { name: /switch to (light|dark|system) mode/i }).first().click();
    }
    await expect(html).toHaveClass(/\bdark\b/);
  });
});
