import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for QuickSupply.
 *
 * Locally, Playwright builds and starts the app on port 3200 (as CI does) against a throwaway,
 * freshly seeded demo database with demo mode on (as CI does), so your
 * .env.local and database are never used or modified. Set BASE_URL to test a
 * server you started yourself or a deployed app.
 * @see https://playwright.dev/docs/test-configuration
 */
const E2E_PORT = 3200;
const E2E_DB = "/tmp/quicksupply-e2e.db";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${E2E_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer:
    process.env.CI || process.env.BASE_URL
      ? undefined
      : {
          command: `rm -f ${E2E_DB} && corepack pnpm db:migrate && corepack pnpm db:seed && corepack pnpm build && corepack pnpm exec next start -p ${E2E_PORT}`,
          url: `http://localhost:${E2E_PORT}`,
          reuseExistingServer: false,
          timeout: 300_000,
          env: {
            DATABASE_URL: E2E_DB,
            DEMO_MODE: "true",
            NEXT_PUBLIC_DEMO_MODE: "true",
          },
        },
});
