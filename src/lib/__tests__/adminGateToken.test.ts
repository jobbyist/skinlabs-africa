import { describe, expect, test } from "bun:test";
import { clearGateCookieHeaders, gateCookieHeader, mintGateToken, readGateCookie, verifyGateToken } from "../../../api/_lib/adminGateToken";

describe("admin gate token", () => {
  const secret = "s3cret";
  test("a fresh token verifies; a wrong secret, tamper or expiry does not", () => {
    const now = 1_000_000;
    const t = mintGateToken(secret, now);
    expect(verifyGateToken(secret, t, now + 1000)).toBe(true);
    expect(verifyGateToken("other", t, now + 1000)).toBe(false);
    expect(verifyGateToken(secret, t.replace(/^\d+/, "99999999999999"), now + 1000)).toBe(false);
    expect(verifyGateToken(secret, t, now + 13 * 3600 * 1000)).toBe(false);
    expect(verifyGateToken(secret, "garbage")).toBe(false);
    expect(verifyGateToken(secret, null)).toBe(false);
  });
  test("the cookie is sent to /api/* (Path=/) and the legacy /admin cookie is cleared too", () => {
    expect(gateCookieHeader("x", true)).toContain("Path=/;");
    expect(gateCookieHeader("x", true)).toContain("Secure");
    expect(clearGateCookieHeaders(false).some((h) => h.includes("Path=/admin"))).toBe(true);
  });
  test("reads the cookie and survives a malformed value", () => {
    expect(readGateCookie({ headers: { cookie: "a=1; skinlabs_admin_gate=abc%2E123" } })).toBe("abc.123");
    expect(readGateCookie({ headers: { cookie: "skinlabs_admin_gate=%E0%A4%A" } })).toBeNull();
  });
});
