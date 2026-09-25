import { describe, expect, test } from "bun:test";
import { NEW_ACCOUNT_WINDOW_MS, WELCOME_PATH, isNewAccount, shouldRedirectNewAccount, trialDestination } from "../intentRouting";

const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("isNewAccount", () => {
  test("new when created under 10 minutes ago and onboarding not completed", () => {
    expect(isNewAccount(ago(60_000), null, NOW)).toBe(true);
    expect(isNewAccount(ago(NEW_ACCOUNT_WINDOW_MS - 1), undefined, NOW)).toBe(true);
  });

  test("not new at or after the 10-minute mark", () => {
    expect(isNewAccount(ago(NEW_ACCOUNT_WINDOW_MS), null, NOW)).toBe(false);
    expect(isNewAccount(ago(24 * 60 * 60_000), null, NOW)).toBe(false);
  });

  test("not new once onboarding is completed", () => {
    expect(isNewAccount(ago(60_000), ago(30_000), NOW)).toBe(false);
  });

  test("not new with a missing, invalid or future created_at", () => {
    expect(isNewAccount(null, null, NOW)).toBe(false);
    expect(isNewAccount("not-a-date", null, NOW)).toBe(false);
    expect(isNewAccount(new Date(NOW + 60_000).toISOString(), null, NOW)).toBe(false);
  });
});

describe("shouldRedirectNewAccount", () => {
  test("never pulls a new member away from where they already are or are mid-flow", () => {
    for (const path of ["/dashboard", "/welcome", "/reset-password", "/admin", "/skynn-ai", "/skynn-ai/advanced"]) {
      expect(shouldRedirectNewAccount(path)).toBe(false);
    }
  });

  test("redirects from ordinary pages", () => {
    for (const path of ["/", "/pricing", "/briefings", "/reviews/some-serum", "/dashboardish"]) {
      expect(shouldRedirectNewAccount(path)).toBe(true);
    }
  });

  test("welcome path is /dashboard until prompt 07 ships /welcome", () => {
    expect(WELCOME_PATH).toBe("/dashboard");
  });
});

describe("trialDestination", () => {
  test("returns to the page the visitor came from, e.g. an unlocked review", () => {
    expect(trialDestination("/reviews/some-serum")).toBe("/reviews/some-serum");
    expect(trialDestination("/podcast/ep-3?t=120")).toBe("/podcast/ep-3?t=120");
  });

  test("pricing or home goes to the dashboard trial welcome", () => {
    expect(trialDestination("/pricing")).toBe("/dashboard?trial=started");
    expect(trialDestination("/pricing?interval=annual")).toBe("/dashboard?trial=started");
    expect(trialDestination("/")).toBe("/dashboard?trial=started");
  });
});
