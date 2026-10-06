import { test, expect } from "@playwright/test";

test("offline warning does not cover navigation or sign-out", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "onLine", { get: () => false }));
  await page.goto("/login");
  await page.getByRole("button", { name: /Mersey View Primary \(demo\)/i }).first().click();
  await expect(page).toHaveURL(/\/school\/dashboard/);
  // Exercise the warning's layout without disabling the local test server.
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText(/You are offline/)).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click({ timeout: 4000 });
  await expect(page).toHaveURL(/\/(login)?$/);
});
