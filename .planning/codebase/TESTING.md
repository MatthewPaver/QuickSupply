# Testing

## Framework

### Playwright E2E Setup
- **Framework**: Playwright Test (`@playwright/test@^1.58.2`)
- **Configuration file**: `/Users/mattpaver/Desktop/QuickSupply/playwright.config.ts`
- **Browser**: Chromium (single browser configuration)
- **Parallelization**: Fully parallel in development, serial in CI (1 worker)
- **Retries**: 0 retries in development, 2 retries in CI environment
- **Reporter**: HTML report (generated in `/playwright-report/`)

### Configuration Details
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.CI ? undefined : {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

### Key Features
- **Web server auto-start**: Automatically starts `pnpm dev` in non-CI environments
- **Server reuse**: Uses existing server if already running (development convenience)
- **Base URL**: Configurable via `BASE_URL` environment variable
- **Trace on retry**: Captures trace on first test retry for debugging failures
- **HTML reporting**: Generated report with full details, screenshots, and video

---

## Structure

### Test File Locations
- **Directory**: `/Users/mattpaver/Desktop/QuickSupply/e2e/`
- **Test files**:
  - `smoke.spec.ts` - Basic functionality smoke tests
  - `full-demo-flow.spec.ts` - End-to-end flow tests across all roles

### File Organization
```
e2e/
├── smoke.spec.ts            # Quick smoke tests (login, page loads)
└── full-demo-flow.spec.ts   # Complete user journeys (create → assign → accept)
```

### Test Naming
- **Test suites**: `test.describe("QuickSupply smoke", () => {...})`
- **Individual tests**: `test("description of test", async ({ page }) => {...})`
- **Clear, imperative descriptions**: "teacher login and dashboard load without hydration error"

---

## Patterns

### Test Setup and Teardown
**Before each test**: Add cookie consent to avoid banner blocking
```typescript
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "cookie_consent", value: "1", domain: "localhost", path: "/" }]);
});
```

**Timeout adjustment**: Set for long-running tests (e.g., full demo flow)
```typescript
test("...", async ({ page }) => {
  test.setTimeout(180000); // 3 minutes
  // test code
});
```

### Page Navigation and Loading
- **Navigation**: `page.goto(url)` with timeout expectations
- **Waiting for navigation**: `page.waitForURL(regex, { timeout: 15000 })`
- **Element visibility**: `expect(element).toBeVisible({ timeout: 10000 })`
- **Role queries**: Prefer accessible queries like `page.getByRole("button", { name: /pattern/i })`

**Example**:
```typescript
await page.goto("/login");
const button = page.getByRole("button", { name: userName }).first();
await expect(button).toBeVisible({ timeout: 10000 });
await button.click();
```

### User Flows and Helper Functions
Helper functions encapsulate common user interactions:

**Login helper** (from `/Users/mattpaver/Desktop/QuickSupply/e2e/full-demo-flow.spec.ts`):
```typescript
async function quickLogin(page: Page, userName: RegExp) {
  await page.goto("/login");
  const button = page.getByRole("button", { name: userName }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
  await page.waitForURL(/\/(school|teacher|agency)\//, { timeout: 15000 });
}
```

**Sign out helper**:
```typescript
async function signOut(page: Page) {
  const signOutButton = page.getByRole("button", { name: /sign out/i }).first();
  await expect(signOutButton).toBeVisible({ timeout: 10000 });
  await signOutButton.click();
  await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });
}
```

### Form Interaction Patterns
1. **Text inputs**: `page.locator('input[type="..."]').nth(n).fill(value)`
2. **Select/combobox**:
   ```typescript
   await page.getByRole("combobox").nth(0).click();
   await page.getByRole("option", { name: "Option Name" }).click();
   ```
3. **Date picker**: `page.locator("button.rdp-day_button:not([disabled])").first().click()`
4. **Textareas**: `page.getByPlaceholder("...").fill(value)`
5. **Buttons**: `page.getByRole("button", { name: /pattern/i }).click()`

**Example** (from `/Users/mattpaver/Desktop/QuickSupply/e2e/full-demo-flow.spec.ts`):
```typescript
await page.getByRole("combobox").nth(0).click();
await page.getByRole("option", { name: "Teacher" }).click();

await page.locator('input[type="time"]').nth(0).fill("09:15");
await page.getByPlaceholder("Any special requirements...").fill(note);
```

### API Request Interception
Wait for and verify API responses inline:
```typescript
const createRequestResponse = page.waitForResponse(
  (res) => res.url().includes("/api/requests") && res.request().method() === "POST"
);
await page.getByRole("button", { name: /Submit/i }).click();
const response = await createRequestResponse;
expect(response.ok()).toBeTruthy();
const created = (await response.json()) as { id: string };
```

### Multi-Role Testing
Tests verify complete workflows across different user roles:
1. **School role**: Creates cover request
2. **Agency role**: Assigns teacher to request
3. **Teacher role**: Accepts offer
4. **All roles**: Verify request shows correct status

**Example flow** (from `full-demo-flow.spec.ts`):
```
School creates request → Agency assigns teacher → Teacher accepts → School sees filled
```

### Assertions and Expectations
- **URL assertions**: `expect(page).toHaveURL(/pattern/, { timeout: 10000 })`
- **Visibility**: `expect(element).toBeVisible({ timeout: 10000 })`
- **Element existence**: `expect(element).not.toBeVisible({ timeout: 10000 })`
- **Text content**: `expect(row).toContainText(/pending/i)`
- **Button states**: `expect(button).toBeEnabled()`
- **Page title**: `expect(page).toHaveTitle(/QuickSupply|Demo/)`
- **API responses**: `expect(response.ok()).toBeTruthy()`

### Locator Strategies
Preference order:
1. **Role-based**: `page.getByRole("button", { name: /pattern/i })`
2. **Placeholder/Label**: `page.getByPlaceholder()`, `page.getByLabel()`
3. **Text**: `page.getByText()` with regex for case-insensitive matching
4. **CSS selectors**: `page.locator("selector")` as fallback
5. **Chained locators**: `page.locator("div").filter({ hasText: "text" }).first()`

**Complex example**:
```typescript
const targetOffer = page
  .locator("div")
  .filter({ hasText: "St. Mary's Catholic Primary" })
  .filter({ hasText: `${startTime} - ${endTime}` })
  .first();
```

---

## Coverage

### What's Tested

#### Smoke Tests (`smoke.spec.ts`)
**File**: `/Users/mattpaver/Desktop/QuickSupply/e2e/smoke.spec.ts`

1. **Landing and login page load**
   - Verifies homepage loads
   - Confirms login page displays correctly
   - Checks page title

2. **Teacher login and dashboard**
   - Quick login with demo user (Sarah Johnson)
   - Dashboard URL validation
   - Verifies main content loads without hydration errors

3. **School login and dashboard**
   - Quick login with demo user (St. Mary's Catholic Primary)
   - School dashboard URL validation
   - Confirms main content visibility

4. **Agency login and dashboard**
   - Quick login with demo user (Sarah Mitchell)
   - Agency dashboard URL validation
   - Confirms main content visibility

#### Full Demo Flow Tests (`full-demo-flow.spec.ts`)
**File**: `/Users/mattpaver/Desktop/QuickSupply/e2e/full-demo-flow.spec.ts`

**Single comprehensive test** covering complete user journey:
1. **School creates request**
   - Navigates to new request form
   - Selects date via calendar picker
   - Selects role (Teacher) via combobox
   - Selects key stage (Year 4) via combobox
   - Fills start time (09:15) and end time (14:45)
   - Adds note for tracking
   - Submits request via POST API call
   - Verifies API response and extracts request ID
   - Confirms request appears in school's request list with pending status

2. **Agency assigns teacher**
   - Logs in as agency staff
   - Navigates to specific request details page
   - Assigns teacher (Sarah Johnson) via button click or API call
   - Verifies "Withdraw offer" button appears

3. **Teacher accepts offer**
   - Logs in as teacher (Sarah Johnson)
   - Navigates to jobs/offers page
   - Locates specific offer by school name and time
   - Clicks accept button
   - Confirms acceptance in dialog
   - Waits for dialog to close

4. **Status verification across all roles**
   - **Agency**: Verifies request shows "Filled" status and displays "Current Booking" with teacher name
   - **School**: Verifies request shows "Filled" status in their request list

### What's Not Tested

#### Intentionally Not Covered
- **UI edge cases**: Form validation errors, network timeouts, database failures
- **Individual component behavior**: Component unit tests (tests are E2E only)
- **API endpoint testing**: Direct API testing separate from UI flows
- **Performance testing**: Load testing, response time benchmarks
- **Visual regression**: Screenshot comparisons
- **Accessibility**: WCAG compliance testing (beyond role-based queries)
- **Mobile responsive**: Only desktop Chrome tested
- **Multi-browser**: Only Chromium, not Firefox/Safari
- **Authentication edge cases**: Session expiry, invalid tokens
- **Rate limiting**: API rate limit enforcement
- **Real email sending**: Email notifications not tested
- **Database transactions**: Concurrent request handling

#### Smoke Test Coverage Gaps
- No negative path testing (invalid credentials, wrong role)
- No error state verification
- No partial form completion
- No network failure recovery
- No data persistence across sessions

#### Full Demo Flow Coverage Gaps
- No offer expiration
- No declined offers
- No multiple offers on same request
- No teacher unavailability handling
- No distance/location filtering
- No preference matching
- No compliance status checks
- No emergency request handling
- No SMS notifications

---

## Running Tests

### Commands

**Run all tests (headless)**:
```bash
pnpm e2e
```
- Runs all tests in `./e2e/` directory
- Executes against `http://localhost:3000` (or `BASE_URL` if set)
- Auto-starts dev server if not running
- Generates HTML report in `/playwright-report/`

**Run tests with UI (interactive)**:
```bash
pnpm e2e:ui
```
- Opens Playwright Test UI in browser
- Step-through debugging
- Inspect locators
- Rerun individual tests
- Visual mode for watching tests execute

**Run specific test file**:
```bash
pnpm e2e smoke.spec.ts
```

**Run tests against deployed app**:
```bash
BASE_URL=https://staging.example.com pnpm e2e
```

**Check route health** (custom script):
```bash
pnpm e2e:routes
```
- Validates all routes are accessible
- Checks API endpoints
- File: `/Users/mattpaver/Desktop/QuickSupply/scripts/e2e-check-routes.mjs`

### Environment Setup

**Prerequisites**:
1. Node.js (v18+) with pnpm
2. Running dev server OR CI environment variable set
3. Seeded database with test data
4. Cookie consent configured (handled by test setup)

**Database Seeding**:
```bash
pnpm setup              # Migrate and seed
pnpm db:seed            # Seed test data
pnpm db:seed-demo       # Seed demo users for smoke tests
pnpm db:clear-requests  # Clear requests without resetting users
```

**Environment Variables** for E2E:
- `BASE_URL`: Override localhost (default: `http://localhost:3000`)
- `CI`: Set in GitHub Actions to disable server auto-start and adjust retries
- No specific env file needed (config in `playwright.config.ts`)

### Test Execution Flow

1. **Setup phase**:
   - Check if `NODE_ENV=CI` to adjust configuration
   - Start dev server if not running (dev only)
   - Wait for server health check (60s timeout)

2. **Test execution**:
   - Create browser context per test
   - Add cookie consent for all tests
   - Execute test steps with timeouts
   - Capture trace on first retry (CI only)

3. **Report generation**:
   - Collect screenshots and video (if enabled)
   - Generate HTML report
   - Report available at `/playwright-report/index.html`

4. **Failure handling**:
   - Retry up to 2 times in CI
   - Capture trace for debugging
   - No retries in local development

### Debugging Failed Tests

**HTML Report**:
```bash
pnpm e2e
# View report
open playwright-report/index.html
```

**Interactive Debug Mode**:
```bash
PWDEBUG=1 pnpm e2e
# or
pnpm e2e:ui
```

**Verbose Logging**:
```bash
DEBUG=pw:api pnpm e2e
```

**Traces**:
- Automatically captured on first retry in CI
- Located in test-results/
- Open via Playwright Inspector

### CI Integration

**GitHub Actions** (assumed):
- Runs with `process.env.CI = true`
- Single worker (serial execution)
- 2 retries on failure
- No server auto-start (must be provided by action)
- HTML report artifacts preserved
- Failed test traces captured

### Best Practices for Adding Tests

1. **Use role-based locators**: `getByRole()` over CSS selectors
2. **Add reasonable timeouts**: 10-15s for element visibility
3. **Wait for navigation**: Use `page.waitForURL()` after actions that navigate
4. **Extract helper functions**: Reuse common flows like login/logout
5. **Add descriptive test names**: Include the user role and action
6. **Set test timeout for long flows**: `test.setTimeout(180000)`
7. **Verify in multiple places**: Check both API response and UI state
8. **Clean up state**: Use signOut() or reload between multi-role tests
9. **Avoid hard-coded timeouts**: Use Playwright's built-in waits
10. **Test complete flows**: Include setup, action, and verification steps

---

## Performance Considerations

### Test Execution Time
- **Smoke tests**: ~30-45 seconds total (3 logins + page loads)
- **Full demo flow**: ~60-90 seconds (multi-role, multiple form interactions)
- **Total suite**: ~2-3 minutes headless, ~5-10 minutes with UI

### Optimization Tips
- Reuse pages/contexts where possible (not done currently - each test fresh)
- Parallel test execution (currently enabled in dev, serial in CI)
- Use `waitForURL()` instead of fixed delays
- Leverage `reuseExistingServer` for faster development

---

## Known Limitations

1. **Demo mode only**: Tests hardcoded to demo users, not data-driven
2. **No API-only tests**: All tests go through UI
3. **Single browser**: Only Chromium tested
4. **Fixed test data**: Assumes specific demo seed in database
5. **No flakiness mitigation**: Beyond Playwright's built-in retries
6. **Verbose waits**: Multiple timeout specifications could be centralized
7. **No custom reporters**: Standard HTML only
