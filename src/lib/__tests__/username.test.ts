import { describe, expect, test } from "bun:test";
import { generateSuggestions, isEmailIdentifier, statusMessage, usernameFormatError } from "@/lib/username";

describe("usernameFormatError", () => {
  test("accepts valid handles", () => {
    for (const v of ["abc", "Dew_Seeker9", "a".repeat(20)]) expect(usernameFormatError(v)).toBeNull();
  });
  test("rejects bad shapes", () => {
    expect(usernameFormatError("")).toBeTruthy();
    expect(usernameFormatError("ab")).toContain("at least 3");
    expect(usernameFormatError("a".repeat(21))).toContain("20");
    expect(usernameFormatError("no spaces")).toContain("letters");
    expect(usernameFormatError("émoji!")).toContain("letters");
  });
  test("reserves glow_ and staff-like names", () => {
    expect(usernameFormatError("glow_abc123")).toContain("reserved");
    expect(usernameFormatError("GLOW_x")).toContain("reserved");
    expect(usernameFormatError("Admin")).toContain("reserved");
    expect(usernameFormatError("skinlabs")).toContain("reserved");
  });
});

describe("identifier + messages", () => {
  test("emails go straight to password sign-in, usernames are looked up", () => {
    expect(isEmailIdentifier("a@b.co")).toBe(true);
    expect(isEmailIdentifier("glowseeker")).toBe(false);
  });
  test("status copy", () => {
    expect(statusMessage("available", "zed")).toBe("zed is available.");
    expect(statusMessage("taken", "zed")).toBe("zed is already taken.");
  });
});

describe("generateSuggestions", () => {
  const seeded = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  test("builds valid, unique ideas from the member's own details", () => {
    const out = generateSuggestions({ fullName: "Thandi Nkosi", email: "thandi.n@example.com" }, { random: seeded(3) });
    expect(out).toHaveLength(8);
    expect(new Set(out.map((s) => s.toLowerCase())).size).toBe(out.length);
    for (const s of out) expect(usernameFormatError(s)).toBeNull();
    expect(out).toContain("thandinkosi");
  });
  test("falls back to generated ideas with no details, never glow_", () => {
    const out = generateSuggestions({}, { random: seeded(9) });
    expect(out).toHaveLength(8);
    expect(out.some((s) => /^glow_/i.test(s))).toBe(false);
  });
  test("uses what is being typed", () => {
    expect(generateSuggestions({ typed: "Zola!" }, { random: seeded(1) })[0]).toBe("zola");
  });
});
