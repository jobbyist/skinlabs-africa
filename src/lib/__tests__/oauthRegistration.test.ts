import { describe, expect, test } from "bun:test";
import { shouldTrackOAuthRegistration } from "../oauthRegistration";
import { NEW_ACCOUNT_WINDOW_MS } from "../intentRouting";

const NOW = Date.UTC(2026, 9, 3, 12, 0, 0);
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
const base = { provider: "google", createdAt: iso(30_000), alreadyTracked: false, now: NOW };

describe("shouldTrackOAuthRegistration", () => {
  test("counts a brand-new Google account", () => {
    expect(shouldTrackOAuthRegistration(base)).toBe(true);
  });
  test("never counts an email account (AuthDialog already fires for those)", () => {
    expect(shouldTrackOAuthRegistration({ ...base, provider: "email" })).toBe(false);
    expect(shouldTrackOAuthRegistration({ ...base, provider: undefined })).toBe(false);
  });
  test("never counts a returning Google member", () => {
    expect(shouldTrackOAuthRegistration({ ...base, createdAt: iso(NEW_ACCOUNT_WINDOW_MS + 1) })).toBe(false);
    expect(shouldTrackOAuthRegistration({ ...base, createdAt: iso(NEW_ACCOUNT_WINDOW_MS - 1) })).toBe(true);
  });
  test("counts once per account", () => {
    expect(shouldTrackOAuthRegistration({ ...base, alreadyTracked: true })).toBe(false);
  });
  test("rejects missing, invalid or future creation dates", () => {
    expect(shouldTrackOAuthRegistration({ ...base, createdAt: null })).toBe(false);
    expect(shouldTrackOAuthRegistration({ ...base, createdAt: "not a date" })).toBe(false);
    expect(shouldTrackOAuthRegistration({ ...base, createdAt: iso(-60_000) })).toBe(false);
  });
});
