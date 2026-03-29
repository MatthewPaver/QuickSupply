import { test, expect } from "@playwright/test";

test.describe("V2: PWA", () => {
  test("manifest.json is accessible", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe("QuickSupply");
    expect(manifest.display).toBe("standalone");
  });

  test("service worker file is accessible", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("install");
  });

  test("HTML includes manifest link", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveAttribute("href", "/manifest.json");
  });

  test("HTML includes theme-color meta", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveAttribute("content", "#4c0673");
  });
});
