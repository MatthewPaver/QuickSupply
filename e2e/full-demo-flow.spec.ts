import { test, expect, type Page } from "@playwright/test";

async function quickLogin(page: Page, userName: RegExp) {
  await page.goto("/login");
  const button = page.getByRole("button", { name: userName }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
  // Wait for login POST to complete and redirect to a dashboard
  await page.waitForURL(/\/(school|teacher|agency)\//, { timeout: 15000 });
}

async function signOut(page: Page) {
  const signOutButton = page.getByRole("button", { name: /sign out/i }).first();
  await expect(signOutButton).toBeVisible({ timeout: 10000 });
  await signOutButton.click();
  await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
}

test.describe("QuickSupply full demo flow", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "cookie_consent", value: "1", domain: "localhost", path: "/" },
      { name: "cookie_consent", value: "1", domain: "127.0.0.1", path: "/" },
    ]);
  });

  test("school creates request, agency assigns, teacher accepts, school sees filled", async ({ page }) => {
    test.setTimeout(180000);
    const note = `E2E-FLOW-${Date.now()}`;
    const startTime = "09:15";
    const endTime = "14:45";

    // School: create a new request.
    await quickLogin(page, /Mersey View Primary \(demo\)/i);
    console.log("E2E stage: school signed in");
    await expect(page).toHaveURL(/\/school\/dashboard/, { timeout: 10000 });
    await page.getByRole("link", { name: /New Request/i }).first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/school\/requests\/new/, { timeout: 10000 });
    console.log("E2E stage: request form open");

    await page.locator("button.rdp-day_button:not([disabled])").first().click();

    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Teacher" }).click();

    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Year 4" }).click();

    await page.locator('input[type="time"]').nth(0).fill(startTime);
    await page.locator('input[type="time"]').nth(1).fill(endTime);
    await page.getByPlaceholder(/^For example: Year 4 class/).fill(note);

    const createRequestResponse = page.waitForResponse(
      (res) => res.url().includes("/api/requests") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Submit Cover Request/i }).click();
    const response = await createRequestResponse;
    expect(response.ok()).toBeTruthy();
    const created = (await response.json()) as { id: string };
    expect(created.id).toBeTruthy();
    const requestId = created.id;
    console.log("E2E stage: request created");

    await expect(page).toHaveURL(/\/school\/requests/, { timeout: 10000 });
    const schoolRow = page.locator(".divide-y > div").filter({ hasText: note });
    await expect(schoolRow).toHaveCount(1);
    await expect(schoolRow).toBeVisible({ timeout: 10000 });
    await expect(schoolRow).toContainText(/pending/i);
    await signOut(page);

    // Agency: open request and manually assign Sarah Johnson.
    await quickLogin(page, /Sarah Mitchell/i);
    console.log("E2E stage: agency signed in");
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 10000 });
    await page.goto(`/agency/requests/${requestId}`);
    await expect(page).toHaveURL(new RegExp(`/agency/requests/${requestId}$`), { timeout: 10000 });
    await expect(page.getByText("Request Details")).toBeVisible({ timeout: 10000 });

    const assignSarah = page.getByRole("button", { name: /Assign Sarah Johnson/i });
    await expect(assignSarah).toBeVisible({ timeout: 15000 });
    await assignSarah.click();
    console.log("E2E stage: teacher assigned through UI");
    await expect(page.getByRole("button", { name: /Withdraw offer/i })).toBeVisible({ timeout: 10000 });
    await signOut(page);

    // Teacher: accept the offer.
    await quickLogin(page, /Sarah Johnson/i);
    console.log("E2E stage: teacher signed in");
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 10000 });
    await page.getByRole("link", { name: /Jobs/i }).first().click();
    await expect(page).toHaveURL(/\/teacher\/jobs/, { timeout: 10000 });

    const targetOffer = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Mersey View Primary (demo)" })
      .filter({ hasText: `${startTime} - ${endTime}` });

    await expect(targetOffer).toHaveCount(1);
    await expect(targetOffer).toBeVisible({ timeout: 15000 });
    const acceptButton = targetOffer.getByRole("button", { name: /^Accept$/ }).first();
    await expect(acceptButton).toBeVisible({ timeout: 15000 });
    await acceptButton.click();
    await page.getByRole("button", { name: /Confirm Accept/i }).click();
    console.log("E2E stage: offer accepted");

    // Wait for the accept action to complete (confirmation dialog closes)
    await expect(page.getByRole("button", { name: /Confirm Accept/i })).not.toBeVisible({ timeout: 10000 });
    await signOut(page);

    // Agency: request is now filled with current booking.
    await quickLogin(page, /Sarah Mitchell/i);
    await page.goto(`/agency/requests/${requestId}`);
    await expect(page.getByText(/^Filled$/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Current Booking")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Sarah Johnson/i).first()).toBeVisible({ timeout: 15000 });
    await signOut(page);

    // School: request appears filled.
    await quickLogin(page, /Mersey View Primary \(demo\)/i);
    await page.goto("/school/requests");
    const filledRow = page.locator(".divide-y > div").filter({ hasText: note });
    await expect(filledRow).toHaveCount(1);
    await expect(filledRow).toBeVisible({ timeout: 15000 });
    await expect(filledRow).toContainText(/filled/i);
  });
});
