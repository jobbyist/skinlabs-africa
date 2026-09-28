import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end journeys for the onboarding & conversion overhaul (prompt 12).
 * They run against a production build (`npm run build` or `npx vite build`)
 * served by `vite preview`, with Supabase mocked per test (e2e/support/
 * mockSupabase.ts) — no real accounts, payments or emails. Specs end in
 * `.e2e.ts` so `bun test` never picks them up.
 *
 *   npx vite build && npx playwright test
 *
 * PLAYWRIGHT_CHROMIUM_PATH points at a preinstalled Chromium (e.g. the
 * Claude Code sandbox's /opt/pw-browsers/chromium); CI runs
 * `npx playwright install chromium` instead.
 */
const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ["--no-proxy-server"] }
  : { args: ["--no-proxy-server"] };

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions,
  },
  projects: [
    { name: "desktop-light", use: { ...devices["Desktop Chrome"], colorScheme: "light", launchOptions } },
    { name: "desktop-dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark", launchOptions } },
    { name: "mobile-light", use: { ...devices["Pixel 7"], colorScheme: "light", launchOptions } },
    { name: "mobile-dark", use: { ...devices["Pixel 7"], colorScheme: "dark", launchOptions } },
  ],
  webServer: {
    command: "npx vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
